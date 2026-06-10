"use client"

import { useState, useRef, useEffect } from "react"
import { MoreVertical, Eye, Download, Share2, Pencil, Copy, Star, Trash2, Info, ExternalLink } from "lucide-react"
import { type FileCardData, formatFileSize } from "@/components/dashboard/FileCard"
import { cn } from "@/lib/utils"

interface KebabAction {
  id: string
  label: string
  icon: React.ElementType
  danger?: boolean
  divider?: boolean
}

const fileActions: KebabAction[] = [
  { id: "preview", label: "Aperçu", icon: Eye },
  { id: "download", label: "Télécharger", icon: Download },
  { id: "rename", label: "Renommer", icon: Pencil },
  { id: "copy", label: "Copier", icon: Copy },
  { id: "share", label: "Partager", icon: Share2 },
  { id: "favorite", label: "Favoris", icon: Star },
  { id: "details", label: "Détails", icon: Info, divider: true },
  { id: "trash", label: "Corbeille", icon: Trash2, danger: true },
]

interface FileKebabMenuProps {
  file: FileCardData
  isFavorite?: boolean
  onAction: (actionId: string, file: FileCardData) => void
}

export function FileKebabMenu({ file, isFavorite, onAction }: FileKebabMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
          open
            ? "bg-primary/10 text-primary opacity-100"
            : "text-[#69708a] opacity-0 group-hover:opacity-100 hover:bg-[#f3efe9] md:opacity-0 md:group-hover:opacity-100",
        )}
        title="Plus d'actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-52 origin-top-right animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="overflow-hidden rounded-xl border border-[#eae5e0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* File info header */}
            <div className="px-3 py-2 border-b border-[#f0ece6]">
              <p className="text-[12px] font-semibold text-[#1c1b1b] truncate max-w-[180px]">{file.name}</p>
              <p className="text-[10px] text-[#69708a] font-medium mt-0.5">{formatFileSize(file.size_bytes)}</p>
            </div>

            <div className="py-1">
              {fileActions.map((action) => (
                <div key={action.id}>
                  {action.divider && <div className="mx-2 my-1 border-t border-[#f0ece6]" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction(action.id, file); setOpen(false) }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-[13px] font-medium transition-colors",
                      action.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-[#4a4a4a] hover:bg-[#f5f3f0]",
                      action.id === "favorite" && isFavorite ? "text-yellow-500" : "",
                    )}
                  >
                    {action.id === "favorite" ? (
                      <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
                    ) : (
                      <action.icon size={15} />
                    )}
                    {action.id === "favorite" && isFavorite
                      ? "Retirer des favoris"
                      : action.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
