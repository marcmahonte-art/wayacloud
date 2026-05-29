"use client";

import { useState, useRef } from "react";
import { Check, Loader2 } from "lucide-react";


const WhatsAppIcon = ({ size = 42, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export function WhatsAppBackupCard() {
  const [isUploading, setIsUploading] = useState(false);
  const [lastBackup, setLastBackup] = useState("Il y a 3 minutes");
  const [status, setStatus] = useState("À jour");
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus("En cours...");
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/zip",
          fileSize: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error("Erreur lors de la préparation de la sauvegarde");
      const { url, key } = await presignRes.json();
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/zip" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Échec du transfert vers Wasabi");
      await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, size: file.size, name: file.name, mimeType: file.type || "application/zip" }),
      });
      setLastBackup("À l'instant");
      setStatus("À jour");
    } catch (error: any) {
      console.warn("Erreur de sauvegarde :", error);
      setStatus("Erreur");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <article className="min-h-[220px] overflow-hidden rounded-card border border-[#DCEFE3] bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-dark">Sauvegarde WhatsApp</p>
          <p className={`mt-4 text-2xl font-bold ${status === 'Erreur' ? 'text-red-600' : 'text-green-700'}`}>
            {status}
          </p>
          <p className="mt-4 text-sm text-[#69708A]">Dernière sauvegarde</p>
          <p className="mt-2 text-sm font-semibold">{lastBackup}</p>
        </div>
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-card bg-green-50 text-[#25D366]">
          {isUploading ? (
            <Loader2 size={42} className="animate-spin text-green-600" />
          ) : (
            <>
              <WhatsAppIcon size={42} />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-green-600 p-1 text-white">
                <Check size={13} strokeWidth={3} />
              </span>
            </>
          )}
        </span>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleBackup} className="hidden" accept=".zip,.txt,.csv" disabled={isUploading} />
      <a
        href="/whatsapp?scan=1"
        className={`mt-8 min-h-11 w-full flex items-center justify-center gap-2 rounded-btn border border-green-500 px-5 py-2 text-sm font-bold text-green-700 sm:w-auto hover:bg-green-50 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        {isUploading ? "Sauvegarde en cours..." : "Sauvegarder maintenant"}
      </a>
    </article>
  );
}
