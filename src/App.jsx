import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import LoadingView from './components/LoadingView'
import { useAuth } from './contexts/AuthContext'
import ApplicationsPage from './pages/ApplicationsPage'
import DashboardPage from './pages/DashboardPage'
import InviteAcceptPage from './pages/InviteAcceptPage'
import InterviewBookingPage from './pages/InterviewBookingPage'
import JobDetailPage from './pages/JobDetailPage'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/LoginPage'
import NewApplicationPage from './pages/NewApplicationPage'
import ProfilePage from './pages/ProfilePage'

function RequireAuth({ children }) {
  const { sessionLoading, user } = useAuth()
  const location = useLocation()

  if (sessionLoading) {
    return <LoadingView title="Opening your candidate portal" message="Checking your secure session and loading your profile." />
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace state={{ redirectTo }} />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:slug" element={<JobDetailPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="interviews/:applicationId" element={<InterviewBookingPage />} />
        <Route path="apply/:slug" element={<NewApplicationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
