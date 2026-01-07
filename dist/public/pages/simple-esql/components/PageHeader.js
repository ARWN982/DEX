"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const PageHeader = ({ onSave, onShare, onInspect, }) => {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", alignItems: "center", justifyContent: "flexEnd", style: { padding: "8px" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { color: "text", size: "s", onClick: onSave, children: "Share" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { color: "text", size: "s", onClick: onSave, children: "Export" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { color: "text", size: "s", onClick: onSave, children: "Open" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButton, { color: "text", size: "s", onClick: onSave, children: "Save" }) })] }), (0, jsx_runtime_1.jsx)(eui_1.EuiHorizontalRule, { margin: "none" })] }));
};
exports.PageHeader = PageHeader;
//# sourceMappingURL=PageHeader.js.map