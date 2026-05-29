"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeFileSha256 } from "@/lib/upload/fileHash";
import { useAuth } from "@/providers/AuthProvider";
import { useStorageStore } from "@/lib/store/storage-store";
import { useStorageSync } from "@/lib/store/useStorageSync";
import { SkeletonDashboard } from "@/components/ui/Skeletons";
import { SocialIcon } from "@/components/ui/SocialIcon";
import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CloudUpload,
  Crown,
  FileText,
  Folder,
  Globe2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Play,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
  Target,
} from "lucide-react";
import { formatAmountFcfa, formatStorageGo } from "@/lib/formatters";
import Link from "next/link";
import { WhatsAppBackupCard } from "@/components/dashboard/WhatsAppBackupCard";
import { StorageQuotaBar } from "@/components/dashboard/StorageQuotaBar";
import { StorageByCategory } from "@/components/dashboard/StorageByCategory";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
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

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { user, subscription, remainingTrialDays, profileLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "error" }>({ show: false, message: "", type: "success" });
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  useStorageSync(user?.id);
  const storeQuota = useStorageStore((s) => s.quota);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

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

      showToast("Fichier importé avec succès !");

    } catch (error: any) {
      const msg = error?.message || "Erreur lors de l'import du fichier";
      showToast(msg, "error");
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
      router.push("/whatsapp?scan=1");
    } else if (label === "Nouveau dossier") {
      const folderName = prompt("Entrez le nom du nouveau dossier :");
      if (folderName) {
        showToast(`Fonctionnalité de création de dossier bientôt disponible`);
      }
    } else if (label === "Partager un lien") {
      const url = window.location.origin + "/partages";
      setShareUrl(url);
      setShareModalOpen(true);
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

  if (profileLoading && !storeQuota.storage_used_bytes) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <input
  type="file"
  multiple
  ref={fileInputRef}
  onChange={handleUpload}
  className="hidden"
  disabled={isUploading}
/>
      <section className="min-w-0 space-y-6">
        <div className="grid min-w-0 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          <StorageQuotaBar />

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
                  {formatStorageGo(Number((storeQuota.storage_limit_bytes / (1024 * 1024 * 1024)).toFixed(1)))} Go · {planPrice}
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
        {shareModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">Partager le lien</h3>
              <div className="flex flex-col space-y-3">
                <button
                  className="flex items-center justify-center gap-2 rounded-btn bg-red-600 text-white py-2"
                  onClick={() => {
                    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=Découvrez%20cette%20page&body=${encodeURIComponent(shareUrl)}`, "_blank");
                    setShareModalOpen(false);
                  }}
                >
                  <SocialIcon network="gmail" size={18} /> Gmail
                </button>
                <button
                  className="flex items-center justify-center gap-2 rounded-btn bg-blue-600 text-white py-2"
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
                    setShareModalOpen(false);
                  }}
                >
                  <SocialIcon network="facebook" size={18} /> Facebook
                </button>
                <button
                  className="flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white py-2"
                  onClick={() => {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`, "_blank");
                    setShareModalOpen(false);
                  }}
                >
                  <SocialIcon network="whatsapp" size={18} /> WhatsApp
                </button>
                <button
                  className="flex items-center justify-center gap-2 rounded-btn bg-gray-200 text-gray-800 py-2"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showToast("Lien copié dans le presse-papiers !");
                    setShareModalOpen(false);
                  }}
                >
                  📋 Copier le lien
                </button>
                <button
                  className="mt-2 text-sm text-gray-500 underline"
                  onClick={() => setShareModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

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
            <h2 className="text-lg font-bold">Répartition par type</h2>
            <div className="mt-4">
              <StorageByCategory />
            </div>
          </article>

          <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold">Activité récente</h2>
            <div className="mt-4">
              <ActivityFeed />
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
