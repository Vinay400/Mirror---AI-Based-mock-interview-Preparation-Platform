import express from "express";
import Interview from "../models/Interview.js";
import {generateQuestions, evaluateAnswers} from '../services/aiService.js'
import { uploadAudioToCloudinary } from "../services/cloudinaryService.js"
import { transcribeAudio } from "../services/speechService.js";
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
    const questions = await generateQuestions(jobRole, experienceLevel, interviewType, difficulty, numQuestions, interviewType, additionalSkills);
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

  // Prepare data for Gemini
  const questionsToEvaluate = interview.questions.map((q) => ({
    question: q.question,
    rawTranscript: q.transcriptRaw || "",
  }));

  // Call Gemini
  const evaluationRaw = await evaluateAnswers(
    interview.jobRole,
    interview.experienceLevel,
    questionsToEvaluate
  );

  let evaluation;

  try {
    evaluation = JSON.parse(evaluationRaw);
  } catch (parseErr) {
    console.error("JSON Parse Error:", parseErr);

    return res.status(500).json({
      message: "Failed to parse AI evaluation.",
      error: parseErr.message,
      raw: evaluationRaw,
    });
  }

  // Update interview questions
  interview.questions.forEach((q, index) => {
    const evalItem = evaluation.questions?.[index];

    if (!evalItem) return;

    q.transcriptCorrected =
      evalItem.correctedTranscript || q.transcriptRaw;

    q.feedback =
      evalItem.feedback || "No feedback generated.";

    q.score =
      typeof evalItem.score === "number"
        ? evalItem.score
        : 0;
  });

  interview.overallScore =
    typeof evaluation.overallScore === "number"
      ? evaluation.overallScore
      : 0;

  interview.status = "Completed";

  await interview.save();

  res.status(200).json(interview);

} catch (err) {
  console.error("submitInterview Error:", err);

  res.status(500).json({
    message: err.message,
  });
}
}

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
    const { interviewId, questionId } = req.body;
    console.log(interviewId);
    console.log(questionId);
    const result = await uploadAudioToCloudinary(req.file.buffer);
    console.log(result.format);

    const transcript = await transcribeAudio(
      result.secure_url,
      interviewId,
      questionId
    )

    const interview = await Interview.findById(interviewId);

    if(!interview) {
      return res.status(404).json({
        message: "Interview not found",
      })
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
      duration: result.duration,
      format: result.format,
    };
    await interview.save();
     res.status(200).json({
      success: true,
      "transcript": transcript,
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
