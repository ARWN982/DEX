interface UseESQLQueryResult {
    executeQuery: (query: string, timeRange?: {
        from?: string;
        to?: string;
    }) => Promise<void>;
    data: any[];
    columns: Array<{
        name: string;
        type: string;
    }>;
    isLoading: boolean;
    error: string | null;
}
export declare const useESQLQuery: () => UseESQLQueryResult;
export {};
//# sourceMappingURL=useESQLQuery.d.ts.map