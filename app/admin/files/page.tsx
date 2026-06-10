"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, FileText, Image, Video, FileAudio, FileArchive, File, ChevronLeft, ChevronRight, ArrowUpDown, Download, Trash2, Eye, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

const TYPE_ICONS: Record<string, any> = {
  image: Image, video: Video, audio: FileAudio,
  pdf: FileText, archive: FileArchive, document: FileText, other: File,
}

const TYPE_FILTERS = [
  { label: "Tous", value: "" },
  { label: "Images", value: "image" },
  { label: "Vidéos", value: "video" },
  { label: "Audios", value: "audio" },
  { label: "PDF", value: "pdf" },
  { label: "Archives", value: "archive" },
  { label: "Documents", value: "document" },
]

function bytes(size: number): string {
  if (size >= 1e12) return (size / 1e12).toFixed(1) + " To"
  if (size >= 1e9) return (size / 1e9).toFixed(1) + " Go"
  if (size >= 1e6) return (size / 1e6).toFixed(1) + " Mo"
  if (size >= 1e3) return (size / 1e3).toFixed(0) + " Ko"
  return size + " o"
}

export default function AdminFilesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState<string>("sizeBytes")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const pageSize = 25

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/admin/storage")
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || "Erreur")
      const all = data.largestFiles || []
      setTotal(all.length)
      let filtered = all
      if (search) filtered = filtered.filter((f: any) => f.name?.toLowerCase().includes(search.toLowerCase()))
      if (typeFilter) filtered = filtered.filter((f: any) => f.type?.startsWith(typeFilter))
      filtered.sort((a: any, b: any) => {
        const va = a[sortField] ?? 0, vb = b[sortField] ?? 0
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
      })
      const start = (page - 1) * pageSize
      setRows(filtered.slice(start, start + pageSize))
    } catch (e: any) {
      setError(e.message || "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, page, sortField, sortDir])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const SortIcon = ({ field }: { field: string }) => (
    <ArrowUpDown size={12} className={`ml-1 transition-opacity ${sortField === field ? "opacity-100" : "opacity-30"}`} />
  )

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-dark">Fichiers</h1>
          <p className="text-[13px] text-[#69708A] mt-0.5">{total.toLocaleString()} fichier{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-[#E3DFE8] bg-white px-3 h-9">
          <Search size={15} className="text-[#69708A]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher par nom..." className="flex-1 bg-transparent text-[13px] outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(t => (
            <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1) }}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${typeFilter === t.value ? "bg-primary/10 text-primary" : "text-[#69708A] hover:bg-[#F5F3F0]"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#ECE7DF] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF]">
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase cursor-pointer select-none" onClick={() => toggleSort("name")}><div className="flex items-center">Nom<SortIcon field="name" /></div></th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase cursor-pointer select-none" onClick={() => toggleSort("type")}><div className="flex items-center">Type<SortIcon field="type" /></div></th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase cursor-pointer select-none" onClick={() => toggleSort("sizeBytes")}><div className="flex items-center">Taille<SortIcon field="sizeBytes" /></div></th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Propriétaire</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase cursor-pointer select-none" onClick={() => toggleSort("createdAt")}><div className="flex items-center">Date<SortIcon field="createdAt" /></div></th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECE6]">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-6 animate-pulse rounded bg-[#F0ECE6]" /></td></tr>
            )) : error ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center"><div className="flex flex-col items-center text-[#69708A]"><AlertTriangle size={24} className="text-red-300" /><p className="mt-2 text-[13px] font-medium">{error}</p><button onClick={fetchFiles} className="mt-2 text-[12px] font-semibold text-primary hover:underline">Réessayer</button></div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center"><div className="flex flex-col items-center text-[#69708A]"><FileText size={32} className="text-slate-300" /><p className="mt-2 text-[13px] font-medium">Aucun fichier trouvé</p></div></td></tr>
            ) : rows.map(f => {
              const typeKey = Object.keys(TYPE_ICONS).find(k => f.type?.startsWith(k)) || "other"
              const Icon = TYPE_ICONS[typeKey] || File
              return (
                <tr key={f.id} className="hover:bg-[#FDFCFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3F0]"><Icon size={14} className="text-[#69708A]" /></span>
                      <span className="text-[13px] font-medium text-dark max-w-[260px] truncate">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[11px] font-mono text-[#69708A]">{f.type?.split("/")[0] || "—"}<span className="text-[#9CA3AF]">/{f.type?.split("/")[1] || "—"}</span></span></td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-dark">{f.sizeFormatted || bytes(f.sizeBytes)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-[#FFE8D9] flex items-center justify-center text-[9px] font-bold text-primary">{f.ownerId?.slice(0, 2).toUpperCase()}</div><span className="text-[12px] text-[#69708A] font-mono">{f.ownerId?.slice(0, 8)}...</span></div></td>
                  <td className="px-4 py-3 text-[12px] text-[#69708A]">{f.createdAt ? new Date(f.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short" }) : "—"}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><button className="flex h-7 w-7 items-center justify-center rounded-md text-[#69708A] hover:bg-[#F5F3F0]" title="Télécharger"><Download size={13} /></button><button className="flex h-7 w-7 items-center justify-center rounded-md text-[#69708A] hover:bg-[#F5F3F0]" title="Voir"><Eye size={13} /></button><button className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50" title="Supprimer"><Trash2 size={13} /></button></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#69708A]">Page {page} sur {totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3DFE8] bg-white text-[#69708A] disabled:opacity-30 hover:bg-[#F5F3F0]"><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1
              return <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-semibold ${page === p ? "bg-primary text-white" : "border border-[#E3DFE8] bg-white text-[#69708A] hover:bg-[#F5F3F0]"}`}>{p}</button>
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3DFE8] bg-white text-[#69708A] disabled:opacity-30 hover:bg-[#F5F3F0]"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
