import { logger } from "@/lib/logger"

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleClientError(error: unknown, fallbackMessage = "Une erreur est survenue"): string {
  if (error instanceof AppError) {
    logger.warn("AppError caught", { message: error.message, code: error.code })
    return error.message
  }
  if (error instanceof Error) {
    logger.error("Unhandled error caught", { message: error.message, name: error.name })
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return fallbackMessage
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

export function safeLocalStorageSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    logger.warn("localStorage write failed", { key })
    return false
  }
}
