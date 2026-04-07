import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ensureCandidateProfile, fetchCandidateProfile } from '../lib/candidateApi'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      if (!supabase) {
        if (mounted) setSessionLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setSessionLoading(false)
    }

    bootstrap()

    if (!supabase) return undefined

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)
      setSessionLoading(false)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!user?.id || !supabase) {
        setProfile(null)
        return
      }

      setProfileLoading(true)

      try {
        await ensureCandidateProfile(user)
        const nextProfile = await fetchCandidateProfile(user.id)
        if (active) setProfile(nextProfile)
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [user?.id])

  const value = useMemo(() => ({
    session,
    user,
    profile,
    sessionLoading,
    profileLoading,
    refreshProfile: async () => {
      if (!user?.id) return null
      const nextProfile = await fetchCandidateProfile(user.id)
      setProfile(nextProfile)
      return nextProfile
    },
  }), [profile, profileLoading, session, sessionLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
