import { runCode } from "../services/judge0Service.js";

const runCodeController = async (req, res) => {
  try {
    const {
      sourceCode,
      languageId,
      stdin = "",
    } = req.body;

    if (!sourceCode) {
      return res.status(400).json({
        message: "Source code is required.",
      });
    }

    if (!languageId) {
      return res.status(400).json({
        message: "Language ID is required.",
      });
    }

    const result = await runCode({
      sourceCode,
      languageId,
      stdin,
    });

    res.status(200).json(result);

  } catch (error) {
    console.error("Judge0 execution error:", error);

    res.status(500).json({
      message: "Failed to execute code.",
      error: error.message,
    });
  }
};

export { runCodeController };