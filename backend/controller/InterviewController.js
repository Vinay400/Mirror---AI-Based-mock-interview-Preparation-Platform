import express from "express";
import Interview from "../models/Interview.js";
import {generateQuestions, evaluateAnswers} from '../services/aiService.js'
import { uploadAudioToCloudinary } from "../services/cloudinaryService.js"
import { transcribeAudio } from "../services/speechService.js";
import {
  calculateQuestionAnalytics,
  calculateInterviewAnalytics,
} from "../utils/speakingAnalytics.js";
const startInterview = async (req, res) => {
  try{
    const { jobRole,
            experienceLevel,
            difficulty,
            interviewType,
            numQuestions,
            additionalSkills  } = req.body;
    const interview = await Interview.create({
        user: req.user._id,
        jobRole,
        experienceLevel,
        difficulty,
        interviewType,
        numQuestions,
        additionalSkills
    });
    console.log(interview);
    const questions = await generateQuestions(
      jobRole,
      experienceLevel,
      difficulty,
      numQuestions,
      interviewType,
      additionalSkills
    );
    console.log("Raw generated questions:", questions);

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (parseErr) {
      console.error("JSON Parse Error on questions:", parseErr);
      return res.status(500).json({ message: "Failed to parse generated questions.", error: parseErr.message });
    }

    interview.questions = parsedQuestions.map(q => ({
      question: q.question
    }));
    await interview.save();

    res.status(201).json(interview);
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
    res.json(interview);
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

    // Build array of questions with stable MongoDB _id as id
    const questionsAndAnswers = interview.questions.map((q) => ({
      id: q._id.toString(),
      question: q.question,
      rawTranscript: q.transcriptRaw || "",
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
      q.score = typeof evalItem.score === "number" ? evalItem.score : 0;
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

    // SECTION 1: Technical Evaluation Metrics
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

    res.status(200).json(interview);
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
    res.json(interviews);
  } catch (error) {
    console.error("getUserInterviews Error:", error);
    res.status(500).json({ message: error.message });
  }
};
const uploadAudio = async (req, res) => {
  try{
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

    if(!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }
    const question = interview.questions.id(questionId);

    if(!question){
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
  }  catch(err){
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
export { startInterview, getInterviewById, submitInterview, getUserInterviews, uploadAudio };
