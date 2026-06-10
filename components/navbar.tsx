"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/Logo"

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/features" },
  { label: "Tarifs", href: "/pricing" },
]

interface NavbarProps {
  onAuthOpen?: () => void
  onGetStarted?: () => void
}

export function Navbar({ onAuthOpen, onGetStarted }: NavbarProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-30 flex h-[80px] items-center px-6 transition-all duration-200 sm:px-8 md:px-10",
          isHomePage
            ? "bg-transparent"
            : "bg-white/90 backdrop-blur-md shadow-sm",
        )}
      >
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Logo
              variant={isHomePage ? "light" : "dark"}
              className={cn(
                "w-[190px] transition-all duration-200 sm:w-[210px]",
              )}
            />
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-[15px] font-jost font-medium transition-all duration-200",
                  isHomePage
                    ? link.href === "/"
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                    : link.href === pathname
                      ? "text-[#FF6B00]"
                      : "text-[#111827] hover:text-[#FF6B00]",
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={onAuthOpen}
              className={cn(
                "text-[15px] font-jost font-medium transition-all duration-200",
                isHomePage
                  ? "text-white/60 hover:text-white"
                  : "text-[#111827] hover:text-[#FF6B00]",
              )}
            >
              Connexion
            </button>
          </div>

          <div className="hidden items-center lg:flex">
            <button
              onClick={onGetStarted}
              className="rounded-xl bg-[#FF6B00] px-6 py-2.5 text-[15px] font-jost font-semibold text-white transition-all duration-200 hover:bg-[#FF7A1A] shadow-[0_4px_20px_rgba(255,99,0,0.35)] whitespace-nowrap"
            >
              Essayer gratuitement
            </button>
          </div>

          <button
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 lg:hidden",
              isHomePage ? "bg-white/10 hover:bg-white/20 text-white" : "bg-[#F8F7F4] hover:bg-brand-tint text-[#111827]",
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/45 backdrop-blur-[4px]"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-y-0 right-0 z-[9999] flex w-[85vw] max-w-[360px] flex-col rounded-l-[32px] border-l border-gray-100 bg-white p-6 pt-[calc(env(safe-area-inset-top)+24px)] shadow-2xl overflow-y-auto sm:p-8"
            >
              <button
                className="mb-6 flex h-10 w-10 items-center justify-center self-end rounded-xl bg-[#F8F7F4] text-gray-600 transition-colors duration-200 hover:text-gray-900"
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
                    className={cn(
                      "text-lg font-jost transition-colors duration-200",
                      link.href === pathname ? "text-[#FF6B00] font-bold" : "text-[#111827]/70 hover:text-[#FF6B00]",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); onAuthOpen?.(); }}
                  className="w-full py-3 rounded-xl text-base font-jost font-semibold text-[#111827] border border-[#e3dfe8] transition-all duration-200"
                >
                  Connexion
                </button>
                <button
                  onClick={() => { setMobileOpen(false); onGetStarted?.(); }}
                  className="w-full py-3 rounded-xl text-base font-jost font-semibold bg-[#FF6B00] text-white transition-all duration-200 hover:bg-[#e55a00] shadow-[0_4px_20px_rgba(255,99,0,0.35)]"
                >
                  Essayer gratuitement
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
