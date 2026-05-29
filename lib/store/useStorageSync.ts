"use client";

import { useEffect } from "react";
import { useStorageStore } from "@/lib/store/storage-store";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export function useStorageSync(userId: string | undefined) {
  const refreshAll = useStorageStore((s) => s.refreshAll);

  useEffect(() => {
    if (userId) refreshAll();
  }, [userId, refreshAll]);

  useRealtimeSync(userId);
}
