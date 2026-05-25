"use client";
export const dynamic = "force-dynamic";


import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2, Lock } from "lucide-react"
import { z } from "zod"
import Link from "next/link"
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { updatePassword } from "@/lib/auth/service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const schema = z.object({
  password: z.string().min(8, "Minimum 8 caractères"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm"],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await updatePassword(data.password)
    if (error) {
      toast.error(error.message)
      return
    }
    setDone(true)
    toast.success("Mot de passe réinitialisé !")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <AuthCard>
        {!done ? (
          <>
            <AuthHeader title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <AuthInput
                id="password"
                type="password"
                label="Nouveau mot de passe"
                placeholder="Minimum 8 caractères"
                icon={<Lock size={16} />}
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-red-500 -mt-2">{errors.password.message}</p>}
              <AuthInput
                id="confirm"
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Ressaisissez votre mot de passe"
                icon={<Lock size={16} />}
                {...register("confirm")}
              />
              {errors.confirm && <p className="text-sm text-red-500 -mt-2">{errors.confirm.message}</p>}
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
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Réinitialiser"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-dark">Mot de passe réinitialisé</h2>
            <p className="text-sm text-gray">Votre mot de passe a été mis à jour avec succès.</p>
            <Link href="/login" className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-light transition-all">
              Se connecter
            </Link>
          </div>
        )}
      </AuthCard>
    </motion.div>
  )
}
