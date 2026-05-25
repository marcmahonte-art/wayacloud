"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Pricing } from "@/components/pricing"
import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { OnboardingModal } from "@/components/onboarding-modal"

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  return (
    <>
      <Navbar
        onAuthOpen={() => setAuthModalOpen(true)}
        onGetStarted={() => setOnboardingOpen(true)}
      />
      <Hero
        onAuthOpen={() => setAuthModalOpen(true)}
        onGetStarted={() => setOnboardingOpen(true)}
      />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </>
  )
}
