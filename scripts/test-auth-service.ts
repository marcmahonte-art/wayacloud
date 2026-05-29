// scripts/test-auth-service.ts
import { signInWithEmail, sendPasswordResetEmail } from "../lib/auth/service";

const EMAIL = "test_user@example.com";
const PASSWORD = "Test1234!";

(async () => {
  console.log("🔹 Attempting sign-in...");
  const { error } = await signInWithEmail({ email: EMAIL, password: PASSWORD });
  if (error) {
    console.error("❌ Sign-in error:", error.message);
  } else {
    console.log("✅ Sign-in successful");
  }

  console.log("🔹 Requesting password reset...");
  const { error: resetError } = await sendPasswordResetEmail(EMAIL);
  if (resetError) {
    console.error("❌ Reset error:", resetError.message);
  } else {
    console.log("✅ Reset email sent");
  }
})();
