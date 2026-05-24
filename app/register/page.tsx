// app/register/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast"; // optional toast library, assume it's installed

const supabase = createClient();

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Inscription réussie ! Un e‑mail de confirmation a été envoyé.");
      // Optional: redirect after a short delay
      setTimeout(() => router.push("/dashboard"), 2000);
    }
    setLoading(false);
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Un lien magique a été envoyé à votre e‑mail. Vérifiez votre boîte de réception.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
        <h1 className="text-center text-3xl font-extrabold text-gray-800">Créer un compte</h1>
        {message && (
          <div className="rounded bg-gray-100 p-3 text-sm text-gray-800" role="alert">
            {message}
          </div>
        )}
        {/* ==== Inscription par Email + Mot de passe ==== */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "En cours…" : "Créer un compte (email + mdp)"}
          </button>
        </form>
        <hr className="border-t border-gray-300" />
        {/* ==== Connexion / inscription par OTP (Magic Link) ==== */}
        <form onSubmit={handleOtp} className="space-y-4">
          <div>
            <label htmlFor="otp-email" className="block text-sm font-medium text-gray-700">
              Email pour le lien magique
            </label>
            <input
              id="otp-email"
              type="email"
              required
              className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-purple-600 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "En cours…" : "Envoyer le lien magique (OTP)"}
          </button>
        </form>
      </div>
    </div>
  );
}
