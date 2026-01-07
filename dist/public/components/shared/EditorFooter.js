"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorFooter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const eui_1 = require("@elastic/eui");
const phosphor_react_1 = require("phosphor-react");
const EditorFooter = ({ value, euiTheme, compressed = false, onQuickEdit, }) => {
    // Calculate line count dynamically
    const lineCount = (0, react_1.useMemo)(() => {
        if (!value)
            return 1;
        return value.split("\n").length;
    }, [value]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: euiTheme.colors.textSubdued,
            backgroundColor: euiTheme.colors.emptyShade,
            borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
            ...(compressed
                ? {
                    height: "24px",
                    minHeight: "24px",
                    maxHeight: "24px",
                }
                : {}),
            padding: compressed ? "0px 8px" : "6px 12px",
            borderRadius: "0",
            flexShrink: 0,
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    gap: compressed ? "8px" : "12px",
                }, children: [!compressed && ((0, jsx_runtime_1.jsxs)("span", { children: [lineCount, " line", lineCount !== 1 ? "s" : ""] })), (0, jsx_runtime_1.jsx)("span", { children: "@timestamp found" }), (0, jsx_runtime_1.jsx)("span", { children: "LIMIT 1000 rows" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [onQuickEdit && ((0, jsx_runtime_1.jsxs)("button", { onClick: onQuickEdit, style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            height: "18px",
                            padding: "0 8px",
                            border: "none",
                            background: "transparent",
                            color: euiTheme.colors.primaryText,
                            fontSize: "12px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            outline: "none",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Quick edit" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", fontSize: "11px", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)("span", { children: "(" }), (0, jsx_runtime_1.jsx)(phosphor_react_1.Command, { size: 13 }), (0, jsx_runtime_1.jsx)(phosphor_react_1.ArrowFatUp, { size: 13 }), (0, jsx_runtime_1.jsx)("span", { children: "K)" })] })] })), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { style: {
                            height: "18px",
                        }, flush: "right", size: "xs", iconType: "plusInCircle", children: "Add control" }), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { style: {
                            height: "18px",
                        }, flush: "right", size: "xs", iconType: "comment", children: "Feedback" }), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { style: {
                            height: "18px",
                        }, size: "xs", flush: "right", iconType: "starFilled", children: "Starred" }), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { style: {
                            height: "18px",
                        }, size: "xs", flush: "right", iconType: "clockCounter", children: "History" })] })] }));
};
exports.EditorFooter = EditorFooter;
//# sourceMappingURL=EditorFooter.js.map