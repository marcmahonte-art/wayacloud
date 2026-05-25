"use client"

import { motion } from "framer-motion"
import { Shield, Sparkles, Database, Globe, Lock, Bot, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Shield,
    title: "Stockage souverain",
    description: "Données protégées, accès contrôlés et partage sécurisé pour les particuliers et PME du Burkina Faso.",
    color: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Sparkles,
    title: "IA intégrée",
    description: "Résumé de documents, assistant intelligent et recherche plus rapide dans les fichiers.",
    color: "from-purple-100 to-purple-50",
    iconColor: "text-purple-500",
  },
  {
    icon: Database,
    title: "Plans en Go",
    description: "Offres claires en FCFA, pensées pour Bobo-Dioulasso, Koudougou et Ouagadougou.",
    color: "from-emerald-100 to-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    icon: Globe,
    title: "Support en Mooré",
    description: "Interface en français et support client en Mooré pour une expérience vraiment locale.",
    color: "from-amber-100 to-amber-50",
    iconColor: "text-amber-500",
  },
  {
    icon: Lock,
    title: "Chiffrement avancé",
    description: "Protection AES-256 de bout en bout pour vos données les plus sensibles.",
    color: "from-rose-100 to-rose-50",
    iconColor: "text-rose-500",
  },
  {
    icon: Bot,
    title: "Assistant intelligent",
    description: "Un assistant IA qui apprend de vos habitudes pour vous aider à mieux organiser vos fichiers.",
    color: "from-cyan-100 to-cyan-50",
    iconColor: "text-cyan-500",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-tint border border-primary/20 text-primary text-sm font-medium mb-6">
            <Cloud size={14} />
            Fonctionnalités
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Une plateforme complète conçue pour répondre aux besoins de stockage et de collaboration en Afrique.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative p-6 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-full">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                  feature.color
                )}>
                  <feature.icon size={24} className={feature.iconColor} />
                </div>
                <h3 className="text-lg font-semibold text-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
