"use client";

import { useStorageStore } from "@/lib/store/storage-store";
import { formatBytes } from "@/lib/formatters";

function percentUsed(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function StorageQuotaBar() {
  const quota = useStorageStore((s) => s.quota);

  const usedDisplay = formatBytes(quota.storage_used_bytes);
  const limitDisplay = formatBytes(quota.storage_limit_bytes);
  const usagePercent = percentUsed(quota.storage_used_bytes, quota.storage_limit_bytes);
  const remainingDisplay = formatBytes(quota.storage_limit_bytes - quota.storage_used_bytes);

  return (
    <article className="min-h-[220px] overflow-hidden rounded-card bg-gradient-to-br from-primary to-[#FF7A00] p-6 text-white shadow-card md:col-span-2 xl:col-span-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold">Espace de stockage</p>
          <p className="mt-5 text-4xl font-bold">{usedDisplay}</p>
          <p className="mt-2 text-base font-semibold">sur {limitDisplay} utilisés</p>
        </div>
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[14px] border-white/30">
          <div className="absolute inset-[-14px] rounded-full border-[14px] border-white border-l-white/30 border-t-white/30" />
          <span className="relative text-xl font-bold">{usagePercent}%</span>
        </div>
      </div>
      <div className="mt-6 h-1.5 rounded-pill bg-white/25">
        <div className="h-full rounded-pill bg-white" style={{ width: `${usagePercent}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{remainingDisplay} disponibles</p>
        <a href="/dashboard/storage" className="rounded-btn border border-white/50 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors inline-block">
          Voir les détails →
        </a>
      </div>
    </article>
  );
}
