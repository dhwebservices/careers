import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { listMyApplications } from '../lib/candidateApi'

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    listMyApplications(user.id)
      .then(setApplications)
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) {
    return <LoadingView title="Loading your applications" message="Linking your candidate account to the recruitment records now." />
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <p className="eyebrow">Application history</p>
        <h2 style={{ margin: 0, fontSize: 30 }}>Everything tied to your account</h2>
        <p className="muted" style={{ margin: '12px 0 0', maxWidth: 720 }}>
          Existing applications submitted with the same email address can be linked automatically once the invite and claim flow is active in production.
        </p>
      </div>

      {applications.length ? (
        <div className="application-list">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              actions={application.status === 'interview' ? (
                <Link className="button-secondary" to={`/interviews/${application.id}`}>
                  Book interview
                </Link>
              ) : null}
            />
          ))}
        </div>
      ) : (
        <div className="empty">No applications are linked to this candidate account yet.</div>
      )}
    </div>
  )
}
