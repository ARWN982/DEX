import dateMath from "@elastic/datemath";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiPopover,
  EuiResizableContainer,
  EuiSelectable,
  EuiSpacer,
  EuiSuperDatePicker,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from "@elastic/eui";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Command, ArrowFatUp, PaperPlaneRight } from "phosphor-react";
import {
  DocumentHistogram,
  CodeEditor,
  FieldList,
  DocumentDataGrid,
  // TextSelectionExplainer,
  AssistantFlyout,
  VisorFixedBar,
} from "../../../components";
import { PageHeader } from "../components";
import {
  BaseDocument,
  getDataGenerator,
  DataGeneratorParams,
  findMatchingQuery,
  getFallbackQuery,
  simulateAIProcessing,
} from "../../../data";
import { useUrlSyncedStore } from "../../../hooks";
import { useAppStore } from "../../../store/useAppStore";

export const SimpleESQL: React.FC = () => {
  console.log("SimpleESQL component loaded");
  const { euiTheme } = useEuiTheme();
  const { colorMode } = useAppStore();
  const isDarkMode = colorMode === "dark";

  // CodeEditor ref for tracking generated blocks
  const codeEditorRef = useRef<{
    view: any;
    trackGeneratedBlock: (commentLine: number, codeLines: number[]) => void;
  }>(null);

  // Field search state
  const [fieldSearchTerm, setFieldSearchTerm] = useState("");

  // Use URL synced store for state management
  const {
    appliedSearchTerm,
    appliedDateRange,
    appliedSelectedIndex,
    draftSearchTerm,
    draftDateRange,
    draftSelectedIndex,
    setDraftSearchTerm,
    setDraftDateRange,
    setDraftSelectedIndex,
    handleUpdateRefresh,
    hasChanges,
    setAppliedSearchTerm,
    setAppliedSelectedIndex,
  } = useUrlSyncedStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(
    appliedSelectedIndex || "logs-*"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<BaseDocument[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    { "@timestamp": true }
  );
  const [editorQuery, setEditorQuery] = useState("FROM logs-*");
  const [histogramField, setHistogramField] = useState<string>("@timestamp");

  // Prompt input box state
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [animatedDots, setAnimatedDots] = useState("");
  const [queryGenerated, setQueryGenerated] = useState(false);

  // AI Input Mode State
  const [inputMode, setInputMode] = useState<"natural" | "keyword">("natural");
  const [isModePopoverOpen, setIsModePopoverOpen] = useState(false);
  
  // Extract current data source from editor query
  const currentDataSource = useMemo(() => {
    const match = editorQuery.match(/FROM\s+([^\s|]+)/i);
    return match ? match[1] : "logs-*";
  }, [editorQuery]);

  // Track last executed query to determine if button should show "Run"
  const [lastExecutedQuery, setLastExecutedQuery] = useState("");

  // Track current search term for highlighting in data grid
  const [currentHighlightTerm, setCurrentHighlightTerm] = useState("");

  // Assistant flyout state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialMessage, setAssistantInitialMessage] = useState("");

  // Debug log for prompt visibility changes
  useEffect(() => {
    console.log("Prompt visibility changed to:", isPromptVisible);
  }, [isPromptVisible]);

  // Animate dots during AI processing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAIProcessing) {
      let dotCount = 0;
      interval = setInterval(() => {
        dotCount = (dotCount + 1) % 4; // Cycle through 0, 1, 2, 3
        setAnimatedDots(".".repeat(dotCount));
      }, 500); // Update every 500ms
    } else {
      setAnimatedDots("");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAIProcessing]);

  // Use dateRange from URL synced store
  const timeRange = useMemo(() => {
    const fromDate = dateMath.parse(appliedDateRange.start);
    const toDate = dateMath.parse(appliedDateRange.end, { roundUp: true });

    if (!fromDate || !toDate) {
      return {};
    }

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }, [appliedDateRange]);

  // Data loading function
  const loadData = useCallback(async () => {
    console.log("Loading data with params:", {
      selectedIndex,
      appliedSearchTerm,
      timeRange,
    });

    setIsLoading(true);

    try {
      const dataGenerator = getDataGenerator(selectedIndex);
      const params: DataGeneratorParams = {
        indexPattern: selectedIndex,
        searchQuery: appliedSearchTerm || "",
        from: timeRange.from || undefined,
        to: timeRange.to || undefined,
      };

      console.log("Data generator params:", params);
      const data = await dataGenerator.generateData(params);
      console.log("Generated data count:", data.length);

      const formattedData = dataGenerator.formatForDisplay(data);
      console.log("Formatted data count:", formattedData.length);

      // Reset to default fields for raw documents
      setSelectedFields({ "@timestamp": true });
      
      setDocuments(formattedData);
    } catch (error) {
      console.error("Error loading data:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndex, appliedSearchTerm, timeRange.from, timeRange.to]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    // Ensure we have a valid timeRange before loading data
    if (timeRange.from && timeRange.to) {
      // Use the default ES|QL query instead of regular loadData()
      const defaultQuery = convertUIToQuery();
      console.log("Loading initial data with default query:", defaultQuery);
      handleSearchRefreshWithQuery(defaultQuery);
    } else {
      console.log("TimeRange not ready yet:", timeRange);
    }
  }, [timeRange]); // Remove loadData dependency to avoid infinite loop

  // Set initial values from URL store when component mounts
  useEffect(() => {
    console.log("Initial state values:", {
      appliedSearchTerm,
      appliedSelectedIndex,
      appliedDateRange,
    });

    if (appliedSearchTerm) {
      setSearchQuery(appliedSearchTerm);
    }
    if (appliedSelectedIndex) {
      setSelectedIndex(appliedSelectedIndex);
    }
  }, [appliedSearchTerm, appliedSelectedIndex, appliedDateRange]);

  // Initialize editor query on mount only
  useEffect(() => {
    // Only set initial query if editor is empty
    if (!editorQuery) {
      setEditorQuery(convertUIToQuery());
    }
  }, []); // Empty dependency array - only runs on mount

  // Note: Keyboard shortcut removed since prompt is always visible inline

  // Handle prompt submission from VisorFixedBar
  const handleVisorSubmit = async (
    prompt: string,
    language: string,
    dataSource: string
  ) => {
    if (!prompt.trim()) return;

    console.log("Visor submit:", { prompt, language, dataSource });

    if (language === "KQL") {
      // Handle KQL queries
      const comment = `// [KQL] [${dataSource}] ${prompt.trim()}`;
      const code = `FROM ${dataSource} | WHERE KQL("${prompt.trim()}")`;
      const fullQuery = `${comment}\n${code}`;
      
      // Insert into editor
      setEditorQuery(fullQuery);
      
      // Auto-execute the query
      setLastExecutedQuery(fullQuery);
      handleSearchRefreshWithQuery(fullQuery);
    } else if (language === "Natural language") {
      // Handle natural language queries with comment
      setIsAIProcessing(true);
      
      try {
        // Simulate processing delay
        await simulateAIProcessing(1500);
        
        // Generate the ES|QL query from natural language
        const matchingMapping = findMatchingQuery(prompt);
        const queryMapping = matchingMapping || getFallbackQuery(prompt);
        
        // Create comment and code
        const comment = `// [Natural language] ${prompt.trim()}`;
        const fullQuery = `${comment}\n${queryMapping.query}`;
        
        console.log("Generated query with comment:", fullQuery);
        
        // Insert into editor
        setEditorQuery(fullQuery);
        
        // Track the generated block (comment on line 1, code starts on line 2)
        setTimeout(() => {
          if (codeEditorRef.current) {
            const codeLineCount = queryMapping.query.split('\n').length;
            const codeLines = Array.from({ length: codeLineCount }, (_, i) => 2 + i);
            console.log("[v1.1] Tracking generated block from natural language:", {
              commentLine: 1,
              codeLines
            });
            codeEditorRef.current.trackGeneratedBlock(1, codeLines);
          }
        }, 100); // Small delay to ensure editor has updated
        
        // Auto-execute
        setLastExecutedQuery(fullQuery);
        handleSearchRefreshWithQuery(fullQuery);
      } catch (error) {
        console.error("Error processing natural language prompt:", error);
      } finally {
        setIsAIProcessing(false);
      }
    } else if (language === "PromQL") {
      // Handle PromQL queries (future implementation)
      console.log("PromQL not yet implemented");
    }
  };

  // Handle AI prompt submission
  const handlePromptSubmit = async (
    prompt: string,
    autoExecute: boolean = false,
    forceMode?: "natural" | "keyword"
  ) => {
    if (!prompt.trim()) return;

    const modeToUse = forceMode || inputMode;
    console.log(
      "Processing prompt:",
      prompt,
      "in mode:",
      modeToUse,
      "autoExecute:",
      autoExecute
    );
    setIsAIProcessing(true);

    try {
      // Simulate processing delay
      await simulateAIProcessing(1500);

      let queryMapping;

      if (modeToUse === "keyword") {
        // For keyword search mode, use QSTR function
        queryMapping = {
          query: `FROM ${selectedIndex} | WHERE KQL("""${prompt.trim()}""")`,
          description: `Keyword search for: ${prompt.trim()}`,
        };
      } else {
        // For natural language mode, use the existing AI query mapping
        const matchingMapping = findMatchingQuery(prompt);
        queryMapping = matchingMapping || getFallbackQuery(prompt);
      }

      console.log("Generated query:", queryMapping.query);

      // Automatically insert the generated query into the editor
      setEditorQuery(queryMapping.query);

      // Set success state to show check icon
      setQueryGenerated(true);

      // Keep the prompt value in the input (don't clear it)

      // Auto-execute for keyword mode (always) or when explicitly requested
      if (modeToUse === "keyword" || autoExecute) {
        console.log("Auto-executing query:", queryMapping.query);

        // For keyword search, directly parse and execute the QSTR query
        if (modeToUse === "keyword") {
          // Parse the QSTR query to extract filters, limit, and aggregation
          const { filters: esqlFilters, limit, aggregation } = parseSimpleFilters(
            queryMapping.query
          );
          console.log("Auto-execution: extracted filters:", esqlFilters);
          console.log("Auto-execution: extracted limit:", limit);
          console.log("Auto-execution: extracted aggregation:", aggregation);

          // Update last executed query to show "Refresh" instead of "Run"
          setLastExecutedQuery(queryMapping.query);

          // Execute the query directly with filters, limit, and aggregation
          if (esqlFilters.length > 0 || limit !== null || aggregation) {
            loadDataWithFilters(esqlFilters, limit, aggregation);
          }
        } else {
          // For natural language mode, use the regular flow
          handleSearchRefreshWithQuery(queryMapping.query);
        }
      }
    } catch (error) {
      console.error("Error processing prompt:", error);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Helper function to parse time range from ES|QL query
  const parseTimeRangeFromQuery = (query: string) => {
    // Look for patterns like: @timestamp >= NOW() - 1h, NOW() - 24h, etc.
    const timeRangeMatch = query.match(
      /@timestamp\s*>=\s*NOW\(\)\s*-\s*(\d+)([hHdDwWmM])/
    );

    if (timeRangeMatch) {
      const [, amount, unit] = timeRangeMatch;
      const now = new Date();
      let start: Date;

      switch (unit.toLowerCase()) {
        case "h":
          start = new Date(now.getTime() - parseInt(amount) * 60 * 60 * 1000);
          break;
        case "d":
          start = new Date(
            now.getTime() - parseInt(amount) * 24 * 60 * 60 * 1000
          );
          break;
        case "w":
          start = new Date(
            now.getTime() - parseInt(amount) * 7 * 24 * 60 * 60 * 1000
          );
          break;
        case "m":
          start = new Date(
            now.getTime() - parseInt(amount) * 30 * 24 * 60 * 60 * 1000
          );
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
  const parseSimpleFilters = (query: string) => {
    console.log("Parsing ES|QL query for filters (full query):");
    console.log("Query length:", query.length);
    console.log("Query content:", JSON.stringify(query)); // This will show actual newlines

    const filters = [];
    let foundSearchTerm = "";
    let limitValue = null;
    let aggregation = null;

    // Extract LIMIT value
    const limitRegex = /LIMIT\s+(\d+)/i;
    const limitMatch = limitRegex.exec(query);
    if (limitMatch) {
      limitValue = parseInt(limitMatch[1]);
      console.log("Found LIMIT:", limitValue);
    }

    // Extract STATS aggregation
    // Pattern: STATS result_name = COUNT(*) BY field_name
    const statsRegex = /STATS\s+(\w+)\s*=\s*COUNT\s*\(\s*\*?\s*\)\s+BY\s+([\w\.]+)/i;
    const statsMatch = statsRegex.exec(query);
    if (statsMatch) {
      const [, resultName, groupByField] = statsMatch;
      aggregation = {
        resultName,
        operation: "count",
        groupByField,
      };
      console.log("Found STATS aggregation:", aggregation);
    }

    // Extract WHERE field == "value" patterns (handle multiline with \s which includes \n)
    const equalityRegex = /WHERE\s+([^\s]+)\s*==\s*"([^"]+)"/g;
    let match;
    while ((match = equalityRegex.exec(query)) !== null) {
      const [, field, value] = match;
      console.log("Found equality filter:", field, "==", value);
      filters.push({
        field: field,
        operator: "equals" as const,
        values: [value],
      });
    }

    // Extract WHERE field CONTAINS "value" patterns (handle multiline)
    const containsRegex = /(?:WHERE|AND|OR)\s+([^\s]+)\s+CONTAINS\s+"([^"]+)"/g;
    while ((match = containsRegex.exec(query)) !== null) {
      const [, field, value] = match;
      console.log("Found contains filter:", field, "CONTAINS", value);
      // Store search term for highlighting if it's a message field
      if (field === "message") {
        foundSearchTerm = value;
      }
      filters.push({
        field: field,
        operator: "contains" as const,
        values: [value],
      });
    }

    // Extract WHERE QSTR("""value""") patterns for simple text search
    const qstrRegex = /WHERE\s+QSTR\("""([^"]+)"""\)/g;
    while ((match = qstrRegex.exec(query)) !== null) {
      const [, value] = match;
      console.log("Found QSTR filter:", "QSTR", value);
      // Store the search term for highlighting
      foundSearchTerm = value;
      filters.push({
        field: "message", // QSTR searches across all fields, but we'll use message as the primary search field
        operator: "contains" as const,
        values: [value],
      });
    }

    // Extract WHERE KQL("value") patterns for KQL search
    const kqlRegex = /WHERE\s+KQL\("([^"]+)"\)/g;
    while ((match = kqlRegex.exec(query)) !== null) {
      const [, value] = match;
      console.log("Found KQL filter:", "KQL", value);
      // Store the search term for highlighting
      foundSearchTerm = value;
      filters.push({
        field: "message", // KQL searches across all fields
        operator: "contains" as const,
        values: [value],
      });
    }

    // Also check for OR conditions on the same line
    const orEqualityRegex = /OR\s+([^\s]+)\s*==\s*"([^"]+)"/g;
    while ((match = orEqualityRegex.exec(query)) !== null) {
      const [, field, value] = match;
      console.log("Found OR equality filter:", field, "==", value);
      filters.push({
        field: field,
        operator: "equals" as const,
        values: [value],
      });
    }

    console.log("Total filters extracted:", filters);
    console.log("LIMIT value:", limitValue);
    console.log("Aggregation:", aggregation);
    // Update highlight term
    setCurrentHighlightTerm(foundSearchTerm);
    return { filters, limit: limitValue, aggregation };
  };

  // Handle accepting the generated query
  const handleAcceptQuery = () => {
    console.log("handleAcceptQuery: Setting editor query to:", generatedQuery);
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
    console.log(
      "About to call handleSearchRefreshWithQuery with generatedQuery:",
      generatedQuery
    );
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
    if (!editedPrompt.trim()) return;

    setIsEditingPrompt(false);
    setIsAIProcessing(true);

    try {
      // Simulate AI processing delay
      await simulateAIProcessing(1500);

      // Find matching query or use fallback
      const matchingMapping = findMatchingQuery(editedPrompt);
      const queryMapping = matchingMapping || getFallbackQuery(editedPrompt);

      console.log("Regenerated query:", queryMapping.query);

      // Update with new query and prompt
      setGeneratedQuery(queryMapping.query);
      setOriginalPrompt(editedPrompt);
      setEditedPrompt("");
    } catch (error) {
      console.error("Error processing edited prompt:", error);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Handle canceling the edit
  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
    setEditedPrompt("");
  };

  // Combined function for search and refresh (with optional query parameter)
  const handleSearchRefreshWithQuery = (queryToUse?: string) => {
    const queryString = queryToUse || editorQuery;
    console.log("handleSearchRefreshWithQuery called with query:", queryString);
    // Update last executed query
    setLastExecutedQuery(queryString);
    handleUpdateRefresh();

    // If we have an ES|QL query, parse it for filters
    if (queryString.trim() && queryString.includes("FROM")) {
      console.log("Detected ES|QL query, parsing for filters...");

      // Parse simple filters, limit, and aggregation from the ES|QL query
      const { filters: esqlFilters, limit, aggregation } = parseSimpleFilters(queryString);
      console.log("Extracted filters:", esqlFilters);
      console.log("Extracted limit:", limit);
      console.log("Extracted aggregation:", aggregation);

      // Apply the filters by temporarily setting them in the data loading context
      // Note: This is a prototype approach - in a real system you'd have a proper ES|QL engine
      if (esqlFilters.length > 0 || limit !== null || aggregation) {
        console.log("Found filters, limit, or aggregation, using ES|QL filter path");
        // Store current search term and clear it so ES|QL filters take precedence
        const originalSearchTerm = searchQuery;
        setDraftSearchTerm(""); // Clear search term when using ES|QL
        setAppliedSearchTerm("");

        // Load data with the parsed filters, limit, and aggregation
        loadDataWithFilters(esqlFilters, limit, aggregation);
        return;
      } else {
        console.log("No filters found, falling back to regular data loading");
      }
    } else {
      console.log("No ES|QL query detected, using regular search logic");
    }

    // Fallback to regular search logic
    setDraftSearchTerm(searchQuery);
    setDraftSelectedIndex(selectedIndex);
    setAppliedSearchTerm(searchQuery);
    setAppliedSelectedIndex(selectedIndex);
    loadData();
  };

  // Combined function for search and refresh (uses current editor state)
  const handleSearchRefresh = () => {
    // Update last executed query to current editor query
    setLastExecutedQuery(editorQuery);
    handleSearchRefreshWithQuery();
  };

  // Helper function to load data with specific filters and optional limit and aggregation
  const loadDataWithFilters = async (filters: any[], limit?: number | null, aggregation?: any) => {
    console.log("Loading data with ES|QL filters:", filters);
    console.log("Loading data with limit:", limit);
    console.log("Loading data with aggregation:", aggregation);
    setIsLoading(true);
    try {
      const dataGenerator = getDataGenerator(selectedIndex);

      // Calculate time range
      const fromDate = dateMath.parse(appliedDateRange.start);
      const toDate = dateMath.parse(appliedDateRange.end, { roundUp: true });
      const timeRange =
        fromDate && toDate
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
        console.log("Performing aggregation:", aggregation);
        const { resultName, operation, groupByField } = aggregation;
        
        // Group by field and count
        const groups = new Map<string, number>();
        docs.forEach((doc) => {
          // Get the field value, handling nested fields
          const fieldValue = doc[groupByField] || 
                            (groupByField.includes('.') ? 
                              groupByField.split('.').reduce((obj: any, key: string) => obj?.[key], doc) : 
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

        console.log(`Aggregated ${docs.length} documents into ${finalDocs.length} groups`);
        console.log("Aggregated sample:", finalDocs.slice(0, 3));

        // Update selected fields to show only aggregation result fields
        setSelectedFields({
          [resultName]: true,
          [groupByField]: true,
        });
      } else {
        // No aggregation - reset to default fields for raw documents
        setSelectedFields({ "@timestamp": true });
        
        if (limit !== null && limit !== undefined) {
          // Apply LIMIT if specified (only when not aggregating)
          finalDocs = docs.slice(0, limit);
          console.log(
            `Applied LIMIT ${limit}: reduced from ${docs.length} to ${finalDocs.length} documents`
          );
        }
      }

      // Let's also inspect the first few docs to see their structure
      if (finalDocs.length > 0) {
        console.log("Sample document structure:", finalDocs[0]);
      }

      setDocuments(finalDocs);
    } catch (error) {
      console.error("Error loading data with filters:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert UI state to query string
  const convertUIToQuery = () => {
    return `FROM ${selectedIndex} | LIMIT 10`;
  };

  // Get available fields based on selected index and documents
  const availableFields = useMemo(() => {
    if (!documents.length) return [];
    const dataGenerator = getDataGenerator(selectedIndex);
    const fields = dataGenerator.getAvailableFields(documents);
    console.log("Available fields:", fields);
    console.log("Selected fields:", selectedFields);
    return fields;
  }, [documents, selectedIndex, selectedFields]);

  // Toggle field selection
  const toggleFieldSelection = useCallback((fieldName: string) => {
    setSelectedFields((prevFields) => ({
      ...prevFields,
      [fieldName]: !prevFields[fieldName],
    }));
  }, []);

  // Calculate filtered field counts
  const filteredSelectedFields = useMemo(() => {
    return Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([fieldName]) => fieldName)
      .filter((fieldName) =>
        fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase())
      );
  }, [selectedFields, fieldSearchTerm]);

  const filteredAvailableFields = useMemo(() => {
    return availableFields
      .filter((fieldName) => !selectedFields[fieldName])
      .filter((fieldName) =>
        fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase())
      );
  }, [availableFields, selectedFields, fieldSearchTerm]);

  // Handle explaining selected text
  const handleExplainText = useCallback((selectedText: string) => {
    console.log("Explaining selected text:", selectedText);
    setAssistantInitialMessage(
      `Please explain this code/text: "${selectedText}"`
    );
    setIsAssistantOpen(true);
  }, []);

  // Debug log for render
  console.log("Rendering component, isPromptVisible:", isPromptVisible);

  return (
    <div style={{ position: "relative" }}>
      <PageHeader />

      {/* Text Selection Explainer */}
      {/* <TextSelectionExplainer onExplain={handleExplainText} /> */}

      {/* Search bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gridTemplateRows: "auto auto",
          gap: "8px",
          padding: "8px 8px 0 8px",
          width: "100%",
          alignItems: "start",
          borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        }}
      >
        <div style={{ gridColumn: "1", gridRow: "1" }}>
          {/* AI Prompt Bar */}
          <VisorFixedBar 
            onSubmit={(prompt, language, dataSource) => handleVisorSubmit(prompt, language, dataSource)}
            currentDataSource={currentDataSource}
          />
          
          {/* Old Dual-Mode AI Input Box with Gradient Border */}
          {false && <div
            style={{
              background: isDarkMode
                ? "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)"
                : "linear-gradient(107.9deg, #0B64DD 21.85%, #FF27A5 98.82%)",
              borderRadius: "6px",
              padding: "1px",
              height: "32px",
              width: "600px",
            }}
          >
            <div
              style={{
                backgroundColor: euiTheme.colors.emptyShade,
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                padding: "0",
                height: "30px",
                width: "100%",
              }}
            >
              <style>
                {`
                .ai-prompt-input::placeholder {
                  color: ${euiTheme.colors.textSubdued};
                  opacity: 1;
                }
                
                .ai-prompt-input::-webkit-input-placeholder {
                  color: ${euiTheme.colors.textSubdued};
                }
                
                .ai-prompt-input::-moz-placeholder {
                  color: ${euiTheme.colors.textSubdued};
                  opacity: 1;
                }
                
                .ai-prompt-input:-ms-input-placeholder {
                  color: ${euiTheme.colors.textSubdued};
                }
                
                .gradient-sparkles-icon svg path {
                  fill: url(#sparkles-gradient-v13) !important;
                }
                
                /* Remove all EUI popover default styling */
                .mode-popover-panel {
                  border: 1px solid ${
                    euiTheme.colors.borderBaseSubdued
                  } !important;
                  box-shadow: ${
                    isDarkMode
                      ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                      : "0 4px 16px rgba(0, 0, 0, 0.15)"
                  } !important;
                  outline: none !important;
                }
                
                .mode-popover-panel .euiPanel {
                  border: none !important;
                  box-shadow: none !important;
                  outline: none !important;
                }
                
                /* Target all possible EUI popover styling */
                .mode-popover-panel .euiPopover__panel {
                  border: 1px solid ${
                    euiTheme.colors.borderBaseSubdued
                  } !important;
                  box-shadow: ${
                    isDarkMode
                      ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                      : "0 4px 16px rgba(0, 0, 0, 0.15)"
                  } !important;
                  outline: none !important;
                }
                
                /* Remove focus/active states */
                .mode-popover-panel *:focus,
                .mode-popover-panel *:active,
                .mode-popover-panel *:focus-visible {
                  outline: none !important;
                  border-color: ${euiTheme.colors.borderBaseSubdued} !important;
                  box-shadow: ${
                    isDarkMode
                      ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                      : "0 4px 16px rgba(0, 0, 0, 0.15)"
                  } !important;
                }
              `}
              </style>
              {/* Mode Toggle Popover - Left side */}
              <EuiPopover
                button={
                  <div
                    style={{
                      padding: "4px 8px",
                      display: "flex",
                      alignItems: "center",
                      borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                      cursor: "pointer",
                      outline: "none",
                      border: "none",
                      background: "transparent",
                    }}
                    onClick={() => setIsModePopoverOpen(!isModePopoverOpen)}
                  >
                    {/* Hidden SVG for gradient definition */}
                    <svg width="0" height="0" style={{ position: "absolute" }}>
                      <defs>
                        <linearGradient
                          id="sparkles-gradient-v13"
                          x1={isDarkMode ? "18.35%" : "21.85%"}
                          y1="0%"
                          x2={isDarkMode ? "112.9%" : "98.82%"}
                          y2="100%"
                          gradientUnits="objectBoundingBox"
                        >
                          {isDarkMode ? (
                            <>
                              <stop offset="18.35%" stopColor="#61A2FF" />
                              <stop offset="51.95%" stopColor="#8A82E8" />
                              <stop offset="88.68%" stopColor="#D846BB" />
                              <stop offset="112.9%" stopColor="#FF27A5" />
                            </>
                          ) : (
                            <>
                              <stop offset="21.85%" stopColor="#0B64DD" />
                              <stop offset="98.82%" stopColor="#FF27A5" />
                            </>
                          )}
                        </linearGradient>
                      </defs>
                    </svg>

                    {inputMode === "natural" ? (
                      <div className="gradient-sparkles-icon">
                        <EuiIcon type="sparkles" size="m" />
                      </div>
                    ) : (
                      <EuiIcon
                        type="search"
                        size="s"
                        color={euiTheme.colors.primary}
                      />
                    )}

                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "14px",
                        color: euiTheme.colors.primary,
                        fontWeight: "500",
                      }}
                    >
                      {inputMode === "natural" ? "Natural language" : "Search"}
                    </span>

                    <EuiIcon
                      type="arrowDown"
                      size="s"
                      style={{ marginLeft: "4px" }}
                      color={euiTheme.colors.textSubdued}
                    />
                  </div>
                }
                isOpen={isModePopoverOpen}
                closePopover={() => setIsModePopoverOpen(false)}
                panelPaddingSize="none"
                anchorPosition="downCenter"
                panelClassName="mode-popover-panel"
                ownFocus={false}
              >
                <div style={{ minWidth: "200px" }}>
                  {/* Natural Language Option */}
                  <div
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor:
                        inputMode === "natural"
                          ? euiTheme.colors.backgroundBasePlain
                          : "transparent",
                    }}
                    onClick={() => {
                      setInputMode("natural");
                      setIsModePopoverOpen(false);
                      // Clear success state and input when switching modes
                      setQueryGenerated(false);
                      setPromptValue("");
                    }}
                    onMouseEnter={(e) => {
                      if (inputMode !== "natural") {
                        e.currentTarget.style.backgroundColor =
                          euiTheme.colors.backgroundBaseSubdued;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (inputMode !== "natural") {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {inputMode === "natural" && (
                        <EuiIcon
                          type="check"
                          size="s"
                          color={euiTheme.colors.primary}
                        />
                      )}
                    </div>
                    <div className="gradient-sparkles-icon">
                      <EuiIcon type="sparkles" size="s" />
                    </div>
                    <span
                      style={{ fontSize: "14px", color: euiTheme.colors.text }}
                    >
                      Natural language
                    </span>
                  </div>

                  {/* Keyword Search Option */}
                  <div
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor:
                        inputMode === "keyword"
                          ? euiTheme.colors.backgroundBasePlain
                          : "transparent",
                    }}
                    onClick={() => {
                      setInputMode("keyword");
                      setIsModePopoverOpen(false);
                      // Clear success state and input when switching modes
                      setQueryGenerated(false);
                      setPromptValue("");
                    }}
                    onMouseEnter={(e) => {
                      if (inputMode !== "keyword") {
                        e.currentTarget.style.backgroundColor =
                          euiTheme.colors.backgroundBaseSubdued;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (inputMode !== "keyword") {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {inputMode === "keyword" && (
                        <EuiIcon
                          type="check"
                          size="s"
                          color={euiTheme.colors.primary}
                        />
                      )}
                    </div>
                    <EuiIcon
                      type="search"
                      size="s"
                      color={euiTheme.colors.textSubdued}
                    />
                    <span
                      style={{ fontSize: "14px", color: euiTheme.colors.text }}
                    >
                      Search
                    </span>
                  </div>
                </div>
              </EuiPopover>

              {/* Custom input field with generating state */}
              {isAIProcessing ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    color: euiTheme.colors.textSubdued,
                    padding: "8px",
                    fontFamily:
                      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
                  }}
                >
                  Generating
                  <span
                    style={{
                      display: "inline-block",
                      width: "20px",
                      textAlign: "left",
                    }}
                  >
                    {animatedDots}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  className="ai-prompt-input"
                  placeholder={
                    inputMode === "natural"
                      ? "Generate ES|QL queries using natural language"
                      : "Search for text. E.g. 'timed out, denied'"
                  }
                  value={promptValue}
                  onChange={(e) => {
                    setPromptValue(e.target.value);
                    // Reset success state when user starts typing
                    if (queryGenerated) {
                      setQueryGenerated(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePromptSubmit(promptValue);
                    }
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "14px",
                    color: euiTheme.colors.text,
                    padding: "8px 8px",
                    fontFamily:
                      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
                    fontWeight: "400",
                  }}
                />
              )}

              {/* Submit button - always visible on the right */}
              <div
                style={{
                  padding: "8px 4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isAIProcessing ? (
                  <EuiButtonIcon
                    iconType="stopFilled"
                    onClick={() => {
                      // Handle pause/stop functionality if needed
                    }}
                    size="s"
                    color="primary"
                    aria-label="Pause generation"
                  />
                ) : (
                  <button
                    onClick={() => {
                      if (promptValue.trim()) {
                        handlePromptSubmit(promptValue);
                      }
                    }}
                    disabled={!promptValue.trim()}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: promptValue.trim() ? "pointer" : "not-allowed",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: queryGenerated
                        ? euiTheme.colors.successText
                        : promptValue.trim()
                        ? euiTheme.colors.primary
                        : euiTheme.colors.textSubdued,
                      opacity: promptValue.trim() ? 1 : 0.5,
                    }}
                    aria-label={
                      queryGenerated ? "Query generated" : "Submit prompt"
                    }
                  >
                    {queryGenerated ? (
                      <EuiIcon type="checkInCircleFilled" size="m" />
                    ) : (
                      <PaperPlaneRight weight="fill" size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>}
        </div>

        <div
          style={{
            gridColumn: "3",
            gridRow: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiSuperDatePicker
                start={draftDateRange.start}
                end={draftDateRange.end}
                onTimeChange={({ start, end }) =>
                  setDraftDateRange({ start, end })
                }
                showUpdateButton={false}
                width="auto"
                isAutoRefreshOnly={false}
                compressed
                commonlyUsedRanges={[
                  { start: "now/d", end: "now/d", label: "Today" },
                  { start: "now/w", end: "now/w", label: "This week" },
                  { start: "now-15m", end: "now", label: "Last 15 minutes" },
                  { start: "now-30m", end: "now", label: "Last 30 minutes" },
                  { start: "now-1h", end: "now", label: "Last 1 hour" },
                  { start: "now-24h", end: "now", label: "Last 24 hours" },
                  { start: "now-7d", end: "now", label: "Last 7 days" },
                  { start: "now-30d", end: "now", label: "Last 30 days" },
                ]}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                color="primary"
                onClick={handleSearchRefresh}
                isLoading={isLoading}
                fill={true}
              >
                Search
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </div>

      {/* Main Content with Resizable Layout */}
      <EuiResizableContainer
        style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}
        direction="vertical"
      >
        {(EuiResizablePanel, EuiResizableButton) => (
          <>
            {/* Code Editor - Top Panel */}
            <EuiResizablePanel
              initialSize={25}
              minSize="120px"
              paddingSize="none"
            >
              <div
                style={{
                  height: "100%",
                  padding: "0",
                  margin: "0",
                }}
              >
                <CodeEditor
                  value={editorQuery}
                  onChange={setEditorQuery}
                  height="100%"
                  showFooter={true}
                  onSubmit={handleSearchRefresh}
                  editMarkerStyle="gutter"
                  editorRef={codeEditorRef}
                />
              </div>
            </EuiResizablePanel>

            <EuiResizableButton indicator="border" />

            {/* Data Content - Bottom Panel */}
            <EuiResizablePanel initialSize={75} paddingSize="none">
              <EuiPage paddingSize="none" style={{ height: "100%" }}>
                <EuiPageBody paddingSize="none" style={{ height: "100%" }}>
                  {!documents.length && !isLoading ? (
                    <EuiCallOut
                      title="No data available"
                      color="primary"
                      iconType="search"
                    >
                      <p>Click the Update button to find documents.</p>
                    </EuiCallOut>
                  ) : (
                    <EuiResizableContainer style={{ height: "100%" }}>
                      {(EuiResizablePanelInner, EuiResizableButtonInner) => (
                        <>
                          {/* Left sidebar with available fields */}
                          <EuiResizablePanelInner
                            initialSize={20}
                            minSize="200px"
                            paddingSize="s"
                          >
                            <FieldList
                              availableFields={availableFields}
                              selectedFields={selectedFields}
                              fieldTypes={{}}
                              onFieldToggle={toggleFieldSelection}
                              getFieldTypeIcon={() => "tokenString"}
                              filteredAvailableFieldsCount={
                                filteredAvailableFields.length
                              }
                              filteredSelectedFieldsCount={
                                filteredSelectedFields.length
                              }
                            />
                          </EuiResizablePanelInner>

                          <EuiResizableButtonInner indicator="border" />

                          {/* Main content area with histogram and data grid */}
                          <EuiResizablePanelInner
                            initialSize={80}
                            paddingSize="none"
                          >
                            <div
                              style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <EuiResizableContainer
                                style={{ height: "100%" }}
                                direction="vertical"
                              >
                                {(
                                  EuiResizablePanelDeep,
                                  EuiResizableButtonDeep
                                ) => (
                                  <>
                                    {/* Histogram chart - top panel */}
                                    <EuiResizablePanelDeep
                                      initialSize={30}
                                      minSize="150px"
                                      paddingSize="none"
                                    >
                                      <EuiPanel
                                        paddingSize="none"
                                        hasShadow={false}
                                        hasBorder={false}
                                        style={{ height: "100%" }}
                                      >
                                        {isLoading ? (
                                          <div
                                            style={{
                                              height: "100%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <EuiLoadingSpinner size="xl" />
                                          </div>
                                        ) : (
                                          <DocumentHistogram
                                            logs={documents}
                                            field={histogramField}
                                            colorMode={colorMode}
                                            dateRange={appliedDateRange}
                                          />
                                        )}
                                      </EuiPanel>
                                    </EuiResizablePanelDeep>

                                    <EuiResizableButtonDeep indicator="border" />

                                    {/* Data grid - bottom panel */}
                                    <EuiResizablePanelDeep
                                      initialSize={70}
                                      paddingSize="none"
                                    >
                                      <DocumentDataGrid
                                        documents={documents}
                                        selectedFields={selectedFields}
                                        searchTerm={
                                          currentHighlightTerm ||
                                          appliedSearchTerm
                                        }
                                        dateRange={
                                          timeRange.from && timeRange.to
                                            ? timeRange
                                            : undefined
                                        }
                                        appliedAggregations={[]}
                                        applyAggregationsToGrid={false}
                                        isCodeEditorMode={true}
                                        isLoading={isLoading}
                                        height="100%"
                                      />
                                    </EuiResizablePanelDeep>
                                  </>
                                )}
                              </EuiResizableContainer>
                            </div>
                          </EuiResizablePanelInner>
                        </>
                      )}
                    </EuiResizableContainer>
                  )}
                </EuiPageBody>
              </EuiPage>
            </EuiResizablePanel>
          </>
        )}
      </EuiResizableContainer>

      {/* Assistant Flyout */}
      <AssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          setAssistantInitialMessage("");
        }}
        initialMessage={assistantInitialMessage}
        autoSubmit={true}
      />
    </div>
  );
};

export default SimpleESQL;
