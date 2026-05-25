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
import { DEMO_ACCOUNT, signInAsDemo } from "@/lib/auth/demo"
import type { AuthTab } from "@/lib/auth/types"
import { toast } from "sonner"
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

    const authFn = mode === "login" ? signInWithEmail : signUpWithEmail
    const { error } = await authFn(data)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (mode === "login") {
      toast.success("Connexion réussie !")
      router.push("/dashboard")
    } else {
      toast.success("Un lien de confirmation a été envoyé à votre adresse e-mail.")
      if (onOtpSent) onOtpSent("Vérifiez votre boîte de réception")
    }
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

  const handleDemoLogin = async () => {
    setLoading(true)
    const { error } = await signInAsDemo()
    if (error) {
      toast.error("Compte démo non disponible")
      setLoading(false)
      return
    }
    toast.success("Connexion démo réussie !")
    router.push("/dashboard")
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

        {mode === "login" && (
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className={cn(
              "w-full h-12 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium text-sm",
              "hover:bg-brand-tint hover:border-primary/50",
              "transition-all duration-200",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Démo - Connexion rapide"
            )}
          </button>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
      <AuthInput
        id="phone"
        type="tel"
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
