import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  dark_mode: boolean;
  language: string;
  auto_backup: boolean;
  compression: boolean;
  confirm_delete: boolean;
  show_hidden_files: boolean;
  grid_view: boolean;

  toggleDarkMode: () => void;
  setLanguage: (lang: string) => void;
  toggleAutoBackup: () => void;
  toggleCompression: () => void;
  toggleConfirmDelete: () => void;
  toggleShowHiddenFiles: () => void;
  toggleGridView: () => void;
  
  // Generic toggle helper
  toggleSetting: (key: keyof Omit<SettingsState, "setLanguage" | "toggleDarkMode" | "toggleAutoBackup" | "toggleCompression" | "toggleConfirmDelete" | "toggleShowHiddenFiles" | "toggleGridView" | "toggleSetting">) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dark_mode: false,
      language: "fr",
      auto_backup: true,
      compression: false,
      confirm_delete: true,
      show_hidden_files: false,
      grid_view: false,

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.dark_mode;
          if (typeof document !== "undefined") {
            if (newDarkMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          return { dark_mode: newDarkMode };
        }),
      setLanguage: (lang) => set({ language: lang }),
      toggleAutoBackup: () => set((state) => ({ auto_backup: !state.auto_backup })),
      toggleCompression: () => set((state) => ({ compression: !state.compression })),
      toggleConfirmDelete: () => set((state) => ({ confirm_delete: !state.confirm_delete })),
      toggleShowHiddenFiles: () => set((state) => ({ show_hidden_files: !state.show_hidden_files })),
      toggleGridView: () => set((state) => ({ grid_view: !state.grid_view })),

      toggleSetting: (key) => set((state) => ({ [key]: !state[key as keyof SettingsState] })),
    }),
    {
      name: "wayacloud-settings",
      onRehydrateStorage: () => (state) => {
        // Appliquer le dark mode au chargement initial si activé
        if (state?.dark_mode && typeof document !== "undefined") {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
