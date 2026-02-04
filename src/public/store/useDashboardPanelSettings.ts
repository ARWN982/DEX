import { create } from "zustand";

// EUI border color options
export type BorderColorKey = 
  | "borderBaseSubdued"
  | "borderBasePlain"
  | "borderBaseDisabled"
  | "borderBasePrimary"
  | "borderBaseSuccess"
  | "borderBaseWarning"
  | "borderBaseDanger";

// Border style type
export type BorderStyleType = "border" | "shadow";

export interface DashboardPanelSettings {
  // Grid settings
  gridGap: number;
  
  // Border/Shadow settings
  borderStyle: BorderStyleType;
  borderWidth: number;
  borderRadius: number;
  borderColorKey: BorderColorKey;
  
  // Title settings
  titleFontSize: number;
  titleFontWeight: number;
  titlePaddingTop: number;
  titlePaddingRight: number;
  titlePaddingBottom: number;
  titlePaddingLeft: number;
  
  // Panel content padding (for non-metric panels)
  panelPaddingTop: number;
  panelPaddingRight: number;
  panelPaddingBottom: number;
  panelPaddingLeft: number;
}

interface DashboardPanelSettingsStore extends DashboardPanelSettings {
  setSettings: (settings: Partial<DashboardPanelSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: DashboardPanelSettings = {
  // Grid settings
  gridGap: 8,
  
  // Border/Shadow settings
  borderStyle: "shadow",
  borderWidth: 1,
  borderRadius: 4,
  borderColorKey: "borderBasePlain",
  
  // Title settings
  titleFontSize: 14,
  titleFontWeight: 500,
  titlePaddingTop: 0,
  titlePaddingRight: 12,
  titlePaddingBottom: 0,
  titlePaddingLeft: 12,
  
  // Panel content padding
  panelPaddingTop: 12,
  panelPaddingRight: 16,
  panelPaddingBottom: 12,
  panelPaddingLeft: 16,
};

export const useDashboardPanelSettings = create<DashboardPanelSettingsStore>((set) => ({
  ...defaultSettings,
  
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
  
  resetSettings: () => set(defaultSettings),
}));
