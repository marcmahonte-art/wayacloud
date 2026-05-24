"use client";

import { useState, useRef } from "react";
import { Loader2, FileText, Upload } from "lucide-react";

export default function TriAutomatiquePage() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult("");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result?.toString().split(",")[1];
        if (!base64Data) throw new Error("Erreur de lecture de l'image");

        const res = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Data, mediaType: file.type }),
        });
        
        const data = await res.json();
        if (res.ok) {
          setResult(data.result);
        } else {
          alert(data.error || "Erreur");
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      alert("Erreur de traitement");
      setIsLoading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-6">
      <div className="rounded-card border border-[#ECE7DF] bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-card bg-green-100 text-green-700">
            <FileText size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-dark">Tri Automatique (Vision)</h1>
            <p className="text-sm text-[#69708A]">Importez une image (CNIB, Reçu) et Claude extraira les données</p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center border-2 border-dashed border-[#E3DFE8] rounded-xl p-12 bg-slate-50">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAnalyze} 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex flex-col items-center gap-4 text-[#69708A] hover:text-primary transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={48} className="animate-spin text-primary" />
            ) : (
              <Upload size={48} />
            )}
            <span className="text-sm font-bold">
              {isLoading ? "Analyse par l'IA en cours..." : "Cliquez pour importer un document (Image)"}
            </span>
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-md bg-green-50 p-6 border border-green-200">
            <h2 className="text-sm font-bold text-green-900 mb-4">Informations extraites :</h2>
            <div className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
