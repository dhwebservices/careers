import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { completeInvite, signUpCandidate } from '../lib/candidateApi'
import { isSupabaseConfigured } from '../lib/env'

export default function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.')
      await signUpCandidate({ email: form.email, password: form.password })
      await completeInvite(token, form.email)
      setMessage('Candidate portal activated. You can now sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 1000)
    } catch (error) {
      setMessage(error.message || 'We could not activate your invite.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-form-wrap" style={{ minHeight: '100vh' }}>
      <div className="auth-card">
        <p className="eyebrow">Candidate invite</p>
        <h2 style={{ margin: '0 0 10px', fontSize: 28 }}>Activate your candidate portal</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Use the same email address your original application was submitted with. Once activated, historic applications can be linked to this account.
        </p>

        {!isSupabaseConfigured ? (
          <div className="banner">
            <strong>Configuration needed</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Add the Supabase environment variables before using invite activation.</p>
          </div>
        ) : null}

        <form className="stack" onSubmit={submit} style={{ marginTop: 18 }}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} required />
          </div>

          {message ? <div className={message.includes('activated') ? 'banner' : 'danger-text'}>{message}</div> : null}

          <button className="button" type="submit" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? 'Activating...' : 'Activate candidate portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
