"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentDataGrid = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = __importStar(require("react"));
// Helper function to get nested field values using dot notation
const getNestedFieldValue = (obj, fieldPath) => {
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
const highlightSearchTerm = (text, searchTerm, euiTheme) => {
    if (!searchTerm || !text)
        return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) => {
        if (regex.test(part)) {
            return ((0, jsx_runtime_1.jsx)("span", { style: {
                    backgroundColor: euiTheme.colors.borderBaseWarning,
                    color: euiTheme.colors.textBasePlain,
                    fontWeight: "bold",
                    padding: "1px 2px",
                    borderRadius: "2px",
                }, children: part }, index));
        }
        return part;
    });
};
const DocumentDataGrid = ({ documents, selectedFields, searchTerm = "", dateRange, appliedAggregations = [], applyAggregationsToGrid = false, isLoading = false, height = 600, isCodeEditorMode = false, initialPageSize = 50, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    // Debug logging for aggregations
    react_1.default.useEffect(() => {
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
    const [sortingColumns, setSortingColumns] = (0, react_1.useState)([{ id: "@timestamp", direction: "desc" }]);
    // Internal state for pagination
    const [pagination, setPagination] = (0, react_1.useState)({
        pageIndex: 0,
        pageSize: initialPageSize,
    });
    // Internal state for column visibility
    const [visibleColumns, setVisibleColumns] = (0, react_1.useState)([]);
    // Generate columns based on selectedFields and aggregations
    const columns = (0, react_1.useMemo)(() => {
        console.log("DocumentDataGrid - Generating columns:", {
            applyAggregationsToGrid,
            aggregationsLength: appliedAggregations.length,
            selectedFields,
            documentsLength: documents.length,
        });
        // Only show aggregation columns if there are applied aggregations AND they should be applied to the grid
        if (appliedAggregations.length > 0 && applyAggregationsToGrid) {
            const aggregationColumns = [];
            appliedAggregations.forEach((agg) => {
                // If there's a group by field, add it as the first column
                if (agg.groupBy) {
                    const groupByColumnExists = aggregationColumns.some((col) => col.id === agg.groupBy);
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
        if (selectedFieldNames.length === 1 &&
            selectedFieldNames[0] === "@timestamp") {
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
            if (a === "timestamp")
                return -1;
            if (b === "timestamp")
                return 1;
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
    react_1.default.useEffect(() => {
        setVisibleColumns(columns.map((col) => col.id));
    }, [columns]);
    // Filter and sort documents
    const processedDocuments = (0, react_1.useMemo)(() => {
        if (!documents.length)
            return [];
        let filtered = documents;
        // Apply date range filtering if specified
        if (dateRange && dateRange.from && dateRange.to) {
            filtered = filtered.filter((doc) => {
                const timestamp = doc["@timestamp"] || doc.timestamp;
                if (!timestamp)
                    return true;
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
                        if (bValue === null || bValue === undefined)
                            continue;
                        return direction === "asc" ? 1 : -1;
                    }
                    if (bValue === null || bValue === undefined) {
                        return direction === "asc" ? -1 : 1;
                    }
                    let comparison = 0;
                    if (typeof aValue === "string" && typeof bValue === "string") {
                        comparison = aValue.localeCompare(bValue);
                    }
                    else if (typeof aValue === "number" && typeof bValue === "number") {
                        comparison = aValue - bValue;
                    }
                    else {
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
    const onChangeItemsPerPage = (0, react_1.useCallback)((pageSize) => {
        setPagination((prev) => ({ ...prev, pageSize, pageIndex: 0 }));
    }, []);
    const onChangePage = (0, react_1.useCallback)((pageIndex) => {
        setPagination((prev) => ({ ...prev, pageIndex }));
    }, []);
    // Sorting callback
    const onSort = (0, react_1.useCallback)((columns) => {
        setSortingColumns(columns);
    }, []);
    // Cell rendering function
    const renderCellValue = (0, react_1.useCallback)(({ rowIndex, columnId }) => {
        const document = processedDocuments[rowIndex];
        if (!document)
            return "";
        if (columnId === "summary") {
            // Extract service.name and host.name for badges
            const serviceName = getNestedFieldValue(document, "service.name") ||
                getNestedFieldValue(document, "service");
            const hostName = getNestedFieldValue(document, "host.name") ||
                getNestedFieldValue(document, "host");
            // Helper function to flatten nested objects and format values
            const flattenObject = (obj, prefix = "") => {
                const result = [];
                for (const [key, value] of Object.entries(obj)) {
                    if (key === "@timestamp" || key === "timestamp")
                        continue;
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    // Skip type metadata - these are field type definitions, not actual data
                    if (key === "type" || fullKey.includes(".type")) {
                        continue;
                    }
                    if (value && typeof value === "object" && !Array.isArray(value)) {
                        // Recursively flatten nested objects
                        result.push(...flattenObject(value, fullKey));
                    }
                    else if (value !== null && value !== undefined && value !== "") {
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
            const sortedEntries = flattenedEntries.sort(([a], [b]) => a.localeCompare(b));
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
                        return ((0, jsx_runtime_1.jsx)("strong", { style: { fontWeight: "bold" }, children: word }, index));
                    }
                    return (0, jsx_runtime_1.jsx)("span", { children: word }, index);
                })
                    .reduce((acc, word, index) => {
                    if (index === 0)
                        return [word];
                    return [...acc, " ", word];
                }, []);
            }
            else {
                // Search term highlighting already applied and returned React elements
                formattedContent = highlightedSummary;
            }
            return ((0, jsx_runtime_1.jsxs)("div", { children: [(serviceName || hostName) && ((0, jsx_runtime_1.jsxs)("div", { style: {
                            marginBottom: "8px",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                        }, children: [serviceName && ((0, jsx_runtime_1.jsx)(eui_1.EuiBadge, { color: "hollow", style: {
                                    fontSize: "11px",
                                    fontFamily: '"Roboto Mono", monospace',
                                }, children: serviceName })), hostName && ((0, jsx_runtime_1.jsx)(eui_1.EuiBadge, { color: "hollow", style: {
                                    fontSize: "11px",
                                    fontFamily: '"Roboto Mono", monospace',
                                }, children: hostName }))] })), (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", style: {
                            whiteSpace: "normal",
                            lineHeight: "1.4",
                            fontFamily: '"Roboto Mono", monospace',
                            fontSize: "12px",
                        }, children: formattedContent })] }));
        }
        const cellValue = getNestedFieldValue(document, columnId);
        if (cellValue === null || cellValue === undefined) {
            return ((0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", color: "subdued", style: {
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: "12px",
                }, children: "\u2014" }));
        }
        if (typeof cellValue === "boolean") {
            return ((0, jsx_runtime_1.jsx)(eui_1.EuiBadge, { color: cellValue ? "success" : "danger", style: {
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: "12px",
                }, children: cellValue ? "true" : "false" }));
        }
        if (typeof cellValue === "object") {
            return ((0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", style: {
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: "12px",
                }, children: JSON.stringify(cellValue) }));
        }
        const stringValue = String(cellValue);
        // Apply uniform monospace font for ALL cells
        return ((0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", style: {
                fontFamily: '"Roboto Mono", monospace',
                fontSize: "12px",
            }, children: highlightSearchTerm(stringValue, searchTerm, euiTheme) }));
    }, [processedDocuments, searchTerm, euiTheme]);
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { style: {
                height: typeof height === "string" ? height : `${height}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", children: "Loading..." }) }));
    }
    if (processedDocuments.length === 0) {
        return ((0, jsx_runtime_1.jsx)("div", { style: {
                height: typeof height === "string" ? height : `${height}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: euiTheme.colors.textSubdued,
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", children: isCodeEditorMode
                    ? "Click Run to execute the query"
                    : "No data available" }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: { height: typeof height === "string" ? height : `${height}px` }, children: [(0, jsx_runtime_1.jsx)("style", { children: `
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
      ` }), (0, jsx_runtime_1.jsx)(eui_1.EuiDataGrid, { "aria-label": "Documents", columns: columns, columnVisibility: {
                    visibleColumns,
                    setVisibleColumns,
                }, rowCount: processedDocuments.length, renderCellValue: renderCellValue, pagination: {
                    ...pagination,
                    pageSizeOptions: [10, 25, 50, 100],
                    onChangeItemsPerPage,
                    onChangePage,
                }, sorting: {
                    columns: sortingColumns,
                    onSort,
                }, toolbarVisibility: {
                    showColumnSelector: true,
                    showDisplaySelector: true,
                    showKeyboardShortcuts: true,
                    showFullScreenSelector: true,
                    additionalControls: {
                        left: {
                            prepend: ((0, jsx_runtime_1.jsx)(eui_1.EuiText, { size: "s", style: { paddingLeft: "8px" }, children: (0, jsx_runtime_1.jsxs)("strong", { children: [processedDocuments.length.toLocaleString(), " results"] }) })),
                        },
                    },
                }, gridStyle: {
                    header: "underline",
                    fontSize: "s",
                }, height: height, rowHeightsOptions: {
                    defaultHeight: {
                        lineCount: 5,
                    },
                    rowHeights: {},
                } })] }));
};
exports.DocumentDataGrid = DocumentDataGrid;
//# sourceMappingURL=DocumentDataGrid.js.map