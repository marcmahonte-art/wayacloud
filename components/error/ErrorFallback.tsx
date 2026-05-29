"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorFallbackProps {
  error?: Error | null
  reset?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({ error, reset, title, message }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-dark mb-2">
          {title || "Une erreur est survenue"}
        </h2>
        <p className="text-sm text-[#69708A] mb-6">
          {message || "Veuillez rafraîchir la page ou réessayer plus tard."}
        </p>
        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-xs text-[#9CA3AF] hover:text-dark">
              Détails techniques
            </summary>
            <pre className="mt-2 rounded-lg bg-[#F5F3F0] p-3 text-xs text-red-700 overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
        {reset && (
          <div className="flex items-center justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
