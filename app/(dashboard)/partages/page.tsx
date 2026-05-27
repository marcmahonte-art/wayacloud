"use client";

import { useState, useCallback } from "react";
import {
  Copy, FileImage, FileText, Link as LinkIcon, MoreVertical,
  StopCircle, User, Share2, Check, X, Globe,
} from "lucide-react";
import { ShareModal } from "@/components/dashboard/ShareModal";

const sharedItems = [
  { id: 1, name: "Vacances Bobo 2026.jpg", type: "Image", icon: FileImage, color: "text-violet-600 bg-violet-50", sharedWith: "Lien public", sharedWithIcon: LinkIcon, views: 12, date: "12 Mai 2026", status: "Actif" },
  { id: 2, name: "Budget_Projet_V2.xlsx", type: "Document", icon: FileText, color: "text-blue-600 bg-blue-50", sharedWith: "adama@wayacloud.bf", sharedWithIcon: User, views: 3, date: "Modifié hier", status: "Actif" },
  { id: 3, name: "Contrat_Location_Ouaga.pdf", type: "PDF", icon: FileText, color: "text-red-600 bg-red-50", sharedWith: "Lien public", sharedWithIcon: LinkIcon, views: 45, date: "Il y a 3 jours", status: "Expiré" },
  { id: 4, name: "Rapport_Annuel_2025.xlsx", type: "Document", icon: FileText, color: "text-blue-600 bg-blue-50", sharedWith: "fatima@wayacloud.bf", sharedWithIcon: User, views: 8, date: "Il y a 5 jours", status: "Actif" },
];

export default function PartagesPage() {
  const [shareModalFile, setShareModalFile] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [items, setItems] = useState(sharedItems);

  const copyLink = useCallback(async (id: number, name: string) => {
    const link = `https://wayacloud.silk.vercel.app/s/lien-${id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const stopSharing = (id: number) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, status: "Expiré" as const } : item
    ));
  };

  const openShareModal = (item: typeof items[0]) => {
    setShareModalFile({ name: item.name, url: "", type: item.type.toLowerCase(), color: item.color });
  };

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Mes Partages</h1>
          <p className="mt-1 text-sm text-[#596077]">Gérez les fichiers que vous avez partagés.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShareModalFile({ name: "Nouveau partage", url: "", type: "document", color: "bg-blue-100 text-blue-600" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[13px] font-bold text-white hover:bg-primary-light transition-colors"
          >
            <Share2 size={16} />
            Nouveau partage
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-[#ECE7DF] bg-slate-50 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Fichier</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Partagé avec</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4 hidden md:table-cell">Vues</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Statut</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DF]">
              {items.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-dark truncate max-w-[120px] sm:max-w-[180px] md:max-w-[260px]">{item.name}</p>
                        <p className="text-[11px] text-[#69708A]">{item.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                      <item.sharedWithIcon size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.sharedWith}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4 text-[13px] text-slate-500 hidden sm:table-cell">
                    {item.date}
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4 text-[13px] text-slate-500 font-medium hidden md:table-cell">
                    {item.views}
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      item.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyLink(item.id, item.name)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="Copier le lien"
                      >
                        {copiedId === item.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                      </button>
                      <button
                        onClick={() => openShareModal(item)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="Paramètres de partage"
                      >
                        <Globe size={15} />
                      </button>
                      {item.status === 'Actif' && (
                        <button
                          onClick={() => stopSharing(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Arrêter le partage"
                        >
                          <StopCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Share2 size={40} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucun fichier partagé</p>
                    <p className="text-xs text-slate-400 mt-1">Partagez un fichier pour commencer.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShareModal
        isOpen={!!shareModalFile}
        onClose={() => setShareModalFile(null)}
        file={shareModalFile}
      />
    </div>
  );
}
