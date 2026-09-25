// Confirmation panel shown in place of a form once a step completes, so the
// three email-driven pages present the same success treatment.
export default function AuthNotice({ title, message, children }) {
  return (
    <div className="auth-notice">
      <div className="auth-notice__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 12.5l5 5 10-10" />
        </svg>
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {children ? <div className="auth-notice__actions">{children}</div> : null}
    </div>
  )
}
