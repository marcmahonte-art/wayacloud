"use client";

import { useState, useEffect } from "react";
import {
  User, Shield, HardDrive, Bell, CreditCard, SlidersHorizontal,
  Smartphone, Globe, Save, Check, Loader2, Eye, EyeOff,
  LogOut, Trash2, AlertTriangle, Moon, Sun, Camera, X,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/lib/store/settings-store";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);

  const showSaved = async (saveFn?: () => Promise<void>) => {
    if (saveFn) {
      setSaving(true);
      try {
        await saveFn();
      } catch (e) {
        setSaving(false);
        return;
      }
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 600));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
              {(activeTab === "profile" || activeTab === "preferences" || activeTab === "notifications") && (
                <button
                  onClick={() => {
                    const el = document.querySelector(`[data-save-handler="${activeTab}"]`);
                    if (el) (el as HTMLButtonElement).click();
                  }}
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
              )}
            </div>

            {activeTab === "profile" && <ProfileSection showSaved={showSaved} saving={saving} setSaving={setSaving} />}
            {activeTab === "security" && <SecuritySection showSaved={showSaved} />}
            {activeTab === "storage" && <StorageSection />}
            {activeTab === "notifications" && <NotificationsSection />}
            {activeTab === "subscription" && <SubscriptionSection router={router} />}
            {activeTab === "preferences" && <PreferencesSection showSaved={showSaved} saving={saving} setSaving={setSaving} />}
            {activeTab === "devices" && <DevicesSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ showSaved, saving, setSaving }: { showSaved: (fn?: () => Promise<void>) => Promise<void>, saving: boolean, setSaving: (v: boolean) => void }) {
  const { profile, logout, refresh } = useAuth();
  const router = useRouter();
  const safeProfile = {
    id: profile?.id ?? "",
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

  const saveProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        city: form.city,
      })
      .eq("id", safeProfile.id);
    if (error) throw error;
    await refresh();
  };

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
      await refresh();
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
      await refresh();
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
      <button
        data-save-handler="profile"
        onClick={() => showSaved(saveProfile)}
        className="hidden"
      />

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

function SecuritySection({ showSaved }: { showSaved: (fn?: () => Promise<void>) => Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    setStatusMsg(null);
    if (!form.current || !form.newPass || !form.confirm) {
      setStatusMsg({ type: "error", text: "Veuillez remplir tous les champs" });
      return;
    }
    if (form.newPass.length < 6) {
      setStatusMsg({ type: "error", text: "Le mot de passe doit faire au moins 6 caractères" });
      return;
    }
    if (form.newPass !== form.confirm) {
      setStatusMsg({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    setChanging(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email ?? "",
        password: form.current,
      });
      if (signInError) {
        setStatusMsg({ type: "error", text: "Mot de passe actuel incorrect" });
        setChanging(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: form.newPass });
      if (error) throw error;
      setStatusMsg({ type: "success", text: "Mot de passe modifié avec succès" });
      setForm({ current: "", newPass: "", confirm: "" });
    } catch {
      setStatusMsg({ type: "error", text: "Erreur lors du changement de mot de passe" });
    } finally {
      setChanging(false);
    }
  };

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
          <button
            onClick={handleChangePassword}
            disabled={changing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-70"
          >
            {changing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {changing ? "Modification..." : "Changer le mot de passe"}
          </button>
          {statusMsg && (
            <p className={`text-[13px] font-medium ${statusMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {statusMsg.text}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Authentification à deux facteurs (2FA)</h3>
        <div className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4 max-w-md opacity-60">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-primary" />
            <div>
              <p className="text-[13px] font-semibold text-dark">Authentification à deux facteurs</p>
              <p className="text-[12px] text-[#9CA3AF]">Bientôt disponible</p>
            </div>
          </div>
          <div className="relative h-7 w-12 rounded-full bg-[#EAE5E0] cursor-not-allowed">
            <div className="h-5 w-5 rounded-full bg-white shadow-sm absolute top-1 left-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 o";
  const k = 1024;
  const sizes = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StorageSection() {
  const [stats, setStats] = useState<{
    usedBytes: number;
    limitBytes: number;
    usagePercent: number;
    totalFiles: number;
    categories: Record<string, { count: number; bytes: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/storage/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-[#F0ECE6]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-[#F0ECE6]" />)}
        </div>
      </div>
    );
  }

  const cats = stats?.categories ?? {};
  const catEntries = [
    { key: "image", label: "Images", color: "text-orange-600", bg: "bg-orange-50" },
    { key: "video", label: "Vidéos", color: "text-violet-600", bg: "bg-violet-50" },
    { key: "document", label: "Documents", color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-dark">Stockage utilisé</p>
          <button className="text-[12px] font-semibold text-primary hover:underline">Gérer mon forfait</button>
        </div>
        <div className="h-3 rounded-full bg-[#EAE5E0] overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(stats?.usagePercent ?? 0, 100)}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-[#69708A]">
            {formatBytes(stats?.usedBytes ?? 0)} / {formatBytes(stats?.limitBytes ?? 0)} utilisés
          </span>
          <span className="font-medium text-[#9CA3AF]">{stats?.usagePercent ?? 0}%</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {catEntries.map(({ key, label, color, bg }) => {
          const c = cats[key];
          return (
            <div key={key} className={`rounded-xl ${bg} p-4`}>
              <p className={`text-[13px] font-bold ${color}`}>{label}</p>
              <p className="mt-2 text-lg font-bold text-dark">{c ? formatBytes(c.bytes) : "0 o"}</p>
              <p className="text-[11px] text-[#69708A] font-medium">{c?.count ?? 0} fichiers</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsSection() {
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
  const { subscription, remainingTrialDays, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const isFree = !subscription || subscription.plan_name === "Gratuit" || subscription.plan_price === 0
  const planName = isFree ? "Gratuit" : subscription?.plan_name || "Gratuit"
  const isTrial = remainingTrialDays > 0
  const planPrice = isFree ? 0 : (subscription?.plan_price ?? 0)

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la suppression");
      }
      await logout();
      router.push("/login");
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Supprimer le compte</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-[#9CA3AF] hover:text-dark">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 mb-4">
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <p className="text-[13px] text-red-700">
                Cette action est irréversible. Toutes vos données (fichiers, sauvegardes, abonnements) seront définitivement supprimées.
              </p>
            </div>
            {deleteError && <p className="text-[13px] text-red-500 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-[#EAE5E0] bg-white px-4 py-2.5 text-[13px] font-semibold text-dark hover:bg-[#F5F3F0] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-70"
              >
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
        <p className="mt-2 text-[12px] text-[#9CA3AF]">Cette action est irréversible. Toutes vos données seront supprimées.</p>
      </div>
    </div>
  );
}

function PreferencesSection({ showSaved, saving, setSaving }: { showSaved: (fn?: () => Promise<void>) => Promise<void>, saving: boolean, setSaving: (v: boolean) => void }) {
  const { 
    dark_mode, language, auto_backup, compression, confirm_delete, show_hidden_files, grid_view,
    toggleDarkMode, setLanguage, toggleAutoBackup, toggleCompression, toggleConfirmDelete, toggleShowHiddenFiles, toggleGridView
  } = useSettingsStore();

  const prefs = {
    dark_mode, language, auto_backup, compression, confirm_delete, show_hidden_files, grid_view
  };

  const toggle = (key: keyof typeof prefs) => {
    switch (key) {
      case "dark_mode": return toggleDarkMode();
      case "grid_view": return toggleGridView();
      case "show_hidden_files": return toggleShowHiddenFiles();
      case "auto_backup": return toggleAutoBackup();
      case "compression": return toggleCompression();
      case "confirm_delete": return toggleConfirmDelete();
    }
  };

  const savePrefs = async () => {
    const { error } = await supabase.from("notification_preferences").upsert(
      { user_id: (await supabase.auth.getUser()).data.user?.id, ...prefs },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  };

  return (
    <div className="space-y-6">
      <button
        data-save-handler="preferences"
        onClick={() => showSaved(savePrefs)}
        className="hidden"
      />

      <div>
        <h3 className="text-sm font-bold text-dark mb-4">Affichage</h3>
        <div className="space-y-1 max-w-md">
          {[
            { key: "dark_mode" as const, label: "Mode sombre", icon: Moon, desc: "Basculer entre le thème clair et sombre" },
            { key: "grid_view" as const, label: "Vue en grille par défaut", desc: "Afficher les fichiers en grille plutôt qu'en liste" },
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
          <div className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4 opacity-40">
            <div className="flex items-center gap-3">
              <Eye size={18} className="text-[#69708A]" />
              <div>
                <p className="text-[13px] font-semibold text-dark">Afficher les fichiers cachés</p>
                <p className="text-[12px] text-[#9CA3AF]">Bientôt disponible</p>
              </div>
            </div>
            <div className="relative h-7 w-12 rounded-full bg-[#EAE5E0] cursor-not-allowed">
              <div className="h-5 w-5 rounded-full bg-white shadow-sm absolute top-1 left-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F0ECE6] pt-6">
        <h3 className="text-sm font-bold text-dark mb-4">Langue</h3>
        <div className="flex items-center gap-3 max-w-md opacity-40">
          <Globe size={18} className="text-[#69708A]" />
          <select
            value={language}
            disabled
            className="flex-1 rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors cursor-not-allowed"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <span className="text-[11px] font-semibold text-[#9CA3AF]">Bientôt</span>
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
  const [sessions, setSessions] = useState<{ id: string; device: string; os: string; lastSeen: string; current: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleRevoke = async (sessionId: string) => {
    try {
      await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      fetchSessions();
    } catch {
      // silent
    }
  };

  const revokeSupported = false;

  if (loading) {
    return (
      <div className="space-y-3 max-w-md animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[#F0ECE6]" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-3 max-w-md">
        <div className="rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-6 text-center">
          <Smartphone size={24} className="mx-auto text-[#9CA3AF] mb-2" />
          <p className="text-[13px] text-[#69708A]">Aucune session active trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 max-w-md">
        {sessions.map((device) => (
          <div key={device.id} className="flex items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FAF9F7] p-4">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-[#69708A]" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-dark">{device.device}</p>
                  {device.current && (
                    <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">Actuel</span>
                  )}
                </div>
                <p className="text-[12px] text-[#9CA3AF]">{device.os} · Dernière activité : {device.lastSeen}</p>
              </div>
            </div>
            {!device.current && revokeSupported && (
              <button
                onClick={() => handleRevoke(device.id)}
                className="text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline shrink-0"
              >
                Déconnecter
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
