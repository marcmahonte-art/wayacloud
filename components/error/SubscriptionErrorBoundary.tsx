"use client"

import React from "react"
import { ErrorFallback } from "./ErrorFallback"
import { logger } from "@/lib/logger"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SubscriptionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Subscription error boundary caught", { error: error.message, componentStack: errorInfo.componentStack })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          reset={this.handleReset}
          title="Erreur d'affichage de l'abonnement"
          message="Impossible de charger les informations de votre abonnement. Veuillez réessayer."
        />
      )
    }
    return this.props.children
  }
}
