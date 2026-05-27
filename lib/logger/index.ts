const IS_DEV = process.env.NODE_ENV === "development"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
  url?: string
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
  debug: (message: string, data?: unknown) => {
    if (IS_DEV) log("debug", message, data)
  },
}

function log(level: LogLevel, message: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  }

  if (IS_DEV) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, data ?? "")
  }

  if (level === "error" && typeof window !== "undefined") {
    try {
      const storedErrors = JSON.parse(sessionStorage.getItem("wayacloud_errors") || "[]")
      const errors = Array.isArray(storedErrors) ? storedErrors : []
      errors.push(entry)
      sessionStorage.setItem("wayacloud_errors", JSON.stringify(errors.slice(-50)))
    } catch {
      // silent
    }
  }
}

export function getStoredErrors(): LogEntry[] {
  try {
    const errors = JSON.parse(sessionStorage.getItem("wayacloud_errors") || "[]")
    return Array.isArray(errors) ? errors : []
  } catch {
    return []
  }
}
