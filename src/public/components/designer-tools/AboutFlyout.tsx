import { EuiLoadingSpinner, useEuiTheme } from "@elastic/eui";
import { X } from "phosphor-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../../store/useAppStore";
import { getDesignUIColors, dtRadius, dtPadding } from "../../styles/designToolsTokens";

export interface ProjectMetadata {
  projectName: string;
  designer: string;
  pm: string;
  bodyMarkdown: string;
  prdLink: string;
  githubIssueLink: string;
  breadcrumb: string;
}

interface AboutFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  projectMetadata: ProjectMetadata | null;
  currentVersion?: string;
  projectName?: string;
}

export const AboutFlyout: React.FC<AboutFlyoutProps> = ({
  isOpen,
  onClose,
  projectMetadata,
  currentVersion,
  projectName,
}) => {
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();
  const colors = getDesignUIColors(colorMode);
  const [versionNotes, setVersionNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectName || !currentVersion) {
      setVersionNotes("");
      return;
    }

    let cancelled = false;
    setNotesLoading(true);

    fetch(`/api/versions/notes?page=${projectName}&version=${currentVersion}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVersionNotes(data.markdown || "");
      })
      .catch(() => {
        if (!cancelled) setVersionNotes("");
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, projectName, currentVersion]);

  if (!isOpen) return null;
  if (!projectMetadata) return null;

  const isDark = colorMode !== "light";

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    zIndex: 2000,
    opacity: 1,
    transition: "opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",
    backdropFilter: "blur(1px)",
  };

  const flyoutStyle: React.CSSProperties = {
    position: "fixed",
    top: euiTheme.size.base,
    right: euiTheme.size.base,
    bottom: euiTheme.size.base,
    width: "500px",
    backgroundColor: isDark ? "#1a1a1a" : "#f8f9fa",
    borderRadius: dtRadius.flyout,
    boxShadow: isDark
      ? "0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)"
      : "0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)",
    zIndex: 2001,
    display: "flex",
    flexDirection: "column",
    transform: "translateX(0)",
    transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const headerStyle: React.CSSProperties = {
    padding: `${dtPadding} ${dtPadding} ${euiTheme.size.base} ${dtPadding}`,
    borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "600",
    color: isDark ? "#ffffff" : "#1a1a1a",
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    width: euiTheme.size.xl,
    height: euiTheme.size.xl,
    borderRadius: dtRadius.panel,
    border: "none",
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    color: isDark ? "#ffffff" : "#1a1a1a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: dtPadding,
    overflow: "auto",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    margin: `${euiTheme.size.l} 0`,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
    marginBottom: euiTheme.size.xs,
  };

  const fieldValueStyle: React.CSSProperties = {
    fontSize: "14px",
    lineHeight: "1.5",
    color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.75)",
    marginBottom: euiTheme.size.base,
  };

  const linkStyle: React.CSSProperties = {
    fontSize: "14px",
    color: colors.link,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: euiTheme.size.s,
    marginBottom: euiTheme.size.s,
  };

  const markdownContainerStyle: React.CSSProperties = {
    fontSize: "14px",
    lineHeight: "1.6",
    color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.75)",
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} data-exclude-comments />

      <div style={flyoutStyle} data-exclude-comments>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{projectMetadata.projectName}</h2>
          </div>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)";
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div style={contentStyle}>
          {/* ── Project Info ── */}
          <style>
            {`
              .about-flyout-markdown p { margin: 0 0 ${euiTheme.size.s} 0; }
              .about-flyout-markdown p:last-child { margin-bottom: 0; }
              .about-flyout-markdown h1,
              .about-flyout-markdown h2,
              .about-flyout-markdown h3 {
                margin: ${euiTheme.size.base} 0 ${euiTheme.size.s} 0;
                font-weight: 600;
                color: ${isDark ? "#fff" : "#1a1a1a"};
              }
              .about-flyout-markdown h1 { font-size: 18px; }
              .about-flyout-markdown h2 { font-size: 16px; }
              .about-flyout-markdown h3 { font-size: 14px; }
              .about-flyout-markdown ul,
              .about-flyout-markdown ol { padding-left: 20px; margin: ${euiTheme.size.s} 0; }
              .about-flyout-markdown li { margin-bottom: ${euiTheme.size.xs}; }
              .about-flyout-markdown code {
                background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
                padding: ${euiTheme.size.xxs} 6px;
                border-radius: ${dtRadius.small};
                font-size: 13px;
              }
              .about-flyout-markdown pre {
                background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"};
                padding: ${euiTheme.size.m};
                border-radius: ${dtRadius.medium};
                overflow-x: auto;
                margin: ${euiTheme.size.s} 0;
              }
              .about-flyout-markdown pre code {
                background: none;
                padding: 0;
              }
              .about-flyout-markdown a {
                color: ${colors.link};
              }
              .about-flyout-markdown blockquote {
                border-left: 3px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"};
                margin: ${euiTheme.size.s} 0;
                padding: ${euiTheme.size.xs} ${euiTheme.size.m};
                color: ${isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"};
              }
            `}
          </style>

          {projectMetadata.designer && (
            <>
              <div style={sectionLabelStyle}>Designer</div>
              <div style={fieldValueStyle}>{projectMetadata.designer}</div>
            </>
          )}

          {projectMetadata.pm && (
            <>
              <div style={sectionLabelStyle}>Product Manager</div>
              <div style={fieldValueStyle}>{projectMetadata.pm}</div>
            </>
          )}

          {projectMetadata.prdLink && (
            <>
              <div style={sectionLabelStyle}>PRD</div>
              <div style={fieldValueStyle}>
                <a
                  href={projectMetadata.prdLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  Open PRD
                </a>
              </div>
            </>
          )}

          {projectMetadata.githubIssueLink && (
            <>
              <div style={sectionLabelStyle}>GitHub Issue</div>
              <div style={fieldValueStyle}>
                <a
                  href={projectMetadata.githubIssueLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  Open Issue
                </a>
              </div>
            </>
          )}

          {/* ── Project Description (Markdown) ── */}
          {projectMetadata.bodyMarkdown && (
            <>
              <div style={{ ...sectionLabelStyle, marginBottom: euiTheme.size.m }}>Project Description</div>
              <div
                className="about-flyout-markdown"
                style={markdownContainerStyle}
              >
                <ReactMarkdown>{projectMetadata.bodyMarkdown}</ReactMarkdown>
              </div>
            </>
          )}

          {/* ── Version Notes (Markdown) ── */}
          {currentVersion && (
            <>
              <div style={dividerStyle} />
              <div style={{ ...sectionLabelStyle, marginBottom: euiTheme.size.m }}>
                Version {currentVersion} Notes
              </div>
              {notesLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: `${euiTheme.size.base} 0` }}>
                  <EuiLoadingSpinner size="m" />
                </div>
              ) : versionNotes ? (
                <div
                  className="about-flyout-markdown"
                  style={markdownContainerStyle}
                >
                  <ReactMarkdown>{versionNotes}</ReactMarkdown>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "13px",
                    color: isDark
                      ? "rgba(255, 255, 255, 0.4)"
                      : "rgba(0, 0, 0, 0.4)",
                    fontStyle: "italic",
                  }}
                >
                  No notes for this version yet. Add a{" "}
                  <code style={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    padding: `${euiTheme.size.xxs} 6px`,
                    borderRadius: dtRadius.small,
                    fontSize: "12px",
                  }}>
                    notes.md
                  </code>{" "}
                  file in the version folder to add notes.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
