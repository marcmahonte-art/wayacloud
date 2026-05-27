"use client";

import { useState, useRef, useCallback } from "react";
import { CloudUpload, File, Loader2, X } from "lucide-react";
import { computeFileSha256 } from "@/lib/upload/fileHash";

interface DropZoneProps {
  onUploadComplete?: () => void;
}

export function DropZone({ onUploadComplete }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<{ name: string; progress: number; status: "pending" | "uploading" | "done" | "error" }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const entry = { name: file.name, progress: 0, status: "uploading" as const };
    setQueue((q) => [...q, entry]);

    try {
      let checksumSha256: string | undefined;
      try { checksumSha256 = await computeFileSha256(file); } catch {}

      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size, checksumSha256 }),
      });

      if (!presignRes.ok) throw new Error("Presign failed");
      const data = await presignRes.json() as { exists: boolean; url?: string; key: string };

      if (!data.exists && data.url) {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setQueue((q) => q.map((e) => e.name === file.name ? { ...e, progress: pct } : e));
          }
        };
        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => resolve();
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("PUT", data.url!);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.send(file);
        });
      }

      await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
      });

      setQueue((q) => q.map((e) => e.name === file.name ? { ...e, status: "done", progress: 100 } : e));
    } catch {
      setQueue((q) => q.map((e) => e.name === file.name ? { ...e, status: "error" } : e));
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploading(true);
    for (const file of files) {
      await uploadFile(file);
    }
    setUploading(false);
    onUploadComplete?.();
  }, [onUploadComplete]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      await uploadFile(file);
    }
    setUploading(false);
    onUploadComplete?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
        dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-[#E3DFE8] bg-white hover:border-primary/40"
      }`}
    >
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleInput} />

      {uploading ? (
        <div className="space-y-3">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-dark">Upload en cours...</p>
          <div className="mx-auto max-w-xs space-y-2">
            {queue.slice(-3).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <File size={14} className="shrink-0 text-[#69708A]" />
                <span className="truncate flex-1 text-left text-[#4A4A4A]">{item.name}</span>
                {item.status === "done" ? (
                  <span className="text-green-600 font-semibold">OK</span>
                ) : item.status === "error" ? (
                  <X size={14} className="text-red-500" />
                ) : (
                  <span className="text-primary font-semibold">{item.progress}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CloudUpload size={32} className="text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-dark">
              {dragOver ? "Déposez vos fichiers ici" : "Glissez-déposez vos fichiers"}
            </p>
            <p className="mt-1 text-sm text-[#69708A]">ou cliquez pour parcourir</p>
          </div>
          <p className="text-xs text-[#9CA3AF]">Taille max : 2 Go par fichier</p>
        </div>
      )}
    </div>
  );
}
