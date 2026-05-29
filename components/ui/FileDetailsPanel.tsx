"use client"

import { X, FileImage, FileText, Play, FileAudio, Folder } from "lucide-react"

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function getFileCategory(mimeType: string | undefined, fileName: string): string {
  const mime = (mimeType || "").toLowerCase()
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image"
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video"
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio"
  if (mime === "application/pdf" || ext === "pdf") return "pdf"
  return "document"
}

function getFileLabel(category: string): string {
  switch (category) {
    case "image": return "Image"
    case "video": return "Vidéo"
    case "audio": return "Audio"
    case "pdf": return "PDF"
    case "document": return "Document"
    default: return "Fichier"
  }
}

function getFileIcon(category: string) {
  switch (category) {
    case "image": return FileImage
    case "video": return Play
    case "audio": return FileAudio
    case "pdf": return FileText
    default: return FileText
  }
}

function getFileColor(category: string) {
  switch (category) {
    case "image": return "bg-orange-100 text-primary"
    case "video": return "bg-violet-100 text-violet-700"
    case "audio": return "bg-green-100 text-green-700"
    case "pdf": return "bg-red-100 text-red-600"
    default: return "bg-blue-100 text-blue-600"
  }
}

interface FileDetailsPanelProps {
  file: {
    id?: string
    name: string
    mime_type?: string
    size_bytes?: number
    created_at?: string
    meta?: string
    url?: string
    object_key?: string
  }
  onClose: () => void
}

export function FileDetailsPanel({ file, onClose }: FileDetailsPanelProps) {
  const cat = getFileCategory(file.mime_type, file.name)
  const Icon = getFileIcon(cat)
  const color = getFileColor(cat)

  const details: { label: string; value: string }[] = [
    { label: "Nom", value: file.name },
    { label: "Type", value: getFileLabel(cat) },
    ...(file.mime_type ? [{ label: "Type MIME", value: file.mime_type }] : []),
    ...(file.size_bytes !== undefined ? [{ label: "Taille", value: formatBytes(file.size_bytes) }] : []),
    ...(file.size_bytes !== undefined ? [{ label: "Taille exacte", value: `${file.size_bytes} octets` }] : []),
    ...(file.created_at ? [{ label: "Date de création", value: new Date(file.created_at).toLocaleString("fr-FR") }] : []),
    ...(file.object_key ? [{ label: "Emplacement", value: file.object_key }] : []),
    ...(file.meta && !file.size_bytes ? [{ label: "Informations", value: file.meta }] : []),
    ...(file.id ? [{ label: "ID", value: file.id }] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#ECE7DF] px-6 py-4 bg-[#FBF8FF]">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </span>
            <h3 className="text-lg font-bold text-dark">Propriétés</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white hover:text-dark transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          <div className="space-y-1">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex justify-between items-start gap-4 py-2.5 border-b border-[#F5F3F0] last:border-0"
              >
                <span className="text-sm font-semibold text-[#69708A] shrink-0 min-w-[110px]">
                  {d.label}
                </span>
                <span className="text-sm text-dark text-right break-all max-w-[60%] font-medium">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {file.url && file.url !== "#" && (
          <div className="border-t border-[#F0ECE6] px-6 py-3 bg-[#FAF9F7] flex justify-end">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ouvrir le fichier
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export function formatBytesStatic(bytes: number): string {
  return formatBytes(bytes)
}
