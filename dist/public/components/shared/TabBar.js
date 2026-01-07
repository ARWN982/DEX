"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const TabBar = ({ tabTitle = "Incident #4824", onTabClose, showActions = true, backgroundColor, rowBackgroundColor, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const tabBackgroundColor = backgroundColor || euiTheme.colors.backgroundBasePlain;
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingLeft: "8px",
            paddingRight: "8px",
            paddingBottom: "0px",
            // borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
            backgroundColor: rowBackgroundColor,
            height: "44px",
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    display: "flex",
                    alignItems: "flex-end",
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: { width: "8px", height: "8px" }, children: (0, jsx_runtime_1.jsx)("svg", { width: "8", height: "8", viewBox: "0 0 8 8", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { display: "block" }, children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M0 8L8 8L8 0C8 4.41716 4.41859 7.99818 0 8Z", fill: tabBackgroundColor }) }) }), (0, jsx_runtime_1.jsxs)("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "5px 12px",
                            backgroundColor: tabBackgroundColor,
                            borderLeft: "none",
                            borderRight: "none",
                            borderBottom: "none",
                            borderRadius: "8px 8px 0 0",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: euiTheme.colors.text,
                        }, children: [(0, jsx_runtime_1.jsx)("span", { children: tabTitle }), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "cross", "aria-label": "Close tab", size: "xs", color: "text", style: { minWidth: "14px", minHeight: "14px" }, onClick: onTabClose })] }), (0, jsx_runtime_1.jsx)("div", { style: { width: "8px", height: "8px" }, children: (0, jsx_runtime_1.jsx)("svg", { width: "8", height: "8", viewBox: "0 0 8 8", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { display: "block" }, children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M8 8L1.2813e-07 8L1.2813e-07 0C1.2813e-07 4.41716 3.58141 7.99818 8 8Z", fill: tabBackgroundColor }) }) })] }), showActions && ((0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { gutterSize: "s", alignItems: "center", justifyContent: "flexEnd", children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiButtonEmpty, { size: "s", "aria-label": "Inspect", children: [" ", "Inspect", " "] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "s", "aria-label": "Share", children: "Share" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "s", "aria-label": "Open", children: "Open" }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "s", "aria-label": "Save", children: "Save" }) })] }))] }));
};
exports.TabBar = TabBar;
//# sourceMappingURL=TabBar.js.map