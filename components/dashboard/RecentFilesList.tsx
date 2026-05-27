"use client";

import { useState, useEffect } from "react";
import { FileImage, FileText, Play, Folder, FileAudio, MoreVertical } from "lucide-react";
import { FileViewerModal } from "../ui/FileViewerModal";
import { storage } from "@/lib/storage";

const recentFilesData = [
  { name: "Vacances Bobo 2026.jpg", meta: "4.2 Mo • Images", time: "Aujourd'hui, 10:30", icon: FileImage, color: "bg-orange-100 text-primary", type: "image", url: "https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=2000&auto=format&fit=crop" },
  { name: "Facture_ORANGE_Mai.pdf", meta: "1.3 Mo • Documents", time: "Aujourd'hui, 09:15", icon: FileText, color: "bg-red-100 text-red-600", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { name: "Podcast_Audio.mp3", meta: "15 Mo • Audio", time: "Hier, 18:45", icon: FileAudio, color: "bg-green-100 text-green-700", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Mariage_Adama.mp4", meta: "128 Mo • Vidéos", time: "Hier, 16:20", icon: Play, color: "bg-violet-100 text-violet-700", type: "video", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { name: "Photos Famille", meta: "Dossier", time: "12 mai 2026", icon: Folder, color: "bg-amber-100 text-amber-600", type: "other", url: "#" },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "FileImage": return FileImage;
    case "Play": return Play;
    case "FileAudio": return FileAudio;
    case "Folder": return Folder;
    default: return FileText;
  }
};

export function RecentFilesList() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const loadUploadedFiles = () => {
    const files = storage.get<unknown>("wayacloud_uploaded_files", []);
    setUploadedFiles(Array.isArray(files) ? files : []);
  };

  useEffect(() => {
    loadUploadedFiles();
    window.addEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    return () => {
      window.removeEventListener("wayacloud_file_uploaded", loadUploadedFiles);
    };
  }, []);

  const allFiles = [
    ...uploadedFiles.filter(Boolean).map((f) => ({
      ...f,
      icon: getIconComponent(typeof f.iconName === "string" ? f.iconName : ""),
    })),
    ...recentFilesData,
  ];

  return (
    <>
      <article className="min-w-0 rounded-card border border-[#ECE7DF] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Fichiers récents</h2>
          <button className="text-xs font-medium text-[#69708A]">Voir tout</button>
        </div>
        <div className="mt-4 divide-y divide-[#EFEAE2]">
          {allFiles.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`} 
              onClick={() => file.type !== "other" && setSelectedFile(file)}
              className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[42px_minmax(0,1fr)_auto] cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-btn ${file.color}`}>
                <file.icon size={20} />
              </span>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="truncate text-sm font-bold text-dark">{file.name}</p>
                <p className="mt-1 text-xs text-[#69708A]">{file.meta}</p>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:gap-2">
                <button onClick={(e) => { e.stopPropagation(); }} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                  <MoreVertical size={16} className="text-[#69708A]" />
                </button>
                <p className="whitespace-nowrap text-xs text-[#596077]">{file.time}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <FileViewerModal 
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        file={selectedFile}
      />
    </>
  );
}
