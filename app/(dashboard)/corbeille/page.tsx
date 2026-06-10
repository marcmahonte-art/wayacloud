"use client"

import { useState, useCallback } from "react"
import { Trash2, RotateCcw, AlertTriangle, Loader2, FileText, Search } from "lucide-react"
import { useInfiniteFiles } from "@/hooks/useInfiniteFiles"
import { useFileActions } from "@/hooks/useFileActions"
import { formatFileSize, formatFileDate, type FileCardData } from "@/components/dashboard/FileCard"
import { cn } from "@/lib/utils"

export default function TrashPage() {
  const [search, setSearch] = useState("")
  const { files, loading, loadingMore, error, hasMore, total, observerRef, refresh } = useInfiniteFiles({
    trashed: true,
    search,
    pageSize: 30,
  })
  const { restoreFile, deleteFilePermanently } = useFileActions()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleRestore = useCallback(async (fileId: string) => {
    await restoreFile(fileId)
    refresh()
  }, [restoreFile, refresh])

  const handlePermanentDelete = useCallback(async (fileId: string) => {
    setDeleting(true)
    await deleteFilePermanently(fileId)
    setDeleting(false)
    setConfirmDelete(null)
    refresh()
  }, [deleteFilePermanently, refresh])

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[450px] w-full gap-0 overflow-hidden rounded-2xl border border-[#ece7df] bg-[#fbfaf8] shadow-card lg:gap-6">
      <section className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#69708a] uppercase tracking-wider">
              <Trash2 size={14} />
              <span>Corbeille</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-[#1c1b1b] sm:text-2xl">Corbeille</h2>
            <p className="mt-0.5 text-[13px] text-[#69708a] font-medium">
              {total} fichier{total !== 1 ? "s" : ""} · Conservation 30 jours
            </p>
          </div>

          <label className="flex h-11 items-center gap-2.5 rounded-xl border border-[#e3dfe8] bg-white px-3.5 shadow-sm max-w-[220px]">
            <Search size={16} className="text-[#516080]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708a]"
              placeholder="Rechercher dans la corbeille..."
            />
          </label>
        </header>

        {/* Empty state */}
        {!loading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center flex-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-[#69708a] mb-4">
              <Trash2 size={28} />
            </div>
            <p className="text-[15px] font-semibold text-[#1c1b1b]">Corbeille vide</p>
            <p className="mt-1 text-[13px] text-[#69708a]">
              {search ? "Aucun résultat pour cette recherche." : "Les fichiers supprimés apparaîtront ici."}
            </p>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto rounded-xl border border-[#ece7df] bg-white shadow-sm" style={{ scrollbarWidth: "thin" }}>
            <div className="divide-y divide-[#f1ede6]">
              {files.map((file) => {
                const ext = file.name.split(".").pop()?.toUpperCase() || ""
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-[1fr_120px_140px_120px] gap-3 px-4 py-3 items-center hover:bg-[#fdfcfb] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#1c1b1b]">{file.name}</p>
                        <p className="text-[11px] text-[#69708a] font-medium">{formatFileSize(file.size_bytes)}</p>
                      </div>
                    </div>

                    <div className="text-[12px] text-[#69708a]">
                      {formatFileDate(file.updated_at || file.created_at)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(file.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#ece7df] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1c1b1b] hover:bg-[#f5f3f0] transition-colors"
                      >
                        <RotateCcw size={13} />
                        Restaurer
                      </button>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setConfirmDelete(file.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
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
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle size={28} className="text-red-500 mb-2" />
            <p className="text-[13px] text-[#69708a]">{error}</p>
          </div>
        )}
      </section>

      {/* Confirm permanent delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(null)}>
          <div className="relative w-full max-w-sm rounded-2xl border border-[#eae5e0] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1c1b1b]">Supprimer définitivement ?</h3>
                <p className="mt-1 text-[13px] text-[#69708a]">Cette action est irréversible. Le fichier sera définitivement perdu.</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-[#e3dfe8] py-2.5 text-[13px] font-semibold text-[#4a4a4a] hover:bg-[#f5f3f0] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handlePermanentDelete(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-[13px] font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
