"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const EmptyState = ({ pageName, versionId, }) => {
    // Convert page name to display format (e.g., "simple-esql" -> "Simple ESQL")
    const getDisplayPageName = (name) => {
        // Handle page names by capitalizing first letter and replacing hyphens with spaces
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    const displayName = getDisplayPageName(pageName);
    const filePath = `src/public/pages/${pageName}/v${versionId}/index.tsx`;
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            padding: "40px",
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiEmptyPrompt, { title: (0, jsx_runtime_1.jsxs)("h2", { children: [displayName, " v", versionId] }), body: (0, jsx_runtime_1.jsxs)("p", { children: ["This page is empty. Add functionality to it by targeting", (0, jsx_runtime_1.jsxs)(eui_1.EuiCode, { children: [displayName, " v", versionId] }), " ", "in your AI agent or by directly editing", " ", (0, jsx_runtime_1.jsx)(eui_1.EuiCode, { children: filePath })] }) }) }));
};
exports.EmptyState = EmptyState;
//# sourceMappingURL=EmptyState.js.map