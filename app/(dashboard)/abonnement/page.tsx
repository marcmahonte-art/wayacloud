"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Tag, X, Crown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/AuthProvider"
import { isFreePlan } from "@/lib/profile"
import { logger } from "@/lib/logger"

interface DbPlan {
  id: string
  name: string
  storage_go: number
  monthly_price_fcfa: number
}

const PLAN_FEATURES: Record<string, string[]> = {
  "Gratuit": [
    "5 Go d'espace cloud",
    "Chiffrement de bout en bout",
    "Support par email",
    "Partage de fichiers sécurisé",
  ],
  "Essentiel": [
    "20 Go d'espace cloud",
    "Chiffrement de bout en bout",
    "Partage de fichiers sécurisé",
    "Support prioritaire 24/7",
    "Outils IA inclus",
  ],
  "Famille": [
    "100 Go d'espace cloud",
    "Chiffrement de bout en bout",
    "Partage de fichiers sécurisé",
    "Support prioritaire 24/7",
    "Outils IA inclus",
    "Jusqu'à 5 membres",
  ],
  "Business": [
    "500 Go d'espace cloud",
    "Chiffrement de bout en bout",
    "Partage de fichiers sécurisé",
    "Support dédié 24/7",
    "Outils IA inclus",
    "Membres illimités",
    "Sauvegarde catalogue WhatsApp Business",
  ],
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  "Gratuit": "Pour découvrir WayaCloud. Stockez vos premiers fichiers en toute sécurité.",
  "Essentiel": "L'essentiel pour sécuriser vos documents, photos et factures.",
  "Famille": "Idéal pour toute la famille. Partagez et stockez sans limite.",
  "Business": "Solution professionnelle avec stockage massif et support dédié.",
}

export default function AbonnementPage() {
  const { subscription, remainingTrialDays } = useAuth()
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [promo, setPromo] = useState<{ id: string; discountPercent: number } | null>(null)
  const [promoError, setPromoError] = useState("")
  const [promoChecking, setPromoChecking] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const { data } = await supabase
          .from("storage_plans")
          .select("id, name, storage_go, monthly_price_fcfa")
          .eq("is_active", true)
          .order("monthly_price_fcfa", { ascending: true })
        if (data) setDbPlans(data)
      } catch {
        // silent
      } finally {
        setLoadingPlans(false)
      }
    })()
  }, [])

  const handlePromoCheck = async () => {
    if (!promoCode.trim()) return
    setPromoChecking(true)
    setPromoError("")
    setPromo(null)
    try {
      const res = await fetch("/api/promo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromo({ id: data.id, discountPercent: data.discountPercent })
      } else {
        setPromoError(data.message || "Code invalide")
      }
    } catch {
      setPromoError("Erreur de vérification")
    } finally {
      setPromoChecking(false)
    }
  }

  const handleSubscribe = async (plan: DbPlan) => {
    if (plan.monthly_price_fcfa === 0) return
    setIsLoading(plan.id)
    try {
      const amountToPay = plan.monthly_price_fcfa
      const finalAmount = promo ? Math.round(amountToPay * (1 - promo.discountPercent / 100)) : amountToPay
      const res = await fetch("/api/checkout/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: finalAmount,
          name: plan.name,
          promoCodeId: promo?.id || null,
        }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      logger.error("Subscription payment failed", error)
    } finally {
      setIsLoading(null)
    }
  }

  const currentPlanName = isFreePlan(subscription) ? "Gratuit" : subscription?.plan_name || "Gratuit"
  const isCurrentTrial = remainingTrialDays > 0

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl pb-12 pt-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
          Forfaits de stockage cloud sécurisés
        </h1>
        <div className="mt-4 mx-auto max-w-sm">
          <div className="flex items-center gap-2 rounded-xl border border-[#E3DFE8] bg-white px-4 py-2 shadow-sm">
            <Tag size={16} className="text-[#69708A]" />
            <input
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromo(null); setPromoError("") }}
              placeholder="Code promo"
              className="flex-1 bg-transparent text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && handlePromoCheck()}
            />
            {promoChecking ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : promo ? (
              <button onClick={() => { setPromo(null); setPromoCode("") }}>
                <X size={16} className="text-red-500" />
              </button>
            ) : (
              <button onClick={handlePromoCheck} className="text-xs font-bold text-primary">
                Appliquer
              </button>
            )}
          </div>
          {promo && (
            <p className="mt-1 text-xs font-semibold text-green-600">
              -{promo.discountPercent}% de réduction appliqué
            </p>
          )}
          {promoError && (
            <p className="mt-1 text-xs font-semibold text-red-500">{promoError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dbPlans.map((plan) => {
          const price = plan.monthly_price_fcfa
          const isFree = price === 0 || plan.name === "Gratuit"
          const isCurrentPlan = plan.name === currentPlanName
          const hasDiscount = promo && !isFree
          const discountPrice = hasDiscount ? Math.round(price * (1 - promo!.discountPercent / 100)) : price
          const features = PLAN_FEATURES[plan.name] ?? [`${plan.storage_go} Go d'espace cloud`]
          const description = PLAN_DESCRIPTIONS[plan.name] ?? ""

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[16px] bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 ${
                isCurrentPlan ? "border-[1.5px] border-primary ring-1 ring-primary/20" : "border border-slate-100"
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white whitespace-nowrap shadow-sm">
                  {isCurrentTrial ? "Essai en cours" : isFree ? "Plan actuel" : "Plan actuel"}
                </div>
              )}

              {!isCurrentPlan && plan.name === "Famille" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-green-100 px-4 py-1 text-xs font-bold text-green-700 whitespace-nowrap">
                  Populaire
                </div>
              )}

              <div className="text-center flex flex-col items-center">
                <div className="min-h-[56px] flex items-center justify-center w-full">
                  {isFree && isCurrentPlan && (
                    <span className="mr-2 text-primary"><Crown size={20} /></span>
                  )}
                  <h2 className="text-xl font-medium text-slate-800">{plan.name}</h2>
                  <span className="ml-2 text-xs text-slate-400">({plan.storage_go || 5} Go)</span>
                </div>

                <div className="mt-4 flex items-baseline justify-center text-slate-900 whitespace-nowrap w-full">
                  {hasDiscount && (
                    <span className="mr-2 text-lg font-medium text-slate-400 line-through">{price.toLocaleString("fr-FR")}</span>
                  )}
                  {isFree ? (
                    <span className="text-4xl xl:text-5xl font-bold tracking-tight">Gratuit</span>
                  ) : (
                    <>
                      <span className="text-4xl xl:text-5xl font-bold tracking-tight">{discountPrice.toLocaleString("fr-FR")}</span>
                      <span className="ml-2 text-base xl:text-lg font-medium">FCFA</span>
                      <span className="ml-1 text-xs xl:text-sm text-slate-500 font-medium">/ mois</span>
                    </>
                  )}
                </div>

                {isFree && (
                  <p className="mt-1 text-sm font-medium text-green-600">0 FCFA / mois</p>
                )}

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || isLoading === plan.id}
                  className={`mt-6 w-full rounded-md py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-green-100 text-green-700 cursor-default"
                      : isFree
                      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-[#FF7A00] text-white hover:bg-[#E66E00] shadow-sm shadow-[#FF7A00]/20"
                  }`}
                >
                  {isLoading === plan.id && <Loader2 className="animate-spin h-4 w-4" />}
                  {isCurrentPlan
                    ? isFree
                      ? "Plan Gratuit"
                      : "Plan actuel"
                    : isFree
                    ? "Commencer"
                    : "S'abonner"}
                </button>
              </div>

              <div className="mt-8 flex flex-col flex-grow">
                {description && (
                  <div className="min-h-[60px] mb-6 w-full">
                    <p className="text-xs leading-5 text-slate-400">{description}</p>
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 text-violet-500">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-white">
                      <Check size={10} strokeWidth={4} />
                    </div>
                    {isFree ? "Aucune carte requise" : "Garantie 30 jours"}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
