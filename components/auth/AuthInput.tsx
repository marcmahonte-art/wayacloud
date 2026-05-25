"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  label?: string
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, icon, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-dark/80">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-helper">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-xl border border-border bg-white px-4 py-2 text-sm text-dark placeholder:text-helper/70",
              "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-white",
              "transition-all duration-200",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)
AuthInput.displayName = "AuthInput"

export { AuthInput }
