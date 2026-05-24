"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DetectionArnaquesPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/detect-scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        alert(data.error || "Erreur");
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
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-red-100 text-red-700">
            <ShieldAlert size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-dark">Détection d'arnaques</h1>
            <p className="text-sm text-[#69708A]">Analysez les messages suspects avec l'IA</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <textarea
            className="w-full rounded-md border border-[#E3DFE8] p-4 text-sm focus:border-red-500 focus:outline-none"
            rows={6}
            placeholder="Collez ici le message, le mail ou le lien suspect..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !text}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? "Analyse en cours..." : "Vérifier le message"}
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-md bg-red-50 p-6 border border-red-200">
            <h2 className="text-sm font-bold text-red-900 mb-4">Verdict de l'IA :</h2>
            <div className="text-sm text-red-800 whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
