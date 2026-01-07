"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVisorWidget = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const view_1 = require("@codemirror/view");
const eui_1 = require("@elastic/eui");
const phosphor_react_1 = require("phosphor-react");
const createVisorWidget = ({ onClose, onSubmit, euiTheme, isDarkMode, display = 'multiLine' }) => {
    class VisorWidget extends view_1.WidgetType {
        root = null;
        toDOM() {
            const container = document.createElement("div");
            const isSingleLine = display === 'singleLine';
            container.style.cssText = `
        width: ${isSingleLine ? '600px' : '500px'};
        height: ${isSingleLine ? '32px' : '60px'};
        padding: ${isSingleLine ? '0' : '4px'};
        background: ${euiTheme.colors.emptyShade};
        border: 1px solid ${euiTheme.colors.borderBaseSubdued};
        border-radius: 6px;
        margin: 4px 0;
        box-shadow: ${isDarkMode ? "0 4px 16px rgba(0, 0, 0, 0.4)" : "0 4px 16px rgba(0, 0, 0, 0.15)"};
        box-sizing: border-box;
        display: block;
      `;
            // Create React root and render
            this.root = (0, client_1.createRoot)(container);
            const VisorContent = () => {
                const [inputValue, setInputValue] = react_1.default.useState("");
                const inputRef = react_1.default.useRef(null);
                const [isPopoverOpen, setIsPopoverOpen] = react_1.default.useState(false);
                const [selectedLanguage, setSelectedLanguage] = react_1.default.useState("Natural language");
                react_1.default.useEffect(() => {
                    // Focus input on mount
                    inputRef.current?.focus();
                }, []);
                react_1.default.useEffect(() => {
                    // Close popover when clicking outside
                    const handleClickOutside = (e) => {
                        const target = e.target;
                        if (!target.closest('[data-popover-container]')) {
                            setIsPopoverOpen(false);
                        }
                    };
                    if (isPopoverOpen) {
                        document.addEventListener('mousedown', handleClickOutside);
                    }
                    return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                    };
                }, [isPopoverOpen]);
                const handleSubmit = () => {
                    if (inputValue.trim()) {
                        onSubmit(inputValue, selectedLanguage);
                        setInputValue("");
                        // Keep visor open after inserting code
                    }
                };
                const handleKeyDown = (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                    else if (e.key === "Escape") {
                        onClose();
                    }
                };
                // Render single line layout
                if (isSingleLine) {
                    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", height: "100%" }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsPopoverOpen(!isPopoverOpen), style: {
                                            height: "100%",
                                            padding: "0 12px",
                                            border: "none",
                                            borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                                            borderRadius: "6px 0 0 6px",
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
                                        }, children: [selectedLanguage, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s" })] }), isPopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
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
                                                setIsPopoverOpen(false);
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
                                            }, children: lang }, lang))) }))] }), (0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: "Ask about your data", style: {
                                    flex: 1,
                                    height: "100%",
                                    padding: "0 12px",
                                    border: "none",
                                    fontSize: "13px",
                                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                                    backgroundColor: "transparent",
                                    color: euiTheme.colors.text,
                                    outline: "none",
                                } }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSubmit, disabled: !inputValue.trim(), style: {
                                    height: "100%",
                                    padding: "0 12px",
                                    border: "none",
                                    borderLeft: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
                                    borderRadius: "0 6px 6px 0",
                                    backgroundColor: "transparent",
                                    cursor: inputValue.trim() ? "pointer" : "not-allowed",
                                    opacity: inputValue.trim() ? 1 : 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }, "aria-label": "Send", children: (0, jsx_runtime_1.jsx)(phosphor_react_1.ArrowUp, { size: 14, color: euiTheme.colors.text, weight: "bold" }) })] }));
                }
                // Render multi-line layout
                return ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [(0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: "Ask about your data", style: {
                                        flex: 1,
                                        padding: "6px 10px",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                                        backgroundColor: "transparent",
                                        color: euiTheme.colors.text,
                                        outline: "none",
                                    } }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, style: {
                                        width: "16px",
                                        height: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        color: euiTheme.colors.textSubdued,
                                        fontSize: "14px",
                                        lineHeight: "1",
                                    }, "aria-label": "Close", children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { position: "relative" }, "data-popover-container": true, children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsPopoverOpen(!isPopoverOpen), style: {
                                                padding: "4px 8px",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                                                backgroundColor: euiTheme.colors.backgroundBasePlain,
                                                color: euiTheme.colors.text,
                                                outline: "none",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }, children: [selectedLanguage, (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "arrowDown", size: "s" })] }), isPopoverOpen && ((0, jsx_runtime_1.jsx)("div", { style: {
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
                                                    setIsPopoverOpen(false);
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
                                                }, children: lang }, lang))) }))] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSubmit, disabled: !inputValue.trim(), style: {
                                        width: "20px",
                                        height: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: euiTheme.colors.backgroundBaseFormsControlDisabled,
                                        border: "none",
                                        borderRadius: "50%",
                                        cursor: inputValue.trim() ? "pointer" : "not-allowed",
                                        opacity: inputValue.trim() ? 1 : 0.5,
                                        flexShrink: 0,
                                    }, "aria-label": "Send", children: (0, jsx_runtime_1.jsx)(phosphor_react_1.ArrowUp, { size: 14, color: isDarkMode ? "#FFFFFF" : "#000000", weight: "bold" }) })] })] }));
            };
            this.root.render((0, jsx_runtime_1.jsx)(VisorContent, {}));
            return container;
        }
        destroy() {
            if (this.root) {
                this.root.unmount();
            }
        }
    }
    return VisorWidget;
};
exports.createVisorWidget = createVisorWidget;
//# sourceMappingURL=VisorWidget.js.map