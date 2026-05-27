"use client"

import React from "react"
import { logger } from "@/lib/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React Error Boundary caught", { error: error.message, componentStack: errorInfo.componentStack })
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-xl text-red-600">!</span>
            </div>
            <h3 className="text-lg font-bold text-dark mb-2">Une erreur est survenue</h3>
            <p className="text-sm text-[#69708A] mb-4">
              {this.state.error?.message || "Veuillez rafraîchir la page et réessayer."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
