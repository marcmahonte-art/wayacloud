"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialIcon } from "@/components/ui/SocialIcon"
import { signInWithGoogle, signInWithFacebook } from "@/lib/auth/service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function SocialAuth() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      if (error.message?.includes("not enabled") || error.message?.includes("Unsupported")) {
        toast.error("Google n'est pas configuré. Configure-le dans Supabase Dashboard → Authentication → Providers → Google.")
      } else {
        toast.error(error.message)
      }
    }
    setGoogleLoading(false)
  }

  const handleFacebook = async () => {
    setFacebookLoading(true)
    const { error } = await signInWithFacebook()
    if (error) {
      if (error.message?.includes("not enabled") || error.message?.includes("Unsupported")) {
        toast.error("Facebook n'est pas configuré. Configure-le dans Supabase Dashboard → Authentication → Providers → Facebook.")
      } else {
        toast.error(error.message)
      }
    }
    setFacebookLoading(false)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={googleLoading}
        onClick={handleGoogle}
        className={cn(
          "gap-2 h-11 rounded-xl transition-all duration-200",
          googleLoading && "opacity-70 cursor-not-allowed"
        )}
      >
        {googleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <SocialIcon network="google" size={18} />
        )}
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={facebookLoading}
        onClick={handleFacebook}
        className={cn(
          "gap-2 h-11 rounded-xl transition-all duration-200",
          facebookLoading && "opacity-70 cursor-not-allowed"
        )}
      >
        {facebookLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <SocialIcon network="facebook" size={18} />
        )}
        Facebook
      </Button>
    </div>
  )
}
