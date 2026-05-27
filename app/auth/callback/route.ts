import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            request.cookies.set({ name, value, ...options })
          },
          remove(name: string, options) {
            request.cookies.set({ name, value: "", ...options })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
        return NextResponse.redirect(`${siteUrl}${next}`)
      }
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`)
}
