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
} from "react-icons/fa";
import { getInterview, submitInterview, uploadAudio } from "../api/interviewApi";
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
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
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

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;

    if (SpeechRecognition) {
      rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

rec.onresult = (event) => {
  const currentQId = activeQuestionIdRef.current;
  if (!currentQId) return;

  let finalTranscript = "";

  for (let i = 0; i < event.results.length; i++) {
    finalTranscript += event.results[i][0].transcript + " ";
  }

  setAnswers((prev) => ({
    ...prev,
    [currentQId]: finalTranscript.trim(),
  }));
};

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        console.log("Error:", e.error);
        console.log("Message:", e.message);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (rec) {
        rec.stop();
      }
    };
  }, []);
  //media Recorder
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

     mediaRecorder.onstop = async () => {
  const blob = new Blob(audioChunksRef.current, {
    type: "audio/webm",
  });

  const formData = new FormData();

  formData.append("audio", blob, "answer.webm");
  formData.append("interviewId", id);
  formData.append("questionId", activeQuestionIdRef.current);

  setIsUploading(true);

  try {
    const response = await uploadAudio(formData);

    // Replace browser transcript with Azure transcript
    setAnswers((prev) => ({
      ...prev,
      [activeQuestionIdRef.current]: response.data.transcript,
    }));

    // Store recorded audio locally (optional)
    setAudioAnswers((prev) => ({
      ...prev,
      [activeQuestionIdRef.current]: blob,
    }));

    console.log("Azure Response:", response.data);
    console.log("Azure Transcript:", response.data.transcript);

    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    console.log("Blob:", blob);
    console.log("Size:", blob.size);
    console.log("Type:", blob.type);

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
  } finally {
    audioChunksRef.current = [];
    setIsUploading(false);
  }
};

      } catch (err) {
        console.error("Failed to access microphone:", err);
        alert("Microphone access was denied or unavailable. Please allow microphone access and try again.");
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
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(
        "Web Speech dictation is not supported in this browser. Please type your answer instead.",
      );
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        audioChunksRef.current = [];

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start();
        }
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };
  const handleAnswerChange = (e) => {
    if (activeQuestionId) {
      setAnswers((prev) => ({
        ...prev,
        [activeQuestionId]: e.target.value,
      }));
    }
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
    recognitionRef.current.stop();
    return;
  }

  if (activeQuestionIndex < interview.questions.length - 1) {
    setActiveQuestionIndex((prev) => prev + 1);
  }
  
};

const handlePrev = () => {
  // Don't allow navigation while uploading
  if (isUploading) {
    alert("Please wait while your answer is being uploaded.");
    return;
  }

  // If currently recording, stop first.
  // Navigation will happen after upload completes.
  if (isRecording) {
    pendingActionRef.current = "prev";
    recognitionRef.current.stop();
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
  // Don't submit while an upload is already in progress
  if (isUploading) {
    alert("Please wait while your last answer is being uploaded.");
    return;
  }

  // If still recording, stop recording first.
  // The actual submission will happen from mediaRecorder.onstop()
  if (isRecording) {
    pendingActionRef.current = "finish";
    recognitionRef.current.stop();
    return;
  }

  try {
    setState("submitting");

    const res = await submitInterview(id);

    setInterview(res.data);
    setState("results");
  } catch (err) {
    console.error("Submit Interview Error:", err);

    alert(
      "Failed to submit and grade your responses. Please try submitting again."
    );

    setState("active");
  }
};

  const getScoreVerdict = (score) => {
    if (score >= 8.5) return "Excellent";
    if (score >= 7.0) return "Good";
    if (score >= 5.0) return "Average";
    return "NeedsImprovement";
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
                    Click <strong>Dictate Answer</strong> to respond by
                    speaking, or type directly into the box.
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
                    const isAnswered = !!(
                      answers[q._id] && answers[q._id].trim().length > 0
                    );
                    const isActive = idx === activeQuestionIndex;
                    return (
                      <div
                        key={q._id}
                        className={`progress-step-item ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                        onClick={() => {
                          if (isRecording && recognitionRef.current) {
                            recognitionRef.current.stop();
                            setIsRecording(false);
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

              <div className="answer-panel">
                <div className="answer-label-row">
                  <span className="answer-label">Your Response</span>
                  <button
                    className={`dictate-btn ${isRecording ? "recording" : ""}`}
                    onClick={toggleRecording}
                  >
                    <FaMicrophone />
                    {isRecording
                      ? "Listening... Click to Save"
                      : "Dictate Answer"}
                  </button>
                </div>

                <textarea
                  className="answer-textarea"
                  value={answers[currentQuestion._id] || ""}
                  onChange={handleAnswerChange}
                  placeholder="Type or dictate your answer to this question here..."
                />

                <div className="answer-meta">
                  <span>
                    {
                      (answers[currentQuestion._id] || "")
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{" "}
                    words
                  </span>
                </div>
              </div>

              <div className="navigation-panel">
                <button
                  className="nav-btn"
                  onClick={handlePrev}
                  disabled={activeQuestionIndex === 0}
                >
                  <FaArrowLeft /> Previous
                </button>

                {activeQuestionIndex < interview.questions.length - 1 ? (
                  <button className="nav-btn primary" onClick={handleNext}>
                    Next Question <FaArrowRight />
                  </button>
                ) : (
                  <button className="nav-btn finish" onClick={handleFinish}>
                    Finish & Submit <FaCheckCircle />
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
        <div className="session-card evaluation-animation">
          <div className="eval-ring-spinner" />
          <h2>AI Evaluator is scoring your interview...</h2>
          <p className="eval-status-msg">
            Analyzing accuracy, experience compatibility, and technical
            phrasing.
          </p>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            This might take up to a minute. Please don't close this tab.
          </span>
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
