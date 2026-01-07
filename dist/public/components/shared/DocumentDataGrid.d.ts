import React from "react";
import { BaseDocument } from "../../data/types";
export interface AggregationParams {
    operation: string;
    field: string;
    groupBy?: string;
}
export interface DocumentDataGridProps {
    /** Array of documents to display */
    documents: BaseDocument[];
    /** Object indicating which fields should be shown as columns */
    selectedFields: Record<string, boolean>;
    /** Search term for highlighting and filtering */
    searchTerm?: string;
    /** Date range for filtering timestamp field */
    dateRange?: {
        from: string;
        to: string;
    };
    /** Applied aggregations for special rendering */
    appliedAggregations?: AggregationParams[];
    applyAggregationsToGrid?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Height of the data grid */
    height?: string | number;
    /** Whether this is code editor mode (affects some styling) */
    isCodeEditorMode?: boolean;
    /** Initial page size */
    initialPageSize?: number;
}
export declare const DocumentDataGrid: React.FC<DocumentDataGridProps>;
//# sourceMappingURL=DocumentDataGrid.d.ts.map