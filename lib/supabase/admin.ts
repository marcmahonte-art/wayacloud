import { createClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient() {
  // Fallback to anon key when SERVICE_ROLE_KEY is not set (local/dev environment)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
