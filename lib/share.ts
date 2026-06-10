import { createHash, randomBytes } from "crypto"

export type ShareLinkType = "public" | "private"
export type SharePermission = "view" | "download" | "edit"
export type ShareExpiration = "1h" | "24h" | "1d" | "7d" | "30d" | "never"

const EXPIRATION_MS: Record<Exclude<ShareExpiration, "never">, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
}

export function createShareToken() {
  return randomBytes(32).toString("hex")
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function getShareExpiresAt(expiresIn: ShareExpiration) {
  if (expiresIn === "never") return null
  return new Date(Date.now() + EXPIRATION_MS[expiresIn]).toISOString()
}

export function isShareExpired(expiresAt: string | null) {
  return Boolean(expiresAt && new Date(expiresAt) < new Date())
}
