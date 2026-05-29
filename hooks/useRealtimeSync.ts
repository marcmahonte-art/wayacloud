"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStorageStore, type FileEntry, type ActivityEntry } from "@/lib/store/storage-store";

let channelCounter = 0;

export function useRealtimeSync(userId: string | undefined) {
  const stableUserId = useRef(userId);
  stableUserId.current = userId;

  useEffect(() => {
    const uid = stableUserId.current;
    if (!uid) return;

    const supabase = createClient();
    const store = useStorageStore;

    const id = ++channelCounter;

    const filesChannel = supabase
      .channel(`files-changes-${id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "files", filter: `owner_id=eq.${uid}` },
        (payload) => {
          if (payload.eventType === "INSERT") store.getState().addFile(payload.new as FileEntry);
          if (payload.eventType === "UPDATE") store.getState().updateFile(payload.new.id, payload.new as Partial<FileEntry>);
          if (payload.eventType === "DELETE") store.getState().removeFile(payload.old.id);
        },
      );

    const quotaChannel = supabase
      .channel(`quota-changes-${id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "storage_quotas", filter: `user_id=eq.${uid}` },
        (payload) => {
          store.getState().setQuota(payload.new);
        },
      );

    const activityChannel = supabase
      .channel(`activity-feed-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "activities", filter: `user_id=eq.${uid}` },
        (payload) => store.getState().addActivity(payload.new as ActivityEntry),
      );

    filesChannel.subscribe();
    quotaChannel.subscribe();
    activityChannel.subscribe();

    return () => {
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(quotaChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [userId]);
}
