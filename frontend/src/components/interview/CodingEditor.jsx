import React from "react";
import Editor from "@monaco-editor/react";
import { FaCode, FaPlay } from "react-icons/fa";

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
];

export default function CodingEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
}) {
  return (
    <div className="coding-environment">
      <div className="editor-wrapper">
        <Editor
          height="400px"
          language={language || "cpp"}
          theme="vs-dark"
          value={code || ""}
          onChange={(val) => onCodeChange(val || "")}
          options={{
            lineNumbers: "on",
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      <div className="coding-controls-bar">
        <div className="language-selector-box">
          <FaCode className="code-icon" />
          <span className="lang-label">Language:</span>
          <select
            className="language-dropdown"
            value={language || "cpp"}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="run-code-btn disabled"
          disabled={true}
          title="Backend code execution is unavailable"
        >
          <FaPlay className="run-icon" /> Run Code
        </button>
      </div>
    </div>
  );
}
