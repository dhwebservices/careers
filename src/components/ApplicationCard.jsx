import { Link } from 'react-router-dom'
import { formatDateTime, getStatusTone } from '../lib/format'

export default function ApplicationCard({ application, actions = null }) {
  return (
    <article className="application-card">
      <div className="row-between">
        <div>
          <h3>{application.job_posts?.title || 'Application'}</h3>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            Ref {application.application_ref || 'Pending'} · submitted {formatDateTime(application.submitted_at)}
          </p>
        </div>
        <span className={`status ${getStatusTone(application.status)}`}>{application.status.replaceAll('_', ' ')}</span>
      </div>

      <div className="job-meta">
        <span className="pill">{application.job_posts?.department || 'General'}</span>
        <span className="pill">{application.job_posts?.location_text || application.job_posts?.location_type || 'Remote'}</span>
      </div>

      <div className="row-between">
        <p className="muted tiny" style={{ margin: 0 }}>
          Status updates will appear here once the recruiter moves your application through the pipeline.
        </p>
        <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {actions}
          {application.job_posts?.slug ? (
            <Link className="button-ghost" to={`/jobs/${application.job_posts.slug}`}>
              View job
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
