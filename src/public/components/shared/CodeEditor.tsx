import { EuiButtonEmpty, useEuiTheme } from "@elastic/eui";
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { createRoot, Root } from "react-dom/client";
import { createVisorWidget } from "./VisorWidget";
import { EditorFooter } from "./EditorFooter";
import { VisorHex } from "./VisorHex";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment, StateField, StateEffect } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { lineNumbers } from "@codemirror/view";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { startCompletion } from "@codemirror/autocomplete";
import { bracketMatching } from "@codemirror/language";
import { placeholder as placeholderExtension } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import {
  addGeneratedBlockEffect,
  removeGeneratedBlockEffect,
  markBlockEditedEffect,
  generatedCommentsState,
  setCommentHintEffect,
  commentHintState,
  generateESQLFromPrompt,
  createHandleGenerate,
  createCommentHintPlugin,
  createCommentHintDebounceListener,
  createCommentEditDetectionListener,
  createCommentEditDetectionListenerGutter,
  createEditMarkerGutter,
  type GeneratedBlock,
  isRegenerationAnnotation,
} from "./commentGeneration";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showFooter?: boolean;
  compressed?: boolean;
  onSubmit?: (query: string) => void;
  /** 
   * How to display edit markers for generated code:
   * - 'inline': Shows (*) for comment edits and [outdated] for code edits (default)
   * - 'gutter': Shows colored indicators in the gutter
   */
  editMarkerStyle?: 'inline' | 'gutter';
  /**
   * Ref to expose editor methods for external control
   */
  editorRef?: React.RefObject<{
    view: EditorView | null;
    trackGeneratedBlock: (commentLine: number, codeLines: number[]) => void;
  }>;
  /**
   * Display mode for the Cmd+K visor widget:
   * - 'multiLine': Two-row layout (default)
   * - 'singleLine': Single-row layout
   */
  visorDisplay?: 'multiLine' | 'singleLine';
  /**
   * Callback when user edits generated code
   * Called when user types in a line that was generated from a comment
   */
  onEditGeneratedCode?: () => void;
  /**
   * Whether to show the "(cmd + k to generate)" hint on empty lines
   * Defaults to true
   */
  showEmptyLineHint?: boolean;
  /**
   * Callback to toggle VisorHex visibility (Cmd+Shift+K)
   * If provided, VisorHex is controlled externally
   * @deprecated Use enableVisor prop instead
   */
  onToggleVisorHex?: () => void;
  /**
   * Callback for the "Quick edit" button in the footer
   * If provided, shows the "Quick edit" button in the footer
   * @deprecated Use enableVisor prop instead - Quick edit will be shown automatically
   */
  onQuickEdit?: () => void;
  /**
   * Enable built-in VisorHex support
   * When enabled, VisorHex will be rendered within CodeEditor and Quick edit button will be shown in footer
   */
  enableVisor?: boolean;
  /**
   * Callback when VisorHex submits a prompt
   * Required when enableVisor is true
   */
  onVisorSubmit?: (prompt: string, language: string, dataSource: string) => void;
  /**
   * Current data source for VisorHex
   * Used to determine which data source to use when generating queries
   */
  visorCurrentDataSource?: string;
  /**
   * Whether VisorHex is currently generating a query
   * Used to show generating state in VisorHex
   */
  visorIsGenerating?: boolean;
  /**
   * Whether to use gradient styling for the Quick search button in footer
   * Defaults to true
   */
  useGradient?: boolean;
  /**
   * Whether to show a search icon instead of the keyboard shortcut in footer
   * Defaults to false
   */
  showIcon?: boolean;
}

// Define visor state management outside component for stable references
const toggleVisorEffect = StateEffect.define<{ pos: number; open: boolean }>();

const visorState = StateField.define<{ open: boolean; pos: number }>({
  create() {
    return { open: false, pos: 0 };
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(toggleVisorEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});


// Store for visor callbacks and theme - will be set by component
const visorConfig = {
  onClose: () => {},
  onSubmit: (prompt: string, language: string) => {},
  createWidget: (onClose: () => void, onSubmit: (prompt: string, language: string) => void) => {
    class EmptyVisorWidget extends WidgetType {
      toDOM() {
        return document.createElement("div");
      }
    }
    return EmptyVisorWidget;
  },
};

// Define visor decoration field outside component
const visorDecorationField = StateField.define<DecorationSet>({
  create(state) {
    return Decoration.none;
  },
  update(decorations, tr) {
    const visorStateValue = tr.state.field(visorState);
    
    if (visorStateValue.open) {
      const VisorWidgetClass = visorConfig.createWidget(
        visorConfig.onClose,
        visorConfig.onSubmit
      );
      // Get the line at the cursor position
      const line = tr.state.doc.lineAt(visorStateValue.pos);
      // Place the widget at the start of the line for proper block behavior
      // This ensures it appears before/above the current line
      const widget = Decoration.widget({
        widget: new VisorWidgetClass(),
        block: true,
        side: -1, // Place before the position
      });
      return Decoration.set([widget.range(line.from)]);
    }
    
    return Decoration.none;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder,
  height,
  showFooter = false,
  compressed = false,
  onSubmit,
  editMarkerStyle = 'inline',
  editorRef: externalEditorRef,
  visorDisplay = 'multiLine',
  onEditGeneratedCode,
  showEmptyLineHint = true,
  onToggleVisorHex,
  onQuickEdit,
  enableVisor = false,
  onVisorSubmit,
  visorCurrentDataSource = "logs-*",
  visorIsGenerating = false,
  useGradient = true,
  showIcon = false,
}) => {
  console.log("[DEBUG] CodeEditor render", { valueLength: value?.length });
  const euiThemeHook = useEuiTheme();
  const { colorMode, euiTheme } = euiThemeHook;
  const isDarkMode = colorMode === "DARK";
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [visorOpen, setVisorOpen] = useState(false);
  const [visorPosition, setVisorPosition] = useState(0);
  
  // VisorHex state - managed internally when enableVisor is true
  const [visorHexOpen, setVisorHexOpen] = useState(false);
  const [visorHexClosing, setVisorHexClosing] = useState(false);
  const visorHexOpenRef = useRef(false);
  
  const commentEditTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editedBlocksRef = useRef<Map<number, 'comment' | 'code'>>(new Map());
  const commentHintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledEditCallbackRef = useRef<Set<number>>(new Set());

  // Track generated block method for external use
  const trackGeneratedBlock = useCallback((commentLine: number, codeLines: number[], originalCommentText?: string) => {
    console.log("[CodeEditor] External tracking request:", { commentLine, codeLines, originalCommentText });
    if (editorViewRef.current) {
      // Get the original comment text if not provided
      const commentText = originalCommentText || (() => {
        try {
          const line = editorViewRef.current!.state.doc.line(commentLine);
          return line.text;
        } catch {
          return '';
        }
      })();
      
      editorViewRef.current.dispatch({
        effects: [
          addGeneratedBlockEffect.of({
            commentLine,
            codeLines,
            originalCommentText: commentText,
          })
        ],
      });
      console.log("[CodeEditor] Tracking effect dispatched. Current tracked blocks:");
      const trackedBlocks = editorViewRef.current.state.field(generatedCommentsState);
      console.log(Array.from(trackedBlocks.entries()));
    } else {
      console.warn("[CodeEditor] Cannot track - no editor view ref!");
    }
  }, []);

  // VisorHex handlers - only used when enableVisor is true
  useEffect(() => {
    visorHexOpenRef.current = visorHexOpen;
  }, [visorHexOpen]);

  const handleCloseVisorHex = useCallback(() => {
    if (!enableVisor) return;
    if (!visorHexOpenRef.current) return;
    setVisorHexClosing(true);
    setTimeout(() => {
      setVisorHexOpen(false);
      setVisorHexClosing(false);
      visorHexOpenRef.current = false;
    }, 200);
  }, [enableVisor]);

  const handleToggleVisorHex = useCallback(() => {
    if (!enableVisor) return;
    if (visorHexOpenRef.current) {
      handleCloseVisorHex();
    } else {
      setVisorHexOpen(true);
      visorHexOpenRef.current = true;
    }
  }, [enableVisor, handleCloseVisorHex]);

  // Global keyboard shortcut to toggle VisorHex (Cmd+Shift+K) - only when enableVisor is true
  useEffect(() => {
    if (!enableVisor) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleToggleVisorHex();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enableVisor, handleToggleVisorHex]);

  // Expose editor ref for external control (run once on mount)
  useEffect(() => {
    if (externalEditorRef) {
      (externalEditorRef as React.MutableRefObject<any>).current = {
        get view() {
          return editorViewRef.current;
        },
        trackGeneratedBlock,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Create ESQL-specific completions
  const esqlCompletions = useMemo(() => {
    // ES|QL Command completions
    const esqlCommands = [
      {
        label: "FROM",
        type: "keyword",
        detail: "Retrieves data from one or more data sources",
        info: "FROM index-pattern\n\nRetrieves data from the specified data source. This is typically the first command in an ES|QL query.",
        sortOrder: 1, // Highest priority
      },
      {
        label: "ROW",
        type: "keyword",
        detail: "Create a single row of data",
        info: "ROW field = value\n\nCreates a single row with the specified field-value pairs.",
        sortOrder: 2,
      },
      {
        label: "SHOW",
        type: "keyword",
        detail: "Show information about the deployment",
        info: "SHOW INFO | FUNCTIONS\n\nDisplays information about available functions or deployment details.",
        sortOrder: 3,
      },
      {
        label: "Search all fields",
        type: "template",
        detail: "Search across all fields using a query string",
        info: 'FROM logs-* | WHERE KQL("""your search term""")\n\nSearches for the specified term across all fields in your data.',
        sortOrder: 4,
      },
      {
        label: "Aggregate with STATS",
        type: "template",
        detail: "Group and aggregate your data",
        info: "FROM logs-* | STATS count() BY field\n\nGroups data and calculates aggregations like count, sum, avg, etc.",
        sortOrder: 5,
      },
      {
        label: "Calculate the event rate",
        type: "template",
        detail: "Calculate events per time period",
        info: 'FROM logs-* | STATS event_rate = count() BY bucket(@timestamp, "1h")\n\nCalculates the rate of events over time intervals.',
        sortOrder: 6,
      },
      {
        label: "Create 5 minute time buckets with EVAL",
        type: "template",
        detail: "Group data into 5-minute intervals",
        info: 'FROM logs-* | EVAL time_bucket = bucket(@timestamp, "5m") | STATS count() BY time_bucket\n\nCreates 5-minute time buckets for temporal analysis.',
        sortOrder: 7,
      },
      {
        label: "Create a conditional with CASE",
        type: "template",
        detail: "Add conditional logic to categorize data",
        info: 'FROM logs-* | EVAL category = CASE(log.level == "error", "Error", log.level == "warn", "Warning", "Info")\n\nUses CASE to create conditional fields based on data values.',
        sortOrder: 8,
      },
      {
        label: "Create a date histogram",
        type: "template",
        detail: "Analyze data distribution over time",
        info: 'FROM logs-* | STATS count() BY bucket(@timestamp, "1h") | SORT @timestamp\n\nCreates a histogram showing data distribution over time periods.',
        sortOrder: 9,
      },
      {
        label: "Detect change points",
        type: "template",
        detail: "Identify significant changes in your data",
        info: 'FROM logs-* | STATS count() BY bucket(@timestamp, "1h") | EVAL change = count - LAG(count, 1)\n\nDetects significant changes or anomalies in your time series data.',
        sortOrder: 10,
      },
      {
        label: "Identify patterns",
        type: "template",
        detail: "Find recurring patterns in your data",
        info: "FROM logs-* | STATS count() BY message | WHERE count > 10 | SORT count DESC\n\nIdentifies the most common patterns or messages in your data.",
        sortOrder: 11,
      },
      {
        label: "Sort by time",
        type: "template",
        detail: "Order your results chronologically",
        info: "FROM logs-* | SORT @timestamp DESC\n\nSorts your results by timestamp, showing the most recent events first.",
        sortOrder: 12,
      },
    ];

    // Next step suggestions after selecting a data source
    const nextStepSuggestions = [
      {
        label: "Search...",
        type: "template",
        info: '| WHERE KQL("""your search term""")\n\nSearches for the specified term across all fields in your data.',
        sortOrder: 1,
        applyTemplate: '| WHERE KQL("""""")',
        cursorOffset: -4, // Position cursor 4 characters from the end (between triple quotes)
      },
      {
        label: "Aggregate with STATS",
        type: "template",
        info: "| STATS count() BY field\n\nGroups data and calculates aggregations like count, sum, avg, etc.",
        sortOrder: 2,
      },
      {
        label: "Calculate the event rate",
        type: "template",
        info: '| STATS event_rate = count() BY bucket(@timestamp, "1h")\n\nCalculates the rate of events over time intervals.',
        sortOrder: 3,
      },
      {
        label: "Create 5 minute time buckets with EVAL",
        type: "template",
        info: '| EVAL time_bucket = bucket(@timestamp, "5m") | STATS count() BY time_bucket\n\nCreates 5-minute time buckets for temporal analysis.',
        sortOrder: 4,
      },
      {
        label: "Create a conditional with CASE",
        type: "template",
        info: '| EVAL category = CASE(log.level == "error", "Error", log.level == "warn", "Warning", "Info")\n\nUses CASE to create conditional fields based on data values.',
        sortOrder: 5,
      },
      {
        label: "Create a date histogram",
        type: "template",
        info: '| STATS count() BY bucket(@timestamp, "1h") | SORT @timestamp\n\nCreates a histogram showing data distribution over time periods.',
        sortOrder: 6,
      },
      {
        label: "Detect change points",
        type: "template",
        info: '| STATS count() BY bucket(@timestamp, "1h") | EVAL change = count - LAG(count, 1)\n\nDetects significant changes or anomalies in your time series data.',
        sortOrder: 7,
      },
      {
        label: "Identify patterns",
        type: "template",
        info: "| STATS count() BY message | WHERE count > 10 | SORT count DESC\n\nIdentifies the most common patterns or messages in your data.",
        sortOrder: 8,
      },
      {
        label: "Sort by time",
        type: "template",
        info: "| SORT @timestamp DESC\n\nSorts your results by timestamp, showing the most recent events first.",
        sortOrder: 9,
      },
    ];

    // Index patterns
    const indexPatterns = [
      {
        label: "logs-*",
        type: "property",
        info: "Standard logs index pattern that matches all log indices",
      },
      {
        label: "logs-archived-audit-default",
        type: "property",
        info: "Archived audit log entries",
      },
      {
        label: "logs-elasticsearch.audit-default",
        type: "property",
        info: "Elasticsearch audit log entries",
      },
      {
        label: "logs-docker.container_logs-default",
        type: "property",
        info: "Docker container log entries",
      },
      {
        label: "logs-system.syslog-default",
        type: "property",
        info: "System syslog log entries",
      },
      {
        label: "logs-elastic_agent-default",
        type: "property",
        info: "Elastic Agent log entries",
      },
      {
        label: "logs-generic-default",
        type: "property",
        info: "Generic log entries",
      },
    ];

    // ES|QL Functions
    const esqlFunctions = [
      {
        label: "KQL",
        type: "function",
        detail: "Kibana Query Language function",
        info: 'KQL("""query string""")\n\nPerforms a KQL search across all fields using Kibana Query Language syntax.',
      },
      {
        label: "COUNT",
        type: "function",
        detail: "Count rows or values",
        info: "COUNT(field)\n\nCounts the number of rows or non-null values.",
      },
      {
        label: "SUM",
        type: "function",
        detail: "Sum numeric values",
        info: "SUM(field)\n\nCalculates the sum of numeric values.",
      },
      {
        label: "AVG",
        type: "function",
        detail: "Calculate average",
        info: "AVG(field)\n\nCalculates the average of numeric values.",
      },
      {
        label: "MAX",
        type: "function",
        detail: "Find maximum value",
        info: "MAX(field)\n\nFinds the maximum value.",
      },
      {
        label: "MIN",
        type: "function",
        detail: "Find minimum value",
        info: "MIN(field)\n\nFinds the minimum value.",
      },
    ];

    // Field names and metadata
    const commonFields = [
      {
        label: "@timestamp",
        type: "property",
        detail: "Event timestamp",
        info: "The timestamp when the event occurred",
      },
      {
        label: "message",
        type: "property",
        detail: "Log message content",
        info: "The main log message content",
      },
      {
        label: "log.level",
        type: "property",
        detail: "Log level",
        info: "The severity level of the log entry (error, warn, info, debug)",
      },
      {
        label: "host.name",
        type: "property",
        detail: "Host name",
        info: "The name of the host where the event originated",
      },
      {
        label: "agent.name",
        type: "property",
        detail: "Agent name",
        info: "The name of the agent that collected the data",
      },
      {
        label: "agent.type",
        type: "property",
        detail: "Agent type",
        info: "The type of agent that collected the data",
      },
    ];

    // Custom completion function
    function esqlCompletion(
      context: CompletionContext
    ): CompletionResult | null {
      // More flexible word matching - include partial words and empty strings
      const word = context.matchBefore(/\w*/) || context.matchBefore(/^/);

      const line = context.state.doc.lineAt(context.pos);
      const lineText = line.text;
      const beforeCursor = lineText.slice(0, context.pos - line.from);

      console.log("Autocomplete context:", {
        word: word?.text || "",
        beforeCursor,
        lineText,
        pos: context.pos,
        hasWord: !!word,
      });

      let options: any[] = [];

      // Check if we're after FROM [data-source] - suggest next steps
      if (/FROM\s+[\w\-\*\.]+\s+$/i.test(beforeCursor)) {
        console.log("Suggesting next steps after FROM data-source");
        options = nextStepSuggestions;
      }
      // Check if we're after FROM keyword - suggest index patterns
      else if (
        /FROM\s+$/i.test(beforeCursor) ||
        /FROM\s+\w*$/i.test(beforeCursor)
      ) {
        console.log("Suggesting index patterns after FROM");
        options = indexPatterns;
      }
      // Check if we're at the beginning or after a pipe - suggest commands
      else if (beforeCursor.trim() === "" || /\|\s*\w*$/i.test(beforeCursor)) {
        console.log("Suggesting commands at beginning or after pipe");
        options = esqlCommands;
      }
      // Check if we're in function context - suggest functions
      else if (/[\(\s,]\w*$/i.test(beforeCursor)) {
        console.log("Suggesting functions in function context");
        options = [...esqlFunctions, ...commonFields];
      }
      // Default - suggest everything
      else {
        console.log("Suggesting everything as default");
        options = [
          ...esqlCommands,
          ...esqlFunctions,
          ...commonFields,
          ...indexPatterns,
        ];
      }

      // Filter options based on current word
      if (word?.text) {
        const originalLength = options.length;
        options = options.filter((option) =>
          option.label.toLowerCase().startsWith(word.text.toLowerCase())
        );
        console.log(
          `Filtered from ${originalLength} to ${options.length} options based on "${word.text}"`
        );
      }

      // Sort options by priority (sortOrder) then alphabetically
      options.sort((a, b) => {
        // If both have sortOrder, sort by that first
        if (a.sortOrder && b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        // If only one has sortOrder, prioritize it
        if (a.sortOrder && !b.sortOrder) return -1;
        if (b.sortOrder && !a.sortOrder) return 1;
        // Otherwise sort alphabetically
        return a.label.localeCompare(b.label);
      });

      console.log(
        "Final options with boost:",
        options.map((o) => ({
          label: o.label,
          sortOrder: o.sortOrder,
          boost: o.sortOrder ? 100 - o.sortOrder : 0,
        }))
      );

      if (options.length === 0) {
        console.log("No options found, returning null");
        return null;
      }

      return {
        from: word?.from || context.pos,
        options: options.map((option) => {
          // Keywords that should have a space added
          const keywordsNeedingSpace = [
            "FROM",
            "WHERE",
            "EVAL",
            "STATS",
            "SORT",
            "KEEP",
            "DROP",
          ];
          // Index patterns (data sources) that should also have a space added
          const isIndexPattern =
            option.type === "property" && option.label.startsWith("logs-");
          const shouldAddSpace =
            keywordsNeedingSpace.includes(option.label) || isIndexPattern;

          // Handle templates with cursor positioning
          if (option.applyTemplate && option.cursorOffset !== undefined) {
            return {
              label: option.label,
              type: option.type,
              detail: option.detail,
              apply: (view, completion, from, to) => {
                const template = option.applyTemplate;
                // Insert the template
                view.dispatch({
                  changes: { from, to, insert: template },
                  selection: {
                    anchor: from + template.length + option.cursorOffset,
                  },
                });
              },
              boost: option.sortOrder ? 100 - option.sortOrder : 0,
            };
          }

          return {
            label: option.label,
            type: option.type,
            detail: option.detail,
            apply: shouldAddSpace ? option.label + " " : option.label,
            boost: option.sortOrder ? 100 - option.sortOrder : 0, // Higher boost = higher priority
          };
        }),
      };
    }

    return autocompletion({
      override: [esqlCompletion],
      activateOnTyping: true,
      maxRenderedOptions: 10,
      closeOnBlur: false,
      defaultKeymap: true,
    });
  }, []);

  // Create custom theme based on EUI theme
  const customTheme = useMemo(() => {
    console.log("CodeEditor theme update - colorMode:", colorMode, "colors:", {
      text: euiTheme.colors.text,
      background: euiTheme.colors.backgroundBasePlain,
      backgroundSubdued: euiTheme.colors.backgroundBaseSubdued,
    });

    // Inject global CSS to override any focus outlines
    const styleId = "codemirror-focus-override";
    let existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        /* CodeMirror focus outline overrides */
        .cm-editor.cm-focused,
        .cm-editor .cm-focused,
        .cm-content.cm-focused,
        [class*="ͼ"].cm-focused,
        [class*="ͼ"][class*="cm-focused"],
        [class^="c"][class*="cm-focused"],
        [class*=".c"][class*="cm-focused"],
        [class*="c"][class*="cm-focused"],
        .cm-editor *:focus,
        .cm-content:focus,
        .cm-editor [class*="c"]:focus,
        .cm-editor [class*="c"].cm-focused,
        .cm-editor div[class*="c"].cm-focused,
        .cm-editor div.cm-focused {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Universal override for any element with cm-focused class */
        .cm-focused,
        div.cm-focused,
        [class*="c"].cm-focused,
        div[class*="c"].cm-focused {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
        }
        /* Target CodeMirror's specific class patterns */
        .codeEditorContainer .cm-focused,
        .codeEditorContainer [class*="c"].cm-focused,
        .codeEditorContainer div.cm-focused {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
        }
      `;
      document.head.appendChild(style);
    }

    return EditorView.theme({
      "&": {
        fontSize: "13px",
        fontFamily:
          "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
        height: compressed ? "auto" : "100%",
        color: euiTheme.colors.text,
      },
      ".cm-content": {
        padding: compressed ? "8px 12px" : "12px",
        color: euiTheme.colors.text,
        backgroundColor: euiTheme.colors.backgroundBasePlain,
        caretColor: euiTheme.colors.text,
        fontFamily:
          "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
        minHeight: compressed ? "40px" : "auto",
      },
      ".cm-editor": {
        backgroundColor: euiTheme.colors.backgroundBasePlain,
        border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        borderRadius: compressed ? "6px" : "4px",
        height: compressed ? "auto" : "100%",
        minHeight: compressed ? "40px" : "auto",
        color: euiTheme.colors.text,
        fontFamily:
          "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
      },
      ".cm-scroller": {
        fontFamily:
          "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
        overflow: "auto",
        maxHeight: "100%",
        color: euiTheme.colors.text,
        backgroundColor: euiTheme.colors.backgroundBasePlain,
      },
      ".cm-line": {
        lineHeight: compressed ? "1.4" : "1.5",
        color: euiTheme.colors.text,
      },
      ".cm-cursor": {
        borderLeftColor: euiTheme.colors.primary,
      },
      ".cm-selectionBackground": {
        backgroundColor: euiTheme.colors.primary,
        opacity: 0.3,
      },
      ".cm-activeLine": {
        backgroundColor: euiTheme.colors.backgroundBaseSubdued,
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        color: euiTheme.colors.textSubdued,
        borderRight: "none",
      },
      ".cm-lineNumbers": {
        color: euiTheme.colors.textSubdued,
      },
      ".cm-tooltip": {
        backgroundColor: euiTheme.colors.emptyShade,
        border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        borderRadius: "6px",
        boxShadow: isDarkMode
          ? "0 4px 16px rgba(0, 0, 0, 0.4)"
          : "0 4px 16px rgba(0, 0, 0, 0.15)",
        fontSize: "13px",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      },
      ".cm-tooltip.cm-tooltip-autocomplete": {
        backgroundColor: euiTheme.colors.emptyShade,
        border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        borderRadius: "6px",
        padding: "4px 0",
        width: "320px",
        minWidth: "320px",
        maxWidth: "320px",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul": {
        maxHeight: "200px",
        margin: 0,
        padding: 0,
        listStyle: "none",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        padding: "4px 12px",
        color: euiTheme.colors.text,
        cursor: "pointer",
        fontSize: "13px",
        lineHeight: "1.4",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        position: "relative",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
        backgroundColor: euiTheme.colors.primary,
        color: #FFFFFF,
      },
      // Hide any default CodeMirror completion icons
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon": {
        display: "none !important",
      },
      ".cm-tooltip.cm-tooltip-autocomplete::before": {
        display: "none !important",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li::before": {
        display: "none !important",
      },
      // Hide any emoji/icon content
      ".cm-tooltip.cm-tooltip-autocomplete [data-emoji]": {
        display: "none !important",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionType": {
        display: "none !important",
      },
      // Hide any Unicode symbols that might be inserted
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li > *:first-child": {
        fontSize: "0 !important",
        width: "0 !important",
        overflow: "hidden !important",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionLabel": {
        fontWeight: 400,
        fontFamily:
          "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
        flex: "0 0 auto",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionDetail": {
        color: euiTheme.colors.textSubdued,
        fontSize: "12px",
        fontWeight: 400,
        marginLeft: "auto",
        flex: "1 1 auto",
        textAlign: "right",
        display: "none", // Hide by default
      },
      ".cm-tooltip.cm-tooltip-autocomplete li[aria-selected] .cm-completionDetail":
        {
          color: #FFFFFF,
          opacity: 0.9,
          display: "block", // Show only when selected
        },
      // Placeholder styling
      ".cm-placeholder": {
        color: euiTheme.colors.textSubdued,
        fontStyle: "italic",
      },
      // ES|QL keyword highlighting
      ".cm-esql-keyword": {
        color: euiTheme.colors.textAccent,
        fontWeight: 600,
      },
      // FROM keyword specific highlighting
      ".cm-esql-from": {
        color: euiTheme.colors.primaryText,
        fontWeight: 600,
      },
      // Function highlighting (KQL, COUNT, etc.)
      ".cm-esql-function": {
        color: euiTheme.colors.primaryText,
        fontWeight: 400,
      },
      // Triple-quoted string highlighting
      ".cm-esql-triple-quote": {
        color: euiTheme.colors.textAccent,
        fontWeight: 400,
      },
      // Comment highlighting
      ".cm-esql-comment": {
        color: euiTheme.colors.textSubdued,
        fontStyle: "italic",
        fontWeight: 400,
      },
      // Override CodeMirror's focus outline globally
      ".cm-focused": {
        outline: "none !important",
      },
      // More specific override for generated CodeMirror classes
      ".cm-editor.cm-focused": {
        outline: "none !important",
      },
      // Target CodeMirror's dynamically generated class patterns (e.g., .c1.cm-focused, .c.-ozkqvk.cm-focused)
      "[class^='c'][class*='cm-focused']": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      "[class*='.c'][class*='cm-focused']": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      "[class*='c'][class*='cm-focused']": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      ".cm-editor [class*='c'].cm-focused": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      // Target all dynamically generated CodeMirror classes with focus
      "[class*='ͼ'][class*='cm-focused']": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      // Target the specific generated class pattern more broadly
      "[class*='ͼ'].cm-focused": {
        outline: "none !important",
        outlineStyle: "none !important",
        outlineWidth: "0 !important",
        outlineColor: "transparent !important",
        border: "none !important",
      },
      // Nuclear option - target any focused element within the editor
      ".cm-editor *:focus": {
        outline: "none !important",
        outlineStyle: "none !important",
        border: "none !important",
      },
      // Target the content area specifically
      ".cm-content:focus": {
        outline: "none !important",
        border: "none !important",
      },
      // Compressed mode specific styles
      ...(compressed && {
        ".cm-editor": {
          backgroundColor: euiTheme.colors.backgroundBasePlain,
          border: "none",
          borderRadius: "0",
          height: "auto",
          minHeight: "32px",
          color: euiTheme.colors.text,
          fontFamily:
            "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
          boxShadow: "none",
        },
        ".cm-content": {
          padding: "6px 12px",
          color: euiTheme.colors.text,
          backgroundColor: euiTheme.colors.backgroundBasePlain,
          caretColor: euiTheme.colors.text,
          fontFamily:
            "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
          minHeight: "20px",
          lineHeight: "20px",
          outline: "none !important",
        },
        ".cm-content:focus": {
          outline: "none !important",
        },
        ".cm-content:focus-visible": {
          outline: "none !important",
        },
        ".cm-scroller": {
          fontFamily:
            "'Roboto Mono', 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Consolas', monospace",
          overflow: "hidden",
          color: euiTheme.colors.text,
          backgroundColor: euiTheme.colors.backgroundBasePlain,
          outline: "none !important",
        },
        ".cm-scroller:focus": {
          outline: "none !important",
        },
        ".cm-scroller:focus-visible": {
          outline: "none !important",
        },
        // Catch-all for any CodeMirror focus outlines
        "[class*='cm-']": {
          outline: "none !important",
        },
        "[class*='cm-']:focus": {
          outline: "none !important",
        },
        "[class*='cm-']:focus-visible": {
          outline: "none !important",
        },
      }),
    });
  }, [euiTheme, colorMode, isDarkMode, compressed, showFooter]);


  // Create handleGenerate from the extracted module
  const handleGenerate = useMemo(
    () => createHandleGenerate(editorViewRef, onChange, hasCalledEditCallbackRef),
    [onChange]
  );

  // Update visor config with current callbacks and theme
  useEffect(() => {
    visorConfig.onClose = () => {
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          effects: toggleVisorEffect.of({ pos: 0, open: false }),
        });
        setVisorOpen(false);
      }
    };

    visorConfig.onSubmit = (prompt: string, language: string) => {
      console.log("Visor prompt submitted:", { prompt, language });
      
      if (editorViewRef.current) {
        const view = editorViewRef.current;
        const cursorPos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(cursorPos);
        
        let generatedCode: string;
        let commentLine: string;
        
        // Generate code based on language
        if (language === "KQL") {
          // For KQL, generate a comment that can be parsed later
          // Format: // [KQL] [logs-*] search term
          commentLine = `// [KQL] [logs-*] ${prompt}`;
          generatedCode = `FROM logs-* | WHERE KQL("${prompt}")`;
        } else if (language === "PromQL") {
          // For PromQL (future implementation)
          commentLine = `// [PromQL] ${prompt}`;
          generatedCode = `// PromQL not yet implemented`;
        } else {
          // Natural language - use existing generator
          commentLine = `// ${prompt}`;
          generatedCode = generateESQLFromPrompt(prompt);
        }
        
        // Create the text to insert: comment + newline + generated code + newline
        const textToInsert = `${commentLine}\n${generatedCode}\n`;
        
        // Insert at the beginning of the current line
        const insertPos = line.from;
        
        // For KQL, do immediate synchronous insertion without delays
        if (language === "KQL") {
          // Calculate line numbers in the current document first
          const commentLineNum = line.number;
          const codeLineCount = generatedCode.split('\n').length;
          const codeLineNumbers = Array.from(
            { length: codeLineCount },
            (_, i) => commentLineNum + 1 + i
          );
          
          // Single dispatch for immediate insertion
          view.dispatch({
            changes: { from: insertPos, insert: textToInsert },
            selection: { anchor: insertPos + textToInsert.length },
            effects: [
              addGeneratedBlockEffect.of({
                commentLine: commentLineNum,
                codeLines: codeLineNumbers,
                originalCommentText: commentLine,
              })
            ],
          });
          
          // Immediate update without setTimeout
          onChange(view.state.doc.toString());
          return;
        }
        
        // For Natural language and PromQL, use the original flow with transaction
        const transaction = view.state.update({
          changes: { from: insertPos, insert: textToInsert },
          selection: { anchor: insertPos + textToInsert.length },
        });
        
        // Now calculate line numbers in the NEW document
        const newDoc = transaction.state.doc;
        const commentLineNum = newDoc.lineAt(insertPos).number;
        
        // Count the number of lines in the generated code
        const codeLineCount = generatedCode.split('\n').length;
        const codeLineNumbers = Array.from(
          { length: codeLineCount },
          (_, i) => commentLineNum + 1 + i
        );
        
        console.log("[Visor] Tracking block:", {
          language,
          commentLine: commentLineNum,
          codeLines: codeLineNumbers,
          commentText: commentLine,
          generatedCode: generatedCode.substring(0, 50) + "..."
        });
        
        // Dispatch with the tracking effect
        view.dispatch({
          changes: { from: insertPos, insert: textToInsert },
          selection: { anchor: insertPos + textToInsert.length },
          effects: [
            // Track the comment and its generated code lines
            addGeneratedBlockEffect.of({
              commentLine: commentLineNum,
              codeLines: codeLineNumbers,
              originalCommentText: commentLine,
            })
          ],
        });
        
        // Update the parent component's value
        onChange(view.state.doc.toString());
      }
    };

    visorConfig.createWidget = (onClose: () => void, onSubmit: (prompt: string, language: string) => void) => {
      return createVisorWidget({ onClose, onSubmit, euiTheme, isDarkMode, display: visorDisplay });
    };
  }, [euiTheme, isDarkMode, onChange, visorDisplay]);

  // Create inline hint widget for empty lines
  const emptyLineHintPlugin = useMemo(() => {
    class EmptyLineHintWidget extends WidgetType {
      constructor(private hintText: string) {
        super();
      }

      toDOM() {
        const span = document.createElement("span");
        span.textContent = this.hintText;
        span.style.color = euiTheme.colors.textSubdued;
        span.style.fontStyle = "italic";
        span.style.pointerEvents = "none";
        span.style.userSelect = "none";
        return span;
      }
    }

    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.selectionSet || update.focusChanged) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const builder = new RangeSetBuilder<Decoration>();

          // Only show hint if editor has focus and visor is not open
          if (!view.hasFocus || view.state.field(visorState).open) {
            return builder.finish();
          }

          const { state } = view;
          const cursorPos = state.selection.main.head;
          const line = state.doc.lineAt(cursorPos);

          // Check if current line is empty
          if (line.text.trim() === "") {
            const widget = Decoration.widget({
              widget: new EmptyLineHintWidget("Cmd + K to generate"),
              side: 1,
            });
            builder.add(cursorPos, cursorPos, widget);
          }

          return builder.finish();
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );
  }, [euiTheme.colors.textSubdued, visorState]);

  // Create inline hint widget for comment lines
  // Create comment hint plugin from the extracted module
  const commentHintPlugin = useMemo(
    () => createCommentHintPlugin(euiTheme.colors.textSubdued, visorState, commentHintState),
    [euiTheme.colors.textSubdued]
  );

  // Create gutter marker extension for edit indicators (only in gutter mode)
  const editMarkerGutter = useMemo(() => {
    if (editMarkerStyle === 'gutter') {
      return createEditMarkerGutter(
        euiTheme.colors.accentSecondary, // Comment edit color (orange square)
        euiTheme.colors.accent,    // Code edit color (blue circle)
        isDarkMode,
        euiTheme.colors.textDanger,  // Red color for deleted text in diff
        euiTheme.colors.textSuccess  // Green color for added text in diff
      );
    }
    return null;
  }, [editMarkerStyle, euiTheme.colors.accentSecondary, euiTheme.colors.accent, isDarkMode, euiTheme.colors.textDanger, euiTheme.colors.textSuccess]);

  // Create ES|QL keyword highlighting plugin
  const esqlHighlighting = useMemo(() => {
    const fromRegex = /\bFROM\b/g;
    const otherKeywordRegex =
      /\b(WHERE|EVAL|STATS|SORT|LIMIT|KEEP|BY|AS|IN|AND|OR|NOT)\b/g;
    const functionRegex =
      /\b(KQL|COUNT|SUM|AVG|MIN|MAX|ROUND|ABS|LENGTH|SUBSTRING)\b/g;
    const tripleQuoteRegex = /"""[^"]*"""/g;
    const commentRegex = /\/\/.*/g;
    const fromDecoration = Decoration.mark({ class: "cm-esql-from" });
    const keywordDecoration = Decoration.mark({ class: "cm-esql-keyword" });
    const functionDecoration = Decoration.mark({ class: "cm-esql-function" });
    const tripleQuoteDecoration = Decoration.mark({
      class: "cm-esql-triple-quote",
    });
    const commentDecoration = Decoration.mark({
      class: "cm-esql-comment",
    });

    function buildDecorations(doc: any): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const docText = doc.toString();
      console.log(
        "ES|QL highlighting - building decorations for doc:",
        docText
      );
      console.log("ES|QL highlighting - doc lines:", doc.lines);

      // Collect all matches first, then sort them
      const allMatches: Array<{
        from: number;
        to: number;
        decoration: Decoration;
      }> = [];

      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const text = line.text;
        let match;

        // Check if this line is a comment first
        commentRegex.lastIndex = 0; // Reset regex
        const commentMatch = commentRegex.exec(text);
        const isComment = commentMatch !== null;

        // If the entire line is a comment, only add comment decoration
        if (isComment) {
          allMatches.push({
            from: line.from + commentMatch.index,
            to: line.from + commentMatch.index + commentMatch[0].length,
            decoration: commentDecoration,
          });
          // Skip keyword matching for this line
          continue;
        }

        // Handle FROM keyword specifically
        fromRegex.lastIndex = 0; // Reset regex
        while ((match = fromRegex.exec(text)) !== null) {
          console.log(
            "Found FROM match:",
            match[0],
            "at position",
            match.index
          );
          allMatches.push({
            from: line.from + match.index,
            to: line.from + match.index + match[0].length,
            decoration: fromDecoration,
          });
        }

        // Handle other keywords
        otherKeywordRegex.lastIndex = 0; // Reset regex
        while ((match = otherKeywordRegex.exec(text)) !== null) {
          allMatches.push({
            from: line.from + match.index,
            to: line.from + match.index + match[0].length,
            decoration: keywordDecoration,
          });
        }

        // Handle functions (KQL, COUNT, etc.)
        functionRegex.lastIndex = 0; // Reset regex
        while ((match = functionRegex.exec(text)) !== null) {
          allMatches.push({
            from: line.from + match.index,
            to: line.from + match.index + match[0].length,
            decoration: functionDecoration,
          });
        }

        // Handle triple-quoted strings
        tripleQuoteRegex.lastIndex = 0; // Reset regex
        while ((match = tripleQuoteRegex.exec(text)) !== null) {
          allMatches.push({
            from: line.from + match.index,
            to: line.from + match.index + match[0].length,
            decoration: tripleQuoteDecoration,
          });
        }
      }

      // Sort matches by position to avoid the range builder error
      allMatches.sort((a, b) => a.from - b.from);

      // Add all matches to builder in sorted order
      for (const match of allMatches) {
        builder.add(match.from, match.to, match.decoration);
      }

      return builder.finish();
    }

    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = buildDecorations(view.state.doc);
        }

        update(update: ViewUpdate) {
          if (update.docChanged) {
            this.decorations = buildDecorations(update.state.doc);
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );
  }, []);

  // Initialize CodeMirror editor
  useEffect(() => {
    console.log("[DEBUG] CodeMirror initialization useEffect running");
    if (!editorRef.current) return;

    // Create editor state
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        keymap.of([
          // Custom keybindings BEFORE defaultKeymap to take precedence
          // Toggle visor widget with Cmd+Shift+V (Mac) or Ctrl+Shift+V (Windows/Linux)
          {
            key: "Cmd-Shift-v",
            run: (view) => {
              const state = view.state.field(visorState);
              const cursorPos = view.state.selection.main.head;
              view.dispatch({
                effects: toggleVisorEffect.of({ pos: cursorPos, open: !state.open }),
              });
              setVisorOpen(!state.open);
              return true;
            },
          },
          {
            key: "Ctrl-Shift-v",
            run: (view) => {
              const state = view.state.field(visorState);
              const cursorPos = view.state.selection.main.head;
              view.dispatch({
                effects: toggleVisorEffect.of({ pos: cursorPos, open: !state.open }),
              });
              setVisorOpen(!state.open);
              return true;
            },
          },
          // Toggle VisorHex with Cmd+Shift+K (Mac) or Ctrl+Shift+K (Windows/Linux)
          // When enableVisor is true, use internal handler; otherwise use external callback if provided
          {
            key: "Cmd-Shift-k",
            run: () => {
              if (enableVisor) {
                handleToggleVisorHex();
              } else if (onToggleVisorHex) {
                onToggleVisorHex();
              }
              // Always return true to prevent CodeMirror's default line-deletion behavior
              return true;
            },
          },
          {
            key: "Ctrl-Shift-k",
            run: () => {
              if (enableVisor) {
                handleToggleVisorHex();
              } else if (onToggleVisorHex) {
                onToggleVisorHex();
              }
              // Always return true to prevent CodeMirror's default line-deletion behavior
              return true;
            },
          },
          // Regenerate code from comment with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
          {
            key: "Cmd-k",
            run: (view) => {
              const cursorPos = view.state.selection.main.head;
              const line = view.state.doc.lineAt(cursorPos);
              const lineText = line.text;
              
              // Check if current line is a comment
              const isComment = /^\s*\/\//.test(lineText);
              
              if (!isComment) {
                console.log("[Cmd+K] Not on a comment line, doing nothing");
                return false;
              }
              
              console.log("[Cmd+K] Detected comment line:", lineText);
              
              // Check for KQL format first
              const kqlMatch = lineText.match(/^\s*\/\/\s*\[KQL\]\s*\[([^\]]+)\]\s*(.+)$/);
              
              if (kqlMatch) {
                const dataSource = kqlMatch[1].trim();
                const searchTerm = kqlMatch[2].trim();
                console.log("[Cmd+K] KQL comment detected:", { dataSource, searchTerm });
                
                // Generate KQL query
                const newComment = `// [KQL] [${dataSource}] ${searchTerm}`;
                const newCode = `FROM ${dataSource} | WHERE KQL("${searchTerm}")`;
                const newText = `${newComment}\n${newCode}`;
                
                // Find the block to replace (comment + associated code)
                const trackedBlocks = view.state.field(generatedCommentsState);
                const block = trackedBlocks.get(line.number);
                
                console.log("[Cmd+K] Tracked blocks:", Array.from(trackedBlocks.entries()));
                console.log("[Cmd+K] Block for line", line.number, ":", block);
                
                let replaceFrom = line.from;
                let replaceTo = line.to;
                
                // Safety: For KQL comments, always try to include at least the next line to prevent concatenation
                const hasNextLine = line.number < view.state.doc.lines;
                
                if (block && block.codeLines.size > 0) {
                  // Replace comment + all associated code lines (including trailing newline)
                  const maxCodeLine = Math.max(...Array.from(block.codeLines));
                  const lastCodeLineObj = view.state.doc.line(maxCodeLine);
                  // Include the newline after the last code line if there's more content after
                  replaceTo = maxCodeLine < view.state.doc.lines ? lastCodeLineObj.to + 1 : lastCodeLineObj.to;
                  console.log("[Cmd+K] Found tracked block with code lines:", Array.from(block.codeLines), "replaceTo includes newline:", maxCodeLine < view.state.doc.lines);
                } else if (hasNextLine) {
                  // Fallback: try to replace this line and the next
                  console.log("[Cmd+K] No tracked block found, trying fallback");
                  const nextLine = view.state.doc.line(line.number + 1);
                  console.log("[Cmd+K] Next line text:", nextLine.text);
                  const isKQLCode = /^\s*FROM\s+.*\|\s*WHERE\s+KQL/i.test(nextLine.text);
                  console.log("[Cmd+K] Is KQL code:", isKQLCode);
                  // Always replace the next line to avoid concatenation
                  replaceTo = line.number + 1 < view.state.doc.lines ? nextLine.to + 1 : nextLine.to;
                  console.log("[Cmd+K] Fallback: setting replaceTo to", replaceTo);
                } else {
                  // Edge case: comment is on the last line with no code line
                  console.warn("[Cmd+K] WARNING: Comment is on last line with no code to replace!");
                }
                
                console.log("[Cmd+K] Final replacement range: from", replaceFrom, "(" + line.from + ") to", replaceTo, "- replacing", (replaceTo - replaceFrom), "characters");
                
                // CRITICAL: Remove old tracking FIRST before making changes
                if (block) {
                  console.log("[Cmd+K] Removing old tracked block first");
                  view.dispatch({
                    effects: [removeGeneratedBlockEffect.of(line.number)],
                  });
                }
                
                // Calculate new line numbers for tracking
                const newCodeLineCount = newCode.split('\n').length;
                const newCodeLines = Array.from({ length: newCodeLineCount }, (_, i) => line.number + 1 + i);
                
                console.log("[Cmd+K] Re-tracking block as fresh:", {
                  commentLine: line.number,
                  codeLines: newCodeLines
                });
                
                // Now dispatch the text change with fresh tracking
                view.dispatch({
                  changes: { from: replaceFrom, to: replaceTo, insert: newText },
                  selection: { anchor: replaceFrom + newText.length },
                  effects: [
                    // Re-track as fresh block (no editType)
                    addGeneratedBlockEffect.of({
                      commentLine: line.number,
                      codeLines: newCodeLines,
                      originalCommentText: newComment,
                    })
                  ],
                  annotations: [isRegenerationAnnotation.of(true)],
                });
                
                // Verify tracking after dispatch
                setTimeout(() => {
                  const trackedBlocks = view.state.field(generatedCommentsState);
                  console.log("[Cmd+K KQL] Verification - Tracked blocks after dispatch:", Array.from(trackedBlocks.entries()));
                }, 50);
                
                onChange(view.state.doc.toString());
                return true;
              }
              
              // For any other comment (not KQL, not already Natural language tagged),
              // treat as natural language by default
              const regularMatch = lineText.match(/^\s*\/\/\s*(.+)$/);
              if (regularMatch) {
                const commentText = regularMatch[1].trim();
                console.log("[Cmd+K] Plain comment detected (treating as natural language):", commentText);
                
                // Generate new code from the comment
                const newCode = generateESQLFromPrompt(commentText);
                const newText = `${lineText}\n${newCode}`;
                
                // Find the block to replace (comment + associated code)
                const trackedBlocks = view.state.field(generatedCommentsState);
                const block = trackedBlocks.get(line.number);
                
                console.log("[Cmd+K] Natural language - Tracked blocks:", Array.from(trackedBlocks.entries()));
                console.log("[Cmd+K] Natural language - Block for line", line.number, ":", block);
                
                let replaceFrom = line.from;
                let replaceTo = line.to;
                
                if (block && block.codeLines.size > 0) {
                  // Replace comment + all associated code lines (including trailing newline)
                  const maxCodeLine = Math.max(...Array.from(block.codeLines));
                  const lastCodeLineObj = view.state.doc.line(maxCodeLine);
                  // Include the newline after the last code line if there's more content after
                  replaceTo = maxCodeLine < view.state.doc.lines ? lastCodeLineObj.to + 1 : lastCodeLineObj.to;
                  console.log("[Cmd+K] Natural language - Found tracked block, replacing lines", line.number, "to", maxCodeLine);
                } else {
                  // Fallback: check if next line is ES|QL code
                  const hasNextLine = line.number < view.state.doc.lines;
                  if (hasNextLine) {
                    const nextLine = view.state.doc.line(line.number + 1);
                    const isESQLCode = /^\s*FROM\s+/i.test(nextLine.text);
                    if (isESQLCode) {
                      // Replace the next line too
                      replaceTo = line.number + 1 < view.state.doc.lines ? nextLine.to + 1 : nextLine.to;
                      console.log("[Cmd+K] Natural language - No tracked block, but found ES|QL code on next line");
                    }
                  }
                }
                
                console.log("[Cmd+K] Natural language - Final replacement range: from", replaceFrom, "to", replaceTo);
                
                // CRITICAL: Remove old tracking FIRST before making changes
                if (block) {
                  console.log("[Cmd+K] Natural language - Removing old tracked block first");
                  view.dispatch({
                    effects: [removeGeneratedBlockEffect.of(line.number)],
                  });
                }
                
                // Calculate new line numbers for tracking
                const newCodeLineCount = newCode.split('\n').length;
                const newCodeLines = Array.from({ length: newCodeLineCount }, (_, i) => line.number + 1 + i);
                
                console.log("[Cmd+K] Natural language - Re-tracking block as fresh:", {
                  commentLine: line.number,
                  codeLines: newCodeLines
                });
                
                // Now dispatch the text change with fresh tracking
                view.dispatch({
                  changes: { from: replaceFrom, to: replaceTo, insert: newText },
                  selection: { anchor: replaceFrom + newText.length },
                  effects: [
                    // Re-track as fresh block (no editType)
                    addGeneratedBlockEffect.of({
                      commentLine: line.number,
                      codeLines: newCodeLines,
                      originalCommentText: lineText,
                    })
                  ],
                  annotations: [isRegenerationAnnotation.of(true)],
                });
                
                // Verify tracking after dispatch
                setTimeout(() => {
                  const trackedBlocks = view.state.field(generatedCommentsState);
                  console.log("[Cmd+K NL] Verification - Tracked blocks after dispatch:", Array.from(trackedBlocks.entries()));
                }, 50);
                
                onChange(view.state.doc.toString());
                return true;
              }
              
              return false;
            },
          },
          {
            key: "Ctrl-k",
            run: (view) => {
              // Same logic as Cmd-k for Windows/Linux
              const cursorPos = view.state.selection.main.head;
              const line = view.state.doc.lineAt(cursorPos);
              const lineText = line.text;
              
              const isComment = /^\s*\/\//.test(lineText);
              if (!isComment) return false;
              
              // Trigger the same handler as Cmd-k
              return view.contentDOM.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true })
              );
            },
          },
          // Execute query with Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
          // Only executes existing queries, does NOT generate code
          {
            key: "Cmd-Enter",
            run: (view) => {
              console.log("[Cmd+Enter] Executing query");
              if (onSubmit) {
                onSubmit(view.state.doc.toString());
                return true;
              }
              return false;
            },
          },
          {
            key: "Ctrl-Enter",
            run: (view) => {
              console.log("[Ctrl+Enter] Executing query");
              if (onSubmit) {
                onSubmit(view.state.doc.toString());
                return true;
              }
              return false;
            },
          },
          // Default keymap comes last so our custom keybindings take precedence
          ...defaultKeymap,
        ]),
        bracketMatching(),
        // esqlCompletions,
        esqlHighlighting,
        visorState,
        visorDecorationField,
        generatedCommentsState,
        commentHintState,
        ...(showEmptyLineHint ? [emptyLineHintPlugin] : []),
        commentHintPlugin,
        themeCompartment.current.of(customTheme),
        ...(placeholder ? [placeholderExtension(placeholder)] : []),
        // Add gutter marker extension if in gutter mode (returns array of extensions)
        ...(editMarkerGutter || []),
        // Debounce showing comment hint (extracted)
        createCommentHintDebounceListener(commentHintTimerRef, editorViewRef),
        // Detect edits to generated comments or code (bidirectional tracking)
        // Use different listener based on editMarkerStyle
        editMarkerStyle === 'inline'
          ? createCommentEditDetectionListener(editedBlocksRef, commentEditTimerRef, editorViewRef, onChange)
          : createCommentEditDetectionListenerGutter(
              editedBlocksRef, 
              commentEditTimerRef, 
              editorViewRef, 
              enableVisor ? handleCloseVisorHex : onEditGeneratedCode, 
              hasCalledEditCallbackRef
            ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());

            // // Auto-trigger completion after keywords with space are typed
            // const doc = update.state.doc.toString();
            // const lines = doc.split("\n");
            // const currentLine = lines[lines.length - 1] || "";

            // // Check for keywords that should trigger next completion
            // const triggerPatterns = [
            //   /FROM\s+$/i,
            //   /WHERE\s+$/i,
            //   /EVAL\s+$/i,
            //   /STATS\s+$/i,
            //   /SORT\s+$/i,
            //   /KEEP\s+$/i,
            //   /DROP\s+$/i,
            //   // After data source is selected (e.g., "FROM logs-* ")
            //   /FROM\s+[\w\-\*\.]+\s+$/i,
            // ];

            // const shouldTrigger = triggerPatterns.some((pattern) =>
            //   pattern.test(currentLine)
            // );

            // if (shouldTrigger) {
            //   setTimeout(() => {
            //     startCompletion(update.view);
            //   }, 50);
            // }
          }
        }),
        EditorView.updateListener.of((update) => {
          if (update.focusChanged) {
            setIsFocused(update.view.hasFocus);
            
            // Show comment hint after focusing
            if (update.view.hasFocus) {
              if (commentHintTimerRef.current) {
                clearTimeout(commentHintTimerRef.current);
              }
              commentHintTimerRef.current = setTimeout(() => {
                if (editorViewRef.current) {
                  editorViewRef.current.dispatch({
                    effects: setCommentHintEffect.of(true),
                  });
                }
              }, 500);
            } else {
              // Hide hint when losing focus
              update.view.dispatch({
                effects: setCommentHintEffect.of(false),
              });
            }
            
            // // Trigger autocomplete when focusing on empty editor
            // if (
            //   update.view.hasFocus &&
            //   update.state.doc.toString().trim() === ""
            // ) {
            //   setTimeout(() => {
            //     startCompletion(update.view);
            //   }, 100);
            // }
          }
          
          // Close visor when user starts interacting with the editor
          if ((update.docChanged || update.selectionSet) && update.transactions.length > 0) {
            const visorStateValue = update.state.field(visorState);
            if (visorStateValue.open) {
              // Check if this is a user-initiated change (not from visor insertion)
              const isUserChange = update.transactions.some(tr => tr.isUserEvent('input') || tr.isUserEvent('select'));
              if (isUserChange) {
                update.view.dispatch({
                  effects: toggleVisorEffect.of({ pos: 0, open: false }),
                });
                setVisorOpen(false);
              }
            }

            // Note: VisorHex is now external and doesn't auto-close on interaction
          }
        }),
        ...(compressed ? [] : [EditorView.lineWrapping]),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    // Cleanup
    return () => {
      console.log("[DEBUG] CodeMirror cleanup/destroy running");
      view.destroy();
      // Clean up timers
      if (commentEditTimerRef.current) {
        clearTimeout(commentEditTimerRef.current);
      }
      if (commentHintTimerRef.current) {
        clearTimeout(commentHintTimerRef.current);
      }
      // Clean up the injected style when component unmounts
      const styleElement = document.getElementById("codemirror-focus-override");
      if (
        styleElement &&
        document.querySelectorAll(".codeEditorContainer").length <= 1
      ) {
        styleElement.remove();
      }
    };
  }, [compressed, showEmptyLineHint, onToggleVisorHex]);

  // Update theme when colorMode changes
  useEffect(() => {
    if (editorViewRef.current) {
      console.log("Updating CodeMirror theme for colorMode:", colorMode);
      editorViewRef.current.dispatch({
        effects: [themeCompartment.current.reconfigure(customTheme)],
      });
    }
  }, [customTheme, colorMode]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorViewRef.current) {
      const currentValue = editorViewRef.current.state.doc.toString();
      if (currentValue !== value) {
        const transaction = editorViewRef.current.state.update({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: value,
          },
        });
        editorViewRef.current.dispatch(transaction);
      }
    }
  }, [value]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: height === "100%" ? "100%" : "auto",
      overflow: "visible",
      position: "relative"
    }}>
      <div
        className="codeEditorContainer"
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          height: compressed ? "auto" : (height === "100%" ? "auto" : height || "auto"),
          minHeight: compressed ? (showFooter ? "56px" : "32px") : "auto",
          flex: compressed ? "none" : (height === "100%" ? "1 1 0" : "1 1 auto"),
          overflow: compressed ? "hidden" : "visible",
          ...(compressed && {
            border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
            borderRadius: "6px",
          }),
        }}
      >
      {/* Editor container with scrolling - editor only, no footer */}
      <div
        style={{
          flex: compressed ? "none" : 1,
          minHeight: compressed ? "32px" : "80px",
          height: compressed ? "auto" : "auto",
          ...(height !== "100%" &&
            !compressed && {
              maxHeight: showFooter
                ? `calc(${height || "200px"} - 32px)`
                : height || "200px",
            }),
          overflow: compressed ? "visible" : "hidden",
        }}
      >
        <div ref={editorRef} style={{ height: compressed ? "auto" : "100%" }} />
      </div>
        
        {/* Comment Generator - inline hint now handled by commentHintPlugin */}
      </div>

      {/* VisorHex - appears below the editor when enableVisor is true */}
      {enableVisor && visorHexOpen && (
        <div 
          style={{ 
            padding: "8px",
            background: euiTheme.colors.emptyShade,
            flexShrink: 0,
            overflow: "visible",
            position: "relative",
            animation: visorHexClosing 
              ? "visorHexSlideOut 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)" 
              : "visorHexSlideIn 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
            transformOrigin: "top",
          }}
        >
          <style>
            {`
              @keyframes visorHexSlideIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes visorHexSlideOut {
                from {
                  opacity: 1;
                  transform: translateY(0);
                }
                to {
                  opacity: 0;
                  transform: translateY(-8px);
                }
              }
            `}
          </style>
          <VisorHex 
            euiTheme={euiTheme}
            isDarkMode={isDarkMode}
            onClose={handleCloseVisorHex}
            currentDataSource={visorCurrentDataSource}
            isGenerating={visorIsGenerating}
            onSubmit={onVisorSubmit || (() => {})}
          />
        </div>
      )}

      {/* Status bar footer - appears after VisorHex */}
      {showFooter && (
        <EditorFooter
          value={value}
          euiTheme={euiTheme}
          compressed={compressed}
          onQuickEdit={enableVisor ? handleToggleVisorHex : onQuickEdit}
          isDarkMode={isDarkMode}
          useGradient={useGradient}
          showIcon={showIcon}
          isVisorOpen={visorHexOpen}
        />
      )}
    </div>
  );
};
