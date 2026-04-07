import { useEffect, useState } from 'react'
import { BriefcaseBusiness, MapPin, Wallet } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { getJobBySlug } from '../lib/candidateApi'

function DetailSection({ title, content }) {
  if (!content) return null
  return (
    <section className="card card-pad">
      <h3 style={{ marginBottom: 12, fontSize: 22 }}>{title}</h3>
      <div className="muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{content}</div>
    </section>
  )
}

export default function JobDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobBySlug(slug)
      .then(setJob)
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <LoadingView title="Loading role details" message="Preparing the full role brief and application route." />
  }

  if (!job) {
    return <div className="empty">This role is no longer available.</div>
  }

  return (
    <div className="stack">
      <section className="split-hero">
        <div className="card card-pad">
          <p className="eyebrow">Live role</p>
          <h2 style={{ margin: 0, fontSize: 36 }}>{job.title}</h2>
          <p className="muted" style={{ margin: '14px 0 0', maxWidth: 720 }}>{job.summary || job.description}</p>
        </div>

        <aside className="card card-pad">
          <div className="stack">
            <span className="pill"><MapPin size={14} /> {job.location_text || job.location_type || 'Remote'}</span>
            <span className="pill"><BriefcaseBusiness size={14} /> {(job.employment_type || 'full_time').replaceAll('_', ' ')}</span>
            <span className="pill"><Wallet size={14} /> {job.salary_text || (job.commission_only ? 'Commission only' : 'Discussed at interview')}</span>
          </div>

          <Link className="button" to={user ? `/apply/${job.slug}` : '/login'} style={{ width: '100%', marginTop: 22 }}>
            {user ? 'Start application' : 'Sign in to apply'}
          </Link>
          {!user ? <p className="tiny muted" style={{ marginBottom: 0 }}>Candidates need an account to apply and manage updates.</p> : null}
        </aside>
      </section>

      <DetailSection title="About the role" content={job.description} />
      <DetailSection title="Responsibilities" content={job.responsibilities} />
      <DetailSection title="Requirements" content={job.requirements} />
      <DetailSection title="Benefits" content={job.benefits} />
    </div>
  )
}
