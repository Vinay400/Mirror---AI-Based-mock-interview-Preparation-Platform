import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../styles/Authpage.css'
import AuthBranding from '../components/AuthBranding'
import AuthField from '../components/AuthField'
import AuthNotice from '../components/AuthNotice'
import { resetPassword } from '../api/authApi'
import { getApiErrorMessage, getApiErrorCode } from '../utils/apiError'

// Mirrors MIN_PASSWORD_LENGTH in backend/utils/validatePassword.js. The server
// is the authority; this only exists to give faster feedback.
const MIN_PASSWORD_LENGTH = 8

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [tokenRejected, setTokenRejected] = useState(false)
  const [done, setDone] = useState(false)

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, form.password)
      setDone(true)
    } catch (error) {
      if (getApiErrorCode(error) === 'INVALID_RESET_TOKEN') {
        setTokenRejected(true)
      }
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const renderBody = () => {
    if (done) {
      return (
        <AuthNotice
          title="Password updated"
          message="Your new password is ready to use. For security, any other devices signed in to your account have been signed out."
        >
          <Link className="auth-submit" to="/login">
            Sign in
          </Link>
        </AuthNotice>
      )
    }

    if (tokenRejected) {
      return (
        <AuthNotice
          title="This link has expired"
          message={errorMessage || 'Reset links can only be used once, and they expire after 30 minutes.'}
        >
          <Link className="auth-submit" to="/forgot-password">
            Request a new link
          </Link>
        </AuthNotice>
      )
    }

    return (
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="New Password"
          type="password"
          placeholder="••••••••"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={handleFieldChange}
        />

        <AuthField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={handleFieldChange}
        />

        <p className="auth-helper">Use at least {MIN_PASSWORD_LENGTH} characters.</p>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Set new password'}
        </button>
      </form>
    )
  }

  return (
    <div className="auth-shell">
      <AuthBranding />

      <section className="auth-form-panel">
        <div className="auth-form-panel__inner">
          <div className="auth-brand">MIRROR</div>

          <div className="auth-header">
            <h1>Choose a new password</h1>
            <p>
              {done
                ? 'You can now sign in with your new password.'
                : 'Pick something you haven’t used here before.'}
            </p>
          </div>

          {renderBody()}

          {done ? null : (
            <div className="auth-footer">
              <p>Didn’t mean to be here?</p>
              <Link className="auth-footer__link" to="/login">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
