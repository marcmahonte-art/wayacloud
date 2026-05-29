"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Folder,
  FileImage,
  Play,
  FileAudio,
  FileText,
  Search,
  Plus,
  Loader2,
  ChevronRight,
  Download,
  Share2,
  Eye,
  ArrowLeft,
  X,
  MoreVertical,
  CloudUpload,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { FileDetailsPanel } from "@/components/ui/FileDetailsPanel";
import { FileContextMenu } from "@/components/dashboard/FileContextMenu";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { DropZone } from "@/components/dashboard/DropZone";
import { SkeletonFileGrid } from "@/components/ui/Skeletons";
import { useStorageStore } from "@/lib/store/storage-store";
import { computeFileSha256 } from "@/lib/upload/fileHash";

interface DisplayFile {
  name: string;
  meta: string;
  time: string;
  iconName: string;
  color: string;
  type: string;
  folder: string;
  size: string;
  url: string;
  id?: string;
}

interface ViewerFile {
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "pdf" | "other";
}

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; icon: string; types: string[] }> = {
  images: { label: "Images", bg: "from-orange-50 to-orange-100/50", border: "border-orange-200", color: "text-orange-600", icon: "FileImage", types: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"] },
  videos: { label: "Vidéos", bg: "from-violet-50 to-violet-100/50", border: "border-violet-200", color: "text-violet-600", icon: "Play", types: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"] },
  audios: { label: "Musiques & Vocaux", bg: "from-green-50 to-green-100/50", border: "border-green-200", color: "text-green-600", icon: "FileAudio", types: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac"] },
  documents: { label: "Documents", bg: "from-red-50 to-red-100/50", border: "border-red-200", color: "text-red-600", icon: "FileText", types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "text/plain"] },
  whatsapp: { label: "Sauvegardes WhatsApp", bg: "from-emerald-50 to-emerald-100/50", border: "border-emerald-200", color: "text-emerald-600", icon: "FileText", types: [] },
};

const EXT_TO_TYPE: Record<string, string> = {
  jpg: "Image", jpeg: "Image", png: "Image", gif: "Image", webp: "Image", svg: "Image",
  mp4: "Video", webm: "Video", ogv: "Video", mov: "Video", avi: "Video",
  mp3: "Audio", wav: "Audio", ogg: "Audio", m4a: "Audio", aac: "Audio",
  pdf: "PDF", doc: "Document", docx: "Document", xls: "Document", xlsx: "Document",
  txt: "Document",
};

function categorizeMime(mimeType: string | null, fileName: string): { folder: string; typeLabel: string; iconName: string; color: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = (mimeType || "").toLowerCase();
  for (const [key, cfg] of Object.entries(CATEGORY_CONFIG)) {
    if (cfg.types.some((t) => mime.startsWith(t.split("/")[0]))) {
      const typeLabel = mime.startsWith("image") ? "Image" : mime.startsWith("video") ? "Vidéo" : mime.startsWith("audio") ? "Audio" : "Document";
      return { folder: key, typeLabel, iconName: cfg.icon, color: cfg.color };
    }
  }
  const typeLabel = EXT_TO_TYPE[ext] || "Document";
  for (const [key, cfg] of Object.entries(CATEGORY_CONFIG)) {
    if (cfg.types.some((t) => t.includes(ext))) {
      return { folder: key, typeLabel, iconName: cfg.icon, color: cfg.color };
    }
  }
  if (ext === "zip" || ext === "rar" || ext === "7z") return { folder: "documents", typeLabel: "Archive", iconName: "FileText", color: "bg-blue-100 text-blue-600" };
  return { folder: "documents", typeLabel: "Document", iconName: "FileText", color: "bg-blue-100 text-blue-600" };
}

const ICON_MAP: Record<string, typeof FileImage> = { FileImage, Play, FileAudio, FileText, Folder };

function toViewerFile(file: DisplayFile | null): ViewerFile | null {
  if (!file) return null;
  return { name: file.name, url: file.url, type: (["image", "video", "audio", "pdf"] as const).includes(file.type as any) ? file.type as "image" | "video" | "audio" | "pdf" : "other" };
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} Go`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${bytes} o`;
}

export default function FilesExplorerPage() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeFiles = useStorageStore((s) => s.files);
  const loading = useStorageStore((s) => s.loading);


  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DisplayFile | null>(null);
  const [fullscreenFile, setFullscreenFile] = useState<DisplayFile | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file: any; position: { x: number; y: number }; open: boolean }>({ file: null, position: { x: 0, y: 0 }, open: false });
  const [shareModalFile, setShareModalFile] = useState<DisplayFile | null>(null);
  const [detailsFile, setDetailsFile] = useState<DisplayFile | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameModal, setRenameModal] = useState<{ file: DisplayFile | null; open: boolean }>({ file: null, open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ file: DisplayFile | null; open: boolean }>({ file: null, open: false });

  const allFiles: DisplayFile[] = useMemo(() => {
    return storeFiles.map((f) => {
      const cat = categorizeMime(f.mime_type, f.name);
      const sizeStr = formatFileSize(f.size_bytes);
      const timeStr = new Date(f.created_at || f.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      return {
        name: f.name,
        meta: `${sizeStr} - ${cat.typeLabel}`,
        time: timeStr,
        iconName: cat.iconName,
        color: cat.color,
        type: f.mime_type?.startsWith("image") ? "image" : f.mime_type?.startsWith("video") ? "video" : f.mime_type?.startsWith("audio") ? "audio" : "document",
        folder: cat.folder,
        size: sizeStr,
        url: "",
        id: f.id,
      };
    });
  }, [storeFiles]);

  const folderStats = useMemo(() => {
    const stats: Record<string, { count: number; totalBytes: number }> = {};
    for (const f of allFiles) {
      if (!stats[f.folder]) stats[f.folder] = { count: 0, totalBytes: 0 };
      stats[f.folder].count++;
      const bytes = parseFloat(f.size) * (f.size.includes("Go") ? 1073741824 : f.size.includes("Mo") ? 1048576 : f.size.includes("Ko") ? 1024 : 1);
      if (!isNaN(bytes)) stats[f.folder].totalBytes += bytes;
    }
    return stats;
  }, [allFiles]);

  const foldersList = Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => {
    const s = folderStats[id] || { count: 0, totalBytes: 0 };
    return { id, ...cfg, countText: s.count, sizeText: formatFileSize(s.totalBytes) };
  });

  const filteredFiles = allFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolder ? file.folder === currentFolder : true;
    return matchesSearch && matchesFolder;
  });

  const getFileKey = (file: DisplayFile) => file.id || `${file.name}|${file.url}`;
  const selectedKeys = new Set(Array.from(selectedIds));
  const allSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedKeys.has(getFileKey(f)));

  const toggleSelect = (file: DisplayFile) => {
    const key = getFileKey(file);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredFiles.map((f) => getFileKey(f))));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchDownload = () => {
    const selected = filteredFiles.filter((f) => selectedKeys.has(getFileKey(f)) && f.url && f.url !== "#");
    selected.forEach((f) => window.open(f.url, "_blank"));
  };

  const handleBatchShare = () => {
    const firstSelected = filteredFiles.find((f) => selectedKeys.has(getFileKey(f)));
    if (firstSelected) setShareModalFile(firstSelected);
  };

  const handleBatchTrash = async () => {
    const selected = filteredFiles.filter((f) => selectedKeys.has(getFileKey(f)));
    for (const f of selected) {
      if (f.id) {
        await fetch(`/api/files/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_trashed: true }) });
      }
    }
    clearSelection();
  };

  const handleDownload = (file: DisplayFile) => {
    if (file.url && file.url !== "#") window.open(file.url, "_blank");
  };

  const handleRename = async (newName: string) => {
    if (!renameModal.file || !newName.trim()) return;
    const f = renameModal.file;
    if (f.id) {
      await fetch(`/api/files/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
    }
    setRenameModal({ file: null, open: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.file) return;
    const f = deleteConfirm.file;
    if (f.id) {
      await fetch(`/api/files/${f.id}`, { method: "DELETE" });
    }
    setDeleteConfirm({ file: null, open: false });
  };

  const handleContextMenuAction = useCallback((actionId: string, file: any) => {
    if (actionId === "share") { setShareModalFile(file); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "info") { setDetailsFile(file); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "download") { handleDownload(file); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "open") { setFullscreenFile(file); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "rename") { setRenameModal({ file, open: true }); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "delete") { setDeleteConfirm({ file, open: true }); setContextMenu((prev) => ({ ...prev, open: false })); return; }
    if (actionId === "trash") {
      if (file.id) fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_trashed: true }) });
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }
    if (actionId === "favorite") {
      if (file.id) fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_favorite: true }) });
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }
    if (actionId === "copy") {
      if (file.id) fetch("/api/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: file.id }) });
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }
    if (actionId === "move") {
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }
    setContextMenu((prev) => ({ ...prev, open: false }));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        let checksumSha256: string | undefined;
        try { checksumSha256 = await computeFileSha256(file); } catch { }
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size, checksumSha256 }),
        });
        if (!presignRes.ok) throw new Error("Erreur de préparation");
        const data = await presignRes.json() as { exists: boolean; url?: string; key: string };
        if (data.exists) {
          await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
          });
        } else {
          const uploadRes = await fetch(data.url!, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
          if (!uploadRes.ok) throw new Error("Erreur de transfert");
          await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
          });
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getIconComponent = (iconName: string) => ICON_MAP[iconName] || FileText;

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[450px] w-full gap-0 overflow-hidden rounded-2xl border border-[#ECE7DF] bg-[#FBFAF8] shadow-card lg:gap-6">
      <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" disabled={isUploading} />

      <section className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECE7DF] pb-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#69708A] uppercase tracking-wider">
              <span className="cursor-pointer hover:text-primary transition" onClick={() => setCurrentFolder(null)}>Mon stockage</span>
              {currentFolder && (<><ChevronRight size={10} /><span className="text-dark font-bold">{foldersList.find(f => f.id === currentFolder)?.label}</span></>)}
            </div>
            <h2 className="mt-1 text-xl font-bold text-dark sm:text-2xl">
              {currentFolder ? foldersList.find(f => f.id === currentFolder)?.label : "Mon stockage"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex sm:hidden h-10 w-10 items-center justify-center rounded-card border border-[#E3DFE8] bg-white shadow-sm text-[#516080]" onClick={() => setShowSearch(true)}>
              <Search size={16} />
            </div>
            {showSearch && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-white/95 backdrop-blur-sm pt-4 px-4 sm:hidden" onClick={() => setShowSearch(false)}>
                <div className="flex w-full max-w-md items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 h-12 rounded-xl border border-[#E3DFE8] bg-white px-4 text-[15px] outline-none placeholder:text-[#69708A]" placeholder="Rechercher un fichier..." autoFocus />
                  <button onClick={() => setShowSearch(false)} className="h-12 px-4 text-[14px] font-semibold text-primary">Fermer</button>
                </div>
              </div>
            )}
            <label className="hidden sm:flex h-11 items-center gap-2.5 rounded-card border border-[#E3DFE8] bg-white px-3.5 shadow-sm max-w-[220px]">
              <Search size={16} className="text-[#516080]" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708A]" placeholder="Rechercher..." />
            </label>
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-btn bg-primary px-4 text-[13px] font-bold text-white shadow-sm hover:bg-primary-light transition disabled:opacity-70">
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              <span className="hidden sm:inline">Importer</span>
            </button>
            <button onClick={() => setShowDropZone(!showDropZone)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-btn border px-4 text-[13px] font-bold transition ${showDropZone ? "border-primary bg-primary/5 text-primary" : "border-[#E3DFE8] bg-white text-[#4A4A4A] hover:bg-[#F5F3F0]"}`}>
              <CloudUpload size={15} />
              <span className="hidden sm:inline">Glisser-déposer</span>
            </button>
          </div>
        </header>

        {showDropZone && (
          <div className="mt-4 mb-2 shrink-0">
            <DropZone onUploadComplete={() => { setShowDropZone(false); }} />
          </div>
        )}

        {!currentFolder && (
          <section className="mt-5 shrink-0">
            <h3 className="text-[11px] font-bold text-[#69708A] uppercase tracking-wider mb-3">Dossiers par type</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {foldersList.map((folder) => (
                <div key={folder.id} onClick={() => setCurrentFolder(folder.id)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border ${folder.border} bg-gradient-to-br ${folder.bg} shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-[120px]`}>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${folder.color}`}>
                    <Folder size={22} fill="currentColor" className="opacity-30" />
                  </span>
                  <div className="mt-3">
                    <h4 className="text-[13px] font-bold text-dark truncate">{folder.label}</h4>
                    <p className="mt-0.5 text-[11px] text-[#69708A] font-semibold">{folder.countText} fichiers · {folder.sizeText}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentFolder && (
          <button onClick={() => setCurrentFolder(null)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:text-primary-light transition w-fit shrink-0">
            <ArrowLeft size={15} /> Retour
          </button>
        )}

        <section className="mt-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-[11px] font-bold text-[#69708A] uppercase tracking-wider">{currentFolder ? "Fichiers" : "Tous les fichiers"}</h3>
            <span className="text-[11px] text-[#69708A] font-semibold">{filteredFiles.length} fichiers</span>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
            {loading ? (
              <div className="p-6"><SkeletonFileGrid /></div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Folder size={40} className="text-[#C8C0B5]" />
                <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucun fichier trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Glissez ou importez un nouveau fichier.</p>
              </div>
            ) : (
              <><div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#ECE7DF] bg-primary/5" style={{ display: selectedIds.size > 0 ? 'flex' : 'none' }}>
                <span className="text-[13px] font-bold text-primary">{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={handleBatchDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-dark hover:bg-white transition-colors"><Download size={13} /> Tout télécharger</button>
                  <button onClick={handleBatchShare} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-dark hover:bg-white transition-colors"><Share2 size={13} /> Partager</button>
                  <button onClick={handleBatchTrash} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-white transition-colors"><Trash2 size={13} /> Corbeille</button>
                  <button onClick={clearSelection} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#69708A] hover:bg-white transition-colors"><X size={13} /> Annuler</button>
                </div>
              </div><table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF] text-[11px] font-bold text-[#69708A] uppercase tracking-wider">
                    <th className="py-3 px-2 sm:px-3 w-10"><button onClick={toggleSelectAll} className="flex items-center justify-center w-full">{allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-[#9CA3AF]" />}</button></th>
                    <th className="py-3 px-2 sm:px-5">Nom</th>
                    <th className="py-3 px-2 sm:px-5 hidden sm:table-cell">Type</th>
                    <th className="py-3 px-2 sm:px-5">Taille</th>
                    <th className="py-3 px-2 sm:px-5 hidden md:table-cell">Modifié</th>
                    <th className="py-3 px-2 sm:px-5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EDE6] text-sm">
                  {filteredFiles.map((file, idx) => {
                    const IconComp = getIconComponent(file.iconName);
                    const isSelected = selectedFile?.name === file.name;
                    const isChecked = selectedKeys.has(getFileKey(file));
                    return (
                      <tr key={getFileKey(file)} onClick={() => setSelectedFile(file)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFile(file); setContextMenu({ file, position: { x: e.clientX, y: e.clientY }, open: true }); }}
                        className={`group hover:bg-[#FDFCFB] cursor-pointer transition ${isSelected ? "bg-primary/[0.04] hover:bg-primary/[0.06]" : isChecked ? "bg-primary/[0.02]" : ""}`}>
                        <td className="py-3 px-2 sm:px-3"><button onClick={(e) => { e.stopPropagation(); toggleSelect(file); }} className="flex items-center justify-center w-full">{isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-[#D0D0D0] group-hover:text-[#9CA3AF] transition-colors" />}</button></td>
                        <td className="py-3 px-2 sm:px-5"><div className="flex items-center gap-3 min-w-0"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${file.color || "bg-blue-100 text-blue-600"}`}><IconComp size={16} /></span><span className="truncate text-[13px] font-semibold text-dark max-w-[120px] sm:max-w-[200px] md:max-w-[280px]">{file.name}</span></div></td>
                        <td className="py-3 px-2 sm:px-5 text-[11px] text-[#596077] font-semibold uppercase hidden sm:table-cell">{file.type}</td>
                        <td className="py-3 px-2 sm:px-5 text-[13px] text-[#596077] font-medium">{file.size}</td>
                        <td className="py-3 px-2 sm:px-5 text-[12px] text-[#69708A] hidden md:table-cell">{file.time}</td>
                        <td className="py-3 px-2 sm:px-5 text-center"><div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setFullscreenFile(file); }} className="flex h-9 w-9 items-center justify-center text-[#69708A] hover:bg-[#F3EFE9] hover:text-primary rounded-lg transition" aria-label="Ouvrir"><Eye size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(file); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setContextMenu({ file, position: { x: rect.left - 220, y: rect.bottom + 4 }, open: true }); }} className="flex h-9 w-9 items-center justify-center text-[#69708A] hover:bg-[#F3EFE9] hover:text-dark rounded-lg transition" aria-label="Plus d'actions"><MoreVertical size={16} /></button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>)}
          </div>
        </section>
      </section>

      {selectedFile && (
        <aside className="w-[320px] shrink-0 border-l border-[#ECE7DF] bg-white flex-col hidden xl:flex">
          <header className="flex items-center justify-between border-b border-[#ECE7DF] px-5 py-3.5 bg-[#FBF8FF]">
            <h3 className="text-[14px] font-bold text-dark">Aperçu</h3>
            <button onClick={() => setSelectedFile(null)} className="p-1 text-[#69708A] hover:bg-black/5 hover:text-red-500 rounded-full transition"><X size={17} /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="w-full aspect-[4/3] rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] flex items-center justify-center p-3 relative overflow-hidden shadow-sm">
              {selectedFile.type === "image" ? (
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full h-full object-contain" />
              ) : selectedFile.type === "video" ? (
                <video src={selectedFile.url} controls className="w-full h-full rounded-md" />
              ) : selectedFile.type === "audio" ? (
                <div className="w-full text-center space-y-3">
                  <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-100 text-green-700"><FileAudio size={24} /></span>
                  <audio src={selectedFile.url} controls className="w-full max-w-[180px] mx-auto" />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm"><FileText size={28} /></span>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#EAE3D5] text-[11px] font-extrabold text-[#595246] uppercase">{selectedFile.name.split(".").pop()}</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-dark break-all leading-5">{selectedFile.name}</h4>
              <p className="mt-0.5 text-[11px] font-semibold text-[#69708A] uppercase">{selectedFile.type}</p>
            </div>
            <div className="rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] p-3.5">
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between"><span className="text-[#69708A] font-semibold">Type</span><span className="font-bold text-dark capitalize">{selectedFile.type}</span></div>
                <div className="flex justify-between"><span className="text-[#69708A] font-semibold">Taille</span><span className="font-bold text-dark">{selectedFile.size}</span></div>
                <div className="flex justify-between"><span className="text-[#69708A] font-semibold">Modifié</span><span className="font-bold text-dark text-right max-w-[140px] truncate">{selectedFile.time}</span></div>
              </div>
            </div>
          </div>
          <footer className="border-t border-[#ECE7DF] p-4 bg-[#FBF8FF] space-y-2.5 shrink-0">
            <button onClick={() => setFullscreenFile(selectedFile)} className="w-full flex items-center justify-center gap-2 rounded-btn bg-primary py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-primary-light transition"><Eye size={15} /> Ouvrir</button>
            <div className="grid grid-cols-2 gap-2">
              <a href={selectedFile.url} download target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-[13px] font-bold text-dark hover:bg-slate-50 transition"><Download size={14} /> Télécharger</a>
              <button onClick={() => setShareModalFile(selectedFile)} className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-[13px] font-bold text-dark hover:bg-slate-50 transition"><Share2 size={14} /> Partager</button>
            </div>
          </footer>
        </aside>
      )}

      <FileContextMenu file={contextMenu.file} isOpen={contextMenu.open} position={contextMenu.position} onClose={() => setContextMenu((prev) => ({ ...prev, open: false }))} onAction={handleContextMenuAction} />
      <ShareModal isOpen={!!shareModalFile} onClose={() => setShareModalFile(null)} file={shareModalFile} />
      <FileViewerModal isOpen={!!fullscreenFile} onClose={() => setFullscreenFile(null)} file={toViewerFile(fullscreenFile)} />
      {detailsFile && <FileDetailsPanel file={detailsFile} onClose={() => setDetailsFile(null)} />}

      {renameModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="px-6 py-5 space-y-4">
              <h2 className="text-[15px] font-bold text-dark">Renommer</h2>
              <div>
                <label className="text-[12px] font-semibold text-[#9CA3AF] mb-1.5 block">Nouveau nom</label>
                <input autoFocus value={renameModal.file?.name || ""} onChange={(e) => setRenameModal({ ...renameModal, file: renameModal.file ? { ...renameModal.file, name: e.target.value } : null })}
                  onKeyDown={(e) => e.key === "Enter" && handleRename((e.target as HTMLInputElement).value)}
                  className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setRenameModal({ file: null, open: false })} className="rounded-lg border border-[#EAE5E0] bg-white px-4 py-2 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">Annuler</button>
                <button onClick={() => handleRename(renameModal.file?.name || "")} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Renommer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="px-6 py-5 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></div>
              <div className="text-center">
                <h2 className="text-[15px] font-bold text-dark">Supprimer définitivement</h2>
                <p className="mt-1 text-[13px] text-[#9CA3AF] font-medium">Êtes-vous sûr de vouloir supprimer <strong className="text-[#4A4A4A]">{deleteConfirm.file?.name}</strong> ? Cette action est irréversible.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeleteConfirm({ file: null, open: false })} className="flex-1 rounded-lg border border-[#EAE5E0] py-2.5 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">Annuler</button>
                <button onClick={handleConfirmDelete} className="flex-1 rounded-lg bg-red-600 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 transition-colors">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
