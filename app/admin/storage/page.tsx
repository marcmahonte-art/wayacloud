"use client"

import { useEffect, useState } from "react"
import { HardDrive, Users, FileText, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#FF6300", "#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function AdminStoragePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/storage")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="h-[100px] animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />)}</div>
  if (!data) return <div className="flex items-center justify-center py-20 text-[#69708A]"><AlertTriangle size={20} /> Erreur</div>

  const typeChartData = Object.entries(data.byType || {}).map(([name, val]: any) => ({
    name,
    value: Math.round(val.bytes / 1e9 * 10) / 10,
    count: val.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-dark">Stockage</h1>
        <p className="text-[13px] text-[#69708A] mt-0.5">{data.fileCount} fichiers · {data.totalUsedFormatted} utilisés sur {data.totalLimitFormatted}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2"><HardDrive size={15} /><span className="text-[11px] font-semibold uppercase">Total utilisé</span></div>
          <p className="text-2xl font-bold text-dark">{data.totalUsedFormatted}</p>
          <div className="mt-2 h-2 rounded-full bg-[#EFEAF6]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${data.usagePercent}%` }} />
          </div>
          <p className="text-[12px] text-[#69708A] mt-1">{data.usagePercent}% de la capacité totale</p>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2"><Users size={15} /><span className="text-[11px] font-semibold uppercase">Moyen par utilisateur</span></div>
          <p className="text-2xl font-bold text-dark">{data.averageFormatted}</p>
          <p className="text-[12px] text-[#69708A] mt-1">Réparti sur tous les utilisateurs</p>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2"><FileText size={15} /><span className="text-[11px] font-semibold uppercase">Fichiers</span></div>
          <p className="text-2xl font-bold text-dark">{data.fileCount?.toLocaleString()}</p>
          <p className="text-[12px] text-[#69708A] mt-1">Non supprimés</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Stockage par type (Go)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#FF6300" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
          <h3 className="text-[13px] font-bold text-dark mb-4">Top utilisateurs stockage</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {data.topUsers?.map((u: any, i: number) => (
              <div key={u.userId} className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#69708A] w-5">{i + 1}</span>
                <span className="text-[12px] text-dark font-medium truncate flex-1">{u.userId.slice(0, 12)}...</span>
                <span className="text-[12px] font-semibold text-dark">{u.usedFormatted}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#ECE7DF] bg-white p-5">
        <h3 className="text-[13px] font-bold text-dark mb-4">Plus gros fichiers</h3>
        <div className="space-y-2">
          {data.largestFiles?.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-[#F0ECE6] last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-dark truncate">{f.name}</p>
                <p className="text-[11px] text-[#69708A]">{f.type} · {f.ownerId?.slice(0, 8)}...</p>
              </div>
              <span className="text-[12px] font-semibold text-dark shrink-0 ml-3">{f.sizeFormatted}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
