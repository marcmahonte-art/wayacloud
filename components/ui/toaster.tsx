"use client"

import { Toaster as HotToaster } from "react-hot-toast"

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          color: "#121212",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#FF6300",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#DC2626",
            secondary: "#fff",
          },
        },
      }}
    />
  )
}
