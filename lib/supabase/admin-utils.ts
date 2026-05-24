// lib/supabase/admin-utils.ts
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Retrieves the UUIDs of all users that have the role "admin" or "super_admin".
 */
export async function getAdminIds(): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["admin", "super_admin"]);

  if (error) {
    console.error("❌ Failed to fetch admin IDs:", error);
    return [];
  }

  // data is of type { id: string }[]
  return data?.map((row) => row.id) ?? [];
}
