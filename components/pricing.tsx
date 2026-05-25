"use client"

import { motion } from "framer-motion"
import { Check, Cloud, Zap, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Pour découvrir le cloud souverain",
    features: [
      "5 Go de stockage",
      "Partage de fichiers",
      "Assistant IA basique",
      "Support par email",
      "Chiffrement standard",
    ],
    popular: false,
    icon: Cloud,
  },
  {
    name: "Pro",
    price: "4 900",
    description: "Pour les professionnels exigeants",
    features: [
      "50 Go de stockage",
      "Partage avancé",
      "IA intégrée complète",
      "Support prioritaire",
      "Chiffrement AES-256",
      "Analyse de documents",
    ],
    popular: true,
    icon: Zap,
  },
  {
    name: "Business",
    price: "14 900",
    description: "Pour les équipes et entreprises",
    features: [
      "200 Go de stockage",
      "Collaboration en équipe",
      "IA avancée + API",
      "Support dédié 24/7",
      "Chiffrement de bout en bout",
      "Export de données",
      "SLA garantie",
    ],
    popular: false,
    icon: Shield,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 bg-gradient-to-b from-transparent via-brand-tint to-transparent">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-tint border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles size={14} />
            Tarifs
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark mb-4">
            Des prix clairs et abordables
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Des offres pensées pour le pouvoir d&apos;achat africain, sans surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-xs font-semibold shadow-sm">
                    <Zap size={12} />
                    Le plus populaire
                  </div>
                </div>
              )}

              <div className={cn(
                "relative h-full p-8 rounded-2xl transition-all duration-500",
                plan.popular
                  ? "bg-white border-2 border-primary/30 shadow-glow"
                  : "bg-white border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1"
              )}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    plan.popular ? "bg-brand-tint" : "bg-background"
                  )}>
                    <plan.icon size={20} className={plan.popular ? "text-primary" : "text-gray"} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark">{plan.name}</h3>
                    <p className="text-xs text-helper">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-dark">{plan.price}</span>
                    <span className="text-sm text-helper">FCFA/mois</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray">
                      <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  {plan.popular ? "Commencer" : "Choisir"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
