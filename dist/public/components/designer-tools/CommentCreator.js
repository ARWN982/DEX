"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentCreator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const CommentCreator = ({ position, onCreateComment, onCancel, style = {}, }) => {
    const [content, setContent] = (0, react_1.useState)("");
    const textAreaRef = (0, react_1.useRef)(null);
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    (0, react_1.useEffect)(() => {
        // Auto-focus the textarea when the component mounts
        if (textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, []);
    const handleSubmit = () => {
        if (content.trim()) {
            onCreateComment(content.trim());
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            onCancel();
        }
        else if (e.key === "Enter" &&
            (e.metaKey || e.ctrlKey) &&
            content.trim()) {
            // Cmd/Ctrl + Enter to submit
            e.preventDefault();
            handleSubmit();
        }
    };
    const creatorStyle = {
        position: "absolute",
        zIndex: 1002,
        ...style,
    };
    // Get design UI colors (follows main app theme)
    const colors = (0, designToolsColors_1.getDesignUIColors)(colorMode);
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            ...creatorStyle,
            width: "400px",
            backgroundColor: colors.primary,
            border: "none",
            borderRadius: "24px",
            boxShadow: (0, designToolsColors_1.createBoxShadow)(colors, "medium"),
            paddingInlineStart: "16px",
            paddingBlock: "8px",
            paddingInlineEnd: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
        }, children: [(0, jsx_runtime_1.jsx)("input", { ref: textAreaRef, type: "text", style: {
                    flex: 1,
                    padding: "0",
                    backgroundColor: "transparent",
                    border: "none",
                    color: colors.textPrimary,
                    fontSize: "12px",
                    outline: "none",
                    fontFamily: "inherit",
                }, placeholder: "Add a comment", value: content, onChange: (e) => setContent(e.target.value), onKeyDown: handleKeyDown }), (0, jsx_runtime_1.jsx)("button", { style: {
                    width: "32px",
                    height: "32px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: content.trim() ? "pointer" : "not-allowed",
                    color: content.trim() ? colors.primaryButton : colors.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    padding: "0",
                }, onClick: handleSubmit, disabled: !content.trim(), children: (0, jsx_runtime_1.jsx)(phosphor_react_1.PaperPlaneRight, { size: 20, weight: "fill" }) })] }));
};
exports.CommentCreator = CommentCreator;
//# sourceMappingURL=CommentCreator.js.map