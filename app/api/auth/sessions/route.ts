import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const currentSession = sessionData?.session

    if (!currentSession) {
      return NextResponse.json({ sessions: [] })
    }

    const sessions = [{
      id: currentSession.access_token.slice(0, 16),
      device: "Navigateur",
      os: "Inconnu",
      lastSeen: "Actif maintenant",
      current: true,
    }]

    return NextResponse.json({ sessions })
  } catch (err) {
    console.error("Sessions error:", err)
    return NextResponse.json({ sessions: [] })
  }
}

export async function DELETE() {
  return NextResponse.json({ error: "Non disponible" }, { status: 400 })
}
