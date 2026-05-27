"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { signOut as authSignOut } from "@/lib/auth/service"
import { getProfile, getStorageQuota, getSubscription, getRemainingTrialDays } from "@/lib/profile"
import type { AuthState, ProfileData, StorageQuota, SubscriptionData } from "@/lib/auth/types"
import { logger } from "@/lib/logger"

const supabase = createClient()

interface AuthContextType extends AuthState {
  profile: ProfileData | null
  storageQuota: StorageQuota | null
  subscription: SubscriptionData | null
  remainingTrialDays: number
  profileLoading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const fetchingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchProfileData = useCallback(async () => {
    if (fetchingRef.current || !mountedRef.current) return
    fetchingRef.current = true
    setProfileLoading(true)
    try {
      const [prof, quota, sub] = await Promise.all([
        getProfile(),
        getStorageQuota(),
        getSubscription(),
      ])
      if (mountedRef.current) {
        setProfile(prof)
        setStorageQuota(quota)
        setSubscription(sub)
      }
    } catch (err) {
      logger.error("fetchProfileData failed", err)
      if (mountedRef.current) {
        setProfile(null)
        setStorageQuota(null)
        setSubscription(null)
      }
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false)
      }
      fetchingRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (mountedRef.current) {
        setState({ user, session, loading: false })
      }
      if (user && mountedRef.current) {
        fetchProfileData()
      } else if (mountedRef.current) {
        setProfile(null)
        setStorageQuota(null)
        setSubscription(null)
      }
    } catch (err) {
      logger.error("Auth refresh failed", err)
      if (mountedRef.current) {
        setState({ user: null, session: null, loading: false })
      }
    }
  }, [fetchProfileData])

  const logout = useCallback(async () => {
    try {
      await authSignOut()
    } catch {
      // silent
    }
    if (mountedRef.current) {
      setState({ user: null, session: null, loading: false })
      setProfile(null)
      setStorageQuota(null)
      setSubscription(null)
    }
  }, [])

  useEffect(() => {
    refresh()

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) {
        setState({ user: session?.user ?? null, session, loading: false })
      }
      if (session?.user && mountedRef.current) {
        fetchProfileData()
      } else if (mountedRef.current) {
        setProfile(null)
        setStorageQuota(null)
        setSubscription(null)
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [refresh, fetchProfileData])

  const remainingTrialDays = getRemainingTrialDays(subscription)

  return (
    <AuthContext.Provider value={{ ...state, profile, storageQuota, subscription, remainingTrialDays, profileLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
