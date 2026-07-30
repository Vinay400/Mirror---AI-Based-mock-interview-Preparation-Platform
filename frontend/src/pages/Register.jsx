import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Authpage.css'
import { register, login } from '../api/authApi'
import { setToken } from '../utils/auth'

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
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

    const submit = async () => {
      setLoading(true)

      try {
        let response = null

        if (isSignup) {
          response = await register({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            confirmPassword: form.confirmPassword,
          })
        } else {
          response = await login({
            email: form.email.trim(),
            password: form.password,
          })
        }

        const token = response?.data?.token
        if (token) {
          setToken(token)
        }

        navigate('/dashboard')
      } catch (error) {
        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (error instanceof Error ? error.message : null) ||
          'Something went wrong.'
        setErrorMessage(serverMessage)
      } finally {
        setLoading(false)
      }
    }

    void submit()
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
            <h1>{headerCopy.title}</h1>
            <p>{headerCopy.subtitle}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup ? (
              <Field
                label="Full Name"
                type="text"
                placeholder="Jordan Ellis"
                name="name"
                value={form.name}
                onChange={handleFieldChange}
              />
            ) : null}

            <Field
              label="Email Address"
              type="email"
              placeholder="hello@example.com"
              name="email"
              value={form.email}
              onChange={handleFieldChange}
            />

            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              name="password"
              value={form.password}
              onChange={handleFieldChange}
            />

            {isSignup ? (
              <Field
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                name="confirmPassword"
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
                <a href="#forgot-password" className="auth-link">Forgot password?</a>
              </div>
            )}

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : headerCopy.submitLabel}
            </button>
          </form>

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

function Field({ label, type, placeholder, name, value, onChange }) {
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
        />
      </span>
    </label>
  )
}