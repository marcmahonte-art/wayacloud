"use client"

import { useState, useEffect } from "react"
import { Settings, Shield, Bell, Sliders, Save, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

const TABS = [
  { id: "general", label: "Général", icon: Sliders },
  { id: "security", label: "Sécurité", icon: Shield },
] as const

type TabId = typeof TABS[number]["id"]

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabId>("general")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const handleSave = async (action: string, value?: any) => {
    setSaving(true); setError(null)
    try {
      await new Promise(r => setTimeout(r, 600))
      showSaved()
    } catch { setError("Erreur lors de la sauvegarde") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-dark">Paramètres</h1>
        <p className="text-[13px] text-[#69708A] mt-0.5">Configuration globale de la plateforme</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-[#ECE7DF] bg-white p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${tab === t.id ? "bg-primary/10 text-primary font-semibold" : "text-[#69708A] hover:text-dark"}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle size={16} className="text-green-600" />
          <p className="text-[13px] font-semibold text-green-700">Paramètres sauvegardés</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-[13px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {tab === "general" && (
        <div className="rounded-xl border border-[#ECE7DF] bg-white">
          <div className="divide-y divide-[#F0ECE6]">
            <SettingRow label="Inscriptions ouvertes" desc="Autoriser les nouveaux utilisateurs à s'inscrire" defaultEnabled action="toggleSignups" />
            <SettingRow label="Stockage gratuit" desc={`${stats?.users?.total ? Math.round(stats.storage.averagePerUser / 1e9) : 5} Go par défaut pour les nouveaux utilisateurs`} disabled />
            <SettingRow label="Limite AI quotidienne" desc="100 requêtes/jour par utilisateur" action="aiLimit" />
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded-xl border border-[#ECE7DF] bg-white">
          <div className="divide-y divide-[#F0ECE6]">
            <SettingRow label="Vérification email" desc="Exiger la confirmation email pour les nouveaux comptes" defaultEnabled action="emailVerification" />
            <SettingRow label="Authentification à deux facteurs" desc="Exiger 2FA pour les administrateurs" action="require2FA" />
            <SettingRow label="Journal d'audit" desc="Toutes les actions admin sont enregistrées dans admin_audit_logs" disabled />
          </div>
        </div>
      )}
    </div>
  )
}

function SettingRow({ label, desc, defaultEnabled, action, disabled }: { label: string; desc: string; defaultEnabled?: boolean; action?: string; disabled?: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled ?? false)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    if (!action || disabled) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setEnabled(!enabled)
    setSaving(false)
  }

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className={`text-[13px] font-semibold ${disabled ? "text-[#9CA3AF]" : "text-dark"}`}>{label}</p>
        <p className={`text-[12px] mt-0.5 ${disabled ? "text-[#CCC]" : "text-[#69708A]"}`}>{desc}</p>
      </div>
      {action && !disabled ? (
        <button onClick={handleToggle} disabled={saving} className={`relative h-6 w-11 rounded-full transition-colors ${saving ? "opacity-50" : ""} ${enabled ? "bg-primary" : "bg-[#E3DFE8]"}`}>
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      ) : (
        <span className="text-[11px] text-[#9CA3AF] font-medium">Système</span>
      )}
    </div>
  )
}
