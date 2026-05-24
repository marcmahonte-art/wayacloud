"use client";

import { useState } from "react";
import { Loader2, Globe2 } from "lucide-react";

export default function TraductionPage() {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("Anglais");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
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
    <div className="mx-auto max-w-4xl space-y-6 pt-6">
      <div className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-sky-50 text-blue-600">
            <Globe2 size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-dark">Traduction instantanée</h1>
            <p className="text-sm text-[#69708A]">Traduisez rapidement vos messages</p>
          </div>
        </div>
        
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Texte source</span>
            </div>
            <textarea
              className="w-full rounded-md border border-[#E3DFE8] p-4 text-sm focus:border-blue-500 focus:outline-none"
              rows={8}
              placeholder="Texte à traduire..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm font-bold">Traduire vers :</span>
              <select 
                className="text-sm border border-[#E3DFE8] rounded-md px-2 py-1 outline-none focus:border-blue-500"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                <option value="Anglais">Anglais</option>
                <option value="Français">Français</option>
                <option value="Mooré">Mooré (Expérimental)</option>
                <option value="Dioula">Dioula (Expérimental)</option>
              </select>
            </div>
            <div className="w-full rounded-md border border-[#E3DFE8] bg-slate-50 p-4 text-sm min-h-[192px] whitespace-pre-wrap text-[#596077]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-blue-600">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : (
                result || "La traduction s'affichera ici..."
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !text}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-btn bg-blue-600 px-8 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 w-full md:w-auto"
          >
            {isLoading ? "Traduction..." : "Traduire"}
          </button>
        </div>
      </div>
    </div>
  );
}
