import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import JobCard from '../components/JobCard'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { listMyApplications, listPublishedJobs } from '../lib/candidateApi'

function profileCompletion(profile) {
  const checks = [
    profile?.first_name,
    profile?.last_name,
    profile?.phone,
    profile?.ni_number,
    profile?.location,
    profile?.summary,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export default function DashboardPage() {
  const { user, profile, profileLoading } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      if (!user?.id) return
      try {
        const [jobRows, applicationRows] = await Promise.all([
          listPublishedJobs(),
          listMyApplications(user.id),
        ])

        if (!active) return
        setJobs(jobRows)
        setApplications(applicationRows)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id])

  const completion = useMemo(() => profileCompletion(profile), [profile])
  const name = profile?.first_name || user?.email?.split('@')[0] || 'there'

  if (loading || profileLoading) {
    return <LoadingView title="Preparing your dashboard" message="Loading your profile, linked applications, and current live roles." />
  }

  return (
    <div className="stack">
      <section className="split-hero">
        <div className="card card-pad">
          <p className="eyebrow">Welcome back</p>
          <h2 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Good to see you, {name}.</h2>
          <p className="muted" style={{ margin: '14px 0 24px', maxWidth: 620 }}>
            Your candidate account is now the home for profile updates, future applications, and recruiter-driven portal updates.
          </p>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Link className="button" to="/profile">Finish your profile</Link>
            <Link className="button-secondary" to="/jobs">Browse live roles</Link>
          </div>
        </div>

        <div className="card card-pad">
          <p className="eyebrow">Profile readiness</p>
          <div className="metric-value">{completion}%</div>
          <p className="metric-label" style={{ marginBottom: 18 }}>
            The more complete your profile is, the faster you can apply and the clearer your recruiter view becomes.
          </p>
          <div className="row">
            <CheckCircle2 size={18} color="var(--success)" />
            <span className="muted tiny">NI number, contact details, summary, and profile basics all count here.</span>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <article className="card card-pad">
          <p className="eyebrow">Applications</p>
          <div className="metric-value">{applications.length}</div>
          <div className="metric-label">Linked to your account</div>
        </article>
        <article className="card card-pad">
          <p className="eyebrow">Open roles</p>
          <div className="metric-value">{jobs.length}</div>
          <div className="metric-label">Currently published</div>
        </article>
        <article className="card card-pad">
          <p className="eyebrow">Next step</p>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Keep your details current</div>
          <div className="metric-label">Recruiters will review what is stored here before contacting you.</div>
        </article>
      </section>

      <section className="grid-2">
        <div className="card card-pad">
          <div className="section-title">
            <div>
              <h2>Recent applications</h2>
              <p>Track every role already tied to your account.</p>
            </div>
            <Link className="button-ghost" to="/applications">See all</Link>
          </div>

          {applications.length ? (
            <div className="application-list">
              {applications.slice(0, 3).map((application) => <ApplicationCard key={application.id} application={application} />)}
            </div>
          ) : (
            <div className="empty">
              <div className="row" style={{ marginBottom: 10 }}>
                <ClipboardList size={18} />
                <strong>No linked applications yet</strong>
              </div>
              Apply to a live role once your profile is ready, or sign in with the email address you previously applied with to bring historic records across.
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-title">
            <div>
              <h2>Good roles to review now</h2>
              <p>Current vacancies from the live recruiting workspace.</p>
            </div>
            <Link className="button-ghost" to="/jobs">All roles</Link>
          </div>

          {jobs.length ? (
            <div className="job-list">
              {jobs.slice(0, 2).map((job) => (
                <JobCard key={job.id} job={job} ctaTo={user ? `/apply/${job.slug}` : `/jobs/${job.slug}`} ctaLabel={user ? 'Apply now' : 'View role'} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="row" style={{ marginBottom: 10 }}>
                <UserRound size={18} />
                <strong>No published roles yet</strong>
              </div>
              Once jobs are published from the recruiting workspace they will appear here automatically.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
