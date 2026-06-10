"use client"

import { memo } from "react"
import { ImageIcon, FileText, FileArchive, FileVideo, FileAudio, File, Check, Square, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileKebabMenu } from "@/components/files/FileKebabMenu"
import { FavoriteButton } from "@/components/files/FavoriteButton"

export interface FileCardData {
  id: string
  name: string
  mime_type: string
  size_bytes: number
  url?: string
  created_at: string
  updated_at: string
  is_favorite?: boolean
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} Go`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${bytes} o`
}

export function formatFileDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 86400000

  if (diff < day) return "Aujourd'hui"
  if (diff < 2 * day) return "Hier"
  if (diff < 7 * day) return `Il y a ${Math.floor(diff / day)} jours`

  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function getFileCategory(mime: string, name: string): "image" | "video" | "audio" | "pdf" | "archive" | "document" {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  const m = mime.toLowerCase()
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image"
  if (m.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi", "mkv", "wmv"].includes(ext)) return "video"
  if (m.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"].includes(ext)) return "audio"
  if (m === "application/pdf" || ext === "pdf") return "pdf"
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) return "archive"
  return "document"
}

function getFileIcon(category: string) {
  switch (category) {
    case "image": return ImageIcon
    case "video": return FileVideo
    case "audio": return FileAudio
    case "pdf": return FileText
    case "archive": return FileArchive
    default: return File
  }
}

function getIconBg(category: string): string {
  switch (category) {
    case "image": return "bg-orange-100 text-orange-600"
    case "video": return "bg-violet-100 text-violet-600"
    case "audio": return "bg-green-100 text-green-600"
    case "pdf": return "bg-red-100 text-red-600"
    case "archive": return "bg-blue-100 text-blue-600"
    default: return "bg-gray-100 text-gray-600"
  }
}

interface FileCardProps {
  file: FileCardData
  isSelected: boolean
  onSelect: (id: string) => void
  onClick: (file: FileCardData) => void
  onKebabAction: (actionId: string, file: FileCardData) => void
  onFavorite?: (file: FileCardData) => void
}

function FileCardInner({ file, isSelected, onSelect, onClick, onKebabAction, onFavorite }: FileCardProps) {
  const category = getFileCategory(file.mime_type, file.name)
  const Icon = getFileIcon(category)
  const iconBg = getIconBg(category)

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-white p-3 transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-primary/40 shadow-sm ring-1 ring-primary/20"
          : "border-[#ece7df] hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
      )}
      onClick={() => onClick(file)}
    >
      {/* Checkbox - top left */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(file.id) }}
        className={cn(
          "absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md transition-all",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {isSelected ? (
          <Check size={16} className="text-white bg-primary rounded-sm p-[1px]" />
        ) : (
          <Square size={16} className="text-[#d0d0d0] hover:text-[#9ca3af]" />
        )}
      </button>

      {/* Kebab menu - top right */}
      <div className="absolute right-1 top-1 z-10">
        <FileKebabMenu file={file} isFavorite={file.is_favorite} onAction={onKebabAction} />
      </div>

      {/* Favorite indicator */}
      {file.is_favorite && (
        <div className="absolute right-8 top-2 z-10">
          <Star size={12} className="text-yellow-500" fill="currentColor" />
        </div>
      )}

      {/* Thumbnail / Icon */}
      <div className={cn("flex h-24 w-full items-center justify-center rounded-lg mb-2.5 overflow-hidden", iconBg)}>
        {category === "image" && file.url ? (
          <img src={file.url} alt={file.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Icon size={36} />
        )}
      </div>

      {/* File name */}
      <p className="truncate text-[13px] font-semibold text-[#1c1b1b]">{file.name}</p>

      {/* Size + Date */}
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#69708a] font-medium">
        <span>{formatFileSize(file.size_bytes)}</span>
        <span>·</span>
        <span>{formatFileDate(file.updated_at || file.created_at)}</span>
      </div>
    </div>
  )
}

export const FileCard = memo(FileCardInner)
