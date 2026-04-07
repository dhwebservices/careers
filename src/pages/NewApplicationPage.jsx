import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingView from '../components/LoadingView'
import StepIndicator from '../components/StepIndicator'
import { useAuth } from '../contexts/AuthContext'
import { getJobBySlug, submitCandidateApplication, uploadCandidateCv } from '../lib/candidateApi'

const steps = [
  { id: 'details', label: 'Personal details' },
  { id: 'experience', label: 'Experience' },
  { id: 'questions', label: 'Questions & CV' },
  { id: 'review', label: 'Review' },
]

export default function NewApplicationPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [cvFile, setCvFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
    current_job_title: '',
    years_experience: '',
    experience_summary: '',
    cover_note: '',
    screening_answers: {},
    commission_acknowledged: false,
    privacy_acknowledged: false,
  })

  useEffect(() => {
    getJobBySlug(slug)
      .then(setJob)
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!profile) return
    setForm((current) => ({
      ...current,
      first_name: profile.first_name || current.first_name,
      last_name: profile.last_name || current.last_name,
      email: profile.email || user?.email || current.email,
      phone: profile.phone || current.phone,
      location: profile.location || current.location,
      linkedin_url: profile.linkedin_url || current.linkedin_url,
      portfolio_url: profile.portfolio_url || current.portfolio_url,
    }))
  }, [profile, user?.email])

  const questions = useMemo(() => Array.isArray(job?.screening_questions) ? job.screening_questions : [], [job?.screening_questions])

  function canAdvance() {
    if (currentStep === 0) return form.first_name && form.last_name && form.email && form.phone
    if (currentStep === 1) return form.experience_summary
    if (currentStep === 2) {
      const questionsComplete = questions.every((question) => (
        question.required ? String(form.screening_answers?.[question.id] || '').trim() : true
      ))
      return questionsComplete && cvFile && form.privacy_acknowledged && (!job?.commission_only || form.commission_acknowledged)
    }
    return true
  }

  async function submit() {
    if (!user?.id || !job) return
    setSubmitting(true)
    setError('')

    try {
      const cvUpload = cvFile ? await uploadCandidateCv(cvFile, `${job.slug}-${user.id}`) : null
      await submitCandidateApplication({
        userId: user.id,
        job,
        profile,
        payload: form,
        cvUpload,
      })
      navigate('/applications', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Could not submit your application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingView title="Opening application flow" message="Fetching the role, your profile defaults, and the portal form steps." />
  }

  if (!job) {
    return <div className="empty">This role could not be loaded.</div>
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <Link className="button-ghost" to={`/jobs/${job.slug}`}><ArrowLeft size={16} /> Back to role</Link>
        <p className="eyebrow" style={{ marginTop: 6 }}>Application flow</p>
        <h2 style={{ margin: '0 0 12px', fontSize: 34 }}>Apply for {job.title}</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
          This guided application uses your candidate profile as the starting point, then captures role-specific answers and your latest CV.
        </p>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="card card-pad stack">
        {currentStep === 0 ? (
          <div className="field-grid">
            {[
              ['first_name', 'First name'],
              ['last_name', 'Last name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Location'],
              ['linkedin_url', 'LinkedIn URL'],
              ['portfolio_url', 'Portfolio URL'],
              ['current_job_title', 'Current role'],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input value={form[key] || ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
              </div>
            ))}
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="stack">
            <div className="field">
              <label>Years of relevant experience</label>
              <input value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Example: 4 years" />
            </div>
            <div className="field">
              <label>Relevant experience</label>
              <textarea value={form.experience_summary} onChange={(event) => setForm((current) => ({ ...current, experience_summary: event.target.value }))} />
            </div>
            <div className="field">
              <label>Cover note</label>
              <textarea value={form.cover_note} onChange={(event) => setForm((current) => ({ ...current, cover_note: event.target.value }))} />
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="stack">
            {questions.map((question) => (
              <div className="field" key={question.id}>
                <label>{question.label}</label>
                {question.type === 'select' ? (
                  <select value={form.screening_answers?.[question.id] || ''} onChange={(event) => setForm((current) => ({ ...current, screening_answers: { ...current.screening_answers, [question.id]: event.target.value } }))}>
                    <option value="">Select</option>
                    {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <textarea value={form.screening_answers?.[question.id] || ''} onChange={(event) => setForm((current) => ({ ...current, screening_answers: { ...current.screening_answers, [question.id]: event.target.value } }))} />
                )}
              </div>
            ))}

            <div className="field">
              <label>Upload CV</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCvFile(event.target.files?.[0] || null)} />
              <div className="helper">{cvFile ? `Selected: ${cvFile.name}` : 'Accepted formats: PDF, DOC, DOCX'}</div>
            </div>

            {job.commission_only ? (
              <label className="row tiny muted">
                <input type="checkbox" checked={form.commission_acknowledged} onChange={(event) => setForm((current) => ({ ...current, commission_acknowledged: event.target.checked }))} />
                I understand this is a commission-only role with no basic salary.
              </label>
            ) : null}

            <label className="row tiny muted">
              <input type="checkbox" checked={form.privacy_acknowledged} onChange={(event) => setForm((current) => ({ ...current, privacy_acknowledged: event.target.checked }))} />
              I consent to DH Website Services storing and processing my data for recruitment purposes.
            </label>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="stack">
            <div className="banner">
              <strong>Final review</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                Check your details before submission. Once sent, the recruiting team will review this application inside the internal staff portal.
              </p>
            </div>

            <div className="field-grid">
              {[
                ['Name', `${form.first_name} ${form.last_name}`.trim()],
                ['Email', form.email],
                ['Phone', form.phone],
                ['Location', form.location],
                ['Current role', form.current_job_title],
                ['Experience', form.years_experience],
              ].map(([label, value]) => (
                <div className="card card-pad" key={label} style={{ padding: 16 }}>
                  <div className="eyebrow">{label}</div>
                  <div>{value || 'Not provided'}</div>
                </div>
              ))}
            </div>

            <div className="card card-pad" style={{ padding: 16 }}>
              <div className="eyebrow">Relevant experience</div>
              <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{form.experience_summary || 'Not provided'}</div>
            </div>

            <div className="card card-pad" style={{ padding: 16 }}>
              <div className="eyebrow">CV</div>
              <div>{cvFile?.name || 'No file selected'}</div>
            </div>
          </div>
        ) : null}

        {error ? <div className="danger-text">{error}</div> : null}

        <div className="row-between">
          <button className="button-secondary" type="button" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}>
            <ArrowLeft size={16} />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button className="button" type="button" disabled={!canAdvance()} onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))}>
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="button" type="button" disabled={submitting} onClick={submit}>
              <Upload size={16} />
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
