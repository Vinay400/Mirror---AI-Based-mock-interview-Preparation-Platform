import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Authpage.css'
import AuthBranding from '../components/AuthBranding'
import AuthField from '../components/AuthField'
import AuthNotice from '../components/AuthNotice'
import { forgotPassword } from '../api/authApi'
import { getApiErrorMessage } from '../utils/apiError'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const trimmed = email.trim()
    if (!trimmed) {
      setErrorMessage('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      // The reply is intentionally vague about whether the address exists, so
      // the confirmation text comes from the server rather than being assumed.
      const response = await forgotPassword(trimmed)
      setSentMessage(
        response?.data?.message ||
          'If an account exists for that address, we’ve sent a password reset link.',
      )
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <AuthBranding />

      <section className="auth-form-panel">
        <div className="auth-form-panel__inner">
          <div className="auth-brand">MIRROR</div>

          <div className="auth-header">
            <h1>{sentMessage ? 'Check your email' : 'Forgot your password?'}</h1>
            <p>
              {sentMessage
                ? 'The link will take you to a page where you can choose a new password.'
                : 'Enter the email address on your account and we’ll send you a link to reset it.'}
            </p>
          </div>

          {sentMessage ? (
            <AuthNotice title="Reset link sent" message={sentMessage}>
              <Link className="auth-submit" to="/login">
                Back to sign in
              </Link>
              <p className="auth-notice__hint">
                Nothing arrived after a few minutes? Check your spam folder, then try again.
              </p>
            </AuthNotice>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <AuthField
                label="Email Address"
                type="email"
                placeholder="hello@example.com"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>Remembered it?</p>
            <Link className="auth-footer__link" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
