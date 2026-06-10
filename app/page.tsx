"use client"

import { useState } from "react"
import { Hero } from "@/components/hero"
import { AuthModal } from "@/components/auth-modal"
import { OnboardingModal } from "@/components/onboarding-modal"

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  return (
    <>
      <Hero
        onAuthOpen={() => setAuthModalOpen(true)}
        onGetStarted={() => setOnboardingOpen(true)}
      />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </>
  )
}
