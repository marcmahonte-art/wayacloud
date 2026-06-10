"use client"

import { useEffect, useState } from "react"
import { Search, ExternalLink, AlertTriangle } from "lucide-react"

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: "20" })
    if (statusFilter) params.set("status", statusFilter)
    fetch(`/api/admin/payments?${params}`)
      .then(r => r.json())
      .then(d => { setPayments(d.payments || []); setStats(d.stats); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, statusFilter])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-dark">Paiements</h1>
        <p className="text-[13px] text-[#69708A] mt-0.5">{total} transaction{total !== 1 ? "s" : ""}</p>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#69708A] uppercase">Revenu total</p>
            <p className="text-xl font-bold text-dark mt-1">{stats.totalRevenue?.toLocaleString()} FCFA</p>
          </div>
          <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#69708A] uppercase">Revenu mensuel</p>
            <p className="text-xl font-bold text-dark mt-1">{stats.monthlyRevenue?.toLocaleString()} FCFA</p>
          </div>
          <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#69708A] uppercase">Échoués</p>
            <p className="text-xl font-bold text-red-500 mt-1">{stats.failedCount}</p>
          </div>
          <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#69708A] uppercase">En attente</p>
            <p className="text-xl font-bold text-amber-500 mt-1">{stats.pendingCount}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-[#E3DFE8] bg-white px-3 text-[12px] font-medium text-[#4a4a4a] outline-none">
          <option value="">Tous les statuts</option>
          <option value="completed">Complétés</option>
          <option value="pending">En attente</option>
          <option value="failed">Échoués</option>
          <option value="expired">Expirés</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#ECE7DF] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF]">
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Utilisateur</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Montant</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Statut</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Transaction</th>
              <th className="px-4 py-3 text-[11px] font-bold text-[#69708A] uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECE6]">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-5 animate-pulse rounded bg-[#F0ECE6]" /></td></tr>
            )) : payments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#69708A]">Aucun paiement</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-[#FDFCFB] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-dark">{p.user?.full_name || "Inconnu"}</span>
                  <span className="text-[11px] text-[#69708A] block">{p.user?.email || ""}</span>
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-dark">{p.amount_fcfa?.toLocaleString()} FCFA</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.status === "completed" ? "bg-green-100 text-green-700"
                    : p.status === "pending" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[#69708A] font-mono">{p.cinetpay_transaction_id?.slice(0, 16) || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-[#69708A]">{new Date(p.created_at).toLocaleDateString("fr")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
