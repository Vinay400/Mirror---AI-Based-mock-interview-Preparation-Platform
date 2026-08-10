import React from "react";
import Webcam from "react-webcam";
import {
  FaBriefcase,
  FaGraduationCap,
  FaCogs,
  FaListOl,
  FaUserTie,
  FaTags,
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPlayCircle,
} from "react-icons/fa";

export default function InterviewSetup({
  interview,
  cameraEnabled,
  micEnabled,
  setCameraEnabled,
  setMicEnabled,
  webcamRef,
  onStartInterview,
}) {
  return (
    <div className="session-container">
      <div className="session-card">
        <div className="setup-layout">
          <div className="setup-info">
            <h1>Interview Setup</h1>
            <p className="subtitle">
              Please configure your hardware and review instructions before
              starting.
            </p>

            <div className="meta-grid">
              <div className="meta-item">
                <FaBriefcase />
                <div className="meta-content">
                  <span className="meta-label">Job Role</span>
                  <span className="meta-value">{interview.jobRole}</span>
                </div>
              </div>
              <div className="meta-item">
                <FaGraduationCap />
                <div className="meta-content">
                  <span className="meta-label">Experience</span>
                  <span className="meta-value">
                    {interview.experienceLevel}
                  </span>
                </div>
              </div>
              <div className="meta-item">
                <FaCogs />
                <div className="meta-content">
                  <span className="meta-label">Difficulty</span>
                  <span className="meta-value">{interview.difficulty}</span>
                </div>
              </div>
              <div className="meta-item">
                <FaListOl />
                <div className="meta-content">
                  <span className="meta-label">Questions</span>
                  <span className="meta-value">
                    {interview.numQuestions || interview.questions?.length} Qs
                  </span>
                </div>
              </div>
              <div className="meta-item">
                <FaUserTie />
                <div className="meta-content">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">
                    {interview.interviewType}
                  </span>
                </div>
              </div>
              {interview.additionalSkills && (
                <div className="meta-item">
                  <FaTags />
                  <div className="meta-content">
                    <span className="meta-label">Skills</span>
                    <span
                      className="meta-value skills"
                      title={interview.additionalSkills}
                    >
                      {interview.additionalSkills}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="instructions-card">
              <h3>Instructions & Rules:</h3>
              <ul>
                <li>
                  Keep your webcam and microphone turned on for a realistic
                  experience.
                </li>
                <li>
                  Click <strong>Start Recording</strong> to speak your
                  response for each question.
                </li>
                <li>
                  You can navigate back and forth to refine your answers
                  before finishing.
                </li>
                <li>
                  Click <strong>Finish & Submit</strong> to analyze answers
                  and generate AI scores.
                </li>
              </ul>
            </div>

            <div className="setup-actions">
              <button className="start-btn" onClick={onStartInterview}>
                <FaPlayCircle /> Start Mock Interview
              </button>
            </div>
          </div>

          <div className="setup-media">
            <div className="webcam-box">
              {cameraEnabled ? (
                <Webcam
                  audio={micEnabled}
                  muted={true}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="webcam-stream"
                />
              ) : (
                <div className="webcam-placeholder">
                  <FaVideoSlash />
                  <span>Camera is turned off</span>
                </div>
              )}
              {cameraEnabled && (
                <div className="media-badge">Live Camera Feed</div>
              )}
            </div>

            <div className="webcam-controls">
              <button
                className={`control-btn ${!cameraEnabled ? "active" : ""}`}
                onClick={() => setCameraEnabled(!cameraEnabled)}
              >
                {cameraEnabled ? <FaVideoSlash /> : <FaVideo />}
                {cameraEnabled ? "Disable Video" : "Enable Video"}
              </button>
              <button
                className={`control-btn ${!micEnabled ? "active" : ""}`}
                onClick={() => setMicEnabled(!micEnabled)}
              >
                {micEnabled ? <FaMicrophoneSlash /> : <FaMicrophone />}
                {micEnabled ? "Mute Mic" : "Unmute Mic"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
