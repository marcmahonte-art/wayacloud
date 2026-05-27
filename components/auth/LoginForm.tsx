"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Phone, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthInput } from "@/components/auth/AuthInput"
import { emailSchema, phoneSchema, type EmailFormData, type PhoneFormData } from "@/lib/auth/validation"
import { signInWithEmail, signUpWithEmail, signInWithPhone } from "@/lib/auth/service"
import type { AuthTab } from "@/lib/auth/types"
import { toast } from "sonner"
import { storage } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface LoginFormProps {
  tab: AuthTab
  mode?: "login" | "register"
  onOtpSent?: (message: string) => void
}

export function LoginForm({ tab, mode = "login", onOtpSent }: LoginFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  })

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  })

  const handleEmailSubmit = async (data: EmailFormData) => {
    setLoading(true)

    if (mode === "register") {
      const referredBy = storage.get<string | null>("wayacloud_referral_code", null) || undefined
      const { error } = await signUpWithEmail({ ...data, referredBy })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      storage.remove("wayacloud_referral_code")
      setLoading(false)
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      return
    }

    const { error } = await signInWithEmail(data)
    if (error) {
      if (error.message === "Veuillez confirmer votre adresse email") {
        setLoading(false)
router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Connexion réussie !")
    router.push("/dashboard")
    setLoading(false)
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setLoading(true)

    const { error } = await signInWithPhone(data)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Un code OTP a été envoyé par SMS.")
    if (onOtpSent) onOtpSent("Code envoyé")
    setLoading(false)
  }


  if (tab === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
        <AuthInput
          id="email"
          type="email"
          label="Adresse e-mail"
          placeholder="vous@exemple.com"
          icon={<Mail size={16} />}
          {...emailForm.register("email")}
        />
        {emailForm.formState.errors.email && (
          <p className="text-sm text-red-500 -mt-2">
            {emailForm.formState.errors.email.message}
          </p>
        )}

        <AuthInput
          id="password"
          type="password"
          label="Mot de passe"
          placeholder="Minimum 8 caractères"
          icon={null}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          {...emailForm.register("password")}
        />
        {emailForm.formState.errors.password && (
          <p className="text-sm text-red-500 -mt-2">
            {emailForm.formState.errors.password.message}
          </p>
        )}

        {mode === "login" && (
          <div className="flex justify-end -mt-2">
            <Link
              href="/forgot-password"
              className="text-sm text-gray hover:text-primary transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
            "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
            "transition-all duration-200 shadow-sm shadow-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
            "flex items-center justify-center gap-2"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
        <AuthInput
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          label="Numéro de téléphone"
          placeholder="+226 XX XX XX XX"
          icon={<Phone size={16} />}
          {...phoneForm.register("phone")}
        />
      {phoneForm.formState.errors.phone && (
        <p className="text-sm text-red-500 -mt-2">
          {phoneForm.formState.errors.phone.message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
          "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
          "transition-all duration-200 shadow-sm shadow-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi...
          </>
        ) : (
          <>
            Envoyer le code
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
