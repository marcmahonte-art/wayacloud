"use client";

import { Loader2, Plus, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { computeFileSha256 } from "@/lib/upload/fileHash";
import { useStorageStore } from "@/lib/store/storage-store";

interface PresignResponse {
  exists?: boolean;
  url?: string;
  key: string;
  fileId?: string;
  name?: string;
}

async function uploadSingleFile(file: File): Promise<void> {
  let checksumSha256: string | undefined;
  try {
    checksumSha256 = await computeFileSha256(file);
  } catch { }
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
  if (!presignRes.ok) throw new Error("Impossible de préparer l'upload.");
  const data = (await presignRes.json()) as PresignResponse;
  if (data.exists) {
    await fetch("/api/upload/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
    });
    return;
  }
  const uploadRes = await fetch(data.url!, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadRes.ok) throw new Error(`Erreur lors de l'envoi vers le stockage (HTTP ${uploadRes.status}).`);
  await fetch("/api/upload/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
  });
}

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshAll = useStorageStore((s) => s.refreshAll);


  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadCount(selectedFiles.length);
    setError(null);
    try {
      for (const file of selectedFiles) {
        await uploadSingleFile(file);
      }
      refreshAll();
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      setUploadCount(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" disabled={isUploading} />
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-btn bg-primary px-4 text-sm font-bold text-white shadow-card transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70 sm:px-5"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {isUploading ? `Envoi ${uploadCount}` : "Importer"}
        </button>
        {error && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <XCircle size={14} /> {error}
          </span>
        )}
      </div>
    </>
  );
}
