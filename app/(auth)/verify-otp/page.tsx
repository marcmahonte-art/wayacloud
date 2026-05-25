"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Loader2, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard"
import { cn } from "@/lib/utils"

export default function VerifyOtpPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("✅ Vérification réussie !")
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <AuthCard>
        <AuthHeader
          title="Vérification OTP"
          subtitle="Entrez le code à 6 chiffres reçu"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="text-sm text-gray">Code envoyé par SMS</span>
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
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
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
            disabled={loading || otp.some((d) => !d)}
            className={cn(
              "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
              "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200 shadow-sm shadow-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <>Vérifier<Check size={16} /></>
            )}
          </button>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-helper hover:text-primary transition-colors">
              <ArrowLeft size={14} />
              Retour à la connexion
            </Link>
          </div>
        </form>
      </AuthCard>
    </motion.div>
  )
}
