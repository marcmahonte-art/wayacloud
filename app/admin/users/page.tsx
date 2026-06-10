"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search, ChevronDown, Shield, AlertTriangle, ExternalLink,
} from "lucide-react"

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  city: string | null
  role: string
  created_at: string
  subscription: { plan_id: string; is_active: boolean; is_trial: boolean } | null
  quota: { storage_used_bytes: number; storage_limit_bytes: number } | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set("search", search)
      if (roleFilter) params.set("role", roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchUsers() }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark">Utilisateurs</h1>
          <p className="text-[13px] text-[#69708A] mt-0.5">{total} utilisateur{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E3DFE8] bg-white px-3 text-[12px] font-medium text-[#4a4a4a] outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#E3DFE8] bg-white px-3 h-9">
          <Search size={15} className="text-[#69708A]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708A]"
          />
        </div>
        <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-[12px] font-bold text-white hover:bg-primary-light transition">Rechercher</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[#ECE7DF] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF]">
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Utilisateur</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Rôle</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Stockage</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Abonnement</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider">Inscrit le</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECE6]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4"><div className="h-5 animate-pulse rounded bg-[#F0ECE6]" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#69708A]">Aucun utilisateur trouvé</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-[#FDFCFB] transition-colors cursor-pointer" onClick={() => router.push(`/admin/users/${u.id}`)}>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-dark">{u.full_name || "Utilisateur"}</span>
                  <span className="text-[11px] text-[#69708A] block">{u.phone || "—"}</span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[#4a4a4a]">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    u.role === "super_admin" ? "bg-purple-100 text-purple-700"
                    : u.role === "admin" ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                  }`}>
                    {u.role === "super_admin" && <Shield size={11} />}
                    {u.role === "admin" ? "Admin" : u.role === "super_admin" ? "Super Admin" : "Utilisateur"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[#4a4a4a]">
                  {u.quota ? `${(Number(u.quota.storage_used_bytes) / 1e9).toFixed(1)} / ${(Number(u.quota.storage_limit_bytes) / 1e9).toFixed(1)} Go` : "—"}
                </td>
                <td className="px-4 py-3">
                  {u.subscription ? (
                    <span className={`text-[12px] font-semibold ${u.subscription.is_active ? "text-green-600" : "text-red-500"}`}>
                      {u.subscription.is_trial ? "Essai" : u.subscription.is_active ? "Actif" : "Inactif"}
                    </span>
                  ) : <span className="text-[12px] text-[#69708A]">—</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#69708A]">
                  {new Date(u.created_at).toLocaleDateString("fr")}
                </td>
                <td className="px-4 py-3">
                  <ExternalLink size={14} className="text-[#69708A]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 rounded-lg border border-[#E3DFE8] bg-white px-3 text-[12px] font-medium text-[#4a4a4a] disabled:opacity-40">Précédent</button>
          <span className="text-[12px] text-[#69708A] font-medium">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 rounded-lg border border-[#E3DFE8] bg-white px-3 text-[12px] font-medium text-[#4a4a4a] disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  )
}
