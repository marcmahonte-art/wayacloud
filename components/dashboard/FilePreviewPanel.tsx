"use client"

import { useEffect, useState } from "react"
import { X, Download, Share2, Trash2, FileText, FileImage, FileVideo, FileAudio, FileArchive, File } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatFileSize, type FileCardData } from "./FileCard"

function getFileCategory(mime: string, name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  const m = mime.toLowerCase()
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image"
  if (m.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi", "mkv", "wmv"].includes(ext)) return "video"
  if (m.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"].includes(ext)) return "audio"
  if (m === "application/pdf" || ext === "pdf") return "pdf"
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) return "archive"
  return "document"
}

interface FilePreviewPanelProps {
  file: FileCardData | null
  onClose: () => void
  onDownload?: (file: FileCardData) => void
  onShare?: (file: FileCardData) => void
  onDelete?: (file: FileCardData) => void
}

export function FilePreviewPanel({ file, onClose, onDownload, onShare, onDelete }: FilePreviewPanelProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  useEffect(() => {
    setShowConfirmDelete(false)
  }, [file?.id])

  if (!file) return null

  const category = getFileCategory(file.mime_type, file.name)
  const ext = file.name.split(".").pop()?.toUpperCase() || ""
  const isImage = category === "image"
  const isVideo = category === "video"
  const isAudio = category === "audio"

  return (
    <AnimatePresence>
      <motion.aside
        key={file.id}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 360, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden xl:flex flex-col border-l border-[#ece7df] bg-white overflow-hidden shrink-0"
        style={{ minWidth: 0 }}
      >
        <div className="flex flex-col h-full w-[360px]">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#ece7df] px-5 py-3.5 bg-[#fbf8ff] shrink-0">
            <h3 className="text-[14px] font-bold text-[#1c1b1b]">Aperçu</h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#69708a] hover:bg-black/5 hover:text-red-500 transition-colors"
            >
              <X size={17} />
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {/* Preview */}
            <div className="m-5 rounded-xl border border-[#ece7df] bg-[#fbfaf8] flex items-center justify-center p-3 aspect-[4/3] relative overflow-hidden shadow-sm">
              {isImage ? (
                <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
              ) : isVideo ? (
                <video src={file.url} controls className="w-full h-full rounded-md" />
              ) : isAudio ? (
                <div className="w-full text-center space-y-3">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100 text-green-600">
                    <FileAudio size={28} />
                  </div>
                  <audio src={file.url} controls className="w-full max-w-[200px] mx-auto" />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                    {category === "pdf" ? <FileText size={28} /> : category === "archive" ? <FileArchive size={28} /> : <File size={28} />}
                  </div>
                  <span className="inline-block px-3 py-0.5 rounded bg-[#eae3d5] text-[11px] font-extrabold text-[#595246] uppercase">
                    {ext || "FICHIER"}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-5 pb-5 space-y-5">
              <div>
                <h4 className="text-[14px] font-bold text-[#1c1b1b] break-all leading-5">{file.name}</h4>
                <p className="mt-0.5 text-[11px] font-semibold text-[#69708a] uppercase">
                  {category === "image" ? "Image" : category === "video" ? "Vidéo" : category === "audio" ? "Audio" : category === "pdf" ? "PDF" : category === "archive" ? "Archive" : "Document"}
                </p>
              </div>

              <div className="rounded-xl border border-[#ece7df] bg-[#fbfaf8] p-3.5">
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#69708a] font-semibold">Taille</span>
                    <span className="font-bold text-[#1c1b1b]">{formatFileSize(file.size_bytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#69708a] font-semibold">Type</span>
                    <span className="font-bold text-[#1c1b1b] capitalize">{ext || "Fichier"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#69708a] font-semibold">Crée le</span>
                    <span className="font-bold text-[#1c1b1b] text-right max-w-[160px] truncate">
                      {new Date(file.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          {showConfirmDelete ? (
            <footer className="border-t border-[#ece7df] p-4 bg-red-50/50 space-y-3 shrink-0 animate-in fade-in duration-150">
              <p className="text-[12px] font-semibold text-red-800 text-center">
                Voulez-vous vraiment envoyer ce fichier à la corbeille ?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex items-center justify-center h-10 rounded-xl border border-[#ece7df] bg-white text-[11px] font-bold text-[#1c1b1b] hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDelete?.(file)
                    setShowConfirmDelete(false)
                  }}
                  className="flex items-center justify-center h-10 rounded-xl bg-red-600 text-[11px] font-bold text-white hover:bg-red-700 transition"
                >
                  Supprimer
                </button>
              </div>
            </footer>
          ) : (
            <footer className="border-t border-[#ece7df] p-4 bg-[#fbf8ff] space-y-2.5 shrink-0">
              <div className="grid grid-cols-3 gap-2">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 rounded-xl border border-[#ece7df] bg-white py-2.5 text-[11px] font-bold text-[#1c1b1b] hover:bg-slate-50 transition"
                  >
                    <Download size={16} />
                    Télécharger
                  </a>
                )}
                <button
                  onClick={() => onShare?.(file)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#ece7df] bg-white py-2.5 text-[11px] font-bold text-[#1c1b1b] hover:bg-slate-50 transition"
                >
                  <Share2 size={16} />
                  Partager
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#ece7df] bg-white py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </footer>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
