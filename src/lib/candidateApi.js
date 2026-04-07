import { env } from './env'
import { sendCandidateApplicationConfirmation, sendRecruitingNewApplicationNotification } from './email'
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
    skills: skills.map((skill) => ({
      name: String(skill.name || '').trim(),
      proficiency: String(skill.proficiency || '').trim(),
      years_experience: String(skill.years_experience || '').trim(),
    })).filter((skill) => skill.name),
    experience: experience.map((row) => ({
      company_name: String(row.company_name || '').trim(),
      job_title: String(row.job_title || '').trim(),
      start_date: row.start_date || null,
      end_date: row.end_date || null,
      is_current: row.is_current === true,
      summary: String(row.summary || '').trim(),
    })).filter((row) => row.company_name || row.job_title),
  }
}

export async function signInCandidate({ email, password }) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpCandidate({ email, password }) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.portalBaseUrl}/`,
    },
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
  if (error) throw error
  return draft
}

export async function fetchCandidateProfile(userId) {
  if (!supabase || !userId) return { ...EMPTY_PROFILE }
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return { ...EMPTY_PROFILE, ...(data || {}), user_id: userId }
}

export async function saveCandidateProfile(userId, payload) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')
  const { data, error } = await supabase
    .from('candidate_profiles')
    .upsert({
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listCandidateSkills(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('candidate_skills')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) throw error
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
      years_experience: String(skill.years_experience || '').trim(),
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
  const { data, error } = await supabase
    .from('candidate_experience')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function saveCandidateExperience(userId, rows) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')
  await supabase.from('candidate_experience').delete().eq('user_id', userId)
  const cleanRows = rows
    .map((row, index) => ({
      user_id: userId,
      company_name: String(row.company_name || '').trim(),
      job_title: String(row.job_title || '').trim(),
      start_date: row.start_date || null,
      end_date: row.is_current ? null : row.end_date || null,
      is_current: row.is_current === true,
      summary: String(row.summary || '').trim(),
      sort_order: index,
    }))
    .filter((row) => row.company_name || row.job_title)

  if (!cleanRows.length) return []
  const { data, error } = await supabase.from('candidate_experience').insert(cleanRows).select('*')
  if (error) throw error
  return data || []
}

export async function listPublishedJobs() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data || []
}

export async function getJobBySlug(slug) {
  if (!supabase || !slug) return null
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function listMyApplications(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, job_posts(*)')
    .eq('candidate_user_id', userId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getMyApplication(applicationId, userId) {
  if (!supabase || !applicationId || !userId) return null
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, job_posts(*)')
    .eq('id', applicationId)
    .eq('candidate_user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function listInterviewSlots(applicationId) {
  if (!supabase || !applicationId) return []
  const { data, error } = await supabase
    .from('candidate_interview_slots')
    .select('*')
    .eq('application_id', applicationId)
    .order('start_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function claimExistingApplications() {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const { error } = await supabase.rpc('claim_existing_candidate_applications')
  if (error) throw error
}

export async function completeInvite(token, email) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const { error } = await supabase.rpc('complete_candidate_invite', {
    invite_token: token,
    invite_email: email,
  })
  if (error) throw error
}

export async function bookInterviewSlot(slotId) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const { data, error } = await supabase.rpc('book_candidate_interview_slot', {
    slot_id_input: slotId,
  })
  if (error) throw error
  return data
}

export async function syncCandidateProfileSnapshot(profile, skills = [], experience = []) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const snapshot = buildCandidateSnapshot(profile, skills, experience)
  const { error } = await supabase.rpc('sync_candidate_profile_snapshot', {
    profile_payload: snapshot.profile,
    skills_payload: snapshot.skills,
    experience_payload: snapshot.experience,
  })
  if (error) throw error
}

export async function uploadCandidateCv(file, applicationRef) {
  if (!supabase) throw new Error('Supabase is not configured yet.')
  const safeName = file.name.replace(/\s+/g, '-')
  const filePath = `candidate-portal/${applicationRef}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from('recruiting-documents')
    .upload(filePath, file, { upsert: false })

  if (error) throw error

  const { data } = supabase.storage
    .from('recruiting-documents')
    .getPublicUrl(filePath)

  return { path: filePath, url: data.publicUrl }
}

export async function submitCandidateApplication({ userId, job, profile, payload, cvUpload }) {
  if (!supabase || !userId) throw new Error('Candidate session missing.')

  const snapshot = buildCandidateSnapshot({
    ...profile,
    first_name: payload.first_name || profile.first_name || '',
    last_name: payload.last_name || profile.last_name || '',
    email: payload.email || profile.email || '',
    phone: payload.phone || profile.phone || '',
    location: payload.location || profile.location || '',
    linkedin_url: payload.linkedin_url || profile.linkedin_url || '',
    portfolio_url: payload.portfolio_url || profile.portfolio_url || '',
  })

  const record = {
    candidate_user_id: userId,
    job_post_id: job.id,
    application_ref: `DH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: 'new',
    first_name: payload.first_name || profile.first_name || '',
    last_name: payload.last_name || profile.last_name || '',
    full_name: `${payload.first_name || profile.first_name || ''} ${payload.last_name || profile.last_name || ''}`.trim(),
    email: payload.email || profile.email || '',
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
    privacy_acknowledged: payload.privacy_acknowledged === true,
    source: 'candidate_portal',
    portal_status: 'active',
    portal_last_viewed_at: new Date().toISOString(),
    candidate_profile_snapshot: snapshot,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('job_applications')
    .insert(record)
    .select('*, job_posts(*)')
    .single()

  if (error) throw error

  const candidateName = record.full_name || record.email
  const roleTitle = data?.job_posts?.title || job.title || 'Application'
  const applicationRef = data?.application_ref || record.application_ref

  const emailResults = await Promise.allSettled([
    sendCandidateApplicationConfirmation({
      candidateEmail: record.email,
      candidateName,
      roleTitle,
      applicationRef,
    }),
    sendRecruitingNewApplicationNotification({
      roleTitle,
      applicationRef,
      candidateName,
      candidateEmail: record.email,
      candidatePhone: record.phone,
      location: record.location,
      currentRole: record.current_job_title,
    }),
  ])

  const failedEmail = emailResults.find((result) => result.status === 'rejected')
  if (failedEmail) {
    console.warn('Application emails failed after application insert:', failedEmail.reason)
  }

  return data
}
