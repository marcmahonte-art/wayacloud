"use client"

import { useCallback } from "react"
import { useStorageStore } from "@/lib/store/storage-store"
import type { FileCardData } from "@/components/dashboard/FileCard"

export function useFileActions() {
  const refreshAll = useStorageStore((s) => s.refreshAll)

  const trashFile = useCallback(async (file: FileCardData) => {
    if (!file.id) return
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trashed: true }),
      })
      if (!res.ok) throw new Error("Erreur lors de la mise à la corbeille")
      refreshAll()
    } catch (e) {
      console.error("Erreur corbeille:", e)
    }
  }, [refreshAll])

  const restoreFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trashed: false }),
      })
      if (!res.ok) throw new Error("Erreur lors de la restauration")
      refreshAll()
    } catch (e) {
      console.error("Erreur restauration:", e)
    }
  }, [refreshAll])

  const deleteFilePermanently = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      refreshAll()
    } catch (e) {
      console.error("Erreur suppression:", e)
    }
  }, [refreshAll])

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error("Erreur lors du renommage")
      refreshAll()
      return true
    } catch (e) {
      console.error("Erreur renommage:", e)
      return false
    }
  }, [refreshAll])

  const toggleFavorite = useCallback(async (file: FileCardData, current: boolean) => {
    if (!file.id) return
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !current }),
      })
      if (!res.ok) throw new Error("Erreur lors du changement de favori")
      refreshAll()
    } catch (e) {
      console.error("Erreur favori:", e)
    }
  }, [refreshAll])

  const duplicateFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      })
      if (!res.ok) throw new Error("Erreur lors de la copie")
      refreshAll()
    } catch (e) {
      console.error("Erreur copie:", e)
    }
  }, [refreshAll])

  const downloadFile = useCallback((file: FileCardData) => {
    if (file.url) window.open(file.url, "_blank")
  }, [])

  return {
    trashFile,
    restoreFile,
    deleteFilePermanently,
    renameFile,
    toggleFavorite,
    duplicateFile,
    downloadFile,
  }
}
