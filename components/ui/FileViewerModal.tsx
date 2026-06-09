"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export interface ViewerFile {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "pdf" | "other";
}

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  files: ViewerFile[];
  initialIndex: number;
}

export function FileViewerModal({ isOpen, onClose, files, initialIndex }: FileViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => { setIndex(initialIndex); }, [initialIndex]);

  const file = files[index];
  const hasPrev = index > 0;
  const hasNext = index < files.length - 1;
  const isImage = file?.type === "image";

  const goNext = useCallback(() => { if (hasNext) setIndex((i) => i + 1); }, [hasNext]);
  const goPrev = useCallback(() => { if (hasPrev) setIndex((i) => i - 1); }, [hasPrev]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || !file) return null;

  const renderContent = () => {
    if (file.type === "image") {
      return (
        <div
          className="relative w-full h-[60vh] select-none"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx > 50) goPrev();
            else if (dx < -50) goNext();
            touchStartX.current = null;
          }}
        >
          <Image
            src={file.url}
            alt={file.name}
            fill
            className="object-contain pointer-events-none"
            unoptimized
          />
          {isImage && (
            <>
              {hasPrev && (
                <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors">
                  <ChevronLeft size={28} />
                </button>
              )}
              {hasNext && (
                <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors">
                  <ChevronRight size={28} />
                </button>
              )}
            </>
          )}
        </div>
      );
    }

    if (file.type === "video") {
      return (
        <video controls autoPlay className="max-h-[65vh] w-full rounded-md shadow-sm" src={file.url}>
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      );
    }

    if (file.type === "audio") {
      return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
          <div className="w-24 h-24 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto">
            <FileText size={48} />
          </div>
          <audio controls autoPlay className="w-full" src={file.url}>
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    }

    if (file.type === "pdf") {
      return (
        <iframe src={`${file.url}#toolbar=0`} className="w-full h-[70vh] rounded-md border border-[#ECE7DF]" title={file.name} />
      );
    }

    return (
      <div className="text-center space-y-4">
        <FileText size={64} className="mx-auto text-slate-400" />
        <p className="text-lg font-semibold text-slate-700">Aperçu non disponible</p>
        <a href={file.url} download className="inline-flex items-center gap-2 rounded-btn bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-light">
          <Download size={18} /> Télécharger le fichier
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#ECE7DF] px-6 py-4 bg-[#FBF8FF] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-lg font-bold text-dark truncate max-w-[60vw]">{file.name}</h3>
            {files.length > 1 && (
              <span className="text-xs text-[#69708A] whitespace-nowrap">{index + 1} / {files.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href={file.url} download target="_blank" rel="noreferrer" className="p-2 text-[#69708A] hover:bg-black/5 hover:text-primary rounded-full transition-colors">
              <Download size={20} />
            </a>
            <button onClick={onClose} className="p-2 text-[#69708A] hover:bg-black/5 hover:text-red-500 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 bg-slate-50 overflow-auto min-h-[400px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
