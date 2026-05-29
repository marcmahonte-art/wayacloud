// scripts/test-auth.ts
require('dotenv').config();

// Admin client (requires SERVICE_ROLE_KEY) to create a test user without email verification
// admin client sera créé directement avec la clé service_role (pas besoin d'importer server.ts)
// Browser client for sign‑in and password‑reset flows
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or anon key in env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'test_user@example.com'; // change if needed
const PASSWORD = 'Test1234!'; // at least 6 characters

(async () => {
// 1️⃣ Ensure the test user exists (admin creates or updates without sending email)
try {
  const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // Try to create the user; if it already exists we will get an error
  let user = null;
  try {
    const { data } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirmed_at: new Date().toISOString(),
    });
    user = data?.user;
  } catch (e) {
    // ignore creation error – user may already exist
  }
    if (!user) {
      // Fetch existing user by email from auth schema
      const { data: fetched, error: fetchErr } = await admin
        .from('users', { schema: 'auth' })
        .select('id')
        .eq('email', EMAIL)
        .single();
      if (fetchErr) {
        console.error('⚠️ Unable to fetch existing user:', fetchErr.message);
      }
      user = fetched ? { id: fetched.id } : null;
    }
  if (user) {
    await admin.auth.admin.updateUserById(user.id, { email_confirmed_at: new Date().toISOString() });
    console.log('✅ Test user ensured (admin create or update)');
  } else {
    console.error('⚠️ Unable to locate or create test user');
  }
} catch (e: any) {
  console.error('⚠️ Admin user handling error:', e?.message);
}

  // 2️⃣ Sign in with the test credentials
  console.log('\n🔹 2️⃣ Logging in...');
  const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (signInError) {
    console.error('❌ Login error:', signInError.message);
    return;
  }
  console.log('✅ Logged in. Session ID:', signInData.session?.access_token?.slice(0, 10) + '…');

  // 3️⃣ Request a password reset email
  console.log('\n🔹 3️⃣ Requesting password reset...');
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(EMAIL, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  if (resetError) {
    console.error('❌ Reset password error:', resetError.message);
    return;
  }
  console.log('✅ Reset email sent. Check your inbox (including spam).');

  console.log('\n🔚 Test finished.');
})();
