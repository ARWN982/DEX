import {
  EuiDataGrid,
  EuiDataGridColumn,
  EuiDataGridSorting,
  EuiText,
  EuiBadge,
  useEuiTheme,
} from "@elastic/eui";
import React, { useState, useMemo, useCallback } from "react";
import { BaseDocument } from "../../data/types";

// Helper function to get nested field values using dot notation
const getNestedFieldValue = (obj: any, fieldPath: string): any => {
  // First, try to get the value directly using the field path (for dot notation fields)
  if (obj[fieldPath] !== undefined) {
    return obj[fieldPath];
  }

  // Then, try the nested approach (for nested objects)
  return fieldPath.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Helper function to highlight search terms in text
const highlightSearchTerm = (
  text: string,
  searchTerm: string,
  euiTheme: any
) => {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <span
          key={index}
          style={{
            backgroundColor: euiTheme.colors.borderBaseWarning,
            color: euiTheme.colors.textBasePlain,
            fontWeight: "bold",
            padding: "1px 2px",
            borderRadius: "2px",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

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

export const DocumentDataGrid: React.FC<DocumentDataGridProps> = ({
  documents,
  selectedFields,
  searchTerm = "",
  dateRange,
  appliedAggregations = [],
  applyAggregationsToGrid = false,
  isLoading = false,
  height = 600,
  isCodeEditorMode = false,
  initialPageSize = 50,
}) => {
  const { euiTheme } = useEuiTheme();

  // Debug logging for aggregations
  React.useEffect(() => {
    if (appliedAggregations && appliedAggregations.length > 0) {
      console.log("DocumentDataGrid - Received aggregation data:", {
        documentsCount: documents.length,
        appliedAggregations,
        applyAggregationsToGrid,
        firstDocument: documents[0],
        documentFields: documents.length > 0 ? Object.keys(documents[0]) : [],
      });
    }
  }, [documents, appliedAggregations, applyAggregationsToGrid]);

  // Internal state for sorting
  const [sortingColumns, setSortingColumns] = useState<
    EuiDataGridSorting["columns"]
  >([{ id: "@timestamp", direction: "desc" }]);

  // Internal state for pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Internal state for column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Generate columns based on selectedFields and aggregations
  const columns = useMemo<EuiDataGridColumn[]>(() => {
    console.log("DocumentDataGrid - Generating columns:", {
      applyAggregationsToGrid,
      aggregationsLength: appliedAggregations.length,
      selectedFields,
      documentsLength: documents.length,
    });

    // Only show aggregation columns if there are applied aggregations AND they should be applied to the grid
    if (appliedAggregations.length > 0 && applyAggregationsToGrid) {
      const aggregationColumns: EuiDataGridColumn[] = [];

      appliedAggregations.forEach((agg) => {
        // If there's a group by field, add it as the first column
        if (agg.groupBy) {
          const groupByColumnExists = aggregationColumns.some(
            (col) => col.id === agg.groupBy
          );
          if (!groupByColumnExists) {
            aggregationColumns.push({
              id: agg.groupBy,
              display: agg.groupBy,
            });
          }
        }

        // Add the aggregated field column
        aggregationColumns.push({
          id: `${agg.operation} of ${agg.field}`,
          display: `${agg.operation} of ${agg.field}`,
        });
      });

      return aggregationColumns;
    }

    // Get selected field names
    const selectedFieldNames = Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    // If only @timestamp is selected, show @timestamp + summary columns
    if (
      selectedFieldNames.length === 1 &&
      selectedFieldNames[0] === "@timestamp"
    ) {
      return [
        {
          id: "@timestamp",
          display: "@timestamp",
          initialWidth: 180,
          headerCellProps: {
            style: {
              fontSize: "12px",
              fontFamily: '"Roboto Mono", monospace',
            },
          },
        },
        {
          id: "summary",
          display: "Summary",
          headerCellProps: {
            style: {
              fontSize: "12px",
              fontFamily: '"Roboto Mono", monospace',
            },
          },
        },
      ];
    }

    // Otherwise, show the selected fields as individual columns
    // Ensure timestamp is always first
    const sortedFieldNames = selectedFieldNames.sort((a, b) => {
      if (a === "timestamp") return -1;
      if (b === "timestamp") return 1;
      return 0;
    });

    return sortedFieldNames.map((field) => ({
      id: field,
      display: field,
      initialWidth: field === "timestamp" ? 180 : undefined,
      headerCellProps: {
        style: {
          fontSize: "12px",
          fontFamily: '"Roboto Mono", monospace',
        },
      },
    }));
  }, [applyAggregationsToGrid, appliedAggregations, selectedFields]);

  // Update visible columns when columns change
  React.useEffect(() => {
    setVisibleColumns(columns.map((col) => col.id));
  }, [columns]);

  // Filter and sort documents
  const processedDocuments = useMemo(() => {
    if (!documents.length) return [];

    let filtered = documents;

    // Apply date range filtering if specified
    if (dateRange && dateRange.from && dateRange.to) {
      filtered = filtered.filter((doc) => {
        const timestamp = doc["@timestamp"] || doc.timestamp;
        if (!timestamp) return true;

        const docTime = new Date(timestamp).getTime();
        const fromTime = new Date(dateRange.from).getTime();
        const toTime = new Date(dateRange.to).getTime();

        return docTime >= fromTime && docTime <= toTime;
      });
    }

    // Note: Search filtering is handled server-side via the data generators
    // Frontend search filtering is disabled to avoid double-filtering

    // Apply sorting
    if (sortingColumns.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sortColumn of sortingColumns) {
          const { id: fieldId, direction } = sortColumn;
          const aValue = getNestedFieldValue(a, fieldId);
          const bValue = getNestedFieldValue(b, fieldId);

          if (aValue === null || aValue === undefined) {
            if (bValue === null || bValue === undefined) continue;
            return direction === "asc" ? 1 : -1;
          }
          if (bValue === null || bValue === undefined) {
            return direction === "asc" ? -1 : 1;
          }

          let comparison = 0;
          if (typeof aValue === "string" && typeof bValue === "string") {
            comparison = aValue.localeCompare(bValue);
          } else if (typeof aValue === "number" && typeof bValue === "number") {
            comparison = aValue - bValue;
          } else {
            comparison = String(aValue).localeCompare(String(bValue));
          }

          if (comparison !== 0) {
            return direction === "asc" ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    // Apply LIMIT 1000 rows restriction (matching CodeEditor footer)
    return filtered.slice(0, 1000);
  }, [documents, dateRange, searchTerm, sortingColumns]);

  // Pagination callbacks
  const onChangeItemsPerPage = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, pageIndex: 0 }));
  }, []);

  const onChangePage = useCallback((pageIndex: number) => {
    setPagination((prev) => ({ ...prev, pageIndex }));
  }, []);

  // Sorting callback
  const onSort = useCallback((columns: EuiDataGridSorting["columns"]) => {
    setSortingColumns(columns);
  }, []);

  // Cell rendering function
  const renderCellValue = useCallback(
    ({ rowIndex, columnId }: any) => {
      const document = processedDocuments[rowIndex];
      if (!document) return "";

      if (columnId === "summary") {
        // Extract service.name and host.name for badges
        const serviceName =
          getNestedFieldValue(document, "service.name") ||
          getNestedFieldValue(document, "service");
        const hostName =
          getNestedFieldValue(document, "host.name") ||
          getNestedFieldValue(document, "host");

        // Helper function to flatten nested objects and format values
        const flattenObject = (
          obj: any,
          prefix = ""
        ): Array<[string, string]> => {
          const result: Array<[string, string]> = [];

          for (const [key, value] of Object.entries(obj)) {
            if (key === "@timestamp" || key === "timestamp") continue;

            const fullKey = prefix ? `${prefix}.${key}` : key;

            // Skip type metadata - these are field type definitions, not actual data
            if (key === "type" || fullKey.includes(".type")) {
              continue;
            }

            if (value && typeof value === "object" && !Array.isArray(value)) {
              // Recursively flatten nested objects
              result.push(...flattenObject(value, fullKey));
            } else if (value !== null && value !== undefined && value !== "") {
              // Only include fields with actual values, convert to string
              const stringValue = Array.isArray(value)
                ? value.join(", ")
                : String(value);
              result.push([fullKey, stringValue]);
            }
          }

          return result;
        };

        // Flatten the document and create summary
        const flattenedEntries = flattenObject(document);

        // Sort entries alphabetically by field name
        const sortedEntries = flattenedEntries.sort(([a], [b]) =>
          a.localeCompare(b)
        );
        const summary = sortedEntries
          .map(([key, value]) => `${key} ${value}`)
          .join(" ");

        // Apply search term highlighting to the entire summary first
        const highlightedSummary = searchTerm
          ? highlightSearchTerm(summary, searchTerm, euiTheme)
          : summary;

        let formattedContent;

        // If no search term or highlighting didn't produce React elements, handle field name bolding
        if (!searchTerm || typeof highlightedSummary === "string") {
          // Extract all field names (both top-level and nested)
          const fieldNames = flattenedEntries.map(([key]) => key);

          // Split the summary into words and make field names bold
          const words = (highlightedSummary || summary).toString().split(" ");

          formattedContent = words
            .map((word, index) => {
              // Check if the word (with common punctuation removed from end) matches any field name
              const cleanWord = word.replace(/[.,;:!?]+$/, "");
              const isBold = fieldNames.includes(cleanWord);

              if (isBold) {
                return (
                  <strong key={index} style={{ fontWeight: "bold" }}>
                    {word}
                  </strong>
                );
              }
              return <span key={index}>{word}</span>;
            })
            .reduce((acc: React.ReactNode[], word, index) => {
              if (index === 0) return [word];
              return [...acc, " ", word];
            }, [] as React.ReactNode[]);
        } else {
          // Search term highlighting already applied and returned React elements
          formattedContent = highlightedSummary;
        }

        return (
          <div>
            {/* Service and Host badges */}
            {(serviceName || hostName) && (
              <div
                style={{
                  marginBottom: "8px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                {serviceName && (
                  <EuiBadge
                    color="hollow"
                    style={{
                      fontSize: "11px",
                      fontFamily: '"Roboto Mono", monospace',
                    }}
                  >
                    {serviceName}
                  </EuiBadge>
                )}
                {hostName && (
                  <EuiBadge
                    color="hollow"
                    style={{
                      fontSize: "11px",
                      fontFamily: '"Roboto Mono", monospace',
                    }}
                  >
                    {hostName}
                  </EuiBadge>
                )}
              </div>
            )}

            {/* Summary content */}
            <EuiText
              size="s"
              style={{
                whiteSpace: "normal",
                lineHeight: "1.4",
                fontFamily: '"Roboto Mono", monospace',
                fontSize: "12px",
              }}
            >
              {formattedContent}
            </EuiText>
          </div>
        );
      }

      const cellValue = getNestedFieldValue(document, columnId);

      if (cellValue === null || cellValue === undefined) {
        return (
          <EuiText
            size="s"
            color="subdued"
            style={{
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "12px",
            }}
          >
            —
          </EuiText>
        );
      }

      if (typeof cellValue === "boolean") {
        return (
          <EuiBadge
            color={cellValue ? "success" : "danger"}
            style={{
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "12px",
            }}
          >
            {cellValue ? "true" : "false"}
          </EuiBadge>
        );
      }

      if (typeof cellValue === "object") {
        return (
          <EuiText
            size="s"
            style={{
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "12px",
            }}
          >
            {JSON.stringify(cellValue)}
          </EuiText>
        );
      }

      const stringValue = String(cellValue);

      // Apply uniform monospace font for ALL cells
      return (
        <EuiText
          size="s"
          style={{
            fontFamily: '"Roboto Mono", monospace',
            fontSize: "12px",
          }}
        >
          {highlightSearchTerm(stringValue, searchTerm, euiTheme)}
        </EuiText>
      );
    },
    [processedDocuments, searchTerm, euiTheme]
  );

  if (isLoading) {
    return (
      <div
        style={{
          height: typeof height === "string" ? height : `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EuiText size="s">Loading...</EuiText>
      </div>
    );
  }

  if (processedDocuments.length === 0) {
    return (
      <div
        style={{
          height: typeof height === "string" ? height : `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: euiTheme.colors.textSubdued,
        }}
      >
        <EuiText size="s">
          {isCodeEditorMode
            ? "Click Run to execute the query"
            : "No data available"}
        </EuiText>
      </div>
    );
  }

  return (
    <div
      style={{ height: typeof height === "string" ? height : `${height}px` }}
    >
      <style>{`
        .euiDataGrid--headerUnderline .euiDataGridHeader {
          border-bottom: 1px solid ${euiTheme.colors.borderBasePlain} !important;
        }
        [data-test-subj="dataGridHeader"].euiDataGridHeader {
          border-bottom: 1px solid ${euiTheme.colors.borderBasePlain} !important;
        }
        .euiDataGrid .euiDataGrid__controls {
          background-color: ${euiTheme.colors.emptyShade} !important;
        }
        .euiDataGrid .euiDataGrid__pagination {
          background-color: ${euiTheme.colors.emptyShade} !important;
        }
        .euiDataGridRowCell {
          border-right: none !important;
        }
        .euiDataGridHeaderCell {
          border-right: none !important;
        }
        .euiDataGrid__virtualized .euiDataGridRowCell {
          border-right: none !important;
        }
      `}</style>
      <EuiDataGrid
        aria-label="Documents"
        columns={columns}
        columnVisibility={{
          visibleColumns,
          setVisibleColumns,
        }}
        rowCount={processedDocuments.length}
        renderCellValue={renderCellValue}
        pagination={{
          ...pagination,
          pageSizeOptions: [10, 25, 50, 100],
          onChangeItemsPerPage,
          onChangePage,
        }}
        sorting={{
          columns: sortingColumns,
          onSort,
        }}
        toolbarVisibility={{
          showColumnSelector: true,
          showDisplaySelector: true,
          showKeyboardShortcuts: true,
          showFullScreenSelector: true,
          additionalControls: {
            left: {
              prepend: (
                <EuiText size="s" style={{ paddingLeft: "8px" }}>
                  <strong>
                    {processedDocuments.length.toLocaleString()} results
                  </strong>
                </EuiText>
              ),
            },
          },
        }}
        gridStyle={{
          header: "underline",
          fontSize: "s",
        }}
        height={height}
        rowHeightsOptions={{
          defaultHeight: {
            lineCount: 5,
          },
          rowHeights: {},
        }}
      />
    </div>
  );
};
