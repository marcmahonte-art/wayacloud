"use client";

import { useRef, useState, useEffect } from "react";
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
} from "lucide-react";
import { FileViewerModal } from "@/components/ui/FileViewerModal";

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
  { name: "Vacances Bobo 2026.jpg", meta: "4.2 Mo â€¢ Image", time: "24 mai 2026, 10:30", iconName: "FileImage", color: "bg-orange-100 text-orange-600", type: "image", folder: "images", size: "4.2 Mo", url: "https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=2000&auto=format&fit=crop" },
  { name: "Logo_WayaCloud_HD.png", meta: "1.8 Mo â€¢ Image", time: "23 mai 2026, 14:15", iconName: "FileImage", color: "bg-orange-100 text-orange-600", type: "image", folder: "images", size: "1.8 Mo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
  { name: "Mariage_Adama.mp4", meta: "128 Mo â€¢ VidÃ©o", time: "23 mai 2026, 16:20", iconName: "Play", color: "bg-violet-100 text-violet-700", type: "video", folder: "videos", size: "128 Mo", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { name: "Tuto_WayaCloud_Intro.mp4", meta: "45 Mo â€¢ VidÃ©o", time: "22 mai 2026, 11:05", iconName: "Play", color: "bg-violet-100 text-violet-700", type: "video", folder: "videos", size: "45 Mo", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
  { name: "Podcast_Audio.mp3", meta: "15 Mo â€¢ Audio", time: "23 mai 2026, 18:45", iconName: "FileAudio", color: "bg-green-100 text-green-700", type: "audio", folder: "audios", size: "15 Mo", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Note_Vocale_WhatsApp.wav", meta: "2.4 Mo â€¢ Audio", time: "22 mai 2026, 09:12", iconName: "FileAudio", color: "bg-green-100 text-green-700", type: "audio", folder: "audios", size: "2.4 Mo", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Facture_ORANGE_Mai.pdf", meta: "1.3 Mo â€¢ Document", time: "24 mai 2026, 09:15", iconName: "FileText", color: "bg-red-100 text-red-600", type: "pdf", folder: "documents", size: "1.3 Mo", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { name: "Internship_Program.xlsx", meta: "24 Mo â€¢ Document", time: "22 mai 2026, 15:30", iconName: "FileText", color: "bg-blue-100 text-blue-600", type: "document", folder: "documents", size: "24 Mo", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { name: "WhatsApp_Chat_Mamadou.zip", meta: "18.4 Mo â€¢ WhatsApp", time: "24 mai 2026, 08:00", iconName: "FileText", color: "bg-emerald-100 text-emerald-700", type: "other", folder: "whatsapp", size: "18.4 Mo", url: "#" },
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
  
  // Folder navigation state: null = root explorer showing folders, non-null = inside a folder
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [fullscreenFile, setFullscreenFile] = useState<StoredFile | null>(null);
  
  const [uploadedFiles, setUploadedFiles] = useState<StoredFile[]>([]);

  const loadUploadedFiles = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wayacloud_uploaded_files");
      if (stored) {
        try {
          setUploadedFiles(JSON.parse(stored) as StoredFile[]);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadUploadedFiles();
    window.addEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    return () => {
      window.removeEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    };
  }, []);

  // Merge static and uploaded files
  const allFiles = [
    ...uploadedFiles.map((f) => ({
      ...f,
      folder: f.folder || (f.type === "image" ? "images" : f.type === "video" ? "videos" : f.type === "audio" ? "audios" : f.type === "pdf" ? "documents" : "whatsapp")
    })),
    ...staticFilesData,
  ];

  // Helper to count files in folders
  const getFolderStats = (folderName: string) => {
    const files = allFiles.filter(f => f.folder === folderName);
    const count = files.length;
    // Calculate total size roughly
    let totalSizeMb = 0;
    files.forEach(f => {
      const num = parseFloat(f.size || f.meta || "0");
      if (!isNaN(num)) totalSizeMb += num;
    });
    return { count, sizeStr: totalSizeMb > 1000 ? `${(totalSizeMb / 1024).toFixed(1)} Go` : `${totalSizeMb.toFixed(1)} Mo` };
  };

  const foldersList = [
    { id: "images", label: "Images", countText: getFolderStats("images").count, sizeText: getFolderStats("images").sizeStr, bg: "from-orange-50 to-orange-100/50", border: "border-orange-200", color: "text-orange-600" },
    { id: "videos", label: "VidÃ©os", countText: getFolderStats("videos").count, sizeText: getFolderStats("videos").sizeStr, bg: "from-violet-50 to-violet-100/50", border: "border-violet-200", color: "text-violet-600" },
    { id: "audios", label: "Musiques & Vocaux", countText: getFolderStats("audios").count, sizeText: getFolderStats("audios").sizeStr, bg: "from-green-50 to-green-100/50", border: "border-green-200", color: "text-green-600" },
    { id: "documents", label: "Documents", countText: getFolderStats("documents").count, sizeText: getFolderStats("documents").sizeStr, bg: "from-red-50 to-red-100/50", border: "border-red-200", color: "text-red-600" },
    { id: "whatsapp", label: "Sauvegardes WhatsApp", countText: getFolderStats("whatsapp").count, sizeText: getFolderStats("whatsapp").sizeStr, bg: "from-emerald-50 to-emerald-100/50", border: "border-emerald-200", color: "text-emerald-600" },
  ];

  // Filtering files
  const filteredFiles = allFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = currentFolder ? file.folder === currentFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const importedFiles: StoredFile[] = [];

      for (const file of selectedFiles) {
        let fileUrl = "";

        try {
          const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              fileSize: file.size,
            }),
          });

          if (!presignRes.ok) {
            throw new Error("Erreur de préparation");
          }

          const { url, key } = (await presignRes.json()) as { url: string; key: string };
          const uploadRes = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error("Erreur de transfert");
          }

          await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ key, size: file.size }),
          });

          fileUrl = url.split("?")[0];
        } catch (err) {
          console.warn("Utilisation du mode démo local :", err);
          fileUrl = URL.createObjectURL(file);
        }

        const category = getFileTypeCategory(file.type, file.name);
        const folderKey =
          category === "Image"
            ? "images"
            : category === "Video"
              ? "videos"
              : category === "Audio"
                ? "audios"
                : "documents";

        const fileKind: FileKind =
          category === "Image"
            ? "image"
            : category === "Video"
              ? "video"
              : category === "Audio"
                ? "audio"
                : category === "PDF"
                  ? "pdf"
                  : "document";

        importedFiles.push({
          name: file.name,
          meta: `${(file.size / (1024 * 1024)).toFixed(1)} Mo • ${
            category === "PDF" ? "PDF" : category
          }`,
          time: "À l'instant",
          iconName: getFileTypeIconName(category),
          color: getFileTypeColor(category),
          type: fileKind,
          folder: folderKey,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
          url: fileUrl,
        });
      }

      const existing = localStorage.getItem("wayacloud_uploaded_files");
      const filesList = existing ? (JSON.parse(existing) as StoredFile[]) : [];
      localStorage.setItem(
        "wayacloud_uploaded_files",
        JSON.stringify([...importedFiles, ...filesList]),
      );

      window.dispatchEvent(new Event("wayacloud_file_uploaded"));
      setSelectedFile(importedFiles[0]);
      alert(
        selectedFiles.length > 1
          ? `${selectedFiles.length} fichiers importés avec succès !`
          : "Fichier importé avec succès !",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Select first file if none is selected
  useEffect(() => {
    if (filteredFiles.length > 0 && !selectedFile) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [filteredFiles, selectedFile]);

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] w-full gap-6 overflow-hidden rounded-2xl border border-[#ECE7DF] bg-[#FBFAF8] shadow-card">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />

      {/* Main Files Area */}
      <section className="flex flex-1 flex-col overflow-y-auto p-6 min-w-0">
        
        {/* Path Breadcrumb and Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECE7DF] pb-5 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
              <span className="cursor-pointer hover:text-primary transition" onClick={() => setCurrentFolder(null)}>
                Mon stockage
              </span>
              {currentFolder && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-dark font-bold">
                    {foldersList.find(f => f.id === currentFolder)?.label}
                  </span>
                </>
              )}
            </div>
            <h2 className="mt-2 text-2xl font-bold text-dark">
              {currentFolder ? foldersList.find(f => f.id === currentFolder)?.label : "Mon stockage WayaCloud"}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex h-11 items-center gap-3 rounded-card border border-[#E3DFE8] bg-white px-4 shadow-card max-w-[280px]">
              <Search size={17} className="text-[#516080]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#69708A]"
                placeholder="Rechercher..."
              />
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-btn bg-primary px-5 text-sm font-bold text-white shadow-card hover:bg-primary-light transition disabled:opacity-70"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Importer
            </button>
          </div>
        </header>

        {/* Root Level: Folders Grid */}
        {!currentFolder && (
          <section className="mt-6 shrink-0">
            <h3 className="text-sm font-bold text-[#69708A] uppercase tracking-wider mb-4">Dossiers par type</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {foldersList.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`flex flex-col justify-between p-5 rounded-2xl border ${folder.border} bg-gradient-to-br ${folder.bg} shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer min-h-[140px]`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ${folder.color}`}>
                    <Folder size={24} fill="currentColor" className="opacity-30" />
                  </span>
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-dark truncate">{folder.label}</h4>
                    <p className="mt-1 text-xs text-[#69708A] font-semibold">
                      {folder.countText} fichiers Â· {folder.sizeText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back navigation button if inside folder */}
        {currentFolder && (
          <button
            onClick={() => setCurrentFolder(null)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-light transition w-fit shrink-0"
          >
            <ArrowLeft size={16} /> Retour Ã  mon stockage
          </button>
        )}

        {/* Files Listing Panel */}
        <section className="mt-6 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-bold text-[#69708A] uppercase tracking-wider">
              {currentFolder ? "Fichiers dans ce dossier" : "Tous les fichiers rÃ©cents"}
            </h3>
            <span className="text-xs text-[#69708A] font-semibold">
              {filteredFiles.length} fichiers trouvÃ©s
            </span>
          </div>

          {/* Files List Table */}
          <div className="flex-1 overflow-auto rounded-xl border border-[#ECE7DF] bg-white shadow-card">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Folder size={48} className="text-[#C8C0B5] animate-pulse" />
                <p className="mt-4 text-sm font-semibold text-slate-500">Aucun fichier trouvÃ©</p>
                <p className="text-xs text-slate-400 mt-1">Glissez ou importez un nouveau fichier pour commencer.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE7DF] bg-[#FBF8FF] text-xs font-bold text-[#69708A] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Nom</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Taille</th>
                    <th className="py-3.5 px-5 hidden md:table-cell">ModifiÃ© le</th>
                    <th className="py-3.5 px-5 w-10 text-center"></th>
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
                        className={`hover:bg-[#FDFCFB] cursor-pointer transition ${isSelected ? "bg-primary/5 hover:bg-primary/10" : ""}`}
                      >
                        <td className="py-3.5 px-5 font-bold text-dark flex items-center gap-3 min-w-0">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${file.color || "bg-blue-100 text-blue-600"}`}>
                            <IconComp size={18} />
                          </span>
                          <span className="truncate max-w-[200px] sm:max-w-[320px]">{file.name}</span>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[#596077] font-semibold uppercase">
                          {file.type}
                        </td>
                        <td className="py-3.5 px-5 text-[#596077] font-medium">
                          {file.size || file.meta.split(" â€¢ ")[0]}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[#69708A] hidden md:table-cell">
                          {file.time}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenFile(file);
                            }}
                            className="p-1.5 text-[#69708A] hover:bg-[#F3EFE9] hover:text-primary rounded-md transition"
                            title="Ouvrir en plein Ã©cran"
                          >
                            <Eye size={16} />
                          </button>
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

      {/* Right side file preview sidebar panel (Matches reference image perfectly) */}
      {selectedFile && (
        <aside className="w-[340px] shrink-0 border-l border-[#ECE7DF] bg-white flex flex-col hidden xl:flex">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#ECE7DF] px-6 py-4.5 bg-[#FBF8FF]">
            <h3 className="text-base font-bold text-dark">AperÃ§u du fichier</h3>
            <button 
              onClick={() => setSelectedFile(null)} 
              className="p-1 text-[#69708A] hover:bg-black/5 hover:text-red-500 rounded-full transition"
            >
              <X size={18} />
            </button>
          </header>

          {/* Preview Box */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="w-full aspect-[4/3] rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-sm">
              {selectedFile.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name} 
                  className="w-full h-full object-contain"
                />
              ) : selectedFile.type === "video" ? (
                <video 
                  src={selectedFile.url} 
                  controls 
                  className="w-full h-full rounded-md"
                />
              ) : selectedFile.type === "audio" ? (
                <div className="w-full text-center space-y-3">
                  <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-green-100 text-green-700">
                    <FileAudio size={28} />
                  </span>
                  <audio src={selectedFile.url} controls className="w-full max-w-[200px] mx-auto scale-90" />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                    <FileText size={32} />
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded bg-[#EAE3D5] text-xs font-extrabold text-[#595246] uppercase">
                    {selectedFile.name.split(".").pop()}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <h4 className="text-base font-bold text-dark break-all leading-5">{selectedFile.name}</h4>
              <p className="mt-1 text-xs font-semibold text-[#69708A] uppercase">{selectedFile.type}</p>
            </div>

            {/* Description Card */}
            <div className="rounded-xl border border-[#ECE7DF] bg-[#FBFAF8] p-4">
              <h5 className="text-xs font-bold text-[#69708A] uppercase tracking-wider">Description</h5>
              <p className="mt-2 text-sm leading-5 text-[#596077]">
                Fichier importÃ© et conservÃ© de maniÃ¨re totalement sÃ©curisÃ©e sur votre espace cloud WayaCloud.
              </p>
            </div>

            {/* Properties */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[#69708A] uppercase tracking-wider">PropriÃ©tÃ©s</h5>
              <div className="divide-y divide-[#ECE7DF] text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-[#69708A] font-semibold">Type</span>
                  <span className="font-bold text-dark capitalize">{selectedFile.type}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#69708A] font-semibold">Taille</span>
                  <span className="font-bold text-dark">{selectedFile.size || selectedFile.meta.split(" â€¢ ")[0]}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#69708A] font-semibold">DerniÃ¨re modif</span>
                  <span className="font-bold text-dark text-right max-w-[160px] truncate">{selectedFile.time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <footer className="border-t border-[#ECE7DF] p-5 bg-[#FBF8FF] space-y-3.5 shrink-0">
            <button
              onClick={() => setFullscreenFile(selectedFile)}
              className="w-full flex items-center justify-center gap-2 rounded-btn bg-primary py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-light transition"
            >
              <Eye size={16} /> Ouvrir en plein Ã©cran
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={selectedFile.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-sm font-bold text-dark hover:bg-slate-50 transition"
              >
                <Download size={15} /> TÃ©lÃ©charger
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedFile.url || "https://wayacloud.bf/share/demo");
                  alert("Lien de partage copiÃ© !");
                }}
                className="flex items-center justify-center gap-2 rounded-btn border border-[#ECE7DF] bg-white py-2 text-sm font-bold text-dark hover:bg-slate-50 transition"
              >
                <Share2 size={15} /> Partager
              </button>
            </div>
          </footer>
        </aside>
      )}

      {/* Universal Fullscreen File Viewer */}
      <FileViewerModal
        isOpen={!!fullscreenFile}
        onClose={() => setFullscreenFile(null)}
        file={toViewerFile(fullscreenFile)}
      />
    </div>
  );
}
