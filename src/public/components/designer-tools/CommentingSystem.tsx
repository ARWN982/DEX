import React, { useCallback, useEffect, useRef } from "react";
import { useCommentStore } from "../../store/useCommentStore";
import { useVersionStore } from "../../store/useVersionStore";
import { CommentPosition } from "../../types/comments";
import { CommentCreator } from "./CommentCreator";
import { CommentPin } from "./CommentPin";
import { CommentThread } from "./CommentThread";

interface CommentingSystemProps {
  // Whether commenting mode is enabled
  isEnabled?: boolean;
  // Optional callback when comment mode changes
  onModeChange?: (isCreating: boolean) => void;
  // Optional callback to exit commenting mode entirely
  onExitCommentingMode?: () => void;
}

export const CommentingSystem: React.FC<CommentingSystemProps> = ({
  isEnabled = true,
  onModeChange,
  onExitCommentingMode,
}) => {
  const { currentVersion } = useVersionStore();
  const {
    threads,
    activeThreadId,
    isCreatingComment,
    pendingPosition,
    getVisibleThreads,
    createThread,
    addComment,
    resolveThread,
    setActiveThread,
    startCreating,
    cancelCreating,
    setCurrentVersion,
    loadComments,
  } = useCommentStore();

  const systemRef = useRef<HTMLDivElement>(null);

  // Sync comments when version changes and reload comments for new version
  useEffect(() => {
    // Only load if commenting is enabled to avoid unnecessary loads
    if (isEnabled) {
      loadComments(currentVersion);
    }
  }, [currentVersion, isEnabled]);

  // Handle commenting mode changes
  useEffect(() => {
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
  const handleContainerClick = useCallback(
    (e: MouseEvent) => {
      if (!isEnabled) return;

      // Don't create comment if clicking on existing comment UI or excluded areas
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-comment-ui]") ||
        target.closest("[data-exclude-comments]")
      ) {
        return;
      }

      // Use viewport coordinates directly for universal positioning
      const position: CommentPosition = {
        x: e.clientX,
        y: e.clientY,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };

      // Close any existing thread and start creating new one
      setActiveThread(null);
      startCreating(position);
    },
    [isEnabled, setActiveThread, startCreating]
  );

  // Handle escape key to cancel actions
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCreatingComment) {
          cancelCreating();
        } else if (activeThreadId) {
          setActiveThread(null);
        } else if (isEnabled) {
          // Exit commenting mode if no active comment actions
          onExitCommentingMode?.();
        }
      }
    },
    [
      isCreatingComment,
      activeThreadId,
      isEnabled,
      cancelCreating,
      setActiveThread,
      onExitCommentingMode,
    ]
  );

  // Set up event listeners
  useEffect(() => {
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
  useEffect(() => {
    onModeChange?.(isCreatingComment);
  }, [isCreatingComment, onModeChange]);

  const visibleThreads = getVisibleThreads();

  // Calculate position for comment panels to avoid going off-screen
  const getCommentPanelPosition = (position: CommentPosition) => {
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

  return (
    <>
      {/* Background overlay with cursor when commenting mode is enabled */}
      {isEnabled && (
        <div
          ref={systemRef}
          style={{
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
          }}
        />
      )}

      {/* Comment UI container - always visible to show existing comments */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {/* Comment Pins - only show when commenting mode is enabled */}
        {isEnabled && visibleThreads.map((thread) => (
          <div
            key={thread.id}
            data-comment-ui
            style={{
              position: "absolute",
              left: thread.position.x,
              top: thread.position.y,
              pointerEvents: "auto",
            }}
          >
            <CommentPin
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => {
                setActiveThread(
                  thread.id === activeThreadId ? null : thread.id
                );
              }}
            />
          </div>
        ))}

        {/* Active Comment Thread - only show when commenting mode is enabled */}
        {isEnabled && activeThreadId && threads[activeThreadId] && (
          <div data-comment-ui>
            <CommentThread
              thread={threads[activeThreadId]}
              onAddComment={(data) =>
                addComment(activeThreadId, data.content, data.parentId)
              }
              onResolveThread={() => resolveThread(activeThreadId)}
              onClose={() => setActiveThread(null)}
              style={{
                ...getCommentPanelPosition(threads[activeThreadId].position),
                pointerEvents: "auto",
              }}
            />
          </div>
        )}

        {/* Comment Creator */}
        {isCreatingComment && pendingPosition && (
          <div data-comment-ui>
            <CommentCreator
              position={pendingPosition}
              onCreateComment={(content) =>
                createThread(pendingPosition, content)
              }
              onCancel={cancelCreating}
              style={{
                ...getCommentPanelPosition(pendingPosition),
                pointerEvents: "auto",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};
