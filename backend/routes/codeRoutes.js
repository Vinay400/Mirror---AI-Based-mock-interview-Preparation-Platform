import express from "express";
import protect from "../middleware/authMiddleware.js";
import { runCodeController } from "../controller/codeController.js";

const Router = express.Router();

Router.post("/run", protect, runCodeController);

export default Router;