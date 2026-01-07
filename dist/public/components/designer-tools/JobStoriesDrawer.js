"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStoriesDrawer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const useVersionStore_1 = require("../../store/useVersionStore");
const pageUtils_1 = require("../../utils/pageUtils");
const JobStoriesTable_1 = require("./JobStoriesTable");
const JobStoriesDrawer = ({ isOpen, onClose, }) => {
    console.log('JobStoriesDrawer render - isOpen:', isOpen);
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const { currentVersion } = (0, useVersionStore_1.useVersionStore)();
    const [jobStories, setJobStories] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // Load job stories when drawer opens or version changes
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
    const handleAddNewStory = () => {
        const newStory = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            jobStory: "",
            acceptanceCriteria: "",
            implementation: "Pending",
        };
        handleStoriesChange([...jobStories, newStory]);
    };
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                }, onClick: onClose }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '840px',
                    height: '100vh',
                    backgroundColor: 'white',
                    border: '3px solid red',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #d1d5db' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { style: { fontSize: '18px', fontWeight: '600', color: '#000' }, children: "Job Stories Tracking" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '12px', marginTop: '4px', color: '#6b7280' }, children: ["Version ", currentVersion] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, style: { height: '32px', width: '32px', padding: '0', color: '#000', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }, children: "\u2715" })] }), (0, jsx_runtime_1.jsx)("div", { style: { flex: '1', padding: '24px', overflow: 'auto' }, children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { style: { textAlign: 'center', marginTop: '40px', fontSize: '14px', color: '#6b7280' }, children: "Loading job stories..." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "tw-mb-4", children: (0, jsx_runtime_1.jsx)("button", { onClick: handleAddNewStory, style: {
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor: 'white',
                                            color: 'black',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                        }, children: "+ Add New Story" }) }), (0, jsx_runtime_1.jsx)(JobStoriesTable_1.JobStoriesTable, { stories: jobStories, onStoriesChange: handleStoriesChange })] })) })] })] }));
};
exports.JobStoriesDrawer = JobStoriesDrawer;
//# sourceMappingURL=JobStoriesDrawer.js.map