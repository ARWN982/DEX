import { EuiProvider } from "@elastic/eui";
import React, { useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  CommentingSystem,
  DesignerToolbar,
  JobStoriesFlyout,
  CreateVersionModal,
  AssistantFlyout,
  KibanaHeader,
} from "./components";
import { useChartTheme } from "./hooks";
import { Homepage } from "./pages";
import { useAppStore } from "./store/useAppStore";
import { useVersionStore } from "./store/useVersionStore";
import { VersionedComponentLoader } from "./utils/componentLoader";
import { TemplateLoader } from "./utils/templateLoader";

const App: React.FC = () => {
  const location = useLocation();
  const { colorMode, setColorMode } = useAppStore();
  const { currentVersion } = useVersionStore();
  const [isCommentingEnabled, setIsCommentingEnabled] = useState(false);
  const [isJobStoriesTrackingEnabled, setIsJobStoriesTrackingEnabled] =
    useState(false);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [isAssistantFlyoutOpen, setIsAssistantFlyoutOpen] = useState(false);

  // Load appropriate chart theme CSS based on color mode
  useChartTheme(colorMode);

  const toggleColorMode = () => {
    setColorMode(colorMode === "light" ? "dark" : "light");
  };

  const handleCreateVersion = () => {
    setShowCreateVersionModal(true);
  };

  const handleAssistantClick = () => {
    setIsAssistantFlyoutOpen(true);
  };

  // Get project name from current path (dynamic - extracts first segment after /)
  const getProjectNameFromPath = (pathname: string): string | null => {
    const segments = pathname.split('/').filter(s => s);
    if (segments.length > 0 && segments[0] !== 'template') {
      return segments[0];
    }
    return null;
  };

  return (
    <EuiProvider colorMode={colorMode}>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Only show KibanaHeader for non-discover-ux and non-simple-esql pages */}
        {!location.pathname.startsWith("/discover-ux") && 
         !location.pathname.startsWith("/simple-esql") && (
          <KibanaHeader
            colorMode={colorMode}
            onToggleColorMode={toggleColorMode}
            onAssistantClick={handleAssistantClick}
            isHomepage={location.pathname === "/"}
            display="classic"
          />
        )}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            
            {/* Template routes */}
            <Route
              path="/template/:templateName"
              element={<TemplateLoader templateName="discover" />}
            />
            
            {/* Dynamic project route - catches all project paths */}
            <Route
              path="/:projectName"
              element={
                <VersionedComponentLoader
                  pageName={location.pathname.split('/')[1] || ''}
                  version={currentVersion}
                />
              }
            />
          </Routes>
        </div>

        {/* Universal Comment System Overlay */}
        <CommentingSystem
          isEnabled={isCommentingEnabled}
          onExitCommentingMode={() => setIsCommentingEnabled(false)}
        />

        {/* Designer Toolbar - hidden on homepage */}
        {location.pathname !== "/" && (
          <DesignerToolbar
            isCommentingEnabled={isCommentingEnabled}
            onToggleCommenting={() => {
              console.log(
                "Toggling comment mode from",
                isCommentingEnabled,
                "to",
                !isCommentingEnabled
              );
              setIsCommentingEnabled(!isCommentingEnabled);
            }}
            isJobStoriesTrackingEnabled={isJobStoriesTrackingEnabled}
            onToggleJobStoriesTracking={() => {
              console.log(
                "Toggling job stories tracking from",
                isJobStoriesTrackingEnabled,
                "to",
                !isJobStoriesTrackingEnabled
              );
              setIsJobStoriesTrackingEnabled(!isJobStoriesTrackingEnabled);
            }}
            onCreateVersion={handleCreateVersion}
            projectName={getProjectNameFromPath(location.pathname) || undefined}
          />
        )}

        {/* Job Stories Flyout */}
        <JobStoriesFlyout
          isOpen={isJobStoriesTrackingEnabled}
          onClose={() => setIsJobStoriesTrackingEnabled(false)}
        />

        {/* Create Version Modal */}
        <CreateVersionModal
          isOpen={showCreateVersionModal}
          onClose={() => setShowCreateVersionModal(false)}
        />

        {/* Assistant Flyout */}
        <AssistantFlyout
          isOpen={isAssistantFlyoutOpen}
          onClose={() => setIsAssistantFlyoutOpen(false)}
        />
      </div>
    </EuiProvider>
  );
};

export default App;
