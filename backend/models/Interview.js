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

        transcriptRaw: {
          type: String,
          default: "",
        },
        transcriptCorrected: {
          type: String,
          default: "",
        },
        answer: String,
        feedback: String,
        score: Number,

        audio: {
          url: String,
          publicId: String,
          duration: Number,
          format: String,
        },
      },
    ],

    overallScore: Number,
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);