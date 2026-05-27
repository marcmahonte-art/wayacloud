"use client";

import { useState, useEffect } from "react";
import { Gift, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DbPlan {
  id: string
  name: string
  storage_go: number
  monthly_price_fcfa: number
}

export default function GiftPage() {
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
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
          setSelectedPlan(data[0].id);
        }
        setLoadingPlans(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !selectedPlan) return;

    setLoading(true);
    try {
      const plan = dbPlans.find(p => p.id === selectedPlan);
      if (!plan) return;
      const res = await fetch("/api/checkout/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.monthly_price_fcfa,
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
            {dbPlans.map((plan, index) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-[#ECE7DF] bg-white hover:border-[#D0C8BD]"
                }`}
              >
                {index === 1 && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-white uppercase">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-bold text-dark">{plan.name}</h3>
                <p className="text-sm text-[#69708A]">{plan.storage_go} Go</p>
                <p className="mt-2 text-xl font-black text-primary">
                  {plan.monthly_price_fcfa.toLocaleString("fr-FR")} <span className="text-sm font-bold text-[#69708A]">FCFA</span>
                </p>
              </button>
            ))}
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
              placeholder="Je t'offre un abonnement WayaCloud ! 🎉"
              maxLength={140}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-[#E3DFE8] bg-white px-4 py-3 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
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
