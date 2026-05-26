"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthCard, AuthHeader } from "@/components/auth/AuthCard";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSeparator } from "@/components/auth/AuthSeparator";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { AuthTab } from "@/lib/auth/types";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const [tab, setTab] = useState<AuthTab>("email");

  if (authLoading && !user) {
    return (
      <div className="flex justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <AuthCard>
        <AuthHeader title="Créer un compte" subtitle="Inscrivez-vous pour commencer" />
        <AuthTabs value={tab} onChange={setTab} />
        <LoginForm tab={tab} mode="register" onOtpSent={() => router.push("/verify-otp")} />
        <AuthSeparator />
        <SocialAuth />
        <p className="text-sm text-helper text-center mt-6">
          Déjà un compte ? <Link href="/login" className="text-primary hover:underline font-medium">Connectez-vous</Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
