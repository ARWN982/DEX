"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisorHex = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const eui_1 = require("@elastic/eui");
const VisorHex = ({ isDarkMode, euiTheme, onClose, onSubmit, currentDataSource = "logs-*", isGenerating = false }) => {
    const [inputValue, setInputValue] = (0, react_1.useState)("");
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
            if (inputValue.trim() && onSubmit) {
                onSubmit(inputValue, selectedLanguage, selectedDataSource);
                setInputValue("");
            }
        }
    };
    // Theme-aware colors
    const borderColor = euiTheme?.colors?.borderBaseSubdued || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)');
    const bgColor = euiTheme?.colors?.emptyShade || (isDarkMode ? '#1D1E24' : '#FFFFFF');
    const iconColor = euiTheme?.colors?.primary || '#6B5FD6';
    const boxShadow = isDarkMode
        ? '0px 6px 14px 0px rgba(137, 157, 170, 0.28)'
        : '0px 6px 14px 0px rgba(11, 14, 22, 0.03)';
    // Gradient border style - always visible
    const gradientBorder = {
        background: isDarkMode
            ? "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)"
            : "linear-gradient(107.9deg, #0B64DD 21.85%, #FF27A5 98.82%)",
        borderRadius: "6px",
        padding: "1px",
        width: "50%",
        height: "32px",
        boxShadow: boxShadow,
        transition: "box-shadow 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
    };
    const innerContainerStyle = {
        width: "100%",
        height: "30px",
        padding: "0",
        background: bgColor,
        border: "none",
        borderRadius: "5px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        boxShadow: "none",
        transition: "box-shadow 0.15s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
    };
    // Generating state content
    const generatingContent = ((0, jsx_runtime_1.jsxs)("div", { style: innerContainerStyle, children: [(0, jsx_runtime_1.jsx)("style", { children: `
          @keyframes dotPulse {
            0%, 20% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.3;
            }
          }
          .generating-dot {
            display: inline-block;
            animation: dotPulse 1.4s infinite;
          }
          .generating-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .generating-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        ` }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    fontSize: "13px",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                    color: iconColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    paddingLeft: "12px",
                }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Generating" }), (0, jsx_runtime_1.jsx)("span", { className: "generating-dot", children: "." }), (0, jsx_runtime_1.jsx)("span", { className: "generating-dot", children: "." }), (0, jsx_runtime_1.jsx)("span", { className: "generating-dot", children: "." })] })] }));
    const content = ((0, jsx_runtime_1.jsxs)("div", { style: innerContainerStyle, children: [(0, jsx_runtime_1.jsx)("style", { children: `
          .gradient-sparkles-icon-visor svg path {
            fill: url(#sparkles-gradient-visor) !important;
          }
        ` }), (0, jsx_runtime_1.jsx)("svg", { width: "0", height: "0", style: { position: "absolute" }, children: (0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsx)("linearGradient", { id: "sparkles-gradient-visor", x1: isDarkMode ? "18.35%" : "21.85%", y1: "0%", x2: isDarkMode ? "112.9%" : "98.82%", y2: "100%", gradientUnits: "objectBoundingBox", children: isDarkMode ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("stop", { offset: "18.35%", stopColor: "#61A2FF" }), (0, jsx_runtime_1.jsx)("stop", { offset: "51.95%", stopColor: "#8A82E8" }), (0, jsx_runtime_1.jsx)("stop", { offset: "88.68%", stopColor: "#D846BB" }), (0, jsx_runtime_1.jsx)("stop", { offset: "112.9%", stopColor: "#FF27A5" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("stop", { offset: "21.85%", stopColor: "#0B64DD" }), (0, jsx_runtime_1.jsx)("stop", { offset: "98.82%", stopColor: "#FF27A5" })] })) }) }) }), (0, jsx_runtime_1.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsLanguagePopoverOpen(!isLanguagePopoverOpen), style: {
                            height: "100%",
                            padding: "0 12px",
                            border: "none",
                            borderRight: `1px solid ${borderColor}`,
                            borderRadius: selectedLanguage === "KQL" ? "6px 0 0 6px" : "6px 0 0 6px",
                            fontSize: "12px",
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                            backgroundColor: "transparent",
                            color: selectedLanguage === "Natural language"
                                ? iconColor
                                : (selectedLanguage === "KQL" || selectedLanguage === "PromQL")
                                    ? euiTheme?.colors?.textPrimary
                                    : euiTheme?.colors?.text,
                            outline: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                        }, children: [selectedLanguage === "Natural language" && ((0, jsx_runtime_1.jsx)("div", { className: "gradient-sparkles-icon-visor", children: (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "sparkles", size: "s" }) })), selectedLanguage, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s", color: selectedLanguage === "Natural language"
                                    ? iconColor
                                    : (selectedLanguage === "KQL" || selectedLanguage === "PromQL")
                                        ? euiTheme?.colors?.textPrimary
                                        : undefined })] }), isLanguagePopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
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
                                color: euiTheme?.colors?.text,
                                backgroundColor: selectedLanguage === lang ? euiTheme?.colors?.backgroundBaseSubdued : "transparent",
                            }, onMouseEnter: (e) => {
                                if (selectedLanguage !== lang) {
                                    e.currentTarget.style.backgroundColor = euiTheme?.colors?.backgroundBaseSubdued;
                                }
                            }, onMouseLeave: (e) => {
                                if (selectedLanguage !== lang) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }, children: lang }, lang))) }))] }), (selectedLanguage === "KQL" || selectedLanguage === "PromQL") && ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen), style: {
                            height: "100%",
                            padding: "0 12px",
                            border: "none",
                            borderRight: `1px solid ${borderColor}`,
                            fontSize: "12px",
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                            backgroundColor: "transparent",
                            color: euiTheme?.colors?.textPrimary,
                            outline: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                        }, children: [selectedDataSource, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s", color: euiTheme?.colors?.textPrimary })] }), isDataSourcePopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
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
                                color: euiTheme?.colors?.text,
                                backgroundColor: selectedDataSource === source ? euiTheme?.colors?.backgroundBaseSubdued : "transparent",
                            }, onMouseEnter: (e) => {
                                if (selectedDataSource !== source) {
                                    e.currentTarget.style.backgroundColor = euiTheme?.colors?.backgroundBaseSubdued;
                                }
                            }, onMouseLeave: (e) => {
                                if (selectedDataSource !== source) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }, children: source }, source))) }))] })), (0, jsx_runtime_1.jsx)("input", { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: selectedLanguage === "KQL" || selectedLanguage === "PromQL" ? "Search..." : "Ask about your data...", autoFocus: true, style: {
                    flex: 1,
                    height: "100%",
                    padding: "0 12px",
                    border: "none",
                    borderRadius: "0",
                    fontSize: "13px",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                    backgroundColor: "transparent",
                    color: euiTheme?.colors?.text,
                    outline: "none",
                } }), (0, jsx_runtime_1.jsx)("div", { style: { flexShrink: 0, padding: "0 4px" }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "cross", "aria-label": "Close", onClick: onClose, color: "text", size: "s" }) })] }));
    // Always wrap with gradient border
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            width: "100%",
            display: "flex",
            justifyContent: "center",
            animation: "slideUpFromBottom 0.15s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
            transformOrigin: "bottom",
        }, children: [(0, jsx_runtime_1.jsx)("style", { children: `
          @keyframes slideUpFromBottom {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        ` }), (0, jsx_runtime_1.jsx)("div", { style: gradientBorder, children: isGenerating ? generatingContent : content })] }));
};
exports.VisorHex = VisorHex;
//# sourceMappingURL=VisorHex.js.map