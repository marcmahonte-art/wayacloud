import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password, options } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message === "User already registered") {
        return NextResponse.json({ error: "Un compte existe déjà avec cette adresse email" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
    }

    // Set metadata separately (avoids trigger issues with some fields)
    const metadata: Record<string, any> = options?.data ? { ...options.data } : {};
    if (metadata.gender) {
      metadata.gender = metadata.gender.toLowerCase();
    }
    if (Object.keys(metadata).length > 0) {
      await supabase.auth.admin.updateUserById(data.user.id, {
        user_metadata: metadata,
      });
    }

    // Sign in the user so they get a session immediately
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json({
        user: { id: data.user.id, email: data.user.email },
        session: null,
      });
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        confirmed_at: data.user.email_confirmed_at,
      },
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
      },
    });
  } catch (err) {
    console.error("[Auth Signup] Unexpected error:", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
