import "dotenv/config";
import express from "express";
import bodyparser from "body-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import InterviewRoutes from "./routes/InterviewRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import cors from 'cors';

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.production_frontend_url,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean).map(url => url.trim().replace(/\/$/, ""));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser requests
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.trim().replace(/\/$/, "");
    
    // Allow exact matches, Vercel deployments, or Render deployments
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith(".vercel.app") ||
      cleanOrigin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/interview", InterviewRoutes);
app.use("/api/code", codeRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening at Port ${process.env.PORT || 3000}`);
});

