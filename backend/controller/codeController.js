import Interview from "../models/Interview.js";
import { runCode, executeCodeForInput, LANGUAGE_IDS } from "../services/judge0Service.js";

export function normalizeOutput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function compareOutputs(actual, expected) {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  return normActual === normExpected;
}

const runCodeController = async (req, res) => {
  try {
    const {
      sourceCode,
      language,
      stdin = "",
    } = req.body;

    if (!sourceCode) {
      return res.status(400).json({
        message: "Source code is required.",
      });
    }

    if (!language) {
      return res.status(400).json({
        message: "Programming language is required.",
      });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];

    if (!languageId) {
      return res.status(400).json({
        message: `Unsupported programming language: ${language}`,
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

const evaluateCodeController = async (req, res) => {
  try {
    const { interviewId, questionId, sourceCode, language } = req.body;

    if (!interviewId || !questionId) {
      return res.status(400).json({ message: "interviewId and questionId are required." });
    }

    if (!sourceCode) {
      return res.status(400).json({ message: "Source code is required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    const question = interview.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const testCases = question.testCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({ message: "No test cases configured for this question." });
    }

    const langToUse = language || question.language || "cpp";
    const sanitizedResults = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let execResult;
      try {
        execResult = await executeCodeForInput({
          sourceCode,
          language: langToUse,
          stdin: tc.input || "",
        });
      } catch (err) {
        execResult = {
          status: { id: 11, description: "Runtime Error" },
          stdout: "",
          stderr: err.message,
        };
      }

      const statusId = execResult?.status?.id;
      const actualOut = execResult?.stdout || "";
      let passed = false;
      let statusDesc = execResult?.status?.description || "Error";

      if (statusId === 3) {
        // Judge0 Accepted - now verify output matching expectedOutput
        if (compareOutputs(actualOut, tc.expectedOutput)) {
          passed = true;
          statusDesc = "Accepted";
          passedCount++;
        } else {
          passed = false;
          statusDesc = "Wrong Answer";
        }
      } else {
        passed = false;
      }

      // Security: Sanitized result for candidate frontend
      if (tc.isHidden) {
        sanitizedResults.push({
          testCase: i + 1,
          passed,
          status: statusDesc,
          isHidden: true,
        });
      } else {
        sanitizedResults.push({
          testCase: i + 1,
          passed,
          actualOutput: actualOut,
          status: statusDesc,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false,
        });
      }
    }

    const totalTests = testCases.length;
    const score = Math.round((passedCount / totalTests) * 100);
    const overallStatus = passedCount === totalTests ? "Accepted" : "Wrong Answer";

    // Save coding submission and evaluation into MongoDB
    question.userCode = sourceCode;
    question.language = langToUse;
    question.codingEvaluation = {
      totalTests,
      passedTests: passedCount,
      score,
      status: overallStatus,
      testResults: sanitizedResults,
    };
    question.score = score; // Store score on question model

    await interview.save();

    return res.status(200).json({
      success: true,
      totalTests,
      passedTests: passedCount,
      score,
      status: overallStatus,
      testResults: sanitizedResults,
    });
  } catch (error) {
    console.error("evaluateCodeController Error:", error);
    return res.status(500).json({
      message: "Failed to evaluate coding solution against test cases.",
      error: error.message,
    });
  }
};

export { runCodeController, evaluateCodeController };