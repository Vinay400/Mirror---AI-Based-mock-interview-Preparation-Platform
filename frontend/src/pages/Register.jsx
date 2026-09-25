import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Authpage.css'
import { register, login, resendVerification } from '../api/authApi'
import { setToken } from '../utils/auth'
import AuthNotice from '../components/AuthNotice'
import { getApiErrorCode } from '../utils/apiError'

const characters = [
  {
    className: 'character character--purple',
    style: { left: '18%', top: '17%', width: '128px', height: '160px', animationDelay: '0s' },
    face: 'eyes',
  },
  {
    className: 'character character--dark',
    style: { right: '14%', top: '12%', width: '144px', height: '176px', animationDelay: '2s' },
    face: 'smile',
  },
  {
    className: 'character character--orange',
    style: { left: '26%', bottom: '26%', width: '160px', height: '80px', animationDelay: '1s' },
    face: 'eyes',
  },
  {
    className: 'character character--yellow',
    style: { right: '11%', bottom: '22%', width: '144px', height: '144px', animationDelay: '0.5s' },
    face: 'smile',
  },
]

export default function RegisterPage({ initialMode = 'signin' }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [signupNotice, setSignupNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendState, setResendState] = useState('idle')
  const [resendMessage, setResendMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const isSignup = mode === 'signup'

  const headerCopy = useMemo(
    () =>
      isSignup
        ? {
            title: 'Create your account',
            subtitle: 'Set up your profile in a minute and start practising interviews.',
            submitLabel: 'Create account',
            footerPrompt: 'Already have an account?',
            footerAction: 'Sign in',
          }
        : {
            title: 'Welcome back',
            subtitle: 'Log in to continue your sessions.',
            submitLabel: 'Sign In',
            footerPrompt: "Don't have an account?",
            footerAction: 'Sign up for free',
          },
    [isSignup],
  )

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setErrorMessage('')
    setNeedsVerification(false)
    setResendState('idle')
    setResendMessage('')

    const name = form.name.trim()
    const email = form.email.trim()

    if (isSignup && !name) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (!email || !form.password) {
      setErrorMessage('Email and password are required.')
      return
    }

    // The API never receives confirmPassword, so a typo here would silently
    // create the account with the mistyped password.
    if (isSignup && form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    const submit = async () => {
      setLoading(true)

      try {
        let response = null

        if (isSignup) {
          response = await register({
            name,
            email,
            password: form.password,
            confirmPassword: form.confirmPassword,
          })
        } else {
          response = await login({
            email,
            password: form.password,
            remember: rememberMe,
          })
        }

        const token = response?.data?.token

        // Register deliberately no longer returns a session token. Handing one
        // back for a new address while withholding it for one that already
        // exists would reveal which emails have accounts, so the account is
        // activated by an emailed link instead.
        if (isSignup && !token) {
          setSignupNotice(
            response?.data?.message ||
              'Check your email to verify your account before signing in.',
          )
          return
        }

        if (token) {
          setToken(token, !isSignup && rememberMe)
        }

        navigate('/dashboard')
      } catch (error) {
        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (error instanceof Error ? error.message : null) ||
          'Something went wrong.'
        setErrorMessage(serverMessage)
        // A 403 here means the credentials were right but the address was never
        // verified, so offer the resend without making the user find it.
        setNeedsVerification(getApiErrorCode(error) === 'EMAIL_NOT_VERIFIED')
      } finally {
        setLoading(false)
      }
    }

    void submit()
  }

  const handleResendVerification = async () => {
    setResendMessage('')
    setResendState('sending')

    try {
      const response = await resendVerification(form.email.trim())
      setResendMessage(
        response?.data?.message || 'If that address needs verification, we’ve sent a fresh link.',
      )
      setResendState('sent')
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Could not send the email. Please try again.',
      )
      setResendState('idle')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-branding" aria-label="Brand illustration">
        <div className="auth-branding__grid" aria-hidden="true" />
        <div className="auth-branding__stage">
          <div className="auth-branding__dot" aria-hidden="true" />
          {characters.map((character) => (
            <div key={character.className} className={`${character.className} float`} style={character.style}>
              {character.face === 'eyes' ? (
                <div className="character__eyes" aria-hidden="true">
                  <span />
                  <span />
                </div>
              ) : (
                <div className="character__smile" aria-hidden="true">
                  <span />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="auth-branding__copy">A small, cheerful workspace for teams who like their tools with a bit of character.</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-panel__inner">
          <div className="auth-brand">MIRROR</div>
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`auth-tab ${!isSignup ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`auth-tab ${isSignup ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>
          <div className="auth-header">
            <h1>{signupNotice ? 'Check your email' : headerCopy.title}</h1>
            <p>
              {signupNotice
                ? 'We’ve sent a link to finish setting up your account.'
                : headerCopy.subtitle}
            </p>
          </div>

          {signupNotice ? (
            <AuthNotice title="Verify your address" message={signupNotice}>
              <button
                type="button"
                className="auth-submit"
                onClick={() => {
                  setSignupNotice('')
                  setMode('signin')
                }}
              >
                Go to sign in
              </button>
              <p className="auth-notice__hint">
                The link expires in 24 hours. If it hasn’t arrived, check your spam folder.
              </p>
            </AuthNotice>
          ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup ? (
              <Field
                label="Full Name"
                type="text"
                placeholder="Jordan Ellis"
                name="name"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleFieldChange}
              />
            ) : null}

            <Field
              label="Email Address"
              type="email"
              placeholder="hello@example.com"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleFieldChange}
            />

            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              name="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              value={form.password}
              onChange={handleFieldChange}
            />

            {isSignup ? (
              <Field
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleFieldChange}
              />
            ) : null}

            {isSignup ? (
              <p className="auth-helper">
                By creating an account you agree to our terms of service.
              </p>
            ) : (
              <div className="auth-actions">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="auth-checkbox__box" aria-hidden="true">
                    <svg viewBox="0 0 16 16" className="auth-checkbox__icon" role="presentation" aria-hidden="true">
                      <path d="M3.2 8.3l2.7 2.8 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="auth-checkbox__text">Remember for 30 days</span>
                </label>
                <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
              </div>
            )}

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            {needsVerification ? (
              resendState === 'sent' ? (
                <p className="auth-success">{resendMessage}</p>
              ) : (
                <button
                  type="button"
                  className="auth-inline-button"
                  onClick={handleResendVerification}
                  disabled={resendState === 'sending'}
                >
                  {resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
              )
            ) : null}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : headerCopy.submitLabel}
            </button>
          </form>
          )}

          <div className="auth-footer">
            <p>{headerCopy.footerPrompt}</p>
            <button
              type="button"
              className="auth-footer__link"
              onClick={() => setMode(isSignup ? 'signin' : 'signup')}
            >
              {headerCopy.footerAction}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({ label, type, placeholder, name, value, onChange, autoComplete, required = false }) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>
      <span className="auth-field__wrap">
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className="auth-field__input"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
        />
      </span>
    </label>
  )
}