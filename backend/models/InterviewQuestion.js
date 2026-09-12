import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["Technical", "HR", "Mixed"],
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
      index: true,
    },
    type: {
      type: String,
      enum: ["Technical", "Coding", "HR"],
      default: "Technical",
    },
    evaluationType: {
      type: String,
      enum: ["spoken", "judge0", "framework"],
      default: "spoken",
    },
    framework: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "cpp",
    },
    starterCode: {
      type: String,
      default: "",
    },
    referenceSolution: {
      type: String,
      default: "",
    },
    testInputs: {
      type: [String],
      default: [],
    },
    idealAnswer: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("InterviewQuestion", interviewQuestionSchema);
