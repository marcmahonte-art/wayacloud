import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getAppUrl } from "@/lib/auth/url"

function getSafeNext(searchParams: URLSearchParams): string {
  const next = searchParams.get("next") || "/dashboard"
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeNext(searchParams)

  const siteUrl = getAppUrl()

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=missing_code`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(`${siteUrl}/login?error=server_config`)
  }

  const response = NextResponse.redirect(`${siteUrl}${next}`)

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/login?error=auth_failed&reason=${encodeURIComponent(error.code || error.message)}`
    )
  }

  return response
}
