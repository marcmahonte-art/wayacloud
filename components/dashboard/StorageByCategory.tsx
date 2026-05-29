"use client";

import { useMemo } from "react";
import { useStorageStore } from "@/lib/store/storage-store";
import { FileImage, Play, FileAudio, FileText } from "lucide-react";

interface CategoryStat {
  id: string;
  label: string;
  icon: typeof FileImage;
  color: string;
  bg: string;
  count: number;
  bytes: number;
}

const CATEGORIES: { id: string; label: string; icon: typeof FileImage; color: string; bg: string; test: (mime: string, ext: string) => boolean }[] = [
  { id: "image", label: "Images", icon: FileImage, color: "text-orange-600", bg: "bg-orange-100", test: (m, e) => m.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e) },
  { id: "video", label: "Vidéos", icon: Play, color: "text-violet-600", bg: "bg-violet-100", test: (m, e) => m.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi"].includes(e) },
  { id: "audio", label: "Audio", icon: FileAudio, color: "text-green-600", bg: "bg-green-100", test: (m, e) => m.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(e) },
  { id: "pdf", label: "Documents", icon: FileText, color: "text-red-600", bg: "bg-red-100", test: (m, e) => m === "application/pdf" || e === "pdf" },
  { id: "other", label: "Autres", icon: FileText, color: "text-blue-600", bg: "bg-blue-100", test: () => true },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function StorageByCategory() {
  const files = useStorageStore((s) => s.files);

  const stats: CategoryStat[] = useMemo(() => {
    return CATEGORIES.map((cat) => {
      let count = 0;
      let bytes = 0;
      for (const f of files) {
        if (f.is_trashed || f.status === "deleted") continue;
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        if (cat.test(f.mime_type || "", ext)) {
          count++;
          bytes += Number(f.size_bytes || 0);
        }
      }
      return { ...cat, count, bytes };
    });
  }, [files]);

  return (
    <div className="space-y-3">
      {stats.map((cat) => (
        <div key={cat.id} className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cat.bg} ${cat.color}`}>
            <cat.icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-dark">{cat.label}</p>
            <p className="text-xs text-[#69708A]">{cat.count} fichier{cat.count > 1 ? "s" : ""}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-dark">{formatBytes(cat.bytes)}</span>
        </div>
      ))}
    </div>
  );
}
