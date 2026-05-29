import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getAppUrl } from "@/lib/auth/url"

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

const protectedPaths = [
  "/dashboard",
  "/admin",
  "/mes-fichiers",
  "/albums",
  "/partages",
  "/whatsapp",
  "/abonnement",
  "/parametres",
  "/corbeille",
  "/outils",
  "/referral",
  "/gift",
]

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"]

const publicPaths = ["/verify-email", "/auth/callback"]

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.next())
  }

  const response = NextResponse.next()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return withSecurityHeaders(response)
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = new URL("/login", getAppUrl())
    return withSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  if (isProtected && user && !user.email_confirmed_at) {
    const verifyUrl = new URL("/verify-email", getAppUrl())
    if (user.email) verifyUrl.searchParams.set("email", user.email)
    return withSecurityHeaders(NextResponse.redirect(verifyUrl))
  }

  if (pathname === "/verify-email" && user?.email_confirmed_at) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", getAppUrl())))
  }

  if (authPaths.some((p) => pathname === p)) {
    if (!user) return withSecurityHeaders(response)

    if (user.email_confirmed_at) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", getAppUrl())))
    }

    const verifyUrl = new URL("/verify-email", getAppUrl())
    if (user.email) verifyUrl.searchParams.set("email", user.email)
    return withSecurityHeaders(NextResponse.redirect(verifyUrl))
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/login", getAppUrl())))
    }
    const role = user.app_metadata?.role
    if (role !== "admin" && role !== "super_admin") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", getAppUrl())))
    }
  }

  return withSecurityHeaders(response)
}
