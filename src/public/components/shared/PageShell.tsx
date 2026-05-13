import { useEuiTheme } from "@elastic/eui";
import React, { createContext, useContext } from "react";
import { useProjectMetadata } from "../../hooks/useProjectMetadata";
import { useAppStore } from "../../store/useAppStore";
import { getCurrentPage } from "../../utils/pageUtils";

const PageShellContext = createContext(false);

export const useIsInsidePageShell = () => useContext(PageShellContext);

interface PageShellProps {
  versionId: string;
  pageName?: string;
  children?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  versionId,
  pageName,
  children,
}) => {
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();

  const pageSlug = getCurrentPage() || pageName || "";
  const { metadata } = useProjectMetadata(pageSlug || null);
  // Wait until metadata has resolved before showing the project label —
  // the hook always sets `displayName` (either from frontmatter or a
  // slug-derived fallback on error). Showing a slug-derived name here
  // would cause a brief flash of the wrong name before the real one
  // arrives (e.g. "Nl Esql" → "NL to ES|QL").
  const displayName = metadata?.displayName ?? "";

  const baseBg = euiTheme.colors.emptyShade;
  const coolCenter =
    colorMode === "light"
      ? "rgba(224, 237, 250, 0.85)"
      : "rgba(28, 36, 48, 0.55)";
  const coolEdge =
    colorMode === "light"
      ? "rgba(210, 245, 243, 0.45)"
      : "rgba(24, 42, 44, 0.3)";

  const outerStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    margin: 0,
    padding: 0,
    background: [
      `radial-gradient(ellipse 88% 58% at 50% 30%, ${coolCenter}, ${baseBg} 62%)`,
      `radial-gradient(ellipse 60% 50% at 80% 70%, ${coolEdge}, transparent 70%)`,
    ].join(", "),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 520,
    width: "100%",
    padding: "clamp(32px, 8vw, 56px) clamp(24px, 6vw, 40px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const pillStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: euiTheme.font.weight.medium,
    color: euiTheme.colors.textSubdued,
    padding: `${euiTheme.size.xs} ${euiTheme.size.m}`,
    borderRadius: "9999px",
    border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
    backgroundColor: euiTheme.colors.backgroundBaseSubdued,
  };

  const projectLabelStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: euiTheme.font.weight.regular,
    color: euiTheme.colors.textSubdued,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
  };

  return (
    <PageShellContext.Provider value={true}>
      <div style={outerStyle}>
        <div style={innerStyle}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: euiTheme.size.xs,
              marginBottom: euiTheme.size.l,
              width: "100%",
            }}
          >
            <span
              style={{
                ...projectLabelStyle,
                visibility: displayName ? "visible" : "hidden",
              }}
            >
              {displayName || "\u00A0"}
            </span>
            <span style={pillStyle}>Version {versionId}</span>
          </div>

          {children}
        </div>
      </div>
    </PageShellContext.Provider>
  );
};
