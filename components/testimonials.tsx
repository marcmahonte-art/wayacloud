"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Aminata Ouédraogo",
    role: "Entrepreneure, Ouagadougou",
    content: "WayaCloud a révolutionné la gestion de mes documents professionnels. L'assistant IA me fait gagner un temps précieux au quotidien.",
    rating: 5,
  },
  {
    name: "Issa Traoré",
    role: "Développeur, Bobo-Dioulasso",
    content: "Enfin une solution cloud qui respecte la souveraineté de nos données. Le support en Mooré est un vrai plus pour la communauté.",
    rating: 5,
  },
  {
    name: "Fatimata Sawadogo",
    role: "PME, Koudougou",
    content: "Les tarifs en FCFA et adaptés au marché africain m'ont convaincue. Le service client est réactif et professionnel.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Découvrez ce que nos utilisateurs disent de WayaCloud.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative p-6 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-full">
                <Quote size={24} className="text-primary/20 mb-4" />
                <p className="text-sm text-gray leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">{testimonial.name}</p>
                  <p className="text-xs text-helper">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
