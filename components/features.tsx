"use client"

import { motion } from "framer-motion"
import { Shield, Sparkles, Database, Globe, Lock, Bot, Cloud } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Stockage souverain",
    description: "Données protégées, accès contrôlés et partage sécurisé pour les particuliers et PME du Burkina Faso.",
  },
  {
    icon: Sparkles,
    title: "IA intégrée",
    description: "Résumé de documents, assistant intelligent et recherche plus rapide dans les fichiers.",
  },
  {
    icon: Database,
    title: "Plans en Go",
    description: "Offres claires en FCFA, pensées pour Bobo-Dioulasso, Koudougou et Ouagadougou.",
  },
  {
    icon: Globe,
    title: "Support en Mooré",
    description: "Interface en français et support client en Mooré pour une expérience vraiment locale.",
  },
  {
    icon: Lock,
    title: "Chiffrement avancé",
    description: "Protection AES-256 de bout en bout pour vos données les plus sensibles.",
  },
  {
    icon: Bot,
    title: "Assistant intelligent",
    description: "Un assistant IA qui apprend de vos habitudes pour vous aider à mieux organiser vos fichiers.",
  },
]

interface FeaturesProps {
  onGetStarted?: () => void
  onAuthOpen?: () => void
}

export function Features({ onGetStarted, onAuthOpen }: FeaturesProps = {}) {
  return (
    <>
      <section
        id="features"
        className="relative overflow-hidden border-y border-[#F0E7DF] bg-[linear-gradient(180deg,#FFFDFC_0%,#FAF4EF_48%,#FFFFFF_100%)] py-16 sm:py-24 lg:py-32"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(255,99,0,0.10),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-tint px-4 py-2 text-sm font-medium text-primary">
              <Cloud size={14} />
              Fonctionnalités
            </div>
            <h2 className="px-2 text-[clamp(2rem,9vw,3rem)] font-bold leading-[1.08] text-dark sm:text-4xl md:text-5xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mx-auto mt-4 px-2 text-base leading-[1.6] text-gray sm:text-lg">
              Une plateforme complète conçue pour répondre aux besoins de stockage et de collaboration en Afrique.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-full rounded-2xl border border-[#EFE4DC] bg-white/95 p-6 shadow-[0_8px_32px_rgba(36,24,16,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(36,24,16,0.10)] sm:p-6">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-[#FFF7F2] text-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold leading-tight text-dark">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-[1.6] text-gray">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[#F0E7DF] bg-[#F8F4EF] py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/80 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 text-center sm:px-8 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-[#EFE4DC] bg-white/80 p-6 shadow-[0_12px_40px_rgba(36,24,16,0.07)] backdrop-blur sm:p-8"
          >
            <h2 className="px-2 text-[clamp(1.75rem,8vw,2.5rem)] font-bold leading-[1.12] text-dark">
              Prêt à transformer votre gestion de fichiers ?
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-xl px-2 text-base leading-[1.6] text-gray sm:text-lg">
              Rejoignez +24k créateurs africains qui font confiance à WayaCloud.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={onGetStarted}
                className="w-full rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,99,0,0.35)] transition-all hover:bg-primary-light sm:w-auto"
              >
                Essayer gratuitement
              </button>
              <button
                onClick={onAuthOpen}
                className="w-full rounded-xl border border-[#E6DDD6] bg-white px-8 py-3 text-sm font-semibold text-dark transition-all hover:bg-brand-tint sm:w-auto"
              >
                En savoir plus
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
