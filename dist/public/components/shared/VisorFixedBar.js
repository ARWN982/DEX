"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisorFixedBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const eui_1 = require("@elastic/eui");
const VisorFixedBar = ({ onSubmit, currentDataSource = "logs-*" }) => {
    const { euiTheme, colorMode } = (0, eui_1.useEuiTheme)();
    const isDarkMode = colorMode === "DARK";
    const [inputValue, setInputValue] = (0, react_1.useState)("");
    const inputRef = (0, react_1.useRef)(null);
    const [isLanguagePopoverOpen, setIsLanguagePopoverOpen] = (0, react_1.useState)(false);
    const [isDataSourcePopoverOpen, setIsDataSourcePopoverOpen] = (0, react_1.useState)(false);
    const [selectedLanguage, setSelectedLanguage] = (0, react_1.useState)("Natural language");
    const [selectedDataSource, setSelectedDataSource] = (0, react_1.useState)(currentDataSource);
    // Update selected data source when prop changes
    (0, react_1.useEffect)(() => {
        setSelectedDataSource(currentDataSource);
    }, [currentDataSource]);
    // Common data sources
    const dataSources = ["logs-*", "metrics-*", "traces-*", "filebeat-*", "metricbeat-*"];
    (0, react_1.useEffect)(() => {
        // Close popovers when clicking outside
        const handleClickOutside = (e) => {
            const target = e.target;
            if (!target.closest('[data-popover-container]')) {
                setIsLanguagePopoverOpen(false);
                setIsDataSourcePopoverOpen(false);
            }
        };
        if (isLanguagePopoverOpen || isDataSourcePopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLanguagePopoverOpen, isDataSourcePopoverOpen]);
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) {
                onSubmit(inputValue, selectedLanguage, selectedDataSource);
                setInputValue("");
            }
        }
    };
    // Gradient border style for Natural language mode
    const gradientBorder = selectedLanguage === "Natural language" ? {
        background: isDarkMode
            ? "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)"
            : "linear-gradient(107.9deg, #0B64DD 21.85%, #FF27A5 98.82%)",
        borderRadius: "6px",
        padding: "1px",
        width: "600px",
        height: "32px",
    } : null;
    const innerContainerStyle = {
        width: selectedLanguage === "Natural language" ? "100%" : "600px",
        height: selectedLanguage === "Natural language" ? "30px" : "32px",
        padding: "0",
        background: euiTheme.colors.emptyShade,
        border: selectedLanguage === "Natural language" ? "none" : `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        borderRadius: selectedLanguage === "Natural language" ? "5px" : "6px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
    };
    const content = ((0, jsx_runtime_1.jsxs)("div", { style: innerContainerStyle, children: [(0, jsx_runtime_1.jsx)("style", { children: `
          .gradient-sparkles-icon-visor svg path {
            fill: url(#sparkles-gradient-visor) !important;
          }
        ` }), (0, jsx_runtime_1.jsx)("svg", { width: "0", height: "0", style: { position: "absolute" }, children: (0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsx)("linearGradient", { id: "sparkles-gradient-visor", x1: isDarkMode ? "18.35%" : "21.85%", y1: "0%", x2: isDarkMode ? "112.9%" : "98.82%", y2: "100%", gradientUnits: "objectBoundingBox", children: isDarkMode ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("stop", { offset: "18.35%", stopColor: "#61A2FF" }), (0, jsx_runtime_1.jsx)("stop", { offset: "51.95%", stopColor: "#8A82E8" }), (0, jsx_runtime_1.jsx)("stop", { offset: "88.68%", stopColor: "#D846BB" }), (0, jsx_runtime_1.jsx)("stop", { offset: "112.9%", stopColor: "#FF27A5" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("stop", { offset: "21.85%", stopColor: "#0B64DD" }), (0, jsx_runtime_1.jsx)("stop", { offset: "98.82%", stopColor: "#FF27A5" })] })) }) }) }), (0, jsx_runtime_1.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsLanguagePopoverOpen(!isLanguagePopoverOpen), style: {
                            height: "100%",
                            padding: "0 12px",
                            border: "none",
                            borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                            borderRadius: selectedLanguage === "KQL" ? "6px 0 0 6px" : "6px 0 0 6px",
                            fontSize: "12px",
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                            backgroundColor: "transparent",
                            color: selectedLanguage === "Natural language" ? euiTheme.colors.primary : euiTheme.colors.text,
                            outline: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                        }, children: [selectedLanguage === "Natural language" && ((0, jsx_runtime_1.jsx)("div", { className: "gradient-sparkles-icon-visor", children: (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "sparkles", size: "s" }) })), selectedLanguage, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s", color: selectedLanguage === "Natural language" ? euiTheme.colors.primary : undefined })] }), isLanguagePopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            backgroundColor: euiTheme.colors.emptyShade,
                            border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                            borderRadius: "6px",
                            padding: "4px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                            zIndex: 10000,
                            minWidth: "140px",
                        }, children: ["Natural language", "KQL", "PromQL"].map((lang) => ((0, jsx_runtime_1.jsx)("div", { onClick: () => {
                                setSelectedLanguage(lang);
                                setIsLanguagePopoverOpen(false);
                            }, style: {
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                                cursor: "pointer",
                                borderRadius: "4px",
                                color: euiTheme.colors.text,
                                backgroundColor: selectedLanguage === lang ? euiTheme.colors.backgroundBaseSubdued : "transparent",
                            }, onMouseEnter: (e) => {
                                if (selectedLanguage !== lang) {
                                    e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
                                }
                            }, onMouseLeave: (e) => {
                                if (selectedLanguage !== lang) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }, children: lang }, lang))) }))] }), selectedLanguage === "KQL" && ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen), style: {
                            height: "100%",
                            padding: "0 12px",
                            border: "none",
                            borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                            fontSize: "12px",
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                            backgroundColor: "transparent",
                            color: euiTheme.colors.text,
                            outline: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                        }, children: [selectedDataSource, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s" })] }), isDataSourcePopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            backgroundColor: euiTheme.colors.emptyShade,
                            border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                            borderRadius: "6px",
                            padding: "4px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                            zIndex: 10000,
                            minWidth: "140px",
                        }, children: dataSources.map((source) => ((0, jsx_runtime_1.jsx)("div", { onClick: () => {
                                setSelectedDataSource(source);
                                setIsDataSourcePopoverOpen(false);
                            }, style: {
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                                cursor: "pointer",
                                borderRadius: "4px",
                                color: euiTheme.colors.text,
                                backgroundColor: selectedDataSource === source ? euiTheme.colors.backgroundBaseSubdued : "transparent",
                            }, onMouseEnter: (e) => {
                                if (selectedDataSource !== source) {
                                    e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
                                }
                            }, onMouseLeave: (e) => {
                                if (selectedDataSource !== source) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }, children: source }, source))) }))] })), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: selectedLanguage === "KQL" ? "Search" : "Ask about your data...", style: {
                    flex: 1,
                    height: "100%",
                    padding: "0 12px",
                    border: "none",
                    borderRadius: "0 6px 6px 0",
                    fontSize: "13px",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                    backgroundColor: "transparent",
                    color: euiTheme.colors.text,
                    outline: "none",
                } })] }));
    // Wrap with gradient border if Natural language is selected
    return gradientBorder ? ((0, jsx_runtime_1.jsx)("div", { style: gradientBorder, children: content })) : content;
};
exports.VisorFixedBar = VisorFixedBar;
//# sourceMappingURL=VisorFixedBar.js.map