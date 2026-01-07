"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Homepage = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const phosphor_react_1 = require("phosphor-react");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const components_1 = require("../components");
const useAppStore_1 = require("../store/useAppStore");
const designToolsColors_1 = require("../styles/designToolsColors");
const Homepage = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const [projects, setProjects] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedProject, setSelectedProject] = (0, react_1.useState)(null);
    const [isProjectInfoFlyoutOpen, setIsProjectInfoFlyoutOpen] = (0, react_1.useState)(false);
    const [hoveredProjectId, setHoveredProjectId] = (0, react_1.useState)(null);
    const [popoverOpenId, setPopoverOpenId] = (0, react_1.useState)(null);
    // For homepage, use main app theme colors
    const colors = (0, designToolsColors_1.getDesignUIColors)(colorMode);
    // Define templates
    const templates = [
        { name: "Discover", path: "/discover" },
        { name: "Dashboards", path: "/dashboards" }, // TODO: Add this route
        { name: "Stack Management", path: "/stack-management" }, // TODO: Add this route
        { name: "Hosts", path: "/hosts" }, // TODO: Add this route
    ];
    (0, react_1.useEffect)(() => {
        // Dynamically load all projects from the API
        const loadProjects = async () => {
            try {
                console.log('[Homepage] Fetching projects from /api/projects...');
                // Fetch projects from the API
                const response = await fetch('/api/projects');
                console.log('[Homepage] Response status:', response.status, response.ok);
                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }
                const data = await response.json();
                console.log('[Homepage] API response:', data);
                if (!data.success || !data.projects) {
                    throw new Error('Invalid API response');
                }
                console.log('[Homepage] Found', data.projects.length, 'projects');
                // Load metadata and latest version for each project
                const projectsWithMetadata = await Promise.all(data.projects.map(async (project) => {
                    const metadata = await loadProjectMetadata(project.name);
                    // Use the highest version from the versions array
                    const latestVersion = project.versions.length > 0
                        ? `v${project.versions[project.versions.length - 1]}`
                        : 'v1.0';
                    return {
                        name: project.name,
                        displayName: project.displayName,
                        path: `/${project.name}`,
                        latestVersion,
                        metadata: metadata || undefined,
                    };
                }));
                console.log('[Homepage] Projects with metadata:', projectsWithMetadata);
                setProjects(projectsWithMetadata);
                setLoading(false);
            }
            catch (error) {
                console.error("[Homepage] Failed to load projects:", error);
                setLoading(false);
            }
        };
        loadProjects();
    }, []);
    const handleProjectClick = (project) => {
        navigate(project.path);
    };
    const handleTemplateClick = (template) => {
        navigate(template.path);
    };
    const handleCreateProject = () => {
        // TODO: Implement create project functionality
        console.log("Create project clicked");
    };
    const loadProjectMetadata = async (projectName) => {
        try {
            const response = await fetch(`/api/project-metadata/${projectName}`);
            if (response.ok) {
                return await response.json();
            }
        }
        catch (error) {
            console.error(`Failed to load metadata for ${projectName}:`, error);
        }
        return null;
    };
    const getLatestVersion = async (projectName) => {
        try {
            const response = await fetch(`/api/versions?page=${projectName}`);
            if (response.ok) {
                const data = await response.json();
                if (data.versions && data.versions.length > 0) {
                    // Sort versions and get the highest one
                    const sortedVersions = data.versions.sort((a, b) => {
                        const aNum = parseFloat(a.id.replace("v", ""));
                        const bNum = parseFloat(b.id.replace("v", ""));
                        return bNum - aNum; // Descending order
                    });
                    return sortedVersions[0].id;
                }
            }
        }
        catch (error) {
            console.error(`Failed to load versions for ${projectName}:`, error);
        }
        return "v1.0"; // Fallback
    };
    const saveProjectMetadata = async (projectName, metadata) => {
        try {
            const response = await fetch(`/api/project-metadata/${projectName}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(metadata),
            });
            if (!response.ok) {
                throw new Error("Failed to save project metadata");
            }
        }
        catch (error) {
            console.error(`Failed to save metadata for ${projectName}:`, error);
        }
    };
    const handleEditProjectInfo = (project) => {
        setSelectedProject(project);
        setIsProjectInfoFlyoutOpen(true);
        setPopoverOpenId(null);
    };
    const handleUpdateThumbnail = async (project) => {
        setPopoverOpenId(null);
        try {
            const response = await fetch(`/api/screenshots/${project.name}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const result = await response.json();
                console.log("Thumbnail updated successfully:", result);
                // Refresh the projects list to show the new thumbnail
                const refreshedProjects = await Promise.all(projects.map(async (p) => {
                    if (p.name === project.name) {
                        const metadata = await loadProjectMetadata(p.name);
                        return { ...p, metadata: metadata || undefined };
                    }
                    return p;
                }));
                setProjects(refreshedProjects);
            }
            else {
                const error = await response.json();
                console.error("Failed to update thumbnail:", error);
            }
        }
        catch (error) {
            console.error("Error updating thumbnail:", error);
        }
    };
    const handleSaveProjectMetadata = async (metadata) => {
        if (selectedProject) {
            await saveProjectMetadata(selectedProject.name, metadata);
            // Update the project in the local state
            setProjects((prev) => prev.map((p) => p.name === selectedProject.name ? { ...p, metadata } : p));
        }
    };
    const cardStyle = {
        backgroundColor: colors.primary,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "0px", // Remove padding for thumbnail layout
        width: "344px", // Updated width
        height: "256px", // Updated height (200px thumbnail + 56px info)
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        boxShadow: (0, designToolsColors_1.createBoxShadow)(colors, "light"),
        overflow: "hidden", // Hide overflow for rounded corners
    };
    const cardHoverStyle = {
        ...cardStyle,
        transform: "translateY(-2px)",
        boxShadow: `0 4px 16px ${colors.shadowLight}`,
    };
    const titleStyle = {
        fontSize: "24px",
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: "32px",
    };
    const cardTitleStyle = {
        fontSize: "14px",
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: "2px",
    };
    const cardSubtitleStyle = {
        fontSize: "12px",
        color: colors.textSecondary,
    };
    const emptyStateStyle = {
        textAlign: "center",
        padding: "64px 0",
    };
    const emptyTextStyle = {
        fontSize: "16px",
        color: colors.textSecondary,
        marginBottom: "24px",
    };
    const createButtonStyle = {
        backgroundColor: colors.primaryButton,
        color: colors.primaryButtonText,
        border: "none",
        borderRadius: "24px",
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
    };
    const containerStyle = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "96px 24px 48px 24px", // 48px extra top padding + 48px existing = 96px top
        minHeight: "100vh", // Full viewport height since no header
    };
    const sectionStyle = {
        marginBottom: "64px",
    };
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, 344px)", // Fixed width cards
        gap: "24px",
        marginTop: "24px",
        justifyContent: "start", // Align cards to the left
    };
    console.log('[Homepage Render] State:', { loading, projectsCount: projects.length, projects });
    return ((0, jsx_runtime_1.jsxs)("div", { style: containerStyle, children: [(0, jsx_runtime_1.jsxs)("div", { style: sectionStyle, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px",
                        }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { ...titleStyle, marginBottom: 0 }, children: "Your projects" }), !loading && projects.length > 0 && ((0, jsx_runtime_1.jsx)("button", { style: createButtonStyle, onClick: handleCreateProject, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                }, children: "Create project" }))] }), loading ? ((0, jsx_runtime_1.jsx)("div", { style: emptyStateStyle, children: (0, jsx_runtime_1.jsx)("div", { style: emptyTextStyle, children: "Loading projects..." }) })) : projects.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { style: { ...gridStyle, marginTop: 0 }, children: projects.map((project) => {
                            const isHovered = hoveredProjectId === project.name;
                            const isPopoverOpen = popoverOpenId === project.name;
                            return ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    ...cardStyle,
                                    position: "relative",
                                    ...(isHovered || isPopoverOpen ? cardHoverStyle : {}),
                                }, onClick: () => handleProjectClick(project), onMouseEnter: () => setHoveredProjectId(project.name), onMouseLeave: () => setHoveredProjectId(null), children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            height: "200px",
                                            backgroundColor: colors.secondary,
                                            borderRadius: "16px 16px 0 0",
                                            overflow: "hidden",
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: project.metadata?.thumbnail ? ((0, jsx_runtime_1.jsx)("img", { src: project.metadata.thumbnail.url, alt: `${project.displayName} thumbnail`, style: {
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            } })) : ((0, jsx_runtime_1.jsxs)("div", { style: {
                                                color: colors.textMuted,
                                                fontSize: "14px",
                                                textAlign: "center",
                                                padding: "20px",
                                            }, children: ["No thumbnail available", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("small", { children: "Click \"Update thumbnail\" to generate one" })] })) }), (0, jsx_runtime_1.jsx)("div", { style: {
                                            padding: "12px 16px",
                                            height: "56px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                        }, children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: cardTitleStyle, children: project.displayName }), (0, jsx_runtime_1.jsxs)("div", { style: cardSubtitleStyle, children: ["Latest version ", project.latestVersion] })] }) }), (isHovered || isPopoverOpen) && ((0, jsx_runtime_1.jsx)("div", { style: {
                                            position: "absolute",
                                            top: "8px",
                                            right: "8px",
                                            zIndex: 10,
                                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                                            borderRadius: "6px",
                                            backdropFilter: "blur(8px)",
                                        }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiPopover, { isOpen: isPopoverOpen, panelPaddingSize: "none", closePopover: () => setPopoverOpenId(null), button: (0, jsx_runtime_1.jsx)("button", { style: {
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: "6px",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#ffffff", // White for better contrast
                                                    opacity: 0.9,
                                                    transition: "opacity 0.2s ease",
                                                }, onClick: (e) => {
                                                    e.stopPropagation();
                                                    setPopoverOpenId(isPopoverOpen ? null : project.name);
                                                }, onMouseEnter: (e) => {
                                                    e.currentTarget.style.opacity = "1";
                                                }, onMouseLeave: (e) => {
                                                    e.currentTarget.style.opacity = "0.7";
                                                }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.DotsThreeVertical, { size: 24, weight: "bold" }) }), children: (0, jsx_runtime_1.jsx)(eui_1.EuiContextMenu, { initialPanelId: 0, panels: [
                                                    {
                                                        id: 0,
                                                        items: [
                                                            {
                                                                name: "Edit info",
                                                                icon: "pencil",
                                                                onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    handleEditProjectInfo(project);
                                                                },
                                                            },
                                                            {
                                                                name: "Update thumbnail",
                                                                icon: "image",
                                                                onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateThumbnail(project);
                                                                },
                                                            },
                                                        ],
                                                    },
                                                ] }) }) }))] }, project.name));
                        }) })) : ((0, jsx_runtime_1.jsxs)("div", { style: emptyStateStyle, children: [(0, jsx_runtime_1.jsx)("div", { style: emptyTextStyle, children: "You haven't created any projects yet" }), (0, jsx_runtime_1.jsx)("button", { style: createButtonStyle, onClick: handleCreateProject, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                }, children: "Create a project" })] }))] }), (0, jsx_runtime_1.jsxs)("div", { style: sectionStyle, children: [(0, jsx_runtime_1.jsx)("h2", { style: titleStyle, children: "Templates" }), (0, jsx_runtime_1.jsx)("div", { style: gridStyle, children: templates.map((template) => {
                            const [isHovered, setIsHovered] = react_1.default.useState(false);
                            return ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    ...cardStyle,
                                    position: "relative",
                                    ...(isHovered ? cardHoverStyle : {}),
                                }, onClick: () => handleTemplateClick(template), onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            height: "200px",
                                            backgroundColor: colors.secondary,
                                            borderRadius: "16px 16px 0 0",
                                            overflow: "hidden",
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: (0, jsx_runtime_1.jsxs)("div", { style: {
                                                color: colors.textMuted,
                                                fontSize: "14px",
                                                textAlign: "center",
                                                padding: "20px",
                                            }, children: ["Template screenshot", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("small", { children: "Coming soon" })] }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                                            padding: "12px 16px",
                                            height: "56px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                        }, children: (0, jsx_runtime_1.jsx)("div", { style: cardTitleStyle, children: template.name }) })] }, template.name));
                        }) })] }), (0, jsx_runtime_1.jsx)(components_1.ProjectInfoFlyout, { isOpen: isProjectInfoFlyoutOpen, onClose: () => {
                    setIsProjectInfoFlyoutOpen(false);
                    setSelectedProject(null);
                }, projectPath: selectedProject?.path || "", projectMetadata: selectedProject?.metadata || null, onSave: handleSaveProjectMetadata })] }));
};
exports.Homepage = Homepage;
//# sourceMappingURL=Homepage.js.map