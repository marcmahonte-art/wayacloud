"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Phone, Lock, User, MapPin, Users, ArrowRight, ArrowLeft, Loader2, Sparkles, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { onboardingSchema, type OnboardingFormData } from "@/lib/auth/validation"
import { signUpWithOnboarding, signInWithEmail } from "@/lib/auth/service"
import { SocialAuth } from "@/components/auth/SocialAuth"
import { AuthSeparator } from "@/components/auth/AuthSeparator"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  { id: "personal", title: "Informations personnelles", subtitle: "Dites-nous en plus sur vous" },
  { id: "account", title: "Création du compte", subtitle: "Choisissez vos identifiants" },
]

const genders = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "autre", label: "Autre" },
]

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      city: "",
      gender: undefined,
      email: "",
      password: "",
      phone: "",
    },
    mode: "onChange",
  })

  const personalValid = () => {
    const { first_name, last_name, city, gender } = form.getValues()
    return first_name && last_name && city && gender
  }

  const goToStep = (s: number) => {
    if (s > step && !personalValid()) return
    setStep(s)
  }

  const handleSubmit = async (data: OnboardingFormData) => {
    setLoading(true)

    const { error } = await signUpWithOnboarding({
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      city: data.city,
      gender: data.gender,
      phone: data.phone || undefined,
    })

    if (error) {
      form.setError("email", { message: error.message })
      form.setError("password", { message: error.message })
      setLoading(false)
      return
    }

    const { error: signInError } = await signInWithEmail({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      if (signInError.message === "Veuillez confirmer votre adresse email") {
        setLoading(false)
        onOpenChange(false)
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      form.setError("email", { message: signInError.message })
      form.setError("password", { message: signInError.message })
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      onOpenChange(false)
      router.push("/dashboard")
    }, 1200)
  }

  const resetModal = () => {
    setStep(0)
    setLoading(false)
    setSuccess(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetModal()
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-3xl">
        <div className="relative p-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToStep(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                  step === i
                    ? "bg-primary/10 text-primary"
                    : i < step
                    ? "bg-green-50 text-green-600"
                    : "bg-background text-helper"
                )}
              >
                {i < step ? (
                  <Check size={12} />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold border">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center py-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <p className="text-xl font-bold text-dark">Compte créé avec succès !</p>
                <p className="mt-2 text-sm text-gray">Redirection vers votre espace...</p>
                <Loader2 size={20} className="mt-4 animate-spin text-primary" />
              </motion.div>
            ) : (
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div className="text-center mb-2">
                        <h2 className="text-xl font-bold text-dark">{steps[0].title}</h2>
                        <p className="mt-1 text-sm text-gray">{steps[0].subtitle}</p>
                      </div>

                      <SocialAuth />
                      <AuthSeparator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="first_name" className="block text-sm font-medium text-dark/80">
                            Prénom
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                            <input
                              id="first_name"
                              {...form.register("first_name")}
                              placeholder="Issa"
                              className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                            />
                          </div>
                          {form.formState.errors.first_name && (
                            <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="last_name" className="block text-sm font-medium text-dark/80">
                            Nom
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                            <input
                              id="last_name"
                              {...form.register("last_name")}
                              placeholder="Traoré"
                              className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                            />
                          </div>
                          {form.formState.errors.last_name && (
                            <p className="text-xs text-red-500">{form.formState.errors.last_name.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="city" className="block text-sm font-medium text-dark/80">
                          Ville
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                          <input
                            id="city"
                            {...form.register("city")}
                            placeholder="Ouagadougou"
                            className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                          />
                        </div>
                        {form.formState.errors.city && (
                          <p className="text-xs text-red-500">{form.formState.errors.city.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-dark/80">
                          Sexe
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {genders.map((g) => (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => form.setValue("gender", g.value as "homme" | "femme" | "autre", { shouldValidate: true })}
                              className={cn(
                                "flex h-12 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200",
                                form.watch("gender") === g.value
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border bg-white text-dark/70 hover:border-primary/30"
                              )}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                        {form.formState.errors.gender && (
                          <p className="text-xs text-red-500">{form.formState.errors.gender.message}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        disabled={!personalValid()}
                        className={cn(
                          "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
                          "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
                          "transition-all duration-200 shadow-sm shadow-primary/20",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        Continuer
                        <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div className="text-center mb-2">
                        <h2 className="text-xl font-bold text-dark">{steps[1].title}</h2>
                        <p className="mt-1 text-sm text-gray">{steps[1].subtitle}</p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-dark/80">
                          Adresse e-mail
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                          <input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            placeholder="vous@exemple.com"
                            className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                          />
                        </div>
                        {form.formState.errors.email && (
                          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-dark/80">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                          <input
                            id="password"
                            type="password"
                            {...form.register("password")}
                            placeholder="Minimum 8 caractères"
                            className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                          />
                        </div>
                        {form.formState.errors.password && (
                          <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-dark/80">
                          Téléphone <span className="text-helper">(optionnel)</span>
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-helper" />
                          <input
                            id="phone"
                            type="tel"
                            {...form.register("phone")}
                            placeholder="+226 XX XX XX XX"
                            className="flex h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-dark placeholder:text-helper/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                          />
                        </div>
                        {form.formState.errors.phone && (
                          <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-orange-50 border border-primary/10 p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-dark">Offre de bienvenue</p>
                            <p className="text-xs text-gray mt-1">
                              5 Go de stockage offerts + 45 jours d&apos;essai premium sans limite.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="flex h-12 w-20 items-center justify-center rounded-xl border border-border text-helper hover:bg-background transition-all duration-200"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !form.formState.isValid}
                          className={cn(
                            "flex-1 h-12 rounded-xl bg-primary text-white font-medium text-sm",
                            "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
                            "transition-all duration-200 shadow-sm shadow-primary/20",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                            "flex items-center justify-center gap-2"
                          )}
                        >
                          {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Création en cours...
                            </>
                          ) : (
                            <>
                              Créer mon compte
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-helper text-center">
                        En créant un compte, vous acceptez nos{" "}
                        <a href="#" className="text-primary hover:underline">
                          conditions d&apos;utilisation
                        </a>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
