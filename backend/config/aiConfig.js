import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
export const ai = new GoogleGenAI({ apiKey: process.env.Gemini_API_Key });