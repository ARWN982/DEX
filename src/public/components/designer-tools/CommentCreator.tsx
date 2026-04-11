import { useEuiTheme } from "@elastic/eui";
import { PaperPlaneRight, ArrowRight } from "phosphor-react";
import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  getDesignUIColors,
  createBoxShadow,
  dtRadius,
} from "../../styles/designToolsTokens";
import { CommentPosition } from "../../types/comments";
import { getUserIdentity, setUserIdentity } from "../../utils/userIdentity";

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
  const [identity, setIdentity] = useState(getUserIdentity);
  const [nameInput, setNameInput] = useState("");
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [identity]);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      const author = setUserIdentity(nameInput);
      setIdentity(author);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && nameInput.trim()) {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  const handleSubmit = () => {
    if (content.trim()) {
      onCreateComment(content.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && content.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const creatorStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1002,
    ...style,
  };

  const colors = getDesignUIColors(colorMode);

  const containerStyle: React.CSSProperties = {
    ...creatorStyle,
    width: "400px",
    backgroundColor: colors.primary,
    border: "none",
    borderRadius: dtRadius.pill,
    boxShadow: createBoxShadow(colors, "medium"),
    paddingInlineStart: euiTheme.size.base,
    paddingBlock: euiTheme.size.s,
    paddingInlineEnd: euiTheme.size.s,
    display: "flex",
    alignItems: "center",
    gap: euiTheme.size.m,
  };

  if (!identity) {
    return (
      <div style={containerStyle}>
        <input
          ref={inputRef}
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
          placeholder="Enter your name to comment"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={handleNameKeyDown}
        />
        <button
          style={{
            width: euiTheme.size.xl,
            height: euiTheme.size.xl,
            border: "none",
            backgroundColor: "transparent",
            cursor: nameInput.trim() ? "pointer" : "not-allowed",
            color: nameInput.trim() ? colors.primaryButton : colors.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            padding: "0",
          }}
          onClick={handleNameSubmit}
          disabled={!nameInput.trim()}
        >
          <ArrowRight size={20} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <input
        ref={inputRef}
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
          width: euiTheme.size.xl,
          height: euiTheme.size.xl,
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
