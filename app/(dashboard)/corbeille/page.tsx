"use client";

import { AlertTriangle, RefreshCcw, Trash2, FileImage, FileText, Play } from "lucide-react";

const trashItems = [
  {
    id: 1,
    name: "Ancienne_Photo_Profil.jpg",
    type: "Image",
    size: "3.2 Mo",
    deletedDate: "Il y a 2 jours",
    daysRemaining: 28,
    icon: FileImage,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: 2,
    name: "Brouillon_Projet.docx",
    type: "Document",
    size: "1.1 Mo",
    deletedDate: "Semaine dernière",
    daysRemaining: 21,
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    name: "Video_Test_WhatsApp.mp4",
    type: "Vidéo",
    size: "15.4 Mo",
    deletedDate: "Il y a 3 semaines",
    daysRemaining: 2,
    icon: Play,
    color: "bg-violet-100 text-violet-600",
  },
];

export default function CorbeillePage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
            Corbeille
          </h1>
          <p className="mt-1 text-sm text-[#596077]">
            Les éléments de la corbeille seront définitivement supprimés après 30 jours.
          </p>
        </div>
        
        <button className="flex items-center gap-2 rounded-btn border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-colors hover:bg-red-50">
          <Trash2 size={16} />
          Vider la corbeille
        </button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800 border border-orange-100">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <p className="text-sm">
          Attention : La suppression définitive de vos fichiers libère de l'espace de stockage, mais cette action est irréversible. Pensez à vérifier avant de vider la corbeille.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#ECE7DF] bg-slate-50 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nom du fichier</th>
                <th className="px-6 py-4">Taille</th>
                <th className="px-6 py-4">Supprimé le</th>
                <th className="px-6 py-4">Expiration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DF]">
              {trashItems.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <p className="font-bold text-dark">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {item.size}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.deletedDate}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.daysRemaining <= 7 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.daysRemaining} jours restants
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-green-600 hover:bg-green-50 transition-colors" title="Restaurer">
                        <RefreshCcw size={16} />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors" title="Supprimer définitivement">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
