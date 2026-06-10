"use client";

import { useEffect } from "react";
import { useStorageStore } from "@/lib/store/storage-store";

/**
 * Hook qui charge le quota de stockage au montage et le rafraîchit
 * automatiquement via les subscriptions realtime Supabase (déjà configurées
 * dans storage-store.ts). Expose les données utiles pour l'affichage.
 */
export function useStorageUsage() {
  const quota = useStorageStore((s) => s.quota);
  const refreshQuota = useStorageStore((s) => s.refreshQuota);

  // Charger le quota au montage
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  const usedBytes = quota.storage_used_bytes;
  const limitBytes = quota.storage_limit_bytes;
  const percentage = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

  return { usedBytes, limitBytes, percentage };
}
