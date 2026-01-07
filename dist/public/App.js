"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const components_1 = require("./components");
const hooks_1 = require("./hooks");
const pages_1 = require("./pages");
const useAppStore_1 = require("./store/useAppStore");
const useVersionStore_1 = require("./store/useVersionStore");
const componentLoader_1 = require("./utils/componentLoader");
const templateLoader_1 = require("./utils/templateLoader");
const App = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const { colorMode, setColorMode } = (0, useAppStore_1.useAppStore)();
    const { currentVersion } = (0, useVersionStore_1.useVersionStore)();
    const [isCommentingEnabled, setIsCommentingEnabled] = (0, react_1.useState)(false);
    const [isJobStoriesTrackingEnabled, setIsJobStoriesTrackingEnabled] = (0, react_1.useState)(false);
    const [showCreateVersionModal, setShowCreateVersionModal] = (0, react_1.useState)(false);
    const [isAssistantFlyoutOpen, setIsAssistantFlyoutOpen] = (0, react_1.useState)(false);
    // Load appropriate chart theme CSS based on color mode
    (0, hooks_1.useChartTheme)(colorMode);
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
    const getProjectNameFromPath = (pathname) => {
        const segments = pathname.split('/').filter(s => s);
        if (segments.length > 0 && segments[0] !== 'template') {
            return segments[0];
        }
        return null;
    };
    return ((0, jsx_runtime_1.jsx)(eui_1.EuiProvider, { colorMode: colorMode, children: (0, jsx_runtime_1.jsxs)("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column" }, children: [!location.pathname.startsWith("/discover-ux") &&
                    !location.pathname.startsWith("/simple-esql") && ((0, jsx_runtime_1.jsx)(components_1.KibanaHeader, { colorMode: colorMode, onToggleColorMode: toggleColorMode, onAssistantClick: handleAssistantClick, isHomepage: location.pathname === "/", display: "classic" })), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1 }, children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(pages_1.Homepage, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/template/:templateName", element: (0, jsx_runtime_1.jsx)(templateLoader_1.TemplateLoader, { templateName: "discover" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/:projectName", element: (0, jsx_runtime_1.jsx)(componentLoader_1.VersionedComponentLoader, { pageName: location.pathname.split('/')[1] || '', version: currentVersion }) })] }) }), (0, jsx_runtime_1.jsx)(components_1.CommentingSystem, { isEnabled: isCommentingEnabled, onExitCommentingMode: () => setIsCommentingEnabled(false) }), location.pathname !== "/" && ((0, jsx_runtime_1.jsx)(components_1.DesignerToolbar, { isCommentingEnabled: isCommentingEnabled, onToggleCommenting: () => {
                        console.log("Toggling comment mode from", isCommentingEnabled, "to", !isCommentingEnabled);
                        setIsCommentingEnabled(!isCommentingEnabled);
                    }, isJobStoriesTrackingEnabled: isJobStoriesTrackingEnabled, onToggleJobStoriesTracking: () => {
                        console.log("Toggling job stories tracking from", isJobStoriesTrackingEnabled, "to", !isJobStoriesTrackingEnabled);
                        setIsJobStoriesTrackingEnabled(!isJobStoriesTrackingEnabled);
                    }, onCreateVersion: handleCreateVersion, projectName: getProjectNameFromPath(location.pathname) || undefined })), (0, jsx_runtime_1.jsx)(components_1.JobStoriesFlyout, { isOpen: isJobStoriesTrackingEnabled, onClose: () => setIsJobStoriesTrackingEnabled(false) }), (0, jsx_runtime_1.jsx)(components_1.CreateVersionModal, { isOpen: showCreateVersionModal, onClose: () => setShowCreateVersionModal(false) }), (0, jsx_runtime_1.jsx)(components_1.AssistantFlyout, { isOpen: isAssistantFlyoutOpen, onClose: () => setIsAssistantFlyoutOpen(false) })] }) }));
};
exports.default = App;
//# sourceMappingURL=App.js.map