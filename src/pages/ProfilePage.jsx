import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import LoadingView from '../components/LoadingView'
import { useAuth } from '../contexts/AuthContext'
import {
  listCandidateExperience,
  listCandidateSkills,
  saveCandidateExperience,
  saveCandidateProfile,
  saveCandidateSkills,
  syncCandidateProfileSnapshot,
} from '../lib/candidateApi'

function newSkill() {
  return { name: '', proficiency: '', years_experience: '' }
}

function newExperience() {
  return {
    company_name: '',
    job_title: '',
    start_date: '',
    end_date: '',
    is_current: false,
    summary: '',
  }
}

export default function ProfilePage() {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const [form, setForm] = useState({})
  const [skills, setSkills] = useState([newSkill()])
  const [experience, setExperience] = useState([newExperience()])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  useEffect(() => {
    let active = true

    async function load() {
      if (!user?.id) return
      try {
        const [skillRows, experienceRows] = await Promise.all([
          listCandidateSkills(user.id),
          listCandidateExperience(user.id),
        ])
        if (!active) return
        setSkills(skillRows.length ? skillRows : [newSkill()])
        setExperience(experienceRows.length ? experienceRows : [newExperience()])
      } finally {
        if (active) setLoadingData(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id])

  const completion = useMemo(() => {
    const checks = [form.first_name, form.last_name, form.phone, form.ni_number, form.location, form.summary]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  async function saveAll(event) {
    event.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setMessage('')

    try {
      const [savedProfile, savedSkills, savedExperience] = await Promise.all([
        saveCandidateProfile(user.id, form),
        saveCandidateSkills(user.id, skills),
        saveCandidateExperience(user.id, experience),
      ])
      await syncCandidateProfileSnapshot(savedProfile, savedSkills, savedExperience)
      await refreshProfile()
      setMessage('Profile saved successfully.')
    } catch (error) {
      setMessage(error.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading || loadingData) {
    return <LoadingView title="Loading your profile" message="Preparing your saved personal details, skills, and work history." />
  }

  return (
    <form className="stack" onSubmit={saveAll}>
      <section className="split-hero">
        <div className="card card-pad">
          <p className="eyebrow">Candidate record</p>
          <h2 style={{ margin: 0, fontSize: 32 }}>Keep your profile recruiter-ready.</h2>
          <p className="muted" style={{ margin: '14px 0 0', maxWidth: 680 }}>
            The recruiting team should be able to understand who you are, what you can do, and how to contact you before you even submit a fresh application.
          </p>
        </div>

        <div className="card card-pad">
          <p className="eyebrow">Completion</p>
          <div className="metric-value">{completion}%</div>
          <p className="metric-label" style={{ marginBottom: 0 }}>Profile completeness across key candidate fields.</p>
        </div>
      </section>

      <section className="card card-pad stack">
        <div className="section-title">
          <div>
            <h2>Personal details</h2>
            <p>This becomes the base layer for future applications and internal recruiter review.</p>
          </div>
        </div>

        <div className="field-grid">
          {[
            ['first_name', 'First name'],
            ['last_name', 'Last name'],
            ['phone', 'Phone'],
            ['date_of_birth', 'Date of birth'],
            ['ni_number', 'NI number'],
            ['location', 'Location'],
            ['address_line_1', 'Address line 1'],
            ['address_line_2', 'Address line 2'],
            ['city', 'Town / city'],
            ['postcode', 'Postcode'],
            ['country', 'Country'],
            ['right_to_work_uk', 'Right to work in UK'],
            ['linkedin_url', 'LinkedIn URL'],
            ['portfolio_url', 'Portfolio / website'],
          ].map(([key, label]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input id={key} value={form[key] || ''} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
            </div>
          ))}
        </div>

        <div className="field">
          <label htmlFor="summary">Professional summary</label>
          <textarea id="summary" value={form.summary || ''} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
        </div>
      </section>

      <section className="card card-pad stack">
        <div className="section-title">
          <div>
            <h2>Skills</h2>
            <p>Show the key capabilities recruiters should spot immediately.</p>
          </div>
          <button className="button-secondary" type="button" onClick={() => setSkills((current) => [...current, newSkill()])}>
            <Plus size={16} />
            Add skill
          </button>
        </div>

        <div className="stack">
          {skills.map((skill, index) => (
            <div className="skill-row" key={`skill-${index}`}>
              <div className="field">
                <label>Skill</label>
                <input value={skill.name} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
              </div>
              <div className="field">
                <label>Level</label>
                <select value={skill.proficiency} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, proficiency: event.target.value } : item))}>
                  <option value="">Choose</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
              <div className="field">
                <label>Years</label>
                <input value={skill.years_experience} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, years_experience: event.target.value } : item))} />
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button className="button-secondary" type="button" onClick={() => setSkills((current) => current.length === 1 ? [newSkill()] : current.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-pad stack">
        <div className="section-title">
          <div>
            <h2>Experience</h2>
            <p>Store a structured work history recruiters can review without leaving the portal.</p>
          </div>
          <button className="button-secondary" type="button" onClick={() => setExperience((current) => [...current, newExperience()])}>
            <Plus size={16} />
            Add experience
          </button>
        </div>

        <div className="stack">
          {experience.map((row, index) => (
            <div className="experience-card stack" key={`experience-${index}`}>
              <div className="row-between">
                <strong>Role {index + 1}</strong>
                <button className="button-secondary" type="button" onClick={() => setExperience((current) => current.length === 1 ? [newExperience()] : current.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label>Company</label>
                  <input value={row.company_name} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, company_name: event.target.value } : item))} />
                </div>
                <div className="field">
                  <label>Job title</label>
                  <input value={row.job_title} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, job_title: event.target.value } : item))} />
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input type="date" value={row.start_date || ''} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, start_date: event.target.value } : item))} />
                </div>
                <div className="field">
                  <label>End date</label>
                  <input type="date" disabled={row.is_current} value={row.end_date || ''} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, end_date: event.target.value } : item))} />
                </div>
              </div>

              <label className="row tiny muted">
                <input type="checkbox" checked={row.is_current === true} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, is_current: event.target.checked } : item))} />
                I still work here
              </label>

              <div className="field">
                <label>What did you do?</label>
                <textarea value={row.summary} onChange={(event) => setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, summary: event.target.value } : item))} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {message ? <div className={message.includes('successfully') ? 'banner' : 'danger-text'}>{message}</div> : null}

      <div className="row-between">
        <span className="tiny muted">Your information stays tied to your candidate account and can be reused in future applications.</span>
        <button className="button" type="submit" disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
