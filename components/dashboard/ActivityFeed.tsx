"use client";

import { CloudUpload, X, Trash2, Check, Share2, Folder, Bot, MessageCircle, Wallet, Crown, UserPlus, Zap } from "lucide-react";
import { useStorageStore } from "@/lib/store/storage-store";

const ACTIVITY_ICONS: Record<string, { icon: any; color: string }> = {
  upload: { icon: CloudUpload, color: "text-violet-600" },
  delete: { icon: X, color: "text-red-500" },
  trash: { icon: Trash2, color: "text-amber-500" },
  restore: { icon: Check, color: "text-green-600" },
  share: { icon: Share2, color: "text-blue-600" },
  rename: { icon: Folder, color: "text-sky-600" },
  folder_create: { icon: Folder, color: "text-amber-500" },
  ai_action: { icon: Bot, color: "text-violet-600" },
  backup: { icon: MessageCircle, color: "text-wa-green" },
  catalog_backup: { icon: MessageCircle, color: "text-wa-green" },
  payment: { icon: Wallet, color: "text-green-600" },
  subscription: { icon: Crown, color: "text-primary" },
  signup: { icon: UserPlus, color: "text-blue-600" },
};

function formatTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function ActivityFeed() {
  const activities = useStorageStore((s) => s.activities);

  const display = (activities || []).slice(0, 10);

  return (
    <div className="space-y-4">
      {display.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F3F0]">
            <Zap size={20} className="text-[#C8C0B5]" />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-slate-500">Aucune activité récente</p>
          <p className="text-xs text-slate-400 mt-1">Importez un fichier pour commencer</p>
        </div>
      ) : (
        display.map((item) => {
          const actIcon = ACTIVITY_ICONS[item.type] || { icon: Zap, color: "text-[#69708A]" };
          const Icon = actIcon.icon;
          return (
            <div key={item.id} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] gap-3">
              <Icon className={actIcon.color} size={18} />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-[#69708A] truncate">{item.description}</p>
                )}
              </div>
              <p className="text-xs text-[#9CA3AF] whitespace-nowrap">{formatTime(item.created_at)}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
