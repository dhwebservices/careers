import { useEffect, useState } from 'react'
import JobCard from '../components/JobCard'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { listPublishedJobs } from '../lib/candidateApi'

export default function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

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
      <div className="card card-pad">
        <p className="eyebrow">Current vacancies</p>
        <h2 style={{ margin: 0, fontSize: 32 }}>Open roles at DH Website Services</h2>
        <p className="muted" style={{ margin: '12px 0 0', maxWidth: 760 }}>
          Browse the same live jobs your recruitment team manages internally. Candidates with accounts can jump directly into a guided application flow.
        </p>
      </div>

      {jobs.length ? (
        <div className="job-list">
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
