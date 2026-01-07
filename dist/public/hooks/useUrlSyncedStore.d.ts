/**
 * Hook that provides store values without URL synchronization
 * Simplified for prototype - URL syncing removed for production engineering
 */
export declare const useUrlSyncedStore: () => {
    hasChanges: boolean;
    handleUpdateRefresh: () => void;
    appliedSearchTerm: string;
    appliedDateRange: import("../store/useAppStore").DateRange;
    appliedSelectedDimensions: string[];
    appliedSelectedValues: string[];
    appliedSelectedIndex: string;
    draftSearchTerm: string;
    draftDateRange: import("../store/useAppStore").DateRange;
    draftSelectedDimensions: string[];
    draftSelectedValues: string[];
    draftSelectedIndex: string;
    currentPage: number;
    colorMode: "light" | "dark";
    setDraftSearchTerm: (term: string) => void;
    setDraftDateRange: (range: import("../store/useAppStore").DateRange) => void;
    setDraftSelectedDimensions: (dimensions: string[]) => void;
    setDraftSelectedValues: (values: string[]) => void;
    setDraftSelectedIndex: (index: string) => void;
    setCurrentPage: (page: number) => void;
    setColorMode: (mode: "light" | "dark") => void;
    applyChanges: () => void;
    refresh: () => void;
    setAppliedSearchTerm: (term: string) => void;
    setAppliedSelectedIndex: (index: string) => void;
};
//# sourceMappingURL=useUrlSyncedStore.d.ts.map