import { ArrowRight, BriefcaseBusiness, MapPin, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function JobCard({ job, ctaTo, ctaLabel = 'View role' }) {
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="job-card-copy">
          <h3>{job.title}</h3>
          <p className="muted" style={{ margin: '8px 0 0' }}>{job.summary || 'Open role at DH Website Services'}</p>
        </div>
        <span className="pill job-card-department">{job.department || 'General'}</span>
      </div>

      <div className="job-meta">
        <span className="pill"><MapPin size={14} /> {job.location_text || job.location_type || 'Remote'}</span>
        <span className="pill"><BriefcaseBusiness size={14} /> {(job.employment_type || 'full_time').replaceAll('_', ' ')}</span>
        <span className="pill"><Wallet size={14} /> {job.salary_text || (job.commission_only ? 'Commission only' : 'Package discussed')}</span>
      </div>

      <div className="job-card-footer">
        <div className="job-card-footnote">
          <span className="tiny muted">Applications managed through the candidate portal</span>
          <span className="tiny muted">{job.hiring_manager_name ? `Hiring manager: ${job.hiring_manager_name}` : 'Recruitment team reviewed inside DH staff portal'}</span>
        </div>
        <Link className="button-secondary" to={ctaTo}>
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  )
}
