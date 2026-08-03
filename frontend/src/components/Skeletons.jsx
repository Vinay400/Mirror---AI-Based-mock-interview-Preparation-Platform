import React from "react";
import "../styles/Skeletons.css";

/**
 * Reusable Base Skeleton Box with shimmer animation
 */
export function SkeletonBox({ width, height, borderRadius, className = "", style = {} }) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
        borderRadius: borderRadius || "8px",
        ...style,
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading content..."
    />
  );
}

export function SkeletonText({ lines = 1, type = "normal", width, className = "" }) {
  return (
    <div className={`skeleton-text-group ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`skeleton-text ${type} ${i === lines - 1 && lines > 1 ? "short" : ""}`}
          width={width}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = "40px", className = "" }) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius="50%"
      className={`skeleton-circle ${className}`}
    />
  );
}

export function SkeletonButton({ width = "130px", height = "44px", className = "" }) {
  return <SkeletonBox width={width} height={height} borderRadius="12px" className={className} />;
}

export function SkeletonCard({ children, className = "" }) {
  return <div className={`skeleton-card ${className}`}>{children}</div>;
}

/**
 * Global Navbar Skeleton
 */
export function SkeletonNavbar() {
  return (
    <nav className="skeleton-navbar">
      <div className="skeleton-nav-brand">
        <SkeletonCircle size="36px" />
        <SkeletonBox width="140px" height="24px" />
      </div>
      <div className="skeleton-nav-links">
        <SkeletonBox width="80px" height="18px" />
        <SkeletonBox width="80px" height="18px" />
        <SkeletonCircle size="38px" />
      </div>
    </nav>
  );
}

/**
 * Sidebar Step List Skeleton for Interview Session
 */
export function SkeletonSidebar() {
  return (
    <div className="session-skeleton-sidebar">
      {/* Camera preview skeleton */}
      <SkeletonBox width="100%" height="160px" borderRadius="14px" />

      {/* Timer skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: "10px" }}>
        <SkeletonBox width="80px" height="16px" />
        <SkeletonBox width="60px" height="22px" />
      </div>

      {/* Questions progress step list */}
      <SkeletonBox width="110px" height="16px" style={{ marginTop: "0.5rem" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-step-item">
            <SkeletonCircle size="28px" />
            <SkeletonBox width="100px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard Statistic & History Card Skeleton
 */
export function SkeletonDashboardCard() {
  return (
    <SkeletonCard>
      <div className="stat-card-skeleton">
        <SkeletonCircle size="48px" />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="70%" height="14px" style={{ marginBottom: "6px" }} />
          <SkeletonBox width="40%" height="24px" />
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Question Panel Skeleton (Header badge + question text lines)
 */
export function SkeletonQuestionCard() {
  return (
    <SkeletonCard className="skeleton-question-panel">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <SkeletonBox width="120px" height="28px" borderRadius="50px" />
        <SkeletonBox width="100px" height="28px" borderRadius="8px" />
      </div>
      <SkeletonText lines={2} type="title" width="95%" />
    </SkeletonCard>
  );
}

/**
 * Recording Panel Skeleton for Audio Uploading state
 */
export function SkeletonRecordingPanel({ message = "Uploading your response..." }) {
  return (
    <div className="skeleton-card recording-skeleton-panel">
      <SkeletonCircle size="52px" />
      <SkeletonBox width="200px" height="20px" />
      <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b", fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
}

/**
 * Transcript Block Skeleton for Azure Speech Transcription state
 */
export function SkeletonTranscriptBlock({ message = "Converting speech to text..." }) {
  return (
    <div className="transcript-skeleton-block">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <SkeletonCircle size="24px" />
        <span style={{ fontSize: "0.95rem", color: "#2563eb", fontWeight: 600 }}>{message}</span>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <SkeletonBox width="100%" height="14px" />
        <SkeletonBox width="85%" height="14px" />
        <SkeletonBox width="60%" height="14px" />
      </div>
    </div>
  );
}

/**
 * Complete Interview Session Screen Skeleton Layout
 */
export function SkeletonInterviewScreen() {
  return (
    <div className="session-container" role="status" aria-busy="true" aria-label="Preparing interview session...">
      <div className="session-card">
        <div className="session-skeleton-layout">
          <SkeletonSidebar />
          <div className="session-skeleton-main">
            <SkeletonQuestionCard />
            <SkeletonCard className="recording-skeleton-panel">
              <SkeletonCircle size="64px" />
              <SkeletonBox width="180px" height="22px" />
              <SkeletonBox width="240px" height="14px" />
            </SkeletonCard>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <SkeletonButton width="110px" />
              <SkeletonButton width="140px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Interview Form Generation Skeleton Overlay
 */
export function SkeletonFormOverlay() {
  return (
    <div className="interview-container" role="status" aria-busy="true" aria-label="Generating interview questions...">
      <div className="create-interview-skeleton-card">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <SkeletonCircle size="60px" />
          <h2 style={{ margin: "0.5rem 0 0.25rem 0", color: "#1e293b", fontSize: "1.6rem", fontWeight: 700 }}>
            Preparing your interview...
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Generating personalized interview questions based on your profile.
          </p>
        </div>

        <div className="create-skeleton-form">
          <SkeletonBox height="44px" borderRadius="10px" />
          <div className="create-skeleton-row">
            <SkeletonBox height="44px" borderRadius="10px" />
            <SkeletonBox height="44px" borderRadius="10px" />
          </div>
          <div className="create-skeleton-row">
            <SkeletonBox height="44px" borderRadius="10px" />
            <SkeletonBox height="44px" borderRadius="10px" />
          </div>
          <SkeletonBox height="70px" borderRadius="10px" />
          <SkeletonButton width="100%" height="48px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Results Dashboard Skeleton Layout
 */
export function SkeletonResultsDashboard() {
  return (
    <div className="session-container" role="status" aria-busy="true" aria-label="Loading evaluation results...">
      <div className="session-card">
        <div className="results-skeleton-header">
          <div>
            <SkeletonBox width="280px" height="28px" style={{ marginBottom: "8px" }} />
            <SkeletonBox width="360px" height="16px" />
          </div>
          <SkeletonBox width="160px" height="60px" borderRadius="16px" />
        </div>

        <div className="results-skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <SkeletonCircle size="36px" />
                <div style={{ flex: 1 }}>
                  <SkeletonBox width="50%" height="12px" style={{ marginBottom: "6px" }} />
                  <SkeletonBox width="80%" height="18px" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>

        <div className="results-skeleton-qna">
          <SkeletonBox width="220px" height="24px" style={{ marginBottom: "0.5rem" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox width="60%" height="20px" style={{ marginBottom: "1rem" }} />
              <SkeletonBox width="100%" height="50px" borderRadius="8px" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
