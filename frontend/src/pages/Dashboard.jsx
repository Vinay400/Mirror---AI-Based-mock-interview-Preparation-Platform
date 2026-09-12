import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'
import Intro3DTransition from './Intro3DTransition'
import {
  getUserInterviews,
  getInterviewPresets,
  startCuratedInterview,
  getQuestionBank,
} from '../api/interviewApi'
import { removeToken } from '../utils/auth'

// ── Clean Nav items (no emojis) ────────────────────────────────────────────────
const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'interviews', label: 'Mock Sessions' },
  { id: 'analytics', label: 'Skill Analytics' },
  { id: 'question-bank', label: 'Question Bank' },
  { id: 'settings', label: 'Settings' },
]

export default function Dashboard({ session, onLogout }) {
  const navigate = useNavigate()

  const [showIntro, setShowIntro] = useState(() => {
    const hasSeen = window.sessionStorage.getItem('mirror-has-seen-intro')
    if (!hasSeen) {
      window.sessionStorage.setItem('mirror-has-seen-intro', 'true')
      return true
    }
    return false
  })

  const [activeNav, setActiveNav] = useState('dashboard')
  const [realInterviews, setRealInterviews] = useState([])
  const [loadingInterviews, setLoadingInterviews] = useState(true)

  // API-driven Presets State
  const [presets, setPresets] = useState([])
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [startingPresetId, setStartingPresetId] = useState(null)

  // API-driven Question Bank State
  const [dbQuestions, setDbQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [qFilter, setQFilter] = useState('All')

  const [sessionFilter, setSessionFilter] = useState('All')
  const [preferredType, setPreferredType] = useState('Technical')

  const displayName = session?.displayName || session?.email || 'Candidate'
  const firstName = displayName.split(' ')[0]
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'C'

  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. Fetch user interviews
      try {
        setLoadingInterviews(true)
        const res = await getUserInterviews()
        if (res?.data && Array.isArray(res.data)) {
          setRealInterviews(res.data)
        }
      } catch (err) {
        console.error('Failed to load user interviews:', err)
      } finally {
        setLoadingInterviews(false)
      }

      // 2. Fetch curated interview presets from DB
      try {
        setLoadingPresets(true)
        const presetsRes = await getInterviewPresets()
        if (presetsRes?.data && Array.isArray(presetsRes.data)) {
          setPresets(presetsRes.data)
        }
      } catch (err) {
        console.error('Failed to load interview presets:', err)
      } finally {
        setLoadingPresets(false)
      }

      // 3. Fetch Question Bank from DB
      try {
        setLoadingQuestions(true)
        const qRes = await getQuestionBank()
        if (qRes?.data && Array.isArray(qRes.data)) {
          setDbQuestions(qRes.data)
        }
      } catch (err) {
        console.error('Failed to load question bank:', err)
      } finally {
        setLoadingQuestions(false)
      }
    }

    loadDashboardData()
  }, [])

  // Calculate dynamic analytics strictly from backend user interviews
  const completedInterviews = realInterviews.filter(
    item => item.status === 'Completed' || item.overallScore > 0
  )

  const avgReadiness = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, item) => acc + (item.overallScore || 0), 0) / completedInterviews.length)
    : 0

  const avgTechnical = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, item) => acc + (item.technicalScore || item.overallScore || 0), 0) / completedInterviews.length)
    : 0

  const avgProblemSolving = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, item) => acc + (item.problemSolvingScore || item.overallScore || 0), 0) / completedInterviews.length)
    : 0

  const avgCommunication = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, item) => {
        const c = item.communication
        const val = c ? ((c.grammar || 0) + (c.clarity || 0) + (c.structure || 0)) / 3 : (item.overallScore || 0)
        return acc + val
      }, 0) / completedInterviews.length)
    : 0

  const avgWPM = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, item) => acc + (item.speakingAnalytics?.averageWordsPerMinute || 0), 0) / completedInterviews.length)
    : 0

  const filteredSessions = realInterviews.filter(item => {
    if (sessionFilter === 'Completed') return item.status === 'Completed' || item.overallScore > 0
    if (sessionFilter === 'Pending') return item.status === 'Pending' || (!item.overallScore && item.status !== 'Completed')
    return true
  })

  const filteredQuestions = dbQuestions.filter(q => {
    if (qFilter === 'All') return true
    if (qFilter === 'Frontend') return q.role?.includes('Frontend') || q.topic?.includes('React') || q.topic?.includes('Frontend')
    if (qFilter === 'Backend') return q.role?.includes('Backend') || q.topic?.includes('Node') || q.topic?.includes('API') || q.topic?.includes('Database')
    if (qFilter === 'System Design') return q.topic?.includes('System Design') || q.topic?.includes('Scalability') || q.topic?.includes('Distributed')
    if (qFilter === 'Behavioral') return q.mode === 'HR' || q.type === 'HR' || q.topic?.includes('Conflict') || q.topic?.includes('Leadership')
    return true
  })

  const handleLogoutAction = () => {
    removeToken()
    if (onLogout) onLogout()
    else navigate('/login')
  }

  // One-click Curated Start Interview Flow
  const handleStartCurated = async (preset) => {
    const identifier = preset._id || preset.slug
    try {
      setStartingPresetId(identifier)
      const res = await startCuratedInterview(identifier)
      if (res?.data?._id) {
        navigate(`/interview/${res.data._id}`)
      }
    } catch (err) {
      console.error('Failed to start curated interview:', err)
      alert(err.response?.data?.message || 'Failed to start curated interview. Please try again.')
    } finally {
      setStartingPresetId(null)
    }
  }

  // Custom AI Interview Flow
  const handleCustomInterview = () => {
    navigate('/create-interview')
  }

  return (
    <>
      {/* ── 3-Second 3D Entrance Effect ───────────────────────────────────── */}
      {showIntro && (
        <Intro3DTransition onComplete={() => setShowIntro(false)} />
      )}

      <div className="dash-shell">

        {/* ── Minimalist Sidebar ────────────────────────────────────────── */}
        <aside className="dash-sidebar">
          <div className="dash-brand-wrap">
            <div className="dash-brand">MIRROR</div>
            <span className="dash-brand-sub">Interview Platform</span>
          </div>

          <nav className="dash-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`dash-nav__item ${activeNav === item.id ? 'dash-nav__item--active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dash-sidebar__footer">
            <div className="dash-user">
              <div className="dash-user__avatar">{initials}</div>
              <div className="dash-user__info">
                <span className="dash-user__name">{displayName}</span>
                <span className="dash-user__role">{session?.email || 'Candidate Account'}</span>
              </div>
            </div>
            <button className="dash-logout-btn" onClick={handleLogoutAction} title="Log out">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M9 14l4-4-4-4M13 10H3" />
              </svg>
            </button>
          </div>
        </aside>

        {/* ── Main Area ─────────────────────────────────────────────────── */}
        <main className="dash-main">

          {/* Minimal Header Bar */}
          <header className="dash-topbar">
            <div className="dash-topbar__role-select">
              <span className="dash-topbar__label">Platform Workspace</span>
            </div>

            <div className="dash-topbar__right">
              <button className="dash-btn-secondary" onClick={() => setShowIntro(true)}>
                Replay Intro
              </button>
              <button className="dash-btn-primary" onClick={handleCustomInterview}>
                + Custom Interview
              </button>
            </div>
          </header>

          <div className="dash-content">

            {/* =========================================================================
                TAB 1: MAIN DASHBOARD VIEW
               ========================================================================= */}
            {activeNav === 'dashboard' && (
              <>
                <section className="dash-welcome">
                  <div>
                    <p className="dash-welcome__tag">INTERVIEW DASHBOARD</p>
                    <h1 className="dash-welcome__title">Welcome back, {firstName}</h1>
                    <p className="dash-welcome__desc">
                      Practice real-time coding, system design, and behavioral questions with instant feedback and voice analytics.
                    </p>
                  </div>
                  <div className="dash-readiness">
                    <div className="dash-readiness__circle">
                      <span className="dash-readiness__score">{avgReadiness}%</span>
                      <span className="dash-readiness__label">Readiness</span>
                    </div>
                  </div>
                </section>

                <section className="dash-section">
                  <div className="dash-section__header">
                    <h2>Curated Practice Sessions</h2>
                    <span className="dash-section__subtitle">One-click start preset interviews powered by database question bank</span>
                  </div>

                  <div className="dash-modes-grid">
                    {loadingPresets ? (
                      <p style={{ gridColumn: '1 / -1', fontSize: '13px', color: 'var(--text-muted)' }}>Loading curated presets...</p>
                    ) : presets.length > 0 ? (
                      presets.map(preset => {
                        const isStarting = startingPresetId === (preset._id || preset.slug)
                        return (
                          <div key={preset._id || preset.slug} className="dash-mode-card">
                            <div className="dash-mode-card__top">
                              <h3 className="dash-mode-card__title">{preset.name}</h3>
                              <span className="dash-mode-card__badge">{preset.badge || preset.mode}</span>
                            </div>
                            <p className="dash-mode-card__desc">{preset.description}</p>
                            <div className="dash-mode-card__meta">
                              <span>Duration: {preset.duration} mins</span>
                              <span>•</span>
                              <span>{preset.questionCount} Questions</span>
                            </div>
                            <button
                              className="dash-mode-card__btn"
                              onClick={() => handleStartCurated(preset)}
                              disabled={isStarting}
                            >
                              {isStarting ? 'Preparing Session...' : 'Start Interview →'}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No curated presets available.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="dash-grid-two">
                  <section className="dash-card">
                    <div className="dash-card__header">
                      <h3>Recent Mock Sessions</h3>
                      <button className="dash-card__action" onClick={() => setActiveNav('interviews')}>View All</button>
                    </div>

                    <div className="dash-sessions-list">
                      {loadingInterviews ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading sessions...</p>
                      ) : realInterviews.length > 0 ? (
                        realInterviews.slice(0, 3).map(item => (
                          <div
                            key={item._id}
                            className="dash-session-item"
                            onClick={() => navigate(`/interview/${item._id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="dash-session-item__header">
                              <div>
                                <h4 className="dash-session-item__title">{item.jobRole}</h4>
                                <span className="dash-session-item__sub">
                                  {item.experienceLevel} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                                </span>
                              </div>
                              <div className="dash-session-item__score-badge">
                                {item.overallScore ? `${item.overallScore}/100` : 'Pending'}
                              </div>
                            </div>
                            {item.summary && (
                              <p className="dash-session-item__feedback">
                                <strong>Feedback:</strong> {item.summary}
                              </p>
                            )}
                            <div className="dash-session-item__footer">
                              <span className="dash-session-item__tag">{item.interviewType}</span>
                              <button className="dash-session-item__btn">View Report →</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                            No mock sessions yet. Click a curated preset above to launch your first session.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="dash-card">
                    <div className="dash-card__header">
                      <h3>Skill Breakdown</h3>
                      <button className="dash-card__action" onClick={() => setActiveNav('analytics')}>Full Analytics</button>
                    </div>

                    {completedInterviews.length > 0 ? (
                      <div className="dash-insights-list">
                        <div className="dash-insight-item">
                          <div className="dash-insight-item__top">
                            <span className="dash-insight-item__title">Technical Depth</span>
                            <span className="dash-insight-item__score">{avgTechnical}%</span>
                          </div>
                          <div className="dash-insight-item__bar-wrap">
                            <div className="dash-insight-item__bar" style={{ width: `${avgTechnical}%` }} />
                          </div>
                          <p className="dash-insight-item__desc">Code correctness and algorithm reasoning.</p>
                        </div>

                        <div className="dash-insight-item">
                          <div className="dash-insight-item__top">
                            <span className="dash-insight-item__title">Communication & Pacing</span>
                            <span className="dash-insight-item__score">{avgCommunication}%</span>
                          </div>
                          <div className="dash-insight-item__bar-wrap">
                            <div className="dash-insight-item__bar" style={{ width: `${avgCommunication}%` }} />
                          </div>
                          <p className="dash-insight-item__desc">Response clarity and speaking cadence.</p>
                        </div>

                        <div className="dash-insight-item">
                          <div className="dash-insight-item__top">
                            <span className="dash-insight-item__title">Problem Solving Structure</span>
                            <span className="dash-insight-item__score">{avgProblemSolving}%</span>
                          </div>
                          <div className="dash-insight-item__bar-wrap">
                            <div className="dash-insight-item__bar" style={{ width: `${avgProblemSolving}%` }} />
                          </div>
                          <p className="dash-insight-item__desc">State assumptions and systematic trade-offs.</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Complete a mock session to unlock AI skill breakdown insights.
                        </p>
                      </div>
                    )}

                    <div className="dash-ai-tip">
                      <div>
                        <strong>AI Recommendation</strong>
                        <p>
                          {completedInterviews.length > 0
                            ? 'Keep practicing technical and system design sessions to improve trade-off explanations.'
                            : 'Launch a practice interview to receive custom performance insights.'}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}

            {/* =========================================================================
                TAB 2: MOCK SESSIONS VIEW
               ========================================================================= */}
            {activeNav === 'interviews' && (
              <section className="dash-tab-view">
                <div className="dash-tab-header">
                  <div>
                    <h2>Mock Interview Sessions</h2>
                    <p className="dash-tab-sub">View history of all completed and pending interview simulations</p>
                  </div>
                  <button className="dash-btn-primary" onClick={handleCustomInterview}>
                    + Custom Interview
                  </button>
                </div>

                <div className="dash-filter-pills">
                  {['All', 'Completed', 'Pending'].map(f => (
                    <button
                      key={f}
                      className={`dash-filter-pill ${sessionFilter === f ? 'dash-filter-pill--active' : ''}`}
                      onClick={() => setSessionFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="dash-sessions-grid">
                  {loadingInterviews ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading sessions...</p>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map(item => (
                      <div key={item._id} className="dash-session-full-card">
                        <div className="dash-session-full-card__header">
                          <div>
                            <h3>{item.jobRole}</h3>
                            <span className="dash-session-full-card__sub">
                              {item.experienceLevel} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <div className="dash-session-full-card__score">
                            {item.overallScore ? `${item.overallScore}/100` : 'Pending'}
                          </div>
                        </div>

                        <div className="dash-session-full-card__meta">
                          <span className="dash-meta-badge">Difficulty: {item.difficulty || 'Medium'}</span>
                          <span className="dash-meta-badge">Type: {item.interviewType || 'Technical'}</span>
                        </div>

                        <p className="dash-session-full-card__desc">
                          {item.summary || 'Mock session recorded. Full breakdown available.'}
                        </p>

                        <div className="dash-session-full-card__footer">
                          <button className="dash-btn-secondary" onClick={() => navigate(`/interview/${item._id}`)}>
                            Open Full Report →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                        No {sessionFilter !== 'All' ? sessionFilter.toLowerCase() : ''} mock sessions found.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* =========================================================================
                TAB 3: SKILL ANALYTICS VIEW
               ========================================================================= */}
            {activeNav === 'analytics' && (
              <section className="dash-tab-view">
                <div className="dash-tab-header">
                  <div>
                    <h2>Skill Analytics</h2>
                    <p className="dash-tab-sub">Comprehensive performance analysis from past interview recordings</p>
                  </div>
                </div>

                <div className="dash-analytics-grid">
                  <div className="dash-card">
                    <h3>Overall Readiness Score</h3>
                    <div className="dash-analytics-big-score">
                      <span className="dash-big-num">{avgReadiness}%</span>
                      <span className="dash-big-sub">
                        {avgReadiness >= 75 ? 'Interview Ready' : avgReadiness > 0 ? 'In Progress' : 'No Data'}
                      </span>
                    </div>
                    <p className="dash-analytics-text">
                      {completedInterviews.length > 0
                        ? `Based on ${completedInterviews.length} completed mock sessions.`
                        : 'Complete a mock interview session to calculate your overall readiness score.'}
                    </p>
                  </div>

                  <div className="dash-card">
                    <h3>Communication Metrics</h3>
                    <div className="dash-metric-rows">
                      <div className="dash-metric-row">
                        <span>Grammar & Vocabulary</span>
                        <strong>{avgCommunication > 0 ? `${avgCommunication} / 100` : 'N/A'}</strong>
                      </div>
                      <div className="dash-metric-row">
                        <span>Clarity & Structure</span>
                        <strong>{avgCommunication > 0 ? `${avgCommunication} / 100` : 'N/A'}</strong>
                      </div>
                      <div className="dash-metric-row">
                        <span>Speaking Cadence (WPM)</span>
                        <strong>{avgWPM > 0 ? `${avgWPM} WPM` : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =========================================================================
                TAB 4: QUESTION BANK VIEW (DATABASE DRIVEN)
               ========================================================================= */}
            {activeNav === 'question-bank' && (
              <section className="dash-tab-view">
                <div className="dash-tab-header">
                  <div>
                    <h2>Database Question Bank</h2>
                    <p className="dash-tab-sub">Practice technical and behavioral questions loaded directly from MongoDB</p>
                  </div>
                </div>

                <div className="dash-filter-pills" style={{ marginBottom: '16px' }}>
                  {['All', 'Frontend', 'Backend', 'System Design', 'Behavioral'].map(f => (
                    <button
                      key={f}
                      className={`dash-filter-pill ${qFilter === f ? 'dash-filter-pill--active' : ''}`}
                      onClick={() => setQFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="dash-qbank-list">
                  {loadingQuestions ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading question bank from database...</p>
                  ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map(q => (
                      <div key={q._id} className="dash-qbank-card">
                        <div className="dash-qbank-card__top">
                          <span className="dash-qbank-tag">{q.topic}</span>
                          <span className="dash-qbank-diff">{q.difficulty}</span>
                          <span className="dash-meta-badge" style={{ marginLeft: 'auto' }}>{q.role}</span>
                        </div>
                        <h3 className="dash-qbank-question">{q.question}</h3>
                        
                        {q.idealAnswer && (
                          <>
                            <button
                              className="dash-qbank-toggle"
                              onClick={() => setExpandedQuestion(expandedQuestion === q._id ? null : q._id)}
                            >
                              {expandedQuestion === q._id ? 'Hide Model Answer ▲' : 'Show Model Answer ▼'}
                            </button>

                            {expandedQuestion === q._id && (
                              <div className="dash-qbank-answer">
                                <strong>Model Answer:</strong>
                                <p>{q.idealAnswer}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No questions found for selected topic filter.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* =========================================================================
                TAB 5: SETTINGS VIEW
               ========================================================================= */}
            {activeNav === 'settings' && (
              <section className="dash-tab-view">
                <div className="dash-tab-header">
                  <div>
                    <h2>Account & Platform Preferences</h2>
                    <p className="dash-tab-sub">Configure candidate profile and feedback settings</p>
                  </div>
                </div>

                <div className="dash-card dash-settings-form">
                  <div className="dash-setting-row">
                    <label>Candidate Email</label>
                    <input type="text" value={session?.email || 'candidate@mirror.app'} disabled />
                  </div>
                  <div className="dash-setting-row">
                    <label>Default Interview Type</label>
                    <select value={preferredType} onChange={e => setPreferredType(e.target.value)}>
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="dash-setting-row">
                    <label>Evaluator Feedback Mode</label>
                    <select defaultValue="balanced">
                      <option value="strict">Strict (FAANG Standard)</option>
                      <option value="balanced">Balanced (Recommended)</option>
                      <option value="encouraging">Encouraging (Learning)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
    </>
  )
}