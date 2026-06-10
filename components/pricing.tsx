"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DISPLAY_PLANS, PLANS } from "@/lib/plans"
import { PLAN_ICONS } from "@/components/ui/PlanIcon"
import type { PlanKey } from "@/lib/plans"

const planOrder: PlanKey[] = DISPLAY_PLANS

function PlanCard({ planKey, index }: { planKey: PlanKey; index: number }) {
  const plan = PLANS[planKey]
  const Icon = PLAN_ICONS[planKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
          <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary-light px-4 py-1 text-xs font-semibold text-white shadow-sm">
            <Zap size={12} />
            Le plus populaire
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative flex h-full flex-col rounded-2xl p-6 transition-all duration-500",
          plan.popular
            ? "border-2 border-primary/30 bg-white shadow-[0_16px_48px_rgba(255,99,0,0.16)]"
            : "border border-[#EFE4DC] bg-white/95 shadow-[0_8px_32px_rgba(36,24,16,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(36,24,16,0.10)]",
        )}
      >
        <div className="mb-6 flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              plan.popular ? "bg-brand-tint" : "bg-[#F8F4EF]",
            )}
          >
            <Icon size={20} className={plan.popular ? "text-primary" : "text-gray"} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-dark">{plan.nameDisplay}</h3>
            {plan.storage && <p className="text-xs text-helper">{plan.storage} Go</p>}
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold leading-none text-dark">{plan.priceDisplay}</span>
            <span className="text-sm text-helper">{plan.periodLabel || "/ mois"}</span>
          </div>
          {plan.monthlyEquiv && (
            <p className="mt-2 text-center text-xs font-medium text-primary">
              Soit {plan.monthlyEquiv}
            </p>
          )}
        </div>

        <ul className="mb-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm leading-[1.45] text-gray">
              <Check size={15} className="mt-0.5 flex-shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button variant={plan.popular ? "default" : "outline"} className="mt-auto w-full" size="lg">
          {plan.price === 0 ? "Commencer" : "Choisir"}
        </Button>
      </div>
    </motion.div>
  )
}

export function Pricing() {
  return (
    <>
      <section
        id="pricing"
        className="relative overflow-hidden border-y border-[#F0E7DF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAF4EF_52%,#FFFDFC_100%)] py-16 sm:py-24 lg:py-32"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(255,99,0,0.09),transparent_62%)]" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-tint px-4 py-2 text-sm font-medium text-primary">
              <Sparkles size={14} />
              Tarifs
            </div>
            <h2 className="px-2 text-[clamp(2rem,9vw,3rem)] font-bold leading-[1.08] text-dark sm:text-4xl md:text-5xl">
              Des prix pensés pour l&apos;Afrique
            </h2>
            <p className="mx-auto mt-4 px-2 text-base leading-[1.6] text-gray sm:text-lg">
              Paiement par Orange Money, Moov Money, Wave. Aucune carte bancaire requise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
            {planOrder.map((key, i) => (
              <PlanCard key={key} planKey={key} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#EFE4DC] bg-white/75 px-6 py-4 text-center shadow-[0_8px_32px_rgba(36,24,16,0.05)]"
          >
            <p className="text-sm leading-[1.6] text-helper">
              Tous les prix sont en FCFA. Engagement selon le plan choisi. Satisfait ou remboursé pendant 30 jours.
              Vos données sont stockées au Burkina Faso.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative border-b border-[#F0E7DF] bg-[#F8F4EF] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              { icon: Shield, title: "Paiement sécurisé", desc: "Via Orange Money, Moov Money, Wave" },
              { icon: Check, title: "Satisfait ou remboursé", desc: "Pendant 30 jours sur tous les plans" },
              { icon: Sparkles, title: "Souveraineté des données", desc: "Hébergement au Burkina Faso" },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-[#EFE4DC] bg-white/85 p-6 text-center shadow-[0_8px_32px_rgba(36,24,16,0.05)]"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-tint text-primary">
                  <item.icon size={20} />
                </span>
                <h3 className="mb-2 text-sm font-bold text-dark">{item.title}</h3>
                <p className="text-xs leading-[1.5] text-gray">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
