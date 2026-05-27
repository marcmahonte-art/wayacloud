const IS_CLIENT = typeof window !== "undefined"

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!IS_CLIENT) return fallback
    try {
      const item = localStorage.getItem(key)
      if (item === null) return fallback
      return JSON.parse(item) as T
    } catch {
      return fallback
    }
  },

  set(key: string, value: unknown): boolean {
    if (!IS_CLIENT) return false
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key: string): boolean {
    if (!IS_CLIENT) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
}
