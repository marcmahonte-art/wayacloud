"use client"

import { logger } from "@/lib/logger"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  logger.error("Fatal global error", { message: error.message, digest: error.digest })

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#FBFAF8] p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <span className="text-2xl text-red-500">⚠</span>
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">
              Erreur critique
            </h1>
            <p className="text-sm text-[#69708A] mb-6">
              Une erreur critique est survenue. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
