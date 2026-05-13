import { useEuiTheme } from "@elastic/eui";
import { ClipboardText, Check } from "phosphor-react";
import React, { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useDesignerSurfaceStore } from "../../store/useDesignerSurfaceStore";
import { useVersionStore } from "../../store/useVersionStore";
import { getCurrentPage } from "../../utils/pageUtils";
import { PageShell, useIsInsidePageShell } from "./PageShell";

interface EmptyStateProps {
  pageName: string;
  versionId: string;
}

export const EmptyState: React.FC<EmptyStateProps> & { isEmptyState?: boolean } = ({
  pageName,
  versionId,
}) => {
  const { euiTheme } = useEuiTheme();
  const currentVersion = useVersionStore((s) => s.currentVersion);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const insideShell = useIsInsidePageShell();

  const pageSlug = getCurrentPage() || pageName;
  const effectiveVersion = currentVersion || versionId;

  useEffect(() => {
    useDesignerSurfaceStore.getState().setEmptyPlaceholderPage(true);
    return () => {
      useDesignerSurfaceStore.getState().setEmptyPlaceholderPage(false);
    };
  }, []);

  const filePath = `src/public/pages/${pageSlug}/v${effectiveVersion}/index.tsx`;

  const displayName = pageSlug
    .split("-")
    .map((word) => {
      const trimmed = word.replace(/^_+/, "");
      if (!trimmed) return "";
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .filter(Boolean)
    .join(" ");

  const agentPrompt = `Target project ${displayName}, version v${effectiveVersion}, and... `;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath).then(() => {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(agentPrompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
    fontWeight: euiTheme.font.weight.semiBold,
    color: euiTheme.colors.textHeading,
    margin: `0 0 ${euiTheme.size.l}`,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: euiTheme.font.weight.medium,
    color: euiTheme.colors.textSubdued,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: "6px",
  };

  const filePathRowStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: euiTheme.size.m,
    padding: `10px ${euiTheme.size.m}`,
    borderRadius: euiTheme.border.radius.medium,
    border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
    backgroundColor: euiTheme.colors.backgroundBaseSubdued,
    cursor: "pointer",
    transition: "border-color 0.15s ease, background-color 0.15s ease",
  };

  const filePathTextStyle: React.CSSProperties = {
    fontSize: "13px",
    fontFamily: euiTheme.font.family,
    color: euiTheme.colors.textSubdued,
    letterSpacing: "-0.01em",
    userSelect: "all",
    lineHeight: 1.4,
  };

  const content = (
    <>
      <h1 style={titleStyle}>Your canvas is ready</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: euiTheme.size.l,
          width: "100%",
          textAlign: "left",
        }}
      >
        <div style={{ width: "100%" }}>
          <div style={labelStyle}>
            Edit
          </div>
          <button
            type="button"
            onClick={handleCopyPath}
            style={{
              ...filePathRowStyle,
              fontFamily: euiTheme.font.family,
              background: "none",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = euiTheme.colors.borderBasePlain;
              e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = euiTheme.colors.borderBaseSubdued;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label={`Copy file path for editing: ${filePath}`}
            title={copiedPath ? "Copied!" : "Click to copy"}
          >
            <span style={filePathTextStyle}>{filePath}</span>
            <span
              style={{
                display: "flex",
                color: copiedPath ? euiTheme.colors.textSuccess : euiTheme.colors.textSubdued,
                flexShrink: 0,
                transition: "color 0.15s ease",
              }}
              aria-hidden
            >
              {copiedPath ? <Check size={15} weight="bold" /> : <ClipboardText size={15} weight="regular" />}
            </span>
          </button>
        </div>

        <div style={{ width: "100%" }}>
          <div style={labelStyle}>
            or ask your agent
          </div>
          <button
            type="button"
            onClick={handleCopyPrompt}
            style={{
              ...filePathRowStyle,
              fontFamily: euiTheme.font.family,
              background: "none",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = euiTheme.colors.borderBasePlain;
              e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = euiTheme.colors.borderBaseSubdued;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label={`Copy agent prompt: ${agentPrompt}`}
            title={copiedPrompt ? "Copied!" : "Click to copy"}
          >
            <span style={filePathTextStyle}>
              {agentPrompt}
            </span>
            <span
              style={{
                display: "flex",
                color: copiedPrompt ? euiTheme.colors.textSuccess : euiTheme.colors.textSubdued,
                flexShrink: 0,
                transition: "color 0.15s ease",
              }}
              aria-hidden
            >
              {copiedPrompt ? <Check size={15} weight="bold" /> : <ClipboardText size={15} weight="regular" />}
            </span>
          </button>
        </div>
      </div>
    </>
  );

  if (insideShell) {
    return content;
  }

  return (
    <PageShell versionId={effectiveVersion} pageName={pageSlug}>
      {content}
    </PageShell>
  );
};

EmptyState.isEmptyState = true;
