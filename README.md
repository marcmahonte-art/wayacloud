# WayaCloud

Stockage cloud sécurisé, conçu pour l'Afrique — Burkina Faso.

**Production :** https://wayacloud-silk.vercel.app

---

## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Configuration](#configuration)
- [API Routes](#api-routes)
- [Base de données](#base-de-données)
- [Auth](#auth)
- [Services externes](#services-externes)
- [État et synchronisation](#état-et-synchronisation)
- [Déploiement](#déploiement)

---

## Aperçu

WayaCloud est une plateforme de stockage cloud complète avec :

- Upload et gestion de fichiers
- Sauvegarde WhatsApp automatique
- Outils IA (chat, traduction, détection d'arnaques, résumé)
- Albums photos et partage de fichiers
- Abonnements et paiements CinetPay (FCFA)
- Système de parrainage
- Interface temps réel (Supabase Realtime + Zustand)

---

## Fonctionnalités

### Gestion de fichiers

| Fonctionnalité | Description |
|---|---|
| Upload fichiers | Presigned PUT vers Wasabi S3, dédup MD5, intégrité SHA-256, limité à 100/hr |
| Navigation | Vue grille/liste, dossiers virtuels (Images, Vidéos, Audio, Documents, WhatsApp) |
| Opérations | Renommer, déplacer, copier, favori, étiquette couleur, corbeille, suppression définitive |
| Prévisualisation | Images, vidéos, audio, PDF — dans le navigateur |
| Recherche | Filtrage instantané par nom |
| Sélection multiple | Actions batch (télécharger, partager, corbeille) |
| Tri automatique | Classification par type MIME (images/vidéos/audio/documents) |

### Stockage & Analytics

| Fonctionnalité | Description |
|---|---|
| Tableau de bord | Aperçu stockage, barre d'utilisation, catégories, fichiers récents |
| Page stockage | Donut chart (Répartition par type), area chart (Évolution), fichiers les plus lourds |
| Quota temps réel | Recalcul automatique via `sum(files.size_bytes)` |
| Synchronisation | Supabase Realtime WebSocket → Zustand → re-render automatique |

### Sauvegarde WhatsApp

- Scan du téléphone, catégorisation (images/vidéos/audio/documents)
- Upload avec dédup MD5
- Pause/Reprise
- Historique des sauvegardes
- Stats de stockage WhatsApp

### Outils IA (Claude)

| Outil | Modèle | Description |
|---|---|---|
| Assistant IA | Claude Sonnet 4 | Chat en français, contexte WayaCloud (FCFA/Go) |
| Traduction | Claude Haiku | max_tokens 1000, temp 0.3 |
| Détection d'arnaques | Claude Haiku | max_tokens 500, temp 0.2 |
| Résumé IA | Claude Haiku | max_tokens 600 |
| Analyse documents | — | **Non implémenté** (retourne 501) |

### Partage

- Liens de partage avec expiration + limite de téléchargements
- Token SHA-256, page publique de téléchargement
- Copier, révoquer, statut

### Albums

- Albums photos avec couverture
- Création et partage

### Abonnements

| Plan | Stockage | Prix | Membres |
|---|---|---|---|
| Gratuit | 5 Go | 0 FCFA/mois | 1 |
| Essentiel | 20 Go | — | 1 |
| Famille | 100 Go | — | 5 |
| Business | 500 Go | — | Illimité |

### Paiements (CinetPay)

- Checkout en FCFA
- Webhook HMAC-SHA256
- Activation abonnement
- Achat cadeau (offrir à un numéro)

### Parrainage

- Code unique par utilisateur
- Partage WhatsApp / réseaux sociaux
- Suivi des récompenses

### Admin

- Gestion utilisateurs
- CRUD codes promo
- Fix abonnements legacy
- Monitoring stockage

### Sécurité

- Rate limiting (100 uploads/hr, 20 partages/hr)
- Chiffrement AES-256-GCM (côté client)
- Headers sécurité (X-Frame-Options: DENY, etc.)
- Middleware auth protection (12 routes protégées)

---

## Architecture

```
Utilisateur → Next.js App Router → Composants React
                                       ↓
                               Zustand Store (état global)
                                       ↓
                            Supabase Realtime WebSocket
                                       ↓
                               API Routes (Next.js)
                                       ↓
                           ┌───────────┴───────────┐
                           ↓                       ↓
                     Supabase DB              Wasabi S3
                   (Auth, Postgres,          (Fichiers)
                    Realtime, Storage)
                           ↓
                    Services externes
                 (Claude, CinetPay, Twilio)
```

### Flux données temps réel

```
Action utilisateur (upload, delete, trash, restore)
  → API Route → Supabase DB
  → Realtime WebSocket (Postgres changes)
  → useStorageSync hook
  → Zustand store (files, quota, activities)
  → Re-render automatique composants connectés
```

---

## Stack technique

### Frontend

| Technologie | Version | Usage |
|---|---|---|
| Next.js | 14.2.35 | Framework App Router |
| React | 18 | UI |
| TypeScript | 5 | Typage strict |
| Tailwind CSS | 3.4 | Styles |
| Zustand | 5.0.14 | State management global |
| Recharts | 3.8.1 | Graphiques (pie, area) |
| Framer Motion | 12.40.0 | Animations |
| Lucide React | 1.16.0 | Icônes |
| Radix UI | — | Primitives (Dialog, Tabs, Toast, Tooltip, Dropdown, Accordion) |
| react-hook-form | 7.76.1 | Formulaires |
| Zod | 4.4.3 | Validation schémas |
| Sonner | 2.0.7 | Toasts |

### Backend

| Technologie | Usage |
|---|---|
| Next.js API Routes | 40+ endpoints REST |
| Supabase | Auth, DB PostgreSQL, Realtime, Storage (avatars) |
| Wasabi S3 | Stockage objets (fichiers utilisateurs) |
| Anthropic Claude | IA (chat, traduction, détection, résumé) |
| CinetPay | Paiements FCFA |
| Twilio | SMS OTP |

---

## Structure du projet

```
wayacloud/
├── app/
│   ├── (auth)/               # Connexion, inscription, OTP, reset password
│   ├── (dashboard)/          # Dashboard, fichiers, stockage, corbeille, albums, etc.
│   ├── admin/                # Panneau admin
│   ├── api/                  # 40+ routes API
│   │   ├── auth/             # Signup, resend confirmation
│   │   ├── files/            # CRUD fichiers
│   │   ├── upload/           # Presign + confirm upload
│   │   ├── storage/          # Stats, evolution, largest
│   │   ├── ai/               # Chat, translate, detect-scam, summarize, analyze-document
│   │   ├── share/            # Création + download liens partage
│   │   ├── checkout/         # CinetPay
│   │   ├── webhook/          # CinetPay webhook
│   │   ├── promo/            # Codes promo
│   │   ├── admin/            # Admin ops
│   │   ├── whatsapp/         # Backup status + check-duplicate
│   │   └── ...               # Avatar, activités, notifications, health
│   ├── s/[token]/            # Page publique de téléchargement
│   └── page.tsx              # Landing page
├── components/
│   ├── auth/                 # LoginForm, SocialAuth, AuthCard, etc.
│   ├── dashboard/            # RecentFilesList, FileContextMenu, ShareModal, DropZone, UploadButton
│   ├── ui/                   # FileViewerModal, FileDetailsPanel, Skeletons, primitives
│   ├── landing/              # Hero, Navbar, Features, Pricing, FAQ, Footer
│   └── onboarding-modal.tsx  # Inscription multi-étapes
├── hooks/
│   ├── useFileActions.tsx    # CRUD fichiers avec fallback localStorage
│   ├── useRealtimeSync.ts    # Abonnements Realtime Supabase
│   └── useSafeFetch.ts       # Fetch sécurisé avec loading/error
├── lib/
│   ├── auth/                 # service.ts, types.ts, validation.ts, url.ts
│   ├── store/                # storage-store.ts (Zustand), useStorageSync.ts
│   ├── supabase/             # client.ts, server.ts, admin.ts, middleware.ts
│   ├── wasabi.ts             # Client S3 + presigned URLs
│   ├── activity.ts           # Logging activités
│   ├── formatters.ts         # Formatage taille, date, FCFA
│   ├── rateLimit.ts          # Rate limiter mémoire (sliding window)
│   ├── encryption.ts         # AES-256-GCM
│   └── ...
├── providers/
│   └── AuthProvider.tsx      # Contexte auth (user, session, profile, quota, subscription)
├── supabase/
│   ├── migrations/           # 9 migrations SQL
│   └── functions/            # 3 Edge Functions (backup-monitor, health-check, send-sms)
├── middleware.ts             # Middleware auth Next.js
├── tailwind.config.js        # Design tokens (primary #FF6300, font Jost)
└── .env                      # Variables d'environnement
```

---

## Configuration

### Variables d'environnement

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uxwjvlbtmhvkgvfrdxdr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# Wasabi S3 (stockage fichiers)
WASABI_ACCESS_KEY=WIHMRO20...
WASABI_SECRET_KEY=Y2HTACZV...
WASABI_BUCKET=wayacloud
WASABI_REGION=eu-central-1
WASABI_ENDPOINT=https://s3.eu-central-1.wasabisys.com

# Supabase service role (pour admin ops)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# URLs
NEXT_PUBLIC_APP_URL=https://wayacloud-silk.vercel.app
NEXT_PUBLIC_SITE_URL=https://wayacloud-silk.vercel.app

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Optionnel
ANTHROPIC_API_KEY=       # Claude AI
CINETPAY_API_KEY=        # Paiements
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=
MIGRATION_SECRET=        # Protection /api/admin/migrate
TWILIO_ACCOUNT_SID=      # SMS OTP
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=          # Emails (config Supabase Dashboard)
ENCRYPTION_PEPPER=       # Clé AES-256-GCM
```

### Déploiement Vercel

Les variables d'environnement sont configurées dans le projet Vercel (`polo6/wayacloud`). Toutes les clés Wasabi, Supabase et Google sont en Production.

---

## API Routes

### Auth

| Route | Méthode | Description |
|---|---|---|
| `/api/auth/signup` | POST | Création compte (admin, service_role, email_confirm:true) |
| `/api/auth/resend-confirmation` | POST | Renvoyer email confirmation |

### Fichiers

| Route | Méthode | Description |
|---|---|---|
| `/api/files` | GET | Liste fichiers (`?trashed=true`) |
| `/api/files` | POST | Dupliquer fichier |
| `/api/files/[id]` | PATCH | Modifier métadonnées |
| `/api/files/[id]` | DELETE | Soft-delete |

### Upload

| Route | Méthode | Description |
|---|---|---|
| `/api/upload/presign` | POST | Générer URL presignée PUT Wasabi |
| `/api/upload/confirm` | POST | Confirmer upload + insertion DB + quota |

### Stockage

| Route | Méthode | Description |
|---|---|---|
| `/api/storage/stats` | GET | Stats quota, catégories, fichiers récents |
| `/api/storage/largest` | GET | Top 20 fichiers les plus lourds |
| `/api/storage/evolution` | GET | Évolution cumulative journalière |

### IA

| Route | Méthode | Modèle | Description |
|---|---|---|---|
| `/api/ai/chat` | POST | Claude Sonnet 4 | Assistant conversationnel |
| `/api/ai/summarize` | POST | Claude Haiku | Résumé de texte |
| `/api/ai/translate` | POST | Claude Haiku | Traduction |
| `/api/ai/detect-scam` | POST | Claude Haiku | Détection arnaques |
| `/api/ai/analyze-document` | POST | — | **Stub (501)** |

### Partage

| Route | Méthode | Description |
|---|---|---|
| `/api/share` | POST | Créer lien partage (token SHA-256) |
| `/api/share/download` | POST | Télécharger via token |

### Paiement

| Route | Méthode | Description |
|---|---|---|
| `/api/checkout/cinetpay` | POST | Initier paiement CinetPay |
| `/api/webhook/cinetpay` | POST | Webhook CinetPay (HMAC-SHA256) |

### Autres

| Route | Méthode | Description |
|---|---|---|
| `/api/activities` | GET | Fil d'activité |
| `/api/promo/check` | POST | Valider code promo |
| `/api/avatar` | POST/DELETE | Avatar Supabase Storage |
| `/api/health` | GET | Health check |

---

## Base de données

### Tables principales (Supabase PostgreSQL)

| Table | Description |
|---|---|
| `profiles` | Profils utilisateurs (nom, ville, sexe, téléphone, rôle, code parrain) |
| `files` | Fichiers (owner_id, object_key, name, mime_type, size_bytes, checksum, status, is_trashed, is_favorite) |
| `storage_quotas` | Quota par utilisateur (used_bytes, limit_bytes) |
| `storage_plans` | Plans (Gratuit 5Go, Essentiel 20Go, Famille 100Go, Business 500Go) |
| `subscriptions` | Abonnements utilisateurs |
| `payments` | Transactions CinetPay |
| `share_links` | Liens de partage (token_hash, expires_at, max_downloads) |
| `activities` | Fil d'activité (type, title, description, metadata) |
| `promo_codes` | Codes promo (discount_percent, max_uses) |
| `referral_rewards` | Récompenses parrainage |
| `whatsapp_backups` | Sessions de sauvegarde WhatsApp |
| `notification_preferences` | Préférences notifications |
| `download_logs` | Logs téléchargements partagés |
| `app_config` | Configuration clé-valeur |

### Migrations

9 migrations SQL dans `supabase/migrations/` :
- `00001_initial_schema.sql` — Tables de base
- `00002_onboarding_flow.sql` — Trigger création profil + quota à l'inscription
- `00003_social_features.sql` — Partage, parrainage, promos
- `00004_migrate_route.sql` — WhatsApp backups
- `00005_cron_monitoring.sql` — SMS queue, alerts, config
- `00006_automation.sql` — Activités, notifications, backup logs
- `00007_notification_templates.sql` — Templates notifications
- `00008_fix_storage_plans.sql` — Correction plans stockage
- `00009_auth_callback.sql` — Optimisation callback auth

---

## Auth

### Méthodes disponibles

| Méthode | Implémentation |
|---|---|
| Email / Mot de passe | `supabase.auth.signInWithPassword()` |
| Inscription | `POST /api/auth/signup` (service_role, auto-confirm) |
| Phone OTP | `supabase.auth.signInWithOtp({ phone, channel: "sms" })` |
| Google OAuth | `supabase.auth.signInWithOAuth({ provider: "google" })` |
| Facebook OAuth | `supabase.auth.signInWithOAuth({ provider: "facebook" })` |
| Magic link (email OTP) | `supabase.auth.signInWithOtp({ email })` |
| Reset password | `supabase.auth.resetPasswordForEmail()` |

### Clients Supabase

3 patterns :
- **Client** (`lib/supabase/client.ts`) — `createBrowserClient()` pour le navigateur
- **Server** (`lib/supabase/server.ts`) — `createServerClient()` avec cookies SSR
- **Admin** (`lib/supabase/admin.ts`) — `createClient()` avec service_role key

### Middleware

`middleware.ts` protège :
- `/dashboard/*`, `/mes-fichiers/*`, `/whatsapp/*`, `/albums/*`, `/partages/*`, `/documents/*`, `/corbeille/*`, `/parametres/*`, `/abonnement/*`, `/gift/*`, `/referral/*`, `/outils/*`
- Redirige non-authentifiés vers `/login`
- Redirige email non confirmé vers `/verify-email`
- Bloque non-admin sur `/admin/*`

---

## Services externes

| Service | Usage | Intégration |
|---|---|---|
| Supabase | Auth, DB, Realtime, Storage avatars | `@supabase/ssr` + `@supabase/supabase-js` |
| Wasabi S3 | Stockage fichiers | `@aws-sdk/client-s3` + presigned URLs |
| Anthropic Claude | IA | `@anthropic-ai/sdk` + REST API |
| CinetPay | Paiements FCFA | API checkout + webhook HMAC-SHA256 |
| Twilio | SMS OTP | Supabase Edge Function + `sms_queue` table |
| Resend | Emails transactionnels | Configuré dans Supabase Dashboard |
| Vercel | Hébergement | Déploiement `vercel --prod` |

---

## État et synchronisation

### Architecture temps réel

```
Supabase DB ──→ Realtime WebSocket ──→ useRealtimeSync
                                              ↓
                                       useStorageSync
                                              ↓
                                     Zustand Store (useStorageStore)
                                              ↓
                                    Composants React (re-render auto)
```

### Store Zustand (`lib/store/storage-store.ts`)

```typescript
interface StorageState {
  files: FileEntry[]           // Fichiers actifs
  trashedFiles: FileEntry[]    // Fichiers corbeille
  quota: StorageQuota          // used_bytes + limit_bytes
  activities: ActivityEntry[]  // Fil d'activité
  loadingFiles: boolean        // État chargement
  loadingQuota: boolean
  loadingActivities: boolean
  refreshAll: () => void       // Recharge tout
  addFile / updateFile / removeFile  // Mutations temps réel
}
```

### Calcul stockage

```typescript
usedStorage = sum(allUserFiles.size_bytes)
remainingStorage = totalPlanStorage - usedStorage
usagePercent = (usedStorage / totalPlanStorage) * 100
```

Chaque modification de fichier (upload, delete, trash, restore) déclenche :
1. Recalcul automatique du quota
2. Invalidation du cache
3. Re-render temps réel via Zustand + Realtime

---

## Déploiement

### Production

```bash
cd wayacloud
npx vercel --prod
```

Le déploiement build automatiquement, lint le code TypeScript, et déploie sur **https://wayacloud-silk.vercel.app**.

### Build local

```bash
npm run build    # Build production
npm run dev      # Dev server (localhost:3000)
npx tsc --noEmit # Vérification TypeScript
npx next lint    # Linting
```

---

## Notes importantes

- **Deux librairies toast cohabitent** : `sonner` et `react-hot-toast` — privilégier `sonner` pour les nouveaux développements
- **Tailwind v3.4 et v4.1.6** tous deux déclarés dans package.json — le projet utilise actuellement v3 (`tailwind.config.js`)
- **tus-js-client** installé mais non importé — réservé pour upload résumable futur
- **Rate limiting** en mémoire (Map) — pas de Redis — perdu au redémarrage du serveur
- **Analyse document IA** (`/api/ai/analyze-document`) retourne 501 — non implémenté
- **Chiffrement AES-256-GCM** côté client uniquement — non utilisé dans le flux d'upload actuel
