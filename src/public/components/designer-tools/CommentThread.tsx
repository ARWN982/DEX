import { useEuiTheme } from "@elastic/eui";
import { Check, X, PaperPlaneRight } from "phosphor-react";
import React, { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useCommentStore } from "../../store/useCommentStore";
import {
  getDesignUIColors,
  createBoxShadow,
  dtRadius,
} from "../../styles/designToolsTokens";
import {
  CommentThread as CommentThreadType,
  Comment,
  CommentFormData,
} from "../../types/comments";
import { getTimeAgo } from "../../utils/dateUtils";
import { getUserIdentity } from "../../utils/userIdentity";

interface CommentThreadProps {
  thread: CommentThreadType;
  onAddComment: (data: CommentFormData) => void;
  onResolveThread: () => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

interface CommentItemProps {
  comment: Comment;
  isFirst: boolean;
  textColor: string;
  secondaryTextColor: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isFirst,
  textColor,
  secondaryTextColor,
}) => {
  const { euiTheme } = useEuiTheme();
  const timeAgo = getTimeAgo(comment.createdAt);
  const authorInitials = comment.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ display: "flex", gap: euiTheme.size.m, marginBottom: euiTheme.size.base }}>
      <div
        style={{
          width: euiTheme.size.l,
          height: euiTheme.size.l,
          borderRadius: "50%",
          backgroundColor: comment.author.color || "#0d99ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 500,
          color: "white",
          flexShrink: 0,
        }}
      >
        {authorInitials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: euiTheme.size.xs,
          }}
        >
          <span style={{ color: textColor, fontSize: "14px", fontWeight: 500 }}>
            {comment.author.name}
          </span>
          <span style={{ color: secondaryTextColor, fontSize: "12px" }}>
            {timeAgo}
          </span>
        </div>
        <p
          style={{
            color: textColor,
            fontSize: "14px",
            lineHeight: "1.5",
            margin: 0,
          }}
        >
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  thread,
  onAddComment,
  onResolveThread,
  onClose,
  style = {},
}) => {
  const [replyContent, setReplyContent] = useState("");
  const { colorMode } = useAppStore();
  const { isSaving } = useCommentStore();
  const { euiTheme } = useEuiTheme();
  
  const currentUser = getUserIdentity();
  const currentUserInitials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleSubmitReply = () => {
    const trimmed = replyContent.trim();
    if (!trimmed || isSaving) return;
    setReplyContent("");
    onAddComment({ content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && replyContent.trim() && !isSaving) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  const threadStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1001,
    ...style,
  };

  // Get design UI colors (follows main app theme)
  const colors = getDesignUIColors(colorMode);

  return (
    <div
      style={{
        ...threadStyle,
        width: "380px",
        backgroundColor: colors.primary,
        border: "none",
        borderRadius: dtRadius.panel,
        boxShadow: createBoxShadow(colors, "medium"),
        color: colors.textPrimary,
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: euiTheme.size.s,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          Comments ({thread.comments.length})
        </h3>
        <div style={{ display: "flex", gap: euiTheme.size.s }}>
          <button
            style={{
              padding: euiTheme.size.xs,
              border: "none",
              borderRadius: dtRadius.small,
              backgroundColor: "transparent",
              color:
                thread.status === "resolved"
                  ? colors.textMuted
                  : colors.textSecondary,
              cursor: thread.status === "resolved" ? "not-allowed" : "pointer",
            }}
            onClick={onResolveThread}
            disabled={thread.status === "resolved"}
            title={
              thread.status === "resolved" ? "Resolved" : "Mark as resolved"
            }
          >
            <Check size={16} weight="bold" />
          </button>
          <button
            style={{
              padding: euiTheme.size.xs,
              border: "none",
              borderRadius: dtRadius.small,
              backgroundColor: "transparent",
              color: colors.textSecondary,
              cursor: "pointer",
            }}
            onClick={onClose}
            title="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div style={{ padding: euiTheme.size.base, maxHeight: "256px", overflowY: "auto" }}>
        {thread.comments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isFirst={index === 0}
            textColor={colors.textPrimary}
            secondaryTextColor={colors.textSecondary}
          />
        ))}
      </div>

      {/* Reply Section */}
      <div style={{ 
        padding: `${euiTheme.size.s} ${euiTheme.size.base} ${euiTheme.size.m} ${euiTheme.size.base}`, 
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        gap: euiTheme.size.m,
      }}>
        <div
          style={{
            width: euiTheme.size.l,
            height: euiTheme.size.l,
            borderRadius: "50%",
            backgroundColor: currentUser?.color || "#0d99ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 500,
            color: "white",
            flexShrink: 0,
          }}
        >
          {currentUserInitials}
        </div>
        <input
          type="text"
          style={{
            flex: 1,
            padding: `${euiTheme.size.s} ${euiTheme.size.m}`,
            backgroundColor: "transparent",
            border: "none",
            color: colors.textSecondary,
            fontSize: "14px",
            outline: "none",
            fontFamily: "inherit",
          }}
          placeholder="Reply"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          style={{
            width: euiTheme.size.xl,
            height: euiTheme.size.xl,
            border: "none",
            backgroundColor: "transparent",
            cursor: replyContent.trim() && !isSaving ? "pointer" : "not-allowed",
            color: replyContent.trim() && !isSaving ? colors.primaryButton : colors.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            padding: "0",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmitReply();
          }}
          disabled={!replyContent.trim() || isSaving}
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
};
