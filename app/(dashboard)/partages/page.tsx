"use client";

import { Share2 } from "lucide-react";

export default function PartagesPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Mes Partages</h1>
          <p className="mt-1 text-sm text-[#596077]">Gérez les fichiers que vous avez partagés.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-[#ECE7DF] bg-white py-20 shadow-sm">
        <Share2 size={48} className="text-slate-300" />
        <p className="mt-4 text-[15px] font-semibold text-slate-500">Aucun fichier partagé</p>
        <p className="mt-1 text-sm text-slate-400">Partagez un fichier pour commencer.</p>
      </div>
    </div>
  );
}
