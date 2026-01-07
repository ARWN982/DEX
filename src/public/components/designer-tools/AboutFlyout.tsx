import { EuiDescriptionList } from "@elastic/eui";
import { X } from "phosphor-react";
import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { getDesignUIColors } from "../../styles/designToolsColors";

export interface ProjectMetadata {
  projectName: string;
  designer: string;
  pm: string;
  briefDescription: string;
  prdLink: string;
  githubIssueLink: string;
  breadcrumb: string;
}

interface AboutFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  projectMetadata: ProjectMetadata | null;
}

export const AboutFlyout: React.FC<AboutFlyoutProps> = ({
  isOpen,
  onClose,
  projectMetadata,
}) => {
  const { colorMode } = useAppStore();
  const colors = getDesignUIColors(colorMode);

  // Only render when open to prevent shadow visibility issues
  if (!isOpen) {
    return null;
  }

  if (!projectMetadata) return null;

  // Flyout styles based on the reference image (copied exactly from JobStoriesFlyout)
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    zIndex: 2000,
    opacity: isOpen ? 1 : 0,
    transition: "opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",
    backdropFilter: "blur(1px)",
  };

  const flyoutStyle: React.CSSProperties = {
    position: "fixed",
    top: "16px",
    right: "16px",
    bottom: "16px",
    width: "500px", // Smaller than job stories
    backgroundColor: colorMode === "light" ? "#f8f9fa" : "#1a1a1a",
    borderRadius: "20px",
    boxShadow:
      colorMode === "light"
        ? "0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)"
        : "0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    zIndex: 2001,
    display: "flex",
    flexDirection: "column",
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const headerStyle: React.CSSProperties = {
    padding: "24px 24px 16px 24px",
    borderBottom: `1px solid ${
      colorMode === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"
    }`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "600",
    color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "16px",
    border: "none",
    backgroundColor:
      colorMode === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
    color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    outline: "none",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: "24px",
    overflow: "auto",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
    marginBottom: "12px",
    margin: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: "600",
    color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
    marginBottom: "4px",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "14px",
    color:
      colorMode === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
    marginBottom: "12px",
  };

  const linkStyle: React.CSSProperties = {
    fontSize: "14px",
    color: colors.link,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  };

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} onClick={onClose} data-exclude-comments />

      {/* Flyout */}
      <div style={flyoutStyle} data-exclude-comments>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{projectMetadata.projectName}</h2>
          </div>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                colorMode === "light"
                  ? "rgba(0, 0, 0, 0.15)"
                  : "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                colorMode === "light"
                  ? "rgba(0, 0, 0, 0.1)"
                  : "rgba(255, 255, 255, 0.1)";
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <style>
            {`
              .about-flyout-description-list-title {
                font-size: 14px !important;
                font-weight: 600 !important;
              }
            `}
          </style>
          <EuiDescriptionList
            type="row"
            align="left"
            className="about-flyout-description-list"
            titleProps={{ className: "about-flyout-description-list-title" }}
            listItems={[
              {
                title: "Designer",
                description: projectMetadata.designer || "Not specified",
              },
              {
                title: "Product Manager",
                description: projectMetadata.pm || "Not specified",
              },
              ...(projectMetadata.briefDescription
                ? [
                  {
                    title: "Description",
                    description: projectMetadata.briefDescription,
                  },
                ]
                : []),
              ...(projectMetadata.prdLink
                ? [
                  {
                    title: "PRD",
                    description: (
                      <a
                        href={projectMetadata.prdLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                      >
                          Open PRD
                      </a>
                    ),
                  },
                ]
                : []),
              ...(projectMetadata.githubIssueLink
                ? [
                  {
                    title: "GitHub Issue",
                    description: (
                      <a
                        href={projectMetadata.githubIssueLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                      >
                          Open Issue
                      </a>
                    ),
                  },
                ]
                : []),
            ]}
          />
        </div>
      </div>
    </>
  );
};
