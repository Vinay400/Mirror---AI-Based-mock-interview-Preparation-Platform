import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBriefcase,
  FaGraduationCap,
  FaCogs,
  FaPlus,
  FaTrophy,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { getUserInterviews } from "../api/interviewApi";
import { getToken } from "../utils/auth";
import {
  SkeletonNavbar,
  SkeletonCard,
  SkeletonBox,
  SkeletonCircle,
} from "../components/Skeletons";
import "../styles/InterviewSession.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterviews = async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getUserInterviews();
      setInterviews(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user interviews:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load your interview dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(
    (i) => i.status === "Completed"
  ).length;

  const validScores = interviews
    .filter((i) => typeof i.overallScore === "number" && i.overallScore > 0)
    .map((i) => i.overallScore);

  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : "N/A";

  if (loading) {
    return (
      <div className="dashboard-page-wrapper">
        <SkeletonNavbar />
        <div className="dashboard-skeleton-container" role="status" aria-busy="true" aria-label="Loading dashboard...">
          <div className="dashboard-skeleton-header">
            <div>
              <SkeletonBox width="260px" height="28px" style={{ marginBottom: "8px" }} />
              <SkeletonBox width="340px" height="16px" />
            </div>
            <SkeletonBox width="180px" height="44px" borderRadius="12px" />
          </div>

          {/* Stats Skeletons */}
          <div className="dashboard-skeleton-stats">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <SkeletonCircle size="48px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonBox width="60%" height="12px" style={{ marginBottom: "6px" }} />
                    <SkeletonBox width="40%" height="22px" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>

          {/* History Skeletons */}
          <div className="dashboard-skeleton-list">
            <SkeletonBox width="200px" height="22px" style={{ marginBottom: "0.5rem" }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <SkeletonCircle size="40px" />
                    <div>
                      <SkeletonBox width="180px" height="18px" style={{ marginBottom: "6px" }} />
                      <SkeletonBox width="120px" height="14px" />
                    </div>
                  </div>
                  <SkeletonBox width="100px" height="32px" borderRadius="8px" />
                </div>
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-container">
        <div className="session-card loading-wrapper error-card">
          <div className="error-icon-box">
            <FaExclamationTriangle />
          </div>
          <h2 className="error-title">Could not load dashboard</h2>
          <p className="error-subtitle">{error}</p>
          <button className="nav-btn primary" onClick={fetchInterviews}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-wrapper">
      <header className="dashboard-navbar">
        <div className="nav-brand" onClick={() => navigate("/dashboard")}>
          <span className="brand-icon">🤖</span>
          <span className="brand-text">AI Mock Interview</span>
        </div>
        <div className="nav-actions">
          <button
            className="nav-btn primary"
            onClick={() => navigate("/create-interview")}
          >
            <FaPlus /> Start New Interview
          </button>
        </div>
      </header>

      <main className="dashboard-main-container">
        <div className="dashboard-header-row">
          <div>
            <h1>Dashboard & Analytics</h1>
            <p>Track your AI mock interview practice history and scores.</p>
          </div>
          <button
            className="start-btn"
            style={{ width: "auto", padding: "0.85rem 1.5rem" }}
            onClick={() => navigate("/create-interview")}
          >
            <FaPlus /> New Interview
          </button>
        </div>

        {/* Statistic Cards */}
        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-badge blue">
              <FaBriefcase />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Sessions</span>
              <span className="stat-value">{totalInterviews}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-badge green">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{completedInterviews}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-badge gold">
              <FaTrophy />
            </div>
            <div className="stat-info">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{avgScore} {avgScore !== "N/A" && "/ 10"}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-badge purple">
              <FaClock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Practice Active</span>
              <span className="stat-value">{totalInterviews > 0 ? "Active" : "Ready"}</span>
            </div>
          </div>
        </div>

        {/* Interview History List */}
        <div className="history-section">
          <h2>Interview History</h2>

          {interviews.length === 0 ? (
            <div className="empty-dashboard-card">
              <div className="empty-icon-circle">
                <FaBriefcase />
              </div>
              <h3>No Mock Interviews Found</h3>
              <p>Create your first AI-generated mock interview to start practicing.</p>
              <button
                className="nav-btn primary"
                onClick={() => navigate("/create-interview")}
                style={{ marginTop: "1rem" }}
              >
                <FaPlus /> Create Mock Interview
              </button>
            </div>
          ) : (
            <div className="history-cards-list">
              {interviews.map((item) => (
                <div
                  key={item._id}
                  className="history-card-item"
                  onClick={() => navigate(`/interview/${item._id}`)}
                >
                  <div className="history-item-left">
                    <div className="history-role-icon">
                      <FaBriefcase />
                    </div>
                    <div className="history-item-details">
                      <h4 className="history-job-role">{item.jobRole}</h4>
                      <div className="history-tags">
                        <span className="history-tag">
                          <FaGraduationCap /> {item.experienceLevel}
                        </span>
                        <span className="history-tag">
                          <FaCogs /> {item.difficulty}
                        </span>
                        <span className="history-tag">
                          <FaCalendarAlt />{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="history-item-right">
                    {item.status === "Completed" &&
                    typeof item.overallScore === "number" ? (
                      <div className="history-score-badge">
                        <span className="score-val">
                          {item.overallScore.toFixed(1)}
                        </span>
                        <span className="score-max">/ 10</span>
                      </div>
                    ) : (
                      <span className="pending-badge">In Progress</span>
                    )}
                    <button className="view-btn">
                      View <FaArrowRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}