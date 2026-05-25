"use client"

import { Toaster } from "sonner"
import { AuthProvider } from "@/providers/AuthProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            color: "#121212",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            fontSize: "14px",
          },
        }}
      />
    </AuthProvider>
  )
}
