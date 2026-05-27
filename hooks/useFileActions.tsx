"use client";

import { useCallback, useState } from "react";
import { FileItem } from "@/components/dashboard/FileContextMenu";
import { storage } from "@/lib/storage";

interface UseFileActionsOptions {
  onFilesChanged?: () => void;
}

async function apiCall(url: string, options?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useFileActions({ onFilesChanged }: UseFileActionsOptions = {}) {
  const [renameModal, setRenameModal] = useState<{ file: FileItem; open: boolean }>({ file: null as any, open: false });
  const [moveModal, setMoveModal] = useState<{ file: FileItem; open: boolean }>({ file: null as any, open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ file: FileItem; open: boolean }>({ file: null as any, open: false });

  const getFilesFromStorage = (): FileItem[] => {
    return storage.get<FileItem[]>("wayacloud_uploaded_files", []);
  };

  const saveFilesToStorage = (files: FileItem[]) => {
    storage.set("wayacloud_uploaded_files", files);
    window.dispatchEvent(new Event("wayacloud_file_uploaded"));
    onFilesChanged?.();
  };

  const fileMatches = (a: FileItem, b: FileItem) => {
    if (a.id && b.id) return a.id === b.id;
    return a.name === b.name && a.url === b.url;
  };

  const handleAction = useCallback((actionId: string, file: FileItem) => {
    switch (actionId) {
      case "open":
        handleOpen(file);
        break;
      case "download":
        handleDownload(file);
        break;
      case "rename":
        setRenameModal({ file, open: true });
        break;
      case "move":
        setMoveModal({ file, open: true });
        break;
      case "copy":
        handleCopy(file);
        break;
      case "favorite":
        handleToggleFavorite(file);
        break;
      case "trash":
        handleTrash(file);
        break;
      case "delete":
        setDeleteConfirm({ file, open: true });
        break;
    }
  }, []);

  const handleOpen = (file: FileItem) => {
    const event = new CustomEvent("wayacloud_open_file", { detail: file });
    window.dispatchEvent(event);
  };

  const handleDownload = (file: FileItem) => {
    if (!file.url || file.url === "#") return;
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  };

  const handleCopy = async (file: FileItem) => {
    if (file.id) {
      const result = await apiCall("/api/files", {
        method: "POST",
        body: JSON.stringify({ fileId: file.id }),
      });
      if (result) { onFilesChanged?.(); return; }
    }
    const files = getFilesFromStorage();
    const copyName = `Copie - ${file.name}`;
    files.unshift({ ...file, name: copyName, time: "À l'instant" });
    saveFilesToStorage(files);
  };

  const handleToggleFavorite = async (file: FileItem) => {
    if (file.id) {
      const result = await apiCall(`/api/files/${file.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: !file.is_favorite }),
      });
      if (result) { onFilesChanged?.(); return; }
    }
    const files = getFilesFromStorage();
    const updated = files.map((f) =>
      fileMatches(f, file) ? { ...f, is_favorite: !f.is_favorite } : f
    );
    saveFilesToStorage(updated);
  };

  const handleTrash = async (file: FileItem) => {
    if (file.id) {
      const result = await apiCall(`/api/files/${file.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_trashed: true }),
      });
      if (result) { onFilesChanged?.(); return; }
    }
    const files = getFilesFromStorage();
    saveFilesToStorage(files.filter((f) => !fileMatches(f, file)));
  };

  const handleRename = async (newName: string) => {
    if (!renameModal.file || !newName.trim()) return;
    const file = renameModal.file;
    if (file.id) {
      const result = await apiCall(`/api/files/${file.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (result) { setRenameModal({ file: null as any, open: false }); onFilesChanged?.(); return; }
    }
    const files = getFilesFromStorage();
    const updated = files.map((f) =>
      fileMatches(f, file) ? { ...f, name: newName.trim(), time: "À l'instant" } : f
    );
    saveFilesToStorage(updated);
    setRenameModal({ file: null as any, open: false });
  };

  const handleMoveToFolder = (targetFolder: string) => {
    if (!moveModal.file) return;
    const files = getFilesFromStorage();
    const updated = files.map((f) =>
      fileMatches(f, moveModal.file) ? { ...f, folder: targetFolder, time: "À l'instant" } : f
    );
    saveFilesToStorage(updated);
    setMoveModal({ file: null as any, open: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.file) return;
    const file = deleteConfirm.file;
    if (file.id) {
      const result = await apiCall(`/api/files/${file.id}`, { method: "DELETE" });
      if (result) { setDeleteConfirm({ file: null as any, open: false }); onFilesChanged?.(); return; }
    }
    handleTrash(file);
    setDeleteConfirm({ file: null as any, open: false });
  };

  return {
    handleAction,
    renameModal,
    setRenameModal,
    moveModal,
    setMoveModal,
    deleteConfirm,
    setDeleteConfirm,
    handleRename,
    handleMoveToFolder,
    handleConfirmDelete,
    handleDownload,
  };
}

export function RenameModal({
  isOpen,
  onClose,
  fileName,
  onRename,
}: {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(fileName);
  if (!isOpen) return null;

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const baseName = ext ? fileName.slice(0, -(ext.length + 1)) : fileName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="px-6 py-5 space-y-4">
          <h2 className="text-[15px] font-bold text-dark">Renommer</h2>
          <div>
            <label className="text-[12px] font-semibold text-[#9CA3AF] mb-1.5 block">Nouveau nom</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onRename(name)}
              className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-[#EAE5E0] bg-white px-4 py-2 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">Annuler</button>
            <button onClick={() => onRename(name)} disabled={!name.trim() || name === fileName} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Renommer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MoveModal({
  isOpen,
  onClose,
  folders,
  onMove,
}: {
  isOpen: boolean;
  onClose: () => void;
  folders: { id: string; label: string }[];
  onMove: (folderId: string) => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="px-6 py-5 space-y-3">
          <h2 className="text-[15px] font-bold text-dark">Déplacer vers</h2>
          <div className="space-y-1">
            {folders.map((folder) => (
              <button key={folder.id} onClick={() => onMove(folder.id)} className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                </span>
                {folder.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="mt-2 w-full rounded-lg border border-[#EAE5E0] py-2 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">Annuler</button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  fileName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#EAE5E0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="px-6 py-5 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </div>
          <div className="text-center">
            <h2 className="text-[15px] font-bold text-dark">Supprimer définitivement</h2>
            <p className="mt-1 text-[13px] text-[#9CA3AF] font-medium">Êtes-vous sûr de vouloir supprimer <strong className="text-[#4A4A4A]">{fileName}</strong> ? Cette action est irréversible.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-[#EAE5E0] py-2.5 text-[13px] font-semibold text-[#4A4A4A] hover:bg-[#F5F3F0] transition-colors">Annuler</button>
            <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 transition-colors">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const folderIcons = {
  images: { label: "Images", color: "text-orange-600 bg-orange-50" },
  videos: { label: "Vidéos", color: "text-violet-600 bg-violet-50" },
  audios: { label: "Musiques & Vocaux", color: "text-green-600 bg-green-50" },
  documents: { label: "Documents", color: "text-red-600 bg-red-50" },
  whatsapp: { label: "Sauvegardes WhatsApp", color: "text-emerald-600 bg-emerald-50" },
};

export function getFolderList() {
  return Object.entries(folderIcons).map(([id, info]) => ({ id, label: info.label }));
}
