"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCcw, Trash2, FileImage, FileText, Play, FileAudio, X, Check, Loader2 } from "lucide-react";
import { useStorageStore, type FileEntry } from "@/lib/store/storage-store";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(mime: string | undefined) {
  if (!mime) return FileText;
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return Play;
  if (mime.startsWith("audio/")) return FileAudio;
  return FileText;
}

function getFileColor(mime: string | undefined) {
  if (!mime) return "bg-blue-100 text-blue-600";
  if (mime.startsWith("image/")) return "bg-orange-100 text-orange-600";
  if (mime.startsWith("video/")) return "bg-violet-100 text-violet-700";
  if (mime.startsWith("audio/")) return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-600";
}

export default function CorbeillePage() {
  const trashedFiles = useStorageStore((s) => s.trashedFiles);
  const loading = useStorageStore((s) => s.loading);
  const removeFile = useStorageStore((s) => s.removeFile);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestore = async (file: FileEntry) => {
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trashed: false }),
      });
      showToast("Fichier restauré avec succès");
    } catch {
      showToast("Erreur lors de la restauration", "error");
    }
  };

  const handleDeletePermanent = async (file: FileEntry) => {
    try {
      await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      showToast("Fichier supprimé définitivement");
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleEmptyAll = async () => {
    try {
      await Promise.all(trashedFiles.map((f) =>
        fetch(`/api/files/${f.id}`, { method: "DELETE" }).catch(() => {})
      ));
      showToast("Corbeille vidée avec succès");
    } catch {
      showToast("Erreur lors du vidage", "error");
    }
  };

  const totalSize = trashedFiles.reduce((acc, f) => acc + Number(f.size_bytes || 0), 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl pb-12 pt-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Corbeille</h1>
          <p className="mt-1 text-sm text-[#596077]">
            Les éléments seront définitivement supprimés après 30 jours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#69708A] font-medium">
            {trashedFiles.length} élément{trashedFiles.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
          </span>
          {trashedFiles.length > 0 && (
            <button
              onClick={handleEmptyAll}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-[13px] font-bold text-red-600 shadow-sm transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} />
              Vider la corbeille
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800 border border-orange-100">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <p className="text-[13px] leading-6">
          La suppression définitive libère de l&apos;espace de stockage, mais cette action est irréversible.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
        {trashedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 size={40} className="text-slate-300" />
            <p className="mt-3 text-[13px] font-semibold text-slate-500">La corbeille est vide</p>
            <p className="text-xs text-slate-400 mt-1">Les fichiers supprimés apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#ECE7DF] bg-slate-50 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 sm:px-6 sm:py-4">Fichier</th>
                  <th className="px-5 py-3.5 sm:px-6 sm:py-4">Taille</th>
                  <th className="px-5 py-3.5 sm:px-6 sm:py-4 hidden sm:table-cell">Supprimé le</th>
                  <th className="px-5 py-3.5 sm:px-6 sm:py-4 hidden md:table-cell">Expiration</th>
                  <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7DF]">
                {trashedFiles.map((item) => {
                  const Icon = getFileIcon(item.mime_type);
                  const color = getFileColor(item.mime_type);
                  const daysRemaining = item.trashed_at
                    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(item.trashed_at).getTime()) / 86400000))
                    : 30;

                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                            <Icon size={18} />
                          </span>
                          <p className="text-[13px] font-bold text-dark truncate max-w-[200px] sm:max-w-[320px]">
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 sm:px-6 sm:py-4 text-[13px] text-slate-500 font-medium">
                        {formatBytes(Number(item.size_bytes || 0))}
                      </td>
                      <td className="px-5 py-3 sm:px-6 sm:py-4 text-[13px] text-slate-500 hidden sm:table-cell">
                        {item.trashed_at ? formatDate(item.trashed_at) : "Récemment"}
                      </td>
                      <td className="px-5 py-3 sm:px-6 sm:py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          daysRemaining <= 7 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {daysRemaining} jours
                        </span>
                      </td>
                      <td className="px-5 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRestore(item)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            aria-label="Restaurer"
                          >
                            <RefreshCcw size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePermanent(item)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            aria-label="Supprimer définitivement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? <Check size={17} className="text-green-600" /> : <X size={17} className="text-red-600" />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
