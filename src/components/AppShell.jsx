import { BriefcaseBusiness, FileText, LayoutGrid, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOutCandidate } from '../lib/candidateApi'
import { getInitials } from '../lib/format'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/applications', label: 'My applications', icon: FileText },
  { to: '/jobs', label: 'Open roles', icon: BriefcaseBusiness },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function Topbar() {
  const { profile, user } = useAuth()
  const location = useLocation()
  const titleMap = {
    '/': 'Candidate overview',
    '/applications': 'Your applications',
    '/jobs': 'Open roles',
    '/profile': 'Candidate profile',
  }
  const title = titleMap[location.pathname] || 'Candidate portal'
  const name = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user?.email || 'Candidate'

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>Manage your details, keep applications current, and follow recruitment updates in one place.</p>
      </div>
      <div className="user-pill">
        <div className="avatar">{getInitials(name)}</div>
        <div>
          <strong>{name}</strong>
          <span>{user?.email || 'Portal account'}</span>
        </div>
      </div>
    </header>
  )
}

export default function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="brand-badge">DH</div>
          <div className="brand-copy">
            <strong>DH Careers</strong>
            <span>Candidate portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-panel">
          <h3>One profile, multiple roles</h3>
          <p>Set up your details once, then reuse them when you apply to new opportunities across the business.</p>
        </div>

        <button className="sidebar-signout" type="button" onClick={signOutCandidate}>
          Sign out
        </button>
      </aside>

      <div className="main-column">
        <Topbar />
        <main className="page-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
