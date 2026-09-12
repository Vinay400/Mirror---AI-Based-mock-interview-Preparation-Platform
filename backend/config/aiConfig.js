import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = (process.env.Gemini_API_Key || process.env.GEMINI_API_KEY || "").trim();

if (!apiKey) {
  console.warn("⚠️ WARNING: Gemini API Key is missing in environment variables (Gemini_API_Key).");
}

export const ai = new GoogleGenAI({ apiKey });