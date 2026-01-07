export interface DateRange {
    start: string;
    end: string;
}
interface AppState {
    appliedSearchTerm: string;
    appliedDateRange: DateRange;
    appliedSelectedDimensions: string[];
    appliedSelectedValues: string[];
    appliedSelectedIndex: string;
    draftSearchTerm: string;
    draftDateRange: DateRange;
    draftSelectedDimensions: string[];
    draftSelectedValues: string[];
    draftSelectedIndex: string;
    currentPage: number;
    colorMode: 'light' | 'dark';
    hasChanges: () => boolean;
    setDraftSearchTerm: (term: string) => void;
    setDraftDateRange: (range: DateRange) => void;
    setDraftSelectedDimensions: (dimensions: string[]) => void;
    setDraftSelectedValues: (values: string[]) => void;
    setDraftSelectedIndex: (index: string) => void;
    setCurrentPage: (page: number) => void;
    setColorMode: (mode: 'light' | 'dark') => void;
    applyChanges: () => void;
    refresh: () => void;
    setAppliedSearchTerm: (term: string) => void;
    setAppliedSelectedIndex: (index: string) => void;
}
export declare const useAppStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AppState>>;
export declare const useUpdateRefresh: (applyChangesFn?: () => void, hasChangesFn?: () => boolean) => {
    handleUpdateRefresh: () => void;
    hasChanges: boolean;
};
export {};
//# sourceMappingURL=useAppStore.d.ts.map