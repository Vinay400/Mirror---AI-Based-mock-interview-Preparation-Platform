import React from "react";
import Webcam from "react-webcam";
import {
  FaVideoSlash,
  FaCheckCircle,
  FaVolumeUp,
  FaMicrophone,
  FaStop,
  FaArrowLeft,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import AudioWaveform from "../AudioWaveform";
import CodingEditor from "./CodingEditor";
import {
  SkeletonRecordingPanel,
  SkeletonTranscriptBlock,
} from "../Skeletons";

import { isCodingQuestion } from "../../utils/questionUtils";

export default function InterviewActive({
  interview,
  activeQuestionIndex,
  setActiveQuestionIndex,
  cameraEnabled,
  micEnabled,
  timer,
  formatTime,
  isUploading,
  uploadStage,
  isRecording,
  startRecording,
  stopRecording,
  recTimer,
  audioStream,
  hasRecordedAnswer,
  handlePrev,
  handleNext,
  handleFinish,
  state,
  repeatQuestion,
  isQuestionAnswered,
  codeAnswers,
  languageAnswers,
  handleCodeChange,
  handleLanguageChange,
}) {
  const currentQuestion = interview.questions[activeQuestionIndex];
  const isCoding = isCodingQuestion(currentQuestion);
  const rawType = currentQuestion?.type ? String(currentQuestion.type).toLowerCase() : "technical";
  const questionType = isCoding ? "Coding" : rawType === "hr" ? "HR" : "Technical";

  return (
    <div className="session-container">
      <div className="session-card">
        <div className="active-layout">
          <div className="session-sidebar">
            <div className="sidebar-camera">
              {cameraEnabled ? (
                <Webcam
                  audio={micEnabled}
                  muted={true}
                  screenshotFormat="image/jpeg"
                  className="webcam-stream"
                />
              ) : (
                <div className="sidebar-camera-placeholder">
                  <FaVideoSlash />
                  <span>Camera Off</span>
                </div>
              )}
            </div>

            <div className="sidebar-timer">
              <span className="timer-label">Session Time:</span>
              <span className="timer-value">{formatTime(timer)}</span>
            </div>

            <div className="progress-list-container">
              <span className="progress-header">Questions Progress</span>
              <div className="progress-steps">
                {interview.questions.map((q, idx) => {
                  const isAnswered = isQuestionAnswered(q);
                  const isActive = idx === activeQuestionIndex;
                  return (
                    <div
                      key={q._id}
                      className={`progress-step-item ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                      onClick={() => {
                        if (isUploading || state === "submitting") return;
                        if (isRecording) {
                          stopRecording();
                        }
                        setActiveQuestionIndex(idx);
                      }}
                    >
                      <span className="step-num">{idx + 1}</span>
                      <span className="step-label">Question {idx + 1}</span>
                      {isAnswered && (
                        <FaCheckCircle className="step-status-icon" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="interview-main">
            <div className="question-panel">
              <div className="question-header-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="question-badge">
                    Question {activeQuestionIndex + 1} of{" "}
                    {interview.questions.length}
                  </span>
                  <span className={`type-badge type-${questionType.toLowerCase()}`}>
                    {questionType}
                  </span>
                </div>
                <div
                  className="difficulty-indicator"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    className="dictate-btn"
                    style={{
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.8rem",
                      border: "1px solid #cbd5e1",
                    }}
                    onClick={repeatQuestion}
                    title="Speak Question Aloud"
                  >
                    <FaVolumeUp /> Hear Question
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span
                      className={`difficulty-dot ${interview.difficulty}`}
                    />
                    <span>{interview.difficulty} Level</span>
                  </div>
                </div>
              </div>
              <h3 className="question-text">{currentQuestion.question}</h3>
            </div>

            {/* Helper to render Audio Recording Panel */}
            {(() => {
              const renderRecordingPanel = (isCodingMode = false) => (
                <div className="recording-card-panel" style={isCodingMode ? { marginTop: "1rem" } : {}}>
                  {isCodingMode && (
                    <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#475569", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>🎙️</span>
                      <span>Verbal Explanation: You can also record a spoken explanation of your code solution</span>
                    </div>
                  )}
                  {/* Uploading Loading State */}
                  {isUploading && uploadStage === "uploading" && (
                    <SkeletonRecordingPanel message="Uploading your response..." />
                  )}

                  {/* Azure Speech Transcribing State */}
                  {isUploading && uploadStage === "transcribing" && (
                    <SkeletonTranscriptBlock message="Converting speech to text..." />
                  )}

                  {/* Idle State: Question Not Answered Yet */}
                  {!isRecording && !isUploading && uploadStage === "idle" && !hasRecordedAnswer && (
                    <div className="recording-status-box idle">
                      <button
                        className="start-record-btn"
                        onClick={startRecording}
                      >
                        <span className="mic-emoji">🎤</span> Start Recording
                      </button>
                      <p className="recording-hint">
                        {isCodingMode
                          ? "Click to record a verbal explanation of your code solution."
                          : "Click to start answering this question."}
                      </p>
                    </div>
                  )}

                  {/* Answered State: Question Answer Already Uploaded & Saved */}
                  {!isRecording && !isUploading && uploadStage === "idle" && hasRecordedAnswer && (
                    <div className="recording-status-box answer-uploaded">
                      <div className="uploaded-badge-circle">
                        <FaCheckCircle />
                      </div>
                      <h3 className="uploaded-title">✓ Verbal Explanation Recorded</h3>
                      <p className="uploaded-subtext">
                        Your audio response for this question has been saved.
                      </p>
                      <button
                        className="rerecord-btn"
                        onClick={startRecording}
                      >
                        <FaMicrophone /> Re-record Explanation
                      </button>
                    </div>
                  )}

                  {/* Active Recording State */}
                  {isRecording && !isUploading && (
                    <div className="recording-status-box active-recording">
                      <div className="recording-live-header">
                        <div className="recording-indicator">
                          <span className="red-dot" />
                          <span>Recording...</span>
                        </div>
                        <div className="recording-timer">
                          {formatTime(recTimer)}
                        </div>
                      </div>

                      <AudioWaveform
                        stream={audioStream}
                        isRecording={isRecording}
                      />

                      <p className="recording-subtext">
                        Speak naturally. Click Stop when finished.
                      </p>

                      <button
                        className="stop-record-btn"
                        onClick={stopRecording}
                      >
                        <FaStop className="stop-icon" /> Stop Recording
                      </button>
                    </div>
                  )}
                </div>
              );

              return isCoding ? (
                <div className="answer-panel coding-experience">
                  <CodingEditor
                    code={codeAnswers[currentQuestion._id] || ""}
                    language={
                      languageAnswers[currentQuestion._id] ||
                      currentQuestion.language ||
                      "cpp"
                    }
                    onCodeChange={(code) =>
                      handleCodeChange(currentQuestion._id, code)
                    }
                    onLanguageChange={(lang) =>
                      handleLanguageChange(currentQuestion._id, lang)
                    }
                  />
                  {renderRecordingPanel(true)}
                </div>
              ) : (
                <div className="answer-panel recording-experience">
                  {renderRecordingPanel(false)}
                </div>
              );
            })()}

            <div className="navigation-panel">
              <button
                className="nav-btn"
                onClick={handlePrev}
                disabled={activeQuestionIndex === 0 || state === "submitting" || isUploading}
              >
                <FaArrowLeft /> Previous
              </button>

              {activeQuestionIndex < interview.questions.length - 1 ? (
                <button
                  className="nav-btn primary"
                  onClick={handleNext}
                  disabled={state === "submitting" || isUploading}
                >
                  Next Question <FaArrowRight />
                </button>
              ) : (
                <button
                  className="nav-btn finish"
                  onClick={handleFinish}
                  disabled={state === "submitting" || isUploading}
                >
                  {state === "submitting" ? (
                    <>
                      <FaSpinner className="step-spinner" /> Submitting...
                    </>
                  ) : (
                    <>
                      Finish & Submit <FaCheckCircle />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

