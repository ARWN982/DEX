import { EuiProvider } from "@elastic/eui";
import React, { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { useVersionStore } from "./store/useVersionStore";
import { VersionedComponentLoader } from "./utils/componentLoader";
import { VersionSwitcher } from "./components/designer-tools/VersionSwitcher";
import { getToolbarColors, createBoxShadow } from "./styles/designToolsTokens";

declare const __PUBLISH_PROJECT__: string;
declare const __PUBLISH_VERSIONS__: string;
declare const __PUBLISH_DISPLAY_NAME__: string;

const slug: string = process.env.PUBLISH_PROJECT || "";
const publishedVersions: string[] = JSON.parse(process.env.PUBLISH_VERSIONS || "[]");

const usePublishChartTheme = (colorMode: "light" | "dark") => {
  useEffect(() => {
    const existingLinks = document.querySelectorAll("link[data-chart-theme]");
    existingLinks.forEach((link) => link.remove());

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-chart-theme", colorMode);
    link.href =
      colorMode === "light"
        ? "css/theme_only_light.css"
        : "css/theme_only_dark.css";

    document.head.appendChild(link);

    return () => {
      const currentLink = document.querySelector(
        `link[data-chart-theme="${colorMode}"]`
      );
      if (currentLink) currentLink.remove();
    };
  }, [colorMode]);
};

const PublishApp: React.FC = () => {
  const { colorMode, setColorMode } = useAppStore();
  const { currentVersion, loadVersions } = useVersionStore();

  usePublishChartTheme(colorMode);

  useEffect(() => {
    loadVersions();
  }, []);

  const toggleColorMode = () => {
    setColorMode(colorMode === "light" ? "dark" : "light");
  };

  const colors = getToolbarColors(colorMode);

  return (
    <EuiProvider colorMode={colorMode}>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1 }}>
          <VersionedComponentLoader
            pageName={slug}
            version={currentVersion}
          />
        </div>

        {/* Minimal toolbar: version switcher + color mode toggle */}
        <PublishToolbar
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
          colors={colors}
        />
      </div>
    </EuiProvider>
  );
};

const PublishToolbar: React.FC<{
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  colors: ReturnType<typeof getToolbarColors>;
}> = ({ colorMode, onToggleColorMode, colors }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "200px",
        height: "80px",
        zIndex: 1009,
        pointerEvents: "auto",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-exclude-comments
    >
      <div
        style={{
          position: "absolute",
          bottom: isVisible ? "16px" : "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: colors.primary,
          borderRadius: "28px",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: createBoxShadow(colors, "medium"),
          transition: "bottom 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
          zIndex: 1010,
          border: `1px solid ${colors.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {/* Version Switcher */}
        {publishedVersions.length > 1 && (
          <div style={{ marginRight: "8px" }}>
            <VersionSwitcher />
          </div>
        )}

        {/* Color Mode Toggle */}
        <button
          style={{
            backgroundColor: colors.buttonHover,
            color: colors.textPrimary,
            border: "none",
            borderRadius: "16px",
            padding: "8px 16px",
            fontSize: "11px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          onClick={onToggleColorMode}
          title="Toggle color mode"
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.accent;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor =
              colors.buttonHover;
          }}
        >
          {colorMode === "light" ? "Dark" : "Light"}
        </button>
      </div>
    </div>
  );
};

export default PublishApp;
