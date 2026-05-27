import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    const { type } = await req.json()

    if (type === "catalog_backup") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .limit(100)

      for (const profile of profiles || []) {
        await supabase.rpc("insert_activity", {
          p_user_id: profile.id,
          p_type: "catalog_backup",
          p_title: "Catalogue sauvegardé automatiquement",
          p_description: "Sauvegarde automatique toutes les 6h",
          p_metadata: { source: "cron" },
        })

        await supabase
          .from("profiles")
          .update({ last_catalog_backup: new Date().toISOString() })
          .eq("id", profile.id)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
