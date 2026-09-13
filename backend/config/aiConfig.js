import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const apiKey = (
  process.env.GEMINI_API_KEY ||
  process.env.Gemini_API_Key ||
  process.env.GEMINI_KEY ||
  ""
).trim();

if (!apiKey || apiKey.includes("your_gemini_api_key")) {
  console.warn("⚠️ WARNING: Gemini API Key is missing in environment variables (GEMINI_API_KEY / Gemini_API_Key).");
} else if (!apiKey.startsWith("AIza") && !apiKey.startsWith("AQ")) {
  console.warn("⚠️ WARNING: Gemini API Key format appears unexpected. Standard Google AI Studio keys start with 'AIza...' or 'AQ...'. Please verify your environment variable.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });