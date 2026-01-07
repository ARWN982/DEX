"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentingSystem = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useCommentStore_1 = require("../../store/useCommentStore");
const useVersionStore_1 = require("../../store/useVersionStore");
const CommentCreator_1 = require("./CommentCreator");
const CommentPin_1 = require("./CommentPin");
const CommentThread_1 = require("./CommentThread");
const CommentingSystem = ({ isEnabled = true, onModeChange, onExitCommentingMode, }) => {
    const { currentVersion } = (0, useVersionStore_1.useVersionStore)();
    const { threads, activeThreadId, isCreatingComment, pendingPosition, getVisibleThreads, createThread, addComment, resolveThread, setActiveThread, startCreating, cancelCreating, setCurrentVersion, loadComments, } = (0, useCommentStore_1.useCommentStore)();
    const systemRef = (0, react_1.useRef)(null);
    // Sync comments when version changes and reload comments for new version
    (0, react_1.useEffect)(() => {
        // Only load if commenting is enabled to avoid unnecessary loads
        if (isEnabled) {
            loadComments(currentVersion);
        }
    }, [currentVersion, isEnabled]);
    // Handle commenting mode changes
    (0, react_1.useEffect)(() => {
        if (!isEnabled) {
            // When commenting mode is disabled, cancel any active comment creation
            if (isCreatingComment) {
                console.log('CommentingSystem disabled - canceling active comment creation');
                cancelCreating();
            }
            // Also close any active thread
            if (activeThreadId) {
                setActiveThread(null);
            }
        }
    }, [isEnabled, isCreatingComment, activeThreadId, cancelCreating, setActiveThread]);
    // Handle click to create comment
    const handleContainerClick = (0, react_1.useCallback)((e) => {
        if (!isEnabled)
            return;
        // Don't create comment if clicking on existing comment UI or excluded areas
        const target = e.target;
        if (target.closest("[data-comment-ui]") ||
            target.closest("[data-exclude-comments]")) {
            return;
        }
        // Use viewport coordinates directly for universal positioning
        const position = {
            x: e.clientX,
            y: e.clientY,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
        };
        // Close any existing thread and start creating new one
        setActiveThread(null);
        startCreating(position);
    }, [isEnabled, setActiveThread, startCreating]);
    // Handle escape key to cancel actions
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (e.key === "Escape") {
            if (isCreatingComment) {
                cancelCreating();
            }
            else if (activeThreadId) {
                setActiveThread(null);
            }
            else if (isEnabled) {
                // Exit commenting mode if no active comment actions
                onExitCommentingMode?.();
            }
        }
    }, [
        isCreatingComment,
        activeThreadId,
        isEnabled,
        cancelCreating,
        setActiveThread,
        onExitCommentingMode,
    ]);
    // Set up event listeners
    (0, react_1.useEffect)(() => {
        if (isEnabled) {
            // Listen to the entire document for universal coverage
            document.addEventListener("click", handleContainerClick);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("click", handleContainerClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isEnabled, handleContainerClick, handleKeyDown]);
    // Notify parent of mode changes
    (0, react_1.useEffect)(() => {
        onModeChange?.(isCreatingComment);
    }, [isCreatingComment, onModeChange]);
    const visibleThreads = getVisibleThreads();
    // Calculate position for comment panels to avoid going off-screen
    const getCommentPanelPosition = (position) => {
        const panelWidth = 400; // Width for creator (400px) and thread (380px) - use max
        const panelHeight = 100; // Height for comment creator (much smaller)
        const margin = 16;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Position closer to click point with minimal offset
        let x = position.x + 8; // Small offset from click
        let y = position.y + 8; // Small offset below click
        // Adjust if panel would go off right edge
        if (x + panelWidth > viewportWidth - margin) {
            x = position.x - panelWidth - 8; // Position to the left instead
        }
        // Adjust if panel would go off bottom edge
        if (y + panelHeight > viewportHeight - margin) {
            y = position.y - panelHeight - 8; // Position above click instead
        }
        // Adjust if panel would go off top edge
        if (y < margin) {
            y = margin;
        }
        // Adjust if panel would go off left edge
        if (x < margin) {
            x = margin;
        }
        return { left: x, top: y };
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [isEnabled && ((0, jsx_runtime_1.jsx)("div", { ref: systemRef, style: {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    cursor: `url("data:image/svg+xml,%3csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg' style='background-color: transparent'%3e%3cg fill='none' stroke='%230d99ff' stroke-width='1'%3e%3cpath d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'/%3e%3c/g%3e%3c/svg%3e") 12 12, crosshair`,
                    backgroundColor: "rgba(13, 153, 255, 0.08)",
                    pointerEvents: "auto",
                    zIndex: 999,
                    transition: "all 0.2s ease",
                } })), (0, jsx_runtime_1.jsxs)("div", { style: {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    zIndex: 1000,
                }, children: [isEnabled && visibleThreads.map((thread) => ((0, jsx_runtime_1.jsx)("div", { "data-comment-ui": true, style: {
                            position: "absolute",
                            left: thread.position.x,
                            top: thread.position.y,
                            pointerEvents: "auto",
                        }, children: (0, jsx_runtime_1.jsx)(CommentPin_1.CommentPin, { thread: thread, isActive: thread.id === activeThreadId, onClick: () => {
                                setActiveThread(thread.id === activeThreadId ? null : thread.id);
                            } }) }, thread.id))), isEnabled && activeThreadId && threads[activeThreadId] && ((0, jsx_runtime_1.jsx)("div", { "data-comment-ui": true, children: (0, jsx_runtime_1.jsx)(CommentThread_1.CommentThread, { thread: threads[activeThreadId], onAddComment: (data) => addComment(activeThreadId, data.content, data.parentId), onResolveThread: () => resolveThread(activeThreadId), onClose: () => setActiveThread(null), style: {
                                ...getCommentPanelPosition(threads[activeThreadId].position),
                                pointerEvents: "auto",
                            } }) })), isCreatingComment && pendingPosition && ((0, jsx_runtime_1.jsx)("div", { "data-comment-ui": true, children: (0, jsx_runtime_1.jsx)(CommentCreator_1.CommentCreator, { position: pendingPosition, onCreateComment: (content) => createThread(pendingPosition, content), onCancel: cancelCreating, style: {
                                ...getCommentPanelPosition(pendingPosition),
                                pointerEvents: "auto",
                            } }) }))] })] }));
};
exports.CommentingSystem = CommentingSystem;
//# sourceMappingURL=CommentingSystem.js.map