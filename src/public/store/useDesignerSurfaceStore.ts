import { create } from "zustand";

/**
 * Tracks whether the active designer page is rendering EmptyState.
 * Page modules wrap EmptyState in their own component, so we cannot rely on
 * the loaded component's static `isEmptyState` flag — EmptyState registers here on mount.
 */
interface DesignerSurfaceState {
  isEmptyPlaceholderPage: boolean;
  setEmptyPlaceholderPage: (value: boolean) => void;
}

export const useDesignerSurfaceStore = create<DesignerSurfaceState>((set) => ({
  isEmptyPlaceholderPage: false,
  setEmptyPlaceholderPage: (value) => set({ isEmptyPlaceholderPage: value }),
}));
