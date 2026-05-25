"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Shield, Zap, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  onAuthOpen: () => void
}

export function Hero({ onAuthOpen }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-brand-tint via-background to-background">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-300/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-tint border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Sparkles size={14} />
              AI Powered
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-dark mb-6">
              Le Cloud IA{" "}
              <span className="gradient-text">Souverain</span>
              {" "}pour l&apos;Afrique
            </h1>

            <p className="text-lg sm:text-xl text-gray max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
              Sauvegardez, organisez et partagez vos fichiers en toute sécurité avec une intelligence artificielle intégrée. Conçu pour l&apos;Afrique, par des Africains.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" className="rounded-xl gap-2 group" onClick={onAuthOpen}>
                Commencer gratuitement
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl" className="rounded-xl gap-2">
                <Play size={18} />
                Voir la démo
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray">
                <Shield size={16} className="text-primary" />
                <span>Chiffré de bout en bout</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray">
                <Zap size={16} className="text-primary-light" />
                <span>IA intégrée</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-white border border-border shadow-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary-light/[0.03]" />

              <div className="absolute inset-0 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-dark/10" />
                    <div className="w-2 h-2 rounded-full bg-dark/10" />
                    <div className="w-2 h-2 rounded-full bg-dark/10" />
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                      </div>
                      <span className="text-xs text-gray">Documents</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-border w-3/4" />
                      <div className="h-2 rounded-full bg-border w-1/2" />
                    </div>
                  </div>

                  <div className="bg-background rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-xs text-gray">Images</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="aspect-square rounded-md bg-gradient-to-br from-purple-200 to-pink-200" />
                      <div className="aspect-square rounded-md bg-gradient-to-br from-cyan-200 to-blue-200" />
                      <div className="aspect-square rounded-md bg-gradient-to-br from-amber-200 to-orange-200" />
                    </div>
                  </div>

                  <div className="bg-background rounded-xl p-3 col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-xs text-gray">Assistant IA</span>
                      </div>
                      <span className="text-[10px] text-helper">Actif</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-light flex-shrink-0 flex items-center justify-center">
                        <Sparkles size={10} className="text-white" />
                      </div>
                      <p className="text-[11px] text-gray leading-relaxed">
                        &quot;J&apos;ai résumé 3 documents et trouvé 5 fichiers liés à votre projet.&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/20 blur-2xl animate-float" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-orange-300/20 blur-2xl animate-float-delayed" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
