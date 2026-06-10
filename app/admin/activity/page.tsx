"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Activity, Search, ChevronLeft, ChevronRight, Upload, Trash2, Share2, CreditCard, LogIn, AlertTriangle, RefreshCw } from "lucide-react"

const TYPE_ICONS: Record<string, any> = { upload: Upload, delete: Trash2, share: Share2, payment: CreditCard, login: LogIn }
const TYPE_COLORS: Record<string, string> = {
  upload: "bg-green-100 text-green-700", delete: "bg-red-100 text-red-600",
  share: "bg-blue-100 text-blue-600", payment: "bg-purple-100 text-purple-600",
  login: "bg-slate-100 text-slate-600",
}

const TYPE_FILTERS = [
  { label: "Tous", value: "" }, { label: "Upload", value: "upload" },
  { label: "Partage", value: "share" }, { label: "Suppression", value: "delete" },
  { label: "Paiement", value: "payment" }, { label: "Connexion", value: "login" },
]

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 30

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (typeFilter) params.set("type", typeFilter)
      if (search) params.set("search", search)
      const r = await fetch(`/api/admin/activity?${params}`)
      if (!r.ok) throw new Error("Erreur de chargement")
      const d = await r.json()
      setActivities(d.activities || [])
      setTotal(d.total || 0)
    } catch (e: any) {
      setError(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, search])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-dark">Journal d'Activité</h1>
          <p className="text-[13px] text-[#69708A] mt-0.5">{total.toLocaleString()} événement{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-[#E3DFE8] bg-white px-3 h-9">
          <Search size={15} className="text-[#69708A]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher..." className="flex-1 bg-transparent text-[13px] outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(t => (
            <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1) }}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${typeFilter === t.value ? "bg-primary/10 text-primary" : "text-[#69708A] hover:bg-[#F5F3F0]"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={16} className="text-red-400" />
          <p className="text-[13px] text-red-700 font-medium">{error}</p>
          <button onClick={fetchActivities} className="ml-auto text-[12px] font-semibold text-red-600 hover:underline">Réessayer</button>
        </div>
      )}

      <div className="rounded-xl border border-[#ECE7DF] bg-white">
        {loading ? (
          <div className="divide-y divide-[#F0ECE6]">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4"><div className="h-5 animate-pulse rounded bg-[#F0ECE6]" /></div>)}</div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[#69708A]">
            <Activity size={36} className="text-slate-300" />
            <p className="mt-2 text-[13px] font-medium">Aucune activité trouvée</p>
            {(search || typeFilter) && <p className="text-[12px] text-[#9CA3AF] mt-1">Essayez de modifier vos filtres</p>}
          </div>
        ) : (
          <div className="divide-y divide-[#F0ECE6]">
            {activities.map(a => {
              const Icon = TYPE_ICONS[a.type] || Activity
              const color = TYPE_COLORS[a.type] || "bg-slate-100 text-slate-600"
              return (
                <div key={a.id} className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-[#FDFCFB] transition-colors">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-dark">{a.title}</p>
                      <span className="text-[10px] text-[#9CA3AF]">{new Date(a.created_at).toLocaleDateString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {a.description && <p className="text-[12px] text-[#69708A] mt-0.5">{a.description}</p>}
                  </div>
                  {a.user && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-6 w-6 rounded-full bg-[#FFE8D9] flex items-center justify-center text-[9px] font-bold text-primary">{a.user.full_name?.charAt(0)?.toUpperCase() || "?"}</div>
                      <span className="text-[12px] text-[#69708A] hidden sm:inline">{a.user.full_name || a.user.email || "—"}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#69708A]">{pageSize * (page - 1) + 1}-{Math.min(pageSize * page, total)} sur {total}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3DFE8] bg-white text-[#69708A] disabled:opacity-30 hover:bg-[#F5F3F0]"><ChevronLeft size={14} /></button>
            {(() => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const end = Math.min(totalPages, start + 4)
              return Array.from({ length: end - start + 1 }, (_, i) => {
                const p = start + i
                return <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-semibold ${page === p ? "bg-primary text-white" : "border border-[#E3DFE8] bg-white text-[#69708A] hover:bg-[#F5F3F0]"}`}>{p}</button>
              })
            })()}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3DFE8] bg-white text-[#69708A] disabled:opacity-30 hover:bg-[#F5F3F0]"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
