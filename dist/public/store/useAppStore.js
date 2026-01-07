"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdateRefresh = exports.useAppStore = void 0;
const react_query_1 = require("@tanstack/react-query");
const zustand_1 = require("zustand");
exports.useAppStore = (0, zustand_1.create)((set, get) => ({
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
        const arraysEqual = (a, b) => {
            if (a.length !== b.length)
                return false;
            return a.every((item, index) => item === b[index]);
        };
        return (state.draftSearchTerm !== state.appliedSearchTerm ||
            state.draftDateRange.start !== state.appliedDateRange.start ||
            state.draftDateRange.end !== state.appliedDateRange.end ||
            !arraysEqual(state.draftSelectedDimensions, state.appliedSelectedDimensions) ||
            !arraysEqual(state.draftSelectedValues, state.appliedSelectedValues) ||
            state.draftSelectedIndex !== state.appliedSelectedIndex);
    },
    // Actions
    setDraftSearchTerm: (term) => set({ draftSearchTerm: term }),
    setDraftDateRange: (range) => set({ draftDateRange: range }),
    setDraftSelectedDimensions: (dimensions) => set({ draftSelectedDimensions: dimensions }),
    setDraftSelectedValues: (values) => set({ draftSelectedValues: values }),
    setDraftSelectedIndex: (index) => set({ draftSelectedIndex: index }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setColorMode: (mode) => set({ colorMode: mode }),
    // Apply changes from draft to applied state and reset pagination
    applyChanges: () => set((state) => ({
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
    setAppliedSearchTerm: (term) => set({ appliedSearchTerm: term, currentPage: 0 }),
    setAppliedSelectedIndex: (index) => set({ appliedSelectedIndex: index, currentPage: 0 }),
}));
// Custom hook to handle the Update/Refresh logic with React Query
const useUpdateRefresh = (applyChangesFn, hasChangesFn) => {
    const queryClient = (0, react_query_1.useQueryClient)();
    const store = (0, exports.useAppStore)();
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
exports.useUpdateRefresh = useUpdateRefresh;
//# sourceMappingURL=useAppStore.js.map