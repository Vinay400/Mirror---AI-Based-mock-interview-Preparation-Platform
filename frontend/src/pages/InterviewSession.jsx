import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import ReactMarkdown from "react-markdown";
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
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaSpinner,
  FaTrophy,
  FaPlayCircle,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaVolumeUp,
  FaStop,
} from "react-icons/fa";
import { getInterview, submitInterview, uploadAudio } from "../api/interviewApi";
import AudioWaveform from "../components/AudioWaveform";
import "../styles/InterviewSession.css";

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [state, setState] = useState("setup");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [recTimer, setRecTimer] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const SUBMIT_STEPS = [
    { id: "saving", label: "Saving interview" },
    { id: "transcripts", label: "Processing transcripts" },
    { id: "evaluating", label: "Evaluating technical answers" },
    { id: "feedback", label: "Generating personalized feedback" },
    { id: "results", label: "Preparing your results" },
  ];
  const [uploadStage, setUploadStage] = useState("idle"); // "idle" | "uploading" | "transcribing"
  const [audioStream, setAudioStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pendingActionRef = useRef(null);
  const [answers, setAnswers] = useState({});
  const [audioAnswers, setAudioAnswers] = useState({});

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const res = await getInterview(id);
        setInterview(res.data);

        // Populate pre-existing answers if any
        const prefilledAnswers = {};
        res.data.questions.forEach((q) => {
          prefilledAnswers[q._id] = q.answer || "";
        });
        setAnswers(prefilledAnswers);

        if (res.data.status === "Completed") {
          setState("results");
        }
      } catch (err) {
        console.error("Failed to load interview details", err);
        setError(
          "Could not load the interview details. It might not exist or you may not be authenticated.",
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInterview();
    }
  }, [id]);

  useEffect(() => {
    let interval;
    if (state === "active") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  // Timer for active audio recording
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setRecTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (
      state === "active" &&
      interview?.questions?.[activeQuestionIndex]?.question
    ) {
      const questionText = interview.questions[activeQuestionIndex].question;

      const timerId = setTimeout(() => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(questionText);
          utterance.lang = "en-US";
          window.speechSynthesis.speak(utterance);
        }
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [state, activeQuestionIndex, interview]);

  // Clean up speech synthesis on unmount/route change
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const repeatQuestion = () => {
    if (
      interview?.questions?.[activeQuestionIndex]?.question &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        interview.questions[activeQuestionIndex].question,
      );
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeQuestionId = interview?.questions?.[activeQuestionIndex]?._id;
  const activeQuestionIdRef = useRef(activeQuestionId);

  // Sync ref with activeQuestionId
  useEffect(() => {
    activeQuestionIdRef.current = activeQuestionId;
  }, [activeQuestionId]);

  // Setup MediaRecorder & AudioStream
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioStream(stream);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsUploading(true);
          setUploadStage("uploading");

          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          const formData = new FormData();
          formData.append("audio", blob, "answer.webm");
          formData.append("interviewId", id);
          formData.append("questionId", activeQuestionIdRef.current);

          try {
            const response = await uploadAudio(formData);

            // Replace answer transcript in React state with Azure transcript
            setAnswers((prev) => ({
              ...prev,
              [activeQuestionIdRef.current]: response.data.transcript,
            }));

            setAudioAnswers((prev) => ({
              ...prev,
              [activeQuestionIdRef.current]: blob,
            }));

            console.log("Azure Response:", response.data);
            console.log("Azure Transcript:", response.data.transcript);

            // Show transcribing / success message state
            setUploadStage("transcribing");

            // Auto-hide success card after around 1.5 seconds
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setUploadStage("idle");
            setIsUploading(false);

            // Execute pending navigation after upload completes
            if (pendingActionRef.current === "next") {
              pendingActionRef.current = null;
              setActiveQuestionIndex((prev) => prev + 1);
            } else if (pendingActionRef.current === "prev") {
              pendingActionRef.current = null;
              setActiveQuestionIndex((prev) => prev - 1);
            } else if (pendingActionRef.current === "finish") {
              pendingActionRef.current = null;
              await handleFinish();
            }
          } catch (err) {
            console.error("Audio upload failed:", err);
            alert("Failed to upload and transcribe audio. Please try recording again.");
            setUploadStage("idle");
            setIsUploading(false);
          } finally {
            audioChunksRef.current = [];
          }
        };
      } catch (err) {
        console.error("Failed to access microphone:", err);
        alert(
          "Microphone access was denied or unavailable. Please allow microphone access and try again."
        );
      }
    };

    setupMediaRecorder();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [id]);

  const startRecording = () => {
    if (!mediaRecorderRef.current) {
      alert("Microphone stream is unavailable. Please check permissions.");
      return;
    }
    try {
      audioChunksRef.current = [];
      if (mediaRecorderRef.current.state === "inactive") {
        mediaRecorderRef.current.start();
      }
      setRecTimer(0);
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting media recorder:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (isUploading) {
      alert("Please wait while your answer is being uploaded.");
      return;
    }

    if (isRecording) {
      pendingActionRef.current = "next";
      stopRecording();
      return;
    }

    if (activeQuestionIndex < interview.questions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isUploading) {
      alert("Please wait while your answer is being uploaded.");
      return;
    }

    if (isRecording) {
      pendingActionRef.current = "prev";
      stopRecording();
      return;
    }

    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
    }
  };

  const handleStartInterview = () => {
    setState("active");
  };

  const handleFinish = async () => {
    if (isUploading) {
      alert("Please wait while your last answer is being uploaded.");
      return;
    }

    if (isRecording) {
      pendingActionRef.current = "finish";
      stopRecording();
      return;
    }

    if (state === "submitting") return;

    try {
      setState("submitting");
      setSubmitError(null);
      setSubmitStep(0);

      // Animated progress checklist interval while evaluation is in progress
      const stepInterval = setInterval(() => {
        setSubmitStep((prev) => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 1800);

      const res = await submitInterview(id);

      clearInterval(stepInterval);
      setSubmitStep(4);

      await new Promise((resolve) => setTimeout(resolve, 600));

      setInterview(res.data);
      setState("results");
    } catch (err) {
      console.error("Submit Interview Error:", err);
      setSubmitError(
        err.response?.data?.message || err.message || "Failed to complete evaluation."
      );
      setState("submit-error");
    }
  };

  const getScoreVerdict = (score) => {
    if (score >= 8.5) return "Excellent";
    if (score >= 7.0) return "Good";
    if (score >= 5.0) return "Average";
    return "NeedsImprovement";
  };

  const getScoreAngle = (score) => {
    const safeScore = typeof score === "number" ? score : 0;
    return `${(safeScore / 10) * 360}deg`;
  };

  const getVerdictLabel = (verdict) => {
    switch (verdict) {
      case "Excellent":
        return "Excellent";
      case "Good":
        return "Good";
      case "Average":
        return "Average";
      case "NeedsImprovement":
        return "Needs Improvement";
      default:
        return "Needs Improvement";
    }
  };

  if (loading) {
    return (
      <div className="session-container">
        <div className="session-card loading-wrapper">
          <FaSpinner className="spinner" />
          <h2>Preparing Interview Session...</h2>
          <p>Configuring simulated workspace and fetching details.</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="session-container">
        <div className="session-card loading-wrapper">
          <FaExclamationTriangle
            style={{
              color: "#ef4444",
              fontSize: "3rem",
              marginBottom: "1.5rem",
            }}
          />
          <h2>Error Occurred</h2>
          <p>{error || "Interview session not found."}</p>
          <button
            className="nav-btn primary"
            style={{ marginTop: "1.5rem" }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (state === "setup") {
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
                <button className="start-btn" onClick={handleStartInterview}>
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

  if (state === "active") {
    const currentQuestion = interview.questions[activeQuestionIndex];
    const isQuestionAnswered = (qId) => {
      if (!qId) return false;
      return !!(
        audioAnswers[qId] ||
        (answers[qId] !== undefined && answers[qId] !== null && String(answers[qId]).length > 0)
      );
    };
    const hasRecordedAnswer = isQuestionAnswered(currentQuestion?._id);

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
                    const isAnswered = isQuestionAnswered(q._id);
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
                  <span className="question-badge">
                    Question {activeQuestionIndex + 1} of{" "}
                    {interview.questions.length}
                  </span>
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

              {/* Modern Answer Recording Interface */}
              <div className="answer-panel recording-experience">
                <div className="recording-card-panel">
                  {/* Uploading Loading State */}
                  {isUploading && uploadStage === "uploading" && (
                    <div className="recording-status-box uploading">
                      <FaSpinner className="spinner recording-spinner" />
                      <h3 className="uploading-text">Uploading audio...</h3>
                    </div>
                  )}

                  {/* Transcribing Success State */}
                  {isUploading && uploadStage === "transcribing" && (
                    <div className="recording-status-box success">
                      <div className="success-icon-badge">
                        <FaCheckCircle />
                      </div>
                      <h3 className="success-text">✓ Answer saved successfully</h3>
                      <p className="status-subtext">
                        Transcribing with Azure Speech...
                      </p>
                    </div>
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
                        Click to start answering this question.
                      </p>
                    </div>
                  )}

                  {/* Answered State: Question Answer Already Uploaded & Saved */}
                  {!isRecording && !isUploading && uploadStage === "idle" && hasRecordedAnswer && (
                    <div className="recording-status-box answer-uploaded">
                      <div className="uploaded-badge-circle">
                        <FaCheckCircle />
                      </div>
                      <h3 className="uploaded-title">✓ Answer Recorded Successfully</h3>
                      <p className="uploaded-subtext">
                        Your response for this question has been saved.
                      </p>
                      <button
                        className="rerecord-btn"
                        onClick={startRecording}
                      >
                        <FaMicrophone /> Re-record Answer
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
              </div>

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

  if (state === "submitting") {
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
            {SUBMIT_STEPS.map((step, idx) => {
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

  if (state === "submit-error") {
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
            <button
              className="nav-btn secondary"
              onClick={() => setState("active")}
            >
              Cancel & Return
            </button>
            <button className="nav-btn primary" onClick={handleFinish}>
              <FaPlayCircle /> Retry Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "results") {
    const verdict = getScoreVerdict(interview.overallScore);
    const scoreAngle = getScoreAngle(interview.overallScore);

    return (
      <div className="session-container">
        <div className="session-card results-layout">
          <div className="results-header-summary">
            <div className="results-title">
              <h1>Interview Performance Review</h1>
              <p>Detailed breakdown and scores computed by Gemini AI.</p>
            </div>

            <div className="score-summary-box">
              <div
                className="score-gauge-ring"
                style={{ "--score-angle": scoreAngle }}
              >
                <div className="score-gauge-inner">
                  <span className="score-num">
                    {interview.overallScore.toFixed(1)}
                  </span>
                  <span className="score-max">/ 10</span>
                </div>
              </div>
              <div className="score-verdict">
                <span className="score-label">Evaluation Verdict</span>
                <span className={`score-text-val ${verdict}`}>
                  {getVerdictLabel(verdict)}
                </span>
              </div>
            </div>
          </div>

          <div className="results-meta-row">
            <div className="results-meta-card">
              <FaBriefcase />
              <div className="results-meta-info">
                <span className="results-meta-label">Job Role</span>
                <span className="results-meta-value">{interview.jobRole}</span>
              </div>
            </div>

            <div className="results-meta-card">
              <FaGraduationCap />
              <div className="results-meta-info">
                <span className="results-meta-label">Experience</span>
                <span className="results-meta-value">
                  {interview.experienceLevel}
                </span>
              </div>
            </div>

            <div className="results-meta-card">
              <FaCogs />
              <div className="results-meta-info">
                <span className="results-meta-label">Difficulty</span>
                <span className="results-meta-value">
                  {interview.difficulty}
                </span>
              </div>
            </div>

            <div className="results-meta-card">
              <FaCalendarAlt />
              <div className="results-meta-info">
                <span className="results-meta-label">Date Evaluated</span>
                <span className="results-meta-value">
                  {new Date(interview.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="qna-feedback-section">
            <h2>Detailed Question Feedback</h2>

            <div className="qna-feedback-list">
              {interview.questions.map((q, idx) => {
                const questionVerdict = getScoreVerdict(q.score);
                const scoreClass =
                  questionVerdict === "Excellent"
                    ? "excellent-score"
                    : questionVerdict === "Good"
                      ? "good-score"
                      : questionVerdict === "Average"
                        ? "average-score"
                        : "poor-score";

                return (
                  <div
                    key={q._id}
                    className={`qna-feedback-item ${scoreClass}`}
                  >
                    <div className="qna-header-row">
                      <h4 className="qna-question-title">
                        {idx + 1}. {q.question}
                      </h4>
                      <span className="qna-score-badge">
                        <FaTrophy /> Score: {q.score} / 10
                      </span>
                    </div>

                    <div className="qna-content-box">
                      <div className="qna-block answer">
                        <span className="block-title">Your Answer</span>
                        {q.answer?.trim() ? (
                          <p className="block-text">{q.answer}</p>
                        ) : (
                          <p className="block-text empty-ans">
                            No answer was provided for this question.
                          </p>
                        )}
                      </div>

                      <div className="qna-block feedback">
                        <span className="block-title">
                          AI Feedback & Evaluation
                        </span>
                        <div className="block-text">
                          <ReactMarkdown>
                            {q.feedback || "Evaluating feedback..."}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="results-actions">
            <button
              className="action-btn secondary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
            <button
              className="action-btn primary"
              onClick={() => navigate("/create-interview")}
            >
              Start New Mock Session
            </button>
          </div>
        </div>
      </div>
    );
  }
}
