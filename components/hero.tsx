"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"

interface HeroProps {
  onAuthOpen: () => void
  onGetStarted: () => void
}

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/features" },
  { label: "Tarifs", href: "/pricing" },
]

const statCards = [
  { value: "+120k", label: "fichiers protégés" },
  { value: "+8 To", label: "archives numériques stockées" },
  { value: "+24k", label: "créateurs utilisent wayacloud" },
]

export function Hero({ onAuthOpen, onGetStarted }: HeroProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <section className="relative h-screen max-h-screen w-full overflow-hidden bg-black font-readex">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.08),transparent_70%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]" />

      <nav className="absolute left-0 right-0 top-0 z-30 flex h-[80px] items-center px-6 md:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#FF6B00"/>
            </svg>
            <span className="text-lg font-semibold text-white">WayaCloud</span>
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[15px] text-white/60 transition-all duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={onAuthOpen}
              className="text-[15px] text-white/60 transition-all duration-200 hover:text-white"
            >
              Connexion
            </button>
          </div>

          <div className="hidden items-center lg:flex">
            <button
              onClick={onGetStarted}
              className="rounded-xl bg-[#FF6B00] px-6 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#FF7A1A]"
            >
              Essayer gratuitement
            </button>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-200 hover:bg-white/20 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-40 flex w-[85vw] max-w-sm flex-col rounded-l-[24px] border-l border-white/10 bg-white/10 p-6 pt-[calc(env(safe-area-inset-top)+24px)] shadow-lg backdrop-blur-xl sm:p-8"
          >
            <button
              className="mb-6 flex h-10 w-10 items-center justify-center self-end rounded-xl bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <nav className="mt-4 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg text-white/70 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setMobileOpen(false); onAuthOpen?.() }}
                className="w-full rounded-xl border border-white/20 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              >
                Connexion
              </button>
              <button
                onClick={() => { setMobileOpen(false); onGetStarted?.() }}
                className="w-full rounded-xl bg-[#FF6B00] py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#FF7A1A]"
              >
                Essayer gratuitement
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 top-[80px] bottom-[100px] md:bottom-[120px] z-10 flex flex-col justify-center px-6 sm:px-10 md:px-20 lg:px-24">
        <div className="mx-auto w-full max-w-7xl">
          {/* Word 1 - Stocke. */}
          <motion.h1
            className="select-none font-bold leading-[1.1] text-white"
            style={{
              fontSize: "clamp(2.2rem, min(8vw, 12vh), 6rem)",
            }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Stocke.
          </motion.h1>

          {/* Word 2 - Protège. */}
          <motion.span
            className="block select-none font-bold leading-[1.1] text-[#FFD0B3]"
            style={{
              fontSize: "clamp(1.9rem, min(7vw, 10.5vh), 5.5rem)",
              marginTop: "clamp(0.1rem, min(0.5vw, 0.8vh), 0.4rem)",
              marginLeft: "clamp(0.75rem, 4vw, 3rem)",
            }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Protège.
          </motion.span>

          {/* Word 3 - Retrouve. */}
          <motion.span
            className="block select-none font-bold leading-[1.1] text-white"
            style={{
              fontSize: "clamp(1.7rem, min(6vw, 9.5vh), 5rem)",
              marginTop: "clamp(0.1rem, min(0.5vw, 0.8vh), 0.4rem)",
              marginLeft: "clamp(1.5rem, 8vw, 6rem)",
            }}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Retrouve.
          </motion.span>

          {/* Description */}
          <motion.p
            className="max-w-[540px] text-sm leading-relaxed text-white/90 sm:text-base md:text-lg"
            style={{ marginTop: "clamp(0.8rem, 3vh, 1.5rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Le cloud africain qui protège vos fichiers, sauvegarde vos conversations WhatsApp et retrouve vos souvenirs grâce à l&apos;intelligence artificielle.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col gap-3 sm:flex-row"
            style={{ marginTop: "clamp(0.8rem, 3vh, 1.5rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <button
              onClick={onGetStarted}
              className="w-full rounded-xl bg-[#FF6B00] px-8 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,107,0,0.35)] transition-all duration-200 hover:bg-[#FF7A1A] sm:w-auto"
            >
              Essayer gratuitement
            </button>
            <button
              onClick={onAuthOpen}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 sm:w-auto"
            >
              Se connecter
            </button>
          </motion.div>
        </div>
      </div>

      {/* Desktop Stats - Glassmorphism Cards */}
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-0 right-0 z-10 hidden px-6 md:flex md:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-7xl justify-between">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 + i * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 backdrop-blur-md"
            >
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-[9px] sm:text-[10px] lg:text-[11px] leading-tight text-white/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Stats */}
      <motion.div
        className="absolute bottom-5 left-5 right-5 z-10 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md md:hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        {[
          ["+120k", "fichiers protégés"],
          ["+8 To", "archives stockées"],
          ["+24k", "créateurs"],
        ].map(([value, label]) => (
          <div key={value} className="text-center">
            <p className="text-base font-bold leading-none text-white">{value}</p>
            <p className="mt-1 text-[9px] leading-tight text-white/60">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Holographic Cloud */}
      <div className="pointer-events-none absolute right-[10%] top-[35%] z-10 hidden md:block">
        <motion.div
          className="relative flex items-center justify-center"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute h-24 w-40 rounded-full bg-[#FF6B00] opacity-[0.06] blur-2xl" />
          <div className="absolute h-14 w-24 rounded-full bg-[#FF6B00] opacity-[0.08] blur-xl" />
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative text-[#FF6B00] opacity-50"
          >
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="currentColor"/>
          </svg>
        </motion.div>
        {Array.from({ length: 20 }, (_, i) => i).map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#FF6B00]"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `calc(50% + ${Math.random() * 140 - 70}px)`,
              top: `calc(50% + ${Math.random() * 140 - 70}px)`,
            }}
            animate={{
              opacity: [0.15, 0.5, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </section>
  )
}
