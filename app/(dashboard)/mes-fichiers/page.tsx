"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FileGrid } from "@/components/dashboard/FileGrid"
import { FileList } from "@/components/dashboard/FileList"
import { FilePreviewPanel } from "@/components/dashboard/FilePreviewPanel"
import { useStorageStore } from "@/lib/store/storage-store"
import { useSettingsStore } from "@/lib/store/settings-store"
import { computeFileSha256 } from "@/lib/upload/fileHash"
import { useStorageUsage } from "@/hooks/useStorageUsage"
import { useFileActions } from "@/hooks/useFileActions"
import { useInfiniteFiles } from "@/hooks/useInfiniteFiles"
import StorageProgress from "@/components/dashboard/StorageProgress"
import { ImageViewer } from "@/components/files/ImageViewer"
import { RenameFileDialog } from "@/components/files/RenameFileDialog"
import { FileDetailsDrawer } from "@/components/files/FileDetailsDrawer"
import { ShareDialog } from "@/components/files/ShareDialog"
import type { FileCardData } from "@/components/dashboard/FileCard"

export default function FilesExplorerPage() {
  const gridView = useSettingsStore((s) => s.grid_view)
  const storeFiles = useStorageStore((s) => s.files)
  const { usedBytes, limitBytes } = useStorageUsage()
  const { trashFile, renameFile, toggleFavorite, duplicateFile, downloadFile } = useFileActions()

  const searchParams = useSearchParams()
  const q = searchParams ? searchParams.get("q") || "" : ""

  const [category, setCategory] = useState("")
  const [search, setSearch] = useState(q)

  useEffect(() => {
    setSearch(q)
  }, [q])

  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileCardData | null>(null)

  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerIndex, setImageViewerIndex] = useState(0)

  const [renameFileTarget, setRenameFileTarget] = useState<FileCardData | null>(null)
  const [detailsFile, setDetailsFile] = useState<FileCardData | null>(null)
  const [shareFile, setShareFile] = useState<FileCardData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    files,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    observerRef,
    refresh,
  } = useInfiniteFiles({
    category,
    search,
    refreshTrigger: refreshKey,
  })

  const handlePreview = useCallback((file: FileCardData) => {
    const isImage = file.mime_type?.startsWith("image/")
    if (isImage) {
      const imgFiles = files.filter((f) => f.mime_type?.startsWith("image/")) as unknown as FileCardData[]
      const idx = imgFiles.findIndex((f) => f.id === file.id)
      setImageViewerIndex(idx >= 0 ? idx : 0)
      setImageViewerOpen(true)
    } else {
      setPreviewFile((prev) => (prev?.id === file.id ? null : file))
    }
  }, [files])

  const handleKebabAction = useCallback((actionId: string, file: FileCardData) => {
    switch (actionId) {
      case "preview":
        handlePreview(file)
        break
      case "download":
        downloadFile(file)
        break
      case "rename":
        setRenameFileTarget(file)
        break
      case "copy":
        duplicateFile(file.id)
        break
      case "share":
        setShareFile(file)
        break
      case "favorite":
        toggleFavorite(file, !!file.is_favorite)
        break
      case "details":
        setDetailsFile(file)
        break
      case "trash":
        trashFile(file)
        break
    }
  }, [handlePreview, downloadFile, duplicateFile, toggleFavorite, trashFile])

  const handleUpload = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = async (e) => {
      const selectedFiles = Array.from((e.target as HTMLInputElement).files ?? [])
      if (selectedFiles.length === 0) return
      setIsUploading(true)
      try {
        for (const file of selectedFiles) {
          let checksumSha256: string | undefined
          try { checksumSha256 = await computeFileSha256(file) } catch {}

          const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name, mimeType: file.type || "application/octet-stream",
              fileSize: file.size, checksumSha256,
            }),
          })
          if (!presignRes.ok) throw new Error("Erreur de préparation")
          const data = await presignRes.json()

          if (data.exists) {
            await fetch("/api/upload/confirm", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
            })
          } else {
            const uploadRes = await fetch(data.url!, {
              method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file,
            })
            if (!uploadRes.ok) throw new Error(`Erreur de transfert (HTTP ${uploadRes.status})`)
            await fetch("/api/upload/confirm", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({ key: data.key, size: file.size, name: file.name, mimeType: file.type || "application/octet-stream", checksumSha256 }),
            })
          }
        }
        useStorageStore.getState().refreshAll()
        setRefreshKey(v => v + 1)
      } catch (e: any) {
        console.error("Upload error:", e)
      } finally {
        setIsUploading(false)
      }
    }
    input.click()
  }, [])

  const handleBatchDelete = useCallback((ids: string[]) => {
    ids.forEach((id) => {
      const file = files.find((f) => f.id === id)
      if (file) trashFile(file as unknown as FileCardData)
    })
  }, [files, trashFile])

  const handleBatchShare = useCallback((ids: string[]) => {
    const first = files.find((f) => ids.includes(f.id))
    if (first) setShareFile(first as unknown as FileCardData)
  }, [files])

  const handleShare = useCallback((file: FileCardData) => {
    setShareFile(file)
  }, [])

  const imageFiles = files.filter((f) => f.mime_type?.startsWith("image/")) as unknown as FileCardData[]

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[450px] w-full gap-0 overflow-hidden rounded-2xl border border-[#ece7df] bg-[#fbfaf8] shadow-card lg:gap-6">
      <section className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
        <div className="mb-4 shrink-0">
          <StorageProgress usedBytes={usedBytes} limitBytes={limitBytes} />
        </div>

        {gridView ? (
          <FileGrid
            files={files}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            total={total}
            observerRef={observerRef}
            refresh={refresh}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
            onPreview={handlePreview}
            onUpload={handleUpload}
            onBatchDelete={handleBatchDelete}
            onBatchShare={handleBatchShare}
            onFolderClick={() => {}}
            onKebabAction={handleKebabAction}
            refreshTrigger={refreshKey}
          />
        ) : (
          <FileList
            files={files}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            total={total}
            observerRef={observerRef}
            refresh={refresh}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
            onPreview={handlePreview}
            onUpload={handleUpload}
            onBatchDelete={handleBatchDelete}
            onBatchShare={handleBatchShare}
            onFolderClick={() => {}}
            onKebabAction={handleKebabAction}
            refreshTrigger={refreshKey}
          />
        )}
      </section>

      <FilePreviewPanel
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={downloadFile}
        onShare={handleShare}
        onDelete={trashFile}
      />

      <ShareDialog isOpen={!!shareFile} file={shareFile} onClose={() => setShareFile(null)} />

      <RenameFileDialog
        isOpen={!!renameFileTarget}
        fileName={renameFileTarget?.name || ""}
        onClose={() => setRenameFileTarget(null)}
        onConfirm={async (newName) => {
          if (!renameFileTarget?.id) return false
          const success = await renameFile(renameFileTarget.id, newName)
          if (success) setRefreshKey(v => v + 1)
          return success
        }}
      />

      <FileDetailsDrawer file={detailsFile} onClose={() => setDetailsFile(null)} ownerName="Moi" />

      {imageViewerOpen && imageFiles.length > 0 && (
        <ImageViewer
          files={imageFiles}
          initialIndex={imageViewerIndex}
          onClose={() => setImageViewerOpen(false)}
          onShare={handleShare}
          onFavorite={(file) => toggleFavorite(file, !!file.is_favorite)}
          onInfo={(file) => setDetailsFile(file)}
        />
      )}
    </div>
  )
}
