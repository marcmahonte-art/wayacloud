"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Gift, Share2, Users, Zap } from "lucide-react";
import { useMemo } from "react";

export default function ReferralPage() {
  const { profile } = useAuth();

  const referralCode = profile?.referral_code || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wayacloud.bf";
  const joinUrl = `${baseUrl}/join?ref=${referralCode}`;
  const waMessage = useMemo(
    () =>
      `Hey! I use WayaCloud to back up my photos. Use code ${referralCode} = 1 free month for both of us! ${baseUrl}/join?ref=${referralCode}`,
    [referralCode, baseUrl],
  );

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
  };

  const shareWA = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(waMessage)}`,
      "_blank",
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
          <Gift size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-dark">Parrainez un ami</h1>
        <p className="mt-2 text-[#69708A]">
          Offrez 1 mois gratuit et recevez 1 mois gratuit en retour
        </p>
      </div>

      <div className="rounded-2xl border border-[#ECE7DF] bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-[#69708A] uppercase tracking-wider">
          Votre code unique
        </p>
        <div
          onClick={copyCode}
          className="mx-auto mt-3 inline-flex cursor-pointer items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 px-8 py-4 transition hover:bg-primary/10"
        >
          <span className="text-3xl font-black tracking-[0.2em] text-[#FF6300]">
            {referralCode || "------"}
          </span>
          <Share2 size={20} className="text-primary" />
        </div>
        <p className="mt-1 text-xs text-[#69708A]">
          Cliquez pour copier
        </p>
      </div>

      <button
        onClick={shareWA}
        className="flex w-full items-center justify-center gap-3 rounded-btn bg-[#25D366] py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#20BD5A]"
      >
        <Share2 size={22} />
        Partager sur WhatsApp
      </button>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5 text-center shadow-sm">
          <Zap size={28} className="mx-auto text-primary" />
          <h3 className="mt-3 text-sm font-bold text-dark">
            1. Partagez votre code
          </h3>
          <p className="mt-1 text-xs text-[#69708A]">
            Envoyez votre lien à vos amis via WhatsApp
          </p>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5 text-center shadow-sm">
          <Users size={28} className="mx-auto text-primary" />
          <h3 className="mt-3 text-sm font-bold text-dark">
            2. Votre ami s&apos;inscrit
          </h3>
          <p className="mt-1 text-xs text-[#69708A]">
            Il utilise votre code lors de son inscription
          </p>
        </div>
        <div className="rounded-xl border border-[#ECE7DF] bg-white p-5 text-center shadow-sm">
          <Gift size={28} className="mx-auto text-primary" />
          <h3 className="mt-3 text-sm font-bold text-dark">
            3. Gagnez 1 mois offert
          </h3>
          <p className="mt-1 text-xs text-[#69708A]">
            Dès son premier abonnement, vous recevez 30 jours gratuits
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#ECE7DF] bg-[#FBF8FF] p-6 shadow-card">
        <h3 className="text-sm font-bold text-dark">Partagez votre lien</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={joinUrl}
            className="flex-1 rounded-lg border border-[#E3DFE8] bg-white px-4 py-2.5 text-sm text-[#516080] outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(joinUrl)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-light"
          >
            Copier
          </button>
        </div>
      </div>
    </div>
  );
}
