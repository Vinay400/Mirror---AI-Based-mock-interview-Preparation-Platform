import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import '../styles/Authpage.css'
import AuthBranding from '../components/AuthBranding'
import AuthField from '../components/AuthField'
import { verifyEmail, resendVerification } from '../api/authApi'
import { setToken } from '../utils/auth'
import { getApiErrorMessage } from '../utils/apiError'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendState, setResendState] = useState('idle')
  const [resendError, setResendError] = useState('')

  // React StrictMode runs effects twice on mount in development. Verification
  // links are single-use, so the second run would fail and replace a successful
  // sign-in with an error. The ref survives that double-invocation.
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const run = async () => {
      try {
        const response = await verifyEmail(token)
        const sessionToken = response?.data?.token
        if (sessionToken) {
          // Verified addresses get a long-lived session, same as "remember me".
          setToken(sessionToken, true)
        }
        navigate('/dashboard', { replace: true })
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error))
        setStatus('error')
      }
    }

    void run()
  }, [token, navigate])

  const handleResend = async (event) => {
    event.preventDefault()
    setResendError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setResendError('Please enter your email address.')
      return
    }

    setResendState('sending')
    try {
      const response = await resendVerification(trimmed)
      setResendState('sent')
      setErrorMessage(response?.data?.message || errorMessage)
    } catch (error) {
      setResendError(getApiErrorMessage(error))
      setResendState('idle')
    }
  }

  return (
    <div className="auth-shell">
      <AuthBranding />

      <section className="auth-form-panel">
        <div className="auth-form-panel__inner">
          <div className="auth-brand">MIRROR</div>

          <div className="auth-header">
            <h1>{status === 'verifying' ? 'Verifying your email' : 'That link didn’t work'}</h1>
            <p>
              {status === 'verifying'
                ? 'Hang tight, this only takes a moment.'
                : 'Verification links expire after 24 hours and can only be used once.'}
            </p>
          </div>

          {status === 'verifying' ? (
            <p className="auth-helper">Signing you in…</p>
          ) : (
            <>
              {resendState === 'sent' ? (
                <p className="auth-success">{errorMessage}</p>
              ) : (
                <form className="auth-form" onSubmit={handleResend}>
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

                  {resendError ? <p className="auth-error">{resendError}</p> : null}
                  {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

                  <button type="submit" className="auth-submit" disabled={resendState === 'sending'}>
                    {resendState === 'sending' ? 'Please wait...' : 'Send a new link'}
                  </button>
                </form>
              )}

              <div className="auth-footer">
                <p>Already verified?</p>
                <Link className="auth-footer__link" to="/login">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
