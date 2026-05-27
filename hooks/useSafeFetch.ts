"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseSafeFetchState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseSafeFetchReturn<T> extends UseSafeFetchState<T> {
  execute: (...args: any[]) => Promise<void>
  reset: () => void
}

export function useSafeFetch<T = unknown>(
  fetcher: (...args: any[]) => Promise<T>,
): UseSafeFetchReturn<T> {
  const [state, setState] = useState<UseSafeFetchState<T>>({
    data: null,
    error: null,
    loading: false,
  })
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await fetcher(...args)
        if (mountedRef.current) {
          setState({ data: result, error: null, loading: false })
        }
      } catch (err) {
        if (mountedRef.current) {
          const message = err instanceof Error ? err.message : "Une erreur est survenue"
          setState({ data: null, error: message, loading: false })
        }
      }
    },
    [fetcher],
  )

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false })
  }, [])

  return { ...state, execute, reset }
}
