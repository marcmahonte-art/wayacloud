"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, CreditCard, HardDrive, Activity, Upload, ArrowUp, ArrowDown } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const RANGES = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
  { label: "12 mois", value: 365 },
]

function formatK(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k"
  return String(num)
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div className="h-8 w-48 animate-pulse rounded-lg bg-[#F0ECE6]" /><div className="h-8 w-64 animate-pulse rounded-lg bg-[#F0ECE6]" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[130px] animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />)}</div>
    </div>
  )

  if (!stats) return (
    <div className="flex flex-col items-center py-20 text-[#69708A]">
      <Activity size={40} className="text-slate-300" />
      <p className="mt-3 text-[15px] font-semibold text-dark">Impossible de charger les analytics</p>
      <button onClick={() => window.location.reload()} className="mt-3 text-[13px] font-semibold text-primary hover:underline">Réessayer</button>
    </div>
  )

  const { users, storage, files, revenue, subscriptions, ai, growth } = stats
  const totalActive = users.total - (stats.users?.trialUsers || 0)

  const rawUploads = Object.entries(growth?.dailyUploads || {}).map(([date, count]) => ({ date: date.slice(5), uploads: count as number }))
  const rawStorage = Object.entries(growth?.dailyStorage || {}).map(([date, bytes]) => ({ date: date.slice(5), storage: Math.round(Number(bytes) / 1e9 * 100) / 100 }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-dark">Analytiques</h1>
          <p className="text-[13px] text-[#69708A] mt-0.5">Indicateurs de croissance et tendances de la plateforme</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[#E3DFE8] bg-white p-0.5">
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${range === r.value ? "bg-primary text-white" : "text-[#69708A] hover:text-dark"}`}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenu mensuel" value={revenue.monthlyFormatted} trend="+12%" sub={`${revenue.totalFormatted} total`} icon={CreditCard} color="bg-emerald-100 text-emerald-700" />
        <KpiCard label="Utilisateurs actifs" value={totalActive.toLocaleString()} trend={users.total > 0 ? "+5%" : "0%"} sub={`${users.total} inscrits`} icon={Users} color="bg-blue-100 text-blue-700" />
        <KpiCard label="Fichiers importés" value={files.todayUploads.toLocaleString()} sub="aujourd'hui" icon={Upload} color="bg-orange-100 text-orange-700" />
        <KpiCard label="Requêtes IA" value={ai.totalRequests.toLocaleString()} sub="total" icon={Activity} color="bg-purple-100 text-purple-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Importations quotidiennes</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rawUploads}>
                <defs><linearGradient id="uploadG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6300" stopOpacity={0.15} /><stop offset="95%" stopColor="#FF6300" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #ECE7DF", fontSize: 13 }} />
                <Area type="monotone" dataKey="uploads" stroke="#FF6300" fill="url(#uploadG)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Évolution du stockage (Go)</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rawStorage}>
                <defs><linearGradient id="storageG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#69708A" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #ECE7DF", fontSize: 13 }} />
                <Area type="monotone" dataKey="storage" stroke="#6366F1" fill="url(#storageG)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Abonnements</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Premium</span><span className="text-[14px] font-bold text-dark">{subscriptions.premium.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">En essai</span><span className="text-[14px] font-bold text-dark">{subscriptions.trial.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Taux de conversion</span><span className="text-[14px] font-bold text-dark">{users.total > 0 ? Math.round(subscriptions.premium / users.total * 100) : 0}%</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Stockage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Total utilisé</span><span className="text-[14px] font-bold text-dark">{storage.totalFormatted}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Moyen/utilisateur</span><span className="text-[14px] font-bold text-dark">{(storage.averagePerUser / 1e9).toFixed(1)} Go</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Fichiers totaux</span><span className="text-[14px] font-bold text-dark">{files.total.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Système</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Santé</span><span className={`flex items-center gap-1.5 text-[12px] font-semibold ${stats.health === "healthy" ? "text-green-600" : "text-red-500"}`}><span className={`h-2 w-2 rounded-full ${stats.health === "healthy" ? "bg-green-500" : "bg-red-500"}`} />{stats.health === "healthy" ? "Opérationnel" : "Attention"}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Stockage utilisé</span><span className="text-[14px] font-bold text-dark">{storage.usedPercent}%</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-[#69708A]">Paiements échoués</span><span className="text-[14px] font-bold text-red-500">{revenue.failedPayments}</span></div>
            <div className="w-full h-2 rounded-full bg-[#EFEAF6]"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${storage.usedPercent}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, trend, sub, icon: Icon, color }: any) {
  const isUp = trend?.startsWith("+")
  return (
    <div className="rounded-xl border border-[#ECE7DF] bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#69708A] uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-dark truncate">{value}</p>
          {sub && <p className="mt-0.5 text-[12px] text-[#69708A]">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></span>
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-[12px] font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
          {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {trend}
        </div>
      )}
    </div>
  )
}
