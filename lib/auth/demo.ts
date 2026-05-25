import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export const DEMO_ACCOUNT = {
  email: "demo@wayacloud.app",
  password: "password123",
}

export async function signInAsDemo(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
  })

  if (error) {
    return { error: error.message }
  }

  return {}
}
