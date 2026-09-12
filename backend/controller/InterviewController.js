import express from "express";
import mongoose from "mongoose";
import Interview from "../models/Interview.js";
import InterviewPreset from "../models/InterviewPreset.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import { generateQuestions, evaluateAnswers } from "../services/aiService.js";
import { uploadAudioToCloudinary } from "../services/cloudinaryService.js";
import { transcribeAudio } from "../services/speechService.js";
import { executeCodeForInput } from "../services/judge0Service.js";
import {
  calculateQuestionAnalytics,
  calculateInterviewAnalytics,
} from "../utils/speakingAnalytics.js";

// Helper function to sanitize interview response for candidate frontend
function sanitizeInterviewForCandidate(interviewDoc) {
  if (!interviewDoc) return null;
  const obj = interviewDoc.toObject ? interviewDoc.toObject() : JSON.parse(JSON.stringify(interviewDoc));
  
  if (Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map((q) => {
      // NEVER expose referenceSolution to candidate
      delete q.referenceSolution;

      if (Array.isArray(q.testCases)) {
        // Expose visible test cases
        q.visibleTestCases = q.testCases
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            _id: tc._id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: false,
          }));

        // Sanitize testCases so hidden inputs & expected outputs are removed
        q.testCases = q.testCases.map((tc) => {
          if (tc.isHidden) {
            return {
              _id: tc._id,
              isHidden: true,
            };
          }
          return {
            _id: tc._id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: false,
          };
        });
      }
      return q;
    });
  }
  return obj;
}

const startInterview = async (req, res) => {
  try {
    const {
      jobRole,
      experienceLevel,
      difficulty,
      interviewType,
      numQuestions,
      additionalSkills,
    } = req.body;

    const interview = await Interview.create({
      user: req.user._id,
      jobRole,
      experienceLevel,
      difficulty,
      interviewType,
      numQuestions,
      additionalSkills,
    });

    console.log("Created interview instance:", interview._id);
    const questionsRaw = await generateQuestions(
      jobRole,
      experienceLevel,
      difficulty,
      numQuestions,
      interviewType,
      additionalSkills
    );

    let cleanJsonText = (questionsRaw || "").trim();
    if (cleanJsonText.startsWith("```json")) {
      cleanJsonText = cleanJsonText.slice(7);
    } else if (cleanJsonText.startsWith("```")) {
      cleanJsonText = cleanJsonText.slice(3);
    }
    if (cleanJsonText.endsWith("```")) {
      cleanJsonText = cleanJsonText.slice(0, -3);
    }
    cleanJsonText = cleanJsonText.trim();

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      console.error("JSON Parse Error on questions:", parseErr);
      return res.status(500).json({
        message: "Failed to parse generated questions.",
        error: parseErr.message,
      });
    }

    const processedQuestions = [];

    for (const q of parsedQuestions) {
      let qType = "Technical";
      const qText = (q.question || "").toLowerCase();
      const isCodingText = [
        "write a ", "write function", "write code", "write react", "write component",
        "write program", "write script", "write algorithm", "write query", "write sql",
        "implement ", "create a function", "create a react", "create a component",
        "build a component", "code a ", "code that", "function that", "passed as a prop",
        "given an array", "given a string", "functional component"
      ].some(kw => qText.includes(kw));

      if (q.type) {
        const lower = q.type.toLowerCase();
        if (lower === "coding" || isCodingText) qType = "Coding";
        else if (lower === "hr") qType = "HR";
        else qType = "Technical";
      } else if (isCodingText) {
        qType = "Coding";
      }

      const evalType = (q.evaluationType || "").toLowerCase() === "framework" || q.framework ? "framework" : (qType === "Coding" ? "judge0" : "spoken");
      const frameworkVal = q.framework || "";

      const questionObj = {
        question: q.question,
        type: qType,
        topic: q.topic || "",
        evaluationType: evalType,
        framework: frameworkVal,
        language: q.language || (frameworkVal === "flutter" ? "dart" : frameworkVal === "swift" ? "swift" : "cpp"),
        starterCode: q.starterCode || "",
      };

      const refSol = q.referenceSolution || q.reference_solution || q.solution || "";
      const rawInputs = Array.isArray(q.testInputs) && q.testInputs.length > 0
        ? q.testInputs
        : (Array.isArray(q.test_inputs) && q.test_inputs.length > 0 ? q.test_inputs : ["0", "1", "2", "5", "10", "15", "20"]);

      // Execute Judge0 test-case generation ONLY for executable judge0 coding questions
      if (qType === "Coding" && evalType === "judge0") {
        if (refSol) {
          questionObj.referenceSolution = refSol;
        }
        const validTestCases = [];

        console.log(`Executing reference solution for judge0 coding question "${q.question}"...`);

        if (refSol) {
          for (const rawInput of rawInputs) {
            const inputStr = typeof rawInput === "string" ? rawInput.trim() : String(rawInput || "").trim();
            if (!inputStr && inputStr !== "0") continue;

            try {
              const execResult = await executeCodeForInput({
                sourceCode: refSol,
                language: q.language || "cpp",
                stdin: inputStr,
              });

              if (execResult && execResult.status?.id === 3) {
                validTestCases.push({
                  input: inputStr,
                  expectedOutput: execResult.stdout || "",
                  isHidden: true,
                });
              } else {
                console.warn(
                  `Reference solution execution skipped for input "${inputStr.slice(0, 30)}...":`,
                  execResult?.status?.description || execResult?.stderr
                );
              }
            } catch (execErr) {
              console.error("Error executing reference solution via Judge0:", execErr.message);
            }
          }
        }

        // Assign first ~2 as visible (isHidden: false) and rest as hidden (isHidden: true)
        validTestCases.forEach((tc, idx) => {
          tc.isHidden = idx >= 2;
        });

        questionObj.testCases = validTestCases;
      }

      processedQuestions.push(questionObj);
    }

    interview.questions = processedQuestions;
    await interview.save();

    res.status(201).json(sanitizeInterviewForCandidate(interview));
  } catch (err) {
    console.error("startInterview Error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        message: "Interview Not Found!",
      });
    }
    res.json(sanitizeInterviewForCandidate(interview));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const submitInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview Not Found!",
      });
    }

    if (req.body && req.body.codeAnswers) {
      Object.keys(req.body.codeAnswers).forEach((qId) => {
        const q = interview.questions.id(qId);
        if (q) {
          if (req.body.codeAnswers[qId].userCode !== undefined) {
            q.userCode = req.body.codeAnswers[qId].userCode;
          }
          if (req.body.codeAnswers[qId].language !== undefined) {
            q.language = req.body.codeAnswers[qId].language;
          }
        }
      });
    }

    // Build array of questions with stable MongoDB _id as id
    const questionsAndAnswers = interview.questions.map((q) => ({
      id: q._id.toString(),
      question: q.question,
      type: q.type || "Technical",
      evaluationType: q.evaluationType || "judge0",
      framework: q.framework || "",
      rawTranscript: q.transcriptRaw || "",
      userCode: q.userCode || "",
      language: q.language || "cpp",
      codingEvaluation: q.codingEvaluation || null,
      frameworkEvaluation: q.frameworkEvaluation || null,
    }));

    // Single Gemini evaluation request for the entire interview
    const evaluationRaw = await evaluateAnswers(
      interview.jobRole,
      interview.experienceLevel,
      questionsAndAnswers
    );

    let evaluation;
    let cleanJsonText = (evaluationRaw || "").trim();

    if (cleanJsonText.startsWith("```json")) {
      cleanJsonText = cleanJsonText.slice(7);
    } else if (cleanJsonText.startsWith("```")) {
      cleanJsonText = cleanJsonText.slice(3);
    }
    if (cleanJsonText.endsWith("```")) {
      cleanJsonText = cleanJsonText.slice(0, -3);
    }
    cleanJsonText = cleanJsonText.trim();

    try {
      evaluation = JSON.parse(cleanJsonText);
      console.log("Parsed Evaluation Communication:", evaluation.communication);
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr);

      return res.status(500).json({
        message: "Failed to parse AI evaluation.",
        error: parseErr.message,
        raw: evaluationRaw,
      });
    }

    // Build lookup Map from Gemini response using question id
    const evalMap = new Map();
    if (Array.isArray(evaluation.questions)) {
      evaluation.questions.forEach((item) => {
        if (item && item.id !== undefined && item.id !== null) {
          evalMap.set(String(item.id), item);
        }
      });
    }

    const questionAnalyticsList = [];

    // Save per-question evaluations & compute speaking analytics
    interview.questions.forEach((q, index) => {
      const qIdStr = q._id.toString();
      const evalItem = evalMap.get(qIdStr) || evaluation.questions?.[index];

      if (!evalItem) return;

      const correctedText = evalItem.correctedTranscript || q.transcriptRaw || "";
      q.transcriptCorrected = correctedText;
      q.answer = correctedText;

      q.feedback = evalItem.feedback || "No feedback generated.";

      // Score assignment:
      // 1. If framework question and frameworkEvaluation score exists, use that
      // 2. If judge0 coding question and codingEvaluation score exists, use that
      // 3. Otherwise, use overall question score from Gemini evaluation item
      if (q.evaluationType === "framework" && q.frameworkEvaluation && typeof q.frameworkEvaluation.score === "number" && q.frameworkEvaluation.score > 0) {
        q.score = q.frameworkEvaluation.score;
        if (q.frameworkEvaluation.feedback) {
          q.feedback = q.frameworkEvaluation.feedback;
        }
      } else if (q.type === "Coding" && q.codingEvaluation && typeof q.codingEvaluation.score === "number") {
        q.score = q.codingEvaluation.score;
      } else {
        q.score = typeof evalItem.score === "number" ? evalItem.score : 0;
      }

      q.topic = evalItem.topic || "General";
      q.transcriptConfidence =
        typeof evalItem.transcriptConfidence === "number"
          ? evalItem.transcriptConfidence
          : 10;
      q.idealAnswer = evalItem.idealAnswer || "";
      q.missedConcepts = Array.isArray(evalItem.missedConcepts)
        ? evalItem.missedConcepts
        : [];

      // SECTION 2: Per-question Language & Communication Evaluation
      const commItem = evalItem.communication || {};
      q.communication = {
        grammar: typeof commItem.grammar === "number" ? commItem.grammar : undefined,
        clarity: typeof commItem.clarity === "number" ? commItem.clarity : undefined,
        structure: typeof commItem.structure === "number" ? commItem.structure : undefined,
        completeness: typeof commItem.completeness === "number" ? commItem.completeness : undefined,
        vocabulary: typeof commItem.vocabulary === "number" ? commItem.vocabulary : undefined,
      };

      // SECTION 3: Computed Speaking Analytics (Deterministic Calculation)
      const audioDuration = q.audio?.duration || q.speakingAnalytics?.duration || 0;
      const qAnalytics = calculateQuestionAnalytics(correctedText || q.transcriptRaw || "", audioDuration);
      q.speakingAnalytics = qAnalytics;
      questionAnalyticsList.push(qAnalytics);
    });

    interview.overallScore =
      typeof evaluation.overallScore === "number"
        ? evaluation.overallScore
        : 0;
    interview.technicalScore =
      typeof evaluation.technicalScore === "number"
        ? evaluation.technicalScore
        : 0;
    interview.problemSolvingScore =
      typeof evaluation.problemSolvingScore === "number"
        ? evaluation.problemSolvingScore
        : 0;
    interview.recommendation =
      evaluation.recommendation || "Needs Improvement";
    interview.summary = evaluation.summary || "";
    interview.strengths = Array.isArray(evaluation.strengths)
      ? evaluation.strengths
      : [];
    interview.improvementAreas = Array.isArray(evaluation.improvementAreas)
      ? evaluation.improvementAreas
      : [];
    interview.recommendedTopics = Array.isArray(evaluation.recommendedTopics)
      ? evaluation.recommendedTopics
      : [];

    // SECTION 2: Overall Language & Communication Evaluation
    const overallComm = evaluation.communication || {};
    interview.communication = {
      grammar: typeof overallComm.grammar === "number" ? overallComm.grammar : undefined,
      clarity: typeof overallComm.clarity === "number" ? overallComm.clarity : undefined,
      structure: typeof overallComm.structure === "number" ? overallComm.structure : undefined,
      completeness: typeof overallComm.completeness === "number" ? overallComm.completeness : undefined,
      vocabulary: typeof overallComm.vocabulary === "number" ? overallComm.vocabulary : undefined,
      summary: overallComm.summary || "",
    };

    // SECTION 3: Computed Overall Speaking Analytics
    const overallSpeaking = calculateInterviewAnalytics(questionAnalyticsList);
    interview.speakingAnalytics = overallSpeaking;

    interview.status = "Completed";

    await interview.save();

    res.status(200).json(sanitizeInterviewForCandidate(interview));
  } catch (err) {
    console.error("submitInterview Error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

const getUserInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(interviews.map(sanitizeInterviewForCandidate));
  } catch (error) {
    console.error("getUserInterviews Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const uploadAudio = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    const { interviewId, questionId, duration } = req.body;
    console.log("interviewId:", interviewId);
    console.log("questionId:", questionId);
    console.log("passed duration:", duration);
    const result = await uploadAudioToCloudinary(req.file.buffer);
    console.log("Cloudinary format:", result.format, "duration:", result.duration);

    const clientDuration = Number(duration);
    const audioDuration = !isNaN(clientDuration) && clientDuration > 0
      ? clientDuration
      : (Number(result.duration) || 0);

    const transcript = await transcribeAudio(
      result.secure_url,
      interviewId,
      questionId
    );

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }
    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }
    question.audio = {
      url: result.secure_url,
      publicId: result.public_id,
      duration: audioDuration,
      format: result.format,
    };
    question.speakingAnalytics = {
      ...question.speakingAnalytics,
      duration: audioDuration,
    };
    question.transcriptRaw = transcript;

    await interview.save();
    res.status(200).json({
      success: true,
      transcript: transcript,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

const getInterviewPresets = async (req, res) => {
  try {
    const presets = await InterviewPreset.find({ active: true }).sort({ createdAt: 1 });
    res.json(presets);
  } catch (error) {
    console.error("getInterviewPresets Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getQuestionBank = async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.mode) filter.mode = req.query.mode;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;

    const questions = await InterviewQuestion.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error("getQuestionBank Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const startCuratedInterview = async (req, res) => {
  try {
    const { presetId, presetSlug } = req.body;
    const identifier = presetId || presetSlug;

    if (!identifier) {
      return res.status(400).json({ message: "presetId or presetSlug is required." });
    }

    let preset = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      preset = await InterviewPreset.findById(identifier);
    }
    if (!preset) {
      preset = await InterviewPreset.findOne({ slug: identifier, active: true });
    }

    if (!preset || !preset.active) {
      return res.status(404).json({ message: "Interview preset not found or inactive." });
    }

    const targetCount = preset.questionCount || 4;
    const selectedQuestions = [];
    const selectedIds = new Set();

    // 1. Topic-balanced selection
    if (Array.isArray(preset.topics) && preset.topics.length > 0) {
      for (const topic of preset.topics) {
        if (selectedQuestions.length >= targetCount) break;
        const matching = await InterviewQuestion.aggregate([
          {
            $match: {
              active: true,
              topic: { $regex: new RegExp(topic, "i") },
              _id: { $nin: Array.from(selectedIds) },
            },
          },
          { $sample: { size: 1 } },
        ]);
        if (matching.length > 0) {
          selectedQuestions.push(matching[0]);
          selectedIds.add(matching[0]._id.toString());
        }
      }
    }

    // 2. Fallback: query matching role or mode
    if (selectedQuestions.length < targetCount) {
      const remainingCount = targetCount - selectedQuestions.length;
      const fallbackMatches = await InterviewQuestion.aggregate([
        {
          $match: {
            active: true,
            $or: [{ role: preset.role }, { mode: preset.mode }],
            _id: { $nin: Array.from(selectedIds) },
          },
        },
        { $sample: { size: remainingCount } },
      ]);
      for (const f of fallbackMatches) {
        selectedQuestions.push(f);
        selectedIds.add(f._id.toString());
      }
    }

    // 3. Final Fallback: any active questions
    if (selectedQuestions.length < targetCount) {
      const remainingCount = targetCount - selectedQuestions.length;
      const genericMatches = await InterviewQuestion.aggregate([
        {
          $match: {
            active: true,
            _id: { $nin: Array.from(selectedIds) },
          },
        },
        { $sample: { size: remainingCount } },
      ]);
      for (const g of genericMatches) {
        selectedQuestions.push(g);
        selectedIds.add(g._id.toString());
      }
    }

    if (selectedQuestions.length === 0) {
      return res.status(400).json({ message: "Not enough curated questions available for this interview." });
    }

    const processedQuestions = [];
    for (const q of selectedQuestions) {
      const evalType = q.evaluationType || (q.type === "Coding" ? "judge0" : "spoken");
      const questionObj = {
        question: q.question,
        type: q.type || "Technical",
        topic: q.topic || "General",
        evaluationType: evalType,
        framework: q.framework || "",
        language: q.language || "cpp",
        starterCode: q.starterCode || "",
      };

      const refSol = q.referenceSolution || "";
      const rawInputs = Array.isArray(q.testInputs) && q.testInputs.length > 0 ? q.testInputs : ["0", "1", "2", "5"];

      if (q.type === "Coding" && evalType === "judge0") {
        if (refSol) {
          questionObj.referenceSolution = refSol;
        }
        const validTestCases = [];
        if (refSol) {
          for (const rawInput of rawInputs) {
            const inputStr = typeof rawInput === "string" ? rawInput.trim() : String(rawInput || "").trim();
            if (!inputStr && inputStr !== "0") continue;
            try {
              const execResult = await executeCodeForInput({
                sourceCode: refSol,
                language: q.language || "cpp",
                stdin: inputStr,
              });
              if (execResult && execResult.status?.id === 3) {
                validTestCases.push({
                  input: inputStr,
                  expectedOutput: execResult.stdout || "",
                  isHidden: true,
                });
              }
            } catch (execErr) {
              console.error("Judge0 test case execution error:", execErr.message);
            }
          }
        }
        validTestCases.forEach((tc, idx) => {
          tc.isHidden = idx >= 2;
        });
        questionObj.testCases = validTestCases;
      }

      processedQuestions.push(questionObj);
    }

    const expLevel = preset.difficulty === "Easy" ? "Fresher" : preset.difficulty === "Hard" ? "5+ Years" : "1-3 Years";

    const interview = await Interview.create({
      user: req.user._id,
      jobRole: preset.role,
      experienceLevel: expLevel,
      difficulty: preset.difficulty,
      interviewType: preset.mode,
      numQuestions: processedQuestions.length,
      additionalSkills: Array.isArray(preset.topics) ? preset.topics.join(", ") : "",
      questions: processedQuestions,
    });

    console.log("Created curated interview instance:", interview._id);
    res.status(201).json(sanitizeInterviewForCandidate(interview));
  } catch (err) {
    console.error("startCuratedInterview Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export {
  startInterview,
  getInterviewById,
  submitInterview,
  getUserInterviews,
  uploadAudio,
  getInterviewPresets,
  getQuestionBank,
  startCuratedInterview,
};
