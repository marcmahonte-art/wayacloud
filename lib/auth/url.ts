export function getAppUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }

  return url.replace(/\/+$/, "")
}

export function getAuthCallbackUrl(next = "/dashboard"): string {
  const callbackUrl = new URL("/auth/callback", getAppUrl())
  callbackUrl.searchParams.set("next", next.startsWith("/") ? next : "/dashboard")
  return callbackUrl.toString()
}
