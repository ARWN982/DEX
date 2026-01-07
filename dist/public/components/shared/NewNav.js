"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewNav = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const NewNav = ({ activeItem, onItemClick, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const navItems = [
        {
            id: "discover",
            iconType: "discoverApp",
            label: "Discover",
        },
        {
            id: "dashboard",
            iconType: "dashboardApp",
            label: "Dashboard",
        },
        {
            id: "visualize",
            iconType: "visualizeApp",
            label: "Visualize",
        },
        {
            id: "ml",
            iconType: "machineLearningApp",
            label: "Machine Learning",
        },
        {
            id: "graph",
            iconType: "graphApp",
            label: "Graph",
        },
        {
            id: "logs",
            iconType: "logsApp",
            label: "Logs",
        },
        {
            id: "apm",
            iconType: "apmApp",
            label: "APM",
        },
        {
            id: "uptime",
            iconType: "uptimeApp",
            label: "Uptime",
        },
        {
            id: "siem",
            iconType: "securityApp",
            label: "Security",
        },
        {
            id: "monitoring",
            iconType: "monitoringApp",
            label: "Monitoring",
        },
        {
            id: "management",
            iconType: "managementApp",
            label: "Management",
        },
    ];
    const handleItemClick = (itemId) => {
        if (onItemClick) {
            onItemClick(itemId);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            width: "48px",
            height: "100vh",
            // backgroundColor: euiTheme.colors.lightestShade,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "8px",
            paddingBottom: "8px",
            gap: "4px",
            flexShrink: 0,
        }, children: [(0, jsx_runtime_1.jsx)("div", { style: { paddingBottom: euiTheme.size.xs, marginBottom: euiTheme.size.xs }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "logoObservability", size: "l" }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                    width: "100%",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    marginBottom: euiTheme.size.xs,
                }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                        width: "24px",
                        height: "1px",
                        backgroundColor: euiTheme.colors.borderBaseSubdued,
                    } }) }), navItems.map((item) => ((0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: item.iconType, "aria-label": item.label, title: item.label, size: "s", color: activeItem === item.id ? "primary" : "text", onClick: () => handleItemClick(item.id), disabled: item.disabled, display: activeItem === item.id ? "base" : "empty" }, item.id)))] }));
};
exports.NewNav = NewNav;
//# sourceMappingURL=NewNav.js.map