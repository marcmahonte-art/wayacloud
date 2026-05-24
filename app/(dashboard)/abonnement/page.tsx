"use client";

import { useState } from "react";
import { Check, Crown, ShieldCheck, Zap, HardDrive, Loader2 } from "lucide-react";
import { formatAmountFcfa } from "@/lib/formatters";

const plans = [
  {
    id: "free",
    name: "Gratuit 5 Go",
    description: "5 Go offerts pour tester pendant 45 jours. L'espace repasse à 3 Go après l'essai.",
    priceMonthly: 0,
    priceYearly: 0,
    billedTextMonthly: "à vie",
    billedTextYearly: "à vie",
    features: [
      "5 Go d'espace cloud",
      "Chiffrement de bout en bout illimité",
      "Support par email",
    ],
    buttonText: "Commencer",
    buttonVariant: "outline",
    topBadge: null,
    bottomBadge: "Aucune carte requise",
    hasBorder: false,
  },
  {
    id: "whatsapp",
    name: "Sauve WhatsApp 20 Go",
    description: "Sécurisez ce qui est important pour vous. Documents, photos, factures, et plus :",
    priceMonthly: 150,
    priceYearly: 125, // 1500 / 12 for monthly equivalent when billed yearly, but we'll just show the monthly price
    billedTextMonthly: "facturé mensuellement",
    billedTextYearly: "facturé annuellement",
    features: [
      "20 Go d'espace cloud",
      "Chiffrement de bout en bout",
      "Partage de fichiers sécurisé",
      "Support prioritaire 24/7",
    ],
    buttonText: "Acheter",
    buttonVariant: "solid",
    topBadge: "Économisez 15%",
    bottomBadge: "Garantie 30 jours",
    hasBorder: false,
  },
  {
    id: "pro",
    name: "Waya Pro 50 Go",
    description: "Le juste milieu pour les indépendants. Stockez vos projets et médias.",
    priceMonthly: 250,
    priceYearly: 208, // 2500 / 12
    billedTextMonthly: "facturé mensuellement",
    billedTextYearly: "facturé annuellement",
    features: [
      "50 Go d'espace cloud",
      "Chiffrement de bout en bout",
      "Outils IA inclus (Tri, Résumé)",
      "Support prioritaire 24/7",
    ],
    buttonText: "Acheter",
    buttonVariant: "solid",
    topBadge: "Populaire",
    bottomBadge: "Garantie 30 jours",
    hasBorder: false,
  },
  {
    id: "premium",
    name: "Waya Premium 100 Go",
    description: "Pour tous vos besoins de stockage sécurisé. Sauvegardez photos et vidéos haute qualité.",
    priceMonthly: 500,
    priceYearly: 416, // 5000 / 12
    billedTextMonthly: "facturé mensuellement",
    billedTextYearly: "facturé annuellement",
    features: [
      "100 Go d'espace cloud",
      "Chiffrement de bout en bout",
      "Partage de fichiers sécurisé",
      "Support prioritaire 24/7",
    ],
    buttonText: "Acheter",
    buttonVariant: "solid",
    topBadge: "Économisez 16%",
    bottomBadge: "Garantie 30 jours",
    hasBorder: true,
  },
];

export default function AbonnementPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: any) => {
    if (plan.id === "free" || plan.id === "whatsapp") return; // "whatsapp" is currently the active one in this demo
    
    setIsLoading(plan.id);
    try {
      const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly * 12; // Calculate full price if needed, or pass exact amount.
      // For simplicity in this demo, let's just pass the monthly price if monthly, or yearly total if yearly
      const amountToPay = billingCycle === "monthly" ? plan.priceMonthly : (plan.id === "pro" ? 2500 : 5000); // 2500 for Pro, 5000 for Premium

      const res = await fetch("/api/checkout/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: amountToPay,
          name: plan.name,
        }),
      });
      
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Erreur lors de la redirection vers le paiement.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-12 pt-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
          Forfaits de stockage cloud sécurisés
        </h1>
        
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-dark" : "text-[#9CA3AF]"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative flex h-8 w-14 items-center rounded-full bg-primary px-1 transition-colors"
          >
            <div
              className={`h-6 w-6 rounded-full bg-white transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-2 ${billingCycle === "yearly" ? "text-dark" : "text-[#9CA3AF]"}`}>
            Annuel
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const billedText = billingCycle === "monthly" ? plan.billedTextMonthly : plan.billedTextYearly;
          
          // Dummy logic: determine if this is the current plan (id === "whatsapp")
          const isCurrentPlan = plan.id === "whatsapp";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[16px] bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 ${
                plan.hasBorder ? "border-[1.5px] border-slate-900" : "border border-slate-100"
              }`}
            >
              {plan.topBadge && billingCycle === "yearly" && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-green-100 px-4 py-1 text-xs font-bold text-green-700 whitespace-nowrap">
                  {plan.topBadge}
                </div>
              )}

              <div className="text-center flex flex-col items-center">
                <div className="min-h-[56px] flex items-center justify-center w-full">
                  <h2 className="text-xl font-medium text-slate-800">{plan.name}</h2>
                </div>
                
                <div className="mt-4 flex items-baseline justify-center text-slate-900 whitespace-nowrap w-full">
                  <span className="text-4xl xl:text-5xl font-bold tracking-tight">{price}</span>
                  <span className="ml-2 text-base xl:text-lg font-medium">FCFA</span>
                  <span className="ml-1 text-xs xl:text-sm text-slate-500 font-medium">/ mois</span>
                </div>
                
                <div className="mt-2 min-h-[20px] w-full">
                  <p className="text-xs font-medium text-violet-500">{billedText}</p>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || isLoading === plan.id}
                  className={`mt-6 w-full rounded-md py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-green-100 text-green-700 cursor-default"
                      : plan.buttonVariant === "solid"
                      ? "bg-[#FF7A00] text-white hover:bg-[#E66E00] shadow-sm shadow-[#FF7A00]/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isLoading === plan.id && <Loader2 className="animate-spin h-4 w-4" />}
                  {isCurrentPlan ? "Plan actuel" : plan.buttonText}
                </button>
              </div>

              <div className="mt-8 flex flex-col flex-grow">
                <div className="min-h-[60px] mb-6 w-full">
                  {plan.description && (
                    <p className="text-xs leading-5 text-slate-400">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
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
                    {plan.bottomBadge}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
