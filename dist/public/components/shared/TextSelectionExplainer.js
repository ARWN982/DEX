"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextSelectionExplainer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const TextSelectionExplainer = ({ onExplain, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const [selectedText, setSelectedText] = (0, react_1.useState)("");
    const [isPopoverOpen, setIsPopoverOpen] = (0, react_1.useState)(false);
    const [popoverPosition, setPopoverPosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const popoverRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        let selectionTimeout;
        const handleSelection = () => {
            const selection = window.getSelection();
            // Clear any existing timeout
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
            if (selection && selection.toString().trim().length > 0) {
                const text = selection.toString().trim();
                // Wait for 300ms after selection stops changing before showing popover
                selectionTimeout = setTimeout(() => {
                    const currentSelection = window.getSelection();
                    const currentText = currentSelection?.toString().trim();
                    // Only show if selection is still active and has meaningful content
                    if (currentSelection && currentText && currentText.length > 2) {
                        setSelectedText(currentText);
                        // Get the range and its bounding rectangle
                        if (currentSelection.rangeCount > 0) {
                            const range = currentSelection.getRangeAt(0);
                            const rect = range.getBoundingClientRect();
                            // Position the popover near the end of the selection
                            setPopoverPosition({
                                x: rect.right + 10,
                                y: rect.top + rect.height / 2,
                            });
                            setIsPopoverOpen(true);
                        }
                    }
                }, 300);
            }
            else {
                // Hide popover when selection is cleared
                setIsPopoverOpen(false);
                setSelectedText("");
            }
        };
        const handleClickOutside = (event) => {
            // Don't close if clicking on the popover itself
            if (popoverRef.current &&
                popoverRef.current.contains(event.target)) {
                return;
            }
            // Close popover when clicking outside
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.toString().trim().length === 0) {
                    setIsPopoverOpen(false);
                    setSelectedText("");
                }
            }, 100);
        };
        // Add event listeners
        document.addEventListener("selectionchange", handleSelection);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("selectionchange", handleSelection);
            document.removeEventListener("mousedown", handleClickOutside);
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
        };
    }, []);
    const handleExplainClick = () => {
        if (selectedText && onExplain) {
            onExplain(selectedText);
        }
        setIsPopoverOpen(false);
        setSelectedText("");
        // Clear the selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    };
    if (!isPopoverOpen || !selectedText) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("div", { ref: popoverRef, style: {
            position: "fixed",
            left: popoverPosition.x,
            top: popoverPosition.y,
            zIndex: 9999,
            pointerEvents: "auto",
        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPopover, { button: (0, jsx_runtime_1.jsx)("div", { style: { display: "none" } }), isOpen: true, closePopover: () => { }, panelPaddingSize: "s", anchorPosition: "rightCenter", hasArrow: false, repositionOnScroll: true, ownFocus: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "xs", iconType: "sparkles", onClick: handleExplainClick, color: "text", children: "Explain" }) }) }));
};
exports.TextSelectionExplainer = TextSelectionExplainer;
//# sourceMappingURL=TextSelectionExplainer.js.map