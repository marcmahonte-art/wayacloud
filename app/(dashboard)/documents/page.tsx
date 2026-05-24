"use client";

import { FileText, MoreVertical, Search, Download, Share2 } from "lucide-react";

const documents = [
  {
    id: 1,
    name: "CNIB_Recto.pdf",
    type: "Document d'identité",
    size: "1.2 Mo",
    date: "Aujourd'hui",
    icon: FileText,
    color: "bg-red-100 text-red-600",
  },
  {
    id: 2,
    name: "Facture_SONABEL_Janvier.pdf",
    type: "Facture",
    size: "0.8 Mo",
    date: "Il y a 2 jours",
    icon: FileText,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 3,
    name: "Contrat_Prestation.docx",
    type: "Contrat",
    size: "2.4 Mo",
    date: "Semaine dernière",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 4,
    name: "Devis_Construction.xlsx",
    type: "Tableur",
    size: "1.5 Mo",
    date: "Le mois dernier",
    icon: FileText,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 5,
    name: "Rapport_Annuel_2025.pdf",
    type: "Rapport",
    size: "5.1 Mo",
    date: "Il y a 2 mois",
    icon: FileText,
    color: "bg-red-100 text-red-600",
  },
];

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
            Mes Documents
          </h1>
          <p className="mt-1 text-sm text-[#596077]">
            Tous vos documents administratifs, contrats et factures.
          </p>
        </div>
        
        <label className="flex h-11 min-w-0 flex-1 sm:max-w-[300px] items-center gap-3 rounded-card border border-[#E3DFE8] bg-white px-4 shadow-sm">
          <Search size={19} className="text-[#516080]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#69708A]"
            placeholder="Rechercher un document..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#ECE7DF] bg-white p-4 shadow-sm transition-all hover:border-primary hover:shadow-card"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${doc.color}`}>
                <doc.icon size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-dark group-hover:text-primary transition-colors">{doc.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#69708A]">
                  <span className="font-medium text-slate-500">{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="Partager">
                <Share2 size={16} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="Télécharger">
                <Download size={16} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
