"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export interface AdminStats {
  users: { total: number; newThisWeek: number; todayActive: number; premiumSubscribers: number; trialUsers: number }
  storage: { totalBytes: number; totalLimitBytes: number; totalFormatted: string; usedPercent: number; averagePerUser: number; topUsers: any[]; largestFiles: any[] }
  files: { total: number; todayUploads: number; typeDistribution: Record<string, number> }
  revenue: { monthly: number; total: number; monthlyFormatted: string; totalFormatted: string; failedPayments: number }
  subscriptions: { active: number; premium: number; trial: number }
  ai: { totalRequests: number }
  whatsapp: { totalProtected: number }
  growth: { dailyUploads: Record<string, number>; dailyStorage: Record<string, number> }
  health: string
}

export interface SystemAlert {
  id: number
  alert_type: string
  severity: "critical" | "warning" | "info"
  message: string
  metadata: any
  resolved_at: string | null
  created_at: string
}

export interface AdminActivity {
  id: string
  type: string
  title: string
  description: string | null
  user_id: string
  created_at: string
  user?: { full_name: string | null; email: string | null } | null
}

export interface SystemHealthEntry {
  id: number
  service: string
  status: "healthy" | "degraded" | "down"
  latency_ms: number | null
  last_checked: string
}

export interface DashboardMetrics {
  total_users: number
  new_users_week: number
  new_users_today: number
  total_admins: number
  total_files: number
  today_uploads: number
  total_trashed: number
  failed_uploads: number
  total_storage_bytes: number
  total_limit_bytes: number
  total_revenue: number
  monthly_revenue: number
  today_revenue_count: number
  today_revenue_amount: number
  failed_payments: number
  premium_subscribers: number
  trial_users: number
  total_active_subscriptions: number
  total_ai_requests: number
  today_ai_requests: number
  whatsapp_protected_users: number
  today_whatsapp_backups: number
  today_activities: number
  today_signups: number
  today_logins: number
  today_payments: number
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

export function useAdminRealtime() {
  const supabase = useRef(createClient())
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [health, setHealth] = useState<SystemHealthEntry[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const channelsRef = useRef<ReturnType<typeof supabase.current.channel>[]>([])
  const mountedRef = useRef(true)

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/stats")
      if (!r.ok) throw new Error("Erreur de chargement")
      const d = await r.json()
      if (mountedRef.current) {
        setStats(d)
        setError(null)
        setLastUpdated(new Date())
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await supabase.current.from("dashboard_metrics").select("*").limit(1).maybeSingle()
      if (data && mountedRef.current) {
        setMetrics(data as unknown as DashboardMetrics)
      }
    } catch { /* view may not be immediately available */ }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/activity?page=1&pageSize=10")
      if (!r.ok) return
      const d = await r.json()
      if (mountedRef.current) setActivities(d.activities || [])
    } catch { /* silent */ }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await supabase.current
        .from("system_alerts")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(10)
      if (mountedRef.current) setAlerts(data || [])
    } catch { /* silent */ }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const { data } = await supabase.current.from("system_health").select("*").order("service")
      if (data && data.length > 0) {
        if (mountedRef.current) setHealth(data as SystemHealthEntry[])
        return
      }
    } catch { /* fallback below */ }

    // Fallback
    try {
      const r = await fetch("/api/admin/health")
      if (r.ok) {
        const data = await r.json()
        if (mountedRef.current) setHealth(data)
      }
    } catch { /* silent */ }
  }, [])

  const refresh = useCallback(() => {
    fetchStats()
    fetchMetrics()
    fetchActivities()
    fetchAlerts()
    fetchHealth()
  }, [fetchStats, fetchMetrics, fetchActivities, fetchAlerts, fetchHealth])

  // Initial load
  useEffect(() => {
    refresh()
    return () => { mountedRef.current = false }
  }, [refresh])

  // Realtime subscriptions
  useEffect(() => {
    const sup = supabase.current
    const id = Date.now()
    const channels: ReturnType<typeof sup.channel>[] = []
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const setupChannels = () => {
      const chFiles = sup
        .channel(`admin-files-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "files" }, () => { fetchStats(); fetchMetrics() })
        .subscribe((status) => { if (status === "SUBSCRIBED") setConnectionStatus("connected") })

      const chQuota = sup
        .channel(`admin-quota-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "storage_quotas" }, () => { fetchStats(); fetchMetrics() })
        .subscribe()

      const chActivities = sup
        .channel(`admin-activities-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, async (payload: RealtimePostgresChangesPayload<any>) => {
          const newAct = payload.new as any
          let user = null
          if (newAct.user_id) {
            const { data } = await sup.from("profiles").select("full_name, email").eq("id", newAct.user_id).maybeSingle()
            user = data
          }
          if (mountedRef.current) {
            setActivities(prev => [{ ...newAct, user }, ...prev].slice(0, 100))
            fetchMetrics()
          }
        })
        .subscribe()

      const chPayments = sup
        .channel(`admin-payments-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { fetchStats(); fetchMetrics(); fetchAlerts() })
        .subscribe()

      const chProfiles = sup
        .channel(`admin-profiles-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => { fetchStats(); fetchMetrics() })
        .subscribe()

      const chAlerts = sup
        .channel(`admin-alerts-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "system_alerts" }, (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            const newAlert = payload.new as SystemAlert
            if (!newAlert.resolved_at && mountedRef.current) {
              setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)])
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as SystemAlert
            if (mountedRef.current) {
              setAlerts(prev => updated.resolved_at ? prev.filter(a => a.id !== updated.id) : prev.map(a => a.id === updated.id ? updated : a))
            }
          }
        })
        .subscribe()

      const chHealth = sup
        .channel(`admin-health-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "system_health" }, () => fetchHealth())
        .subscribe()

      const chSubscriptions = sup
        .channel(`admin-subs-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => { fetchStats(); fetchMetrics() })
        .subscribe()

      channels.push(chFiles, chQuota, chActivities, chPayments, chProfiles, chAlerts, chHealth, chSubscriptions)
      channelsRef.current = channels
    }

    setupChannels()

    // Metrics view refresh (every 10s since views can't be realtime)
    const metricsInterval = setInterval(fetchMetrics, 10000)

    // Reconnect on visibility change (tab becomes active again)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setConnectionStatus("connecting")
        fetchAlerts()
        fetchHealth()
        fetchMetrics()
        clearTimeout(reconnectTimer!)
        reconnectTimer = setTimeout(() => {
          // Clean up old channels and re-subscribe
          channels.forEach(ch => sup.removeChannel(ch))
          channels.length = 0
          setupChannels()
        }, 1000)
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      clearInterval(metricsInterval)
      clearTimeout(reconnectTimer!)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      channels.forEach(ch => sup.removeChannel(ch))
    }
  }, [fetchStats, fetchMetrics, fetchAlerts, fetchHealth])

  const resolveAlert = useCallback(async (alertId: number) => {
    try {
      await supabase.current.from("system_alerts").update({ resolved_at: new Date().toISOString() }).eq("id", alertId)
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch { /* silent */ }
  }, [])

  const totalAlerts = alerts.length

  return {
    stats,
    loading,
    error,
    activities,
    alerts,
    health,
    metrics,
    connectionStatus,
    lastUpdated,
    refresh,
    resolveAlert,
    totalAlerts,
  }
}
