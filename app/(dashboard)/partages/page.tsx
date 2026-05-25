"use client";

export const dynamic = "force-dynamic";

import { Copy, FileImage, FileText, Link as LinkIcon, MoreVertical, Share2, StopCircle, User } from "lucide-react";

const sharedItems = [
  {
    id: 1,
    name: "Vacances Bobo 2026.jpg",
    type: "Image",
    icon: FileImage,
    color: "text-violet-600 bg-violet-50",
    sharedWith: "Lien public",
    sharedWithIcon: LinkIcon,
    views: 12,
    date: "12 Mai 2026",
    status: "Actif",
  },
  {
    id: 2,
    name: "Budget_Projet_V2.xlsx",
    type: "Document",
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
    sharedWith: "adama@wayacloud.bf",
    sharedWithIcon: User,
    views: 3,
    date: "Modifié hier",
    status: "Actif",
  },
  {
    id: 3,
    name: "Contrat_Location_Ouaga.pdf",
    type: "PDF",
    icon: FileText,
    color: "text-red-600 bg-red-50",
    sharedWith: "Lien public",
    sharedWithIcon: LinkIcon,
    views: 45,
    date: "Il y a 3 jours",
    status: "Expiré",
  }
];

export default function PartagesPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12 pt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark sm:text-3xl">
            Mes Partages
          </h1>
          <p className="mt-1 text-sm text-[#596077]">
            Gérez les fichiers que vous avez partagés avec d'autres personnes.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECE7DF] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#ECE7DF] bg-slate-50 text-xs font-semibold text-[#69708A] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Fichier partagé</th>
                <th className="px-6 py-4">Partagé avec</th>
                <th className="px-6 py-4">Date de partage</th>
                <th className="px-6 py-4">Vues</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7DF]">
              {sharedItems.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-dark">{item.name}</p>
                        <p className="text-xs text-[#69708A]">{item.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <item.sharedWithIcon size={14} className="text-slate-400" />
                      {item.sharedWith}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {item.views}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      item.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Copier le lien">
                        <Copy size={16} />
                      </button>
                      {item.status === 'Actif' && (
                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Arrêter le partage">
                          <StopCircle size={16} />
                        </button>
                      )}
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <MoreVertical size={16} />
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
