import mongoose from "mongoose";

const interviewPresetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["Technical", "HR", "Mixed"],
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 45,
    },
    questionCount: {
      type: Number,
      default: 4,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    topics: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: "Recommended",
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

export default mongoose.model("InterviewPreset", interviewPresetSchema);
