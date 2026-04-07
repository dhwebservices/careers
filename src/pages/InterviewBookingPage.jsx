import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import { bookInterviewSlot, getMyApplication, listInterviewSlots } from '../lib/candidateApi'
import { sendCandidateInterviewConfirmation, sendHiringManagerInterviewConfirmation } from '../lib/email'
import { formatDateTime } from '../lib/format'

function groupSlots(slots = []) {
  return slots.reduce((acc, slot) => {
    const label = new Date(slot.start_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[label]) acc[label] = []
    acc[label].push(slot)
    return acc
  }, {})
}

export default function InterviewBookingPage() {
  const { applicationId } = useParams()
  const { user, profile } = useAuth()
  const [application, setApplication] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [workingSlotId, setWorkingSlotId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!user?.id) return
      try {
        const [applicationRow, slotRows] = await Promise.all([
          getMyApplication(applicationId, user.id),
          listInterviewSlots(applicationId),
        ])
        if (!active) return
        setApplication(applicationRow)
        setSlots(slotRows)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [applicationId, user?.id])

  const openSlots = useMemo(() => slots.filter((slot) => slot.status === 'open'), [slots])
  const bookedSlot = useMemo(() => slots.find((slot) => slot.status === 'booked'), [slots])
  const grouped = useMemo(() => groupSlots(openSlots), [openSlots])

  async function book(slot) {
    setWorkingSlotId(slot.id)
    setMessage('')
    try {
      await bookInterviewSlot(slot.id)
      const startAtLabel = formatDateTime(slot.start_at)
      await Promise.allSettled([
        sendCandidateInterviewConfirmation({
          candidateEmail: application.email,
          candidateName: application.full_name || profile?.first_name || application.email,
          roleTitle: application.job_posts?.title || 'Interview',
          startAtLabel,
          mode: slot.interview_mode,
          location: slot.location,
          managerName: slot.hiring_manager_name,
          notes: slot.notes,
        }),
        slot.hiring_manager_email ? sendHiringManagerInterviewConfirmation({
          managerEmail: slot.hiring_manager_email,
          managerName: slot.hiring_manager_name,
          candidateName: application.full_name || application.email,
          roleTitle: application.job_posts?.title || 'Interview',
          startAtLabel,
          mode: slot.interview_mode,
          location: slot.location,
          notes: slot.notes,
        }) : Promise.resolve(),
      ])
      setSlots((current) => current.map((item) => {
        if (item.id === slot.id) return { ...item, status: 'booked' }
        if (item.application_id === slot.application_id && item.status === 'open') return { ...item, status: 'closed' }
        return item
      }))
      setMessage('Interview booked successfully. Confirmation emails have been sent.')
    } catch (error) {
      setMessage(error.message || 'Could not book this interview slot.')
    } finally {
      setWorkingSlotId('')
    }
  }

  if (loading) {
    return <LoadingView title="Loading interview options" message="Checking the interview slots published for your application." />
  }

  if (!application) {
    return <div className="empty">This application could not be found for your candidate account.</div>
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <p className="eyebrow">Interview booking</p>
        <h2 style={{ margin: '0 0 10px', fontSize: 32 }}>Choose your interview slot</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 760 }}>
          Select one of the times published by the hiring team for {application.job_posts?.title || 'this role'}.
        </p>
      </div>

      {bookedSlot ? (
        <div className="banner">
          <strong>Your interview is booked.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {formatDateTime(bookedSlot.start_at)} · {bookedSlot.interview_mode || 'Interview'} · {bookedSlot.location || 'Details to follow'}
          </p>
        </div>
      ) : null}

      {message ? <div className={message.includes('successfully') ? 'banner' : 'danger-text'}>{message}</div> : null}

      {!bookedSlot && openSlots.length === 0 ? (
        <div className="empty">No interview slots are available right now. Please check again later or contact the hiring team.</div>
      ) : null}

      {!bookedSlot ? Object.entries(grouped).map(([label, daySlots]) => (
        <div className="card card-pad" key={label}>
          <div className="section-title">
            <div>
              <h2>{label}</h2>
              <p>Published interview times for this day.</p>
            </div>
          </div>
          <div className="job-list">
            {daySlots.map((slot) => (
              <div key={slot.id} className="job-card">
                <div className="job-meta">
                  <span className="pill"><Clock3 size={14} /> {new Date(slot.start_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} to {new Date(slot.end_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="pill"><CalendarDays size={14} /> {slot.interview_mode || 'Interview'}</span>
                  <span className="pill"><MapPin size={14} /> {slot.location || 'Details to follow'}</span>
                </div>
                <div className="muted tiny">
                  {slot.hiring_manager_name ? `Hiring manager: ${slot.hiring_manager_name}` : 'Hiring team'}{slot.notes ? ` · ${slot.notes}` : ''}
                </div>
                <div className="row-between">
                  <span className="tiny muted">Once booked, this slot will be locked and confirmation emails will be sent.</span>
                  <button className="button" type="button" disabled={workingSlotId === slot.id} onClick={() => book(slot)}>
                    {workingSlotId === slot.id ? 'Booking...' : 'Book this slot'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )) : null}

      <div>
        <Link className="button-ghost" to="/applications">Back to applications</Link>
      </div>
    </div>
  )
}
