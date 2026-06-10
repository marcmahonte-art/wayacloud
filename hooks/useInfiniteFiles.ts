"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { FileEntry } from "@/lib/store/storage-store"

interface UseInfiniteFilesOptions {
  category?: string
  search?: string
  trashed?: boolean
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  refreshTrigger?: number
}

interface UseInfiniteFilesReturn {
  files: FileEntry[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  total: number
  loadMore: () => void
  refresh: () => void
  observerRef: (node: HTMLDivElement | null) => void
}

export function useInfiniteFiles(options: UseInfiniteFilesOptions = {}): UseInfiniteFilesReturn {
  const {
    category = "",
    search = "",
    trashed = false,
    pageSize = 24,
    sortBy = "created_at",
    sortOrder = "desc",
    refreshTrigger = 0,
  } = options

  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const loadingRef = useRef(false)

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(pageSize),
        category,
        search: debouncedSearch,
        trashed: String(trashed),
        sortBy,
        sortOrder,
      })

      const res = await fetch(`/api/files/paginated?${params}`)
      if (!res.ok) throw new Error("Erreur lors du chargement des fichiers")

      const data = await res.json()

      setFiles((prev) => (append ? [...prev, ...data.files] : data.files))
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingRef.current = false
    }
  }, [category, debouncedSearch, trashed, pageSize, sortBy, sortOrder])

  useEffect(() => {
    setFiles([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, false)
  }, [fetchPage, refreshTrigger])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, true)
  }, [hasMore, loadingMore, loading, page, fetchPage])

  const refresh = useCallback(() => {
    setFiles([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, false)
  }, [fetchPage])

  const observerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
            loadMore()
          }
        },
        { threshold: 0.1 },
      )
      observer.observe(node)
      return () => observer.disconnect()
    },
    [hasMore, loading, loadingMore, loadMore],
  )

  return {
    files,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    observerRef,
  }
}
