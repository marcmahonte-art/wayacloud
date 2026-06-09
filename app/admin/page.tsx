"use client"

import { useAdminRealtime, type ConnectionStatus } from "@/lib/admin/useAdminRealtime"
import { Users, HardDrive, Upload, CreditCard, Activity, AlertTriangle, TrendingUp, TrendingDown, Database, Cloud, Cpu, Smartphone, Shield, Zap, Bell, ChevronRight, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, UserPlus, FileText, Share2, Download, MessageCircle, Wifi, WifiOff, Radio } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useEffect, useState } from "react"

const COLORS = ["#FF6300", "#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"]

function bytesToSize(bytes: number): string {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " To"
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " Go"
  return (bytes / 1e6).toFixed(1) + " Mo"
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `il y a ${days}j`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return n.toLocaleString()
}

const ACTIVITY_ICONS: Record<string, any> = {
  upload: Upload, delete: Upload, restore: RefreshCw, share: Share2,
  signup: UserPlus, payment: CreditCard, subscription: Shield,
  ai_action: Cpu, backup: Cloud, trash: Upload,
  login: UserPlus, whatsapp_backup: MessageCircle, share_download: Download,
}

const ACTIVITY_COLORS: Record<string, string> = {
  upload: "bg-green-100 text-green-700", delete: "bg-red-100 text-red-600",
  restore: "bg-blue-100 text-blue-600", share: "bg-purple-100 text-purple-600",
  signup: "bg-emerald-100 text-emerald-700", payment: "bg-amber-100 text-amber-700",
  subscription: "bg-indigo-100 text-indigo-600", ai_action: "bg-cyan-100 text-cyan-600",
  backup: "bg-sky-100 text-sky-600", trash: "bg-orange-100 text-orange-600",
  login: "bg-teal-100 text-teal-700", whatsapp_backup: "bg-green-100 text-green-700",
  share_download: "bg-violet-100 text-violet-600",
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const colorMap: Record<ConnectionStatus, string> = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
    error: "bg-red-500 animate-pulse",
  }
  const textMap: Record<ConnectionStatus, string> = {
    connected: "Connecté",
    connecting: "Connexion...",
    disconnected: "Déconnecté",
    error: "Erreur",
  }
  const IconMap: Record<ConnectionStatus, any> = {
    connected: Radio,
    connecting: Radio,
    disconnected: WifiOff,
    error: WifiOff,
  }
  const Icon = IconMap[status]
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition-all ${
      status === "connected" ? "bg-green-50 text-green-700 border-green-200" :
      status === "connecting" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
      "bg-red-50 text-red-700 border-red-200"
    }`}>
      <span className={`h-2 w-2 rounded-full ${colorMap[status]}`} />
      <Icon size={11} />
      {textMap[status]}
    </span>
  )
}

export default function AdminDashboard() {
  const { stats, loading, error, activities, alerts, health, metrics, connectionStatus, lastUpdated, refresh, resolveAlert } = useAdminRealtime()
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    if (lastUpdated) {
      setPulseKey(prev => prev + 1)
    }
  }, [metrics?.today_uploads, metrics?.total_users, metrics?.total_revenue, lastUpdated])

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-[#F0ECE6]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[130px] animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[340px] animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />)}</div>
    </div>
  )

  if (error || !stats) return (
    <div className="flex flex-col items-center justify-center py-24"><AlertTriangle size={44} className="text-red-300" /><p className="mt-4 text-[15px] font-semibold text-dark">Erreur de chargement</p><p className="text-[13px] text-[#69708A] mt-1">{error || "Impossible de charger les statistiques"}</p><button onClick={refresh} className="mt-4 flex items-center gap-1.5 h-9 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white hover:bg-primary/90"><RefreshCw size={14} /> Réessayer</button></div>
  )

  const { users, storage, files, revenue, subscriptions, ai, whatsapp, growth } = stats

  const growthData = Object.entries(growth?.dailyUploads || {}).slice(-30).map(([date, count]) => ({
    date: new Date(date + "T00:00:00").toLocaleDateString("fr", { day: "numeric", month: "short" }),
    uploads: count as number,
  }))

  const storageData = Object.entries(growth?.dailyStorage || {}).slice(-30).map(([date, bytes]) => ({
    date: new Date(date + "T00:00:00").toLocaleDateString("fr", { day: "numeric", month: "short" }),
    storage: Math.round(Number(bytes) / 1e9 * 100) / 100,
  }))

  const typeData = Object.entries(files?.typeDistribution || {}).map(([name, count]) => ({ name, value: count as number }))
  const unresolvedAlerts = alerts.filter(a => !a.resolved_at)
  const healthOk = health.filter(h => h.status === "healthy").length

  const kpiCardData = [
    {
      title: "Utilisateurs",
      value: formatNumber(users.total),
      sub: `+${users.newThisWeek} cette semaine · ${metrics?.today_signups ?? 0} aujourd'hui`,
      icon: Users,
      color: "bg-[#6366F1]",
    },
    {
      title: "Stockage total",
      value: storage.totalFormatted,
      sub: `${storage.usedPercent}% utilisé · ${files.total.toLocaleString()} fichiers`,
      icon: HardDrive,
      color: "bg-[#FF6300]",
    },
    {
      title: "Revenu mensuel",
      value: revenue.monthlyFormatted,
      sub: metrics ? `${metrics.today_payments} paiements aujourd'hui` : `${revenue.totalFormatted} cumulé`,
      icon: CreditCard,
      color: "bg-[#10B981]",
    },
    {
      title: "Abonnés premium",
      value: subscriptions.premium.toLocaleString(),
      sub: `${subscriptions.trial} en essai · ${subscriptions.active} actifs`,
      icon: Shield,
      color: "bg-[#8B5CF6]",
    },
  ]

  const kpiOpData = [
    {
      title: "Importés aujourd'hui",
      value: metrics?.today_uploads?.toLocaleString() ?? files.todayUploads.toLocaleString(),
      sub: `${files.total.toLocaleString()} fichiers total`,
      icon: Upload,
      color: "bg-[#F59E0B]",
    },
    {
      title: "Stockage moyen",
      value: bytesToSize(storage.averagePerUser),
      sub: "par utilisateur",
      icon: HardDrive,
      color: "bg-[#EC4899]",
    },
    {
      title: "Requêtes IA",
      value: metrics?.today_ai_requests?.toLocaleString() ?? ai.totalRequests.toLocaleString(),
      sub: `${ai.totalRequests.toLocaleString()} total`,
      icon: Activity,
      color: "bg-[#14B8A6]",
    },
    {
      title: "Activité aujourd'hui",
      value: metrics?.today_activities?.toLocaleString() ?? "0",
      sub: `${metrics?.today_logins ?? 0} connexions · ${metrics?.today_signups ?? 0} inscriptions`,
      icon: Zap,
      color: "bg-[#3B82F6]",
    },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-dark">CEO Dashboard</h1>
            <ConnectionBadge status={connectionStatus} />
          </div>
          <p className="text-[13px] text-[#69708A] mt-0.5 flex items-center gap-2">
            <span>Vue en temps réel — {users.total} utilisateurs</span>
            {lastUpdated && (
              <span className="text-[11px] text-[#9CA3AF]">
                · Mis à jour {formatTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E3DFE8] bg-white px-3 text-[12px] font-semibold text-[#69708A] hover:bg-[#F5F3F0] transition-colors"><RefreshCw size={13} /> Rafraîchir</button>
      </div>

      {/* Alert banner */}
      {unresolvedAlerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 animate-in slide-in-from-top-2">
          <Bell size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-amber-800">{unresolvedAlerts.length} alerte{unresolvedAlerts.length > 1 ? "s" : ""} non résolue{unresolvedAlerts.length > 1 ? "s" : ""}</p>
            <p className="text-[12px] text-amber-700 mt-0.5">{unresolvedAlerts[0].message}</p>
          </div>
          <button onClick={() => resolveAlert(unresolvedAlerts[0].id)} className="text-[12px] font-semibold text-amber-700 hover:underline shrink-0">Ignorer</button>
        </div>
      )}

      {/* KPI Cards — Row 1: Core metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCardData.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* KPI Cards — Row 2: Operations */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiOpData.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Live Activity Ticker */}
      <div className="rounded-xl border border-[#ECE7DF] bg-white px-5 py-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-primary shrink-0">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            EN DIRECT
          </span>
          <div className="h-5 overflow-hidden flex-1 relative">
            {activities.length > 0 && (
              <div className="absolute inset-0 flex items-center animate-marquee" key={activities[0].id}>
                <span className="text-[12px] text-[#69708A] whitespace-nowrap">
                  <span className="font-semibold text-dark">{activities[0].title}</span>
                  {activities[0].user?.full_name && (
                    <span> — par {activities[0].user.full_name}</span>
                  )}
                  <span className="text-[#9CA3AF] ml-2">{timeAgo(activities[0].created_at)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Uploads chart */}
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-dark">Importations quotidiennes (30j)</h3>
            {metrics && (
              <span className="text-[11px] text-[#69708A] bg-[#F5F3F0] px-2 py-0.5 rounded-md">
                {metrics.today_uploads} aujourd'hui
              </span>
            )}
          </div>
          <div className="h-[240px]">
            {growthData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-[#9CA3AF]">Aucune donnée d'importation</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs><linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6300" stopOpacity={0.15} /><stop offset="95%" stopColor="#FF6300" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #ECE7DF", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Area type="monotone" dataKey="uploads" stroke="#FF6300" fill="url(#uploadGrad)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Storage chart */}
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-dark">Stockage par type</h3>
            <span className="text-[11px] text-[#69708A] bg-[#F5F3F0] px-2 py-0.5 rounded-md">
              {files.total.toLocaleString()} fichiers
            </span>
          </div>
          <div className="h-[240px] flex items-center justify-center gap-4">
            {typeData.length === 0 ? (
              <div className="text-[13px] text-[#9CA3AF]">Aucun fichier</div>
            ) : (
              <>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #ECE7DF", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {typeData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-[11px]">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[#69708A] font-medium capitalize">{item.name}</span>
                      <span className="font-semibold text-dark">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: 3 panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Users */}
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-dark">Top stockage</h3>
            <Users size={15} className="text-[#69708A]" />
          </div>
          <div className="space-y-2.5">
            {storage.topUsers?.slice(0, 6).length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] py-4 text-center">Aucun utilisateur</p>
            ) : storage.topUsers?.slice(0, 6).map((u: any, i: number) => (
              <div key={u.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${i < 3 ? "bg-[#FFE8D9] text-primary" : "bg-[#F5F3F0] text-[#69708A]"}`}>{i + 1}</span>
                  <span className="text-[12px] text-dark font-medium truncate">{u.userId.slice(0, 8)}...</span>
                </div>
                <span className="text-[12px] font-semibold text-dark shrink-0">{u.usedFormatted}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-dark">Activités récentes</h3>
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
              <Activity size={15} className="text-[#69708A]" />
            </div>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] py-4 text-center">Aucune activité récente</p>
            ) : (
              <div className="divide-y divide-[#F5F3F0]">
                {activities.slice(0, 8).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] || Activity
                  const color = ACTIVITY_COLORS[a.type] || "bg-slate-100 text-slate-600"
                  return (
                    <div key={a.id} className="flex items-start gap-2.5 px-2 py-2.5 hover:bg-[#FDFCFB] transition-colors">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={12} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-semibold text-dark truncate">{a.title}</p>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{timeAgo(a.created_at)}</span>
                        </div>
                        {a.description && <p className="text-[11px] text-[#69708A] truncate">{a.description}</p>}
                        {a.user?.full_name && <p className="text-[10px] text-[#9CA3AF]">{a.user.full_name}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-dark">Santé du système</h3>
            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${healthOk === health.length ? "text-green-600" : "text-amber-600"}`}>
              <span className={`h-2 w-2 rounded-full ${healthOk === health.length ? "bg-green-500" : "bg-amber-500"} animate-pulse`} />
              {healthOk}/{health.length} OK
            </div>
          </div>
          <div className="space-y-2">
            {health.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] py-4 text-center">Chargement...</p>
            ) : health.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FDFCFB]">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    h.status === "healthy" ? "bg-green-100 text-green-600" : h.status === "degraded" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                  }`}>
                    {h.status === "healthy" ? <CheckCircle size={12} /> : h.status === "degraded" ? <AlertCircle size={12} /> : <XCircle size={12} />}
                  </span>
                  <span className="text-[12px] font-medium text-dark capitalize">{h.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  {h.latency_ms != null && <span className="text-[10px] text-[#9CA3AF]">{h.latency_ms}ms</span>}
                  <span className={`text-[11px] font-semibold ${
                    h.status === "healthy" ? "text-green-600" : h.status === "degraded" ? "text-amber-600" : "text-red-600"
                  }`}>{h.status === "healthy" ? "OK" : h.status === "degraded" ? "Dégradé" : "HS"}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0ECE6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#69708A]">Stockage utilisé</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-dark">{storage.usedPercent}%</span>
                <div className="w-24 h-1.5 rounded-full bg-[#EFEAF6]">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${storage.usedPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#69708A]">Paiements échoués</span>
              <span className="text-[12px] font-semibold text-red-500">{revenue.failedPayments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#69708A]">Fichiers dans la corbeille</span>
              <span className="text-[12px] font-semibold text-[#69708A]">{metrics?.total_trashed?.toLocaleString() ?? "0"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#69708A]">Inscriptions aujourd'hui</span>
              <span className="text-[12px] font-semibold text-[#10B981]">{metrics?.today_signups ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="group rounded-xl border border-[#ECE7DF] bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#69708A] uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-dark tabular-nums truncate transition-all duration-300">{value}</p>
          {sub && <p className="mt-0.5 text-[12px] text-[#69708A] truncate">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
          <Icon size={20} className="text-white" />
        </span>
      </div>
    </div>
  )
}
