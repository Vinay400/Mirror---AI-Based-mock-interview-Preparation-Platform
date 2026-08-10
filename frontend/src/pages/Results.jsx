import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInterview } from "../api/interviewApi";
import { SkeletonResultsDashboard } from "../components/Skeletons";
import InterviewResults from "../components/interview/InterviewResults";
import { FaExclamationTriangle } from "react-icons/fa";

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const res = await getInterview(id);
        setInterview(res.data);
      } catch (err) {
        console.error("Failed to load interview results:", err);
        setError("Could not load the interview results.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInterview();
    }
  }, [id]);

  if (loading) {
    return <SkeletonResultsDashboard />;
  }

  if (error || !interview) {
    return (
      <div className="session-container">
        <div className="session-card loading-wrapper error-card">
          <div className="error-icon-box">
            <FaExclamationTriangle />
          </div>
          <h2 className="error-title">Results Not Found</h2>
          <p className="error-subtitle">{error || "Could not find requested interview."}</p>
          <button className="nav-btn primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <InterviewResults
      interview={interview}
      onGoToDashboard={() => navigate("/dashboard")}
      onStartNewInterview={() => navigate("/create-interview")}
    />
  );
}