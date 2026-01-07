import { PaperPlaneRight } from "phosphor-react";
import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  getDesignUIColors,
  createBoxShadow,
} from "../../styles/designToolsColors";
import { CommentPosition } from "../../types/comments";

interface CommentCreatorProps {
  position: CommentPosition;
  onCreateComment: (content: string) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}

export const CommentCreator: React.FC<CommentCreatorProps> = ({
  position,
  onCreateComment,
  onCancel,
  style = {},
}) => {
  const [content, setContent] = useState("");
  const textAreaRef = useRef<HTMLInputElement>(null);
  const { colorMode } = useAppStore();

  useEffect(() => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey) &&
      content.trim()
    ) {
      // Cmd/Ctrl + Enter to submit
      e.preventDefault();
      handleSubmit();
    }
  };

  const creatorStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1002,
    ...style,
  };

  // Get design UI colors (follows main app theme)
  const colors = getDesignUIColors(colorMode);

  return (
    <div
      style={{
        ...creatorStyle,
        width: "400px",
        backgroundColor: colors.primary,
        border: "none",
        borderRadius: "24px",
        boxShadow: createBoxShadow(colors, "medium"),
        paddingInlineStart: "16px",
        paddingBlock: "8px",
        paddingInlineEnd: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <input
        ref={textAreaRef}
        type="text"
        style={{
          flex: 1,
          padding: "0",
          backgroundColor: "transparent",
          border: "none",
          color: colors.textPrimary,
          fontSize: "12px",
          outline: "none",
          fontFamily: "inherit",
        }}
        placeholder="Add a comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        style={{
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
        }}
        onClick={handleSubmit}
        disabled={!content.trim()}
      >
        <PaperPlaneRight size={20} weight="fill" />
      </button>
    </div>
  );
};
