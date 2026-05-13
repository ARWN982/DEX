import { EditorView } from "@codemirror/view";

interface ThemeOptions {
  euiTheme: any;
  colorMode: string;
  isDarkMode: boolean;
  compressed: boolean;
  showFooter: boolean;
}

export const createCodeEditorTheme = ({
  euiTheme,
  colorMode,
  isDarkMode,
  compressed,
  showFooter,
}: ThemeOptions) => {
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
      .cm-editor *:focus,
      .cm-content:focus {
        outline: none !important;
        outline-style: none !important;
        outline-width: 0 !important;
        outline-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
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
      backgroundColor: euiTheme.colors.backgroundBaseSubdued,
      color: euiTheme.colors.textSubdued,
      borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
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
      minWidth: "280px",
      maxWidth: "400px",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
      maxHeight: "200px",
      margin: 0,
      padding: 0,
      listStyle: "none",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
      padding: "8px 12px",
      color: euiTheme.colors.text,
      cursor: "pointer",
      borderBottom: `1px solid ${euiTheme.colors.borderBasePlain}`,
      fontSize: "13px",
      lineHeight: "1.4",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      position: "relative",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li:last-child": {
      borderBottom: "none",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: euiTheme.colors.primary,
      color: euiTheme.colors.textGhost,
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
      fontWeight: 600,
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
    },
    ".cm-tooltip.cm-tooltip-autocomplete li[aria-selected] .cm-completionDetail":
      {
        color: euiTheme.colors.textGhost,
        opacity: 0.9,
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
    // Override CodeMirror's focus outline globally
    ".cm-focused": {
      outline: "none !important",
    },
    // More specific override for generated CodeMirror classes
    ".cm-editor.cm-focused": {
      outline: "none !important",
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
};

export const cleanupCodeEditorStyles = () => {
  const styleElement = document.getElementById("codemirror-focus-override");
  if (
    styleElement &&
    document.querySelectorAll(".codeEditorContainer").length <= 1
  ) {
    styleElement.remove();
  }
};
