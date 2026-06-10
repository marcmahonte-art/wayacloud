"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Shield, HardDrive, CreditCard, AlertTriangle,
} from "lucide-react"

interface UserDetail {
  id: string
  email: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  city: string | null
  role: string
  created_at: string
  subscription: any
  quota: any
}

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users`).then(r => r.json()),
    ]).then(([data]) => {
      const found = (data.users || []).find((u: any) => u.id === id)
      setUser(found || null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-white border border-[#ECE7DF]" />

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle size={40} className="text-red-400" />
      <p className="mt-4 font-semibold">Utilisateur introuvable</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-medium text-[#69708A] hover:text-dark transition-colors">
        <ArrowLeft size={15} /> Retour
      </button>

      <div className="rounded-xl border border-[#ECE7DF] bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
            {(user.full_name || user.email || "??")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-dark">{user.full_name || "Utilisateur"}</h1>
            <p className="text-[13px] text-[#69708A]">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                user.role === "super_admin" ? "bg-purple-100 text-purple-700"
                : user.role === "admin" ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
              }`}>
                <Shield size={11} />
                {user.role}
              </span>
              <span className="rounded-full bg-[#F5F0EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#69708A]">
                {user.phone || "Pas de téléphone"}
              </span>
              <span className="rounded-full bg-[#F5F0EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#69708A]">
                {user.city || "Ville inconnue"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2">
            <HardDrive size={15} />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Stockage</span>
          </div>
          {user.quota ? (
            <>
              <p className="text-lg font-bold text-dark">{(Number(user.quota.storage_used_bytes) / 1e9).toFixed(1)} Go</p>
              <p className="text-[12px] text-[#69708A]">sur {(Number(user.quota.storage_limit_bytes) / 1e9).toFixed(1)} Go</p>
              <div className="mt-2 h-1.5 rounded-full bg-[#EFEAF6]">
                <div className="h-full rounded-full bg-primary" style={{
                  width: `${Math.min(100, (Number(user.quota.storage_used_bytes) / Number(user.quota.storage_limit_bytes)) * 100)}%`
                }} />
              </div>
            </>
          ) : <p className="text-[13px] text-[#69708A]">Non disponible</p>}
        </div>

        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2">
            <CreditCard size={15} />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Abonnement</span>
          </div>
          {user.subscription ? (
            <>
              <p className="text-lg font-bold text-dark">
                {user.subscription.is_trial ? "Essai gratuit" : user.subscription.is_active ? "Actif" : "Inactif"}
              </p>
              <p className="text-[12px] text-[#69708A]">{user.subscription.plan_id || "Plan inconnu"}</p>
            </>
          ) : <p className="text-[13px] text-[#69708A]">Aucun abonnement</p>}
        </div>

        <div className="rounded-xl border border-[#ECE7DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#69708A] mb-2">
            <Shield size={15} />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Compte</span>
          </div>
          <p className="text-lg font-bold text-dark">{user.role}</p>
          <p className="text-[12px] text-[#69708A]">
            Créé le {new Date(user.created_at).toLocaleDateString("fr")}
          </p>
        </div>
      </div>
    </div>
  )
}
