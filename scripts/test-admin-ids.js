// scripts/test-admin-ids.js
import { getAdminIds } from "../lib/supabase/admin-utils.js";

(async () => {
  try {
    const ids = await getAdminIds();
    console.log("Admin IDs:", ids);
  } catch (err) {
    console.error("Error fetching admin IDs:", err);
    process.exit(1);
  }
})();
