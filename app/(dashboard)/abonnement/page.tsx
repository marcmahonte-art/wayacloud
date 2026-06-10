"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Tag, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/AuthProvider"
import { isFreePlan } from "@/lib/profile"
import { logger } from "@/lib/logger"
import { DISPLAY_PLANS, PLANS } from "@/lib/plans"
import { PLAN_ICONS } from "@/components/ui/PlanIcon"
import type { PlanKey } from "@/lib/plans"

interface DbPlan {
  id: string
  name: string
  storage_go: number
  monthly_price_fcfa: number
}

const DB_PLAN_MAP: Record<string, PlanKey> = {
  Gratuit: "free",
  Essentiel: "whatsapp_1500",
  Famille: "famille_3999",
  Business: "pro_6999",
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

  const findDbPlan = (planKey: PlanKey): DbPlan | undefined => {
    for (const db of dbPlans) {
      if (DB_PLAN_MAP[db.name] === planKey) return db
    }
    return undefined
  }

  const handleSubscribe = async (planKey: PlanKey) => {
    const dbPlan = findDbPlan(planKey)
    if (!dbPlan) return
    setIsLoading(planKey)
    try {
      const amountToPay = PLANS[planKey].price
      if (amountToPay === 0) { setIsLoading(null); return }
      const finalAmount = promo ? Math.round(amountToPay * (1 - promo.discountPercent / 100)) : amountToPay
      const res = await fetch("/api/checkout/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: dbPlan.id,
          amount: finalAmount,
          name: PLANS[planKey].name,
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

  const getCurrentPlanKey = (): PlanKey => {
    return DB_PLAN_MAP[currentPlanName] || "free"
  }

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
          Choisissez votre formule
        </h1>
        <p className="mt-3 text-gray max-w-lg mx-auto">
          Paiement par Orange Money, Moov Money, Wave. Aucune carte bancaire requise.
        </p>

        <div className="mt-6 mx-auto max-w-sm">
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {DISPLAY_PLANS.map((planKey) => {
          const plan = PLANS[planKey]
          const Icon = PLAN_ICONS[planKey]
          const dbPlan = findDbPlan(planKey)
          const price = plan.price
          const isFree = price === 0
          const currentKey = getCurrentPlanKey()
          const isCurrentPlan = planKey === currentKey
          const hasDiscount = promo && !isFree
          const discountPrice = hasDiscount ? Math.round(price * (1 - promo!.discountPercent / 100)) : price

          return (
            <div
              key={planKey}
              className={`relative flex flex-col rounded-[16px] bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 ${
                isCurrentPlan ? "border-[1.5px] border-primary ring-1 ring-primary/20" : "border border-slate-100"
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white whitespace-nowrap shadow-sm">
                  {isCurrentTrial ? "Essai en cours" : "Plan actuel"}
                </div>
              )}

              {!isCurrentPlan && plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-100 px-4 py-1 text-xs font-bold text-orange-700 whitespace-nowrap">
                  Populaire
                </div>
              )}

              <div className="text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-tint flex items-center justify-center mb-3">
                  <Icon size={28} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{plan.nameDisplay}</h2>
                <p className="text-xs text-slate-400">{plan.storage} Go</p>

                <div className="mt-4 flex flex-col items-center text-slate-900 w-full">
                  {hasDiscount && (
                    <span className="text-lg font-medium text-slate-400 line-through">{price.toLocaleString("fr-FR")} F</span>
                  )}
                  {isFree ? (
                    <span className="text-3xl xl:text-4xl font-bold tracking-tight">Gratuit</span>
                  ) : (
                    <>
                      <span className="text-3xl xl:text-4xl font-bold tracking-tight">
                        {discountPrice.toLocaleString("fr-FR")} F
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5">
                        {plan.periodLabel || "/ mois"}
                      </span>
                    </>
                  )}
                  {plan.monthlyEquiv && (
                    <span className="text-xs text-primary font-semibold mt-1">{plan.monthlyEquiv}</span>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isCurrentPlan || isLoading === planKey}
                  className={`mt-4 w-full rounded-md py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-green-100 text-green-700 cursor-default"
                      : isFree
                      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-[#FF7A00] text-white hover:bg-[#E66E00] shadow-sm shadow-[#FF7A00]/20"
                  }`}
                >
                  {isLoading === planKey && <Loader2 className="animate-spin h-4 w-4" />}
                  {isCurrentPlan
                    ? isFree ? "Plan Gratuit" : "Plan actuel"
                    : isFree ? "Commencer" : "S'abonner"}
                </button>
              </div>

              <div className="mt-6 flex flex-col flex-grow">
                <p className="text-xs leading-5 text-slate-400 mb-4">{plan.description}</p>

                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-primary shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600">
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
