"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard")
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login?error=auth_failed")
      }
    })
  }, [router])

  return <p>Processing authentication…</p>
}
