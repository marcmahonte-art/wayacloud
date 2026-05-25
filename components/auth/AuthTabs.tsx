"use client"

import * as React from "react"
import { Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthTabsProps {
  value: "email" | "phone"
  onChange: (value: "email" | "phone") => void
}

export function AuthTabs({ value, onChange }: AuthTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-tint mb-6">
      <button
        type="button"
        onClick={() => onChange("email")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          value === "email"
            ? "bg-white text-primary shadow-sm"
            : "text-gray hover:text-dark"
        )}
      >
        <Mail size={16} />
        Email
      </button>
      <button
        type="button"
        onClick={() => onChange("phone")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          value === "phone"
            ? "bg-white text-primary shadow-sm"
            : "text-gray hover:text-dark"
        )}
      >
        <Phone size={16} />
        Téléphone
      </button>
    </div>
  )
}
