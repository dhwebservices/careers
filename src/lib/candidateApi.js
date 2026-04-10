import { sendCandidateApplicationConfirmation, sendRecruitingNewApplicationNotification } from './email'
import { env } from './env'
import { supabase } from './supabase'

const EMPTY_PROFILE = {
  user_id: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  date_of_birth: '',
  ni_number: '',
  location: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
  linkedin_url: '',
  portfolio_url: '',
  summary: '',
  right_to_work_uk: '',
}

function missingSupabase() {
  throw new Error('Supabase is not configured yet.')
}

function splitTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '')
    .split(/\r?\n|•|-/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapJob(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Untitled role',
    department: row.department || 'General',
    location: row.location_text || row.location_type || 'Location TBC',
    type: row.employment_type || 'Full-time',
    salaryRange: row.salary_text || row.compensation_model || '',
    featured: row.featured === true || row.requisition_priority === 'high',
    isOpen: row.status === 'published',
    commissionOnly: row.commission_only === true,
    description: row.description || row.summary || '',
    responsibilities: splitTextList(row.responsibilities),
    requirements: splitTextList(row.requirements),
    benefits: row.benefits || '',
    summary: row.summary || row.description || '',
    screeningQuestions: Array.isArray(row.screening_questions) ? row.screening_questions : [],
  }
}

function dbStatusToUi(status) {
  switch (String(status || '').toLowerCase()) {
    case 'new':
    case 'submitted':
      return 'SUBMITTED'
    case 'review':
    case 'reviewing':
    case 'under_review':
      return 'UNDER_REVIEW'
    case 'shortlisted':
      return 'SHORTLISTED'
    case 'interview_invited':
      return 'INTERVIEW_INVITED'
    case 'interview':
    case 'interview_scheduled':
      return 'INTERVIEW_SCHEDULED'
    case 'offer':
    case 'offered':
    case 'offer_extended':
      return 'OFFER_EXTENDED'
    case 'hired':
      return 'HIRED'
    case 'rejected':
      return 'REJECTED'
    case 'withdrawn':
      return 'WITHDRAWN'
    default:
      return 'SUBMITTED'
  }
}

function uiStatusToDb(status) {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'review'
    case 'SHORTLISTED':
      return 'shortlisted'
    case 'INTERVIEW_INVITED':
      return 'interview_invited'
    case 'INTERVIEW_SCHEDULED':
      return 'interview'
    case 'OFFER_EXTENDED':
      return 'offer'
    case 'HIRED':
      return 'hired'
    case 'REJECTED':
      return 'rejected'
    case 'WITHDRAWN':
      return 'withdrawn'
    default:
      return 'new'
  }
}

function mapApplication(row) {
  return {
    id: row.id,
    candidateId: row.candidate_user_id || '',
    jobId: row.job_post_id,
    status: dbStatusToUi(row.status),
    appliedAt: row.submitted_at || row.created_at,
    updatedAt: row.updated_at || row.created_at,
    coverLetter: row.cover_note || '',
    experienceNotes: row.experience_summary || '',
    profile: row,
    job: row.job_posts ? mapJob(row.job_posts) : null,
    applicationRef: row.application_ref || '',
  }
}

function buildCandidateSnapshot(profile = {}, skills = [], experience = []) {
  return {
    profile: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      date_of_birth: profile.date_of_birth || '',
      ni_number: profile.ni_number || '',
      location: profile.location || '',
      address_line_1: profile.address_line_1 || '',
      address_line_2: profile.address_line_2 || '',
      city: profile.city || '',
      postcode: profile.postcode || '',
      country: profile.country || 'United Kingdom',
      linkedin_url: profile.linkedin_url || '',
      portfolio_url: profile.portfolio_url || '',
      summary: profile.summary || '',
      right_to_work_uk: profile.right_to_work_uk || '',
    },
    skills: skills
      .map((skill) => ({
        name: String(skill.name || '').trim(),
        proficiency: String(skill.proficiency || '').trim(),
        years_experience: String(skill.years || skill.years_experience || '').trim(),
      }))
      .filter((skill) => skill.name),
    experience: experience
      .map((row) => ({
        company_name: String(row.company || row.company_name || '').trim(),
        job_title: String(row.title || row.job_title || '').trim(),
        start_date: row.start || row.start_date || null,
        end_date: row.current ? null : row.end || row.end_date || null,
        is_current: row.current === true || row.is_current === true,
        summary: String(row.summary || '').trim(),
      }))
      .filter((row) => row.company_name || row.job_title),
  }
}

function isMissingSchemaError(error, pattern) {
  return pattern.test(String(error?.message || error || ''))
}

export async function signInCandidate({ email, password }) {
  if (!supabase) missingSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data?.user || null
}

export async function signUpCandidate({ email, password, redirectTo = '/' }) {
  if (!supabase) missingSupabase()
  const safeRedirect = String(redirectTo || '/')
  const redirectUrl = new URL(`${env.portalBaseUrl}/login`)
  redirectUrl.searchParams.set('redirectTo', safeRedirect)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectUrl.toString() },
  })
  if (error) throw error
  return data?.user || null
}

export async function resetCandidatePassword(email) {
  if (!supabase) missingSupabase()
  const redirectUrl = new URL(`${env.portalBaseUrl}/login`)
  redirectUrl.searchParams.set('mode', 'reset')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl.toString(),
  })
  if (error) throw error
}

export async function signOutCandidate() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function ensureCandidateProfile(user) {
  if (!supabase || !user?.id) return null
  const draft = {
    user_id: user.id,
    email: user.email || '',
    first_name: user.user_metadata?.first_name || '',
    last_name: user.user_metadata?.last_name || '',
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('candidate_profiles').upsert(draft, { onConflict: 'user_id' })
  if (error && !isMissingSchemaError(error, /candidate_profiles/i)) throw error
  return draft
}

export async function fetchCandidateProfile(user) {
  if (!supabase || !user?.id) return { ...EMPTY_PROFILE }
  const { data, error } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (error) {
    if (isMissingSchemaError(error, /candidate_profiles/i)) {
      return {
        ...EMPTY_PROFILE,
        user_id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      }
    }
    throw error
  }
  return { ...EMPTY_PROFILE, ...(data || {}), user_id: user.id, email: data?.email || user.email || '' }
}

export async function saveCandidateProfile(userId, payload) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')
  const { data, error } = await supabase
    .from('candidate_profiles')
    .upsert({ user_id: userId, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listCandidateSkills(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase.from('candidate_skills').select('*').eq('user_id', userId).order('sort_order', { ascending: true })
  if (error) {
    if (isMissingSchemaError(error, /candidate_skills/i)) return []
    throw error
  }
  return data || []
}

export async function saveCandidateSkills(userId, skills) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')
  await supabase.from('candidate_skills').delete().eq('user_id', userId)
  const cleanRows = skills
    .map((skill, index) => ({
      user_id: userId,
      name: String(skill.name || '').trim(),
      proficiency: String(skill.proficiency || '').trim(),
      years_experience: String(skill.years || skill.years_experience || '').trim(),
      sort_order: index,
    }))
    .filter((skill) => skill.name)
  if (!cleanRows.length) return []
  const { data, error } = await supabase.from('candidate_skills').insert(cleanRows).select('*')
  if (error) throw error
  return data || []
}

export async function listCandidateExperience(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase.from('candidate_experience').select('*').eq('user_id', userId).order('sort_order', { ascending: true })
  if (error) {
    if (isMissingSchemaError(error, /candidate_experience/i)) return []
    throw error
  }
  return data || []
}

export async function saveCandidateExperience(userId, rows) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')
  await supabase.from('candidate_experience').delete().eq('user_id', userId)
  const cleanRows = rows
    .map((row, index) => ({
      user_id: userId,
      company_name: String(row.company || row.company_name || '').trim(),
      job_title: String(row.title || row.job_title || '').trim(),
      start_date: row.start || row.start_date || null,
      end_date: row.current || row.is_current ? null : row.end || row.end_date || null,
      is_current: row.current === true || row.is_current === true,
      summary: String(row.summary || '').trim(),
      sort_order: index,
    }))
    .filter((row) => row.company_name || row.job_title)
  if (!cleanRows.length) return []
  const { data, error } = await supabase.from('candidate_experience').insert(cleanRows).select('*')
  if (error) throw error
  return data || []
}

export async function syncCandidateProfileSnapshot(profile, skills = [], experience = []) {
  if (!supabase) missingSupabase()
  const snapshot = buildCandidateSnapshot(profile, skills, experience)
  const { error } = await supabase.rpc('sync_candidate_profile_snapshot', {
    profile_payload: snapshot.profile,
    skills_payload: snapshot.skills,
    experience_payload: snapshot.experience,
  })
  if (!error) return
  if (!isMissingSchemaError(error, /sync_candidate_profile_snapshot|function/i)) throw error

  const userId = String(profile?.user_id || '').trim()
  const email = String(profile?.email || '').trim().toLowerCase()
  if (!userId && !email) return

  const patch = {
    candidate_profile_snapshot: snapshot,
    portal_last_viewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  let updateError = null

  if (userId) {
    const byUser = await supabase
      .from('job_applications')
      .update(patch)
      .eq('candidate_user_id', userId)

    if (!byUser.error) return
    updateError = byUser.error
  }

  if (email) {
    const byEmail = await supabase
      .from('job_applications')
      .update(patch)
      .ilike('email', email)

    if (!byEmail.error) return
    updateError = byEmail.error
  }

  if (updateError && !isMissingSchemaError(updateError, /candidate_profile_snapshot|portal_last_viewed_at|job_applications/i)) {
    throw updateError
  }
}

export async function claimExistingApplications() {
  if (!supabase) missingSupabase()
  const { error } = await supabase.rpc('claim_existing_candidate_applications')
  if (error && !isMissingSchemaError(error, /claim_existing_candidate_applications|function/i)) throw error
}

export async function listPublishedJobs() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data || []).map(mapJob)
}

export async function listCandidateApplications({ userId, email }) {
  if (!supabase) return []

  let primaryError = null
  if (userId) {
    const primary = await supabase
      .from('job_applications')
      .select('*, job_posts(*)')
      .eq('candidate_user_id', userId)
      .order('submitted_at', { ascending: false })
    if (!primary.error) {
      if ((primary.data || []).length > 0) return (primary.data || []).map(mapApplication)
    } else {
      primaryError = primary.error
    }
  }

  if (email) {
    const fallback = await supabase
      .from('job_applications')
      .select('*, job_posts(*)')
      .ilike('email', email)
      .order('submitted_at', { ascending: false })
    if (fallback.error) {
      if (primaryError) throw primaryError
      throw fallback.error
    }
    return (fallback.data || []).map(mapApplication)
  }

  if (primaryError) throw primaryError
  return []
}

export async function listCandidateMessages(applicationIds = []) {
  if (!supabase || !applicationIds.length) return []

  const notesPromise = supabase
    .from('job_application_notes')
    .select('*')
    .in('application_id', applicationIds)
    .neq('visibility', 'internal')
    .order('created_at', { ascending: true })

  const historyPromise = supabase
    .from('job_application_status_history')
    .select('*')
    .in('application_id', applicationIds)
    .order('created_at', { ascending: true })

  const [notesResult, historyResult] = await Promise.all([notesPromise, historyPromise])

  const notes = notesResult.error && !isMissingSchemaError(notesResult.error, /job_application_notes/i) ? (() => { throw notesResult.error })() : (notesResult.data || [])
  const history = historyResult.error && !isMissingSchemaError(historyResult.error, /job_application_status_history/i) ? (() => { throw historyResult.error })() : (historyResult.data || [])

  const noteMessages = notes.map((note) => ({
    id: `note-${note.id}`,
    applicationId: note.application_id,
    senderName: note.created_by_name || note.created_by_email || 'Recruitment team',
    content: note.note || '',
    createdAt: note.created_at,
  }))

  const historyMessages = history.map((item) => ({
    id: `status-${item.id}`,
    applicationId: item.application_id,
    senderName: item.changed_by_name || item.changed_by_email || 'Recruitment workflow',
    content: item.reason || `Application moved to ${String(item.to_status || 'updated').replaceAll('_', ' ')}`,
    createdAt: item.created_at,
  }))

  return [...noteMessages, ...historyMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export async function listCandidateInterviews(applications = [], userId = '') {
  if (!supabase || !applications.length) return []
  const applicationIds = applications.map((item) => item.id)
  const { data, error } = await supabase
    .from('candidate_interview_slots')
    .select('*')
    .in('application_id', applicationIds)
    .order('start_at', { ascending: true })

  if (error) {
    if (isMissingSchemaError(error, /candidate_interview_slots/i)) return []
    throw error
  }

  const grouped = new Map()
  ;(data || []).forEach((slot) => {
    const current = grouped.get(slot.application_id) || []
    current.push(slot)
    grouped.set(slot.application_id, current)
  })

  return applications
    .filter((application) => grouped.has(application.id))
    .map((application) => {
      const slots = grouped.get(application.id) || []
      const booked = slots.find((slot) => slot.status === 'booked')
      const available = slots.filter((slot) => slot.status === 'open')
      const referenceSlot = booked || available[0] || slots[0]
      return {
        id: application.id,
        applicationId: application.id,
        title: referenceSlot?.notes || 'Interview',
        method: referenceSlot?.interview_mode === 'in_person' ? 'In-Person' : referenceSlot?.interview_mode === 'phone' ? 'Phone' : 'Video Call',
        locationDetails: referenceSlot?.location || 'Details will be confirmed by the hiring team',
        durationMinutes: referenceSlot ? Math.max(15, Math.round((new Date(referenceSlot.end_at) - new Date(referenceSlot.start_at)) / 60000)) : 60,
        availableSlots: available.map((slot) => ({ id: slot.id, startAt: slot.start_at, endAt: slot.end_at })),
        selectedSlot: booked?.start_at || '',
        status: booked ? 'SCHEDULED' : available.length ? 'INVITED' : 'COMPLETED',
        interviewerNames: [referenceSlot?.hiring_manager_name || referenceSlot?.hiring_manager_email || 'DH Hiring Team'].filter(Boolean),
        bookedByUserId: booked?.booked_by_user_id || '',
        notes: referenceSlot?.notes || '',
        userId,
      }
    })
}

export async function uploadCandidateCv(file, applicationRef) {
  if (!supabase) missingSupabase()
  const safeName = file.name.replace(/\s+/g, '-')
  const filePath = `candidate-portal/${applicationRef}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('recruiting-documents').upload(filePath, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('recruiting-documents').getPublicUrl(filePath)
  return { path: filePath, url: data.publicUrl }
}

export async function submitCandidateApplication({ user, job, profile, payload, cvUpload, skills = [], experience = [] }) {
  if (!supabase || !user?.id) throw new Error('Candidate session missing.')

  const snapshot = buildCandidateSnapshot(
    {
      ...profile,
      first_name: payload.first_name || profile.first_name || '',
      last_name: payload.last_name || profile.last_name || '',
      email: payload.email || profile.email || user.email || '',
      phone: payload.phone || profile.phone || '',
      location: payload.location || profile.location || '',
      linkedin_url: payload.linkedin_url || profile.linkedin_url || '',
      portfolio_url: payload.portfolio_url || profile.portfolio_url || '',
      summary: payload.experience_summary || profile.summary || '',
    },
    skills,
    experience,
  )

  const applicationRef = `DH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const baseRecord = {
    job_post_id: job.id,
    application_ref: applicationRef,
    status: 'new',
    first_name: payload.first_name || profile.first_name || '',
    last_name: payload.last_name || profile.last_name || '',
    full_name: `${payload.first_name || profile.first_name || ''} ${payload.last_name || profile.last_name || ''}`.trim(),
    email: payload.email || profile.email || user.email || '',
    phone: payload.phone || profile.phone || '',
    location: payload.location || profile.location || '',
    linkedin_url: payload.linkedin_url || profile.linkedin_url || '',
    portfolio_url: payload.portfolio_url || profile.portfolio_url || '',
    cv_file_url: cvUpload?.url || '',
    cv_file_path: cvUpload?.path || '',
    cover_note: payload.cover_note || '',
    experience_summary: payload.experience_summary || '',
    current_job_title: payload.current_job_title || '',
    years_experience: payload.years_experience || '',
    screening_answers: payload.screening_answers || {},
    commission_acknowledged: payload.commission_acknowledged === true,
    privacy_acknowledged: payload.privacy_acknowledged !== false,
    source: 'candidate_portal',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const extendedRecord = {
    ...baseRecord,
    candidate_user_id: user.id,
    portal_status: 'active',
    portal_last_viewed_at: new Date().toISOString(),
    candidate_profile_snapshot: snapshot,
  }

  let result = await supabase.from('job_applications').insert(extendedRecord).select('*, job_posts(*)').single()
  if (result.error && isMissingSchemaError(result.error, /candidate_user_id|portal_status|portal_last_viewed_at|candidate_profile_snapshot/i)) {
    result = await supabase.from('job_applications').insert(baseRecord).select('*, job_posts(*)').single()
  }
  if (result.error) throw result.error

  const inserted = result.data
  const roleTitle = inserted?.job_posts?.title || job.title || 'Application'

  const emailResults = await Promise.allSettled([
    sendCandidateApplicationConfirmation({
      candidateEmail: baseRecord.email,
      candidateName: baseRecord.full_name || baseRecord.email,
      roleTitle,
      applicationRef: inserted?.application_ref || applicationRef,
    }),
    sendRecruitingNewApplicationNotification({
      roleTitle,
      applicationRef: inserted?.application_ref || applicationRef,
      candidateName: baseRecord.full_name || baseRecord.email,
      candidateEmail: baseRecord.email,
      candidatePhone: baseRecord.phone,
      location: baseRecord.location,
      currentRole: baseRecord.current_job_title,
    }),
  ])

  const failedEmail = emailResults.find((entry) => entry.status === 'rejected')
  if (failedEmail) {
    console.warn('Application emails failed after insert:', failedEmail.reason)
  }

  return mapApplication(inserted)
}

export async function bookInterviewSlot(slotId) {
  if (!supabase) missingSupabase()
  const rpc = await supabase.rpc('book_candidate_interview_slot', { slot_id_input: slotId })
  if (!rpc.error) return rpc.data

  if (!isMissingSchemaError(rpc.error, /book_candidate_interview_slot|function/i)) throw rpc.error

  const { data: slot, error: slotError } = await supabase.from('candidate_interview_slots').select('*').eq('id', slotId).maybeSingle()
  if (slotError) throw slotError
  if (!slot) throw new Error('Interview slot is no longer available.')
  const { data: authData } = await supabase.auth.getUser()
  const currentUserId = authData?.user?.id || null

  const { error: bookError } = await supabase
    .from('candidate_interview_slots')
    .update({
      status: 'booked',
      booked_by_user_id: currentUserId,
      booked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
  if (bookError) throw bookError

  await supabase
    .from('candidate_interview_slots')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('application_id', slot.application_id)
    .neq('id', slotId)
    .eq('status', 'open')

  await supabase
    .from('job_applications')
    .update({ status: uiStatusToDb('INTERVIEW_SCHEDULED'), updated_at: new Date().toISOString() })
    .eq('id', slot.application_id)

  return { slot_id: slotId, application_id: slot.application_id, status: 'booked' }
}
