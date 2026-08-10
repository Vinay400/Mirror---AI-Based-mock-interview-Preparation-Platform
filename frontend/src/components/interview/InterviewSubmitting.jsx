import React from "react";
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlayCircle,
} from "react-icons/fa";

export default function InterviewSubmitting({
  submitSteps,
  submitStep,
  submitError,
  onRetry,
  onReturn,
  isError = false,
}) {
  if (isError) {
    return (
      <div className="session-container">
        <div className="session-card loading-wrapper error-card">
          <div className="error-icon-box">
            <FaExclamationTriangle className="error-icon" />
          </div>
          <h2 className="error-title">
            We couldn't complete your interview evaluation.
          </h2>
          <p className="error-subtitle">Please try submitting again.</p>
          {submitError && <p className="error-detail-text">{submitError}</p>}

          <div className="error-actions">
            <button className="nav-btn secondary" onClick={onReturn}>
              Cancel & Return
            </button>
            <button className="nav-btn primary" onClick={onRetry}>
              <FaPlayCircle /> Retry Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-card submission-loading-card">
        <div className="submission-loading-header">
          <div className="eval-pulse-ring">
            <FaSpinner className="spinner eval-spinner" />
          </div>
          <h2 className="loading-title">Analyzing Your Interview</h2>
          <p className="loading-subtitle">
            Please wait while we analyze your responses and generate personalized feedback.
          </p>
        </div>

        <div className="submission-steps-container">
          {submitSteps.map((step, idx) => {
            const isCompleted = idx < submitStep;
            const isActive = idx === submitStep;
            const isUpcoming = idx > submitStep;

            return (
              <div
                key={step.id}
                className={`submission-step-item ${
                  isCompleted ? "completed" : ""
                } ${isActive ? "active" : ""} ${isUpcoming ? "upcoming" : ""}`}
              >
                <div className="step-icon-col">
                  {isCompleted && (
                    <span className="step-status-icon completed">
                      <FaCheckCircle />
                    </span>
                  )}
                  {isActive && (
                    <span className="step-status-icon active">
                      <FaSpinner className="step-spinner" />
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="step-status-icon upcoming">
                      <span className="upcoming-dot" />
                    </span>
                  )}
                </div>
                <div className="step-text-col">
                  <span className="step-title-text">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
