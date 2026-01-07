import { useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

export interface DateRange {
  start: string;
  end: string;
}

interface AppState {
  // Applied state (used for actual queries)
  appliedSearchTerm: string;
  appliedDateRange: DateRange;
  appliedSelectedDimensions: string[];
  appliedSelectedValues: string[];
  appliedSelectedIndex: string;
  
  // Draft state (user's current input in the UI)
  draftSearchTerm: string;
  draftDateRange: DateRange;
  draftSelectedDimensions: string[];
  draftSelectedValues: string[];
  draftSelectedIndex: string;
  
  // UI state
  currentPage: number;
  colorMode: 'light' | 'dark';
  
  // Computed properties
  hasChanges: () => boolean;
  
  // Actions
  setDraftSearchTerm: (term: string) => void;
  setDraftDateRange: (range: DateRange) => void;
  setDraftSelectedDimensions: (dimensions: string[]) => void;
  setDraftSelectedValues: (values: string[]) => void;
  setDraftSelectedIndex: (index: string) => void;
  setCurrentPage: (page: number) => void;
  setColorMode: (mode: 'light' | 'dark') => void;
  applyChanges: () => void;
  refresh: () => void;
  
  // Direct setters for applied state (for immediate updates)
  setAppliedSearchTerm: (term: string) => void;
  setAppliedSelectedIndex: (index: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial applied state
  appliedSearchTerm: '',
  appliedDateRange: { start: 'now-15m', end: 'now' },
  appliedSelectedDimensions: [],
  appliedSelectedValues: [],
  appliedSelectedIndex: 'logs-*',
  
  // Initial draft state (starts same as applied)
  draftSearchTerm: '',
  draftDateRange: { start: 'now-15m', end: 'now' },
  draftSelectedDimensions: [],
  draftSelectedValues: [],
  draftSelectedIndex: 'logs-*',
  
  // UI state
  currentPage: 0,
  colorMode: 'light',
  
  // Computed property to check if there are pending changes
  hasChanges: () => {
    const state = get();
    
    // Helper function to compare arrays
    const arraysEqual = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      return a.every((item, index) => item === b[index]);
    };

    return (
      state.draftSearchTerm !== state.appliedSearchTerm ||
      state.draftDateRange.start !== state.appliedDateRange.start ||
      state.draftDateRange.end !== state.appliedDateRange.end ||
      !arraysEqual(state.draftSelectedDimensions, state.appliedSelectedDimensions) ||
      !arraysEqual(state.draftSelectedValues, state.appliedSelectedValues) ||
      state.draftSelectedIndex !== state.appliedSelectedIndex
    );
  },
  
  // Actions
  setDraftSearchTerm: (term: string) =>
    set({ draftSearchTerm: term }),
  
  setDraftDateRange: (range: DateRange) =>
    set({ draftDateRange: range }),
  
  setDraftSelectedDimensions: (dimensions: string[]) =>
    set({ draftSelectedDimensions: dimensions }),
  
  setDraftSelectedValues: (values: string[]) =>
    set({ draftSelectedValues: values }),
  
  setDraftSelectedIndex: (index: string) =>
    set({ draftSelectedIndex: index }),
  
  setCurrentPage: (page: number) =>
    set({ currentPage: page }),
  
  setColorMode: (mode: 'light' | 'dark') =>
    set({ colorMode: mode }),
  
  // Apply changes from draft to applied state and reset pagination
  applyChanges: () =>
    set((state) => ({
      appliedSearchTerm: state.draftSearchTerm,
      appliedDateRange: state.draftDateRange,
      appliedSelectedDimensions: state.draftSelectedDimensions,
      appliedSelectedValues: state.draftSelectedValues,
      appliedSelectedIndex: state.draftSelectedIndex,
      currentPage: 0, // Reset to first page when filters change
    })),
  
  // Refresh with current applied values (no state change needed)
  refresh: () => {
    // This will be handled by the component calling React Query refetch
    // We don't need to change state here
  },
  
  // Direct setters for applied state (for immediate updates)
  setAppliedSearchTerm: (term: string) =>
    set({ appliedSearchTerm: term, currentPage: 0 }),
  
  setAppliedSelectedIndex: (index: string) =>
    set({ appliedSelectedIndex: index, currentPage: 0 }),
}));

// Custom hook to handle the Update/Refresh logic with React Query
export const useUpdateRefresh = (applyChangesFn?: () => void, hasChangesFn?: () => boolean) => {
  const queryClient = useQueryClient();
  const store = useAppStore();
  
  // Use provided functions or fall back to store functions
  const applyChanges = applyChangesFn || store.applyChanges;
  // Fix: Don't call hasChanges() immediately, return the function itself
  const hasChanges = hasChangesFn || store.hasChanges;
  
  const handleUpdateRefresh = () => {
    // Fix: Call hasChanges as a function only when needed
    const currentHasChanges = typeof hasChanges === 'function' ? hasChanges() : false;
    
    if (currentHasChanges) {
      // Apply changes if there are any
      applyChanges();
    }
    
    // Always refetch/refresh data
    // Refetch fields query
    queryClient.refetchQueries({ queryKey: ['metricFields'] });
    // Invalidate all metric data to refresh charts
    queryClient.invalidateQueries({ queryKey: ['metricData'] });
  };
  
  return {
    handleUpdateRefresh,
    hasChanges: typeof hasChanges === 'function' ? hasChanges() : false,
  };
};