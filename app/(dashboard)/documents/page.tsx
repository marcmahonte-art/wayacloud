"use client";

import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-[#596077]">Retrouvez tous vos documents importants.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-[#ECE7DF] bg-white py-20 shadow-sm">
        <FileText size={48} className="text-slate-300" />
        <p className="mt-4 text-[15px] font-semibold text-slate-500">Aucun document</p>
        <p className="mt-1 text-sm text-slate-400">Importez des documents pour les retrouver ici.</p>
      </div>
    </div>
  );
}
