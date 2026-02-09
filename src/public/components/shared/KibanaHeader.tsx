import {
  EuiBreadcrumbs,
  EuiBreadcrumbsProps,
  EuiAvatar,
  useEuiTheme,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
} from "@elastic/eui";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectMetadata, useTemplateMetadata } from "../../hooks";

interface KibanaHeaderProps {
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  onAssistantClick: () => void;
  isHomepage?: boolean;
  display?: "classic" | "new";
}

export const KibanaHeader: React.FC<KibanaHeaderProps> = ({
  colorMode,
  onToggleColorMode,
  onAssistantClick,
  isHomepage = false,
  display = "classic",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { euiTheme } = useEuiTheme();

  // Get template name from path if we're on a template route
  const getTemplateNameFromPath = (pathname: string): string | null => {
    if (pathname.startsWith('/templates/')) {
      const segments = pathname.split('/').filter(s => s);
      if (segments.length >= 2 && segments[0] === 'templates') {
        return segments[1];
      }
    }
    return null;
  };

  // Get project name from current path (dynamic - extracts first segment after /)
  const getProjectNameFromPath = (pathname: string): string | null => {
    const segments = pathname.split('/').filter(s => s);
    if (segments.length > 0 && segments[0] !== 'templates') {
      return segments[0];
    }
    return null;
  };

  // Get current project name and fetch its metadata
  const currentProjectName = getProjectNameFromPath(location.pathname);
  const { metadata } = useProjectMetadata(currentProjectName);
  
  // Get current template name if we're on a template route and fetch its metadata
  const currentTemplateKey = getTemplateNameFromPath(location.pathname);
  const { displayName: templateDisplayName } = useTemplateMetadata(currentTemplateKey);

  // Generate breadcrumbs based on current route and project metadata
  const getBreadcrumbs = (): EuiBreadcrumbsProps["breadcrumbs"] => {
    const breadcrumbs: EuiBreadcrumbsProps["breadcrumbs"] = [
      {
        text: <EuiAvatar type="space" name="D" size="s" />,
        onClick: () => navigate("/"),
        color: "text",
      },
    ];

    // Add template breadcrumb if we're on a template page
    if (currentTemplateKey && templateDisplayName) {
      breadcrumbs.push({
        text: templateDisplayName,
      });
    }
    // Add project breadcrumb if we're on a project page
    else if (currentProjectName && metadata) {
      const breadcrumbText =
        metadata.breadcrumb || metadata.projectName || currentProjectName;
      breadcrumbs.push({
        text: breadcrumbText,
      });
    }

    return breadcrumbs;
  };

  if (isHomepage) {
    // Homepage: only theme toggle in upper right
    return (
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000,
        }}
      >
        <EuiButtonIcon
          iconType={colorMode === "light" ? "moon" : "sun"}
          onClick={onToggleColorMode}
          aria-label={`Switch to ${
            colorMode === "light" ? "dark" : "light"
          } mode`}
        />
      </div>
    );
  }

  // Other pages: full navbar
  return (
    <div
      data-exclude-comments
      style={{
        backgroundColor: "transparent",
        paddingLeft: 0,
        paddingRight: "16px",
        paddingTop: 0,
        paddingBottom: 0,
        height: "48px",
        flexShrink: 0,
        ...(display === "new" && {
          backgroundColor: euiTheme.colors.backgroundBaseSubdued,
        }),
      }}
    >
      <EuiFlexGroup
        alignItems="center"
        justifyContent="spaceBetween"
        gutterSize="m"
        wrap={false}
        style={{ height: "100%" }}
      >
        {/* Left section */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="m" wrap={false}>
            {/* Vertical divider before Elastic logo */}
            <EuiFlexItem grow={false}>
              <div
                style={{
                  height: "48px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    backgroundColor: euiTheme.colors.borderBaseSubdued,
                  }}
                />
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <a href="/" style={{ display: "flex", alignItems: "center" }}>
                <EuiIcon type="logoElastic" size="l" />
              </a>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBreadcrumbs breadcrumbs={getBreadcrumbs()} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Right section */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup
            alignItems="center"
            gutterSize="s"
            wrap={false}
          >
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType={colorMode === "light" ? "moon" : "sun"}
                onClick={onToggleColorMode}
                aria-label={`Switch to ${
                  colorMode === "light" ? "dark" : "light"
                } mode`}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div
                className="assistantLogo"
                onClick={onAssistantClick}
                style={{
                  width: "29px",
                  height: "29px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 56 64"
                  fill="none"
                >
                  <path d="M32 28H56V64H32V28Z" fill="#F04E98" />
                  <path
                    d="M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z"
                    fill="#00BFB3"
                  />
                  <path
                    d="M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z"
                    fill="#0B64DD"
                  />
                  <path
                    d="M2 23C2 10.8497 11.8497 1 24 1V23H2Z"
                    fill="#FEC514"
                  />
                </svg>
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiAvatar
                name="Andrea Delrio"
                size="s"
                color={euiTheme.colors.vis.euiColorVis1}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};