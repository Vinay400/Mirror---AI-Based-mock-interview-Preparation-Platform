import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { FaCode, FaPlay, FaCheckCircle, FaTimesCircle, FaVial, FaSpinner } from "react-icons/fa";
import api from "../../api/axios.js";
import { evaluateCodeSolution } from "../../api/interviewApi.js";

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "C", value: "c" },
  { label: "Go", value: "go" },
];

export default function CodingEditor({
  interviewId,
  questionId,
  visibleTestCases = [],
  code,
  language,
  onCodeChange,
  onLanguageChange,
  starterCode,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [activeTab, setActiveTab] = useState("tests"); // "tests" | "output"
  const [customInput, setCustomInput] = useState("");

  const handleRunCode = async () => {
    if (!code?.trim()) {
      setRunResult({
        type: "error",
        message: "Please write some code before running it.",
      });
      setActiveTab("output");
      return;
    }

    try {
      setIsRunning(true);
      setRunResult(null);

      // Use customInput if provided, else use first sample test case input if available
      const stdinToUse = customInput || (visibleTestCases && visibleTestCases[0]?.input) || "";

      const response = await api.post("/code/run", {
        sourceCode: code,
        language: language || "cpp",
        stdin: stdinToUse,
      });

      console.log("Judge0 run response:", response.data);

      setRunResult({
        type: "success",
        data: response.data,
      });
      setActiveTab("output");
    } catch (error) {
      console.error("Code execution error:", error);

      setRunResult({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to execute the code. Please try again.",
      });
      setActiveTab("output");
    } finally {
      setIsRunning(false);
    }
  };

  const handleEvaluateTests = async () => {
    if (!code?.trim()) {
      setEvalResult({
        type: "error",
        message: "Please write some code before running test cases.",
      });
      setActiveTab("tests");
      return;
    }

    if (!interviewId || !questionId) {
      setEvalResult({
        type: "error",
        message: "Interview session or question ID missing.",
      });
      setActiveTab("tests");
      return;
    }

    try {
      setIsEvaluating(true);
      setEvalResult(null);

      const response = await evaluateCodeSolution({
        interviewId,
        questionId,
        sourceCode: code,
        language: language || "cpp",
      });

      console.log("Evaluation response:", response.data);

      setEvalResult({
        type: "success",
        data: response.data,
      });
      setActiveTab("tests");
    } catch (error) {
      console.error("Test evaluation error:", error);

      setEvalResult({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to evaluate test cases. Please try again.",
      });
      setActiveTab("tests");
    } finally {
      setIsEvaluating(false);
    }
  };

  const executionData = runResult?.data;
  const evalData = evalResult?.data;

  return (
    <div className="coding-environment">
      <div className="editor-wrapper">
        <Editor
          height="400px"
          language={language || "cpp"}
          theme="vs-dark"
          value={code !== undefined ? code : starterCode || ""}
          onChange={(val) => onCodeChange(val || "")}
          options={{
            lineNumbers: "on",
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            editContext: false,
          }}
        />
      </div>

      <div
        className="coding-controls-bar"
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          background: "#1e293b",
          borderRadius: "8px",
          marginTop: "0.5rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div
          className="language-selector-box"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#e2e8f0" }}
        >
          <FaCode className="code-icon" />
          <span className="lang-label" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
            Language:
          </span>
          <select
            className="language-dropdown"
            value={language || "cpp"}
            onChange={(e) => {
              onLanguageChange(e.target.value);
              setRunResult(null);
              setEvalResult(null);
            }}
            style={{
              padding: "0.35rem 0.6rem",
              borderRadius: "6px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "#f8fafc",
              cursor: "pointer",
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            className={`run-code-btn ${isRunning ? "running" : ""}`}
            onClick={handleRunCode}
            disabled={isRunning || isEvaluating}
            title={isRunning ? "Running code..." : "Run code with custom/sample input"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1rem",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            {isRunning ? <FaSpinner className="spin-icon" /> : <FaPlay className="run-icon" />}
            {isRunning ? "Running..." : "Run Code"}
          </button>

          <button
            className="submit-tests-btn"
            onClick={handleEvaluateTests}
            disabled={isRunning || isEvaluating}
            title="Submit and run code solution against test cases"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1rem",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: isEvaluating ? "not-allowed" : "pointer",
              fontWeight: "600",
            }}
          >
            {isEvaluating ? <FaSpinner className="spin-icon" /> : <FaVial />}
            {isEvaluating ? "Testing..." : "Submit & Run Tests"}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className="coding-tabs-header"
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          borderBottom: "2px solid #334155",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("tests")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "tests" ? "3px solid #10b981" : "3px solid transparent",
            color: activeTab === "tests" ? "#10b981" : "#94a3b8",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FaVial /> Test Cases & Results
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("output")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "output" ? "3px solid #3b82f6" : "3px solid transparent",
            color: activeTab === "output" ? "#3b82f6" : "#94a3b8",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FaPlay /> Standard Output
        </button>
      </div>

      {/* TAB CONTENT: TEST CASES & RESULTS */}
      {activeTab === "tests" && (
        <div
          className="test-cases-panel"
          style={{
            background: "#0f172a",
            borderRadius: "8px",
            padding: "1.25rem",
            marginTop: "0.75rem",
            border: "1px solid #1e293b",
          }}
        >
          {/* Sample Visible Test Cases */}
          {visibleTestCases && visibleTestCases.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h4
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                Sample Test Cases
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {visibleTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#1e293b",
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      color: "#e2e8f0",
                      fontSize: "0.85rem",
                      fontFamily: "monospace",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    <div style={{ color: "#38bdf8", fontWeight: "bold" }}>
                      Sample Test {idx + 1}
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Input: </span>
                      <span>{tc.input}</span>
                    </div>
                    {tc.expectedOutput && (
                      <div>
                        <span style={{ color: "#94a3b8" }}>Expected Output: </span>
                        <span>{tc.expectedOutput}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Evaluation Results */}
          {evalData && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #334155" }}>
              <div
                style={{
                  display: "flex",
                  justify: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h4 style={{ color: "#f8fafc", fontSize: "1.1rem", margin: 0 }}>
                  Test Execution Results
                </h4>
                <span
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    background:
                      evalData.passedTests === evalData.totalTests
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                    color: evalData.passedTests === evalData.totalTests ? "#34d399" : "#f87171",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  {evalData.passedTests} / {evalData.totalTests} Passed ({evalData.score}%)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {evalData.testResults?.map((res, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      background: res.passed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      borderLeft: res.passed ? "4px solid #10b981" : "4px solid #ef4444",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        {res.passed ? (
                          <FaCheckCircle style={{ color: "#10b981", fontSize: "1.1rem" }} />
                        ) : (
                          <FaTimesCircle style={{ color: "#ef4444", fontSize: "1.1rem" }} />
                        )}
                        <span style={{ color: "#f8fafc", fontWeight: "600", fontSize: "0.9rem" }}>
                          {res.isHidden ? `Test Case ${res.testCase}` : `Sample Test ${res.testCase}`}
                        </span>
                      </div>

                      <span
                        style={{
                          color: res.passed ? "#34d399" : "#f87171",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                        }}
                      >
                        {res.status}
                      </span>
                    </div>

                    {!res.isHidden && (res.input || res.actualOutput || res.expectedOutput) && (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "monospace", marginTop: "0.25rem", paddingLeft: "1.7rem" }}>
                        {res.input && <div>Input: {res.input}</div>}
                        {res.expectedOutput && <div>Expected: {res.expectedOutput}</div>}
                        {res.actualOutput && <div>Actual: {res.actualOutput}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {evalResult?.type === "error" && (
            <div
              style={{
                color: "#f87171",
                background: "rgba(239, 68, 68, 0.1)",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                marginTop: "1rem",
              }}
            >
              {evalResult.message}
            </div>
          )}

          {!evalData && evalResult?.type !== "error" && (
            <div
              style={{
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontStyle: "italic",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              Click <strong>"Submit & Run Tests"</strong> to test your solution against test cases.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: STANDARD OUTPUT */}
      {activeTab === "output" && (
        <div
          className="code-output-panel"
          style={{ background: "#0f172a", borderRadius: "8px", padding: "1rem", marginTop: "0.75rem" }}
        >
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>
              Custom Input (stdin):
            </label>
            <textarea
              rows={2}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input for 'Run Code'..."
              style={{
                width: "100%",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#f8fafc",
                borderRadius: "4px",
                padding: "0.5rem",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {runResult ? (
            runResult.type === "error" ? (
              <div className="code-error" style={{ color: "#f87171" }}>
                {runResult.message}
              </div>
            ) : (
              <>
                <div
                  className="output-header"
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}
                >
                  <span style={{ color: "#cbd5e1", fontWeight: "600" }}>Execution Output</span>
                  {executionData?.status && (
                    <span
                      className="execution-status"
                      style={{ color: executionData.status.id === 3 ? "#34d399" : "#f87171" }}
                    >
                      {executionData.status.description}
                    </span>
                  )}
                </div>

                <pre
                  className="output-content"
                  style={{
                    background: "#1e293b",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {executionData?.stdout ||
                    executionData?.stderr ||
                    executionData?.compile_output ||
                    "Program executed successfully with no output."}
                </pre>

                {(executionData?.time || executionData?.memory) && (
                  <div
                    className="execution-meta"
                    style={{
                      display: "flex",
                      gap: "1rem",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {executionData.time && <span>Time: {executionData.time}s</span>}
                    {executionData.memory && <span>Memory: {executionData.memory} KB</span>}
                  </div>
                )}
              </>
            )
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.9rem", fontStyle: "italic" }}>
              Click <strong>"Run Code"</strong> to run your solution against custom input.
            </div>
          )}
        </div>
      )}
    </div>
  );
}