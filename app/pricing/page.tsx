"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { OnboardingModal } from "@/components/onboarding-modal"

export default function PricingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  return (
    <>
      <Navbar
        onAuthOpen={() => setAuthModalOpen(true)}
        onGetStarted={() => setOnboardingOpen(true)}
      />
      <main className="pt-16">
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </>
  )
}
