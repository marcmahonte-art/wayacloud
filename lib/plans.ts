export const PLANS = {
  free: {
    key: "free",
    name: "Gratuit",
    nameDisplay: "Découverte",
    storage: 5,
    storageAfter: 3,
    trialDays: 45,
    price: 0,
    priceDisplay: "0 F",
    period: null as string | null,
    periodLabel: null as string | null,
    monthlyEquiv: null as string | null,
    limitBytes: 5_147_483_648,
    limitBytesAfter: 3_221_225_472,
    durationDays: null as number | null,
    popular: false,
    color: "#6B7280",
    description: "Pour découvrir WayaCloud. Stockez vos premiers fichiers en toute sécurité.",
    features: [
      "5 Go d'espace pendant 45 jours",
      "3 Go d'espace permanent après le trial",
      "Backup WhatsApp médias en 1 clic (manuel)",
      "Accès à l'interface WayaCloud",
      "Tri automatique CNIB / Reçus",
    ],
    excluded: [
      "Partage de liens",
      "Outils IA (Résumé, Assistant)",
      "Album famille partagé",
      "Backup automatique nocturne",
      "Support prioritaire",
    ],
  },
  whatsapp_1500: {
    key: "whatsapp_1500",
    name: "Sauve WhatsApp",
    nameDisplay: "Sauve WhatsApp",
    storage: 20,
    price: 1500,
    priceDisplay: "1 500 F",
    period: "year" as const,
    periodLabel: "/ an",
    monthlyEquiv: "125 F / mois",
    limitBytes: 21_474_836_480,
    durationDays: 365,
    popular: true,
    color: "#FF6300",
    description: "Backup WhatsApp automatique. Ne perdez plus jamais vos photos et vidéos.",
    features: [
      "20 Go d'espace de stockage",
      "Backup automatique médias WhatsApp",
      "Backup nocturne automatique (WiFi + batterie > 30%)",
      "Tri automatique CNIB / Reçus Orange Money / Actes",
      "5 liens de partage actifs simultanément",
      "Visionneuse photos en ligne",
      "Support WhatsApp standard",
    ],
    excluded: [
      "Album famille partagé",
      "Résumé IA des conversations",
      "Backup WA Business Catalog",
      "Parrainage 1 mois gratuit",
      "Chiffrement zero-knowledge",
    ],
  },
  famille_999: {
    key: "famille_999",
    name: "Famille 3 mois",
    nameDisplay: "Famille",
    storage: 50,
    price: 999,
    priceDisplay: "999 F",
    period: "quarter" as const,
    periodLabel: "/ 3 mois",
    monthlyEquiv: "333 F / mois",
    limitBytes: 53_687_091_200,
    durationDays: 90,
    popular: false,
    color: "#185FA5",
    description: "50 Go pour toute la famille. Photos, vidéos, documents partagés.",
    features: [
      "50 Go d'espace de stockage",
      "Tout ce qu'inclut le plan Sauve WhatsApp",
      "Album famille partagé (dossier collaboratif privé)",
      "Résumé IA des conversations WhatsApp",
      "Backup WA Business Catalog (photos produits)",
      "Détection d'arnaques dans les messages",
      "Compression intelligente des vidéos",
    ],
    excluded: [
      "Parrainage 1 mois gratuit",
      "Support prioritaire",
      "Chiffrement zero-knowledge",
    ],
  },
  famille_3999: {
    key: "famille_3999",
    name: "Famille Annuel",
    nameDisplay: "Famille",
    storage: 50,
    price: 3999,
    priceDisplay: "3 999 F",
    period: "year" as const,
    periodLabel: "/ an",
    monthlyEquiv: "333 F / mois",
    limitBytes: 53_687_091_200,
    durationDays: 365,
    popular: false,
    color: "#185FA5",
    description: "Même prix que 4× le plan 3 mois, mais vous payez 1 seule fois dans l'année.",
    features: [
      "50 Go d'espace de stockage",
      "Tout ce qu'inclut le plan Famille 3 mois",
      "Backup WA Business Catalog automatique quotidien",
      "Historique des versions du catalogue",
      "Parrainage : inviter 3 amis = 1 mois gratuit",
      "Offrir un abonnement à un proche",
      "Support WhatsApp prioritaire",
      "Accès synthèse vocale en mooré et français",
    ],
    excluded: [
      "Chiffrement zero-knowledge (réservé Pro)",
      "Export catalogue PDF illimité",
      "API accès développeurs",
    ],
  },
  pro_6999: {
    key: "pro_6999",
    name: "Pro Village",
    nameDisplay: "Pro Village",
    storage: 100,
    price: 6999,
    priceDisplay: "6 999 F",
    period: "year" as const,
    periodLabel: "/ an",
    monthlyEquiv: "583 F / mois",
    limitBytes: 107_374_182_400,
    durationDays: 365,
    popular: false,
    color: "#3C3489",
    description: "Pour les photographes, commerçants et créateurs. Stockage massif et chiffrement total.",
    features: [
      "100 Go d'espace de stockage",
      "Tout ce qu'inclut le plan Famille Annuel",
      "Chiffrement zero-knowledge (même WayaCloud ne peut pas lire)",
      "Export catalogue WA Business en PDF professionnel",
      "Rapport mensuel automatique (statistiques, activités)",
      "Traduction instantanée (Français ↔ Anglais, Hausa)",
      "Accès API développeurs BF",
      "Support WhatsApp mooré + français dédié",
    ],
    excluded: [],
  },
} as const

export type PlanKey = keyof typeof PLANS
export type Plan = typeof PLANS[PlanKey]

export const getPlan = (key: PlanKey): Plan => PLANS[key]
export const getPlanLabel = (key: PlanKey) => PLANS[key].nameDisplay
export const getPlanPrice = (key: PlanKey) => PLANS[key].price
export const getPlanStorage = (key: PlanKey) => PLANS[key].storage
export const getPlanLimitBytes = (key: PlanKey) => PLANS[key].limitBytes
export const getPlanDays = (key: PlanKey) => PLANS[key].durationDays
export const isFreePlan = (key: PlanKey) => key === "free"
export const isPaidPlan = (key: PlanKey) => key !== "free"

export function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR") + " F"
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} Go`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} Mo`
  return `${(bytes / 1024).toFixed(0)} Ko`
}

export const DISPLAY_PLANS: PlanKey[] = [
  "free",
  "whatsapp_1500",
  "famille_3999",
  "pro_6999",
]
