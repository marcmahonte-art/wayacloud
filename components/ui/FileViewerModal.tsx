"use client";

import { X, FileText, Download } from "lucide-react";
import Image from "next/image";

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "pdf" | "other";
  } | null;
}

export function FileViewerModal({ isOpen, onClose, file }: FileViewerProps) {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      ></div>
      <div className="relative flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE7DF] px-6 py-4 bg-[#FBF8FF] z-10">
          <h3 className="text-lg font-bold text-dark truncate max-w-[80%]">{file.name}</h3>
          <div className="flex items-center gap-2">
            <a 
              href={file.url} 
              download 
              target="_blank"
              rel="noreferrer"
              className="p-2 text-[#69708A] hover:bg-black/5 hover:text-primary rounded-full transition-colors"
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose} 
              className="p-2 text-[#69708A] hover:bg-black/5 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center p-6 bg-slate-50 overflow-auto min-h-[400px]">
          {file.type === "image" && (
            <div className="relative w-full h-[60vh]">
              <Image 
                src={file.url} 
                alt={file.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {file.type === "video" && (
            <video 
              controls 
              autoPlay 
              className="max-h-[65vh] w-full rounded-md shadow-sm"
              src={file.url}
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          )}

          {file.type === "audio" && (
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
              <div className="w-24 h-24 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto">
                <FileText size={48} />
              </div>
              <audio 
                controls 
                autoPlay 
                className="w-full"
                src={file.url}
              >
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {file.type === "pdf" && (
            <iframe 
              src={`${file.url}#toolbar=0`} 
              className="w-full h-[70vh] rounded-md border border-[#ECE7DF]"
              title={file.name}
            />
          )}

          {file.type === "other" && (
            <div className="text-center space-y-4">
              <FileText size={64} className="mx-auto text-slate-400" />
              <p className="text-lg font-semibold text-slate-700">Aperçu non disponible</p>
              <a 
                href={file.url} 
                download
                className="inline-flex items-center gap-2 rounded-btn bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-light"
              >
                <Download size={18} /> Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
