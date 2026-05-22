import { EuiProvider } from "@elastic/eui";
import React, { useState } from "react";
import { Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CommentingSystem,
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
import RuleDetailsPage from "./pages/detection-rules/v1.0/rule-details";
import RuleCreationPage from "./pages/detection-rules/v1.0/rule-creation";
import AddElasticRulesPage from "./pages/detection-rules/v1.0/add-elastic-rules";
import InboxPage from "./pages/detection-rules/v1.0/inbox";
import AutoDexPage from "./pages/detection-rules/v1.0/autodex-page";
import SiemReadinessPage from "./pages/siem-readiness/SiemReadinessPage";
import AgentsPage from "./pages/agents/AgentsPage";
import { CoverageOverviewPage } from "../mitre-attack-coverage/coverage_overview/index";

// Wrapper component to extract templateName from URL params
const TemplateLoaderWithParams: React.FC = () => {
  const { templateName } = useParams<{ templateName: string }>();
  return <TemplateLoader templateName={templateName || "discover"} />;
};

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
    if (segments.length > 0 && segments[0] !== 'templates') {
      return segments[0];
    }
    return null;
  };


  return (
    <EuiProvider colorMode={colorMode}>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Only show KibanaHeader on homepage - projects bring their own headers */}
        {location.pathname === "/" && (
          <KibanaHeader
            colorMode={colorMode}
            onToggleColorMode={toggleColorMode}
            onAssistantClick={handleAssistantClick}
            isHomepage={true}
            display="classic"
          />
        )}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<SiemReadinessPage />} />
            
            {/* Template routes */}
            <Route
              path="/templates/:templateName"
              element={<TemplateLoaderWithParams />}
            />
            
            {/* Inbox / AI Briefing */}
            <Route path="/inbox" element={<InboxPage />} />

            {/* AutoDEX */}
            <Route path="/autodex" element={<AutoDexPage />} />

            {/* MITRE ATT&CK Coverage */}
            <Route path="/mitre-coverage" element={<CoverageOverviewPage />} />

            {/* SIEM Readiness */}
            <Route path="/siem-readiness" element={<SiemReadinessPage />} />

            {/* Agents */}
            <Route path="/agents" element={<AgentsPage />} />


            {/* Rule details route - must come before the catch-all */}
            <Route
              path="/detection-rules/create"
              element={<RuleCreationPage />}
            />
            <Route
              path="/detection-rules/add"
              element={<AddElasticRulesPage />}
            />
            <Route
              path="/detection-rules/:ruleId"
              element={<RuleDetailsPage />}
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
