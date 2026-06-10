"use client";

import { useCallback, useState, useEffect } from "react";
import { FileImage, FileText, Play, FileAudio, Folder, MoreVertical, Download, Edit3, Trash2, Star, Share2, Info } from "lucide-react";
import { useStorageStore } from "@/lib/store/storage-store";
import { FileViewerModal, type ViewerFile } from "@/components/ui/FileViewerModal";
import { FileDetailsPanel } from "@/components/ui/FileDetailsPanel";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { RenameFileDialog } from "@/components/files/RenameFileDialog";

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

const MENU_ITEMS = [
  { id: "download", label: "Télécharger", icon: Download },
  { id: "rename", label: "Renommer", icon: Edit3 },
  { id: "favorite", label: "Favori", icon: Star },
  { id: "share", label: "Partager", icon: Share2 },
  { id: "trash", label: "Corbeille", icon: Trash2 },
  { id: "info", label: "Informations", icon: Info },
];

function toViewerFile(f: any): ViewerFile {
  const mime = (f.mime_type || "").toLowerCase();
  let type: ViewerFile["type"] = "other";
  if (mime.startsWith("image/")) type = "image";
  else if (mime.startsWith("video/")) type = "video";
  else if (mime.startsWith("audio/")) type = "audio";
  else if (mime === "application/pdf") type = "pdf";
  return { id: f.id, name: f.name, url: f.url || "", type };
}

export function RecentFilesList() {
  const files = useStorageStore((s) => s.files);
  const refreshAll = useStorageStore((s) => s.refreshAll);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [shareFile, setShareFile] = useState<any>(null);
  const [detailsFile, setDetailsFile] = useState<any>(null);
  const [renameFileTarget, setRenameFileTarget] = useState<any>(null);

  const sorted = [...files]
    .filter((f) => !f.is_trashed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleAction = useCallback(async (actionId: string, file: any) => {
    setOpenMenu(null);
    if (actionId === "download" && file.url) {
      window.open(file.url, "_blank");
      return;
    }
    if (actionId === "trash" && file.id) {
      await fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_trashed: true }) });
      refreshAll();
      return;
    }
    if (actionId === "favorite" && file.id) {
      const raw = useStorageStore.getState().files.find((f) => f.id === file.id);
      const current = raw?.is_favorite ?? false;
      await fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_favorite: !current }) });
      refreshAll();
      return;
    }
    if (actionId === "rename" && file.id) {
      setRenameFileTarget(file);
      return;
    }
    if (actionId === "share") {
      setShareFile(file);
      return;
    }
    if (actionId === "info") {
      const raw = useStorageStore.getState().files.find((f) => f.id === file.id);
      setDetailsFile(raw || file);
      return;
    }
  }, [refreshAll]);

  const viewerFiles: ViewerFile[] = sorted.map(toViewerFile);

  return (
    <>
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
              const isOpen = openMenu === f.id;
              return (
                <div key={f.id} className="group grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] gap-3 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer" onClick={() => setViewerIndex(sorted.indexOf(f))}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-btn ${getFileColor(cat)}`}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="truncate text-sm font-bold text-dark">{f.name}</p>
                    <p className="mt-1 text-xs text-[#69708A]">{formatBytes(f.size_bytes)} • {getFileLabel(cat)}</p>
                  </div>
                  <div className="relative flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(isOpen ? null : f.id); }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#E3DFE8] rounded-md transition-all"
                      title="Actions"
                    >
                      <MoreVertical size={16} className="text-[#69708A]" />
                    </button>
                    {isOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-card border border-[#ECE7DF] bg-white py-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        {MENU_ITEMS.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleAction(item.id, f)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-[#516080] hover:bg-[#F5F3F0] transition-colors"
                            >
                              <ItemIcon size={15} className="text-[#69708A]" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="whitespace-nowrap text-xs text-[#596077]">{formatDate(f.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </article>
      <FileViewerModal
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        files={viewerFiles}
        initialIndex={viewerIndex ?? 0}
      />
      <ShareModal isOpen={!!shareFile} onClose={() => setShareFile(null)} file={shareFile} />
      {detailsFile && <FileDetailsPanel file={detailsFile} onClose={() => setDetailsFile(null)} />}
      <RenameFileDialog
        isOpen={!!renameFileTarget}
        fileName={renameFileTarget?.name || ""}
        onClose={() => setRenameFileTarget(null)}
        onConfirm={async (newName) => {
          if (!renameFileTarget?.id) return false;
          try {
            const res = await fetch(`/api/files/${renameFileTarget.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
              refreshAll();
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }}
      />
    </>
  );
}
