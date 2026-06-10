"use client";

import { useState, useEffect } from "react";
import { Gift, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DISPLAY_PLANS, PLANS } from "@/lib/plans";
import { PLAN_ICONS } from "@/components/ui/PlanIcon";
import type { PlanKey } from "@/lib/plans";

interface DbPlan {
  id: string
  name: string
  storage_go: number
  monthly_price_fcfa: number
}

const DB_PLAN_MAP: Record<string, PlanKey> = {
  Essentiel: "whatsapp_1500",
  Famille: "famille_3999",
  Business: "pro_6999",
}

const PAID_PLANS = DISPLAY_PLANS.filter((k) => k !== "free")

export default function GiftPage() {
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("whatsapp_1500");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("storage_plans")
      .select("id, name, storage_go, monthly_price_fcfa")
      .eq("is_active", true)
      .gt("monthly_price_fcfa", 0)
      .order("monthly_price_fcfa", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbPlans(data);
        }
        setLoadingPlans(false);
      });
  }, []);

  const findDbPlan = (planKey: PlanKey): DbPlan | undefined => {
    for (const db of dbPlans) {
      if (DB_PLAN_MAP[db.name] === planKey) return db
    }
    return undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !selectedPlan) return;

    setLoading(true);
    try {
      const planKey = selectedPlan as PlanKey
      const plan = PLANS[planKey]
      const dbPlan = findDbPlan(planKey)
      if (!dbPlan) return;
      const res = await fetch("/api/checkout/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: dbPlan.id,
          amount: plan.price,
          name: `Cadeau ${plan.name}`,
          is_gift: true,
          gift_recipient_phone: phone,
          gift_message: message.slice(0, 140),
        }),
      });

      const data = await res.json();
      if (data.paymentUrl) {
        setSuccess(true);
        window.open(data.paymentUrl, "_blank");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <div className="rounded-2xl border border-[#ECE7DF] bg-white p-10 shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-dark">Paiement en cours</h2>
          <p className="mt-2 text-[#69708A]">
            Une fois le paiement confirmé, votre destinataire recevra son abonnement par SMS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
          <Gift size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-dark">Offrir un abonnement</h1>
        <p className="mt-2 text-[#69708A]">
          Offrez le cloud sécurisé WayaCloud à un proche
        </p>
      </div>

      {loadingPlans ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {PAID_PLANS.map((planKey, index) => {
              const plan = PLANS[planKey]
              const Icon = PLAN_ICONS[planKey]
              return (
                <button
                  key={planKey}
                  type="button"
                  onClick={() => setSelectedPlan(planKey)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                    selectedPlan === planKey
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-[#ECE7DF] bg-white hover:border-[#D0C8BD]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-white uppercase whitespace-nowrap">
                      Populaire
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-tint flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-dark">{plan.nameDisplay}</h3>
                      <p className="text-xs text-[#69708A]">{plan.storage} Go</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-primary">
                    {plan.price.toLocaleString("fr-FR")}{" "}
                    <span className="text-sm font-bold text-[#69708A]">F</span>
                  </p>
                  {plan.periodLabel && (
                    <p className="text-xs text-[#69708A]">{plan.periodLabel}</p>
                  )}
                  {plan.monthlyEquiv && (
                    <p className="text-xs text-primary font-semibold mt-1">{plan.monthlyEquiv}</p>
                  )}
                </button>
              )
            })}
          </div>

          <div>
            <label className="block text-sm font-bold text-dark">Numéro du destinataire</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+226 XX XX XX XX"
              required
              className="mt-1.5 w-full rounded-lg border border-[#E3DFE8] bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-dark">
              Message personnalisé <span className="font-normal text-[#69708A]">({message.length}/140)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 140))}
              placeholder="Je t'offre un abonnement WayaCloud !"
              maxLength={140}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-[#E3DFE8] bg-white px-4 py-3 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone || !selectedPlan}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary py-4 text-base font-bold text-white shadow-lg transition hover:bg-primary-light disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Gift size={20} />
            )}
            {loading ? "Redirection vers CinetPay..." : "Payer avec CinetPay"}
          </button>
        </form>
      )}
    </div>
  );
}
