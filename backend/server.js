import "dotenv/config";
import express from "express";
import bodyparser from "body-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import InterviewRoutes from "./routes/InterviewRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import cors from 'cors';
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.json());
connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/interview", InterviewRoutes);
app.use("/api/code", codeRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server is listening at Port ${process.env.PORT}`);
});
