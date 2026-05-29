"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface FileEntry {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  object_key: string;
  status: string;
  is_trashed: boolean;
  trashed_at: string | null;
  is_favorite: boolean;
  color_label: string | null;
  parent_id: string | null;
  checksum_sha256: string | null;
  created_at: string;
  updated_at: string;
}

export interface StorageQuota {
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface ActivityEntry {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface StorageState {
  files: FileEntry[];
  trashedFiles: FileEntry[];
  quota: StorageQuota;
  activities: ActivityEntry[];
  loading: boolean;
  error: string | null;
}

interface StorageActions {
  addFile: (file: FileEntry) => void;
  updateFile: (id: string, patch: Partial<FileEntry>) => void;
  removeFile: (id: string) => void;
  setQuota: (quota: { used_bytes?: number; limit_bytes?: number; storage_used_bytes?: number; storage_limit_bytes?: number }) => void;
  recalcQuota: () => void;
  addActivity: (activity: ActivityEntry) => void;
  refreshAll: () => Promise<void>;
}

export function computeUsedBytes(files: FileEntry[]): number {
  return files
    .filter((f) => !f.is_trashed)
    .reduce((sum, f) => sum + Number(f.size_bytes || 0), 0);
}

export function computeLargestFiles(files: FileEntry[], limit = 20): FileEntry[] {
  return [...files]
    .filter((f) => !f.is_trashed)
    .sort((a, b) => Number(b.size_bytes || 0) - Number(a.size_bytes || 0))
    .slice(0, limit);
}

export const useStorageStore = create<StorageState & StorageActions>()(
  subscribeWithSelector((set, get) => ({
    files: [] as FileEntry[],
    trashedFiles: [] as FileEntry[],
    quota: { storage_used_bytes: 0, storage_limit_bytes: 5_368_709_120 } as StorageQuota,
    activities: [] as ActivityEntry[],
    loading: true,
    error: null as string | null,

    addFile: (file: FileEntry) => {
      if (file.is_trashed) return;
      set((state: StorageState) => {
        if (state.files.some((f: FileEntry) => f.id === file.id)) return state;
        return { files: [file, ...state.files] };
      });
    },

    updateFile: (id: string, patch: Partial<FileEntry>) => {
      set((state: StorageState) => {
        const toTrash = patch.is_trashed === true;
        const fromTrash = patch.is_trashed === false;

        let files = state.files;
        let trashedFiles = state.trashedFiles;

        if (toTrash) {
          const match = files.find((f: FileEntry) => f.id === id);
          if (match) {
            files = files.filter((f: FileEntry) => f.id !== id);
            trashedFiles = [{ ...match, ...patch }, ...trashedFiles];
          }
        } else if (fromTrash) {
          const match = trashedFiles.find((f: FileEntry) => f.id === id);
          if (match) {
            trashedFiles = trashedFiles.filter((f: FileEntry) => f.id !== id);
            files = [{ ...match, ...patch }, ...files];
          }
        } else {
          files = files.map((f: FileEntry) => (f.id === id ? { ...f, ...patch } : f));
          trashedFiles = trashedFiles.map((f: FileEntry) => (f.id === id ? { ...f, ...patch } : f));
        }

        return { files, trashedFiles };
      });
    },

    removeFile: (id: string) => {
      set((state: StorageState) => ({
        files: state.files.filter((f: FileEntry) => f.id !== id),
        trashedFiles: state.trashedFiles.filter((f: FileEntry) => f.id !== id),
      }));
    },

    setQuota: (q) => {
      set({
        quota: {
          storage_used_bytes: q.used_bytes ?? q.storage_used_bytes ?? 0,
          storage_limit_bytes: q.limit_bytes ?? q.storage_limit_bytes ?? 5_368_709_120,
        },
      });
    },

    recalcQuota: () => {
      const { files, quota } = get();
      const used = computeUsedBytes(files);
      if (quota.storage_used_bytes !== used) {
        set({ quota: { ...quota, storage_used_bytes: used } });
      }
    },

    addActivity: (activity: ActivityEntry) => {
      set((state: StorageState) => ({
        activities: [activity, ...state.activities].slice(0, 100),
      }));
    },

    refreshAll: async () => {
      set({ loading: true, error: null });
      try {
        const [filesRes, trashRes, quotaRes, activitiesRes] = await Promise.all([
          fetch("/api/files"),
          fetch("/api/files?trashed=true"),
          fetch("/api/storage/stats"),
          fetch("/api/activities?limit=50"),
        ]);

        const files: FileEntry[] = filesRes.ok ? await filesRes.json() : [];
        const trashedFiles: FileEntry[] = trashRes.ok ? await trashRes.json() : [];
        const quotaData = quotaRes.ok
          ? await quotaRes.json()
          : { usedBytes: 0, limitBytes: 5_368_709_120 };
        const rawActivities = activitiesRes.ok
          ? await activitiesRes.json()
          : [];

        const activities: ActivityEntry[] = Array.isArray(rawActivities)
          ? rawActivities
          : Array.isArray((rawActivities as any)?.activities)
            ? (rawActivities as any).activities
            : [];

        set({
          files: Array.isArray(files) ? files : [],
          trashedFiles: Array.isArray(trashedFiles) ? trashedFiles : [],
          quota: {
            storage_used_bytes: (quotaData as any).usedBytes ?? (quotaData as any).storage_used_bytes ?? 0,
            storage_limit_bytes: (quotaData as any).limitBytes ?? (quotaData as any).storage_limit_bytes ?? 5_368_709_120,
          },
          activities,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        set({ error: e.message, loading: false });
      }
    },
  }))
);

useStorageStore.subscribe(
  (state: StorageState) => state.files,
  () => { useStorageStore.getState().recalcQuota(); },
);
