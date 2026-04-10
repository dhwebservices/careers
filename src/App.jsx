import React, { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck,
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Upload,
  User,
  Users,
} from 'lucide-react'
import {
  bookInterviewSlot,
  claimExistingApplications,
  ensureCandidateProfile,
  fetchCandidateProfile,
  listCandidateApplications,
  listCandidateExperience,
  listCandidateInterviews,
  listCandidateMessages,
  listCandidateSkills,
  listPublishedJobs,
  resetCandidatePassword,
  saveCandidateExperience,
  saveCandidateProfile,
  saveCandidateSkills,
  signInCandidate,
  signOutCandidate,
  signUpCandidate,
  submitCandidateApplication,
  syncCandidateProfileSnapshot,
  uploadCandidateCv,
} from './lib/candidateApi'
import { isSupabaseConfigured } from './lib/env'
import { supabase } from './lib/supabase'

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

const jobsSeed = [
  {
    id: 'eng-01',
    slug: 'senior-react-engineer',
    title: 'Senior React Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salaryRange: '£85,000 - £110,000',
    featured: true,
    isOpen: true,
    description:
      'Join our core platform team to build high-performance web applications for enterprise clients. You will architect solutions handling millions of daily interactions, driving technical excellence across the organization.',
    responsibilities: [
      'Architect scalable front-end web applications.',
      'Mentor mid-level engineers.',
      'Define internal engineering standards and review architecture.',
    ],
    requirements: [
      '5+ years React and TypeScript.',
      'Deep expertise in state management.',
      'Track record of delivering scalable enterprise systems.',
    ],
    benefits: 'Remote-first setup, focused engineering time, strong technical standards, and meaningful ownership.',
    summary: 'Lead front-end delivery across high-performance client and platform systems.',
  },
  {
    id: 'des-01',
    slug: 'lead-ux-ui-designer',
    title: 'Lead UX/UI Designer',
    department: 'Design',
    location: 'London, UK',
    type: 'Full-time',
    salaryRange: '£75,000 - £95,000',
    featured: true,
    isOpen: true,
    description:
      'Shape the digital experiences we deliver to our top-tier clients. We look for designers who obsess over micro-interactions while understanding macro business goals.',
    responsibilities: [
      'Lead end-to-end design.',
      'Maintain DH design system.',
      'Present strategic concepts to executive stakeholders.',
    ],
    requirements: [
      '6+ years product design.',
      'Figma proficiency.',
      'World-class portfolio demonstrating systematic thinking.',
    ],
    benefits: 'High-trust creative ownership, close collaboration with engineering, and serious design standards.',
    summary: 'Own product and client-facing design systems with a strong editorial and interface lens.',
  },
  {
    id: 'sales-01',
    slug: 'client-outreach-executive',
    title: 'Client Outreach Executive',
    department: 'Client Success',
    location: 'Remote',
    type: 'Contract',
    salaryRange: 'Commission only',
    featured: false,
    isOpen: true,
    commissionOnly: true,
    description:
      'Drive outbound engagement and build early client relationships for DH Website Services. This role is structured around proactive outreach and conversion activity.',
    responsibilities: [
      'Run consistent outbound activity.',
      'Qualify leads and hand over strong opportunities.',
      'Maintain clean communication and activity notes.',
    ],
    requirements: [
      'Clear written communication.',
      'Comfort with outbound sales.',
      'Confidence working independently.',
    ],
    benefits: 'Flexible structure, clear commission model, and direct line into growth work.',
    summary: 'Outbound-focused role for candidates who are comfortable generating conversations and opportunities.',
  },
]

const initialUser = {
  id: 'user-demo',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+44 7700 900077',
  linkedIn: 'linkedin.com/in/janedoe',
  portfolio: 'janedoe.dev',
  resumeUrl: 'resume_v3.pdf',
  createdAt: '2026-01-10T00:00:00Z',
}

const initialApplications = [
  {
    id: 'app-101',
    candidateId: 'user-demo',
    jobId: 'eng-01',
    status: 'INTERVIEW_INVITED',
    appliedAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-04-05T14:30:00Z',
    experienceNotes: 'Led front-end teams across React products with a focus on performance and maintainability.',
  },
]

const initialInterviews = [
  {
    id: 'int-201',
    applicationId: 'app-101',
    title: 'Technical Assessment & System Design',
    method: 'Video Call',
    locationDetails: 'Link will be provided upon confirmation',
    durationMinutes: 90,
    availableSlots: ['2026-04-14T10:00:00Z', '2026-04-14T14:00:00Z', '2026-04-15T11:00:00Z'],
    selectedSlot: '',
    status: 'INVITED',
    interviewerNames: ['Sarah Jenkins (Engineering Manager)', 'David Chen (Principal Engineer)'],
  },
]

const initialMessages = [
  {
    id: 'msg-301',
    applicationId: 'app-101',
    senderName: 'Elena Rodriguez (Talent Acquisition)',
    content:
      'We were impressed by your application and portfolio. Please select an interview time in your portal to confirm the next step.',
    createdAt: '2026-04-05T14:30:00Z',
  },
]

const RouterContext = createContext(null)
const AuthContext = createContext(null)
const DataContext = createContext(null)

function useRouter() {
  return useContext(RouterContext)
}

function useAuth() {
  return useContext(AuthContext)
}

function useData() {
  return useContext(DataContext)
}

function BrandLogo({ className = '', invert = false }) {
  return (
    <div className={`flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className={`${invert ? 'text-blue-300' : 'text-blue-600'}`}>DH</span>
      <span className={invert ? 'text-white' : 'text-slate-900'}>Website Services</span>
    </div>
  )
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-black',
    secondary: 'border border-slate-200 bg-white text-slate-900 hover:border-slate-900',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-950',
    light: 'bg-white text-slate-950 hover:bg-slate-100',
  }

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const labels = {
    SUBMITTED: 'Application Submitted',
    UNDER_REVIEW: 'Under Review',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW_INVITED: 'Action Required',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    OFFER_EXTENDED: 'Offer Extended',
    HIRED: 'Hired',
    REJECTED: 'Not Selected',
    WITHDRAWN: 'Withdrawn',
  }

  const tones = {
    SUBMITTED: 'bg-slate-100 text-slate-600',
    UNDER_REVIEW: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    SHORTLISTED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    INTERVIEW_INVITED: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    INTERVIEW_SCHEDULED: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
    OFFER_EXTENDED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    HIRED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    REJECTED: 'bg-slate-100 text-slate-500',
    WITHDRAWN: 'bg-slate-100 text-slate-500',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[status] || tones.SUBMITTED}`}>
      {labels[status] || status}
    </span>
  )
}

function PublicHeader({ dark = false }) {
  const { navigate, route } = useRouter()
  const { user } = useAuth()

  return (
    <header className={`sticky top-0 z-30 border-b ${dark ? 'border-white/8 bg-slate-950/30 text-white backdrop-blur-xl' : 'border-slate-200/60 bg-slate-50/85 text-slate-900 backdrop-blur-xl'}`}>
      <div className="mx-auto flex min-h-20 w-[min(1180px,calc(100%-40px))] items-center justify-between gap-4">
        <button type="button" onClick={() => navigate('/')} className="inline-flex items-center">
          <BrandLogo invert={dark} />
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className={`text-sm font-medium ${route.path === '/jobs' ? (dark ? 'text-white' : 'text-slate-950') : (dark ? 'text-white/70' : 'text-slate-500')}`}
          >
            Open roles
          </button>
          <button
            type="button"
            onClick={() => navigate('/about')}
            className={`text-sm font-medium ${route.path === '/about' ? (dark ? 'text-white' : 'text-slate-950') : (dark ? 'text-white/70' : 'text-slate-500')}`}
          >
            Working here
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Button variant={dark ? 'light' : 'primary'} onClick={() => navigate('/portal/dashboard')}>
              Candidate Portal
            </Button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`hidden text-sm font-medium sm:block ${dark ? 'text-white/75' : 'text-slate-600'}`}
              >
                Sign in
              </button>
              <Button variant={dark ? 'light' : 'primary'} onClick={() => navigate('/signup')}>
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-900 bg-slate-950 pb-10 pt-20 text-slate-400">
      <div className="pointer-events-none absolute bottom-[-180px] left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-blue-900/25 blur-[100px]" />
      <div className="relative z-10 mx-auto grid w-[min(1180px,calc(100%-40px))] gap-12 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">
        <div>
          <BrandLogo invert />
          <h3 className="mt-6 max-w-sm font-serif text-4xl font-semibold leading-none text-white">Build the next stage of your career with DH.</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            Explore live vacancies, create one candidate account, and track recruitment updates in one place.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Careers</h4>
          <ul className="grid gap-3 text-sm">
            <li>Open roles</li>
            <li>Working here</li>
            <li>Candidate portal</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Contact</h4>
          <ul className="grid gap-3 text-sm">
            <li className="inline-flex items-center gap-2"><Mail size={14} /> careers@dhwebsiteservices.co.uk</li>
            <li className="inline-flex items-center gap-2"><ArrowUpRight size={14} /> dhwebsiteservices.co.uk</li>
            <li className="inline-flex items-center gap-2"><MapPin size={14} /> Pontypridd, Wales</li>
          </ul>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-5">
          <div className="inline-flex items-start gap-3">
            <Briefcase size={18} className="mt-0.5 text-white" />
            <div>
              <strong className="block text-sm text-white">One account, every application</strong>
              <span className="mt-2 block text-sm leading-6 text-slate-400">
                Track status changes, interview invitations, and future opportunities in one place.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function JobCard({ job, ctaTo, ctaParams, ctaLabel = 'View role' }) {
  const { navigate } = useRouter()

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold leading-tight text-slate-950">{job.title}</h3>
          <p className="mt-3 max-w-[46ch] text-sm leading-7 text-slate-600">{job.summary || job.description}</p>
        </div>
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{job.department}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><MapPin size={14} /> {job.location}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><Briefcase size={14} /> {job.type}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><FileText size={14} /> {job.salaryRange || 'Package discussed'}</span>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="grid gap-1 text-xs leading-6 text-slate-500">
          <span>Applications managed through the DH candidate portal</span>
          <span>Reviewed inside the DH staff portal</span>
        </div>
        <Button variant="secondary" onClick={() => navigate(ctaTo, ctaParams)}>
          {ctaLabel}
          <ArrowRight size={16} />
        </Button>
      </div>
    </article>
  )
}

function HomePage() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const { jobs } = useData()
  const featured = useMemo(() => jobs.filter((job) => job.featured).slice(0, 3), [jobs])

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <PublicHeader dark />
        <div className="pointer-events-none absolute right-[-120px] top-[-70px] h-[340px] w-[340px] rounded-full bg-blue-600/25 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-[-110px] left-[12%] h-[340px] w-[340px] rounded-full bg-blue-800/25 blur-[90px]" />

        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-7 py-24 lg:grid-cols-[1.3fr_0.72fr]">
          <div>
            <p className="mb-3 text-xs font-semibold text-white/60">DH Careers</p>
            <h1 className="max-w-[10ch] font-serif text-[clamp(3.8rem,8vw,6.25rem)] font-semibold leading-[0.88]">Do the best work of your career.</h1>
            <p className="mt-5 max-w-[44rem] text-lg leading-8 text-white/74">
              We engineer digital infrastructure for demanding businesses. Browse live roles, create one candidate account, and manage applications and interviews through a cleaner portal experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="light" onClick={() => navigate('/jobs')}>
                View open roles
                <ArrowRight size={16} />
              </Button>
              <button type="button" className="text-sm font-medium text-white/80" onClick={() => navigate('/about')}>
                Working here
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/8 bg-white/8 px-4 text-sm text-white/84"><Sparkles size={16} /> Profile-first applications</div>
              <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/8 bg-white/8 px-4 text-sm text-white/84"><CheckCircle2 size={16} /> Shared recruitment status</div>
              <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/8 bg-white/8 px-4 text-sm text-white/84"><Briefcase size={16} /> Staff portal connected</div>
            </div>
          </div>

          <aside className="self-end rounded-[26px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold text-white/60">Candidate portal</p>
            <strong className="mt-2 block text-xl text-white">{user ? 'Your account is ready to use' : 'Create one account, use it everywhere'}</strong>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div><span className="block text-3xl font-semibold">{jobs.length}</span><small className="text-sm text-white/62">Live roles</small></div>
              <div><span className="block text-3xl font-semibold">{new Set(jobs.map((job) => job.department)).size}</span><small className="text-sm text-white/62">Hiring teams</small></div>
              <div><span className="block text-3xl font-semibold">{jobs.filter((job) => job.commissionOnly).length}</span><small className="text-sm text-white/62">Commission-led</small></div>
            </div>
            <p className="mt-6 text-sm leading-7 text-white/68">
              The candidate portal uses the same jobs, applications, and interview scheduling records the DH hiring team manages internally.
            </p>
          </aside>
        </div>
      </section>

      <section className="px-0 py-20">
        <div className="mx-auto flex w-[min(1180px,calc(100%-40px))] items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-500">Featured roles</p>
            <h2 className="font-serif text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-none tracking-tight text-slate-950">Open opportunities across the business.</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Current vacancies published directly from the recruitment workspace. What you see here is the same live role data the hiring team works from.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/jobs')} className="hidden items-center gap-2 text-sm font-semibold text-slate-950 md:inline-flex">
            See all roles
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="mx-auto mt-8 grid w-[min(1180px,calc(100%-40px))] gap-5 lg:grid-cols-3">
          {featured.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              ctaTo={user ? '/portal/apply' : '/jobs/detail'}
              ctaParams={{ id: job.id, jobId: job.id }}
              ctaLabel={user ? 'Apply now' : 'View role'}
            />
          ))}
        </div>
      </section>

      <section className="bg-white/40 py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-5 lg:grid-cols-3">
          <article className="rounded-[24px] border border-slate-200 bg-white/82 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-500">Why DH</p>
            <h3 className="mt-4 text-[1.7rem] font-semibold leading-tight text-slate-950">Craftsmanship over noise.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">We care about durable implementation, thoughtful design, and communication that respects clients and the people doing the work.</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white/82 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-500">Candidate experience</p>
            <h3 className="mt-4 text-[1.7rem] font-semibold leading-tight text-slate-950">One account, not the same form every time.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Your profile, applications, and interview actions live in one place instead of being scattered across repeated forms and email chains.</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white/82 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-500">Recruitment flow</p>
            <h3 className="mt-4 text-[1.7rem] font-semibold leading-tight text-slate-950">Connected directly to the internal workflow.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Statuses, new applications, and interview invites all sit on the same shared recruitment records the staff portal manages.</p>
          </article>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function AboutPage() {
  const { navigate } = useRouter()
  const values = [
    {
      icon: FileText,
      title: 'Craftsmanship over shortcuts',
      body: 'We care about durable work, clear systems, and output that feels deliberate. Speed matters, but not at the cost of quality or trust.',
    },
    {
      icon: Users,
      title: 'Direct communication',
      body: 'We prefer clarity over ceremony. Good decisions come from honest feedback, clean handovers, and a team that owns its outcomes.',
    },
    {
      icon: Shield,
      title: 'Operational maturity',
      body: 'From client delivery to recruitment and internal systems, we build with the assumption that the details matter because they do.',
    },
  ]

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="px-0 py-20">
        <div className="mx-auto w-[min(840px,calc(100%-40px))]">
          <p className="mb-3 text-xs font-semibold text-slate-500">Working at DH</p>
          <h1 className="font-serif text-[clamp(3rem,6vw,4.8rem)] font-semibold leading-[0.92] tracking-tight text-slate-950">A company built around good work, clear thinking, and reliable delivery.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            DH Website Services is not trying to feel like a generic startup. We care about strong systems, thoughtful execution, and building a place where people can do serious work without unnecessary noise.
          </p>
        </div>
      </section>

      <section className="px-0 pb-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-5 lg:grid-cols-3">
          {values.map((item) => (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-white/82 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <item.icon size={18} />
              <h3 className="mt-4 text-[1.7rem] font-semibold leading-tight text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white/40 py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-500">How recruitment works</p>
            <h2 className="font-serif text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-none tracking-tight text-slate-950">A cleaner candidate process from account creation to interview booking.</h2>
          </div>
          <div className="grid gap-5">
            <div className="border-t border-slate-200 py-5 first:border-t-0 first:pt-0">
              <strong className="block text-lg text-slate-950">1. Create one account</strong>
              <p className="mt-2 text-sm leading-7 text-slate-600">Store your core details once and use them again whenever you apply to another DH role.</p>
            </div>
            <div className="border-t border-slate-200 py-5">
              <strong className="block text-lg text-slate-950">2. Apply through the portal</strong>
              <p className="mt-2 text-sm leading-7 text-slate-600">Complete a structured application tied to the same live jobs and statuses the internal team works from.</p>
            </div>
            <div className="border-t border-slate-200 py-5">
              <strong className="block text-lg text-slate-950">3. Track updates properly</strong>
              <p className="mt-2 text-sm leading-7 text-slate-600">Follow status changes, interview actions, and future communication in one place rather than scattered across emails.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto flex w-[min(1180px,calc(100%-40px))] flex-col items-start justify-between gap-5 rounded-[28px] border border-slate-200 bg-white/88 p-8 shadow-[0_22px_48px_rgba(15,23,42,0.08)] md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-500">Open opportunities</p>
            <h2 className="max-w-3xl font-serif text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-none tracking-tight text-slate-950">If the way we work sounds like a fit, start with the current live roles.</h2>
          </div>
          <Button variant="primary" onClick={() => navigate('/jobs')}>
            Explore roles
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function JobsPage() {
  const { navigate } = useRouter()
  const { user } = useAuth()
  const { jobs } = useData()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const departments = useMemo(() => [...new Set(jobs.map((job) => job.department))], [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const haystack = [job.title, job.department, job.location, job.description, job.summary].join(' ').toLowerCase()
      const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase())
      const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter
      return matchesSearch && matchesDepartment
    })
  }, [departmentFilter, jobs, search])

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <section className="py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-6 lg:grid-cols-[1.35fr_0.78fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white/84 p-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <p className="mb-3 text-xs font-semibold text-slate-500">Current vacancies</p>
            <h1 className="font-serif text-[clamp(3rem,6vw,4.8rem)] font-semibold leading-[0.92] tracking-tight text-slate-950">Find the role that fits how you want to work.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Browse live DH Website Services openings, keep your candidate profile up to date, and move from interest to application without repeating the same details every time.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-white/86 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} />
                  <div>
                    <strong className="block text-sm text-slate-950">Profile-first applications</strong>
                    <span className="mt-2 block text-sm leading-6 text-slate-600">Your account carries your details, experience, and future updates with you.</span>
                  </div>
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-white/86 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong className="block text-sm text-slate-950">Direct recruitment flow</strong>
                    <span className="mt-2 block text-sm leading-6 text-slate-600">These are the same live roles and updates the hiring team manages internally.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white/88 p-7 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700">
              <Briefcase size={16} />
              Open roles snapshot
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div><span className="block text-3xl font-semibold text-slate-950">{jobs.length}</span><small className="text-sm text-slate-500">Live vacancies</small></div>
              <div><span className="block text-3xl font-semibold text-slate-950">{departments.length}</span><small className="text-sm text-slate-500">Departments</small></div>
              <div><span className="block text-3xl font-semibold text-slate-950">{jobs.filter((job) => job.commissionOnly).length}</span><small className="text-sm text-slate-500">Commission-led</small></div>
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">{user ? 'Your account is ready to apply.' : 'Sign in to apply faster and keep your profile reusable.'}</p>
          </aside>
        </div>

        <div className="mx-auto mt-8 grid w-[min(1180px,calc(100%-40px))] gap-4">
          <label className="flex min-h-14 items-center gap-3 rounded-[16px] border border-slate-200 bg-white/88 px-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <Search size={17} className="text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, department, or location"
              className="w-full border-0 bg-transparent p-0 text-slate-950 outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setDepartmentFilter('all')} className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${departmentFilter === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white/82 text-slate-600'}`}>
              All roles
            </button>
            {departments.map((department) => (
              <button
                type="button"
                key={department}
                onClick={() => setDepartmentFilter(department)}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${departmentFilter === department ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white/82 text-slate-600'}`}
              >
                {department}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 grid w-[min(1180px,calc(100%-40px))] gap-5 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              ctaTo={user ? '/portal/apply' : '/jobs/detail'}
              ctaParams={{ id: job.id, jobId: job.id }}
              ctaLabel={user ? 'Apply now' : 'View role'}
            />
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function JobDetailPage() {
  const { route, navigate, goBack } = useRouter()
  const { user } = useAuth()
  const { jobs } = useData()
  const job = jobs.find((item) => item.id === route.params?.id) || jobs[0]

  if (!job) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <section className="py-20">
          <div className="mx-auto w-[min(860px,calc(100%-40px))] rounded-[28px] border border-slate-200 bg-white/88 p-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <h1 className="text-[2rem] font-semibold text-slate-950">Role not found</h1>
            <p className="mt-3 text-base leading-8 text-slate-600">That role is no longer available or could not be loaded from the recruitment workspace.</p>
            <Button className="mt-6" onClick={() => navigate('/jobs')}>Back to roles</Button>
          </div>
        </section>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-6">
          <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ArrowLeft size={16} />
            All roles
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.78fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white/84 p-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <p className="mb-3 text-xs font-semibold text-slate-500">Live role</p>
              <h1 className="font-serif text-[clamp(3rem,6vw,4.8rem)] font-semibold leading-[0.92] tracking-tight text-slate-950">{job.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{job.summary || job.description}</p>
            </div>

            <aside className="rounded-[28px] border border-slate-200 bg-white/88 p-7 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="grid gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><MapPin size={14} /> {job.location}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><Briefcase size={14} /> {job.type}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><FileText size={14} /> {job.salaryRange || 'Discussed at interview'}</span>
              </div>

              <Button className="mt-6 w-full" onClick={() => navigate(user ? '/portal/apply' : '/login', user ? undefined : { jobId: job.id })}>
                {user ? 'Start application' : 'Sign in to apply'}
              </Button>
              {!user ? <p className="mt-3 text-sm leading-7 text-slate-500">Candidates need an account to apply and manage updates.</p> : null}
            </aside>
          </div>

          {[
            ['About the role', job.description],
            ['Responsibilities', job.responsibilities.join('\n')],
            ['Requirements', job.requirements.join('\n')],
            ['Benefits', job.benefits],
          ].map(([title, content]) => (
            <section key={title} className="rounded-[28px] border border-slate-200 bg-white/84 p-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
              <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-600">{content}</div>
            </section>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}

function AuthPage({ mode }) {
  const { route, navigate } = useRouter()
  const { login, signup, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const currentMode = route.params?.mode === 'reset' ? 'reset' : (mode || 'login')

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email)
    }
  }, [route.params?.email])

  useEffect(() => {
    if (route.params?.notice === 'account-created') {
      setMessage('Account created. Check your email if confirmation is enabled, then sign in.')
      return
    }
    if (route.params?.notice === 'portal-invite') {
      setMessage('Sign in with the same email address used on your application to connect your existing recruitment record.')
      return
    }
  }, [route.params?.notice])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (currentMode === 'forgot') {
        await resetPassword(email)
        setLoading(false)
        setMessage(`Password reset sent to ${email}.`)
        return
      }

      if (currentMode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        if (!supabase) {
          throw new Error('Supabase is not configured yet.')
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setMessage('Password updated. You can now sign in with the new password.')
        navigate('/login', { email })
        return
      }

      if (currentMode === 'signup' && password !== confirmPassword) {
        throw new Error('Passwords do not match.')
      }

      if (currentMode === 'signup') {
        const redirectTarget = route.params?.applicationId
          ? `/portal/application?${new URLSearchParams({ id: route.params.applicationId }).toString()}`
          : route.params?.jobId
            ? `/portal/apply?${new URLSearchParams({ jobId: route.params.jobId }).toString()}`
            : '/portal/dashboard'
        await signup(email, password, redirectTarget)
        navigate('/login', { ...route.params, notice: 'account-created' })
        return
      }

      await login(email, password)
      if (route.params?.applicationId) {
        navigate('/portal/application', { id: route.params.applicationId })
      } else if (route.params?.jobId) {
        navigate('/portal/apply', { jobId: route.params.jobId })
      } else {
        navigate('/portal/dashboard')
      }
    } catch (error) {
      setMessage(error?.message || 'We could not complete that action.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[1.04fr_0.96fr]">
        <section className="flex flex-col justify-between bg-slate-950 px-10 py-14 text-white">
          <div>
            <p className="mb-3 text-xs font-semibold text-white/58">Candidate portal</p>
            <h1 className="max-w-[10ch] font-serif text-[clamp(3.8rem,8vw,6.25rem)] font-semibold leading-[0.88]">Your profile, applications, and hiring updates in one place.</h1>
            <p className="mt-5 max-w-[40rem] text-lg leading-8 text-white/74">
              Create one DH candidate account, reuse your saved details for future roles, and track interview invitations and status changes without chasing separate email threads.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['One secure account', 'Existing applicants can sign in with the same email to connect historic applications.'],
              ['Shared recruitment data', 'Your portal reflects the same application records and interview invites managed by the DH team.'],
              ['Reusable candidate profile', 'Store your details, experience, work history, and supporting links once.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[20px] border border-white/8 bg-white/5 p-5">
                <strong className="block text-sm text-white">{title}</strong>
                <span className="mt-2 block text-sm leading-6 text-white/64">{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid place-items-center px-6 py-10">
          <div className="w-[min(540px,100%)] rounded-[28px] border border-slate-200 bg-white/94 p-7 shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
            <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
              <button type="button" className={`min-h-10 rounded-full px-4 text-sm font-semibold ${currentMode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`} onClick={() => navigate('/login', route.params)}>
                Sign in
              </button>
              <button type="button" className={`min-h-10 rounded-full px-4 text-sm font-semibold ${currentMode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`} onClick={() => navigate('/signup', route.params)}>
                Create account
              </button>
              {currentMode !== 'reset' ? (
                <button type="button" className={`min-h-10 rounded-full px-4 text-sm font-semibold ${currentMode === 'forgot' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`} onClick={() => navigate('/forgot', route.params)}>
                  Reset password
                </button>
              ) : null}
            </div>

            <h2 className="mt-6 text-[2rem] font-semibold leading-tight text-slate-950">
              {currentMode === 'signup' ? 'Create your candidate account' : currentMode === 'forgot' ? 'Reset your password' : currentMode === 'reset' ? 'Choose a new password' : 'Sign in to manage your applications'}
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              {currentMode === 'reset'
                ? 'Enter and confirm a new password for your candidate account.'
                : 'Existing applicants should use the same email address they already applied with so we can attach their live recruitment record to this portal account.'}
            </p>

            {message ? (
              <div className={`mt-5 rounded-[20px] border p-4 ${/(created|sent|updated|sign in with the same email)/i.test(message) ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700' : 'border-red-200 bg-red-50/80 text-red-700'}`}>
                {message}
              </div>
            ) : null}

            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-900">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
                  required
                />
              </div>

              {currentMode !== 'forgot' ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">Password</label>
                    {currentMode === 'login' ? (
                      <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => navigate('/forgot', route.params)}>
                        Forgot password?
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
                    required
                  />
                </div>
              ) : null}

              {currentMode === 'signup' || currentMode === 'reset' ? (
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-900">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
                    required
                  />
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Working...' : currentMode === 'signup' ? 'Create candidate account' : currentMode === 'forgot' ? 'Send reset link' : currentMode === 'reset' ? 'Update password' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} />
                <span>Candidate accounts can reuse saved details across future applications.</span>
              </div>
              <button type="button" onClick={() => navigate('/jobs')} className="text-sm font-semibold text-blue-600">
                Browse live roles
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function PortalLayout({ children }) {
  const { user, profile, logout } = useAuth()
  const { route, navigate } = useRouter()
  const displayName = `${profile?.first_name || user?.user_metadata?.first_name || ''} ${profile?.last_name || user?.user_metadata?.last_name || ''}`.trim() || user?.email || 'Candidate'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const navItems = [
    { label: 'Overview', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'Applications', path: '/portal/applications', icon: FileCheck },
    { label: 'Interviews', path: '/portal/interviews', icon: Calendar },
  ]

  return (
    <div className="grid min-h-screen lg:grid-cols-[268px_minmax(0,1fr)]">
      <aside className="border-r border-slate-200/70 bg-slate-50/82 p-5 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-blue-800 to-blue-500 text-sm font-semibold text-white">DH</div>
          <div>
            <strong className="block text-sm text-slate-950">DH Careers</strong>
            <span className="block text-xs text-slate-500">Candidate portal</span>
          </div>
        </div>

        <nav className="grid gap-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex min-h-12 items-center gap-3 rounded-[14px] px-4 text-sm font-medium ${route.path === item.path ? 'bg-blue-50 text-slate-950' : 'text-slate-600'}`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 rounded-[20px] border border-white/6 bg-slate-900 p-5 text-white">
          <p className="mb-2 text-xs font-semibold text-white/55">Connected workflow</p>
          <strong className="block text-sm">Shared with the staff portal</strong>
          <span className="mt-2 block text-sm leading-6 text-white/64">
            Your applications, interview slots, and candidate profile sit on the same recruitment records the DH team manages internally.
          </span>
        </div>

        <Button variant="secondary" className="mt-6 w-full" onClick={logout}>
          Sign out
        </Button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/60 bg-slate-50/84 px-7 py-4 backdrop-blur-xl">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">Candidate workspace</p>
            <h1 className="font-serif text-[2rem] font-semibold leading-none text-slate-950">DH Careers Candidate Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/jobs')} className="text-sm font-medium text-slate-600">
              Browse roles
            </button>
            <button type="button" onClick={() => navigate('/portal/interviews')} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/92 text-slate-600">
              <Bell size={17} />
            </button>
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/92 px-2 py-1">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-blue-600 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="pr-2">
                <strong className="block text-sm text-slate-950">{displayName}</strong>
                <span className="block text-xs text-slate-500">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-7 py-7">{children}</main>
      </div>
    </div>
  )
}

function PortalDashboard() {
  const { user, profile } = useAuth()
  const { navigate } = useRouter()
  const { applications, interviews, jobs } = useData()
  const actionRequiredInterviews = interviews.filter((interview) => interview.status === 'INVITED')
  const profileReadiness = Math.min(
    100,
    Math.round(
      (
        [
          profile?.first_name,
          profile?.last_name,
          profile?.phone,
          profile?.location,
          profile?.linkedin_url || profile?.portfolio_url,
          profile?.summary,
        ].filter(Boolean).length /
          6
      ) * 100,
    ),
  )

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.78fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-7 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <h2 className="text-[2rem] font-semibold leading-tight text-slate-950">Welcome back, {user?.user_metadata?.first_name || profile?.first_name || user?.email?.split('@')[0] || 'there'}.</h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Your candidate account is the home for profile updates, future applications, recruiter-driven status changes, and interview scheduling.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button onClick={() => navigate('/portal/profile')}>Finish your profile</Button>
            <Button variant="secondary" onClick={() => navigate('/jobs')}>Browse live roles</Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-7 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-slate-500">Profile readiness</p>
          <span className="mt-3 block text-4xl font-semibold text-slate-950">{profileReadiness}%</span>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The more complete your profile is, the faster you can apply and the clearer your recruiter view becomes.
          </p>
        </div>
      </section>

      {actionRequiredInterviews.length ? (
        <section className="flex flex-col items-start justify-between gap-5 rounded-[20px] border border-amber-200 bg-amber-50/80 p-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <AlertCircle size={20} className="mt-0.5 text-amber-700" />
            <div>
              <strong className="block text-sm text-amber-950">Interview action required</strong>
              <span className="mt-1 block text-sm leading-6 text-amber-800">You have an interview invitation waiting for a slot selection.</span>
            </div>
          </div>
          <Button className="bg-amber-700 hover:bg-amber-800" onClick={() => navigate('/portal/interviews')}>
            Book time
          </Button>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ['Applications', applications.length, 'Linked to your account'],
          ['Interviews', applications.filter((application) => application.status.includes('INTERVIEW')).length, 'Applications in interview flow'],
          ['Open roles', jobs.length, 'Currently published'],
        ].map(([label, value, copy]) => (
          <article key={label} className="rounded-[24px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <span className="mt-3 block text-4xl font-semibold text-slate-950">{value}</span>
            <small className="mt-2 block text-sm text-slate-500">{copy}</small>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-950">Recent applications</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">Track every role already tied to your account.</p>
            </div>
            <button type="button" onClick={() => navigate('/portal/applications')} className="text-sm font-semibold text-blue-600">See all</button>
          </div>

          <div className="grid gap-4">
            {applications.map((application) => {
              const job = jobs.find((item) => item.id === application.jobId)
              return (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => navigate('/portal/application', { id: application.id })}
                  className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white p-5 text-left"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">{job?.title || 'Application'}</h4>
                    <p className="mt-2 text-sm text-slate-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={application.status} />
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-950">Good roles to review now</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">Current vacancies from the live recruitment workspace.</p>
            </div>
            <button type="button" onClick={() => navigate('/jobs')} className="text-sm font-semibold text-blue-600">All roles</button>
          </div>

          <div className="grid gap-4">
            {jobs.slice(0, 2).map((job) => (
              <JobCard key={job.id} job={job} ctaTo="/portal/apply" ctaParams={{ jobId: job.id }} ctaLabel="Apply now" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          [User, 'Update profile', 'Keep your contact details, work history, and recruiter-facing summary current.', '/portal/profile'],
          [ClipboardList, 'View applications', 'Check live status updates and the full history tied to your account.', '/portal/applications'],
          [Calendar, 'Manage interviews', 'See open interview invitations and confirm bookings from one place.', '/portal/interviews'],
        ].map(([Icon, title, body, path]) => (
          <button key={title} type="button" onClick={() => navigate(path)} className="grid gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-6 text-left shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <Icon size={18} />
            <strong className="text-lg text-slate-950">{title}</strong>
            <span className="text-sm leading-7 text-slate-600">{body}</span>
          </button>
        ))}
      </section>
    </div>
  )
}

function PortalApplications() {
  const { applications, jobs } = useData()
  const { navigate } = useRouter()

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold text-slate-500">Application history</p>
        <h2 className="mt-3 text-[2rem] font-semibold text-slate-950">Everything tied to your account</h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-slate-600">
          Applications already submitted with this email address are linked to your candidate account so the hiring updates you see here match the same records used in the staff portal.
        </p>
      </section>

      <div className="grid gap-4">
        {applications.map((application) => {
          const job = jobs.find((item) => item.id === application.jobId)
          return (
            <article key={application.id} className="rounded-[24px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{job?.title || 'Application'}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{job?.department}</span>
                    <span>&mdash;</span>
                    <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <StatusBadge status={application.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{job?.department}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{job?.location}</span>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  Status updates appear here once the recruiter moves your application through the DH recruitment workflow.
                </p>
                <div className="flex flex-wrap gap-3">
                  {application.status.includes('INTERVIEW') ? (
                    <Button variant="secondary" onClick={() => navigate('/portal/interviews')}>
                      Book interview
                    </Button>
                  ) : null}
                  <button type="button" onClick={() => navigate('/portal/application', { id: application.id })} className="text-sm font-semibold text-blue-600">
                    View status
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function PortalApplicationDetail() {
  const { route, goBack, navigate } = useRouter()
  const { applications, jobs, messages, interviews } = useData()
  const application = applications.find((item) => item.id === route.params?.id) || applications[0]
  if (!application) {
    return (
      <div className="grid gap-6">
        <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <h2 className="text-[2rem] font-semibold text-slate-950">Application not available yet</h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-slate-600">
            Your account is signed in, but that linked application has not loaded into the candidate workspace yet. This usually resolves once the recruitment records finish syncing to your account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/portal/dashboard')}>Go to dashboard</Button>
            <Button variant="secondary" onClick={() => navigate('/portal/applications')}>View all applications</Button>
          </div>
        </section>
      </div>
    )
  }
  const job = jobs.find((item) => item.id === application.jobId)
  const applicationMessages = messages.filter((item) => item.applicationId === application.id)
  const interview = interviews.find((item) => item.applicationId === application.id)

  const steps = [
    { key: 'SUBMITTED', label: 'Applied' },
    { key: 'UNDER_REVIEW', label: 'Review' },
    { key: 'INTERVIEW', label: 'Interview' },
    { key: 'DECISION', label: 'Decision' },
  ]

  function getStepState(stepKey) {
    const status = application.status
    if (['REJECTED', 'WITHDRAWN'].includes(status)) return 'error'
    if (stepKey === 'SUBMITTED') return 'complete'
    if (stepKey === 'UNDER_REVIEW') return ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_INVITED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED'].includes(status) ? 'complete' : 'current'
    if (stepKey === 'INTERVIEW') return status.includes('INTERVIEW') ? 'current' : ['OFFER_EXTENDED', 'HIRED'].includes(status) ? 'complete' : 'upcoming'
    if (stepKey === 'DECISION') return ['OFFER_EXTENDED', 'HIRED'].includes(status) ? 'complete' : 'upcoming'
    return 'upcoming'
  }

  return (
    <div className="grid gap-6">
      <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
        <ArrowLeft size={16} />
        Back
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-[2rem] font-semibold text-slate-950">{job?.title || 'Application'}</h2>
            <p className="mt-3 text-base leading-8 text-slate-600">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {steps.map((step) => {
            const state = getStepState(step.key)
            return (
              <div key={step.key} className="inline-flex items-center gap-3">
                <div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${state === 'complete' ? 'border-slate-900 bg-slate-900 text-white' : state === 'current' ? 'border-slate-900 text-slate-900' : state === 'error' ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 text-slate-300'}`}>
                  {state === 'complete' ? <Check size={14} /> : <div className="h-2 w-2 rounded-full bg-current" />}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${state === 'upcoming' ? 'text-slate-400' : 'text-slate-950'}`}>{step.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <h3 className="text-2xl font-semibold text-slate-950">Messages</h3>
          <div className="mt-5 grid gap-5">
            {applicationMessages.map((message) => (
              <div key={message.id} className="border-l-2 border-slate-200 pl-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-slate-950">{message.senderName}</strong>
                  <span className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">{message.content}</p>
              </div>
            ))}
          </div>
        </section>

        {interview ? (
          <section className={`rounded-[28px] border p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${interview.status === 'INVITED' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white/88'}`}>
            <h3 className="text-2xl font-semibold text-slate-950">Interview schedule</h3>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
              <div>
                <strong className="block text-slate-950">Format</strong>
                {interview.method} ({interview.durationMinutes}m)
              </div>
              <div>
                <strong className="block text-slate-950">Interviewers</strong>
                {interview.interviewerNames.join(', ')}
              </div>
            </div>

            {interview.status === 'INVITED' ? (
              <Button className="mt-8 w-full bg-amber-700 hover:bg-amber-800" onClick={() => navigate('/portal/interviews')}>
                Select time slot
              </Button>
            ) : (
              <div className="mt-8 rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-center">
                <strong className="block text-sm text-slate-950">Confirmed time</strong>
                <span className="mt-2 block text-slate-600">{new Date(interview.selectedSlot).toLocaleString()}</span>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function PortalInterviews() {
  const { interviews, applications, jobs, bookInterview } = useData()
  const [loadingMap, setLoadingMap] = useState({})

  function buildInterviewCalendarUrl(interview, jobTitle) {
    const start = new Date(interview.selectedSlot)
    if (Number.isNaN(start.getTime())) return '#'
    const end = new Date(start.getTime() + Number(interview.durationMinutes || 60) * 60000)
    const toUtcStamp = (value) =>
      value
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z')

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${jobTitle || interview.title} interview`,
      dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
      details: `DH Careers interview${interview.locationDetails ? `\n\nLocation: ${interview.locationDetails}` : ''}`,
      location: interview.locationDetails || 'DH Website Services',
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  async function handleBook(slotId, applicationId) {
    const key = `${applicationId}:${slotId}`
    setLoadingMap((current) => ({ ...current, [key]: true }))
    try {
      await bookInterview(slotId)
    } finally {
      setLoadingMap((current) => ({ ...current, [key]: false }))
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold text-slate-500">Interview workspace</p>
        <h2 className="mt-3 text-[2rem] font-semibold text-slate-950">Manage interview invitations and confirmed bookings.</h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-slate-600">
          When the DH hiring team publishes interview times from the staff portal, they appear here automatically so you can review the invite, choose a slot, and confirm your booking.
        </p>
      </section>

      {interviews.map((interview) => {
        const application = applications.find((item) => item.id === interview.applicationId)
        const job = jobs.find((item) => item.id === application?.jobId)
        return (
          <article key={interview.id} className="rounded-[28px] border border-slate-200 bg-white/88 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-6 md:flex-row md:items-start">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">{job?.title || interview.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{interview.method} &mdash; {interview.durationMinutes} mins</p>
              </div>
              {interview.status === 'INVITED'
                ? <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">Action needed</span>
                : <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Scheduled</span>}
            </div>

            <div className="p-6">
              {interview.status === 'INVITED' ? (
                <div>
                  <h4 className="mb-4 text-base font-semibold text-slate-950">Available times</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {interview.availableSlots.map((slot) => {
                      const key = `${interview.applicationId}:${slot.id}`
                      const date = new Date(slot.startAt)
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={loadingMap[key]}
                          onClick={() => handleBook(slot.id, interview.applicationId)}
                          className="rounded-[18px] border border-slate-200 p-5 text-left transition hover:border-slate-900"
                        >
                          <div className="font-semibold text-slate-950">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                          <div className="mt-1 text-sm text-slate-500">{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-5 rounded-[18px] border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed date</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">{new Date(interview.selectedSlot).toLocaleString()}</div>
                    <a href={interview.locationDetails || '#'} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <LinkIcon size={16} />
                      Join video call
                    </a>
                  </div>
                  <a href={buildInterviewCalendarUrl(interview, job?.title)} target="_blank" rel="noreferrer">
                    <Button variant="secondary">Add to calendar</Button>
                  </a>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function PortalApply() {
  const { route, goBack, navigate } = useRouter()
  const { user, profile } = useAuth()
  const { jobs, submitApplication, skills, experienceRows } = useData()
  const job = jobs.find((item) => item.id === route.params?.jobId) || jobs[0]
  const [currentStep, setCurrentStep] = useState(0)
  const [experience, setExperience] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [commissionConfirmed, setCommissionConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    first_name: profile?.first_name || user?.user_metadata?.first_name || '',
    last_name: profile?.last_name || user?.user_metadata?.last_name || '',
    email: user.email,
    phone: profile?.phone || '',
    location: profile?.location || 'United Kingdom',
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
    current_job_title: '',
    years_experience: '',
    cover_note: '',
  })

  useEffect(() => {
    setForm((current) => ({
      ...current,
      first_name: profile?.first_name || user?.user_metadata?.first_name || current.first_name,
      last_name: profile?.last_name || user?.user_metadata?.last_name || current.last_name,
      email: user?.email || current.email,
      phone: profile?.phone || current.phone,
      location: profile?.location || current.location,
      linkedin_url: profile?.linkedin_url || current.linkedin_url,
      portfolio_url: profile?.portfolio_url || current.portfolio_url,
    }))
  }, [profile, user?.email, user?.user_metadata?.first_name, user?.user_metadata?.last_name])

  const steps = ['Personal details', 'Experience', 'Questions & CV', 'Review']

  function canAdvance() {
    if (currentStep === 0) return form.first_name && form.last_name && form.email && form.phone
    if (currentStep === 1) return experience.trim()
    if (currentStep === 2) return cvFile && (!job.commissionOnly || commissionConfirmed)
    return true
  }

  async function handleSubmit() {
    if (!job || !user) return
    setLoading(true)
    try {
      const created = await submitApplication({
        user,
        job,
        profile,
        payload: {
          ...form,
          experience_summary: experience,
          commission_acknowledged: commissionConfirmed,
          privacy_acknowledged: true,
          screening_answers: {},
        },
        cvFile,
        skills,
        experienceRows,
      })
      navigate('/portal/application', { id: created.id })
    } catch (error) {
      window.alert(error?.message || 'Could not submit your application.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
        <ArrowLeft size={16} />
        Cancel
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold text-slate-500">Application flow</p>
        <h2 className="mt-3 text-[2rem] font-semibold text-slate-950">Apply for {job.title}</h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-slate-600">
          This guided application uses your candidate profile as the starting point, then captures role-specific answers and your latest CV.
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        {steps.map((step, index) => (
          <div key={step} className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold ${index === currentStep ? 'border-transparent bg-slate-900 text-white' : 'border-slate-200 bg-white/82 text-slate-500'}`}>
            <span>{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        {currentStep === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['first_name', 'First name'],
              ['last_name', 'Last name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Location'],
              ['linkedin_url', 'LinkedIn URL'],
              ['portfolio_url', 'Portfolio URL'],
              ['current_job_title', 'Current role'],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <label className="text-sm font-semibold text-slate-900">{label}</label>
                <input
                  value={form[key] || ''}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
                />
              </div>
            ))}
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-900">Years of relevant experience</label>
              <input
                value={form.years_experience}
                onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-900">Relevant experience</label>
              <textarea
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                className="min-h-36 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-900">Cover note</label>
              <textarea
                value={form.cover_note}
                onChange={(event) => setForm((current) => ({ ...current, cover_note: event.target.value }))}
                className="min-h-28 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
              />
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="grid gap-5">
            <div className={`flex items-center gap-4 rounded-[18px] border p-5 ${cvFile ? 'border-emerald-300 bg-emerald-50/70' : 'border-dashed border-slate-300 bg-slate-50/80'}`}>
              <Upload size={18} className={cvFile ? 'text-emerald-600' : 'text-slate-400'} />
              <div className="flex-1">
                <strong className="block text-sm text-slate-950">{cvFile ? 'CV successfully attached' : 'Upload a file or drag and drop'}</strong>
                <span className="mt-1 block text-sm text-slate-500">{cvFile ? cvFile.name : 'PDF, DOCX up to 10MB'}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(event) => setCvFile(event.target.files?.[0] || null)}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Select file</Button>
            </div>

            {job.commissionOnly ? (
              <label className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50/70 p-5 text-sm leading-7 text-amber-900">
                <input type="checkbox" checked={commissionConfirmed} onChange={(event) => setCommissionConfirmed(event.target.checked)} className="mt-1" />
                <span>I understand and confirm that this is a commission-only role and does not include a base salary.</span>
              </label>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="grid gap-5">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-5">
              <strong className="block text-sm text-slate-950">Final review</strong>
              <p className="mt-2 text-sm leading-7 text-slate-600">Check your details before submission. Once sent, the recruiting team will review this application inside the internal staff portal.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Name', `${form.first_name} ${form.last_name}`],
                ['Email', form.email],
                ['Phone', form.phone],
                ['Location', form.location],
                ['Current role', form.current_job_title || 'Not provided'],
                ['Experience', form.years_experience || 'Not provided'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] bg-slate-50 p-4">
                  <strong className="block text-sm text-slate-950">{label}</strong>
                  <span className="mt-2 block text-sm text-slate-600">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4">
              <strong className="block text-sm text-slate-950">Relevant experience</strong>
              <p className="mt-2 text-sm leading-7 text-slate-600">{experience || 'Not provided'}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Button variant="secondary" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}>
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button disabled={!canAdvance()} onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))}>
              Continue
            </Button>
          ) : (
            <Button disabled={loading} onClick={handleSubmit}>
              {loading ? 'Submitting...' : 'Submit application'}
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}

function PortalProfile() {
  const { profile } = useAuth()
  const { skills, setSkills, experienceRows, setExperienceRows, saveProfile } = useData()
  const [form, setForm] = useState(EMPTY_PROFILE)

  useEffect(() => {
    setForm({
      ...EMPTY_PROFILE,
      ...profile,
    })
  }, [profile])

  const completion = Math.min(
    100,
    Math.round(
      (
        [
          form.first_name,
          form.last_name,
          form.phone,
          form.location,
          form.linkedin_url || form.portfolio_url,
          form.summary,
          skills.filter((skill) => skill.name).length > 0,
          experienceRows.filter((row) => row.company || row.title).length > 0,
        ].filter(Boolean).length /
          8
      ) * 100,
    ),
  )

  async function handleSaveProfile() {
    try {
      await saveProfile(form)
      window.alert('Profile saved.')
    } catch (error) {
      window.alert(error?.message || 'Could not save your profile.')
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.78fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <h2 className="text-[2rem] font-semibold text-slate-950">Keep your profile recruiter-ready.</h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            The recruiting team should be able to understand who you are, what you can do, and how to contact you before you even submit a fresh application.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold text-slate-500">Completion</p>
          <span className="mt-3 block text-4xl font-semibold text-slate-950">{completion}%</span>
          <p className="mt-3 text-sm leading-7 text-slate-600">Profile completeness across the key candidate fields that matter most.</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="mb-5">
          <h3 className="text-2xl font-semibold text-slate-950">Personal details</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">This becomes the base layer for future applications and internal recruiter review.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['First name', 'first_name'],
            ['Last name', 'last_name'],
            ['Phone', 'phone'],
            ['Date of birth', 'date_of_birth'],
            ['NI number', 'ni_number'],
            ['Location', 'location'],
            ['Address line 1', 'address_line_1'],
            ['Address line 2', 'address_line_2'],
            ['Town / city', 'city'],
            ['Postcode', 'postcode'],
            ['Country', 'country'],
            ['Right to work in UK', 'right_to_work_uk'],
            ['LinkedIn URL', 'linkedin_url'],
            ['Portfolio / website', 'portfolio_url'],
          ].map(([label, key]) => (
            <div key={label} className="grid gap-2">
              <label className="text-sm font-semibold text-slate-900">{label}</label>
              <input
                value={form[key] || ''}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <label className="text-sm font-semibold text-slate-900">Professional summary</label>
          <textarea
            value={form.summary || ''}
            onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            className="min-h-32 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-950">Skills</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Show the key capabilities recruiters should spot immediately.</p>
          </div>
          <Button variant="secondary" onClick={() => setSkills((current) => [...current, { name: '', proficiency: '', years: '' }])}>Add skill</Button>
        </div>

        <div className="grid gap-4">
          {skills.map((skill, index) => (
            <div key={`${skill.name}-${index}`} className="grid items-end gap-4 md:grid-cols-[1.35fr_1fr_0.7fr_auto]">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-900">Skill</label>
                <input value={skill.name} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-900">Level</label>
                <select value={skill.proficiency} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, proficiency: event.target.value } : item))} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none">
                  <option value="">Choose</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-900">Years</label>
                <input value={skill.years} onChange={(event) => setSkills((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, years: event.target.value } : item))} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none" />
              </div>
              <Button variant="secondary" className="md:w-11 md:px-0" onClick={() => setSkills((current) => current.filter((_, itemIndex) => itemIndex !== index) || [{ name: '', proficiency: '', years: '' }])}>
                <FileCheck size={16} />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-950">Experience</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Store a structured work history recruiters can review without leaving the portal.</p>
          </div>
          <Button variant="secondary" onClick={() => setExperienceRows((current) => [...current, { company: '', title: '', start: '', end: '', current: false, summary: '' }])}>Add experience</Button>
        </div>

        <div className="grid gap-5">
          {experienceRows.map((row, index) => (
            <div key={`${row.company}-${index}`} className="rounded-[20px] border border-slate-200 bg-slate-50/82 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <strong className="text-slate-950">Role {index + 1}</strong>
                <Button variant="secondary" className="md:w-11 md:px-0" onClick={() => setExperienceRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  <FileCheck size={16} />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Company', 'company'],
                  ['Job title', 'title'],
                  ['Start date', 'start'],
                  ['End date', 'end'],
                ].map(([label, key]) => (
                  <div key={key} className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-900">{label}</label>
                    <input value={row[key]} onChange={(event) => setExperienceRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.value } : item))} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none" />
                  </div>
                ))}
              </div>

              <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-600">
                <input type="checkbox" checked={row.current} onChange={(event) => setExperienceRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, current: event.target.checked } : item))} />
                I still work here
              </label>

              <div className="mt-4 grid gap-2">
                <label className="text-sm font-semibold text-slate-900">What did you do?</label>
                <textarea value={row.summary} onChange={(event) => setExperienceRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, summary: event.target.value } : item))} className="min-h-28 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <span className="text-sm leading-7 text-slate-600">Your information stays tied to your candidate account and can be reused in future applications.</span>
        <Button onClick={handleSaveProfile}>Save profile</Button>
      </div>
    </div>
  )
}

function AppRouter() {
  const { route } = useRouter()
  const { user, sessionLoading } = useAuth()

  if (sessionLoading) return null

  if (route.path.startsWith('/portal') && !user) return <AuthPage mode="login" />

  if (route.path === '/') return <HomePage />
  if (route.path === '/about') return <AboutPage />
  if (route.path === '/jobs') return <JobsPage />
  if (route.path === '/jobs/detail') return <JobDetailPage />
  if (route.path === '/login') return <AuthPage mode="login" />
  if (route.path === '/signup') return <AuthPage mode="signup" />
  if (route.path === '/forgot') return <AuthPage mode="forgot" />
  if (route.path === '/portal/dashboard') return <PortalLayout><PortalDashboard /></PortalLayout>
  if (route.path === '/portal/applications') return <PortalLayout><PortalApplications /></PortalLayout>
  if (route.path === '/portal/application') return <PortalLayout><PortalApplicationDetail /></PortalLayout>
  if (route.path === '/portal/interviews') return <PortalLayout><PortalInterviews /></PortalLayout>
  if (route.path === '/portal/apply') return <PortalLayout><PortalApply /></PortalLayout>
  if (route.path === '/portal/profile') return <PortalLayout><PortalProfile /></PortalLayout>

  return <HomePage />
}

function parseRouteFromLocation() {
  const search = new URLSearchParams(window.location.search)
  const params = Object.fromEntries(search.entries())
  return {
    path: window.location.pathname || '/',
    params,
  }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRouteFromLocation())
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE })
  const [sessionLoading, setSessionLoading] = useState(true)
  const [jobs, setJobs] = useState(jobsSeed)
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [messages, setMessages] = useState([])
  const [skills, setSkills] = useState([])
  const [experienceRows, setExperienceRows] = useState([])

  const navigate = (path, params = {}) => {
    const nextRoute = { path, params }
    setRoute(nextRoute)
    const search = new URLSearchParams(params)
    const nextUrl = `${path}${search.toString() ? `?${search.toString()}` : ''}`
    window.history.pushState(nextRoute, '', nextUrl)
    window.scrollTo(0, 0)
  }

  const goBack = () => {
    if (window.history.length <= 1) {
      navigate('/')
      return
    }
    window.history.back()
  }

  useEffect(() => {
    const handlePopState = () => setRoute(parseRouteFromLocation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    let active = true

    async function bootstrapSession() {
      if (!supabase || !isSupabaseConfigured) {
        if (active) setSessionLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return
      setUser(data.session?.user || null)
      setSessionLoading(false)
    }

    bootstrapSession()

    if (!supabase || !isSupabaseConfigured) return undefined

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setUser(nextSession?.user || null)
      setSessionLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true
    listPublishedJobs()
      .then((data) => {
        if (active && data.length) setJobs(data)
      })
      .catch(() => {
        if (active) setJobs(jobsSeed)
      })
    return () => {
      active = false
    }
  }, [])

  async function refreshWorkspace(currentUser = user) {
    if (!currentUser?.id) {
      setApplications([])
      setInterviews([])
      setMessages([])
      setSkills([])
      setExperienceRows([])
      setProfile({ ...EMPTY_PROFILE })
      return
    }

    const [nextProfile, nextSkills, nextExperience] = await Promise.all([
      fetchCandidateProfile(currentUser),
      listCandidateSkills(currentUser.id),
      listCandidateExperience(currentUser.id),
    ])

    setProfile(nextProfile)
    setSkills((nextSkills || []).map((item) => ({
      name: item.name || '',
      proficiency: item.proficiency || '',
      years: item.years_experience || '',
    })))
    setExperienceRows((nextExperience || []).map((item) => ({
      company: item.company_name || '',
      title: item.job_title || '',
      start: item.start_date || '',
      end: item.end_date || '',
      current: item.is_current === true,
      summary: item.summary || '',
    })))

    const nextApplications = await listCandidateApplications({ userId: currentUser.id, email: currentUser.email })
    setApplications(nextApplications.length ? nextApplications : [])

    const [nextInterviews, nextMessages] = await Promise.all([
      listCandidateInterviews(nextApplications, currentUser.id),
      listCandidateMessages(nextApplications.map((item) => item.id)),
    ])
    setInterviews(nextInterviews)
    setMessages(nextMessages)
  }

  useEffect(() => {
    let active = true

    async function bootstrapUserData() {
      if (!user?.id) {
        setProfile({ ...EMPTY_PROFILE })
        setApplications([])
        setInterviews([])
        setMessages([])
        setSkills([])
        setExperienceRows([])
        return
      }

      try {
        await ensureCandidateProfile(user)
        await claimExistingApplications().catch(() => {})
        if (active) await refreshWorkspace(user)
      } catch (error) {
        console.error(error)
      }
    }

    bootstrapUserData()
    return () => {
      active = false
    }
  }, [user?.id])

  const login = async (email, password) => {
    const nextUser = await signInCandidate({ email, password })
    if (nextUser) {
      setUser(nextUser)
    }
  }

  const signup = async (email, password, redirectTo) => {
    return signUpCandidate({ email, password, redirectTo })
  }

  const resetPassword = async (email) => {
    await resetCandidatePassword(email)
  }

  const logout = async () => {
    await signOutCandidate()
    setUser(null)
    setProfile({ ...EMPTY_PROFILE })
    setApplications([])
    setInterviews([])
    setMessages([])
    setSkills([])
    setExperienceRows([])
    navigate('/login')
  }

  const saveProfile = async (nextProfile) => {
    if (!user?.id) throw new Error('Candidate session missing.')
    const savedProfile = await saveCandidateProfile(user.id, nextProfile)
    await Promise.all([
      saveCandidateSkills(user.id, skills),
      saveCandidateExperience(user.id, experienceRows),
    ])
    setProfile(savedProfile)
    await syncCandidateProfileSnapshot(savedProfile, skills, experienceRows).catch(() => {})
    await refreshWorkspace(user)
    return savedProfile
  }

  const submitApplication = async ({ user: candidateUser, job, profile: currentProfile, payload, cvFile, skills: profileSkills, experienceRows: profileExperience }) => {
    if (!candidateUser?.id) throw new Error('Candidate session missing.')
    let cvUpload = null
    if (cvFile) {
      cvUpload = await uploadCandidateCv(cvFile, `${job.slug || job.id}-${candidateUser.id}`)
    }
    const created = await submitCandidateApplication({
      user: candidateUser,
      job,
      profile: currentProfile,
      payload,
      cvUpload,
      skills: profileSkills,
      experience: profileExperience,
    })
    await refreshWorkspace(candidateUser)
    return created
  }

  const bookInterview = async (slotId) => {
    await bookInterviewSlot(slotId)
    await refreshWorkspace(user)
  }

  return (
    <RouterContext.Provider value={{ route, navigate, goBack }}>
      <AuthContext.Provider value={{ user, profile, sessionLoading, login, signup, resetPassword, logout }}>
        <DataContext.Provider
          value={{
            jobs,
            applications,
            interviews,
            messages,
            skills,
            setSkills,
            experienceRows,
            setExperienceRows,
            submitApplication,
            bookInterview,
            saveProfile,
          }}
        >
          <AppRouter />
        </DataContext.Provider>
      </AuthContext.Provider>
    </RouterContext.Provider>
  )
}
