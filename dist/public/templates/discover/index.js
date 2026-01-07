"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discover = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const datemath_1 = __importDefault(require("@elastic/datemath"));
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const components_1 = require("../../components");
const data_1 = require("../../data");
const hooks_1 = require("../../hooks");
const useAppStore_1 = require("../../store/useAppStore");
// Import our new data system
// Helper function to apply aggregations to raw data
const applyAggregations = (data, aggregations) => {
    const aggregationResults = [];
    for (const agg of aggregations) {
        const { operation, field, groupBy } = agg;
        if (groupBy) {
            // Group by functionality - group logs by the specified field
            const groups = {};
            data.forEach((doc) => {
                const groupValue = doc[groupBy] || "unknown";
                if (!groups[groupValue]) {
                    groups[groupValue] = [];
                }
                groups[groupValue].push(doc);
            });
            // Calculate aggregation for each group
            Object.entries(groups).forEach(([groupValue, groupData]) => {
                let result = null;
                switch (operation) {
                    case "sum":
                        result = groupData.reduce((sum, doc) => sum + (doc[field] || 0), 0);
                        break;
                    case "avg":
                        result =
                            groupData.reduce((sum, doc) => sum + (doc[field] || 0), 0) / groupData.length;
                        break;
                    case "min":
                        result = Math.min(...groupData.map((doc) => doc[field] || Infinity));
                        break;
                    case "max":
                        result = Math.max(...groupData.map((doc) => doc[field] || -Infinity));
                        break;
                    case "count":
                        result = groupData.filter((doc) => doc[field] !== undefined && doc[field] !== null).length;
                        break;
                }
                if (result !== null) {
                    const aggDocument = {
                        [`${operation} of ${field}`]: result,
                        [groupBy]: groupValue,
                        aggregation: true,
                        aggregation_type: operation,
                        aggregation_field: field,
                        group_by_field: groupBy,
                        group_by_value: groupValue,
                    };
                    aggregationResults.push(aggDocument);
                }
            });
        }
        else {
            // No grouping - calculate aggregation for all data
            let result = null;
            switch (operation) {
                case "sum":
                    result = data.reduce((sum, doc) => sum + (doc[field] || 0), 0);
                    break;
                case "avg":
                    result =
                        data.reduce((sum, doc) => sum + (doc[field] || 0), 0) /
                            data.length;
                    break;
                case "min":
                    result = Math.min(...data.map((doc) => doc[field] || Infinity));
                    break;
                case "max":
                    result = Math.max(...data.map((doc) => doc[field] || -Infinity));
                    break;
                case "count":
                    result = data.filter((doc) => doc[field] !== undefined && doc[field] !== null).length;
                    break;
                case "median":
                    const values = data
                        .map((doc) => doc[field])
                        .filter((val) => val !== undefined && val !== null)
                        .sort((a, b) => a - b);
                    const mid = Math.floor(values.length / 2);
                    result =
                        values.length % 2 === 0
                            ? (values[mid - 1] + values[mid]) / 2
                            : values[mid];
                    break;
            }
            if (result !== null) {
                const aggDocument = {
                    [`${operation} of ${field}`]: result,
                    aggregation: true,
                    aggregation_type: operation,
                    aggregation_field: field,
                };
                aggregationResults.push(aggDocument);
            }
        }
    }
    return aggregationResults;
};
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
// Utility function to get EUI icon for field types (like in Kibana)
const getFieldTypeIcon = (fieldType) => {
    const result = (() => {
        switch (fieldType.toLowerCase()) {
            case "text":
                return "tokenString";
            case "keyword":
                return "tokenKeyword";
            case "long":
            case "integer":
            case "short":
            case "byte":
            case "double":
            case "float":
            case "half_float":
            case "scaled_float":
                return "tokenNumber";
            case "date":
                return "tokenDate";
            case "boolean":
                return "tokenBoolean";
            case "ip":
                return "tokenIP";
            case "geo_point":
            case "geo_shape":
                return "tokenGeo";
            case "object":
            case "nested":
                return "tokenObject";
            case "binary":
                return "tokenBinary";
            default:
                return "tokenString"; // Default fallback
        }
    })();
    return result;
};
// Convert data generator field types to Elasticsearch-compatible types
const convertDataGeneratorTypes = (generatorTypes) => {
    // console.log("convertDataGeneratorTypes input:", generatorTypes);
    const convertedTypes = {};
    for (const [fieldName, generatorType] of Object.entries(generatorTypes)) {
        switch (generatorType) {
            case "number":
                convertedTypes[fieldName] = "long"; // Map number to long for consistency
                break;
            case "string":
                convertedTypes[fieldName] = "text";
                break;
            case "keyword":
                convertedTypes[fieldName] = "keyword";
                break;
            case "time":
                convertedTypes[fieldName] = "date";
                break;
            case "ip":
                convertedTypes[fieldName] = "ip";
                break;
            default:
                convertedTypes[fieldName] = "text"; // Default fallback
                break;
        }
    }
    console.log("convertDataGeneratorTypes output:", convertedTypes);
    return convertedTypes;
};
const Discover = () => {
    // EUI theme hook for accessing color variables
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    // Field search state
    const [fieldSearchTerm, setFieldSearchTerm] = (0, react_1.useState)("");
    // Use URL synced store for state management
    const { appliedSearchTerm, appliedDateRange, appliedSelectedIndex, draftSearchTerm, draftDateRange, draftSelectedIndex, setDraftSearchTerm, setDraftDateRange, setDraftSelectedIndex, handleUpdateRefresh, hasChanges, applyChanges, setAppliedSearchTerm, setAppliedSelectedIndex, } = (0, hooks_1.useUrlSyncedStore)();
    // Local state
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(appliedSelectedIndex || "logs-*");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true); // Start with loading state
    const [documents, setDocuments] = (0, react_1.useState)([]);
    const [selectedFields, setSelectedFields] = (0, react_1.useState)({ timestamp: true });
    const [pagination, setPagination] = (0, react_1.useState)({
        pageIndex: 0,
        pageSize: 10,
    });
    // State for popovers
    const [isPopoverOpen, setIsPopoverOpen] = (0, react_1.useState)(false);
    const [isAggregationPopoverOpen, setIsAggregationPopoverOpen] = (0, react_1.useState)(false);
    // State for aggregation
    const [selectedOperation, setSelectedOperation] = (0, react_1.useState)("sum");
    const [selectedField, setSelectedField] = (0, react_1.useState)("");
    // State for field types from API
    const [fieldTypes, setFieldTypes] = (0, react_1.useState)({});
    const [selectedGroupByField, setSelectedGroupByField] = (0, react_1.useState)("");
    const [appliedAggregations, setAppliedAggregations] = (0, react_1.useState)([]);
    // Track whether aggregations should be applied to the data grid
    const [applyAggregationsToGrid, setApplyAggregationsToGrid] = (0, react_1.useState)(false);
    // State for editing aggregations
    const [editingAggregationIndex, setEditingAggregationIndex] = (0, react_1.useState)(null);
    const [isEditingAggregation, setIsEditingAggregation] = (0, react_1.useState)(false);
    // State for filters
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = (0, react_1.useState)(false);
    const [selectedFilterField, setSelectedFilterField] = (0, react_1.useState)("");
    const [selectedFilterOperator, setSelectedFilterOperator] = (0, react_1.useState)("equals");
    const [selectedFilterValues, setSelectedFilterValues] = (0, react_1.useState)([]);
    const [appliedFilters, setAppliedFilters] = (0, react_1.useState)([]);
    const [applyFiltersToGrid, setApplyFiltersToGrid] = (0, react_1.useState)(false);
    // State for editing filters
    const [editingFilterIndex, setEditingFilterIndex] = (0, react_1.useState)(null);
    const [isEditingFilter, setIsEditingFilter] = (0, react_1.useState)(false);
    // State to force data reload when Run button is clicked
    const [reloadTrigger, setReloadTrigger] = (0, react_1.useState)(0);
    const [editorQuery, setEditorQuery] = (0, react_1.useState)("");
    // Histogram field state
    const [histogramField, setHistogramField] = (0, react_1.useState)("@timestamp");
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    // Use dateRange from URL synced store
    const timeRange = (0, react_1.useMemo)(() => {
        const fromDate = datemath_1.default.parse(appliedDateRange.start);
        const toDate = datemath_1.default.parse(appliedDateRange.end, { roundUp: true });
        if (!fromDate || !toDate) {
            return {};
        }
        return {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
        };
    }, [appliedDateRange]);
    // Generic data loading function using our data generator system
    const loadData = (0, react_1.useCallback)(async () => {
        console.log("loadData - Starting with state:", {
            appliedAggregations,
            applyAggregationsToGrid,
            appliedFilters,
            applyFiltersToGrid,
        });
        setIsLoading(true);
        try {
            // Use the data generator system (handles both local and API data sources)
            const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
            // Prepare parameters for data generation
            const params = {
                indexPattern: selectedIndex,
                searchQuery: appliedSearchTerm,
                from: timeRange.from,
                to: timeRange.to,
            };
            // Note: Aggregations will be applied after data generation, not passed to generator
            if (appliedAggregations.length > 0) {
                console.log("loadData - Will apply aggregations after data generation:", appliedAggregations);
            }
            // Add filters only when user clicks Run (applyFiltersToGrid is true)
            console.log("loadData - Checking filters:", {
                appliedFiltersLength: appliedFilters.length,
                appliedFilters: appliedFilters,
                applyFiltersToGrid: applyFiltersToGrid,
            });
            if (appliedFilters.length > 0 && applyFiltersToGrid) {
                params.filters = appliedFilters;
                console.log("loadData - Adding filters to params:", appliedFilters);
            }
            else {
                console.log("loadData - No filters to add", {
                    filtersLength: appliedFilters.length,
                    shouldApply: applyFiltersToGrid,
                });
            }
            // Generate data using the appropriate generator
            console.log("loadData - About to call generateData with params:", params);
            const data = await dataGenerator.generateData(params);
            console.log("loadData - Data generated successfully, count:", data.length);
            // Apply aggregations if any are applied and should be applied to grid
            let processedData = data;
            if (appliedAggregations.length > 0 && applyAggregationsToGrid) {
                console.log("loadData - Applying aggregations to data:", appliedAggregations);
                processedData = applyAggregations(data, appliedAggregations);
                console.log("loadData - After aggregations, processed data:", processedData);
                console.log("loadData - After aggregations, count:", processedData.length);
            }
            // Format the data for display in the UI
            const formattedData = dataGenerator.formatForDisplay(processedData);
            console.log("loadData - Data after formatting, count:", formattedData.length);
            // Set the formatted documents in state
            console.log("loadData - Setting documents:", {
                documentsCount: formattedData.length,
                hasAggregations: appliedAggregations.length > 0,
                hasFilters: appliedFilters.length > 0,
                appliedFilters,
                appliedAggregations,
                applyAggregationsToGrid,
                firstDoc: formattedData[0],
                sampleLevels: formattedData.slice(0, 5).map((doc) => doc.level),
            });
            // Debug aggregation data specifically
            if (appliedAggregations.length > 0) {
                console.log("AGGREGATION DEBUG - Documents with aggregations:", {
                    aggregations: appliedAggregations,
                    applyToGrid: applyAggregationsToGrid,
                    documentCount: formattedData.length,
                    documents: formattedData,
                    documentFields: formattedData.length > 0 ? Object.keys(formattedData[0]) : [],
                });
            }
            setDocuments(formattedData);
        }
        catch (error) {
            console.error("Error loading data:", error);
            // In case of error, set empty documents
            setDocuments([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [
        selectedIndex,
        appliedSearchTerm,
        timeRange.from,
        timeRange.to,
        appliedAggregations,
        appliedFilters,
        applyFiltersToGrid,
        applyAggregationsToGrid,
    ]);
    // Load data on initial mount and when search/index/date changes, or when reloadTrigger changes
    (0, react_1.useEffect)(() => {
        console.log("useEffect triggered - Loading data with params:", {
            selectedIndex,
            appliedSearchTerm,
            timeRangeFrom: timeRange.from,
            timeRangeTo: timeRange.to,
            appliedAggregationsCount: appliedAggregations.length,
            appliedFiltersCount: appliedFilters.length,
            appliedFilters,
            reloadTrigger,
        });
        // When reloadTrigger changes (e.g., Run button clicked), use the full loadData function
        // Otherwise, use loadDataWithoutAggregations for initial/background loading
        if (reloadTrigger > 0) {
            console.log("reloadTrigger detected - using full loadData with aggregations and filters");
            loadData();
        }
        else {
            // Create a version of loadData that doesn't include appliedAggregations in its dependencies
            const loadDataWithoutAggregations = async () => {
                console.log("loadDataWithoutAggregations - Starting data load with filters:", appliedFilters);
                setIsLoading(true);
                try {
                    // Get the appropriate data generator for the selected index pattern
                    const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
                    // Prepare parameters for data generation (without aggregations)
                    const params = {
                        indexPattern: selectedIndex,
                        searchQuery: appliedSearchTerm,
                        from: timeRange.from,
                        to: timeRange.to,
                    };
                    // Add filters only when user clicks Run (applyFiltersToGrid is true)
                    console.log("loadDataWithoutAggregations - Checking filters:", {
                        appliedFiltersLength: appliedFilters.length,
                        appliedFilters: appliedFilters,
                        applyFiltersToGrid: applyFiltersToGrid,
                    });
                    if (appliedFilters.length > 0 && applyFiltersToGrid) {
                        params.filters = appliedFilters;
                        console.log("loadDataWithoutAggregations - Adding filters to params:", appliedFilters);
                    }
                    else {
                        console.log("loadDataWithoutAggregations - No filters to add", {
                            filtersLength: appliedFilters.length,
                            shouldApply: applyFiltersToGrid,
                        });
                    }
                    // Generate data using the appropriate generator
                    const data = await dataGenerator.generateData(params);
                    // Format the data for display in the UI
                    const formattedData = dataGenerator.formatForDisplay(data);
                    // Set the formatted documents in state
                    setDocuments(formattedData);
                }
                catch (error) {
                    console.error("Error loading data:", error);
                    // In case of error, set empty documents
                    setDocuments([]);
                }
                finally {
                    setIsLoading(false);
                }
            };
            // Only load data on initial mount and when search/index/date changes
            loadDataWithoutAggregations();
        }
    }, [
        selectedIndex,
        appliedSearchTerm,
        timeRange.from,
        timeRange.to,
        applyFiltersToGrid,
        reloadTrigger,
        loadData,
    ]);
    // Set initial values from URL store when component mounts
    (0, react_1.useEffect)(() => {
        if (appliedSearchTerm) {
            setSearchQuery(appliedSearchTerm);
        }
        if (appliedSelectedIndex) {
            setSelectedIndex(appliedSelectedIndex);
        }
    }, [appliedSearchTerm, appliedSelectedIndex]);
    // Initialize editor query
    (0, react_1.useEffect)(() => {
        setEditorQuery(convertUIToQuery());
    }, [
        appliedSearchTerm,
        appliedAggregations,
        appliedFilters,
        selectedFields,
        selectedIndex,
    ]);
    // Combined function for search and refresh
    const handleSearchRefresh = () => {
        // First, always apply any draft changes (including date range) to applied state
        handleUpdateRefresh();
        // Parse the query and update UI state
        parseQueryToUI(editorQuery);
        // Need to wait for state updates before continuing
        setTimeout(() => {
            handleRunQuery();
        }, 100);
    };
    // Separate function to handle running the query
    const handleRunQuery = () => {
        console.log("handleRunQuery - Current appliedAggregations:", appliedAggregations);
        // Update both draft and applied values immediately
        setDraftSearchTerm(searchQuery);
        setDraftSelectedIndex(selectedIndex);
        // Directly update applied state to trigger immediate data loading
        setAppliedSearchTerm(searchQuery);
        setAppliedSelectedIndex(selectedIndex);
        // Set the flag to apply aggregations to the grid based on whether aggregations exist
        const shouldApplyAggs = appliedAggregations.length > 0;
        console.log("handleRunQuery - Setting applyAggregationsToGrid to:", shouldApplyAggs);
        setApplyAggregationsToGrid(shouldApplyAggs);
        // Set the flag to apply filters to the grid based on whether filters exist
        setApplyFiltersToGrid(appliedFilters.length > 0);
        // Debug: Log the current filter state when Run is clicked
        console.log("handleSearchRefresh - Current filter state:", {
            appliedFilters,
            applyFiltersToGrid: appliedFilters.length > 0,
        });
        // Debug logging for aggregations
        console.log("handleSearchRefresh - Aggregations:", {
            appliedAggregations,
            applyToGrid: appliedAggregations.length > 0,
        });
        // Force data reload by incrementing reload trigger
        console.log("handleSearchRefresh - Before setReloadTrigger, current value:", reloadTrigger);
        setReloadTrigger((prev) => {
            console.log("handleSearchRefresh - setReloadTrigger, prev:", prev, "new:", prev + 1);
            return prev + 1;
        });
        // Note: loadData() is called by the useEffect when dependencies change
    };
    // Handle data source selection
    const handleDataSourceChange = (0, react_1.useCallback)(async (newIndex) => {
        if (newIndex !== selectedIndex) {
            // Update local state
            setSelectedIndex(newIndex);
            // Reset selected fields when index pattern changes
            setSelectedFields({});
            // Keep existing filters - they may result in empty state if fields don't exist
            // Reset documents to clear any previous data
            setDocuments([]);
            // Immediately update the draft and applied values in the URL store
            setDraftSelectedIndex(newIndex);
            // Apply the changes immediately
            handleUpdateRefresh();
            // Load data immediately
            try {
                setIsLoading(true);
                // Get the appropriate data generator for the new index pattern
                const dataGenerator = (0, data_1.getDataGenerator)(newIndex);
                // Prepare parameters for data generation
                const params = {
                    indexPattern: newIndex,
                    searchQuery: appliedSearchTerm,
                    from: timeRange.from,
                    to: timeRange.to,
                };
                // Generate data using the appropriate generator
                const data = await dataGenerator.generateData(params);
                // Format the data for display in the UI
                const formattedData = dataGenerator.formatForDisplay(data);
                // Set the formatted documents in state
                setDocuments(formattedData);
            }
            catch (error) {
                console.error("Error loading data:", error);
                // In case of error, set empty documents
                setDocuments([]);
            }
            finally {
                setIsLoading(false);
            }
        }
    }, [
        selectedIndex,
        appliedFilters.length,
        appliedSearchTerm,
        timeRange,
        setDraftSelectedIndex,
        handleUpdateRefresh,
    ]);
    // Helper function to convert UI state to query string
    const convertUIToQuery = () => {
        let query = `FROM ${selectedIndex}`;
        // Add search term if present
        if (searchQuery) {
            query += ` | WHERE message CONTAINS "${searchQuery}"`;
        }
        // Add filters
        appliedFilters.forEach((filter) => {
            const operator = filter.operator === "equals"
                ? "=="
                : filter.operator === "not_equals"
                    ? "!="
                    : filter.operator === "contains"
                        ? "CONTAINS"
                        : "==";
            if (filter.values.length === 1) {
                query += ` | WHERE ${filter.field} ${operator} "${filter.values[0]}"`;
            }
            else if (filter.values.length > 1) {
                query += ` | WHERE ${filter.field} IN [${filter.values
                    .map((v) => `"${v}"`)
                    .join(", ")}]`;
            }
        });
        // Add aggregations
        appliedAggregations.forEach((agg) => {
            if (agg.groupBy) {
                query += ` | STATS ${agg.operation.toUpperCase()}(${agg.field}) BY ${agg.groupBy}`;
            }
            else {
                query += ` | STATS ${agg.operation.toUpperCase()}(${agg.field})`;
            }
        });
        // Add field selection (limit to selected fields)
        const selectedFieldsList = Object.keys(selectedFields).filter((field) => selectedFields[field]);
        if (selectedFieldsList.length > 0 &&
            !selectedFieldsList.includes("summary")) {
            query += ` | KEEP ${selectedFieldsList.join(", ")}`;
        }
        return query;
    };
    // Helper function to parse query string and update UI state
    const parseQueryToUI = (query) => {
        // This is a simplified parser for the demo
        // In a real implementation, you'd want a proper parser
        const lines = query.split("|").map((line) => line.trim());
        // Reset current state
        setSearchQuery("");
        setAppliedFilters([]);
        setAppliedAggregations([]);
        lines.forEach((line) => {
            if (line.startsWith("FROM ")) {
                const indexPattern = line.replace("FROM ", "").trim();
                setSelectedIndex(indexPattern);
            }
            else if (line.includes("WHERE") && line.includes("CONTAINS")) {
                const match = line.match(/WHERE message CONTAINS "([^"]+)"/);
                if (match) {
                    setSearchQuery(match[1]);
                }
            }
            else if (line.includes("WHERE") &&
                (line.includes("==") || line.includes("!="))) {
                const match = line.match(/WHERE (\w+) (==|!=) "([^"]+)"/);
                if (match) {
                    const [, field, operator, value] = match;
                    const filterOperator = operator === "==" ? "equals" : "not_equals";
                    setAppliedFilters((prev) => [
                        ...prev,
                        { field, operator: filterOperator, values: [value] },
                    ]);
                }
            }
            else if (line.includes("STATS")) {
                const match = line.match(/STATS (\w+)\((\w+)\)(?:\s+BY\s+(\w+))?/);
                if (match) {
                    const [, operation, field, groupBy] = match;
                    setAppliedAggregations((prev) => [
                        ...prev,
                        {
                            operation: operation.toLowerCase(),
                            field,
                            groupBy: groupBy || undefined,
                        },
                    ]);
                }
            }
        });
    };
    // Helper function to highlight search terms in text
    const highlightSearchTerm = (text, searchTerm) => {
        if (!searchTerm || !text)
            return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, index) => {
            if (regex.test(part)) {
                return ((0, jsx_runtime_1.jsx)("span", { style: {
                        backgroundColor: euiTheme.colors.backgroundBaseWarning,
                        color: euiTheme.colors.textParagraph,
                        padding: "1px 2px",
                        borderRadius: "2px",
                    }, children: part }, index));
            }
            return part;
        });
    };
    // Get available fields based on selected index and documents
    const availableFields = (0, react_1.useMemo)(() => {
        if (!documents.length)
            return [];
        // If aggregations should be applied to the grid, show aggregation fields
        if (applyAggregationsToGrid) {
            // Get fields with their aggregation operation names and group by fields
            const fields = [];
            // Access current appliedAggregations without dependency
            appliedAggregations.forEach((agg) => {
                // Add group by field if it exists
                if (agg.groupBy && !fields.includes(agg.groupBy)) {
                    fields.push(agg.groupBy);
                }
                // Add aggregated field
                fields.push(`${agg.operation} of ${agg.field}`);
            });
            return fields;
        }
        // Get the appropriate data generator for the selected index pattern
        const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
        // Use the data generator to get available fields
        return dataGenerator.getAvailableFields(documents);
    }, [documents, selectedIndex, applyAggregationsToGrid]);
    // Calculate filtered field counts for accordion badges
    const filteredSelectedFields = (0, react_1.useMemo)(() => {
        return Object.entries(selectedFields)
            .filter(([_, selected]) => selected)
            .map(([fieldName]) => fieldName)
            .filter((fieldName) => fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase()));
    }, [selectedFields, fieldSearchTerm]);
    const filteredAvailableFields = (0, react_1.useMemo)(() => {
        return availableFields
            .filter((fieldName) => !selectedFields[fieldName])
            .filter((fieldName) => fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase()));
    }, [availableFields, selectedFields, fieldSearchTerm]);
    // Get numeric fields for aggregation
    const numericFields = (0, react_1.useMemo)(() => {
        if (!documents.length)
            return [];
        // Get the appropriate data generator for the selected index pattern
        const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
        // Get all available fields
        const allFields = dataGenerator.getAvailableFields(documents);
        // Filter for numeric fields using the field types from the API
        if (fieldTypes && Object.keys(fieldTypes).length > 0) {
            return allFields.filter((field) => {
                const fieldType = fieldTypes[field];
                return [
                    "long",
                    "integer",
                    "short",
                    "byte",
                    "double",
                    "float",
                    "half_float",
                    "scaled_float",
                ].includes(fieldType);
            });
        }
        // Fallback: return commonly known numeric fields
        return allFields.filter((field) => [
            "bytes",
            "memory",
            "machine.ram",
            "latency_ms",
            "status_code",
            "cpu",
            "duration",
            "count",
        ].includes(field));
    }, [documents, selectedIndex, fieldTypes]);
    // Get non-numeric fields for group by functionality
    const nonNumericFields = (0, react_1.useMemo)(() => {
        if (!documents.length)
            return [];
        // Get the appropriate data generator for the selected index pattern
        const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
        // Get all available fields
        const allFields = dataGenerator.getAvailableFields(documents);
        // Filter for non-numeric fields using the field types from the API
        if (fieldTypes && Object.keys(fieldTypes).length > 0) {
            return allFields.filter((field) => {
                const fieldType = fieldTypes[field];
                const isNumeric = [
                    "long",
                    "integer",
                    "short",
                    "byte",
                    "double",
                    "float",
                    "half_float",
                    "scaled_float",
                ].includes(fieldType);
                return !isNumeric && field !== "_id";
            });
        }
        // Fallback: return commonly known non-numeric fields
        return allFields.filter((field) => ![
            "bytes",
            "memory",
            "machine.ram",
            "latency_ms",
            "status_code",
            "cpu",
            "duration",
            "count",
            "_id",
        ].includes(field));
    }, [documents, selectedIndex, fieldTypes]);
    // Toggle field selection
    const toggleFieldSelection = (0, react_1.useCallback)((fieldName) => {
        setSelectedFields((prevFields) => ({
            ...prevFields,
            [fieldName]: !prevFields[fieldName],
        }));
    }, []);
    // Update selected fields when aggregations are applied to or removed from the grid
    (0, react_1.useEffect)(() => {
        if (applyAggregationsToGrid) {
            // When aggregations are applied to the grid, only select the aggregation fields
            const newSelectedFields = {};
            // Mark all fields as unselected first
            availableFields.forEach((field) => {
                newSelectedFields[field] = false;
            });
            // Then select the aggregation fields and group by fields
            // Access current appliedAggregations without dependency
            appliedAggregations.forEach((agg) => {
                // Select group by field if it exists
                if (agg.groupBy) {
                    newSelectedFields[agg.groupBy] = true;
                }
                // Select aggregated field with proper name
                const fieldName = `${agg.operation} of ${agg.field}`;
                newSelectedFields[fieldName] = true;
            });
            setSelectedFields(newSelectedFields);
        }
        else {
            // When aggregations are not applied to grid, preserve existing selections but ensure new fields are available
            setSelectedFields((prevSelectedFields) => {
                const newSelectedFields = {};
                // For each available field, preserve existing selection or default to false (except timestamp)
                availableFields.forEach((field) => {
                    // If field was previously selected, keep it selected
                    // If it's a new field, only select @timestamp by default
                    newSelectedFields[field] =
                        prevSelectedFields[field] !== undefined
                            ? prevSelectedFields[field]
                            : field === "@timestamp";
                });
                return newSelectedFields;
            });
        }
        // Update histogram field based on aggregations
        if (applyAggregationsToGrid && appliedAggregations.length > 0) {
            // Use the first aggregation's field name for the histogram
            const firstAggregation = appliedAggregations[0];
            const fieldName = `${firstAggregation.operation} of ${firstAggregation.field}`;
            setHistogramField(fieldName);
        }
        else {
            // Reset to default timestamp field when no aggregations
            setHistogramField("@timestamp");
        }
    }, [availableFields, applyAggregationsToGrid, appliedAggregations]);
    // Fetch field types from Field Capabilities API
    (0, react_1.useEffect)(() => {
        const fetchFieldTypes = async () => {
            const currentIndex = selectedIndex || appliedSelectedIndex;
            if (!currentIndex) {
                return;
            }
            try {
                const response = await fetch(`/api/fields/${encodeURIComponent(currentIndex)}`);
                if (response.ok) {
                    const apiResponse = await response.json();
                    // The API returns { fields: [...], breakdown: {...}, success: true }
                    const fieldInfo = apiResponse.fields;
                    if (Array.isArray(fieldInfo) && fieldInfo.length > 0) {
                        // Convert array of field info to a type mapping
                        const typeMapping = {};
                        fieldInfo.forEach((field) => {
                            typeMapping[field.name] = field.type;
                        });
                        setFieldTypes(typeMapping);
                    }
                    else {
                        // Fallback for generated data (like logs-*) - use data generator field types
                        const dataGenerator = (0, data_1.getDataGenerator)(currentIndex);
                        if (dataGenerator && "getFieldTypes" in dataGenerator) {
                            const generatorFieldTypes = dataGenerator.getFieldTypes();
                            const convertedTypeMapping = convertDataGeneratorTypes(generatorFieldTypes);
                            setFieldTypes(convertedTypeMapping);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Error fetching field types:", error);
            }
        };
        fetchFieldTypes();
    }, [appliedSelectedIndex, selectedIndex]);
    // Render function for the field list panel
    const renderFieldList = () => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(eui_1.EuiTitle, { size: "xs", children: (0, jsx_runtime_1.jsx)("h3", { children: "Fields" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "s" }), (0, jsx_runtime_1.jsx)(eui_1.EuiFieldSearch, { placeholder: "Filter fields...", compressed: true, fullWidth: true, value: fieldSearchTerm, onChange: (e) => setFieldSearchTerm(e.target.value) }), (0, jsx_runtime_1.jsx)(eui_1.EuiSpacer, { size: "m" }), (0, jsx_runtime_1.jsx)("div", { style: { overflowY: "auto", maxHeight: "calc(100vh - 300px)" }, children: availableFields.map((fieldName) => ((0, jsx_runtime_1.jsx)("div", { style: { marginBottom: "8px" }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiCheckbox, { id: `field-${fieldName}`, label: fieldName === "_id"
                            ? "Document ID"
                            : fieldName
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase()), checked: !!selectedFields[fieldName], onChange: () => toggleFieldSelection(fieldName) }) }, fieldName))) })] }));
    // For pagination
    const onChangeItemsPerPage = (0, react_1.useCallback)((pageSize) => setPagination((p) => ({ ...p, pageSize })), [setPagination]);
    const onChangePage = (0, react_1.useCallback)((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [setPagination]);
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", alignItems: "center", justifyContent: "flexEnd", style: { padding: "8px" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "inspect", "aria-label": "Inspect", color: "text" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "share", "aria-label": "Share", color: "text" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { fill: true, size: "s", iconType: "save", children: "Save" }) })] }), (0, jsx_runtime_1.jsx)(eui_1.EuiHorizontalRule, { margin: "none" }), (0, jsx_runtime_1.jsxs)("div", { className: "us2", style: {
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gridTemplateRows: "auto auto",
                    gap: "8px",
                    padding: "8px 8px 0 8px",
                    width: "100%",
                    alignItems: "start",
                    borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                }, children: [(0, jsx_runtime_1.jsx)("div", { className: "leftSide", style: {
                            gridColumn: "1",
                            gridRow: "1",
                        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiFlexGroup, { gutterSize: "s", children: (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiFlexGroup, { gutterSize: "s", children: (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { size: "s", color: "text", onClick: () => {
                                                // TODO: Open ES|QL help documentation
                                                console.log("ES|QL Help clicked");
                                            }, children: "ES|QL Help" }) }) }) }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "middle", style: {
                            minWidth: 0,
                            gridColumn: "2",
                            gridRow: "1",
                        } }), (0, jsx_runtime_1.jsx)("div", { className: "rightSide", style: {
                            gridColumn: "3",
                            gridRow: "1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                        }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiSuperDatePicker, { start: draftDateRange.start, end: draftDateRange.end, onTimeChange: ({ start, end }) => setDraftDateRange({ start, end }), showUpdateButton: false, width: "auto", isAutoRefreshOnly: false, compressed: true, commonlyUsedRanges: [
                                            { start: "now/d", end: "now/d", label: "Today" },
                                            { start: "now/w", end: "now/w", label: "This week" },
                                            {
                                                start: "now-15m",
                                                end: "now",
                                                label: "Last 15 minutes",
                                            },
                                            {
                                                start: "now-30m",
                                                end: "now",
                                                label: "Last 30 minutes",
                                            },
                                            { start: "now-1h", end: "now", label: "Last 1 hour" },
                                            { start: "now-24h", end: "now", label: "Last 24 hours" },
                                            { start: "now-7d", end: "now", label: "Last 7 days" },
                                            { start: "now-30d", end: "now", label: "Last 30 days" },
                                        ] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { size: "s", iconType: searchQuery ||
                                            hasChanges ||
                                            (appliedAggregations.length > 0 &&
                                                !applyAggregationsToGrid) ||
                                            (appliedAggregations.length === 0 &&
                                                applyAggregationsToGrid) ||
                                            (appliedFilters.length > 0 && !applyFiltersToGrid) ||
                                            (appliedFilters.length === 0 && applyFiltersToGrid)
                                            ? "playFilled"
                                            : "refresh", color: searchQuery ||
                                            hasChanges ||
                                            (appliedAggregations.length > 0 &&
                                                !applyAggregationsToGrid) ||
                                            (appliedAggregations.length === 0 &&
                                                applyAggregationsToGrid) ||
                                            (appliedFilters.length > 0 && !applyFiltersToGrid) ||
                                            (appliedFilters.length === 0 && applyFiltersToGrid)
                                            ? "success"
                                            : "primary", onClick: handleSearchRefresh, isLoading: isLoading, fill: false, children: searchQuery ||
                                            hasChanges ||
                                            (appliedAggregations.length > 0 && !applyAggregationsToGrid) ||
                                            (appliedAggregations.length === 0 && applyAggregationsToGrid) ||
                                            (appliedFilters.length > 0 && !applyFiltersToGrid) ||
                                            (appliedFilters.length === 0 && applyFiltersToGrid)
                                            ? "Run"
                                            : "Refresh" }) })] }) })] }), (0, jsx_runtime_1.jsx)("div", { style: {
                    gridColumn: "1 / -1", // Span all three columns
                    gridRow: "2",
                    padding: "8px 0 0 0",
                    backgroundColor: euiTheme.colors.backgroundBasePlain,
                }, children: (0, jsx_runtime_1.jsx)(components_1.CodeEditor, { value: editorQuery, onChange: setEditorQuery, placeholder: 'FROM logs-* | WHERE QSTR("*timeout*")', height: "80px", showFooter: true }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiPage, { paddingSize: "none", style: { flex: 1 }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPageBody, { children: !documents.length && !isLoading ? ((0, jsx_runtime_1.jsx)(eui_1.EuiCallOut, { title: "No data available", color: "primary", iconType: "search", children: (0, jsx_runtime_1.jsx)("p", { children: "Click the Update button to find documents." }) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(eui_1.EuiResizableContainer, { style: { height: "calc(100vh - 160px)", minHeight: "600px" }, children: (EuiResizablePanel, EuiResizableButton) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(EuiResizablePanel, { initialSize: 20, minSize: "200px", paddingSize: "s", children: (0, jsx_runtime_1.jsx)(components_1.FieldList, { availableFields: availableFields, selectedFields: selectedFields, fieldTypes: fieldTypes, onFieldToggle: toggleFieldSelection, getFieldTypeIcon: getFieldTypeIcon, filteredAvailableFieldsCount: filteredAvailableFields.length, filteredSelectedFieldsCount: filteredSelectedFields.length }) }), (0, jsx_runtime_1.jsx)(EuiResizableButton, { indicator: "border" }), (0, jsx_runtime_1.jsx)(EuiResizablePanel, { initialSize: 80, paddingSize: "none", children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiResizableContainer, { style: { height: "100%" }, direction: "vertical", children: (EuiResizablePanelInner, EuiResizableButtonInner) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(EuiResizablePanelInner, { initialSize: 30, minSize: "150px", paddingSize: "none", children: (0, jsx_runtime_1.jsx)(eui_1.EuiPanel, { paddingSize: "none", hasShadow: false, hasBorder: false, style: { height: "100%" }, children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { style: {
                                                                        height: "100%",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                    }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiLoadingSpinner, { size: "xl" }) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(components_1.DocumentHistogram, { logs: documents, field: histogramField, colorMode: colorMode, dateRange: appliedDateRange }) })) }) }), (0, jsx_runtime_1.jsx)(EuiResizableButtonInner, { indicator: "border" }), (0, jsx_runtime_1.jsx)(EuiResizablePanelInner, { initialSize: 70, paddingSize: "none", children: (0, jsx_runtime_1.jsx)(components_1.DocumentDataGrid, { documents: documents, selectedFields: selectedFields, searchTerm: appliedSearchTerm, dateRange: timeRange.from && timeRange.to
                                                                    ? timeRange
                                                                    : undefined, appliedAggregations: appliedAggregations, applyAggregationsToGrid: applyAggregationsToGrid, isCodeEditorMode: true, isLoading: isLoading, height: "100%" }) })] })) }) }) })] })) }) })) }) })] }));
};
exports.Discover = Discover;
exports.default = exports.Discover;
//# sourceMappingURL=index.js.map