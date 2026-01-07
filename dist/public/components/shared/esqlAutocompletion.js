"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextStepSuggestions = exports.indexPatterns = exports.esqlCommands = void 0;
exports.esqlCompletion = esqlCompletion;
const state_1 = require("@codemirror/state");
// ES|QL Commands that appear in autocomplete when the editor is empty
exports.esqlCommands = [
    {
        label: "FROM",
        type: "keyword",
        boost: 99,
        apply: (view, completion, from, to) => {
            const { state } = view;
            view.dispatch({
                changes: { from, to, insert: "FROM " },
                selection: state_1.EditorSelection.cursor(from + 5),
            });
        },
    },
    { label: "ROW", type: "keyword", boost: 90 },
    { label: "SHOW", type: "keyword", boost: 80 },
    {
        label: "Search...",
        type: "template",
        boost: 70,
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = `FROM logs-* | WHERE KQL("""[cursor]""")`;
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.indexOf("[cursor]")),
            });
        },
    },
    {
        label: "Aggregate with STATS",
        type: "template",
        boost: 60,
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = "FROM logs-* | STATS count = COUNT() BY @timestamp";
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.length),
            });
        },
    },
];
// Index patterns for data source autocompletion
exports.indexPatterns = [
    {
        label: "logs-*",
        type: "index",
        info: "Logs index pattern",
    },
    {
        label: "logs-elasticsearch.audit-default",
        type: "index",
        info: "Archived audit logs",
    },
    {
        label: "logs-elasticsearch.deprecation-default",
        type: "index",
        info: "Archived deprecation logs",
    },
    {
        label: "logs-elasticsearch.server-default",
        type: "index",
        info: "Archived server logs",
    },
    {
        label: "logs-elasticsearch.slowlog-default",
        type: "index",
        info: "Archived slow logs",
    },
    {
        label: "logs-elastic_agent-default",
        type: "index",
        info: "Elastic Agent logs",
    },
];
// Next step suggestions after selecting a data source
exports.nextStepSuggestions = [
    {
        label: "Search...",
        type: "template",
        boost: 99,
        info: "Search across all fields using a query string",
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = ` | WHERE KQL("""[cursor]""")`;
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.indexOf("[cursor]")),
            });
        },
    },
    {
        label: "Aggregate with STATS",
        type: "template",
        boost: 90,
        info: "Group and aggregate your data",
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = " | STATS count = COUNT() BY @timestamp";
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.length),
            });
        },
    },
    {
        label: "Filter with WHERE",
        type: "template",
        boost: 80,
        info: "Filter your data with conditions",
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = " | WHERE ";
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.length),
            });
        },
    },
    {
        label: "Sort with SORT",
        type: "template",
        boost: 70,
        info: "Sort your results",
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = " | SORT @timestamp DESC";
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.length),
            });
        },
    },
    {
        label: "Limit results with LIMIT",
        type: "template",
        boost: 60,
        info: "Limit the number of results",
        apply: (view, completion, from, to) => {
            const { state } = view;
            const template = " | LIMIT 100";
            view.dispatch({
                changes: { from, to, insert: template },
                selection: state_1.EditorSelection.cursor(from + template.length),
            });
        },
    },
];
function esqlCompletion(context) {
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const lineText = line.text;
    const currentLineStart = line.from;
    const cursorOnLine = pos - currentLineStart;
    // Get text before cursor on current line
    const textBeforeCursor = lineText.slice(0, cursorOnLine);
    const fullTextBeforeCursor = state.doc.sliceString(0, pos);
    // If we're at the start of an empty editor or empty line
    if (textBeforeCursor.trim() === "" && fullTextBeforeCursor.trim() === "") {
        return {
            from: pos,
            options: exports.esqlCommands,
        };
    }
    // Check if we're after FROM and looking for data sources
    const fromMatch = fullTextBeforeCursor.match(/\bFROM\s+$/i);
    if (fromMatch) {
        return {
            from: pos,
            options: exports.indexPatterns.map((pattern) => ({
                ...pattern,
                apply: (view, completion, from, to) => {
                    view.dispatch({
                        changes: { from, to, insert: pattern.label + " " },
                        selection: state_1.EditorSelection.cursor(from + pattern.label.length + 1),
                    });
                    // Trigger next step completion after a short delay
                    setTimeout(() => {
                        view.dispatch({
                            effects: [
                                view.state.facet.of({
                                    autocomplete: { activateOnTyping: true },
                                }),
                            ],
                        });
                    }, 100);
                },
            })),
        };
    }
    // Check if we're after a data source selection and need next steps
    const afterDataSourceMatch = fullTextBeforeCursor.match(/\bFROM\s+[\w\-.*]+\s*$/i);
    if (afterDataSourceMatch) {
        return {
            from: pos,
            options: exports.nextStepSuggestions,
        };
    }
    return null;
}
//# sourceMappingURL=esqlAutocompletion.js.map