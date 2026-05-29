"use client";

import { useState, useMemo } from "react";
import { useStorageStore, computeLargestFiles } from "@/lib/store/storage-store";
import { useStorageSync } from "@/lib/store/useStorageSync";
import { useAuth } from "@/providers/AuthProvider";
import {
  ArrowLeft, HardDrive, FileImage, Play, FileAudio, FileText, MessageCircle,
  Trash2, Download, Clock, Upload, RefreshCw, AlertTriangle,
  Activity, BarChart3, PieChart, Loader2, X, Check, FileWarning,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const CATEGORY_COLORS: Record<string, string> = {
  image: "#F97316",
  video: "#8B5CF6",
  audio: "#22C55E",
  document: "#3B82F6",
  whatsapp: "#25D366",
};

const CATEGORY_LABELS: Record<string, string> = {
  image: "Images",
  video: "Vidéos",
  audio: "Audio",
  document: "Documents",
  whatsapp: "WhatsApp",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  image: FileImage,
  video: Play,
  audio: FileAudio,
  document: FileText,
  whatsapp: MessageCircle,
};

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return Play;
  if (mime.startsWith("audio/")) return FileAudio;
  return FileText;
}

function getFileColor(mime: string) {
  if (mime.startsWith("image/")) return "bg-orange-100 text-primary";
  if (mime.startsWith("video/")) return "bg-violet-100 text-violet-700";
  if (mime.startsWith("audio/")) return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-600";
}

function computeEvolution(files: import("@/lib/store/storage-store").FileEntry[]): { date: string; bytes: number }[] {
  const daily: Record<string, number> = {};
  for (const f of files) {
    if (f.status === "deleted" || f.is_trashed) continue;
    const day = new Date(f.created_at).toISOString().slice(0, 10);
    daily[day] = (daily[day] || 0) + Number(f.size_bytes || 0);
  }
  const entries = Object.entries(daily)
    .map(([date, bytes]) => ({ date, bytes }))
    .sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  return entries.map((e) => {
    cumulative += e.bytes;
    return { date: e.date, bytes: cumulative };
  });
}

export default function StorageDetailsPage() {
  const { user } = useAuth();
  useStorageSync(user?.id);
  const storeFiles = useStorageStore((s) => s.files);
  const storeQuota = useStorageStore((s) => s.quota);
  const storeActivities = useStorageStore((s) => s.activities);
  const loading = useStorageStore((s) => s.loading);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const largestFiles = useMemo(() => computeLargestFiles(storeFiles, 20), [storeFiles]);
  const evolution = useMemo(() => computeEvolution(storeFiles), [storeFiles]);

  const usedBytes = storeQuota.storage_used_bytes;
  const limitBytes = storeQuota.storage_limit_bytes;
  const remainingBytes = Math.max(0, limitBytes - usedBytes);
  const usagePercent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;
  const totalFiles = storeFiles.length;
  const categories = storeFiles.reduce<Record<string, { count: number; bytes: number }>>((acc, f) => {
    const cat = f.mime_type?.startsWith("image/") ? "image"
      : f.mime_type?.startsWith("video/") ? "video"
        : f.mime_type?.startsWith("audio/") ? "audio"
          : f.mime_type === "message/x-whatsapp" || f.name?.includes("WhatsApp") ? "whatsapp"
            : "document";
    if (!acc[cat]) acc[cat] = { count: 0, bytes: 0 };
    acc[cat].count++;
    acc[cat].bytes += Number(f.size_bytes || 0);
    return acc;
  }, {});

  const activities = storeActivities;
  const filteredActivities = activeFilter === "all"
    ? activities
    : activities.filter((a) => a.type === activeFilter);

  const [cleaning, setCleaning] = useState(false);

  const handleClean = async () => {
    setCleaning(true);
    try {
      showToast("Espace nettoyé avec succès !", "success");
    } catch {
      showToast("Erreur lors du nettoyage", "error");
    } finally {
      setCleaning(false);
    }
  };

  const handleDownloadData = () => {
    const data = { usedBytes, limitBytes, remainingBytes, usagePercent, totalFiles, categories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wayacloud-storage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Données téléchargées !", "success");
  };

  const pieData = Object.entries(categories)
    .filter(([, v]) => v.bytes > 0)
    .map(([key, v]) => ({ name: CATEGORY_LABELS[key] || key, value: v.bytes, color: CATEGORY_COLORS[key] || "#9CA3AF" }));

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-6xl pb-12 pt-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#69708A] hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Espace de stockage</h1>
            <p className="mt-1 text-sm text-[#596077]">Gérez et surveillez votre espace de stockage en temps réel.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClean} disabled={cleaning} className="flex items-center gap-2 rounded-lg border border-[#ECE7DF] bg-white px-4 py-2.5 text-[13px] font-bold text-dark hover:bg-slate-50 transition-colors disabled:opacity-50">
            {cleaning ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Nettoyer l&apos;espace
          </button>
          <button onClick={handleDownloadData} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition-colors">
            <Download size={15} /> Télécharger mes données
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Stockage total", value: formatBytes(limitBytes), icon: HardDrive, color: "bg-purple-100 text-purple-700" },
          { label: "Stockage utilisé", value: formatBytes(usedBytes), icon: BarChart3, color: "bg-primary/10 text-primary" },
          { label: "Stockage restant", value: formatBytes(remainingBytes), icon: PieChart, color: "bg-green-100 text-green-700" },
          { label: "Fichiers", value: `${totalFiles}`, icon: FileText, color: "bg-blue-100 text-blue-600" },
        ].map((card) => (
          <article key={card.label} className="rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon size={20} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#69708A]">{card.label}</p>
                <p className="text-lg font-bold text-dark">{card.value}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Usage Bar */}
      <article className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-dark">Utilisation du stockage</h2>
          </div>
          <span className="text-sm font-bold text-primary">{usagePercent}%</span>
        </div>
        <div className="h-4 rounded-pill bg-[#F0ECE6] overflow-hidden">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-primary to-[#FF7A00] transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#69708A] font-medium">
          <span>{formatBytes(usedBytes)} utilisés</span>
          <span>{formatBytes(remainingBytes)} libres</span>
        </div>
      </article>

      {/* Donut + Evolution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Donut Chart */}
        <article className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-dark">Répartition par type</h2>
          </div>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatBytes(Number(value))}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #ECE7DF", fontSize: "13px" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium text-dark">{entry.name}</span>
                    </div>
                    <span className="font-bold text-dark">{formatBytes(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={32} className="text-slate-300" />
              <p className="mt-2 text-sm text-slate-500 font-medium">Aucun fichier</p>
            </div>
          )}
        </article>

        {/* Evolution Chart */}
        <article className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-dark">Évolution du stockage</h2>
          </div>
          {evolution.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution}>
                  <defs>
                    <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(v) => formatDate(v)}
                    interval="preserveStartEnd"
                    stroke="#E5E0D8"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(v) => formatBytes(v)}
                    stroke="#E5E0D8"
                  />
                  <Tooltip
                    formatter={(value: any) => formatBytes(Number(value))}
                    labelFormatter={(label: any) => formatDate(String(label))}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #ECE7DF", fontSize: "13px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bytes"
                    stroke="#F97316"
                    strokeWidth={2}
                    fill="url(#storageGradient)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BarChart3 size={32} className="text-slate-300" />
              <p className="mt-2 text-sm text-slate-500 font-medium">Pas assez de données</p>
            </div>
          )}
        </article>
      </div>

      {/* Largest Files */}
      <article className="rounded-card border border-[#ECE7DF] bg-white shadow-card">
        <div className="border-b border-[#ECE7DF] px-6 py-4">
          <h2 className="text-sm font-bold text-dark">Plus gros fichiers</h2>
        </div>
        {largestFiles.length > 0 ? (
          <div className="divide-y divide-[#F0ECE6]">
            {largestFiles.slice(0, 10).map((file: any) => {
              const Icon = getFileIcon(file.mime_type || "");
              const color = getFileColor(file.mime_type || "");
              return (
                <div key={file.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-dark">{file.name}</p>
                    <p className="text-[11px] text-[#69708A]">{formatDate(file.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-dark">{formatBytes(file.size_bytes)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileWarning size={32} className="text-slate-300" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Aucun fichier</p>
          </div>
        )}
      </article>

      {/* Recent Files */}
      <article className="rounded-card border border-[#ECE7DF] bg-white shadow-card">
        <div className="border-b border-[#ECE7DF] px-6 py-4">
          <h2 className="text-sm font-bold text-dark">Fichiers récents</h2>
        </div>
        {storeFiles.length > 0 ? (
          <div className="divide-y divide-[#F0ECE6]">
            {[...storeFiles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8).map((file) => {
              const Icon = getFileIcon(file.mime_type || "");
              const color = getFileColor(file.mime_type || "");
              return (
                <div key={file.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-dark">{file.name}</p>
                    <p className="text-[11px] text-[#69708A]">{formatDate(file.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-dark">{formatBytes(file.size_bytes)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Upload size={32} className="text-slate-300" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Aucun fichier récent</p>
          </div>
        )}
      </article>

      {/* Activity History */}
      <article className="rounded-card border border-[#ECE7DF] bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-[#ECE7DF] px-6 py-4">
          <h2 className="text-sm font-bold text-dark">Historique d&apos;activité</h2>
          <div className="flex gap-1">
            {["all", "upload", "delete", "trash", "restore"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  activeFilter === f ? "bg-primary text-white" : "text-[#69708A] hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "Tout" : f === "upload" ? "Upload" : f === "delete" ? "Suppression" : f === "trash" ? "Corbeille" : "Restauration"}
              </button>
            ))}
          </div>
        </div>
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-[#F0ECE6]">
            {filteredActivities.slice(0, 15).map((act) => {
              const isUpload = act.type === "upload";
              const isDelete = act.type === "delete" || act.type === "trash";
              const isRestore = act.type === "restore";
              const ActivityIcon = isUpload ? Upload : isDelete ? Trash2 : isRestore ? RefreshCw : Activity;
              const activityColor = isUpload ? "bg-green-100 text-green-700" : isDelete ? "bg-red-100 text-red-600" : isRestore ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600";
              return (
                <div key={act.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColor}`}>
                    <ActivityIcon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-dark">{act.title}</p>
                    {act.description && <p className="text-[11px] text-[#69708A]">{act.description}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] text-[#9CA3AF] font-medium">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity size={32} className="text-slate-300" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Aucune activité</p>
          </div>
        )}
      </article>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-4 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? <Check size={17} className="text-green-600" /> : <X size={17} className="text-red-600" />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
