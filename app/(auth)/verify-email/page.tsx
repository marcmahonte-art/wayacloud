"use client"

import { Suspense, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, PenLine } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const email = searchParams.get("email") || user?.email || ""

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [changingEmail, setChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [changeError, setChangeError] = useState("")

  useEffect(() => {
    if (!authLoading && user?.email_confirmed_at) {
      router.push("/dashboard")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    if (resending || cooldown > 0) return
    setResending(true)
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        console.error(data.error)
        return
      }
      setResent(true)
      setCooldown(60)
      setTimeout(() => setResent(false), 5000)
    } catch {
      // silent
    } finally {
      setResending(false)
    }
  }

  const handleChangeEmail = () => {
    if (!newEmail.trim() || newEmail === email) {
      setChangingEmail(false)
      return
    }
    router.push(`/register?email=${encodeURIComponent(newEmail)}`)
  }

  if (authLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mail size={32} className="text-primary" />
          </div>

          <AuthHeader
            title="Vérifiez votre adresse email"
            subtitle="Un lien de confirmation vous a été envoyé"
          />

          <p className="text-sm text-gray mt-4 max-w-sm">
            Nous avons envoyé un email de confirmation à{" "}
            <span className="font-medium text-dark">{email || "votre adresse email"}</span>.
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
          </p>

          <div className="w-full mt-8 p-4 rounded-xl bg-brand-tint border border-primary/10">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray font-medium">Vous ne trouvez pas l&apos;email ?</p>
                <ul className="mt-1.5 text-xs text-gray space-y-1 list-disc list-inside">
                  <li>Vérifiez votre dossier &quot;Spams&quot; ou &quot;Indésirables&quot;</li>
                  <li>Assurez-vous d&apos;avoir saisi la bonne adresse</li>
                  <li>Renvoyez l&apos;email de confirmation ci-dessous</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className={cn(
              "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm mt-6",
              "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200 shadow-sm shadow-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
              "flex items-center justify-center gap-2"
            )}
          >
            {resending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Envoi en cours...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw size={16} />
                Renvoyer dans {cooldown}s
              </>
            ) : resent ? (
              <>
                <CheckCircle2 size={16} />
                Email renvoyé avec succès !
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Renvoyer l&apos;email de confirmation
              </>
            )}
          </button>

          <div className="w-full mt-4 pt-4 border-t border-[#F0ECE6]">
            {changingEmail ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#69708A]">Modifier l&apos;adresse email</p>
                <input
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setChangeError("") }}
                  placeholder="Nouvelle adresse email"
                  className="w-full rounded-lg border border-[#EAE5E0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  type="email"
                />
                {changeError && <p className="text-xs text-red-500">{changeError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleChangeEmail}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-light transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => { setChangingEmail(false); setNewEmail(email); }}
                    className="rounded-lg border border-[#EAE5E0] px-4 py-2 text-xs font-medium text-[#69708A] hover:bg-[#F5F3F0] transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setChangingEmail(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#69708A] hover:text-dark transition-colors"
              >
                <PenLine size={14} />
                Modifier l&apos;adresse email
              </button>
            )}
          </div>

          <button
            onClick={() => router.push("/login")}
            className={cn(
              "w-full h-12 rounded-xl border-2 border-border text-dark font-medium text-sm mt-4",
              "hover:bg-gray-50 hover:border-gray-300",
              "transition-all duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </button>
        </div>
      </AuthCard>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
