"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/Logo"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-3xl bg-white p-8 shadow-glass border border-border/50",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-6">
        <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
          <Logo className="w-[160px] text-[#111827]" />
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-dark tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-gray">{subtitle}</p>
      )}
    </div>
  )
}

export function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-helper text-center mt-6">
      {children}
    </p>
  )
}
