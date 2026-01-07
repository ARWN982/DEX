"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStoriesFlyout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const useVersionStore_1 = require("../../store/useVersionStore");
const pageUtils_1 = require("../../utils/pageUtils");
const JobStoriesTable_1 = require("./JobStoriesTable");
const JobStoriesFlyout = ({ isOpen, onClose, }) => {
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const { currentVersion } = (0, useVersionStore_1.useVersionStore)();
    const [jobStories, setJobStories] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // Load job stories when flyout opens or version changes
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            loadJobStories();
        }
    }, [isOpen, currentVersion]);
    const loadJobStories = async () => {
        setIsLoading(true);
        try {
            const currentPage = (0, pageUtils_1.getCurrentPage)();
            console.log('Loading job stories for page', currentPage, 'version', currentVersion, 'from API...');
            const response = await fetch(`/api/job-stories?version=${currentVersion}&page=${currentPage}`);
            if (response.ok) {
                const stories = await response.json();
                console.log('Loaded', stories.length, 'job stories for version', currentVersion, ':', stories);
                setJobStories(stories);
            }
            else {
                console.error('Failed to load job stories. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        }
        catch (error) {
            console.error('Error loading job stories:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleStoriesChange = async (updatedStories) => {
        setJobStories(updatedStories);
        // Auto-save to version-specific file
        try {
            const currentPage = (0, pageUtils_1.getCurrentPage)();
            console.log('Saving', updatedStories.length, 'job stories for page', currentPage, 'version', currentVersion, 'to API...');
            const response = await fetch(`/api/job-stories?version=${currentVersion}&page=${currentPage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedStories),
            });
            if (response.ok) {
                console.log('Successfully saved job stories for version', currentVersion);
            }
            else {
                console.error('Failed to save job stories. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        }
        catch (error) {
            console.error('Error saving job stories:', error);
        }
    };
    // Only render when open to prevent shadow visibility issues
    if (!isOpen) {
        return null;
    }
    // Flyout styles based on the reference image
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        zIndex: 2000,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        backdropFilter: 'blur(1px)',
    };
    const flyoutStyle = {
        position: 'fixed',
        top: '16px',
        right: '16px',
        bottom: '16px',
        width: '840px',
        backgroundColor: colorMode === 'light' ? '#f8f9fa' : '#1a1a1a',
        borderRadius: '20px',
        boxShadow: colorMode === 'light'
            ? '0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)'
            : '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 2001,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
    };
    const headerStyle = {
        padding: '24px 24px 16px 24px',
        borderBottom: `1px solid ${colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };
    const titleStyle = {
        fontSize: '18px',
        fontWeight: '600',
        color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
        margin: 0,
    };
    const closeButtonStyle = {
        width: '32px',
        height: '32px',
        borderRadius: '16px',
        border: 'none',
        backgroundColor: colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        outline: 'none',
    };
    const contentStyle = {
        flex: 1,
        padding: '24px',
        overflow: 'auto',
    };
    const placeholderStyle = {
        color: colorMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        textAlign: 'center',
        marginTop: '40px',
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: overlayStyle, onClick: onClose, "data-exclude-comments": true }), (0, jsx_runtime_1.jsxs)("div", { style: flyoutStyle, "data-exclude-comments": true, children: [(0, jsx_runtime_1.jsxs)("div", { style: headerStyle, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { style: titleStyle, children: "Job Stories Tracking" }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                            fontSize: '12px',
                                            color: colorMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                                            marginTop: '2px'
                                        }, children: ["Version ", currentVersion] })] }), (0, jsx_runtime_1.jsx)("button", { style: closeButtonStyle, onClick: onClose, onMouseEnter: (e) => {
                                    e.target.style.backgroundColor =
                                        colorMode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
                                }, onMouseLeave: (e) => {
                                    e.target.style.backgroundColor =
                                        colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                                }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.X, { size: 16, weight: "bold" }) })] }), (0, jsx_runtime_1.jsx)("div", { style: contentStyle, children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { style: placeholderStyle, children: "Loading job stories..." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '16px' }, children: (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            const newStory = {
                                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                                jobStory: "",
                                                acceptanceCriteria: "",
                                                implementation: "Pending",
                                            };
                                            handleStoriesChange([...jobStories, newStory]);
                                        }, style: {
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: `1px solid ${colorMode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                                            backgroundColor: colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                            color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                        }, children: "+ Add New Story" }) }), (0, jsx_runtime_1.jsx)(JobStoriesTable_1.JobStoriesTable, { stories: jobStories, onStoriesChange: handleStoriesChange })] })) })] })] }));
};
exports.JobStoriesFlyout = JobStoriesFlyout;
//# sourceMappingURL=JobStoriesFlyout.js.map