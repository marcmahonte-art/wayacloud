import { z } from "zod"

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(8, "Le numéro de téléphone est invalide")
    .regex(/^\+226/, "Le numéro doit commencer par +226"),
})

export const onboardingSchema = z.object({
  first_name: z
    .string()
    .min(1, "Le prénom est requis"),
  last_name: z
    .string()
    .min(1, "Le nom est requis"),
  city: z
    .string()
    .min(1, "La ville est requise"),
  gender: z
    .enum(["homme", "femme", "autre"], { message: "Le sexe est requis" }),
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z
    .string()
    .regex(/^\+226/, "Le numéro doit commencer par +226")
    .optional()
    .or(z.literal("")),
})

export type EmailFormData = z.infer<typeof emailSchema>
export type PhoneFormData = z.infer<typeof phoneSchema>
export type OnboardingFormData = z.infer<typeof onboardingSchema>
