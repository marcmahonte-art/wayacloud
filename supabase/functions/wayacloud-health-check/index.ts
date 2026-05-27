import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    // System health checks
    const checks: Record<string, string> = {};

    // 1. Database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from("health_checks")
      .select("id")
      .limit(1)
      .maybeSingle();
    checks.database = dbError ? "unhealthy" : "healthy";

    // 2. Storage (Wasabi) — try to list one object
    const { data: storageCheck, error: storageError } = await supabase.storage
      .from("wayacloud")
      .list("uploads/", { limit: 1 });
    checks.storage = storageError ? "unhealthy" : "healthy";

    // 3. Realtime — check publication exists
    const { data: pubCheck } = await supabase.rpc("check_realtime_health");
    checks.realtime = pubCheck ? "healthy" : "degraded";

    // 4. Cron jobs
    const { data: cronJobs } = await supabase.rpc("check_cron_health");
    checks.cron = cronJobs ? "healthy" : "degraded";

    // Overall status
    const allHealthy = Object.values(checks).every((s) => s === "healthy");
    const status = allHealthy ? "healthy" : "degraded";

    // Log health check
    await supabase.from("system_alerts").insert({
      type: "health_check",
      severity: status === "healthy" ? "info" : "warning",
      message: `Health check: ${status}`,
      metadata: checks,
    });

    return new Response(JSON.stringify({ status, checks, timestamp: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json" },
      status: allHealthy ? 200 : 503,
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
