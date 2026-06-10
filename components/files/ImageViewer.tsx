"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Download, Share2, Info, ZoomIn, ZoomOut, RotateCw, Maximize, Minimize, FileText, Star } from "lucide-react"
import { type FileCardData, formatFileSize, formatFileDate } from "@/components/dashboard/FileCard"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
  files: FileCardData[]
  initialIndex: number
  onClose: () => void
  onShare?: (file: FileCardData) => void
  onFavorite?: (file: FileCardData) => void
  onInfo?: (file: FileCardData) => void
}

export function ImageViewer({ files, initialIndex, onClose, onShare, onFavorite, onInfo }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const file = files[index]
  const hasPrev = index > 0
  const hasNext = index < files.length - 1
  const imageFiles = files.filter((f) => f.mime_type?.startsWith("image/"))
  const imageIndex = imageFiles.findIndex((f) => f.id === file?.id)

  const goNext = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1)
  }, [hasNext])

  const goPrev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1)
  }, [hasPrev])

  useEffect(() => {
    setIndex(initialIndex)
    setZoom(1)
    setRotation(0)
  }, [initialIndex])

  useEffect(() => {
    setZoom(1)
    setRotation(0)
    setShowInfo(false)
  }, [index])

  useEffect(() => {
    if (!file) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [file, onClose, goNext, goPrev])

  if (!file) return null

  const isImage = file.mime_type?.startsWith("image/")
  const isVideo = file.mime_type?.startsWith("video/")
  const isAudio = file.mime_type?.startsWith("audio/")
  const isPdf = file.mime_type === "application/pdf" || file.name.endsWith(".pdf")

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 5))
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25))
  const resetZoom = () => setZoom(1)
  const rotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[rgba(0,0,0,0.95)]"
      ref={containerRef}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (dx > 50) goPrev()
        else if (dx < -50) goNext()
        touchStartX.current = null
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 z-10 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate max-w-[300px] md:max-w-[500px]">{file.name}</p>
            <p className="text-[11px] text-white/50 font-medium">
              {formatFileSize(file.size_bytes)} · {formatFileDate(file.updated_at || file.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {imageFiles.length > 0 && (
            <span className="text-[12px] text-white/50 font-medium mr-2">
              {imageIndex + 1} sur {imageFiles.length}
            </span>
          )}
          <button onClick={() => onFavorite?.(file)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-yellow-400 hover:bg-white/10 transition-colors">
            <Star size={18} />
          </button>
          {file.url && (
            <a href={file.url} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Download size={18} />
            </a>
          )}
          <button onClick={() => onShare?.(file)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Share2 size={18} />
          </button>
          <button onClick={() => setShowInfo(!showInfo)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0">
        {/* Navigation arrows */}
        {hasPrev && (
          <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
            <ChevronLeft size={28} />
          </button>
        )}
        {hasNext && (
          <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
            <ChevronRight size={28} />
          </button>
        )}

        {/* Content */}
        <div className="flex items-center justify-center w-full h-full p-8">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain transition-all duration-200 select-none"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, cursor: zoom > 1 ? "grab" : "default" }}
              draggable={false}
            />
          ) : isVideo ? (
            <video src={file.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
          ) : isAudio ? (
            <div className="text-center space-y-4">
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-green-500/20 text-green-400">
                <FileText size={48} />
              </div>
              <audio src={file.url} controls autoPlay className="w-80" />
            </div>
          ) : isPdf ? (
            <iframe src={`${file.url}#toolbar=1`} className="w-full h-full rounded-lg" title={file.name} />
          ) : (
            <div className="text-center space-y-4">
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-2xl bg-white/10 text-white/50">
                <FileText size={48} />
              </div>
              <p className="text-white/50 text-[15px] font-medium">Aperçu non disponible</p>
              {file.url && (
                <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-bold text-white hover:bg-primary-light transition-colors">
                  <Download size={18} /> Télécharger
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom toolbar (image only) */}
      {isImage && (
        <div className="flex items-center justify-center gap-1 px-6 py-3 shrink-0 bg-gradient-to-t from-black/40 to-transparent">
          <ToolbarButton icon={ZoomOut} label="Zoom arrière" onClick={zoomOut} />
          <span className="text-[12px] text-white/50 font-medium mx-1 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <ToolbarButton icon={ZoomIn} label="Zoom avant" onClick={zoomIn} />
          <div className="w-px h-6 bg-white/10 mx-2" />
          <ToolbarButton icon={RotateCw} label="Rotation 90°" onClick={rotate} />
          <ToolbarButton icon={Maximize} label="Réinitialiser" onClick={resetZoom} />
          <div className="w-px h-6 bg-white/10 mx-2" />
          <ToolbarButton icon={Minimize} label="Plein écran" onClick={() => containerRef.current?.requestFullscreen()} />
        </div>
      )}
    </div>
  )
}

function ToolbarButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      title={label}
    >
      <Icon size={18} />
    </button>
  )
}
