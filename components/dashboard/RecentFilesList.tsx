"use client";

import { useCallback } from "react";
import { FileImage, FileText, Play, FileAudio, Folder, MoreVertical } from "lucide-react";
import { useStorageStore } from "@/lib/store/storage-store";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getFileCategory(mimeType: string, fileName: string): string {
  const mime = (mimeType || "").toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  return "document";
}

function getFileIcon(category: string) {
  switch (category) {
    case "image": return FileImage;
    case "video": return Play;
    case "audio": return FileAudio;
    case "pdf": return FileText;
    default: return FileText;
  }
}

function getFileColor(category: string) {
  switch (category) {
    case "image": return "bg-orange-100 text-primary";
    case "video": return "bg-violet-100 text-violet-700";
    case "audio": return "bg-green-100 text-green-700";
    case "pdf": return "bg-red-100 text-red-600";
    default: return "bg-blue-100 text-blue-600";
  }
}

function getFileLabel(category: string): string {
  switch (category) {
    case "image": return "Image";
    case "video": return "Vidéo";
    case "audio": return "Audio";
    case "pdf": return "PDF";
    case "document": return "Document";
    default: return "Fichier";
  }
}

export function RecentFilesList() {
  const files = useStorageStore((s) => s.files);

  const sorted = [...files]
    .filter((f) => !f.is_trashed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleAction = useCallback((actionId: string, file: any) => {
    if (actionId === "trash" && file.id) {
      fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_trashed: true }) });
    }
    if ((actionId === "delete") && file.id) {
      fetch(`/api/files/${file.id}`, { method: "DELETE" });
    }
    if (actionId === "rename" && file.id) {
      fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name }) });
    }
  }, []);

  return (
    <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Fichiers récents</h2>
        {files.length > 5 && (
          <a href="/mes-fichiers" className="text-xs font-medium text-[#69708A] hover:text-primary transition-colors">
            Voir tout ({files.length})
          </a>
        )}
      </div>
      <div className="mt-4 divide-y divide-[#EFEAE2]">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F3F0]">
              <Folder size={24} className="text-[#C8C0B5]" />
            </div>
            <p className="mt-4 text-[13px] font-semibold text-slate-500">Aucun fichier récent</p>
            <p className="text-xs text-slate-400 mt-1">Importe ton premier fichier</p>
          </div>
        ) : (
          sorted.map((f) => {
            const cat = getFileCategory(f.mime_type, f.name);
            const Icon = getFileIcon(cat);
            return (
              <div key={f.id} className="group grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] gap-3 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors">
                <span className={`flex h-10 w-10 items-center justify-center rounded-btn ${getFileColor(cat)}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="truncate text-sm font-bold text-dark">{f.name}</p>
                  <p className="mt-1 text-xs text-[#69708A]">{formatBytes(f.size_bytes)} • {getFileLabel(cat)}</p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                  <button
                    onClick={() => handleAction("trash", f)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-md transition-all"
                    title="Corbeille"
                  >
                    <MoreVertical size={16} className="text-[#69708A]" />
                  </button>
                  <p className="whitespace-nowrap text-xs text-[#596077]">{formatDate(f.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
