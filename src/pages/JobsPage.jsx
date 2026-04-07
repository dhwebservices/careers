import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Sparkles } from 'lucide-react'
import JobCard from '../components/JobCard'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { listPublishedJobs } from '../lib/candidateApi'

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const departments = useMemo(
    () => [...new Set(jobs.map((job) => job.department).filter(Boolean))],
    [jobs],
  )

  const commissionOnlyCount = useMemo(
    () => jobs.filter((job) => job.commission_only === true).length,
    [jobs],
  )

  useEffect(() => {
    listPublishedJobs()
      .then(setJobs)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <LoadingView title="Loading live roles" message="Pulling the current published jobs from the recruiting workspace." />
  }

  return (
    <div className="stack">
      <section className="jobs-hero">
        <div className="jobs-hero-copy">
          <p className="eyebrow">Current vacancies</p>
          <h1>Find the role that fits how you want to work.</h1>
          <p className="muted jobs-hero-text">
            Browse live DH Website Services openings, keep your candidate profile up to date, and move from interest to application without repeating the same details every time.
          </p>

          <div className="jobs-highlight-row">
            <div className="jobs-highlight-card">
              <Sparkles size={18} />
              <div>
                <strong>Profile-first applications</strong>
                <span>Your account carries your details, experience, and future updates with you.</span>
              </div>
            </div>
            <div className="jobs-highlight-card">
              <CheckCircle2 size={18} />
              <div>
                <strong>Direct recruitment flow</strong>
                <span>These are the same live roles and updates the hiring team manages internally.</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="jobs-hero-panel">
          <div className="jobs-panel-badge">
            <BriefcaseBusiness size={16} />
            Open roles snapshot
          </div>
          <div className="jobs-panel-metrics">
            <div>
              <span className="jobs-metric-value">{jobs.length}</span>
              <span className="jobs-metric-label">Live vacancies</span>
            </div>
            <div>
              <span className="jobs-metric-value">{departments.length || 1}</span>
              <span className="jobs-metric-label">Departments hiring</span>
            </div>
            <div>
              <span className="jobs-metric-value">{commissionOnlyCount}</span>
              <span className="jobs-metric-label">Commission-led roles</span>
            </div>
          </div>

          <div className="jobs-panel-footer">
            <span>{user ? 'Your account is ready to apply.' : 'Sign in for faster applications.'}</span>
            <ArrowUpRight size={16} />
          </div>
        </aside>
      </section>

      {jobs.length ? (
        <div className="job-list jobs-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} ctaTo={user ? `/apply/${job.slug}` : `/jobs/${job.slug}`} ctaLabel={user ? 'Apply now' : 'View role'} />
          ))}
        </div>
      ) : (
        <div className="empty">No published roles are available right now.</div>
      )}
    </div>
  )
}
