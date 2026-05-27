export type AuthTab = "email" | "phone"

export interface LoginInput {
  email: string
  password: string
}

export interface PhoneInput {
  phone: string
}

export interface OnboardingInput {
  email: string
  password: string
  first_name: string
  last_name: string
  city: string
  gender: string
  phone?: string
}

export interface AuthState {
  user: any | null
  session: any | null
  loading: boolean
}

export interface AuthError {
  message: string
  code?: string
}

export interface ProfileData {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string | null
  city: string | null
  gender: string | null
  role: string
  avatar_url?: string | null
  referral_code?: string | null
  referred_by?: string | null
}

export interface StorageQuota {
  id: string
  storage_limit_bytes: number
  storage_used_bytes: number
}

export interface SubscriptionData {
  id: string
  plan_id: string
  plan_name: string
  plan_price: number
  is_active: boolean
  is_trial: boolean
  starts_at: string
  ends_at: string | null
  trial_ends_at: string | null
}
