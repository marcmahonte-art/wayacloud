"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Square, FileText, FileImage, FileVideo, FileAudio, FileArchive, File, Eye, Download, Share2, Trash2, ChevronRight, Loader2, ArrowLeft, Search, Plus, CloudUpload, Grid3X3, List, Folder, X, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInfiniteFiles } from "@/hooks/useInfiniteFiles"
import { useSettingsStore } from "@/lib/store/settings-store"
import { useStorageStore } from "@/lib/store/storage-store"
import { formatFileSize, formatFileDate, type FileCardData } from "./FileCard"
import { FileKebabMenu } from "@/components/files/FileKebabMenu"
import { SkeletonFileGrid } from "@/components/ui/Skeletons"

const CATEGORIES = [
  { id: "", label: "Tous les fichiers", icon: Folder },
  { id: "images", label: "Images", icon: Folder },
  { id: "videos", label: "Vidéos", icon: Folder },
  { id: "audios", label: "Audios", icon: Folder },
  { id: "pdfs", label: "PDF", icon: Folder },
  { id: "documents", label: "Documents", icon: Folder },
  { id: "archives", label: "Archives", icon: Folder },
]

function getFileIcon(mime: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  const m = mime.toLowerCase()
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return FileImage
  if (m.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return FileVideo
  if (m.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "flac"].includes(ext)) return FileAudio
  if (m === "application/pdf" || ext === "pdf") return FileText
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive
  return File
}

function getMimeColor(mime: string, name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  const m = mime.toLowerCase()
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "bg-orange-100 text-orange-600"
  if (m.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "bg-violet-100 text-violet-600"
  if (m.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "flac"].includes(ext)) return "bg-green-100 text-green-600"
  if (m === "application/pdf" || ext === "pdf") return "bg-red-100 text-red-600"
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "bg-blue-100 text-blue-600"
  return "bg-gray-100 text-gray-600"
}

interface FileListProps {
  onPreview: (file: FileCardData) => void
  onUpload: () => void
  onBatchDelete: (ids: string[]) => void
  onBatchShare: (ids: string[]) => void
  onFolderClick: (categoryId: string) => void
  onKebabAction: (actionId: string, file: FileCardData) => void
  refreshTrigger?: number
}

export function FileList({ onPreview, onUpload, onBatchDelete, onBatchShare, onFolderClick, onKebabAction, refreshTrigger }: FileListProps) {
  const gridView = useSettingsStore((s) => s.grid_view)
  const toggleGridView = useSettingsStore((s) => s.toggleGridView)

  const searchParams = useSearchParams()
  const q = searchParams ? searchParams.get("q") || "" : ""

  const [category, setCategory] = useState("")
  const [search, setSearch] = useState(q)

  useEffect(() => {
    setSearch(q)
  }, [q])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSearch, setShowSearch] = useState(false)
  const [showDropZone, setShowDropZone] = useState(false)

  const { files, loading, loadingMore, error, hasMore, total, observerRef, refresh } = useInfiniteFiles({
    category,
    search,
    refreshTrigger,
  })

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)))
    }
  }, [files, selectedIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const handleBatchDownload = useCallback(() => {
    files.filter((f) => selectedIds.has(f.id) && f.url).forEach((f) => window.open(f.url, "_blank"))
  }, [files, selectedIds])

  const handleBatchTrash = useCallback(async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      try {
        await fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_trashed: true }),
        })
      } catch {}
    }
    useStorageStore.getState().refreshAll()
    clearSelection()
    refresh()
  }, [selectedIds, clearSelection, refresh])

  const currentCategory = CATEGORIES.find((c) => c.id === category)
  const allSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id))

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
          <X size={28} />
        </div>
        <p className="text-[15px] font-semibold text-[#1c1b1b]">Erreur de chargement</p>
        <p className="mt-1 text-[13px] text-[#69708a]">{error}</p>
        <button onClick={refresh} className="mt-4 rounded-lg bg-primary px-5 py-2 text-[13px] font-bold text-white hover:bg-primary-light transition">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#69708a] uppercase tracking-wider">
            <span
              className={category ? "cursor-pointer hover:text-primary transition" : ""}
              onClick={() => { setCategory(""); onFolderClick("") }}
            >
              Disque Cloud
            </span>
            {currentCategory?.id && (
              <>
                <ChevronRight size={10} />
                <span className="text-[#1c1b1b] font-bold">{currentCategory.label}</span>
              </>
            )}
          </div>
          <h2 className="mt-1 text-xl font-bold text-[#1c1b1b] sm:text-2xl">
            {currentCategory?.label || "Disque Cloud"}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#69708a] font-medium">
            {total} fichier{total !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-[#e3dfe8] bg-white shadow-sm text-[#516080]" onClick={() => setShowSearch(true)}>
            <Search size={16} />
          </button>

          {showSearch && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-white/95 backdrop-blur-sm pt-4 px-4 sm:hidden" onClick={() => setShowSearch(false)}>
              <div className="flex w-full max-w-md items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-12 rounded-xl border border-[#e3dfe8] bg-white px-4 text-[15px] outline-none placeholder:text-[#69708a]" placeholder="Rechercher..." autoFocus />
                <button onClick={() => setShowSearch(false)} className="h-12 px-4 text-[14px] font-semibold text-primary">Fermer</button>
              </div>
            </div>
          )}

          <label className="hidden sm:flex h-11 items-center gap-2.5 rounded-xl border border-[#e3dfe8] bg-white px-3.5 shadow-sm max-w-[220px]">
            <Search size={16} className="text-[#516080]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708a]" placeholder="Rechercher..." />
          </label>

          <button onClick={onUpload} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white shadow-sm hover:bg-primary-light transition">
            <Plus size={15} />
            <span className="hidden sm:inline">Importer</span>
          </button>

          <button onClick={() => setShowDropZone(!showDropZone)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition ${showDropZone ? "border-primary bg-primary/5 text-primary" : "border-[#e3dfe8] bg-white text-[#4a4a4a] hover:bg-[#f5f3f0]"}`}>
            <CloudUpload size={15} />
            <span className="hidden sm:inline">Glisser-déposer</span>
          </button>

          <button onClick={toggleGridView} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e3dfe8] bg-white text-[#4a4a4a] hover:bg-[#f5f3f0] transition" title={gridView ? "Vue grille" : "Vue liste"}>
            {gridView ? <List size={15} /> : <Grid3X3 size={15} />}
          </button>
        </div>
      </header>

      {showDropZone && (
        <div className="mb-2 shrink-0 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-8 text-center">
          <CloudUpload size={40} className="mx-auto text-primary/50" />
          <p className="mt-2 text-[13px] font-semibold text-[#69708a]">Glissez-déposez vos fichiers ici</p>
        </div>
      )}

      {!category && (
        <section className="mt-3 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.filter((c) => c.id).map((cat) => (
              <button key={cat.id} onClick={() => { setCategory(cat.id); onFolderClick(cat.id) }} className="flex shrink-0 items-center gap-2 rounded-full border border-[#ece7df] bg-white px-4 py-2 text-[13px] font-semibold text-[#4a4a4a] hover:border-primary/30 hover:bg-primary/[0.02] hover:text-primary transition-all whitespace-nowrap">
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {category && (
        <button onClick={() => { setCategory(""); onFolderClick("") }} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:text-primary-light transition w-fit shrink-0">
          <ArrowLeft size={15} /> Tous les fichiers
        </button>
      )}

      <section className="mt-5 flex-1 min-h-0 flex flex-col">
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-t-xl border border-[#ece7df] bg-primary/[0.03] animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="text-[13px] font-bold text-primary">{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={handleBatchDownload} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#1c1b1b] hover:bg-white/70 transition-colors"><Download size={13} /> Télécharger</button>
              <button onClick={() => onBatchShare(Array.from(selectedIds))} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#1c1b1b] hover:bg-white/70 transition-colors"><Share2 size={13} /> Partager</button>
              <button onClick={handleBatchTrash} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-white/70 transition-colors"><Trash2 size={13} /> Corbeille</button>
              <button onClick={clearSelection} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#69708a] hover:bg-white/70 transition-colors"><X size={13} /> Annuler</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto rounded-xl border border-[#ece7df] bg-white shadow-sm" style={{ scrollbarWidth: "thin" }}>
          {loading ? (
            <div className="p-6"><SkeletonFileGrid /></div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Folder size={48} className="text-[#c8c0b5]" />
              <p className="mt-4 text-[15px] font-semibold text-[#69708a]">{search ? "Aucun résultat" : "Disque vide"}</p>
              <p className="mt-1 text-[13px] text-[#9ca3af]">{search ? "Essayez un autre terme de recherche." : "Importez vos premiers fichiers."}</p>
              {!search && (
                <button onClick={onUpload} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary-light transition">
                  <Plus size={15} /> Importer des fichiers
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center px-4 py-2 border-b border-[#ece7df] bg-[#fbf8ff]">
                <button onClick={handleSelectAll} className="flex items-center gap-2 text-[12px] font-semibold text-[#69708a] hover:text-primary transition">
                  <div className={`flex h-5 w-5 items-center justify-center rounded ${allSelected ? "bg-primary text-white" : "border border-[#d0d0d0]"}`}>
                    {allSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                  {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[40px_1fr_80px_100px_120px_36px] gap-3 px-4 py-3 text-[11px] font-bold text-[#69708a] uppercase tracking-wider bg-[#fbf8ff] border-b border-[#ece7df]">
                <div></div>
                <div>Nom</div>
                <div>Type</div>
                <div>Taille</div>
                <div>Modifié</div>
                <div></div>
              </div>

              {/* File rows */}
              <div className="divide-y divide-[#f1ede6]">
                {files.map((file) => {
                  const Icon = getFileIcon(file.mime_type, file.name)
                  const iconColor = getMimeColor(file.mime_type, file.name)
                  const isChecked = selectedIds.has(file.id)
                  const ext = file.name.split(".").pop()?.toUpperCase() || ""

                  return (
                    <div
                      key={file.id}
                      onClick={() => onPreview(file)}
                      className={cn(
                        "grid grid-cols-[40px_1fr_80px_100px_120px_36px] gap-3 px-4 py-3 items-center hover:bg-[#fdfcfb] cursor-pointer transition group",
                        isChecked && "bg-primary/[0.02]",
                      )}
                    >
                      <div>
                        <button onClick={(e) => { e.stopPropagation(); handleSelect(file.id) }} className="flex items-center justify-center w-full">
                          {isChecked ? <Check size={16} className="text-white bg-primary rounded-sm p-[1px]" /> : <Square size={16} className="text-[#d0d0d0] group-hover:text-[#9ca3af] transition-colors" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
                          <Icon size={16} />
                        </span>
                        <span className="truncate text-[13px] font-semibold text-[#1c1b1b]">{file.name}</span>
                        {file.is_favorite && <Star size={12} className="text-yellow-500 shrink-0" fill="currentColor" />}
                      </div>

                      <div className="text-[11px] text-[#596077] font-semibold uppercase hidden sm:block truncate">{ext || "FICHIER"}</div>
                      <div className="text-[13px] text-[#596077] font-medium">{formatFileSize(file.size_bytes)}</div>
                      <div className="text-[12px] text-[#69708a]">{formatFileDate(file.updated_at || file.created_at)}</div>

                      <div className="flex items-center justify-end">
                        <FileKebabMenu file={file} isFavorite={file.is_favorite} onAction={onKebabAction} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div ref={observerRef} className="flex items-center justify-center py-6">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-[13px] text-[#69708a] font-medium">
                    <Loader2 size={16} className="animate-spin" />
                    Chargement...
                  </div>
                )}
                {!hasMore && files.length > 0 && (
                  <p className="text-[12px] text-[#9ca3af] font-medium">Tous les fichiers chargés</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
