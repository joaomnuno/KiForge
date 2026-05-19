import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  OutputTarget,
  VoltageDomain
} from "../../types/domain";

export type ThemePreference = "Dark" | "System" | "Light";

export interface AppSettings {
  displayName: string;
  email: string;
  theme: ThemePreference;
  defaultVoltageDomain: VoltageDomain;
  defaultOutputTarget: OutputTarget;
  autoSave: boolean;
  showInspector: boolean;
  exportPretty: boolean;
}

interface SettingsState extends AppSettings {
  updateSetting: <Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key]
  ) => void;
  resetSettings: () => void;
}

const DEFAULTS: AppSettings = {
  displayName: "João Nuno",
  email: "llms@treetree2.org",
  theme: "Dark",
  defaultVoltageDomain: "3.3V",
  defaultOutputTarget: "Generate KiCad starter project",
  autoSave: true,
  showInspector: true,
  exportPretty: true
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      updateSetting: (key, value) => set({ [key]: value } as Partial<AppSettings>),
      resetSettings: () => set({ ...DEFAULTS })
    }),
    {
      name: "kiforge.settings.v1",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
