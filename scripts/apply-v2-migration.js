require('dotenv').config()
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uxwjvlbtmhvkgvfrdxdr.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "20260609002000_comprehensive_realtime_dashboard.sql")
  const fullSQL = fs.readFileSync(sqlPath, "utf8")

  console.log("Executing migration SQL...")
  console.log(`SQL size: ${fullSQL.length} bytes`)

  const res = await fetch("https://uxwjvlbtmhvkgvfrdxdr.supabase.co/auth/v1/admin/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: fullSQL })
  })
  console.log("Status:", res.status)
  const text = await res.text()
  console.log("Response:", text.substring(0, 1000))

  // Verify
  console.log("\n=== Verifying ===")
  const checks = [
    "dashboard_metrics",
    "system_health",
    "system_alerts",
    "activities",
    "get_activity_type_stats"
  ]
  for (const check of checks) {
    const r = await fetch(`https://uxwjvlbtmhvkgvfrdxdr.supabase.co/rest/v1/${check}?limit=1`, {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })
    console.log(`${check}: ${r.status} ${r.ok ? "OK" : "FAIL"}`)
    if (r.ok) {
      const data = await r.json()
      console.log(`  Data: ${JSON.stringify(data).substring(0, 200)}`)
    }
  }
}

main().catch(console.error)
