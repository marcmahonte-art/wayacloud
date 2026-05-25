"use client"

export function AuthSeparator() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-3 text-helper">ou continuer avec</span>
      </div>
    </div>
  )
}
