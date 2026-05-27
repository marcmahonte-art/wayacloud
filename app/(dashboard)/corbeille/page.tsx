"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCcw, Trash2, FileImage, FileText, Play, X, Check } from "lucide-react";

interface TrashItem {
  id: number;
  name: string;
  type: string;
  size: string;
  deletedDate: string;
  daysRemaining: number;
  icon: React.ElementType;
  color: string;
}

const initialTrash: TrashItem[] = [
  { id: 1, name: "Ancienne_Photo_Profil.jpg", type: "Image", size: "3.2 Mo", deletedDate: "Il y a 2 jours", daysRemaining: 28, icon: FileImage, color: "bg-orange-100 text-orange-600" },
  { id: 2, name: "Brouillon_Projet.docx", type: "Document", size: "1.1 Mo", deletedDate: "Semaine dernière", daysRemaining: 21, icon: FileText, color: "bg-blue-100 text-blue-600" },
  { id: 3, name: "Video_Test_WhatsApp.mp4", type: "Vidéo", size: "15.4 Mo", deletedDate: "Il y a 3 semaines", daysRemaining: 2, icon: Play, color: "bg-violet-100 text-violet-600" },
];

export default function CorbeillePage() {
  const [items, setItems] = useState<TrashItem[]>(initialTrash);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const restoreItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
    showToast("Fichier restauré avec succès");
  };

  const deletePermanently = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
    showToast("Fichier supprimé définitivement");
  };

  const emptyTrash = () => {
    if (items.length === 0) return;
    setItems([]);
    showToast("Corbeille vidée avec succès");
  };

  const totalSize = items.reduce((acc, item) => {
    const num = parseFloat(item.size);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">Corbeille</h1>
          <p className="mt-1 text-sm text-[#596077]">
            Les éléments seront définitivement supprimés après 30 jours.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#69708A] font-medium">
            {items.length} élément{items.length > 1 ? "s" : ""} · {totalSize.toFixed(1)} Mo
          </span>
          {items.length > 0 && (
            <button
              onClick={emptyTrash}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-[13px] font-bold text-red-600 shadow-sm transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} />
              Vider la corbeille
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800 border border-orange-100">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <p className="text-[13px] leading-6">
          La suppression définitive libère de l&apos;espace de stockage, mais cette action est irréversible.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-[#ECE7DF] bg-slate-50 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Fichier</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Taille</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4 hidden sm:table-cell">Supprimé le</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4">Expiration</th>
                <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DF]">
              {items.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon size={18} />
                      </div>
                      <p className="text-[13px] font-bold text-dark truncate max-w-[200px] sm:max-w-[320px]">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 sm:px-6 sm:py-4 text-[13px] text-slate-500 font-medium">
                    {item.size}
                  </td>
                  <td className="px-5 py-3 sm:px-6 sm:py-4 text-[13px] text-slate-500 hidden sm:table-cell">
                    {item.deletedDate}
                  </td>
                  <td className="px-5 py-3 sm:px-6 sm:py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      item.daysRemaining <= 7 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.daysRemaining} jours
                    </span>
                  </td>
                  <td className="px-5 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => restoreItem(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                        title="Restaurer"
                      >
                        <RefreshCcw size={15} />
                      </button>
                      <button
                        onClick={() => deletePermanently(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Trash2 size={40} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-[13px] font-semibold text-slate-500">La corbeille est vide</p>
                    <p className="text-xs text-slate-400 mt-1">Les fichiers supprimés apparaîtront ici.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-4 ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.type === "success" ? <Check size={17} className="text-green-600" /> : <X size={17} className="text-red-600" />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
