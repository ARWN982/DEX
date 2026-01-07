"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentGenerator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const CommentGenerator = ({ editorElement, onGenerate, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    const [isPopoverOpen, setIsPopoverOpen] = (0, react_1.useState)(false);
    const [popoverPosition, setPopoverPosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const [currentComment, setCurrentComment] = (0, react_1.useState)("");
    const [currentLineNumber, setCurrentLineNumber] = (0, react_1.useState)(0);
    const popoverRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!editorElement)
            return;
        let checkTimeout;
        const checkCursorPosition = () => {
            if (checkTimeout) {
                clearTimeout(checkTimeout);
            }
            checkTimeout = setTimeout(() => {
                const selection = editorElement.ownerDocument.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    setIsPopoverOpen(false);
                    return;
                }
                const range = selection.getRangeAt(0);
                const cursorNode = range.startContainer;
                // Find the line element containing the cursor
                let lineElement = cursorNode.nodeType === Node.TEXT_NODE
                    ? cursorNode.parentElement
                    : cursorNode;
                // Traverse up to find the line container
                while (lineElement && !lineElement.classList.contains('cm-line')) {
                    lineElement = lineElement.parentElement;
                }
                if (lineElement && lineElement.classList.contains('cm-line')) {
                    const lineText = lineElement.textContent || "";
                    // Check if this line is a comment (with or without (*))
                    const isComment = /^\s*\/\//.test(lineText);
                    if (isComment) {
                        // Extract the comment text (remove the // or // (*) part)
                        let comment = "";
                        const modifiedCommentMatch = lineText.match(/^\s*\/\/\s*\(\*\)\s*(.+)$/);
                        const regularCommentMatch = lineText.match(/^\s*\/\/\s*(.+)$/);
                        if (modifiedCommentMatch) {
                            comment = modifiedCommentMatch[1];
                        }
                        else if (regularCommentMatch) {
                            comment = regularCommentMatch[1];
                        }
                        else {
                            comment = lineText;
                        }
                        setCurrentComment(comment);
                        // Get line number from the line element
                        // CodeMirror stores line numbers in elements with class 'cm-gutterElement'
                        let lineNum = 1; // Default to line 1
                        // Try to find the line number from the gutter element
                        const gutterElements = document.querySelectorAll('.cm-gutterElement');
                        for (const gutterEl of gutterElements) {
                            if (gutterEl.textContent && gutterEl.nextElementSibling === lineElement) {
                                lineNum = parseInt(gutterEl.textContent.trim());
                                break;
                            }
                        }
                        // Alternative: check if previousSibling has line number
                        if (lineNum === 1 && lineElement.previousElementSibling?.textContent) {
                            const parsedNum = parseInt(lineElement.previousElementSibling.textContent.trim());
                            if (parsedNum && parsedNum > 0) {
                                lineNum = parsedNum;
                            }
                        }
                        console.log("Detected line number:", lineNum);
                        setCurrentLineNumber(lineNum);
                        // Position the popover at the end of the actual text, not the line element
                        // Create a range that selects the entire line text
                        const textRange = document.createRange();
                        textRange.selectNodeContents(lineElement);
                        const textRect = textRange.getBoundingClientRect();
                        // Get the actual end position of the text
                        // Use the text bounding box which will be narrower than the line element
                        setPopoverPosition({
                            x: textRect.right + 10,
                            y: textRect.top + textRect.height / 2,
                        });
                        setIsPopoverOpen(true);
                    }
                    else {
                        setIsPopoverOpen(false);
                    }
                }
                else {
                    setIsPopoverOpen(false);
                }
            }, 1500); // Wait 1.5 seconds after user stops typing before showing popover
        };
        const handleClickOutside = (event) => {
            if (popoverRef.current &&
                popoverRef.current.contains(event.target)) {
                return;
            }
            // Don't close immediately to allow clicking
        };
        // Listen for cursor movement
        editorElement.addEventListener("click", checkCursorPosition);
        editorElement.addEventListener("keyup", checkCursorPosition);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            editorElement.removeEventListener("click", checkCursorPosition);
            editorElement.removeEventListener("keyup", checkCursorPosition);
            document.removeEventListener("mousedown", handleClickOutside);
            if (checkTimeout) {
                clearTimeout(checkTimeout);
            }
        };
    }, [editorElement]);
    // Handle Cmd+R keyboard shortcut
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'r' && isPopoverOpen) {
                event.preventDefault();
                handleGenerateClick();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPopoverOpen, currentComment, currentLineNumber]);
    const handleGenerateClick = () => {
        if (currentComment && onGenerate) {
            onGenerate(currentComment, currentLineNumber);
        }
        setIsPopoverOpen(false);
    };
    if (!isPopoverOpen || !currentComment) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("div", { ref: popoverRef, style: {
            position: "fixed",
            left: popoverPosition.x,
            top: popoverPosition.y,
            zIndex: 9999,
            pointerEvents: "auto",
        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPopover, { button: (0, jsx_runtime_1.jsx)("div", { style: { display: "none" } }), isOpen: true, closePopover: () => { }, panelPaddingSize: "s", anchorPosition: "rightCenter", hasArrow: false, repositionOnScroll: true, ownFocus: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonEmpty, { size: "xs", iconType: "sparkles", onClick: handleGenerateClick, color: "text", children: "Generate (Cmd+Enter)" }) }) }));
};
exports.CommentGenerator = CommentGenerator;
//# sourceMappingURL=CommentGenerator.js.map