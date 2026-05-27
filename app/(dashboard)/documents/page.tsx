"use client";

import { useState, useCallback } from "react";
import { FileText, MoreVertical, Search, Download, Share2, Eye, Check } from "lucide-react";
import { FileContextMenu } from "@/components/dashboard/FileContextMenu";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { FileViewerModal } from "@/components/ui/FileViewerModal";

const documents = [
  { id: 1, name: "CNIB_Recto.pdf", type: "Document d'identité", size: "1.2 Mo", date: "Aujourd'hui", icon: FileText, color: "bg-red-100 text-red-600", fileType: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: 2, name: "Facture_SONABEL_Janvier.pdf", type: "Facture", size: "0.8 Mo", date: "Il y a 2 jours", icon: FileText, color: "bg-orange-100 text-orange-600", fileType: "pdf", url: "#" },
  { id: 3, name: "Contrat_Prestation.docx", type: "Contrat", size: "2.4 Mo", date: "Semaine dernière", icon: FileText, color: "bg-blue-100 text-blue-600", fileType: "document", url: "#" },
  { id: 4, name: "Devis_Construction.xlsx", type: "Tableur", size: "1.5 Mo", date: "Le mois dernier", icon: FileText, color: "bg-green-100 text-green-600", fileType: "document", url: "#" },
  { id: 5, name: "Rapport_Annuel_2025.pdf", type: "Rapport", size: "5.1 Mo", date: "Il y a 2 mois", icon: FileText, color: "bg-red-100 text-red-600", fileType: "pdf", url: "#" },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ file: any; position: { x: number; y: number }; open: boolean }>({ file: null, position: { x: 0, y: 0 }, open: false });
  const [shareModalFile, setShareModalFile] = useState<any>(null);
  const [viewerFile, setViewerFile] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2000);
  };

  const filtered = documents.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const openContextMenu = (e: React.MouseEvent, doc: typeof documents[0]) => {
    e.preventDefault();
    setContextMenu({ file: { name: doc.name, url: doc.url, type: doc.fileType, size: doc.size, color: doc.color }, position: { x: e.clientX, y: e.clientY }, open: true });
  };

  const handleContextMenuAction = useCallback((actionId: string, file: any) => {
    if (actionId === "open" && file.url && file.url !== "#") setViewerFile(file);
    if (actionId === "share") setShareModalFile(file);
    if (actionId === "download" && file.url && file.url !== "#") { const a = document.createElement("a"); a.href = file.url; a.download = file.name; a.click(); }
    setContextMenu((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Mes Documents</h1>
          <p className="mt-1 text-sm text-[#596077]">Tous vos documents administratifs, contrats et factures.</p>
        </div>
        <label className="flex h-10 max-w-[280px] items-center gap-2.5 rounded-card border border-[#E3DFE8] bg-white px-3.5 shadow-sm">
          <Search size={16} className="text-[#516080]" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#69708A]" placeholder="Rechercher..." />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            onContextMenu={(e) => openContextMenu(e, doc)}
            className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#ECE7DF] bg-white p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-card"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${doc.color}`}>
                <doc.icon size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-dark text-[14px]">{doc.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[#69708A]">
                  <span className="font-medium">{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {doc.url && doc.url !== "#" && (
                <button onClick={() => setViewerFile({ name: doc.name, url: doc.url, type: doc.fileType, size: doc.size, color: doc.color })} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="Ouvrir">
                  <Eye size={15} />
                </button>
              )}
              <button onClick={() => setShareModalFile({ name: doc.name, url: doc.url, type: doc.fileType, size: doc.size, color: doc.color })} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="Partager">
                <Share2 size={15} />
              </button>
              <button onClick={(e) => openContextMenu(e, doc)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <MoreVertical size={15} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <FileText size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucun document trouvé</p>
          </div>
        )}
      </div>

      <FileContextMenu file={contextMenu.file} isOpen={contextMenu.open} position={contextMenu.position} onClose={() => setContextMenu((prev) => ({ ...prev, open: false }))} onAction={handleContextMenuAction} />
      <ShareModal isOpen={!!shareModalFile} onClose={() => setShareModalFile(null)} file={shareModalFile} />
      <FileViewerModal isOpen={!!viewerFile} onClose={() => setViewerFile(null)} file={viewerFile ? { name: viewerFile.name, url: viewerFile.url, type: viewerFile.type } : null} />

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 text-green-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <Check size={17} className="text-green-600" />
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
