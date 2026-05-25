import { createClient } from "@/lib/supabase/client"
import type { LoginInput, PhoneInput, OnboardingInput, AuthError } from "./types"

const supabase = createClient()

export async function signInWithEmail(input: LoginInput): Promise<{ error?: AuthError }> {
  const { email, password } = input

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
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

export async function signUpWithEmail(input: LoginInput): Promise<{ error?: AuthError }> {
  const { email, password } = input

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: {} },
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

export async function signUpWithOnboarding(input: OnboardingInput): Promise<{
  error?: AuthError
  session: any | null
}> {
  const { error, data } = await supabase.auth.signUp({
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
  })

  if (error) {
    return {
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
      session: null,
    }
  }

  return { session: data.session, error: undefined }
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
  const { error } = await supabase.auth.signInWithOtp({ email })

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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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

export async function signInWithFacebook(): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function sendPasswordResetEmail(email: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
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
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
    "Rate limit exceeded": "Trop de tentatives. Veuillez réessayer dans quelques minutes",
    "NetworkError": "Erreur réseau. Vérifiez votre connexion",
    "Failed to fetch": "Impossible de contacter le serveur",
  }

  return errorMap[message] || message || "Une erreur est survenue"
}
