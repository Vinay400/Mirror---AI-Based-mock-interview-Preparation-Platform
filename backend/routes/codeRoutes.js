import express from "express";
import protect from "../middleware/authMiddleware.js";
import { runCodeController, evaluateCodeController } from "../controller/codeController.js";

const Router = express.Router();

Router.post("/run", protect, runCodeController);
Router.post("/evaluate", protect, evaluateCodeController);

export default Router;