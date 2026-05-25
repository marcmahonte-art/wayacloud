"use client";




import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { LoginForm } from "@/components/auth/LoginForm"
import { AuthSeparator } from "@/components/auth/AuthSeparator"
import { SocialAuth } from "@/components/auth/SocialAuth"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"
import type { AuthTab } from "@/lib/auth/types"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const [tab, setTab] = useState<AuthTab>("email")
  const [step, setStep] = useState<"form" | "otp">("form")
  const [message, setMessage] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setMessage("✅ Inscription réussie !")
    setOtpLoading(false)
    setTimeout(() => router.push("/dashboard"), 1000)
  }

  const resetForm = () => {
    setStep("form")
    setOtp(["", "", "", "", "", ""])
    setMessage(null)
  }

  if (authLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <AuthCard>
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AuthHeader
                title="Créer un compte"
                subtitle="Inscrivez-vous pour commencer"
              />

              <AuthTabs value={tab} onChange={setTab} />
              <LoginForm tab={tab} mode="register" onOtpSent={() => setStep("otp")} />

              <AuthSeparator />
              <SocialAuth />

              <p className="text-sm text-helper text-center mt-6">
                Déjà un compte ?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Connectez-vous
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AuthHeader
                title="Vérification"
                subtitle="Entrez le code de vérification reçu"
              />

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex items-center justify-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <span className="text-sm text-gray">Code envoyé</span>
                </div>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className={cn(
                        "w-12 h-14 text-center text-lg font-semibold text-dark bg-white border border-border rounded-xl",
                        "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
                        "transition-all duration-200"
                      )}
                    />
                  ))}
                </div>

                {message && (
                  <p className={cn("text-sm text-center", message.includes("✅") ? "text-green-600" : "text-primary")}>
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otpLoading || otp.some((d) => !d)}
                  className={cn(
                    "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
                    "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
                    "transition-all duration-200 shadow-sm shadow-primary/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {otpLoading ? <Loader2 size={16} className="animate-spin" /> : <>Vérifier<Check size={16} /></>}
                </button>

                <div className="text-center">
                  <button type="button" onClick={resetForm} className="text-sm text-helper hover:text-primary transition-colors">
                    Changer d&apos;adresse
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </motion.div>
  )
}
