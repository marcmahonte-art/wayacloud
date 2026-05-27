"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { computeFileSha256 } from "@/lib/upload/fileHash";
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
} from "lucide-react";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { FileContextMenu } from "@/components/dashboard/FileContextMenu";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { DropZone } from "@/components/dashboard/DropZone";
import { SkeletonFileGrid } from "@/components/ui/Skeletons";
import { storage } from "@/lib/storage";
import {
  useFileActions,
  RenameModal,
  MoveModal,
  DeleteConfirmModal,
  getFolderList,
} from "@/hooks/useFileActions";

type FileKind = "image" | "video" | "audio" | "pdf" | "document" | "other";

interface StoredFile {
  name: string;
  meta: string;
  time: string;
  iconName: string;
  color: string;
  type: FileKind;
  folder: string;
  size: string;
  url: string;
}

interface ViewerFile {
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "pdf" | "other";
}

// Initial mock files database
const staticFilesData: StoredFile[] = [
  { name: "Vacances Bobo 2026.jpg", meta: "4.2 Mo • Image", time: "24 mai 2026, 10:30", iconName: "FileImage", color: "bg-orange-100 text-orange-600", type: "image", folder: "images", size: "4.2 Mo", url: "https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=2000&auto=format&fit=crop" },
  { name: "Logo_WayaCloud_HD.png", meta: "1.8 Mo • Image", time: "23 mai 2026, 14:15", iconName: "FileImage", color: "bg-orange-100 text-orange-600", type: "image", folder: "images", size: "1.8 Mo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
  { name: "Mariage_Adama.mp4", meta: "128 Mo • Vidéo", time: "23 mai 2026, 16:20", iconName: "Play", color: "bg-violet-100 text-violet-700", type: "video", folder: "videos", size: "128 Mo", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { name: "Tuto_WayaCloud_Intro.mp4", meta: "45 Mo • Vidéo", time: "22 mai 2026, 11:05", iconName: "Play", color: "bg-violet-100 text-violet-700", type: "video", folder: "videos", size: "45 Mo", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
  { name: "Podcast_Audio.mp3", meta: "15 Mo • Audio", time: "23 mai 2026, 18:45", iconName: "FileAudio", color: "bg-green-100 text-green-700", type: "audio", folder: "audios", size: "15 Mo", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Note_Vocale_WhatsApp.wav", meta: "2.4 Mo • Audio", time: "22 mai 2026, 09:12", iconName: "FileAudio", color: "bg-green-100 text-green-700", type: "audio", folder: "audios", size: "2.4 Mo", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Facture_ORANGE_Mai.pdf", meta: "1.3 Mo • Document", time: "24 mai 2026, 09:15", iconName: "FileText", color: "bg-red-100 text-red-600", type: "pdf", folder: "documents", size: "1.3 Mo", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { name: "Internship_Program.xlsx", meta: "24 Mo • Document", time: "22 mai 2026, 15:30", iconName: "FileText", color: "bg-blue-100 text-blue-600", type: "document", folder: "documents", size: "24 Mo", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { name: "WhatsApp_Chat_Mamadou.zip", meta: "18.4 Mo • WhatsApp", time: "24 mai 2026, 08:00", iconName: "FileText", color: "bg-emerald-100 text-emerald-700", type: "other", folder: "whatsapp", size: "18.4 Mo", url: "#" },
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
    case 'Image': return 'bg-orange-100 text-orange-600';
    case 'Video': return 'bg-violet-100 text-violet-700';
    case 'Audio': return 'bg-green-100 text-green-700';
    case 'PDF': return 'bg-red-100 text-red-600';
    default: return 'bg-blue-100 text-blue-600';
  }
};

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "FileImage": return FileImage;
    case "Play": return Play;
    case "FileAudio": return FileAudio;
    case "Folder": return Folder;
    default: return FileText;
  }
};

const toViewerFile = (file: StoredFile | null): ViewerFile | null => {
  if (!file) return null;
  return {
    name: file.name,
    url: file.url,
    type: file.type === "document" ? "other" : file.type,
  };
};

export default function FilesExplorerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [fullscreenFile, setFullscreenFile] = useState<StoredFile | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{
    file: any;
    position: { x: number; y: number };
    open: boolean;
  }>({ file: null, position: { x: 0, y: 0 }, open: false });

  const [shareModalFile, setShareModalFile] = useState<StoredFile | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [uploadedFiles, setUploadedFiles] = useState<StoredFile[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const { handleAction, renameModal, setRenameModal, moveModal, setMoveModal, deleteConfirm, setDeleteConfirm, handleRename, handleMoveToFolder, handleConfirmDelete } = useFileActions({
    onFilesChanged: () => loadUploadedFiles(),
  });

  const loadUploadedFiles = () => {
    setUploadedFiles(storage.get<StoredFile[]>("wayacloud_uploaded_files", []));
  };

  useEffect(() => {
    loadUploadedFiles();
    window.addEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    return () => {
      window.removeEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    };
  }, []);

  const allFiles = [
    ...uploadedFiles.map((f) => ({
      ...f,
      folder: f.folder || (f.type === "image" ? "images" : f.type === "video" ? "videos" : f.type === "audio" ? "audios" : f.type === "pdf" ? "documents" : "whatsapp")
    })),
    ...staticFilesData,
  ];

  const getFolderStats = (folderName: string) => {
    const files = allFiles.filter(f => f.folder === folderName);
    const count = files.length;
    let totalSizeMb = 0;
    files.forEach(f => {
      const num = parseFloat(f.size || f.meta || "0");
      if (!isNaN(num)) totalSizeMb += num;
    });
    return { count, sizeStr: totalSizeMb > 1000 ? `${(totalSizeMb / 1024).toFixed(1)} Go` : `${totalSizeMb.toFixed(1)} Mo` };
  };

  const foldersList = [
    { id: "images", label: "Images", countText: getFolderStats("images").count, sizeText: getFolderStats("images").sizeStr, bg: "from-orange-50 to-orange-100/50", border: "border-orange-200", color: "text-orange-600" },
    { id: "videos", label: "Vidéos", countText: getFolderStats("videos").count, sizeText: getFolderStats("videos").sizeStr, bg: "from-violet-50 to-violet-100/50", border: "border-violet-200", color: "text-violet-600" },
    { id: "audios", label: "Musiques & Vocaux", countText: getFolderStats("audios").count, sizeText: getFolderStats("audios").sizeStr, bg: "from-green-50 to-green-100/50", border: "border-green-200", color: "text-green-600" },
    { id: "documents", label: "Documents", countText: getFolderStats("documents").count, sizeText: getFolderStats("documents").sizeStr, bg: "from-red-50 to-red-100/50", border: "border-red-200", color: "text-red-600" },
    { id: "whatsapp", label: "Sauvegardes WhatsApp", countText: getFolderStats("whatsapp").count, sizeText: getFolderStats("whatsapp").sizeStr, bg: "from-emerald-50 to-emerald-100/50", border: "border-emerald-200", color: "text-emerald-600" },
  ];

  const filteredFiles = allFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolder ? file.folder === currentFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleContextMenuAction = useCallback((actionId: string, file: any) => {
    if (actionId === "share") {
      setShareModalFile(file);
      setContextMenu((prev) => ({ ...prev, open: false }));
      return;
    }
    handleAction(actionId, file);
    if (actionId === "open") {
      setFullscreenFile(file);
    }
  }, [handleAction]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const importedFiles: StoredFile[] = [];

      for (const file of selectedFiles) {
        let fileUrl = "";
        let checksumSha256: string | undefined;

        try {
          checksumSha256 = await computeFileSha256(file);
        } catch { }

        try {
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

          if (!presignRes.ok) throw new Error("Erreur de préparation");

          const data = await presignRes.json() as { exists: boolean; url?: string; key: string };

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

            if (!uploadRes.ok) throw new Error("Erreur de transfert");

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
        } catch (err) {
          console.warn("Utilisation du mode démo local :", err);
          fileUrl = URL.createObjectURL(file);
        }

        const category = getFileTypeCategory(file.type, file.name);
        const folderKey =
          category === "Image" ? "images"
          : category === "Video" ? "videos"
          : category === "Audio" ? "audios"
          : "documents";

        const fileKind: FileKind =
          category === "Image" ? "image"
          : category === "Video" ? "video"
          : category === "Audio" ? "audio"
          : category === "PDF" ? "pdf"
          : "document";

        importedFiles.push({
          name: file.name,
          meta: `${(file.size / (1024 * 1024)).toFixed(1)} Mo • ${category === "PDF" ? "PDF" : category}`,
          time: "À l'instant",
          iconName: getFileTypeIconName(category),
          color: getFileTypeColor(category),
          type: fileKind,
          folder: folderKey,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
          url: fileUrl,
        });
      }

      const filesList = storage.get<StoredFile[]>("wayacloud_uploaded_files", []);
      storage.set("wayacloud_uploaded_files", [...importedFiles, ...filesList]);
      window.dispatchEvent(new Event("wayacloud_file_uploaded"));
      setSelectedFile(importedFiles[0]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (filteredFiles.length > 0 && !selectedFile) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [filteredFiles, selectedFile]);

  const handleRowContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(file);
    setContextMenu({ file, position: { x: e.clientX, y: e.clientY }, open: true });
  };

  const handleClickActions = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    setSelectedFile(file);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      file,
      position: { x: rect.left - 220, y: rect.bottom + 4 },
      open: true,
    });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[450px] w-full gap-0 overflow-hidden rounded-2xl border border-[#ECE7DF] bg-[#FBFAF8] shadow-card lg:gap-6">
      <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" disabled={isUploading} />

      <section className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECE7DF] pb-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#69708A] uppercase tracking-wider">
              <span className="cursor-pointer hover:text-primary transition" onClick={() => setCurrentFolder(null)}>
                Mon stockage
              </span>
              {currentFolder && (
                <>
                  <ChevronRight size={10} />
                  <span className="text-dark font-bold">{foldersList.find(f => f.id === currentFolder)?.label}</span>
                </>
              )}
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
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 h-12 rounded-xl border border-[#E3DFE8] bg-white px-4 text-[15px] outline-none placeholder:text-[#69708A]"
                    placeholder="Rechercher un fichier..."
                    autoFocus
                  />
                  <button onClick={() => setShowSearch(false)} className="h-12 px-4 text-[14px] font-semibold text-primary">Fermer</button>
                </div>
              </div>
            )}
            <label className="hidden sm:flex h-11 items-center gap-2.5 rounded-card border border-[#E3DFE8] bg-white px-3.5 shadow-sm max-w-[220px]">
              <Search size={16} className="text-[#516080]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708A]"
                placeholder="Rechercher..."
              />
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-btn bg-primary px-4 text-[13px] font-bold text-white shadow-sm hover:bg-primary-light transition disabled:opacity-70"
            >
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              <span className="hidden sm:inline">Importer</span>
            </button>
            <button
              onClick={() => setShowDropZone(!showDropZone)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-btn border px-4 text-[13px] font-bold transition ${
                showDropZone ? "border-primary bg-primary/5 text-primary" : "border-[#E3DFE8] bg-white text-[#4A4A4A] hover:bg-[#F5F3F0]"
              }`}
            >
              <CloudUpload size={15} />
              <span className="hidden sm:inline">Glisser-déposer</span>
            </button>
          </div>
        </header>

        {showDropZone && (
          <div className="mt-4 mb-2 shrink-0">
            <DropZone onUploadComplete={() => { setShowDropZone(false); loadUploadedFiles(); }} />
          </div>
        )}

        {!currentFolder && (
          <section className="mt-5 shrink-0">
            <h3 className="text-[11px] font-bold text-[#69708A] uppercase tracking-wider mb-3">Dossiers par type</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {foldersList.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`flex flex-col justify-between p-4 rounded-2xl border ${folder.border} bg-gradient-to-br ${folder.bg} shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-[120px]`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${folder.color}`}>
                    <Folder size={22} fill="currentColor" className="opacity-30" />
                  </span>
                  <div className="mt-3">
                    <h4 className="text-[13px] font-bold text-dark truncate">{folder.label}</h4>
                    <p className="mt-0.5 text-[11px] text-[#69708A] font-semibold">
                      {folder.countText} fichiers · {folder.sizeText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentFolder && (
          <button
            onClick={() => setCurrentFolder(null)}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:text-primary-light transition w-fit shrink-0"
          >
            <ArrowLeft size={15} /> Retour
          </button>
        )}

        <section className="mt-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-[11px] font-bold text-[#69708A] uppercase tracking-wider">
              {currentFolder ? "Fichiers" : "Tous les fichiers"}
            </h3>
            <span className="text-[11px] text-[#69708A] font-semibold">{filteredFiles.length} fichiers</span>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
            {loading ? (
              <div className="p-6">
                <SkeletonFileGrid />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Folder size={40} className="text-[#C8C0B5]" />
                <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucun fichier trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Glissez ou importez un nouveau fichier.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF] text-[11px] font-bold text-[#69708A] uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-5">Nom</th>
                    <th className="py-3 px-4 sm:px-5 hidden sm:table-cell">Type</th>
                    <th className="py-3 px-4 sm:px-5">Taille</th>
                    <th className="py-3 px-4 sm:px-5 hidden md:table-cell">Modifié</th>
                    <th className="py-3 px-4 sm:px-5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EDE6] text-sm">
                  {filteredFiles.map((file, idx) => {
                    const IconComp = getIconComponent(file.iconName || (file.type === 'image' ? 'FileImage' : file.type === 'video' ? 'Play' : file.type === 'audio' ? 'FileAudio' : 'FileText'));
                    const isSelected = selectedFile?.name === file.name;
                    return (
                      <tr
                        key={`${file.name}-${idx}`}
                        onClick={() => setSelectedFile(file)}
                        onContextMenu={(e) => handleRowContextMenu(e, file)}
                        className={`group hover:bg-[#FDFCFB] cursor-pointer transition ${isSelected ? "bg-primary/[0.04] hover:bg-primary/[0.06]" : ""}`}
                      >
                        <td className="py-3 px-4 sm:px-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${file.color || "bg-blue-100 text-blue-600"}`}>
                              <IconComp size={16} />
                            </span>
                            <span className="truncate text-[13px] font-semibold text-dark max-w-[120px] sm:max-w-[200px] md:max-w-[280px]">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-[11px] text-[#596077] font-semibold uppercase hidden sm:table-cell">
                          {file.type}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-[13px] text-[#596077] font-medium">
                          {file.size || file.meta?.split(" • ")[0]}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-[12px] text-[#69708A] hidden md:table-cell">
                          {file.time}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-center">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setFullscreenFile(file); }}
                              className="flex h-9 w-9 items-center justify-center text-[#69708A] hover:bg-[#F3EFE9] hover:text-primary rounded-lg transition"
                              aria-label="Ouvrir"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => handleClickActions(e, file)}
                              className="flex h-9 w-9 items-center justify-center text-[#69708A] hover:bg-[#F3EFE9] hover:text-dark rounded-lg transition"
                              aria-label="Plus d'actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </section>

      {selectedFile && (
        <aside className="w-[320px] shrink-0 border-l border-[#ECE7DF] bg-white flex-col hidden xl:flex">
          <header className="flex items-center justify-between border-b border-[#ECE7DF] px-5 py-3.5 bg-[#FBF8FF]">
            <h3 className="text-[14px] font-bold text-dark">Aperçu</h3>
            <button onClick={() => setSelectedFile(null)} className="p-1 text-[#69708A] hover:bg-black/5 hover:text-red-500 rounded-full transition">
              <X size={17} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="w-full aspect-[4/3] rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] flex items-center justify-center p-3 relative overflow-hidden shadow-sm">
              {selectedFile.type === "image" ? (
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full h-full object-contain" />
              ) : selectedFile.type === "video" ? (
                <video src={selectedFile.url} controls className="w-full h-full rounded-md" />
              ) : selectedFile.type === "audio" ? (
                <div className="w-full text-center space-y-3">
                  <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-100 text-green-700">
                    <FileAudio size={24} />
                  </span>
                  <audio src={selectedFile.url} controls className="w-full max-w-[180px] mx-auto" />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                    <FileText size={28} />
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#EAE3D5] text-[11px] font-extrabold text-[#595246] uppercase">
                    {selectedFile.name.split(".").pop()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[14px] font-bold text-dark break-all leading-5">{selectedFile.name}</h4>
              <p className="mt-0.5 text-[11px] font-semibold text-[#69708A] uppercase">{selectedFile.type}</p>
            </div>

            <div className="rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] p-3.5">
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#69708A] font-semibold">Type</span>
                  <span className="font-bold text-dark capitalize">{selectedFile.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#69708A] font-semibold">Taille</span>
                  <span className="font-bold text-dark">{selectedFile.size || selectedFile.meta?.split(" • ")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#69708A] font-semibold">Modifié</span>
                  <span className="font-bold text-dark text-right max-w-[140px] truncate">{selectedFile.time}</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-[#ECE7DF] p-4 bg-[#FBF8FF] space-y-2.5 shrink-0">
            <button
              onClick={() => setFullscreenFile(selectedFile)}
              className="w-full flex items-center justify-center gap-2 rounded-btn bg-primary py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-primary-light transition"
            >
              <Eye size={15} /> Ouvrir
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={selectedFile.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-[13px] font-bold text-dark hover:bg-slate-50 transition"
              >
                <Download size={14} /> Télécharger
              </a>
              <button
                onClick={() => setShareModalFile(selectedFile)}
                className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-[13px] font-bold text-dark hover:bg-slate-50 transition"
              >
                <Share2 size={14} /> Partager
              </button>
            </div>
          </footer>
        </aside>
      )}

      <FileContextMenu
        file={contextMenu.file}
        isOpen={contextMenu.open}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, open: false }))}
        onAction={handleContextMenuAction}
      />

      <ShareModal
        isOpen={!!shareModalFile}
        onClose={() => setShareModalFile(null)}
        file={shareModalFile}
      />

      <RenameModal
        isOpen={renameModal.open}
        onClose={() => setRenameModal({ file: null as any, open: false })}
        fileName={renameModal.file?.name || ""}
        onRename={handleRename}
      />

      <MoveModal
        isOpen={moveModal.open}
        onClose={() => setMoveModal({ file: null as any, open: false })}
        folders={getFolderList()}
        onMove={handleMoveToFolder}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ file: null as any, open: false })}
        fileName={deleteConfirm.file?.name || ""}
        onConfirm={handleConfirmDelete}
      />

      <FileViewerModal
        isOpen={!!fullscreenFile}
        onClose={() => setFullscreenFile(null)}
        file={toViewerFile(fullscreenFile)}
      />
    </div>
  );
}
