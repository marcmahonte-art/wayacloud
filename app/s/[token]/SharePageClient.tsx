"use client";

import { useState } from "react";

interface Props {
  token: string;
  fileName: string;
}

export function SharePageClient({ token, fileName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/share/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur de téléchargement");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-70"
      >
        {loading ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {loading ? "Préparation..." : "Télécharger le fichier"}
      </button>
    </div>
  );
}
