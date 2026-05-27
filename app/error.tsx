"use client"

import { ErrorFallback } from "@/components/error/ErrorFallback"
import { logger } from "@/lib/logger"

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  logger.error("Global error page triggered", { message: error.message, digest: error.digest })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFAF8]">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Erreur inattendue"
        message="Un problème est survenu. Veuillez rafraîchir la page."
      />
    </div>
  )
}
