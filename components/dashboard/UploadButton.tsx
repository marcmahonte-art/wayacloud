"use client";

import { Loader2, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { computeFileSha256 } from "@/lib/upload/fileHash";
import { storage } from "@/lib/storage";

interface UploadedFile {
  name: string;
  meta: string;
  time: string;
  iconName: string;
  color: string;
  type: string;
  url: string;
}

interface PresignResponse {
  exists?: boolean;
  url?: string;
  key: string;
  fileId?: string;
  name?: string;
}

const getFileTypeCategory = (mimeType: string, fileName: string): string => {
  const mime = (mimeType || "").toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Image";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "Video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "Audio";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  return "Document";
};

const getFileTypeIconName = (category: string): string => {
  switch (category) {
    case "Image": return "FileImage";
    case "Video": return "Play";
    case "Audio": return "FileAudio";
    case "PDF": return "FileText";
    default: return "FileText";
  }
};

const getFileTypeColor = (category: string): string => {
  switch (category) {
    case "Image": return "bg-orange-100 text-primary";
    case "Video": return "bg-violet-100 text-violet-700";
    case "Audio": return "bg-green-100 text-green-700";
    case "PDF": return "bg-red-100 text-red-600";
    default: return "bg-blue-100 text-blue-600";
  }
};

function readStoredFiles(): UploadedFile[] {
  return storage.get<UploadedFile[]>("wayacloud_uploaded_files", []);
}

function buildFileRecord(file: File, url: string): UploadedFile {
  const category = getFileTypeCategory(file.type, file.name);
  return {
    name: file.name,
    meta: `${(file.size / (1024 * 1024)).toFixed(1)} Mo • ${category === "PDF" ? "PDF" : `${category}s`}`,
    time: "À l'instant",
    iconName: getFileTypeIconName(category),
    color: getFileTypeColor(category),
    type: category.toLowerCase(),
    url,
  };
}

async function uploadSingleFile(file: File): Promise<UploadedFile> {
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

    if (!presignRes.ok) {
      throw new Error("Impossible de préparer l'upload.");
    }

    const data = (await presignRes.json()) as PresignResponse;

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
      return buildFileRecord(file, confirmData?.url || "");
    }

    const uploadRes = await fetch(data.url!, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Erreur lors de l'envoi vers le stockage.");
    }

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
    return buildFileRecord(file, confirmData?.url || data.url!.split("?")[0]);
  } catch (error: unknown) {
    console.warn("Mode démo local activé pour l'import :", error);
    return buildFileRecord(file, URL.createObjectURL(file));
  }
}

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadCount(selectedFiles.length);

    try {
      const importedFiles: UploadedFile[] = [];
      for (const file of selectedFiles) {
        importedFiles.push(await uploadSingleFile(file));
      }

      const filesList = readStoredFiles();
      storage.set("wayacloud_uploaded_files", [...importedFiles, ...filesList]);
      window.dispatchEvent(new Event("wayacloud_file_uploaded"));
    } finally {
      setIsUploading(false);
      setUploadCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-btn bg-primary px-4 text-sm font-bold text-white shadow-card transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70 sm:px-5"
      >
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {isUploading ? `Envoi ${uploadCount}` : "Importer"}
      </button>
    </>
  );
}
