"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleESQL = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const datemath_1 = __importDefault(require("@elastic/datemath"));
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const components_1 = require("../../../components");
const data_1 = require("../../../data");
const hooks_1 = require("../../../hooks");
const useAppStore_1 = require("../../../store/useAppStore");
const SimpleESQL = () => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const { colorMode, setColorMode } = (0, useAppStore_1.useAppStore)();
    const isDarkMode = colorMode === "dark";
    const toggleColorMode = () => {
        setColorMode(colorMode === "light" ? "dark" : "light");
    };
    const handleAssistantClick = () => {
        setIsAssistantOpen(true);
    };
    // CodeEditor ref for tracking generated blocks
    const codeEditorRef = (0, react_1.useRef)(null);
    // Field search state
    const [fieldSearchTerm, setFieldSearchTerm] = (0, react_1.useState)("");
    // Use URL synced store for state management
    const { appliedSearchTerm, appliedDateRange, appliedSelectedIndex, draftSearchTerm, draftDateRange, draftSelectedIndex, setDraftSearchTerm, setDraftDateRange, setDraftSelectedIndex, handleUpdateRefresh, hasChanges, setAppliedSearchTerm, setAppliedSelectedIndex, } = (0, hooks_1.useUrlSyncedStore)();
    // Local state
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(appliedSelectedIndex || "logs-*");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [documents, setDocuments] = (0, react_1.useState)([]);
    const [selectedFields, setSelectedFields] = (0, react_1.useState)({ "@timestamp": true });
    const [editorQuery, setEditorQuery] = (0, react_1.useState)("FROM logs-*");
    const [histogramField, setHistogramField] = (0, react_1.useState)("@timestamp");
    // Prompt input box state
    const [isPromptVisible, setIsPromptVisible] = (0, react_1.useState)(false);
    const [promptValue, setPromptValue] = (0, react_1.useState)("");
    const [isAIProcessing, setIsAIProcessing] = (0, react_1.useState)(false);
    const [generatedQuery, setGeneratedQuery] = (0, react_1.useState)("");
    const [showAcceptDialog, setShowAcceptDialog] = (0, react_1.useState)(false);
    const [originalPrompt, setOriginalPrompt] = (0, react_1.useState)("");
    const [isEditingPrompt, setIsEditingPrompt] = (0, react_1.useState)(false);
    const [editedPrompt, setEditedPrompt] = (0, react_1.useState)("");
    const [animatedDots, setAnimatedDots] = (0, react_1.useState)("");
    const [queryGenerated, setQueryGenerated] = (0, react_1.useState)(false);
    // AI Input Mode State
    const [inputMode, setInputMode] = (0, react_1.useState)("natural");
    const [isModePopoverOpen, setIsModePopoverOpen] = (0, react_1.useState)(false);
    // Extract current data source from editor query
    const currentDataSource = (0, react_1.useMemo)(() => {
        const match = editorQuery.match(/FROM\s+([^\s|]+)/i);
        return match ? match[1] : "logs-*";
    }, [editorQuery]);
    // Track last executed query to determine if button should show "Run"
    const [lastExecutedQuery, setLastExecutedQuery] = (0, react_1.useState)("");
    // Track current search term for highlighting in data grid
    const [currentHighlightTerm, setCurrentHighlightTerm] = (0, react_1.useState)("");
    // Assistant flyout state
    const [isAssistantOpen, setIsAssistantOpen] = (0, react_1.useState)(false);
    const [assistantInitialMessage, setAssistantInitialMessage] = (0, react_1.useState)("");
    // VisorHex generating state - still managed at page level for handlePromptSubmit
    const [visorHexGenerating, setVisorHexGenerating] = (0, react_1.useState)(false);
    // Animate dots during AI processing
    (0, react_1.useEffect)(() => {
        let interval;
        if (isAIProcessing) {
            let dotCount = 0;
            interval = setInterval(() => {
                dotCount = (dotCount + 1) % 4; // Cycle through 0, 1, 2, 3
                setAnimatedDots(".".repeat(dotCount));
            }, 500); // Update every 500ms
        }
        else {
            setAnimatedDots("");
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isAIProcessing]);
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
    // Data loading function
    const loadData = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        try {
            const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
            const params = {
                indexPattern: selectedIndex,
                searchQuery: appliedSearchTerm || "",
                from: timeRange.from || undefined,
                to: timeRange.to || undefined,
            };
            const data = await dataGenerator.generateData(params);
            const formattedData = dataGenerator.formatForDisplay(data);
            // Reset to default fields for raw documents
            setSelectedFields({ "@timestamp": true });
            setDocuments(formattedData);
        }
        catch (error) {
            console.error("Error loading data:", error);
            setDocuments([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [selectedIndex, appliedSearchTerm, timeRange.from, timeRange.to]);
    // Load data on mount and when dependencies change
    (0, react_1.useEffect)(() => {
        // Ensure we have a valid timeRange before loading data
        if (timeRange.from && timeRange.to) {
            // Use the default ES|QL query instead of regular loadData()
            const defaultQuery = convertUIToQuery();
            handleSearchRefreshWithQuery(defaultQuery);
        }
    }, [timeRange.from, timeRange.to]); // Use specific properties instead of entire object to avoid infinite loop
    // Set initial values from URL store when component mounts
    (0, react_1.useEffect)(() => {
        if (appliedSearchTerm) {
            setSearchQuery(appliedSearchTerm);
        }
        if (appliedSelectedIndex) {
            setSelectedIndex(appliedSelectedIndex);
        }
    }, [appliedSearchTerm, appliedSelectedIndex, appliedDateRange]);
    // Initialize editor query on mount only
    (0, react_1.useEffect)(() => {
        // Only set initial query if editor is empty
        if (!editorQuery) {
            setEditorQuery(convertUIToQuery());
        }
    }, []); // Empty dependency array - only runs on mount
    // Note: Keyboard shortcut removed since prompt is always visible inline
    // Streaming animation for query generation - line by line
    const streamQueryIntoEditor = async (query) => {
        return new Promise((resolve) => {
            const lines = query.split('\n');
            let currentLineIndex = 0;
            const baseDelay = 250; // Base delay between lines in ms
            const typeNextLine = () => {
                if (currentLineIndex < lines.length) {
                    // Build query up to current line
                    const currentQuery = lines.slice(0, currentLineIndex + 1).join('\n');
                    setEditorQuery(currentQuery);
                    currentLineIndex++;
                    // Variable delay for more natural feel
                    const delay = baseDelay + Math.random() * 120;
                    setTimeout(typeNextLine, delay);
                }
                else {
                    resolve();
                }
            };
            // Clear editor and start typing
            setEditorQuery("");
            setTimeout(typeNextLine, 200); // Small initial delay
        });
    };
    // Handle AI prompt submission
    const handlePromptSubmit = async (prompt, autoExecute = false, forceMode, dataSource) => {
        if (!prompt.trim())
            return;
        const modeToUse = forceMode || inputMode;
        const dataSourceToUse = dataSource || selectedIndex;
        setIsAIProcessing(true);
        try {
            // Simulate processing delay
            await (0, data_1.simulateAIProcessing)(1500);
            let queryMapping;
            if (modeToUse === "keyword") {
                // For keyword search mode, use KQL function
                queryMapping = {
                    query: `FROM ${dataSourceToUse} | WHERE KQL("${prompt.trim()}")`,
                    description: `Keyword search for: ${prompt.trim()}`,
                };
            }
            else {
                // For natural language mode, use the existing AI query mapping
                const matchingMapping = (0, data_1.findMatchingQuery)(prompt);
                queryMapping = matchingMapping || (0, data_1.getFallbackQuery)(prompt);
            }
            // Prepend the prompt as a comment before the query
            // Format depends on mode: KQL uses [KQL] [datasource] format
            let queryWithComment;
            if (modeToUse === "keyword") {
                // For KQL: // [KQL] [datasource] search term
                queryWithComment = `// [KQL] [${dataSourceToUse}] ${prompt.trim()}\n${queryMapping.query}`;
            }
            else {
                // For natural language: // prompt
                queryWithComment = `// ${prompt.trim()}\n${queryMapping.query}`;
            }
            // Stream the generated query into the editor with typing animation
            await streamQueryIntoEditor(queryWithComment);
            // Track the generated code for edit detection
            // Comment is always on line 1, code starts on line 2
            const commentLine = 1;
            const queryLines = queryMapping.query.split('\n');
            const codeLines = queryLines.map((_, index) => index + 2); // Lines 2, 3, 4, etc.
            // Use setTimeout to ensure tracking happens after the editor has been updated
            setTimeout(() => {
                if (codeEditorRef.current && codeEditorRef.current.trackGeneratedBlock) {
                    codeEditorRef.current.trackGeneratedBlock(commentLine, codeLines);
                }
            }, 500); // Increased timeout to ensure streaming completes
            // Set success state to show check icon
            setQueryGenerated(true);
            // Keep the prompt value in the input (don't clear it)
            // Auto-execute for keyword mode (always) or when explicitly requested
            if (modeToUse === "keyword" || autoExecute) {
                // For keyword search, directly parse and execute the QSTR query
                if (modeToUse === "keyword") {
                    // Parse the QSTR query to extract filters, limit, and aggregation
                    const { filters: esqlFilters, limit, aggregation } = parseSimpleFilters(queryMapping.query);
                    // Default limit to 1000 if not specified
                    const effectiveLimit = limit !== null ? limit : 1000;
                    // Update last executed query to show "Refresh" instead of "Run"
                    setLastExecutedQuery(queryMapping.query);
                    // Execute the query directly with filters, limit, and aggregation
                    loadDataWithFilters(esqlFilters, effectiveLimit, aggregation);
                }
                else {
                    // For natural language mode, use the regular flow
                    handleSearchRefreshWithQuery(queryMapping.query);
                }
            }
        }
        catch (error) {
            console.error("Error processing prompt:", error);
        }
        finally {
            setIsAIProcessing(false);
            // Clear generating state after processing completes
            setVisorHexGenerating(false);
        }
    };
    // Helper function to parse time range from ES|QL query
    const parseTimeRangeFromQuery = (query) => {
        // Look for patterns like: @timestamp >= NOW() - 1h, NOW() - 24h, etc.
        const timeRangeMatch = query.match(/@timestamp\s*>=\s*NOW\(\)\s*-\s*(\d+)([hHdDwWmM])/);
        if (timeRangeMatch) {
            const [, amount, unit] = timeRangeMatch;
            const now = new Date();
            let start;
            switch (unit.toLowerCase()) {
                case "h":
                    start = new Date(now.getTime() - parseInt(amount) * 60 * 60 * 1000);
                    break;
                case "d":
                    start = new Date(now.getTime() - parseInt(amount) * 24 * 60 * 60 * 1000);
                    break;
                case "w":
                    start = new Date(now.getTime() - parseInt(amount) * 7 * 24 * 60 * 60 * 1000);
                    break;
                case "m":
                    start = new Date(now.getTime() - parseInt(amount) * 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    return null;
            }
            return {
                start: start.toISOString(),
                end: now.toISOString(),
            };
        }
        return null;
    };
    // Helper function to extract simple WHERE filters and LIMIT from ES|QL query
    const parseSimpleFilters = (query) => {
        const filters = [];
        let foundSearchTerm = "";
        let limitValue = null;
        let aggregation = null;
        // Extract LIMIT value
        const limitRegex = /LIMIT\s+(\d+)/i;
        const limitMatch = limitRegex.exec(query);
        if (limitMatch) {
            limitValue = parseInt(limitMatch[1]);
        }
        // Extract STATS aggregation
        // Pattern: STATS result_name = COUNT(*) BY field_name OR STATS COUNT() BY field_name
        const statsRegex = /STATS\s+(?:(\w+)\s*=\s*)?COUNT\s*\(\s*\*?\s*\)\s+BY\s+([\w\.]+)/i;
        const statsMatch = statsRegex.exec(query);
        if (statsMatch) {
            const [, resultName, groupByField] = statsMatch;
            aggregation = {
                resultName: resultName || "count", // Default to "count" if no result name provided
                operation: "count",
                groupByField,
            };
        }
        // Extract WHERE field == "value" patterns (handle multiline with \s which includes \n, case-insensitive)
        const equalityRegex = /WHERE\s+([^\s]+)\s*==\s*"([^"]+)"/gi;
        let match;
        while ((match = equalityRegex.exec(query)) !== null) {
            const [, field, value] = match;
            filters.push({
                field: field,
                operator: "equals",
                values: [value],
            });
        }
        // Extract WHERE field CONTAINS "value" patterns (handle multiline, case-insensitive)
        const containsRegex = /(?:WHERE|AND|OR)\s+([^\s]+)\s+CONTAINS\s+"([^"]+)"/gi;
        while ((match = containsRegex.exec(query)) !== null) {
            const [, field, value] = match;
            // Store search term for highlighting if it's a message field
            if (field === "message") {
                foundSearchTerm = value;
            }
            filters.push({
                field: field,
                operator: "contains",
                values: [value],
            });
        }
        // Extract WHERE QSTR("""value""") patterns for simple text search
        const qstrRegex = /WHERE\s+QSTR\("""([^"]+)"""\)/g;
        while ((match = qstrRegex.exec(query)) !== null) {
            const [, value] = match;
            // Store the search term for highlighting
            foundSearchTerm = value;
            filters.push({
                field: "message", // QSTR searches across all fields, but we'll use message as the primary search field
                operator: "contains",
                values: [value],
            });
        }
        // Extract WHERE KQL("value") patterns for KQL search (case-insensitive)
        const kqlRegex = /WHERE\s+KQL\("([^"]+)"\)/gi;
        while ((match = kqlRegex.exec(query)) !== null) {
            const [, value] = match;
            // Store the search term for highlighting
            foundSearchTerm = value;
            filters.push({
                field: "*", // KQL searches across ALL fields
                operator: "contains",
                values: [value],
            });
        }
        // Also check for OR conditions on the same line (case-insensitive)
        const orEqualityRegex = /OR\s+([^\s]+)\s*==\s*"([^"]+)"/gi;
        while ((match = orEqualityRegex.exec(query)) !== null) {
            const [, field, value] = match;
            filters.push({
                field: field,
                operator: "equals",
                values: [value],
            });
        }
        // Update highlight term
        setCurrentHighlightTerm(foundSearchTerm);
        return { filters, limit: limitValue, aggregation };
    };
    // Handle accepting the generated query
    const handleAcceptQuery = () => {
        setEditorQuery(generatedQuery);
        setShowAcceptDialog(false);
        setGeneratedQuery("");
        setOriginalPrompt("");
        setIsEditingPrompt(false);
        setEditedPrompt("");
        // Parse and apply time range from the ES|QL query
        const timeRangeFromQuery = parseTimeRangeFromQuery(generatedQuery);
        if (timeRangeFromQuery) {
            setDraftDateRange(timeRangeFromQuery);
        }
        // Call refresh directly with the generated query to avoid state timing issues
        handleSearchRefreshWithQuery(generatedQuery);
    };
    // Handle discarding the generated query
    const handleDiscardQuery = () => {
        setShowAcceptDialog(false);
        setGeneratedQuery("");
        setOriginalPrompt("");
        setIsEditingPrompt(false);
        setEditedPrompt("");
    };
    // Handle editing the prompt
    const handleEditPrompt = () => {
        setEditedPrompt(originalPrompt);
        setIsEditingPrompt(true);
    };
    // Handle saving the edited prompt and regenerating
    const handleSaveEditedPrompt = async () => {
        if (!editedPrompt.trim())
            return;
        setIsEditingPrompt(false);
        setIsAIProcessing(true);
        try {
            // Simulate AI processing delay
            await (0, data_1.simulateAIProcessing)(1500);
            // Find matching query or use fallback
            const matchingMapping = (0, data_1.findMatchingQuery)(editedPrompt);
            const queryMapping = matchingMapping || (0, data_1.getFallbackQuery)(editedPrompt);
            // Update with new query and prompt
            setGeneratedQuery(queryMapping.query);
            setOriginalPrompt(editedPrompt);
            setEditedPrompt("");
        }
        catch (error) {
            console.error("Error processing edited prompt:", error);
        }
        finally {
            setIsAIProcessing(false);
        }
    };
    // Handle canceling the edit
    const handleCancelEdit = () => {
        setIsEditingPrompt(false);
        setEditedPrompt("");
    };
    // Combined function for search and refresh (with optional query parameter)
    const handleSearchRefreshWithQuery = (queryToUse) => {
        const queryString = queryToUse || editorQuery;
        // Update last executed query
        setLastExecutedQuery(queryString);
        handleUpdateRefresh();
        // If we have an ES|QL query, parse it for filters
        if (queryString.trim() && queryString.includes("FROM")) {
            // Parse simple filters, limit, and aggregation from the ES|QL query
            const { filters: esqlFilters, limit, aggregation } = parseSimpleFilters(queryString);
            // Default limit to 1000 if not specified
            const effectiveLimit = limit !== null ? limit : 1000;
            // Always use ES|QL filter path for ES|QL queries (even with no explicit filters)
            // Store current search term and clear it so ES|QL filters take precedence
            const originalSearchTerm = searchQuery;
            setDraftSearchTerm(""); // Clear search term when using ES|QL
            setAppliedSearchTerm("");
            // Load data with the parsed filters, limit, and aggregation
            loadDataWithFilters(esqlFilters, effectiveLimit, aggregation);
            return;
        }
        // Fallback to regular search logic
        setDraftSearchTerm(searchQuery);
        setDraftSelectedIndex(selectedIndex);
        setAppliedSearchTerm(searchQuery);
        setAppliedSelectedIndex(selectedIndex);
        loadData();
    };
    const handleSearchRefresh = (queryToExecute) => {
        const query = queryToExecute || editorQuery;
        // Simply execute whatever query is in the editor
        // Code generation from comments should ONLY happen via Cmd+K
        setLastExecutedQuery(query);
        handleSearchRefreshWithQuery(query);
    };
    // Helper function to load data with specific filters and optional limit and aggregation
    const loadDataWithFilters = async (filters, limit, aggregation) => {
        setIsLoading(true);
        try {
            const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
            // Calculate time range
            const fromDate = datemath_1.default.parse(appliedDateRange.start);
            const toDate = datemath_1.default.parse(appliedDateRange.end, { roundUp: true });
            const timeRange = fromDate && toDate
                ? {
                    from: fromDate.toISOString(),
                    to: toDate.toISOString(),
                }
                : {};
            const params = {
                indexPattern: selectedIndex,
                searchQuery: "", // No search query when using ES|QL filters
                from: timeRange.from || undefined,
                to: timeRange.to || undefined,
                filters: filters, // Pass the parsed ES|QL filters
            };
            const docs = await dataGenerator.generateData(params);
            let finalDocs = docs;
            // Perform aggregation if specified
            if (aggregation) {
                const { resultName, operation, groupByField } = aggregation;
                // Group by field and count
                const groups = new Map();
                docs.forEach((doc) => {
                    // Get the field value, handling nested fields
                    const fieldValue = doc[groupByField] ||
                        (groupByField.includes('.') ?
                            groupByField.split('.').reduce((obj, key) => obj?.[key], doc) :
                            undefined);
                    if (fieldValue !== undefined && fieldValue !== null) {
                        const key = String(fieldValue);
                        groups.set(key, (groups.get(key) || 0) + 1);
                    }
                });
                // Convert to array of aggregated documents
                finalDocs = Array.from(groups.entries()).map(([fieldValue, count]) => ({
                    [groupByField]: fieldValue,
                    [resultName]: count,
                }));
                // Sort by count descending (since query has SORT)
                finalDocs.sort((a, b) => b[resultName] - a[resultName]);
                // Update selected fields to show only aggregation result fields
                setSelectedFields({
                    [resultName]: true,
                    [groupByField]: true,
                });
            }
            else {
                // No aggregation - reset to default fields for raw documents
                setSelectedFields({ "@timestamp": true });
                if (limit !== null && limit !== undefined) {
                    // Apply LIMIT if specified (only when not aggregating)
                    finalDocs = docs.slice(0, limit);
                }
            }
            setDocuments(finalDocs);
        }
        catch (error) {
            console.error("Error loading data with filters:", error);
            setDocuments([]);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Helper function to convert UI state to query string
    const convertUIToQuery = () => {
        return `FROM ${selectedIndex}`;
    };
    // Get available fields based on selected index and documents
    const availableFields = (0, react_1.useMemo)(() => {
        if (!documents.length)
            return [];
        const dataGenerator = (0, data_1.getDataGenerator)(selectedIndex);
        return dataGenerator.getAvailableFields(documents);
    }, [documents, selectedIndex]);
    // Toggle field selection
    const toggleFieldSelection = (0, react_1.useCallback)((fieldName) => {
        setSelectedFields((prevFields) => ({
            ...prevFields,
            [fieldName]: !prevFields[fieldName],
        }));
    }, []);
    // Calculate filtered field counts
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
    // Calculate dynamic editor height based on number of lines
    const editorHeight = (0, react_1.useMemo)(() => {
        const lineCount = editorQuery.split('\n').length;
        const lineHeight = 20; // pixels per line
        const padding = 20; // extra padding
        const calculatedHeight = Math.max(80, Math.min(300, lineCount * lineHeight + padding));
        return `${calculatedHeight}px`;
    }, [editorQuery]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", height: "100vh", width: "100%" }, children: [(0, jsx_runtime_1.jsx)(components_1.NewNav, { activeItem: "discover" }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, display: "flex", flexDirection: "column", height: "100%" }, children: [(0, jsx_runtime_1.jsx)(components_1.KibanaHeader, { colorMode: colorMode, onToggleColorMode: toggleColorMode, onAssistantClick: handleAssistantClick, isHomepage: false, display: "classic" }), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, position: "relative", overflow: "hidden", paddingTop: 0, paddingRight: euiTheme.size.s, paddingBottom: euiTheme.size.s, paddingLeft: 0 }, children: (0, jsx_runtime_1.jsxs)(components_1.AppContainer, { children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                        display: "grid",
                                        gridTemplateColumns: "auto 1fr auto",
                                        gridTemplateRows: "auto auto",
                                        gap: "8px",
                                        padding: "8px 8px 0 8px",
                                        width: "100%",
                                        alignItems: "start",
                                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { gridColumn: "1", gridRow: "1" } }), (0, jsx_runtime_1.jsx)("div", { style: {
                                                gridColumn: "3",
                                                gridRow: "1",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                            }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiSuperDatePicker, { start: draftDateRange.start, end: draftDateRange.end, onTimeChange: ({ start, end }) => setDraftDateRange({ start, end }), showUpdateButton: false, width: "auto", isAutoRefreshOnly: false, compressed: true, commonlyUsedRanges: [
                                                                { start: "now/d", end: "now/d", label: "Today" },
                                                                { start: "now/w", end: "now/w", label: "This week" },
                                                                { start: "now-15m", end: "now", label: "Last 15 minutes" },
                                                                { start: "now-30m", end: "now", label: "Last 30 minutes" },
                                                                { start: "now-1h", end: "now", label: "Last 1 hour" },
                                                                { start: "now-24h", end: "now", label: "Last 24 hours" },
                                                                { start: "now-7d", end: "now", label: "Last 7 days" },
                                                                { start: "now-30d", end: "now", label: "Last 30 days" },
                                                            ] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { size: "s", color: "primary", onClick: () => handleSearchRefresh(), isLoading: isLoading, fill: true, children: "Search" }) })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                        flex: "1 1 auto",
                                        minHeight: "600px",
                                        display: "flex",
                                        flexDirection: "column",
                                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                flex: "0 0 auto",
                                                minHeight: "80px",
                                            }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                    minHeight: editorHeight,
                                                    padding: "0",
                                                    margin: "0",
                                                }, children: (0, jsx_runtime_1.jsx)(components_1.CodeEditor, { value: editorQuery, onChange: setEditorQuery, height: "auto", showFooter: true, onSubmit: handleSearchRefresh, editMarkerStyle: "gutter", editorRef: codeEditorRef, visorDisplay: "singleLine", showEmptyLineHint: false, enableVisor: true, onVisorSubmit: (prompt, language, dataSource) => {
                                                        // Update selected index if different from current
                                                        if (dataSource !== selectedIndex) {
                                                            setSelectedIndex(dataSource);
                                                        }
                                                        // Set generating state only for Natural language
                                                        if (language === "Natural language") {
                                                            setVisorHexGenerating(true);
                                                        }
                                                        // Handle based on language mode
                                                        // Note: autoExecute is set to false - user must manually click Search
                                                        if (language === "Natural language") {
                                                            // Use AI to generate query
                                                            handlePromptSubmit(prompt, false, "natural", dataSource);
                                                        }
                                                        else if (language === "KQL") {
                                                            // Generate KQL query
                                                            handlePromptSubmit(prompt, false, "keyword", dataSource);
                                                        }
                                                        else if (language === "PromQL") {
                                                            // For now, treat PromQL like natural language
                                                            handlePromptSubmit(prompt, false, "natural", dataSource);
                                                        }
                                                    }, visorCurrentDataSource: currentDataSource, visorIsGenerating: visorHexGenerating }) }) }), (0, jsx_runtime_1.jsx)("div", { style: { flex: "1 1 auto", minHeight: 0 }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPage, { paddingSize: "none", style: { height: "100%" }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPageBody, { paddingSize: "none", style: { height: "100%" }, children: !documents.length && !isLoading ? ((0, jsx_runtime_1.jsx)(eui_1.EuiCallOut, { title: "No data available", color: "primary", iconType: "search", children: (0, jsx_runtime_1.jsx)("p", { children: "Click the Update button to find documents." }) })) : ((0, jsx_runtime_1.jsx)(eui_1.EuiResizableContainer, { style: { height: "100%" }, children: (EuiResizablePanelInner, EuiResizableButtonInner) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(EuiResizablePanelInner, { initialSize: 20, minSize: "200px", paddingSize: "s", style: { paddingBottom: 0 }, children: (0, jsx_runtime_1.jsx)(components_1.FieldList, { availableFields: availableFields, selectedFields: selectedFields, fieldTypes: {}, onFieldToggle: toggleFieldSelection, getFieldTypeIcon: () => "tokenString", filteredAvailableFieldsCount: filteredAvailableFields.length, filteredSelectedFieldsCount: filteredSelectedFields.length }) }), (0, jsx_runtime_1.jsx)(EuiResizableButtonInner, { indicator: "border" }), (0, jsx_runtime_1.jsx)(EuiResizablePanelInner, { initialSize: 80, paddingSize: "none", children: (0, jsx_runtime_1.jsx)("div", { style: {
                                                                            height: "100%",
                                                                            display: "flex",
                                                                            flexDirection: "column",
                                                                        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiResizableContainer, { style: { height: "100%" }, direction: "vertical", children: (EuiResizablePanelDeep, EuiResizableButtonDeep) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(EuiResizablePanelDeep, { initialSize: 30, minSize: "150px", paddingSize: "none", children: (0, jsx_runtime_1.jsx)(eui_1.EuiPanel, { paddingSize: "none", hasShadow: false, hasBorder: false, style: { height: "100%" }, children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { style: {
                                                                                                    height: "100%",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiLoadingSpinner, { size: "xl" }) })) : ((0, jsx_runtime_1.jsx)(components_1.DocumentHistogram, { logs: documents, field: histogramField, colorMode: colorMode, dateRange: appliedDateRange })) }) }), (0, jsx_runtime_1.jsx)(EuiResizableButtonDeep, { indicator: "border" }), (0, jsx_runtime_1.jsx)(EuiResizablePanelDeep, { initialSize: 70, paddingSize: "none", children: (0, jsx_runtime_1.jsx)(components_1.DocumentDataGrid, { documents: documents, selectedFields: selectedFields, searchTerm: currentHighlightTerm ||
                                                                                                appliedSearchTerm, dateRange: timeRange.from && timeRange.to
                                                                                                ? timeRange
                                                                                                : undefined, appliedAggregations: [], applyAggregationsToGrid: false, isCodeEditorMode: true, isLoading: isLoading, height: "100%" }) })] })) }) }) })] })) })) }) }) })] })] }) })] }), (0, jsx_runtime_1.jsx)(components_1.AssistantFlyout, { isOpen: isAssistantOpen, onClose: () => {
                    setIsAssistantOpen(false);
                    setAssistantInitialMessage("");
                }, initialMessage: assistantInitialMessage, autoSubmit: true })] }));
};
exports.SimpleESQL = SimpleESQL;
exports.default = exports.SimpleESQL;
//# sourceMappingURL=index.js.map