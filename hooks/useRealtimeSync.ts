"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface RealtimeSyncOptions {
  onActivity?: (activity: any) => void;
  onQuotaChange?: (quota: any) => void;
  onFileChange?: (file: any) => void;
}

export function useRealtimeSync(userId: string | undefined, options: RealtimeSyncOptions) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!userId) return;

    let destroyed = false;

    try {
      if (!supabaseRef.current) {
        supabaseRef.current = createClient();
      }
      const supabase = supabaseRef.current;

      const handleActivity = (payload: RealtimePostgresChangesPayload<any>) => {
        if (payload.eventType === "INSERT" && optionsRef.current.onActivity) {
          optionsRef.current.onActivity(payload.new);
        }
      };

      const handleQuota = (payload: RealtimePostgresChangesPayload<any>) => {
        if (payload.eventType === "UPDATE" && optionsRef.current.onQuotaChange && payload.new.user_id === userId) {
          optionsRef.current.onQuotaChange(payload.new);
        }
      };

      const handleFile = (payload: RealtimePostgresChangesPayload<any>) => {
        if (!optionsRef.current.onFileChange) return;
        if (payload.eventType === "INSERT" && payload.new.owner_id === userId) {
          optionsRef.current.onFileChange(payload.new);
        }
        if (payload.eventType === "UPDATE" && payload.new.owner_id === userId) {
          optionsRef.current.onFileChange(payload.new);
        }
        if (payload.eventType === "DELETE" && payload.old?.owner_id === userId) {
          optionsRef.current.onFileChange(payload.old);
        }
      };

      const activitiesSub = supabase
        .channel(`realtime-activities-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "activities", filter: `user_id=eq.${userId}` },
          handleActivity,
        )
        .subscribe();

      const quotaSub = supabase
        .channel(`realtime-quota-${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "storage_quotas", filter: `user_id=eq.${userId}` },
          handleQuota,
        )
        .subscribe();

      const filesSub = supabase
        .channel(`realtime-files-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "files", filter: `owner_id=eq.${userId}` },
          handleFile,
        )
        .subscribe();

      return () => {
        destroyed = true;
        try {
          supabase.removeChannel(activitiesSub);
        } catch {}
        try {
          supabase.removeChannel(quotaSub);
        } catch {}
        try {
          supabase.removeChannel(filesSub);
        } catch {}
      };
    } catch (err) {
      console.warn("useRealtimeSync: subscription error", err);
    }
  }, [userId]);
}
