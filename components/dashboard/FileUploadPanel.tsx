"use client";

import { AlertCircle, CheckCircle2, CloudUpload } from "lucide-react";
import { useRef, useState } from "react";
import { uploadWithTus } from "@/lib/upload/tusClient";

interface PresignResponse {
  url: string;
  key: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

function putFileWithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error("Upload refusé par le stockage."));
    };
    request.onerror = () => reject(new Error("Connexion interrompue pendant l'upload."));
    request.send(file);
  });
}

export function FileUploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");

  async function uploadFile() {
    if (!file) {
      setStatus("error");
      setMessage("Sélectionnez un fichier avant de lancer l'upload.");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setMessage("Upload en cours...");

    try {
      const tusEndpoint = process.env.NEXT_PUBLIC_TUS_ENDPOINT;

      if (tusEndpoint) {
        await uploadWithTus({
          endpoint: tusEndpoint,
          file,
          metadata: {
            filename: file.name,
            filetype: file.type,
          },
          onProgress: setProgress,
        });
      } else {
        const presignResponse = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignResponse.ok) {
          throw new Error("Impossible de préparer l'upload.");
        }

        const presign = (await presignResponse.json()) as PresignResponse;
        await putFileWithProgress(presign.url, file, setProgress);
        await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: presign.key, size: file.size }),
        });
      }

      setStatus("success");
      setMessage("Fichier envoyé avec succès.");
    } catch {
      setStatus("error");
      setMessage("L'upload a échoué. Vérifiez la connexion ou le type de fichier.");
    }
  }

  return (
    <section className="rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Upload sécurisé</p>
          <h2 className="mt-1 text-xl font-bold text-dark">Ajouter un fichier</h2>
          <p className="mt-2 text-sm leading-6 text-gray">
            Les fichiers sont validés avant l’envoi vers le stockage WayaCloud.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-btn border border-border px-4 text-sm font-semibold text-dark hover:border-primary"
        >
          <CloudUpload size={18} />
          Choisir
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          setFile(selectedFile);
          setStatus("idle");
          setProgress(0);
          setMessage(selectedFile ? selectedFile.name : "");
        }}
      />

      <div className="mt-6 rounded-card border border-dashed border-border bg-background p-5">
        <p className="text-sm font-medium text-dark">
          {file ? file.name : "Aucun fichier sélectionné"}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-white">
          <div
            className="h-full rounded-pill bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm text-gray">
            {status === "success" ? <CheckCircle2 size={16} /> : null}
            {status === "error" ? <AlertCircle size={16} /> : null}
            {message || "Prêt pour l'upload"}
          </p>
          <button
            type="button"
            disabled={status === "uploading"}
            onClick={uploadFile}
            className="h-11 rounded-btn bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "uploading" ? `${progress}%` : "Envoyer"}
          </button>
        </div>
      </div>
    </section>
  );
}
