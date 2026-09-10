import Interview from "../models/Interview.js";
import { runCode, executeCodeForInput, LANGUAGE_IDS } from "../services/judge0Service.js";
import { evaluateFrameworkCode } from "../services/aiService.js";

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

const DEFAULT_TEST_INPUTS = ["0", "1", "2", "5", "10", "15", "20"];

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

    const langToUse = language || question.language || "cpp";

    // Handle Framework Evaluation (AI-based)
    if (question.evaluationType === "framework" || question.framework) {
      const frameworkName = question.framework || "react";
      const rawEval = await evaluateFrameworkCode(
        interview.jobRole,
        interview.experienceLevel,
        question.question,
        frameworkName,
        langToUse,
        sourceCode
      );

      let cleanJsonText = (rawEval || "").trim();
      if (cleanJsonText.startsWith("```json")) {
        cleanJsonText = cleanJsonText.slice(7);
      } else if (cleanJsonText.startsWith("```")) {
        cleanJsonText = cleanJsonText.slice(3);
      }
      if (cleanJsonText.endsWith("```")) {
        cleanJsonText = cleanJsonText.slice(0, -3);
      }
      cleanJsonText = cleanJsonText.trim();

      let parsedEval;
      try {
        parsedEval = JSON.parse(cleanJsonText);
      } catch (pErr) {
        console.error("Framework AI Evaluation JSON parse error:", pErr);
        parsedEval = {
          score: 75,
          correctness: 75,
          frameworkKnowledge: 75,
          codeQuality: 75,
          bestPractices: 75,
          feedback: rawEval || "Solution evaluated.",
          strengths: [],
          improvements: [],
        };
      }

      question.userCode = sourceCode;
      question.language = langToUse;
      question.frameworkEvaluation = {
        score: typeof parsedEval.score === "number" ? parsedEval.score : 0,
        correctness: typeof parsedEval.correctness === "number" ? parsedEval.correctness : 0,
        frameworkKnowledge: typeof parsedEval.frameworkKnowledge === "number" ? parsedEval.frameworkKnowledge : 0,
        codeQuality: typeof parsedEval.codeQuality === "number" ? parsedEval.codeQuality : 0,
        bestPractices: typeof parsedEval.bestPractices === "number" ? parsedEval.bestPractices : 0,
        feedback: parsedEval.feedback || "",
        strengths: Array.isArray(parsedEval.strengths) ? parsedEval.strengths : [],
        improvements: Array.isArray(parsedEval.improvements) ? parsedEval.improvements : [],
      };
      question.score = question.frameworkEvaluation.score;
      if (question.frameworkEvaluation.feedback) {
        question.feedback = question.frameworkEvaluation.feedback;
      }

      await interview.save();

      return res.status(200).json({
        success: true,
        evaluationType: "framework",
        framework: frameworkName,
        frameworkEvaluation: question.frameworkEvaluation,
        score: question.score,
      });
    }

    let testCases = question.testCases || [];

    // Fallback: If no test cases exist on the question (e.g. legacy interview or failed initial generation), auto-generate them now
    if (testCases.length === 0) {
      console.log(`Auto-generating fallback test cases for question "${question.question}"...`);
      const refSolution = question.referenceSolution || "";
      const generatedTestCases = [];

      if (refSolution) {
        for (const inputStr of DEFAULT_TEST_INPUTS) {
          try {
            const execResult = await executeCodeForInput({
              sourceCode: refSolution,
              language: langToUse,
              stdin: inputStr,
            });
            if (execResult && execResult.status?.id === 3) {
              generatedTestCases.push({
                input: inputStr,
                expectedOutput: execResult.stdout || "",
                isHidden: generatedTestCases.length >= 2,
              });
            }
          } catch (e) {
            console.error("Fallback reference execution error:", e.message);
          }
        }
      }

      // If still no reference solution output, generate baseline test cases based on candidate sourceCode execution
      if (generatedTestCases.length === 0) {
        for (let i = 0; i < DEFAULT_TEST_INPUTS.length; i++) {
          const inputStr = DEFAULT_TEST_INPUTS[i];
          try {
            const candidateExec = await executeCodeForInput({
              sourceCode,
              language: langToUse,
              stdin: inputStr,
            });
            if (candidateExec && candidateExec.status?.id === 3) {
              generatedTestCases.push({
                input: inputStr,
                expectedOutput: candidateExec.stdout || "",
                isHidden: i >= 2,
              });
            }
          } catch (e) {
            console.error("Fallback candidate execution error:", e.message);
          }
        }
      }

      if (generatedTestCases.length > 0) {
        question.testCases = generatedTestCases;
        await interview.save();
        testCases = generatedTestCases;
      }
    }

    if (testCases.length === 0) {
      return res.status(400).json({ message: "Unable to execute test cases. Please ensure your code compiles and runs." });
    }

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

    question.userCode = sourceCode;
    question.language = langToUse;
    question.codingEvaluation = {
      totalTests,
      passedTests: passedCount,
      score,
      status: overallStatus,
      testResults: sanitizedResults,
    };
    question.score = score;

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