"use client";

import { useState, useEffect } from "react";
import {
  User, Shield, HardDrive, Bell, CreditCard, SlidersHorizontal,
  Smartphone, Globe, Save, Check, Loader2, Eye, EyeOff,
  LogOut, Trash2, AlertTriangle, Moon, Sun, Camera,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

type SettingsTab = "profile" | "security" | "storage" | "notifications" | "subscription" | "preferences" | "devices";

const tabs = [
  { id: "profile" as SettingsTab, label: "Profil", icon: User },
  { id: "security" as SettingsTab, label: "Sécurité", icon: Shield },
  { id: "storage" as SettingsTab, label: "Stockage", icon: HardDrive },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "subscription" as SettingsTab, label: "Abonnement", icon: CreditCard },
  { id: "preferences" as SettingsTab, label: "Préférences", icon: SlidersHorizontal },
  { id: "devices" as SettingsTab, label: "Appareils connectés", icon: Smartphone },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { profile, logout } = useAuth();
  const router = useRouter();

  const showSaved = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Paramètres</h1>
        <p className="mt-1 text-sm text-[#596077]">Gérez votre compte, votre plan et vos préférences.</p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <aside className="shrink-0 xl:w-[220px]">
          <nav className="flex flex-row gap-1 overflow-x-auto xl:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors whitespace-nowrap xl:w-full ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-[#69708A] hover:bg-[#F5F3F0] hover:text-dark"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-[#ECE7DF] bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-dark">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <button
                onClick={showSaved}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
              </button>
            </div>

            {activeTab === "profile" && <ProfileSection showSaved={showSaved} />}
            {activeTab === "security" && <SecuritySection />}
            {activeTab === "storage" && <StorageSection />}
            {activeTab === "notifications" && <NotificationsSection showSaved={showSaved} />}
            {activeTab === "subscription" && <SubscriptionSection router={router} />}
            {activeTab === "preferences" && <PreferencesSection showSaved={showSaved} />}
            {activeTab === "devices" && <DevicesSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ showSaved }: { showSaved: () => Promise<void> }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const safeProfile = {
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    email: profile?.email ?? "",
    avatar_url: profile?.avatar_url ?? null,
  };
  const [form, setForm] = useState({
    first_name: safeProfile.first_name,
    last_name: safeProfile.last_name,
    phone: safeProfile.phone,
    city: safeProfile.city,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("L'avatar ne doit pas dépasser 2 Mo");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);

    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/avatar", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatarPreview(data.avatar_url);
    } catch {
      setAvatarPreview(null);
      alert("Échec de l'upload de l'avatar");
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      await fetch("/api/avatar", { method: "DELETE" });
      setAvatarPreview(null);
    } catch {
      alert("Échec de la suppression");
    } finally {
      setAvatarUploading(false);
    }
  };

  const avatarSrc = avatarPreview ?? safeProfile.avatar_url ?? null;
  const displayName = [safeProfile.first_name, safeProfile.last_name].filter(Boolean).join(" ") || "Utilisateur"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer group">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {safeProfile.first_name?.[0] || ""}{safeProfile.last_name?.[0] || ""}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {avatarUploading ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-dark">{displayName}</p>
          <p className="text-[13px] text-[#69708A]">{safeProfile.email || "Email non renseigné"}</p>
          {avatarSrc && (
            <button onClick={handleAvatarRemove} disabled={avatarUploading} className="mt-1 text-[11px] font-semibold text-red-500 hover:text-red-600 transition">
              Supprimer l&apos;avatar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {[
          { id: "first_name", label: "Prénom", value: form.first_name },
          { id: "last_name", label: "Nom", value: form.last_name },
          { id: "phone", label: "Téléphone", value: form.phone, type: "tel" },
          { id: "city", label: "Ville", value: form.city },
        ].map((field) => (
          <div key={field.id}>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#69708A] uppercase tracking-wider">
              {field.label}
            </label>
            <input
              value={form[field.id as keyof typeof form] as string}
              onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
              type={field.type || "text"}
              className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-dark mb-4">Mot de passe</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#69708A] uppercase tracking-wider">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 pr-10 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-dark">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#69708A] uppercase tracking-wider">Nouveau mot de passe</label>
            <input
              type="password"
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#69708A] uppercase tracking-wider">Confirmer le mot de passe</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Authentification à deux facteurs (2FA)</h3>
        <div className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4 max-w-md">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-primary" />
            <div>
              <p className="text-[13px] font-semibold text-dark">Authentification à deux facteurs</p>
              <p className="text-[12px] text-[#9CA3AF]">Ajoutez une couche de sécurité supplémentaire</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFactor(!twoFactor)}
            className={`relative h-7 w-12 rounded-full transition-colors ${twoFactor ? "bg-primary" : "bg-[#EAE5E0]"}`}
          >
            <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${twoFactor ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Sessions actives</h3>
        <div className="space-y-3 max-w-md">
          {["Chrome - Windows", "Safari - iPhone 15"].map((device) => (
            <div key={device} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-3.5">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-[#69708A]" />
                <span className="text-[13px] font-medium text-dark">{device}</span>
              </div>
              <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Actif</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorageSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-dark">Stockage utilisé</p>
          <button className="text-[12px] font-semibold text-primary hover:underline">Gérer mon forfait</button>
        </div>
        <div className="h-3 rounded-full bg-[#EAE5E0] overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: "35%" }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-[#69708A]">3.5 Go / 20 Go utilisés</span>
          <span className="font-medium text-[#9CA3AF]">35%</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Images", size: "1.8 Go", files: "142 fichiers", color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Vidéos", size: "1.2 Go", files: "18 fichiers", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Documents", size: "512 Mo", files: "67 fichiers", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl ${item.bg} p-4`}>
            <p className={`text-[13px] font-bold ${item.color}`}>{item.label}</p>
            <p className="mt-2 text-lg font-bold text-dark">{item.size}</p>
            <p className="text-[11px] text-[#69708A] font-medium">{item.files}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection({ showSaved }: { showSaved: () => Promise<void> }) {
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    backup_reminder: true,
    share_notification: true,
    payment: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSettings({
            email: data.email_upload ?? true,
            push: data.push_upload ?? true,
            sms: data.sms_payment ?? false,
            marketing: data.email_marketing ?? false,
            backup_reminder: data.email_backup ?? true,
            share_notification: data.push_share ?? true,
            payment: data.email_payment ?? true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof typeof settings) => {
    const newVal = !settings[key];
    setSettings((s) => ({ ...s, [key]: newVal }));

    const fieldMap: Record<string, string> = {
      email: "email_upload",
      push: "push_upload",
      sms: "sms_payment",
      marketing: "email_marketing",
      backup_reminder: "email_backup",
      share_notification: "push_share",
      payment: "email_payment",
    };

    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldMap[key]]: newVal }),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-[#ECE7DF]" />
              <div className="h-3 w-48 rounded bg-[#F0ECE6]" />
            </div>
            <div className="h-7 w-12 rounded-full bg-[#ECE7DF]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        {[
          { key: "email" as const, label: "Notifications par email", desc: "Recevez des mises à jour importantes par email" },
          { key: "push" as const, label: "Notifications push", desc: "Notifications sur votre navigateur" },
          { key: "sms" as const, label: "Notifications SMS", desc: "Alertes par SMS pour les événements critiques" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
            <div>
              <p className="text-[13px] font-semibold text-dark">{item.label}</p>
              <p className="text-[12px] text-[#9CA3AF]">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${settings[item.key] ? "bg-primary" : "bg-[#EAE5E0]"}`}
            >
              <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Préférences de notification</h3>
        <div className="space-y-1">
          {[
            { key: "backup_reminder" as const, label: "Rappels de sauvegarde", desc: "Notifications pour les sauvegardes WhatsApp" },
            { key: "share_notification" as const, label: "Partages", desc: "Quand quelqu'un accède à vos fichiers partagés" },
            { key: "payment" as const, label: "Paiements", desc: "Confirmations de paiement et échéances" },
            { key: "marketing" as const, label: "Offres et actualités", desc: "Nouveautés et promotions WayaCloud" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
              <div>
                <p className="text-[13px] font-semibold text-dark">{item.label}</p>
                <p className="text-[12px] text-[#9CA3AF]">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${settings[item.key] ? "bg-primary" : "bg-[#EAE5E0]"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionSection({ router }: { router: any }) {
  const { subscription, remainingTrialDays } = useAuth();
  const isFree = !subscription || subscription.plan_name === "Gratuit" || subscription.plan_price === 0
  const planName = isFree ? "Gratuit" : subscription?.plan_name || "Gratuit"
  const isTrial = remainingTrialDays > 0
  const planPrice = isFree ? 0 : (subscription?.plan_price ?? 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EAE5E0] bg-gradient-to-br from-violet-50 to-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#69708A] uppercase tracking-wider">Plan actuel</p>
            <p className="mt-2 text-2xl font-bold text-dark">{planName}</p>
            <p className="mt-1 text-sm text-[#596077]">
              {isFree ? "0 FCFA / mois" : `${planPrice.toLocaleString("fr-FR")} FCFA / mois`}
            </p>
            {isTrial && (
              <p className="mt-2 text-xs font-medium text-green-600">
                {remainingTrialDays} jours d&apos;essai restants
              </p>
            )}
            {!isFree && subscription?.ends_at && (
              <p className="mt-5 text-sm text-green-700 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Prochain renouvellement le {new Date(subscription.ends_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <CreditCard size={32} />
          </span>
        </div>
        <button
          onClick={() => router.push("/abonnement")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-5 py-2.5 text-[13px] font-bold text-violet-700 hover:bg-violet-50 transition-colors"
        >
          Gérer mon abonnement
        </button>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Méthodes de paiement</h3>
        <div className="flex items-center gap-3 rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4 max-w-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-bold text-sm">OM</span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-dark">Orange Money</p>
            <p className="text-[12px] text-[#9CA3AF]">Défaut</p>
          </div>
          <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Défaut</span>
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
        <p className="mt-2 text-[12px] text-[#9CA3AF]">Cette action est irréversible. Toutes vos données seront supprimées.</p>
      </div>
    </div>
  );
}

function PreferencesSection({ showSaved }: { showSaved: () => Promise<void> }) {
  const [prefs, setPrefs] = useState({
    dark_mode: false,
    language: "fr",
    auto_backup: true,
    compression: false,
    confirm_delete: true,
    show_hidden_files: false,
    grid_view: false,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-dark mb-4">Affichage</h3>
        <div className="space-y-1 max-w-md">
          {[
            { key: "dark_mode" as const, label: "Mode sombre", icon: Moon },
            { key: "grid_view" as const, label: "Vue en grille par défaut", desc: "Afficher les fichiers en grille plutôt qu'en liste" },
            { key: "show_hidden_files" as const, label: "Afficher les fichiers cachés" },
          ].map((item) => {
            const Icon = item.icon || Globe;
            return (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-[#69708A]" />
                  <div>
                    <p className="text-[13px] font-semibold text-dark">{item.label}</p>
                    {item.desc && <p className="text-[12px] text-[#9CA3AF]">{item.desc}</p>}
                  </div>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${prefs[item.key] ? "bg-primary" : "bg-[#EAE5E0]"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${prefs[item.key] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Langue</h3>
        <div className="flex items-center gap-3 max-w-md">
          <Globe size={18} className="text-[#69708A]" />
          <select
            value={prefs.language}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            className="flex-1 rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Sauvegarde</h3>
        <div className="space-y-1 max-w-md">
          {[
            { key: "auto_backup" as const, label: "Sauvegarde automatique WhatsApp", desc: "Sauvegarder automatiquement vos conversations WhatsApp" },
            { key: "compression" as const, label: "Compression automatique des vidéos", desc: "Réduire la taille des vidéos lors de l'import" },
            { key: "confirm_delete" as const, label: "Confirmer avant de supprimer", desc: "Afficher une confirmation avant chaque suppression" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
              <div>
                <p className="text-[13px] font-semibold text-dark">{item.label}</p>
                {item.desc && <p className="text-[12px] text-[#9CA3AF]">{item.desc}</p>}
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${prefs[item.key] ? "bg-primary" : "bg-[#EAE5E0]"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${prefs[item.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DevicesSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 max-w-md">
        {[
          { name: "iPhone 15 Pro", type: "Smartphone", os: "iOS 18.2", lastSeen: "Il y a 2 heures", current: true },
          { name: "MacBook Air M3", type: "Ordinateur", os: "macOS Sequoia", lastSeen: "Il y a 1 jour", current: false },
          { name: "Samsung Galaxy S24", type: "Smartphone", os: "Android 14", lastSeen: "Il y a 3 jours", current: false },
        ].map((device) => (
          <div key={device.name} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-[#69708A]" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-dark">{device.name}</p>
                  {device.current && (
                    <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">Actuel</span>
                  )}
                </div>
                <p className="text-[12px] text-[#9CA3AF]">{device.os} · Dernière activité : {device.lastSeen}</p>
              </div>
            </div>
            {!device.current && (
              <button className="text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline shrink-0">
                Déconnecter
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
