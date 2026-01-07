"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentThread = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const dateUtils_1 = require("../../utils/dateUtils");
const CommentItem = ({ comment, isFirst, textColor, secondaryTextColor, }) => {
    const timeAgo = (0, dateUtils_1.getTimeAgo)(comment.createdAt);
    const authorInitials = comment.author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2); // Limit to first 2 characters
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "12px", marginBottom: "16px" }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: comment.author.color || "#0d99ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "white",
                    flexShrink: 0,
                }, children: authorInitials }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "4px",
                        }, children: [(0, jsx_runtime_1.jsx)("span", { style: { color: textColor, fontSize: "14px", fontWeight: 500 }, children: comment.author.name }), (0, jsx_runtime_1.jsx)("span", { style: { color: secondaryTextColor, fontSize: "12px" }, children: timeAgo })] }), (0, jsx_runtime_1.jsx)("p", { style: {
                            color: textColor,
                            fontSize: "14px",
                            lineHeight: "1.5",
                            margin: 0,
                        }, children: comment.content })] })] }));
};
const CommentThread = ({ thread, onAddComment, onResolveThread, onClose, style = {}, }) => {
    const [replyContent, setReplyContent] = (0, react_1.useState)("");
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    // Get current user from comment store for reply avatar
    const getCurrentUser = () => {
        // This should match the user from comment store
        return {
            name: 'Andre Del Rio',
            color: '#ff6b6b'
        };
    };
    const currentUser = getCurrentUser();
    const currentUserInitials = currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2); // Limit to first 2 characters
    const handleSubmitReply = () => {
        if (replyContent.trim()) {
            console.log("Submitting reply:", replyContent.trim());
            onAddComment({ content: replyContent.trim() });
            setReplyContent("");
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            onClose();
        }
        else if (e.key === "Enter" &&
            (e.metaKey || e.ctrlKey) &&
            replyContent.trim()) {
            e.preventDefault();
            handleSubmitReply();
        }
    };
    const threadStyle = {
        position: "absolute",
        zIndex: 1001,
        ...style,
    };
    // Get design UI colors (follows main app theme)
    const colors = (0, designToolsColors_1.getDesignUIColors)(colorMode);
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            ...threadStyle,
            width: "380px",
            backgroundColor: colors.primary,
            border: "none",
            borderRadius: "16px",
            boxShadow: (0, designToolsColors_1.createBoxShadow)(colors, "medium"),
            color: colors.textPrimary,
        }, onKeyDown: handleKeyDown, tabIndex: -1, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px",
                    borderBottom: `1px solid ${colors.border}`,
                }, children: [(0, jsx_runtime_1.jsxs)("h3", { style: {
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 600,
                            color: colors.textPrimary,
                        }, children: ["Comments (", thread.comments.length, ")"] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [(0, jsx_runtime_1.jsx)("button", { style: {
                                    padding: "4px",
                                    border: "none",
                                    borderRadius: "4px",
                                    backgroundColor: "transparent",
                                    color: thread.status === "resolved"
                                        ? colors.textMuted
                                        : colors.textSecondary,
                                    cursor: thread.status === "resolved" ? "not-allowed" : "pointer",
                                }, onClick: onResolveThread, disabled: thread.status === "resolved", title: thread.status === "resolved" ? "Resolved" : "Mark as resolved", children: (0, jsx_runtime_1.jsx)(phosphor_react_1.Check, { size: 16, weight: "bold" }) }), (0, jsx_runtime_1.jsx)("button", { style: {
                                    padding: "4px",
                                    border: "none",
                                    borderRadius: "4px",
                                    backgroundColor: "transparent",
                                    color: colors.textSecondary,
                                    cursor: "pointer",
                                }, onClick: onClose, title: "Close", children: (0, jsx_runtime_1.jsx)(phosphor_react_1.X, { size: 16, weight: "bold" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: "16px", maxHeight: "256px", overflowY: "auto" }, children: thread.comments.map((comment, index) => ((0, jsx_runtime_1.jsx)(CommentItem, { comment: comment, isFirst: index === 0, textColor: colors.textPrimary, secondaryTextColor: colors.textSecondary }, comment.id))) }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    padding: "8px 16px 12px 16px",
                    borderTop: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: currentUser.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "white",
                            flexShrink: 0,
                        }, children: currentUserInitials }), (0, jsx_runtime_1.jsx)("input", { type: "text", style: {
                            flex: 1,
                            padding: "8px 12px",
                            backgroundColor: "transparent",
                            border: "none",
                            color: colors.textSecondary,
                            fontSize: "14px",
                            outline: "none",
                            fontFamily: "inherit",
                        }, placeholder: "Reply", value: replyContent, onChange: (e) => setReplyContent(e.target.value), onKeyDown: handleKeyDown, onClick: (e) => e.stopPropagation() }), (0, jsx_runtime_1.jsx)("button", { style: {
                            width: "32px",
                            height: "32px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: replyContent.trim() ? "pointer" : "not-allowed",
                            color: replyContent.trim() ? colors.primaryButton : colors.textMuted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            padding: "0",
                        }, onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubmitReply();
                        }, disabled: !replyContent.trim(), children: (0, jsx_runtime_1.jsx)(phosphor_react_1.PaperPlaneRight, { size: 16, weight: "fill" }) })] })] }));
};
exports.CommentThread = CommentThread;
//# sourceMappingURL=CommentThread.js.map