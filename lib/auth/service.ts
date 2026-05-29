import { createClient } from "@/lib/supabase/client"
import type { LoginInput, PhoneInput, OnboardingInput, AuthError } from "./types"
import { getAppUrl, getAuthCallbackUrl } from "./url"

const supabase = createClient()

export async function signInWithEmail(input: LoginInput): Promise<{ error?: AuthError }> {
  const { email, password } = input

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message === "Email not confirmed") {
      return { error: { message: "Veuillez confirmer votre adresse email", code: error.code } }
    }
    return {
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return {}
}

export async function signUpWithEmail(input: LoginInput & { referredBy?: string }): Promise<{ error?: AuthError }> {
  const { email, password, referredBy } = input

  const metadata: Record<string, string> = {}
  if (referredBy) metadata.referred_by = referredBy

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        options: { data: metadata },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: { message: getAuthErrorMessage(data.error), code: res.status.toString() } }
    }

    if (data.session) {
      const { createClient } = await import("@/lib/supabase/client")
      const client = createClient()
      await client.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    }

    return {}
  } catch {
    return { error: { message: "Erreur réseau. Vérifiez votre connexion" } }
  }
}

export async function signUpWithOnboarding(input: OnboardingInput): Promise<{
  error?: AuthError
  session: any | null
}> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.first_name,
            last_name: input.last_name,
            city: input.city,
            gender: input.gender,
            phone: input.phone || null,
          },
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        error: { message: getAuthErrorMessage(data.error), code: res.status.toString() },
        session: null,
      }
    }

    if (data.session) {
      const { createClient } = await import("@/lib/supabase/client")
      const client = createClient()
      await client.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    }

    return { session: data.session, error: undefined }
  } catch {
    return { error: { message: "Erreur réseau. Vérifiez votre connexion" }, session: null }
  }
}

export async function signInWithPhone(input: PhoneInput): Promise<{ error?: AuthError }> {
  const { phone } = input

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: "sms" },
  })

  if (error) {
    return {
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return {}
}

export async function signInWithEmailOtp(email: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
    },
  })

  if (error) {
    return {
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return {}
}

export async function signInWithGoogle(): Promise<{ error?: AuthError }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAuthCallbackUrl("/dashboard") },
  })

  if (error) {
    return { error: { message: getAuthErrorMessage(error.message) } }
  }

  if (data?.url) {
    window.location.href = data.url
  }
  return {}
}

export async function signInWithFacebook(): Promise<{ error?: AuthError }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo: getAuthCallbackUrl("/dashboard") },
  })

  if (error) {
    return { error: { message: getAuthErrorMessage(error.message) } }
  }

  if (data?.url) {
    window.location.href = data.url
  }
  return {}
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function sendPasswordResetEmail(email: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl("/reset-password"),
  })

  if (error) {
    console.error("[Auth] Password reset error:", error)
    return {
      error: {
        message: getAuthErrorMessage(error.message),
      },
    }
  }

  return {}
}

export async function updatePassword(password: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return {
      error: {
        message: getAuthErrorMessage(error.message),
      },
    }
  }

  return {}
}

export async function verifyOtp(email: string, token: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
    options: {
      redirectTo: `${getAppUrl()}/dashboard`,
    },
  })

  if (error) {
    return {
      error: {
        message: getAuthErrorMessage(error.message),
      },
    }
  }

  return {}
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

function getAuthErrorMessage(message: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "Email not confirmed": "Veuillez confirmer votre adresse email",
    "User already registered": "Un compte existe déjà avec cette adresse email",
    "Invalid email": "Adresse email invalide",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 8 caractères",
    "Rate limit exceeded": "Trop de tentatives. Veuillez réessayer dans quelques minutes",
    "Error sending confirmation email": "Erreur d'envoi de l'email de confirmation. Vérifiez que l'adresse email est correcte ou réessayez plus tard.",
    "Error sending verification email": "Erreur d'envoi de l'email de vérification. Veuillez réessayer.",
    "Error sending reset email": "Erreur d'envoi de l'email de réinitialisation. Veuillez réessayer.",
    "NetworkError": "Erreur réseau. Vérifiez votre connexion",
    "Failed to fetch": "Impossible de contacter le serveur",
    "Invalid email or OTP": "Email ou code invalide",
    "OTP has expired": "Le code a expiré. Veuillez en demander un nouveau.",
    "Email rate limit exceeded": "Trop d'emails envoyés. Veuillez réessayer dans quelques minutes.",
    "Signup requires a valid password": "Un mot de passe valide est requis",
  }

  return errorMap[message] || message || "Une erreur est survenue"
}
