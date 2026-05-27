import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

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
  plan_name?: string
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

export const FREE_PLAN: SubscriptionData = {
  id: "free",
  plan_id: "free",
  plan_name: "Gratuit",
  plan_price: 0,
  is_active: true,
  is_trial: false,
  starts_at: new Date(0).toISOString(),
  ends_at: null,
  trial_ends_at: null,
}

export function isFreePlan(subscription: SubscriptionData | null): boolean {
  if (!subscription) return true
  return (
    subscription.plan_name === "Gratuit" ||
    subscription.plan_price === 0 ||
    !subscription.is_active
  )
}

export function getPlanDisplayName(subscription: SubscriptionData | null): string {
  if (isFreePlan(subscription)) return "Gratuit"
  return subscription?.plan_name || "Gratuit"
}

export function getPlanDisplayPrice(subscription: SubscriptionData | null): string {
  if (isFreePlan(subscription) || subscription?.plan_price === 0) return "0 FCFA / mois"
  return `${subscription!.plan_price.toLocaleString("fr-FR")} FCFA / mois`
}

export async function getProfile(): Promise<ProfileData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, full_name, phone, city, gender, role, avatar_url, referral_code, referred_by")
      .eq("id", user.id)
      .single()

    if (error || !data) return null
    return data as ProfileData
  } catch {
    return null
  }
}

export async function getStorageQuota(): Promise<StorageQuota | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("storage_quotas")
      .select("id, storage_limit_bytes, storage_used_bytes, plan_name")
      .eq("user_id", user.id)
      .single()

    if (error || !data) return null
    return data as StorageQuota
  } catch {
    return null
  }
}

const FREE_PLAN_FALLBACK = {
  id: "00000000-0000-0000-0000-000000000000",
  plan_id: "00000000-0000-0000-0000-000000000000",
  plan_name: "Gratuit",
  plan_price: 0,
  is_active: true,
  is_trial: false,
  starts_at: new Date(0).toISOString(),
  ends_at: null,
  trial_ends_at: null,
} satisfies SubscriptionData

export async function getSubscription(): Promise<SubscriptionData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, plan_id, is_active, is_trial, starts_at, ends_at, trial_ends_at, plan:plan_id(name, monthly_price_fcfa)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return FREE_PLAN_FALLBACK

    const plan = data.plan as unknown as { name: string; monthly_price_fcfa: number } | undefined

    return {
      id: data.id,
      plan_id: data.plan_id,
      plan_name: plan?.name ?? "Gratuit",
      plan_price: plan?.monthly_price_fcfa ?? 0,
      is_active: data.is_active ?? true,
      is_trial: data.is_trial ?? false,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      trial_ends_at: data.trial_ends_at,
    }
  } catch {
    return FREE_PLAN_FALLBACK
  }
}

export function getRemainingTrialDays(subscription: SubscriptionData | null): number {
  if (!subscription?.is_trial || !subscription.trial_ends_at) return 0
  try {
    const now = new Date()
    const end = new Date(subscription.trial_ends_at)
    const diffMs = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  } catch {
    return 0
  }
}
