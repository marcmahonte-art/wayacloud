"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { computeFileSha256 } from "@/lib/upload/fileHash";
import { useAuth } from "@/providers/AuthProvider";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { SkeletonDashboard } from "@/components/ui/Skeletons";
import { storage } from "@/lib/storage";
import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CloudUpload,
  Crown,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Globe2,
  LockKeyhole,
  Loader2,
  MessageCircle,
  Mic2,
  MoreVertical,
  Play,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  UserPlus,
  Wallet,
  X,
  ExternalLink,
  Zap,
  Target,
} from "lucide-react";
import { formatAmountFcfa, formatStorageGo } from "@/lib/formatters";
import Link from "next/link";
import { WhatsAppBackupCard } from "@/components/dashboard/WhatsAppBackupCard";
import { RecentFilesList } from "@/components/dashboard/RecentFilesList";

const quickActions = [
  { label: "Importer", detail: "Depuis l'appareil", icon: CloudUpload, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Sauvegarder WhatsApp", detail: "", icon: MessageCircle, color: "text-wa-green", bg: "bg-green-50" },
  { label: "Nouveau dossier", detail: "Créer un dossier", icon: Folder, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "Partager un lien", detail: "Générer un lien", icon: Share2, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Album partagé", detail: "Créer un album", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
];

const getFileTypeCategory = (mimeType: string, fileName: string): string => {
  const mime = (mimeType || "").toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'Image';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'Video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'Audio';
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  return 'Document';
};

const getFileTypeIconName = (category: string): string => {
  switch (category) {
    case 'Image': return 'FileImage';
    case 'Video': return 'Play';
    case 'Audio': return 'FileAudio';
    case 'PDF': return 'FileText';
    default: return 'FileText';
  }
};

const getFileTypeColor = (category: string): string => {
  switch (category) {
    case 'Image': return 'bg-orange-100 text-primary';
    case 'Video': return 'bg-violet-100 text-violet-700';
    case 'Audio': return 'bg-green-100 text-green-700';
    case 'PDF': return 'bg-red-100 text-red-600';
    default: return 'bg-blue-100 text-blue-600';
  }
};

const tools = [
  {
    title: "Tri automatique",
    text: "CNIB / Reçus Orange Money / Actes via MLKit",
    badge: "Gratuit",
    icon: FileText,
    tone: "from-blue-50 to-white",
    badgeClass: "bg-green-100 text-green-700",
    href: "/outils/tri-automatique",
  },
  {
    title: "Recherche par mot-clé",
    text: "Retrouvez vos photos par ce que vous cherchez",
    badge: "Ex: facture, CNIB",
    icon: Search,
    tone: "from-slate-50 to-white",
    badgeClass: "bg-white text-[#69708A]",
    href: "#",
  },
  {
    title: "Résumé IA",
    text: "Résumé de conversation via Claude API",
    badge: "-1 FCFA / résumé",
    icon: MessageCircle,
    tone: "from-violet-50 to-white",
    badgeClass: "bg-violet-100 text-violet-700",
    href: "/outils/resume-ia",
  },
  {
    title: "Détection d'arnaques",
    text: "Analyse de messages et liens pour détecter les fraudes",
    badge: "Très pertinent au BF",
    icon: ShieldAlert,
    tone: "from-red-50 to-white",
    badgeClass: "bg-red-100 text-red-700",
    href: "/outils/detection-arnaques",
  },
  {
    title: "Compression intelligente",
    text: "Réduit la taille des vidéos sans perte en qualité",
    badge: "Économie de quota",
    icon: Play,
    tone: "from-orange-50 to-white",
    badgeClass: "bg-green-100 text-green-700",
    href: "#",
  },
  {
    title: "Rapport mensuel",
    text: "Statistiques, activités et économies réalisées",
    badge: "Chaque mois",
    icon: BarChart3,
    tone: "from-blue-50 to-white",
    badgeClass: "bg-blue-100 text-blue-700",
    href: "#",
  },
  {
    title: "Synthèse vocale",
    text: "Écoutez vos conversations en Français et en Mooré",
    badge: "Français + Mooré",
    icon: Mic2,
    tone: "from-emerald-50 to-white",
    badgeClass: "bg-emerald-100 text-emerald-700",
    href: "#",
  },
  {
    title: "Traduction instantanée",
    text: "Pour les commerçants BF - Ghana - Nigeria",
    badge: "Français ↔ English",
    icon: Globe2,
    tone: "from-sky-50 to-white",
    badgeClass: "bg-blue-100 text-blue-700",
    href: "/outils/traduction",
  },
];

function bytesToGo(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1)
}

function percentUsed(used: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

const ACTIVITY_ICONS: Record<string, { icon: any; color: string }> = {
  upload: { icon: CloudUpload, color: "text-violet-600" },
  delete: { icon: X, color: "text-red-500" },
  trash: { icon: Trash2, color: "text-amber-500" },
  restore: { icon: Check, color: "text-green-600" },
  share: { icon: Share2, color: "text-blue-600" },
  rename: { icon: FileText, color: "text-sky-600" },
  folder_create: { icon: Folder, color: "text-amber-500" },
  ai_action: { icon: Bot, color: "text-violet-600" },
  backup: { icon: MessageCircle, color: "text-wa-green" },
  catalog_backup: { icon: MessageCircle, color: "text-wa-green" },
  payment: { icon: Wallet, color: "text-green-600" },
  subscription: { icon: Crown, color: "text-primary" },
  signup: { icon: UserPlus, color: "text-blue-600" },
};

function formatActivityTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, storageQuota: initialQuota, subscription, remainingTrialDays, profileLoading, refresh } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "error" }>({ show: false, message: "", type: "success" });
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [liveQuota, setLiveQuota] = useState(initialQuota);
  const [activityLoading, setActivityLoading] = useState(true);

  const storageQuota = liveQuota || initialQuota;

  useRealtimeSync(user?.id, {
    onActivity: (activity: any) => setActivities((prev) => [activity, ...(Array.isArray(prev) ? prev : [])].slice(0, 50)),
    onQuotaChange: (quota: any) => setLiveQuota(quota),
  });

  // Load initial activities
  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/activities?limit=10")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setActivities(Array.isArray(data) ? data : []); setActivityLoading(false); })
      .catch(() => setActivityLoading(false));
  }, [user?.id]);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const usedGo = storageQuota ? bytesToGo(storageQuota.storage_used_bytes) : "0"
  const limitGo = storageQuota ? bytesToGo(storageQuota.storage_limit_bytes) : "5"
  const usagePercent = storageQuota ? percentUsed(storageQuota.storage_used_bytes, storageQuota.storage_limit_bytes) : 0
  const remainingGo = storageQuota ? bytesToGo(storageQuota.storage_limit_bytes - storageQuota.storage_used_bytes) : "5"
  const isTrial = remainingTrialDays > 0
  const isFree = !subscription || subscription.plan_name === "Gratuit" || subscription.plan_price === 0
  const planName = isFree ? "Gratuit" : subscription?.plan_name || "Gratuit"
  const planPrice = isFree ? "0 F/mois" : `${subscription?.plan_price?.toLocaleString("fr-FR") || "0"} F/mois`
  const renewalDate = subscription?.ends_at && !isFree
    ? new Date(subscription.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let checksumSha256: string | undefined;
      try {
        checksumSha256 = await computeFileSha256(file);
      } catch { }

      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          checksumSha256,
        }),
      });

      if (!presignRes.ok) {
        const error = await presignRes.json();
        throw new Error(error.message || "Erreur lors de la génération de l'URL");
      }

      const data = await presignRes.json() as { exists: boolean; url?: string; key: string };
      let fileUrl: string;

      if (data.exists) {
        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key: data.key,
            size: file.size,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            checksumSha256,
          }),
        });
        const confirmData = confirmRes.ok ? await confirmRes.json() : null;
        fileUrl = confirmData?.url || "";
      } else {
        const uploadRes = await fetch(data.url!, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Erreur lors de l'envoi vers Wasabi");
        }

        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key: data.key,
            size: file.size,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            checksumSha256,
          }),
        });
        const confirmData = confirmRes.ok ? await confirmRes.json() : null;
        fileUrl = confirmData?.url || data.url!.split("?")[0];
      }

      const category = getFileTypeCategory(file.type, file.name);
      
      const newFile = {
        name: file.name,
        meta: `${(file.size / (1024 * 1024)).toFixed(1)} Mo • ${category === 'PDF' ? 'PDF' : category + 's'}`,
        time: "À l'instant",
        iconName: getFileTypeIconName(category),
        color: getFileTypeColor(category),
        type: category.toLowerCase(),
        url: fileUrl,
      };

      const filesList = storage.get<unknown[]>("wayacloud_uploaded_files", []);
      filesList.unshift(newFile);
      storage.set("wayacloud_uploaded_files", filesList);

      window.dispatchEvent(new Event("wayacloud_file_uploaded"));
      showToast("Fichier importé avec succès !");

    } catch (error: any) {
      console.warn("Erreur d'import, bascule vers le mode démo local :", error);
      
      const localUrl = URL.createObjectURL(file);
      const category = getFileTypeCategory(file.type, file.name);
      
      const newFile = {
        name: file.name,
        meta: `${(file.size / (1024 * 1024)).toFixed(1)} Mo • ${category === 'PDF' ? 'PDF' : category + 's'}`,
        time: "À l'instant",
        iconName: getFileTypeIconName(category),
        color: getFileTypeColor(category),
        type: category.toLowerCase(),
        url: localUrl,
      };

      const filesList = storage.get<unknown[]>("wayacloud_uploaded_files", []);
      filesList.unshift(newFile);
      storage.set("wayacloud_uploaded_files", filesList);

      window.dispatchEvent(new Event("wayacloud_file_uploaded"));
      showToast("Fichier importé en mode démo", "info");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleActionClick = (label: string) => {
    if (label === "Importer") {
      fileInputRef.current?.click();
    } else if (label === "Sauvegarder WhatsApp") {
      router.push("/whatsapp");
    } else if (label === "Nouveau dossier") {
      const folderName = prompt("Entrez le nom du nouveau dossier :");
      if (folderName) {
        const newFolder = {
          name: folderName,
          meta: "Dossier",
          time: "À l'instant",
          iconName: "Folder",
          color: "bg-amber-100 text-amber-600",
          type: "other",
          url: "#",
        };

        const filesList = storage.get<unknown[]>("wayacloud_uploaded_files", []);
        filesList.unshift(newFolder);
        storage.set("wayacloud_uploaded_files", filesList);

        window.dispatchEvent(new Event("wayacloud_file_uploaded"));
        showToast(`Dossier "${folderName}" créé !`);
      }
    } else if (label === "Partager un lien") {
      navigator.clipboard.writeText(window.location.origin + "/partages");
      showToast("Lien copié dans le presse-papiers !");
    } else if (label === "Album partagé") {
      router.push("/albums");
    }
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMessage = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: "assistant", text: data.response || data.message || "Désolé, je n'ai pas pu traiter votre demande." }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "assistant", text: "Service temporairement indisponible. Veuillez réessayer." }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (profileLoading && !storageQuota) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />
      <section className="min-w-0 space-y-6">
        <div className="grid min-w-0 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article className="min-h-[220px] overflow-hidden rounded-card bg-gradient-to-br from-primary to-[#FF7A00] p-6 text-white shadow-card md:col-span-2 xl:col-span-1">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold">Espace de stockage</p>
                <p className="mt-5 text-4xl font-bold">{formatStorageGo(Number(usedGo))}</p>
                <p className="mt-2 text-base font-semibold">sur {formatStorageGo(Number(limitGo))} utilisés</p>
              </div>
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[14px] border-white/30">
                <div className="absolute inset-[-14px] rounded-full border-[14px] border-white border-l-white/30 border-t-white/30" />
                <span className="relative text-xl font-bold">{usagePercent}%</span>
              </div>
            </div>
            <div className="mt-6 h-1.5 rounded-pill bg-white/25">
              <div className="h-full rounded-pill bg-white" style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">{remainingGo} Go disponibles</p>
              <button onClick={() => router.push("/abonnement")} className="rounded-btn border border-white/50 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors">
                Voir les détails →
              </button>
            </div>
          </article>

          <WhatsAppBackupCard />

          <article className="min-h-[220px] overflow-hidden rounded-card border border-[#E7DCF9] bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-dark">Plan actuel</p>
                <p className="mt-4 text-xl font-bold">{planName}</p>
                {isTrial && (
                  <p className="mt-1 text-xs font-medium text-green-600">
                    {remainingTrialDays} jours d&apos;essai restants
                  </p>
                )}
                <p className="mt-3 text-sm text-[#596077]">
                  {limitGo} Go · {planPrice}
                </p>
                {renewalDate && (
                  <>
                    <p className="mt-5 text-sm text-[#596077]">{isTrial ? "Fin de l'essai le" : "Renouvellement le"}</p>
                    <p className="mt-1 text-sm font-semibold">{renewalDate}</p>
                  </>
                )}
              </div>
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-card bg-violet-100 text-violet-700">
                <Crown size={38} fill="currentColor" />
              </span>
            </div>
            <button 
              onClick={() => router.push("/abonnement")}
              className="mt-8 min-h-11 w-full rounded-btn border border-violet-500 px-5 py-2 text-sm font-bold text-violet-700 sm:w-auto hover:bg-violet-50 transition-colors"
            >
              Gérer mon abonnement
            </button>
          </article>
        </div>

        <section>
          <h2 className="text-lg font-bold text-dark">Accès rapides</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickActions.map((action) => {
              const isActionUploading = action.label === "Importer" && isUploading;
              return (
                <button
                  key={action.label}
                  onClick={() => handleActionClick(action.label)}
                  disabled={isUploading && action.label === "Importer"}
                  className="flex min-h-[72px] min-w-0 items-center gap-4 rounded-card border border-[#ECE7DF] bg-white px-4 py-3 text-left shadow-card hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${action.bg} ${action.color}`}>
                    {isActionUploading ? (
                      <Loader2 className="animate-spin" size={21} />
                    ) : (
                      <action.icon size={21} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-5 text-dark">
                      {isActionUploading ? "Envoi..." : action.label}
                    </span>
                    {action.detail ? (
                      <span className="mt-1 block text-xs text-[#69708A]">{action.detail}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
          <h2 className="text-lg font-bold text-dark">Outils intelligents ✨</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tools.map((tool) => {
              const Content = (
                <>
                  <tool.icon className="text-primary" size={38} strokeWidth={1.8} />
                  <h3 className="mt-5 text-sm font-bold text-dark">{tool.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-[#596077]">{tool.text}</p>
                  <span className={`mt-4 inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${tool.badgeClass}`}>
                    {tool.badge}
                  </span>
                </>
              );

              return tool.href !== "#" ? (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className={`min-h-[174px] block overflow-hidden rounded-card bg-gradient-to-br ${tool.tone} p-5 hover:scale-[1.02] transition-transform`}
                >
                  {Content}
                </Link>
              ) : (
                <article
                  key={tool.title}
                  className={`min-h-[174px] overflow-hidden rounded-card bg-gradient-to-br ${tool.tone} p-5 opacity-70`}
                >
                  {Content}
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
          <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Aperçu de l&apos;espace</h2>
              <button className="text-xs font-semibold text-[#69708A]">Cette semaine</button>
            </div>
            <div className="mt-6 h-[140px] rounded-card bg-gradient-to-t from-orange-50 to-white p-4">
              <div className="flex h-full items-end gap-3">
                {[32, 48, 50, 63, 62, 74, 72, 82, 83, 96].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col justify-end">
                    <div
                      className="rounded-t-md bg-primary"
                      style={{ height: `${height}%`, opacity: 0.3 + index * 0.06 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold">Activité récente</h2>
            <div className="mt-4 space-y-4">
              {activityLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-5 w-5 rounded-full bg-[#ECE7DF]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-[#ECE7DF]" />
                        <div className="h-3 w-24 rounded bg-[#F0ECE6]" />
                      </div>
                      <div className="h-3 w-16 rounded bg-[#F0ECE6]" />
                    </div>
                  ))}
                </div>
              ) : !Array.isArray(activities) || activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F3F0]">
                    <Zap size={20} className="text-[#C8C0B5]" />
                  </div>
                  <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucune activité récente</p>
                  <p className="text-xs text-slate-400 mt-1">Importez un fichier pour commencer</p>
                </div>
              ) : (
                (Array.isArray(activities) ? activities : []).slice(0, 8).map((item: any) => {
                  const actIcon = ACTIVITY_ICONS[item.type] || { icon: Zap, color: "text-[#69708A]" };
                  const Icon = actIcon.icon;
                  return (
                    <div key={item.id} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] gap-3">
                      <Icon className={actIcon.color} size={18} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[#69708A] truncate">{item.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-[#9CA3AF] whitespace-nowrap">{formatActivityTime(item.created_at)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>
      </section>

      <aside className="min-w-0 space-y-5 2xl:sticky 2xl:top-28 2xl:self-start">
        <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Sponsorisé</p>
            <button className="text-xs font-medium text-[#69708A]">Voir plus &gt;</button>
          </div>
          <div className="min-h-[196px] overflow-hidden rounded-card bg-[#141414] p-5 text-white">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Wallet className="text-primary" />
              Orange Money
            </div>
            <p className="mt-6 max-w-[230px] text-base font-semibold leading-6">
              Payez vos factures en toute simplicité avec Orange Money.
            </p>
            <button className="mt-5 rounded-btn bg-primary px-4 py-2 text-sm font-bold">
              En savoir plus
            </button>
          </div>
        </article>

        <RecentFilesList />

        <article className="min-w-0 rounded-card border border-[#E5DAF8] bg-[#FBF8FF] p-5 shadow-card">
          <div className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-3 sm:grid-cols-[48px_minmax(0,1fr)_auto]">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-blue-50 text-blue-600">
              <Bot size={26} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#4B18C9]">Assistant IA WayaCloud</h2>
              <p className="mt-0.5 text-[13px] leading-5 text-[#596077]">
                Posez-moi une question sur vos fichiers ou conversations.
              </p>
            </div>
            <span className="h-fit w-fit rounded-md bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
              Bêta
            </span>
          </div>

          {aiMessages.length > 0 && (
            <div className="mt-4 max-h-[200px] overflow-y-auto space-y-2 rounded-xl bg-white p-3 border border-[#EAE5E0]">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  <div className={`rounded-xl px-3.5 py-2.5 max-w-[85%] text-[13px] leading-5 ${
                    msg.role === "user"
                      ? "bg-primary/10 text-dark rounded-tr-sm"
                      : "bg-[#F5F3F0] text-[#4A4A4A] rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-[13px] text-[#69708A] px-1">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Réflexion...
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {aiMessages.length === 0 && ["Résumé ma discussion WhatsApp", "Quels sont mes reçus Orange Money ?", "Montre-moi mes documents CNIB"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setAiInput(prompt); }}
                className="flex h-8 items-center gap-1.5 rounded-btn bg-white px-3 text-left text-[11px] font-medium text-[#596077] border border-[#EAE5E0] hover:border-primary/30 hover:text-primary transition-colors"
              >
                {prompt}
                <ChevronRight size={12} />
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleAiSubmit(); }}
            className="mt-3 flex h-11 items-center gap-2 rounded-btn bg-white px-3.5 border border-[#EAE5E0] focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
          >
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9CA3AF]"
              placeholder="Demandez quelque chose..."
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              className="shrink-0 text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-40"
            >
              {aiLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
        </article>

        <article className="min-w-0 rounded-card border border-green-100 bg-green-50 p-5">
          <div className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-green-600 text-white">
              <MessageCircle size={28} fill="currentColor" />
            </span>
            <div>
              <h2 className="text-base font-bold text-green-800">Conseil du jour</h2>
              <p className="mt-1 text-sm leading-5 text-green-900">
                Active la sauvegarde automatique de WhatsApp pour ne jamais perdre
                vos conversations importantes.
              </p>
            </div>
            <button className="col-span-2 rounded-btn bg-green-600 px-4 py-2 text-sm font-bold text-white sm:w-fit">
              Activer maintenant
            </button>
          </div>
        </article>
      </aside>

      <footer className="2xl:col-span-2">
        <div className="grid min-w-0 gap-4 rounded-card border border-[#ECE7DF] bg-white px-5 py-4 shadow-card sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3">
            <LockKeyhole className="text-primary" />
            <div>
              <p className="text-sm font-bold">WayaCloud protège ce qui compte pour vous.</p>
              <p className="text-xs text-[#69708A]">Sécurisé. Privé. 100% conçu pour l&apos;Afrique.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CloudUpload className="text-primary" />
            <div>
              <p className="text-sm font-bold">Hébergement sécurisé</p>
              <p className="text-xs text-[#69708A]">Vos données chiffrées</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="text-violet-600" />
            <div>
              <p className="text-sm font-bold">Accessible partout</p>
              <p className="text-xs text-[#69708A]">Sur tous vos appareils</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary" />
            <div>
              <p className="text-sm font-bold">Support local</p>
              <p className="text-xs text-[#69708A]">Équipe basée au Burkina Faso</p>
            </div>
          </div>
        </div>
      </footer>

      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-4 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800"
          : toast.type === "error" ? "bg-red-50 border-red-200 text-red-800"
          : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.type === "success" ? <Check size={17} className="text-green-600" />
          : toast.type === "error" ? <X size={17} className="text-red-600" />
          : <Zap size={17} className="text-blue-600" />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
