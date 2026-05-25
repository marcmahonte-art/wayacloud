"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Qu'est-ce que WayaCloud ?",
    answer: "WayaCloud est une plateforme de stockage cloud souveraine avec intelligence artificielle intégrée, conçue spécialement pour les utilisateurs africains. Nous offrons un stockage sécurisé, un partage de fichiers et un assistant IA pour vous aider à gérer vos documents.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Nous utilisons un chiffrement AES-256 de bout en bout pour toutes vos données. Vos fichiers sont stockés en toute sécurité et ne sont accessibles que par vous et les personnes avec qui vous les partagez.",
  },
  {
    question: "Comment fonctionne l'assistant IA ?",
    answer: "Notre assistant IA peut résumer vos documents, répondre à des questions sur leur contenu, vous aider à retrouver des fichiers rapidement et suggérer des organisations intelligentes de vos données.",
  },
  {
    question: "Puis-je payer en FCFA ?",
    answer: "Oui ! Tous nos plans sont facturés en FCFA (Franc CFA), avec des prix adaptés au marché africain. Nous acceptons Orange Money, Moov Money et les cartes bancaires.",
  },
  {
    question: "Le support est-il disponible en Mooré ?",
    answer: "Oui, notre support client est disponible en français et en Mooré. Nous sommes fiers de pouvoir servir nos utilisateurs dans leur langue maternelle.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-tint border border-primary/20 text-primary text-sm font-medium mb-6">
            <HelpCircle size={14} />
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur WayaCloud.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-2xl bg-white border border-border shadow-card overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-medium text-dark pr-4">{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-gray transition-transform duration-300 flex-shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="px-5 pb-5 text-sm text-gray leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
