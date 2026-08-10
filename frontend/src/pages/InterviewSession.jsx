import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import { getInterview, submitInterview, uploadAudio } from "../api/interviewApi";
import { SkeletonInterviewScreen } from "../components/Skeletons";
import InterviewSetup from "../components/interview/InterviewSetup";
import InterviewActive from "../components/interview/InterviewActive";
import InterviewSubmitting from "../components/interview/InterviewSubmitting";
import InterviewResults from "../components/interview/InterviewResults";
import { isCodingQuestion } from "../utils/questionUtils";
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
  const recTimerRef = useRef(0);

  useEffect(() => {
    recTimerRef.current = recTimer;
  }, [recTimer]);

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const SUBMIT_STEPS = [
    { id: "saving", label: "Saving interview" },
    { id: "transcripts", label: "Processing transcripts" },
    { id: "evaluating", label: "Evaluating technical knowledge" },
    { id: "communication", label: "Analyzing communication" },
    { id: "speaking", label: "Computing speaking analytics" },
    { id: "report", label: "Preparing your report" },
  ];

  const [uploadStage, setUploadStage] = useState("idle"); // "idle" | "uploading" | "transcribing"
  const [audioStream, setAudioStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pendingActionRef = useRef(null);
  const [answers, setAnswers] = useState({});
  const [audioAnswers, setAudioAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  const [languageAnswers, setLanguageAnswers] = useState({});

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const res = await getInterview(id);
        setInterview(res.data);

        // Populate pre-existing answers if any
        const prefilledAnswers = {};
        const prefilledCode = {};
        const prefilledLangs = {};
        res.data.questions.forEach((q) => {
          prefilledAnswers[q._id] = q.answer || "";
          if (q.userCode) {
            prefilledCode[q._id] = q.userCode;
          }
          if (q.language) {
            prefilledLangs[q._id] = q.language;
          }
        });
        setAnswers(prefilledAnswers);
        setCodeAnswers(prefilledCode);
        setLanguageAnswers(prefilledLangs);

        if (res.data.status === "Completed") {
          setState("results");
        }
      } catch (err) {
        console.error("Failed to load interview details", err);
        setError(
          "Could not load the interview details. It might not exist or you may not be authenticated."
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
        interview.questions[activeQuestionIndex].question
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

          const durationSeconds = recTimerRef.current || 0;
          const formData = new FormData();
          formData.append("audio", blob, "answer.webm");
          formData.append("interviewId", id);
          formData.append("questionId", activeQuestionIdRef.current);
          formData.append("duration", durationSeconds);

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

  const handleCodeChange = (qId, code) => {
    setCodeAnswers((prev) => ({
      ...prev,
      [qId]: code,
    }));
  };

  const handleLanguageChange = (qId, lang) => {
    setLanguageAnswers((prev) => ({
      ...prev,
      [qId]: lang,
    }));
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

      const stepInterval = setInterval(() => {
        setSubmitStep((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 1500);

      const formattedCodeAnswers = {};
      interview.questions.forEach((q) => {
        if (isCodingQuestion(q) || codeAnswers[q._id]) {
          formattedCodeAnswers[q._id] = {
            userCode: codeAnswers[q._id] || "",
            language: languageAnswers[q._id] || q.language || "cpp",
          };
        }
      });

      const res = await submitInterview(id, { codeAnswers: formattedCodeAnswers });

      clearInterval(stepInterval);
      setSubmitStep(5);

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

  const isQuestionAnswered = (qOrId) => {
    if (!qOrId) return false;
    const qObj = typeof qOrId === "object" ? qOrId : interview?.questions?.find((item) => item._id === qOrId);
    const qId = typeof qOrId === "object" ? qOrId._id : qOrId;
    if (!qId) return false;

    if (isCodingQuestion(qObj)) {
      const code = codeAnswers[qId];
      return typeof code === "string" && code.trim().length > 0;
    }

    return !!(
      audioAnswers[qId] ||
      (answers[qId] !== undefined && answers[qId] !== null && String(answers[qId]).length > 0)
    );
  };

  if (loading) {
    return <SkeletonInterviewScreen />;
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
      <InterviewSetup
        interview={interview}
        cameraEnabled={cameraEnabled}
        micEnabled={micEnabled}
        setCameraEnabled={setCameraEnabled}
        setMicEnabled={setMicEnabled}
        webcamRef={webcamRef}
        onStartInterview={handleStartInterview}
      />
    );
  }

  if (state === "active") {
    const currentQuestion = interview.questions[activeQuestionIndex];
    const hasRecordedAnswer = isQuestionAnswered(currentQuestion);

    return (
      <InterviewActive
        interview={interview}
        activeQuestionIndex={activeQuestionIndex}
        setActiveQuestionIndex={setActiveQuestionIndex}
        cameraEnabled={cameraEnabled}
        micEnabled={micEnabled}
        timer={timer}
        formatTime={formatTime}
        isUploading={isUploading}
        uploadStage={uploadStage}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        recTimer={recTimer}
        audioStream={audioStream}
        hasRecordedAnswer={hasRecordedAnswer}
        handlePrev={handlePrev}
        handleNext={handleNext}
        handleFinish={handleFinish}
        state={state}
        repeatQuestion={repeatQuestion}
        isQuestionAnswered={isQuestionAnswered}
        codeAnswers={codeAnswers}
        languageAnswers={languageAnswers}
        handleCodeChange={handleCodeChange}
        handleLanguageChange={handleLanguageChange}
      />
    );
  }

  if (state === "submitting") {
    return (
      <InterviewSubmitting
        submitSteps={SUBMIT_STEPS}
        submitStep={submitStep}
        isError={false}
      />
    );
  }

  if (state === "submit-error") {
    return (
      <InterviewSubmitting
        submitSteps={SUBMIT_STEPS}
        submitStep={submitStep}
        submitError={submitError}
        onRetry={handleFinish}
        onReturn={() => setState("active")}
        isError={true}
      />
    );
  }

  if (state === "results") {
    return (
      <InterviewResults
        interview={interview}
        onGoToDashboard={() => navigate("/dashboard")}
        onStartNewInterview={() => navigate("/create-interview")}
      />
    );
  }

  return null;
}
