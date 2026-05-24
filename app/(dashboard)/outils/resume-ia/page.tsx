"use client";

import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

export default function ResumeIAPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.summary || data.result);
      } else {
        alert(data.error || data.message || "Erreur");
      }
    } catch (e: any) {
      alert("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-6">
      <div className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-violet-100 text-violet-700">
            <MessageCircle size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-dark">Résumé IA</h1>
            <p className="text-sm text-[#69708A]">Générez un résumé de vos conversations avec Claude</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <textarea
            className="w-full rounded-md border border-[#E3DFE8] p-4 text-sm focus:border-primary focus:outline-none"
            rows={8}
            placeholder="Collez ici le texte de votre conversation..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !text}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-primary px-6 text-sm font-bold text-white hover:bg-primary-light disabled:opacity-50"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? "Génération en cours..." : "Générer le résumé"}
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-md bg-slate-50 p-6 border border-slate-200">
            <h2 className="text-sm font-bold text-dark mb-4">Résultat :</h2>
            <div className="text-sm text-[#596077] whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
