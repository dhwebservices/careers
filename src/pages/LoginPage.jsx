import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimExistingApplications, signInCandidate, signUpCandidate } from '../lib/candidateApi'
import { isSupabaseConfigured } from '../lib/env'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const redirectParam = new URLSearchParams(location.search).get('redirectTo')
  const redirectTo = redirectParam || location.state?.redirectTo || '/'

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [navigate, redirectTo, user])

  const title = useMemo(
    () => mode === 'signin' ? 'Sign in to manage your applications' : 'Create your candidate account',
    [mode],
  )

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      if (mode === 'signup') {
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        await signUpCandidate({ email: form.email, password: form.password, redirectTo })
        await claimExistingApplications().catch(() => {})
        setMessage('Account created. Check your email if confirmation is enabled, then sign in.')
        setMode('signin')
      } else {
        await signInCandidate({ email: form.email, password: form.password })
        await claimExistingApplications().catch(() => {})
        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setMessage(error.message || 'We could not complete that action.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div>
          <div className="brand-mark">
            <div className="brand-badge">DH</div>
            <div className="brand-copy">
              <strong style={{ color: 'white' }}>DH Careers</strong>
              <span style={{ color: 'rgba(255,255,255,0.68)' }}>Candidate workspace</span>
            </div>
          </div>

          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.62)', marginBottom: 0 }}>Candidate portal</p>
          <h1>Your profile, your applications, your updates.</h1>
          <p>Create a candidate account once, complete your profile properly, and then apply to open roles with a much better experience than repeating the same form every time.</p>
        </div>

        <div className="auth-stats">
          <div className="auth-stat">
            <strong>Profile first</strong>
            <span>Store NI, contact details, skills, and work history in one place.</span>
          </div>
          <div className="auth-stat">
            <strong>Live roles</strong>
            <span>Browse current DH openings and apply through one secure account.</span>
          </div>
          <div className="auth-stat">
            <strong>Portal updates</strong>
            <span>Track statuses and prepare for recruiter follow-up without chasing email chains.</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-tabs">
            <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button>
          </div>

          <h2 style={{ margin: '0 0 10px', fontSize: 26 }}>{title}</h2>
          <p className="muted" style={{ margin: '0 0 24px' }}>
            Existing applicants should use the same email address they already applied with so we can attach their historic applications automatically.
          </p>

          {!isSupabaseConfigured ? (
            <div className="banner">
              <strong>Configuration needed</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_PORTAL_BASE_URL` before using the live portal.
              </p>
            </div>
          ) : null}

          <form className="stack" onSubmit={submit} style={{ marginTop: 22 }}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
            </div>

            {mode === 'signup' ? (
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} required />
              </div>
            ) : null}

            {message ? <div className={message.toLowerCase().includes('check your email') ? 'banner' : 'danger-text'}>{message}</div> : null}

            <button className="button" type="submit" disabled={submitting || !isSupabaseConfigured}>
              {submitting ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create candidate account'}
            </button>
          </form>

          <div className="row-between" style={{ marginTop: 18 }}>
            <Link className="button-ghost" to="/jobs">Browse live roles</Link>
            <span className="tiny muted">Need an invite? Your recruiter can resend it.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
