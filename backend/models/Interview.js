import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobRole: {
      type: String,
      required: true,
    },

    experienceLevel: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      required: true,
    },

    interviewType: {
      type: String,
      required: true,
    },

    numQuestions: {
      type: Number,
      required: true,
    },

    additionalSkills: {
      type: String,
    },

    questions: [
      {
        question: String,
        topic: {
          type: String,
          default: "",
        },
        transcriptRaw: {
          type: String,
          default: "",
        },
        transcriptCorrected: {
          type: String,
          default: "",
        },
        transcriptConfidence: {
          type: Number,
          default: 0,
        },
        answer: String,
        feedback: String,
        score: {
          type: Number,
          default: 0,
        },
        idealAnswer: {
          type: String,
          default: "",
        },
        missedConcepts: {
          type: [String],
          default: [],
        },

        communication: {
          grammar: { type: Number },
          clarity: { type: Number },
          structure: { type: Number },
          completeness: { type: Number },
          vocabulary: { type: Number },
        },

        speakingAnalytics: {
          duration: { type: Number, default: 0 },
          wordCount: { type: Number, default: 0 },
          wordsPerMinute: { type: Number, default: 0 },
          pace: { type: String, default: "Slow" },
        },

        audio: {
          url: String,
          publicId: String,
          duration: Number,
          format: String,
        },
      },
    ],

    overallScore: {
      type: Number,
      default: 0,
    },
    technicalScore: {
      type: Number,
      default: 0,
    },
    problemSolvingScore: {
      type: Number,
      default: 0,
    },
    recommendation: {
      type: String,
      default: "Needs Improvement",
    },
    summary: {
      type: String,
      default: "",
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvementAreas: {
      type: [String],
      default: [],
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },

    communication: {
      grammar: { type: Number },
      clarity: { type: Number },
      structure: { type: Number },
      completeness: { type: Number },
      vocabulary: { type: Number },
      summary: { type: String, default: "" },
    },

    speakingAnalytics: {
      totalSpeakingTime: { type: Number, default: 0 },
      totalWordCount: { type: Number, default: 0 },
      averageWordsPerMinute: { type: Number, default: 0 },
      overallPace: { type: String, default: "Slow" },
    },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);