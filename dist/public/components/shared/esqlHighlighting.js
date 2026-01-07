"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esqlHighlighting = void 0;
const view_1 = require("@codemirror/view");
// ES|QL language highlighting plugin
exports.esqlHighlighting = view_1.ViewPlugin.fromClass(class {
    decorations;
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }
    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }
    buildDecorations(view) {
        const decorations = [];
        const doc = view.state.doc;
        // Iterate through lines
        for (let i = 1; i <= doc.lines; i++) {
            const line = doc.line(i);
            const lineText = line.text;
            const lineStart = line.from;
            // ES|QL keywords (case insensitive)
            const keywords = /\b(FROM|WHERE|STATS|EVAL|SORT|LIMIT|KEEP|DROP|ENRICH|RENAME|DISSECT|GROK|MV_EXPAND|ROW|SHOW)\b/gi;
            let match;
            while ((match = keywords.exec(lineText)) !== null) {
                const start = lineStart + match.index;
                const end = start + match[0].length;
                decorations.push(view_1.Decoration.mark({
                    class: match[0].toUpperCase() === "FROM"
                        ? "cm-esql-from"
                        : "cm-esql-keyword",
                }).range(start, end));
            }
            // Functions (including KQL)
            const functions = /\b(KQL|COUNT|SUM|AVG|MIN|MAX|MEDIAN|PERCENTILE)\b/gi;
            while ((match = functions.exec(lineText)) !== null) {
                const start = lineStart + match.index;
                const end = start + match[0].length;
                decorations.push(view_1.Decoration.mark({
                    class: "cm-esql-function",
                }).range(start, end));
            }
            // Triple-quoted strings
            const tripleQuotes = /"""[^"]*"""/g;
            while ((match = tripleQuotes.exec(lineText)) !== null) {
                const start = lineStart + match.index;
                const end = start + match[0].length;
                decorations.push(view_1.Decoration.mark({
                    class: "cm-esql-triple-quote",
                }).range(start, end));
            }
        }
        return view_1.Decoration.set(decorations);
    }
}, {
    decorations: (v) => v.decorations,
});
//# sourceMappingURL=esqlHighlighting.js.map