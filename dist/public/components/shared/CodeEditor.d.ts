import React from "react";
import { EditorView } from "@codemirror/view";
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
}
export declare const CodeEditor: React.FC<CodeEditorProps>;
export {};
//# sourceMappingURL=CodeEditor.d.ts.map