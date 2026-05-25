"use client";



import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react"
import { z } from "zod"
import Link from "next/link"
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { sendPasswordResetEmail } from "@/lib/auth/service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await sendPasswordResetEmail(data.email)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
    toast.success("Email de réinitialisation envoyé !")
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
          title="Mot de passe oublié"
          subtitle={sent ? "Un email de réinitialisation vous a été envoyé." : "Entrez votre email pour recevoir un lien."}
        />

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AuthInput
              id="email"
              type="email"
              label="Adresse e-mail"
              placeholder="vous@exemple.com"
              icon={<Mail size={16} />}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 -mt-2">{errors.email.message}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-12 rounded-xl bg-primary text-white font-medium text-sm",
                "hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98]",
                "transition-all duration-200 shadow-sm shadow-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (
                <>Envoyer le lien<ArrowRight size={16} /></>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray">Vérifiez votre boîte de réception et suivez les instructions.</p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-helper hover:text-primary transition-colors">
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    </motion.div>
  )
}
