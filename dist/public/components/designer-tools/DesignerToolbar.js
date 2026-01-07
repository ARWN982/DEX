"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignerToolbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const AboutFlyout_1 = require("./AboutFlyout");
const VersionSwitcher_1 = require("./VersionSwitcher");
const DesignerToolbar = ({ isCommentingEnabled, onToggleCommenting, isJobStoriesTrackingEnabled, onToggleJobStoriesTracking, onCreateVersion, projectName, }) => {
    const [isVisible, setIsVisible] = (0, react_1.useState)(false);
    const [isAboutFlyoutOpen, setIsAboutFlyoutOpen] = (0, react_1.useState)(false);
    const [projectMetadata, setProjectMetadata] = (0, react_1.useState)(null);
    const hideTimeoutRef = (0, react_1.useRef)(null);
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const handleMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsVisible(true);
    };
    const handleMouseLeave = () => {
        // Delay hiding the toolbar for 2 seconds
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 2000);
    };
    (0, react_1.useEffect)(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);
    // Hover zone that extends above the toolbar to prevent vibration
    const hoverZoneStyle = {
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '80px', // Larger hover area
        zIndex: 1009,
        pointerEvents: 'auto',
    };
    // Get design tools colors
    const colors = (0, designToolsColors_1.getToolbarColors)(colorMode);
    const toolbarStyle = {
        position: 'absolute',
        bottom: isVisible ? '16px' : '-40px', // Show only 16px when not visible
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: colors.primary,
        borderRadius: '28px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: (0, designToolsColors_1.createBoxShadow)(colors, 'medium'),
        transition: 'bottom 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
        zIndex: 1010,
        border: `1px solid ${colors.border}`,
    };
    const buttonStyle = (isActive) => ({
        width: '40px',
        height: '40px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: isActive ? colors.accent : 'transparent',
        color: isActive ? '#ffffff' : colors.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        outline: 'none',
    });
    // Load project metadata when projectName changes
    (0, react_1.useEffect)(() => {
        if (projectName) {
            loadProjectMetadata();
        }
    }, [projectName]);
    const loadProjectMetadata = async () => {
        if (!projectName)
            return;
        try {
            const response = await fetch(`/api/project-metadata/${projectName}`);
            if (response.ok) {
                const metadata = await response.json();
                setProjectMetadata(metadata);
            }
        }
        catch (error) {
            console.error('Failed to load project metadata:', error);
        }
    };
    const handleAboutClick = () => {
        setIsAboutFlyoutOpen(true);
    };
    const handleCursorClick = () => {
        if (isCommentingEnabled) {
            onToggleCommenting();
        }
    };
    const handleCommentClick = () => {
        if (!isCommentingEnabled) {
            onToggleCommenting();
        }
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: hoverZoneStyle, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, "data-exclude-comments": true, children: (0, jsx_runtime_1.jsxs)("div", { style: toolbarStyle, children: [(0, jsx_runtime_1.jsx)("button", { style: {
                                backgroundColor: colors.buttonHover,
                                color: colors.textPrimary,
                                border: 'none',
                                borderRadius: '16px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                marginRight: '16px',
                            }, onClick: handleAboutClick, title: "About this project", onMouseEnter: (e) => {
                                e.target.style.backgroundColor = colors.accent;
                            }, onMouseLeave: (e) => {
                                e.target.style.backgroundColor = colors.buttonHover;
                            }, children: "About" }), (0, jsx_runtime_1.jsx)("div", { style: { marginRight: '16px' }, children: (0, jsx_runtime_1.jsx)(VersionSwitcher_1.VersionSwitcher, { onCreateVersion: onCreateVersion }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                                width: '1px',
                                height: '32px',
                                backgroundColor: colors.border,
                                marginRight: '16px',
                            } }), (0, jsx_runtime_1.jsx)("button", { style: buttonStyle(!isCommentingEnabled), onClick: handleCursorClick, title: "Select tool", onMouseEnter: (e) => {
                                if (isCommentingEnabled) {
                                    e.target.style.backgroundColor = colors.buttonHover;
                                }
                            }, onMouseLeave: (e) => {
                                if (isCommentingEnabled) {
                                    e.target.style.backgroundColor = 'transparent';
                                }
                            }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.Cursor, { size: 20, weight: "fill", style: { backgroundColor: 'transparent' } }) }), (0, jsx_runtime_1.jsx)("button", { style: buttonStyle(isCommentingEnabled), onClick: handleCommentClick, title: "Comment tool", onMouseEnter: (e) => {
                                if (!isCommentingEnabled) {
                                    e.target.style.backgroundColor = colors.buttonHover;
                                }
                            }, onMouseLeave: (e) => {
                                if (!isCommentingEnabled) {
                                    e.target.style.backgroundColor = 'transparent';
                                }
                            }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.ChatCircle, { size: 20, weight: "fill", style: { backgroundColor: 'transparent' } }) }), (0, jsx_runtime_1.jsx)("button", { style: buttonStyle(isJobStoriesTrackingEnabled), onClick: onToggleJobStoriesTracking, title: "Job Stories Tracking", onMouseEnter: (e) => {
                                if (!isJobStoriesTrackingEnabled) {
                                    e.target.style.backgroundColor = colors.buttonHover;
                                }
                            }, onMouseLeave: (e) => {
                                if (!isJobStoriesTrackingEnabled) {
                                    e.target.style.backgroundColor = 'transparent';
                                }
                            }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.UserList, { size: 20, weight: "fill", style: { backgroundColor: 'transparent' } }) })] }) }), (0, jsx_runtime_1.jsx)(AboutFlyout_1.AboutFlyout, { isOpen: isAboutFlyoutOpen, onClose: () => setIsAboutFlyoutOpen(false), projectMetadata: projectMetadata })] }));
};
exports.DesignerToolbar = DesignerToolbar;
//# sourceMappingURL=DesignerToolbar.js.map