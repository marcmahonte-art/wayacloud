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

export async function getProfile(): Promise<ProfileData | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, phone, city, gender, role")
    .eq("id", user.id)
    .single()

  if (error || !data) return null
  return data as ProfileData
}

export async function getStorageQuota(): Promise<StorageQuota | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("storage_quotas")
    .select("id, storage_limit_bytes, storage_used_bytes")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null
  return data as StorageQuota
}

export async function getSubscription(): Promise<SubscriptionData | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, plan_id, is_active, is_trial, starts_at, ends_at, trial_ends_at, plan:plan_id(name, monthly_price_fcfa)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const plan = data.plan as unknown as { name: string; monthly_price_fcfa: number } | undefined

  return {
    id: data.id,
    plan_id: data.plan_id,
    plan_name: plan?.name ?? "Gratuit",
    plan_price: plan?.monthly_price_fcfa ?? 0,
    is_active: data.is_active,
    is_trial: data.is_trial ?? false,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    trial_ends_at: data.trial_ends_at,
  }
}

export function getRemainingTrialDays(subscription: SubscriptionData | null): number {
  if (!subscription?.is_trial || !subscription.trial_ends_at) return 0

  const now = new Date()
  const end = new Date(subscription.trial_ends_at)
  const diffMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}
