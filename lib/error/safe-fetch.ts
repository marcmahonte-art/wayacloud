import { AppError } from "./error-handler"

interface SafeFetchOptions extends RequestInit {
  timeout?: number
}

interface SafeFetchResult<T> {
  data: T | null
  error: string | null
  status: number
}

export async function safeFetch<T = unknown>(
  url: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult<T>> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return {
        data: null,
        error: body.message || body.error || `Erreur ${res.status}`,
        status: res.status,
      }
    }

    const data = await res.json()
    return { data: data as T, error: null, status: res.status }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof AppError) {
      return { data: null, error: err.message, status: 0 }
    }
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { data: null, error: "La requête a expiré", status: 0 }
      }
      return { data: null, error: err.message, status: 0 }
    }
    return { data: null, error: "Erreur réseau", status: 0 }
  }
}
