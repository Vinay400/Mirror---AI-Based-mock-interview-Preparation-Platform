import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FaBriefcase,
  FaGraduationCap,
  FaCogs,
  FaCalendarAlt,
  FaCode,
  FaLightbulb,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBookOpen,
  FaTags,
  FaLanguage,
  FaSpellCheck,
  FaTachometerAlt,
  FaClock,
  FaComments,
  FaMicrophone,
  FaAward,
  FaBrain,
  FaTrophy,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { isCodingQuestion } from "../../utils/questionUtils";

export default function InterviewResults({
  interview,
  onGoToDashboard,
  onStartNewInterview,
}) {
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const toggleQuestionExpand = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: prev[qId] === undefined ? false : !prev[qId],
    }));
  };

  const normalizeScore100 = (score) => {
    if (typeof score !== "number") return 0;
    if (score > 0 && score <= 10) return Math.round(score * 10);
    return Math.round(score);
  };

  const getRecommendationBadgeClass = (rec) => {
    switch (rec) {
      case "Strong Hire":
        return "recommendation-strong-hire";
      case "Hire":
        return "recommendation-hire";
      case "Borderline":
        return "recommendation-borderline";
      case "Needs Improvement":
      default:
        return "recommendation-needs-improvement";
    }
  };

  const formatSeconds = (sec) => {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    const mins = Math.floor(s / 60);
    const remainingSecs = s % 60;
    if (mins > 0) {
      return `${mins}m ${remainingSecs}s`;
    }
    return `${remainingSecs}s`;
  };

  const getScoreVerdict = (score) => {
    const s = normalizeScore100(score);
    if (s >= 85) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Average";
    return "NeedsImprovement";
  };

  const overall100 = normalizeScore100(interview.overallScore);
  const tech100 = normalizeScore100(
    interview.technicalScore !== undefined ? interview.technicalScore : interview.overallScore
  );
  const prob100 = normalizeScore100(
    interview.problemSolvingScore !== undefined ? interview.problemSolvingScore : interview.overallScore
  );

  const commData = interview.communication || {};
  const commGrammar = typeof commData.grammar === "number" ? normalizeScore100(commData.grammar) : null;
  const commClarity = typeof commData.clarity === "number" ? normalizeScore100(commData.clarity) : null;
  const commStructure = typeof commData.structure === "number" ? normalizeScore100(commData.structure) : null;
  const commCompleteness = typeof commData.completeness === "number" ? normalizeScore100(commData.completeness) : null;
  const commVocabulary = typeof commData.vocabulary === "number" ? normalizeScore100(commData.vocabulary) : null;
  const commSummary = commData.summary?.trim() || null;

  const speakingData = interview.speakingAnalytics || {};
  const totalSpeakingTime = typeof speakingData.totalSpeakingTime === "number" ? speakingData.totalSpeakingTime : null;
  const totalWordCount = typeof speakingData.totalWordCount === "number" ? speakingData.totalWordCount : null;
  const avgWpm = typeof speakingData.averageWordsPerMinute === "number" ? speakingData.averageWordsPerMinute : null;
  const overallPace = speakingData.overallPace || null;

  const formatMetricText = (val) => (val !== null ? `${val}/100` : "Not Available");
  const formatMetricBarWidth = (val) => (val !== null ? `${val}%` : "0%");
  const formatQCommMetric = (val) => (typeof val === "number" ? `${normalizeScore100(val)}/100` : "—");

  const recommendationText =
    interview.recommendation ||
    (overall100 >= 85
      ? "Strong Hire"
      : overall100 >= 70
      ? "Hire"
      : overall100 >= 50
      ? "Borderline"
      : "Needs Improvement");

  const recBadgeClass = getRecommendationBadgeClass(recommendationText);

  return (
    <div className="session-container">
      <div className="session-card results-layout">
        {/* HERO SUMMARY */}
        <div className="results-header-summary">
          <div className="results-title">
            <div className="title-with-badge">
              <h1>Interview Performance Dashboard</h1>
              <span className={`recommendation-badge ${recBadgeClass}`}>
                <FaAward className="badge-icon" /> {recommendationText}
              </span>
            </div>
            <p>
              Comprehensive report evaluated for {interview.jobRole} (
              {interview.experienceLevel} level).
            </p>
          </div>
        </div>

        <div className="hero-overall-card">
          <div className="hero-score-ring">
            <span className="hero-score-num">{overall100}</span>
            <span className="hero-score-max">/ 100</span>
          </div>
          <div className="hero-summary-text">
            <h3>
              <FaBrain /> Executive AI Summary
            </h3>
            <p>{interview.summary || "Comprehensive evaluation completed."}</p>
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

        {/* SECTION 1 — TECHNICAL EVALUATION */}
        <div className="report-section-card technical-section">
          <div className="section-header">
            <h2>
              <FaCode className="section-icon" /> SECTION 1 — Technical Evaluation
            </h2>
            <span className="section-badge">Gemini AI</span>
          </div>

          <div className="analytics-metrics-grid">
            <div className="metric-card technical">
              <div className="metric-header">
                <span className="metric-title">Technical Knowledge</span>
                <FaCode className="metric-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">{tech100}</span>
                <span className="metric-max">/ 100</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill technical"
                  style={{ width: `${tech100}%` }}
                />
              </div>
            </div>

            <div className="metric-card problem-solving">
              <div className="metric-header">
                <span className="metric-title">Problem Solving</span>
                <FaLightbulb className="metric-icon" />
              </div>
              <div className="metric-value-row">
                <span className="metric-number">{prob100}</span>
                <span className="metric-max">/ 100</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill problem-solving"
                  style={{ width: `${prob100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="insights-grid">
            {interview.strengths && interview.strengths.length > 0 && (
              <div className="insight-card strengths">
                <h3>
                  <FaCheckCircle className="insight-icon strength-color" /> Key Strengths
                </h3>
                <ul className="insight-list">
                  {interview.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {interview.improvementAreas && interview.improvementAreas.length > 0 && (
              <div className="insight-card improvements">
                <h3>
                  <FaExclamationTriangle className="insight-icon warning-color" /> Actionable Improvements
                </h3>
                <ul className="insight-list">
                  {interview.improvementAreas.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {interview.recommendedTopics && interview.recommendedTopics.length > 0 && (
            <div className="topics-section">
              <h3>
                <FaBookOpen className="topics-icon" /> Recommended Study Topics
              </h3>
              <div className="topics-chips-row">
                {interview.recommendedTopics.map((topic, i) => (
                  <span key={i} className="topic-chip">
                    <FaTags className="chip-icon" /> {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2 — LANGUAGE & COMMUNICATION EVALUATION */}
        <div className="report-section-card communication-section">
          <div className="section-header">
            <h2>
              <FaLanguage className="section-icon" /> SECTION 2 — Language & Communication Evaluation
            </h2>
            <span className="section-badge">Transcript Analysis</span>
          </div>

          <div className="comm-scores-grid">
            <div className="comm-metric-item">
              <div className="comm-metric-header">
                <span>Grammar Accuracy</span>
                <span className="comm-val">{formatMetricText(commGrammar)}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill communication"
                  style={{ width: formatMetricBarWidth(commGrammar) }}
                />
              </div>
            </div>

            <div className="comm-metric-item">
              <div className="comm-metric-header">
                <span>Clarity & Expression</span>
                <span className="comm-val">{formatMetricText(commClarity)}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill communication"
                  style={{ width: formatMetricBarWidth(commClarity) }}
                />
              </div>
            </div>

            <div className="comm-metric-item">
              <div className="comm-metric-header">
                <span>Explanation Structure</span>
                <span className="comm-val">{formatMetricText(commStructure)}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill communication"
                  style={{ width: formatMetricBarWidth(commStructure) }}
                />
              </div>
            </div>

            <div className="comm-metric-item">
              <div className="comm-metric-header">
                <span>Completeness</span>
                <span className="comm-val">{formatMetricText(commCompleteness)}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill communication"
                  style={{ width: formatMetricBarWidth(commCompleteness) }}
                />
              </div>
            </div>

            <div className="comm-metric-item full-width">
              <div className="comm-metric-header">
                <span>Vocabulary Usage</span>
                <span className="comm-val">{formatMetricText(commVocabulary)}</span>
              </div>
              <div className="metric-bar-bg">
                <div
                  className="metric-bar-fill communication"
                  style={{ width: formatMetricBarWidth(commVocabulary) }}
                />
              </div>
            </div>
          </div>

          {commSummary ? (
            <div className="comm-summary-box">
              <h4>
                <FaSpellCheck /> Communication Summary
              </h4>
              <p>{commSummary}</p>
            </div>
          ) : (
            <div className="comm-summary-box">
              <h4>
                <FaSpellCheck /> Communication Summary
              </h4>
              <p style={{ color: "#94a3b8", italic: "true" }}>Not Available</p>
            </div>
          )}
        </div>

        {/* SECTION 3 — SPEAKING ANALYTICS (COMPUTED METRICS) */}
        <div className="report-section-card analytics-section">
          <div className="section-header">
            <h2>
              <FaTachometerAlt className="section-icon" /> SECTION 3 — Speaking Analytics
            </h2>
            <span className="section-badge computed">Objective Audio Metrics</span>
          </div>

          <div className="speaking-stats-grid">
            <div className="stat-card">
              <FaClock className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Total Speaking Time</span>
                <span className="stat-value">{totalSpeakingTime !== null ? formatSeconds(totalSpeakingTime) : "—"}</span>
              </div>
            </div>

            <div className="stat-card">
              <FaComments className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Total Word Count</span>
                <span className="stat-value">{totalWordCount !== null ? `${totalWordCount} words` : "—"}</span>
              </div>
            </div>

            <div className="stat-card">
              <FaTachometerAlt className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Average WPM</span>
                <span className="stat-value">{avgWpm !== null ? `${avgWpm} WPM` : "—"}</span>
              </div>
            </div>

            <div className="stat-card">
              <FaMicrophone className="stat-icon" />
              <div className="stat-info">
                <span className="stat-label">Speaking Pace</span>
                <span className={`pace-badge ${overallPace ? overallPace.toLowerCase() : "na"}`}>{overallPace ? `${overallPace} Pace` : "Not Available"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION-BY-QUESTION REVIEW */}
        <div className="qna-feedback-section">
          <h2>Question-by-Question Detailed Review</h2>

          <div className="qna-feedback-list">
            {interview.questions.map((q, idx) => {
              const qIdKey = q._id || idx;
              const isCollapsed = expandedQuestions[qIdKey] === true;
              const qScore100 = normalizeScore100(q.score);
              const questionVerdict = getScoreVerdict(qScore100);
              const scoreClass =
                questionVerdict === "Excellent"
                  ? "excellent-score"
                  : questionVerdict === "Good"
                  ? "good-score"
                  : questionVerdict === "Average"
                  ? "average-score"
                  : "poor-score";

              const qComm = q.communication || {};
              const qSpeaking = q.speakingAnalytics || {};
              const isCodingQ = isCodingQuestion(q);

              return (
                <div
                  key={qIdKey}
                  className={`qna-feedback-item ${scoreClass}`}
                >
                  <div
                    className="qna-header-row clickable"
                    onClick={() => toggleQuestionExpand(qIdKey)}
                  >
                    <div className="qna-title-group">
                      <span className="qna-num">Q{idx + 1}</span>
                      {q.topic && (
                        <span className="qna-topic-badge">{q.topic}</span>
                      )}
                      <h4 className="qna-question-title">{q.question}</h4>
                    </div>

                    <div className="qna-header-right">
                      <span className="qna-score-badge">
                        <FaTrophy /> {qScore100} / 100
                      </span>
                      <button className="expand-toggle-btn">
                        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="qna-content-box">
                      {/* Transcripts */}
                      <div className="qna-block answer">
                        <div className="block-title-row">
                          <span className="block-title">Candidate Response</span>
                          {q.transcriptConfidence !== undefined &&
                            q.transcriptConfidence !== null && (
                              <span className="confidence-badge">
                                ASR Confidence: {q.transcriptConfidence}/10
                              </span>
                            )}
                        </div>
                        {q.userCode?.trim() && (
                          <div className="code-answer-box" style={{ background: "#0f172a", color: "#e2e8f0", padding: "1rem", borderRadius: "8px", overflowX: "auto", fontFamily: "monospace", fontSize: "0.9rem", marginBottom: (q.transcriptCorrected?.trim() || q.answer?.trim() || q.transcriptRaw?.trim()) ? "0.75rem" : "0" }}>
                            <pre style={{ margin: 0 }}><code>{q.userCode}</code></pre>
                          </div>
                        )}
                        {(q.transcriptCorrected?.trim() || q.answer?.trim() || q.transcriptRaw?.trim()) ? (
                          <div className="transcript-box" style={{ marginTop: q.userCode?.trim() ? "0.5rem" : "0" }}>
                            {q.userCode?.trim() && (
                              <span className="raw-label" style={{ fontWeight: "600", color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                                Spoken Explanation:
                              </span>
                            )}
                            <p className="block-text">
                              {q.transcriptCorrected || q.answer || q.transcriptRaw}
                            </p>
                          </div>
                        ) : !q.userCode?.trim() && (
                          <p className="block-text empty-ans">
                            No answer provided.
                          </p>
                        )}
                        {q.transcriptRaw &&
                          q.transcriptCorrected &&
                          q.transcriptRaw !== q.transcriptCorrected && (
                            <div className="raw-vs-corrected">
                              <span className="raw-label">Raw Azure Transcript:</span>{" "}
                              {q.transcriptRaw}
                            </div>
                          )}
                      </div>

                      {/* Technical Feedback */}
                      <div className="qna-block feedback">
                        <span className="block-title">Technical Feedback</span>
                        <div className="block-text">
                          <ReactMarkdown>
                            {q.feedback || "Evaluating feedback..."}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Question Communication Breakdown (Omitted for Coding Questions) */}
                      {!isCodingQ && (
                        <div className="qna-block comm-breakdown-block">
                          <span className="block-title">Language & Communication Breakdown</span>
                          <div className="mini-comm-row">
                            <span className="mini-comm-chip">Grammar: {formatQCommMetric(qComm.grammar)}</span>
                            <span className="mini-comm-chip">Clarity: {formatQCommMetric(qComm.clarity)}</span>
                            <span className="mini-comm-chip">Structure: {formatQCommMetric(qComm.structure)}</span>
                            <span className="mini-comm-chip">Completeness: {formatQCommMetric(qComm.completeness)}</span>
                            <span className="mini-comm-chip">Vocabulary: {formatQCommMetric(qComm.vocabulary)}</span>
                          </div>
                        </div>
                      )}

                      {/* Model / Ideal Answer */}
                      {q.idealAnswer && (
                        <div className="qna-block ideal-answer">
                          <span className="block-title">Model Answer</span>
                          <p className="block-text">{q.idealAnswer}</p>
                        </div>
                      )}

                      {/* Missed Concepts */}
                      {q.missedConcepts && q.missedConcepts.length > 0 && (
                        <div className="qna-block missed-concepts">
                          <span className="block-title">Missed Concepts</span>
                          <div className="missed-chips-row">
                            {q.missedConcepts.map((concept, ci) => (
                              <span key={ci} className="missed-chip">
                                ✕ {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question Speaking Analytics */}
                      {(!isCodingQ || (typeof qSpeaking.duration === "number" && qSpeaking.duration > 0)) && (
                        <div className="qna-block speaking-analytics-block">
                          <span className="block-title">Speaking Analytics</span>
                          <div className="mini-speaking-row">
                            <span>Duration: <strong>{typeof qSpeaking.duration === "number" ? formatSeconds(qSpeaking.duration) : "—"}</strong></span>
                            <span>Word Count: <strong>{typeof qSpeaking.wordCount === "number" ? `${qSpeaking.wordCount} words` : "—"}</strong></span>
                            <span>Pace: <strong>{typeof qSpeaking.wordsPerMinute === "number" ? `${qSpeaking.wordsPerMinute} WPM` : "—"} ({qSpeaking.pace || "—"})</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="results-actions">
          <button
            className="action-btn secondary"
            onClick={onGoToDashboard}
          >
            Go to Dashboard
          </button>
          <button
            className="action-btn primary"
            onClick={onStartNewInterview}
          >
            Start New Mock Session
          </button>
        </div>
      </div>
    </div>
  );
}
