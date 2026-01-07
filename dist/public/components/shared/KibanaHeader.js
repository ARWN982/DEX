"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KibanaHeader = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const react_router_dom_1 = require("react-router-dom");
const hooks_1 = require("../../hooks");
const KibanaHeader = ({ colorMode, onToggleColorMode, onAssistantClick, isHomepage = false, display = "classic", }) => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    // Get project name from current path (dynamic - extracts first segment after /)
    const getProjectNameFromPath = (pathname) => {
        const segments = pathname.split('/').filter(s => s);
        if (segments.length > 0 && segments[0] !== 'template') {
            return segments[0];
        }
        return null;
    };
    // Get current project name and fetch its metadata
    const currentProjectName = getProjectNameFromPath(location.pathname);
    const { metadata } = (0, hooks_1.useProjectMetadata)(currentProjectName);
    // Generate breadcrumbs based on current route and project metadata
    const getBreadcrumbs = () => {
        const breadcrumbs = [
            {
                text: (0, jsx_runtime_1.jsx)(eui_1.EuiAvatar, { type: "space", name: "D", size: "s" }),
                onClick: () => navigate("/"),
                color: "text",
            },
        ];
        // Add project breadcrumb if we're on a project page
        if (currentProjectName && metadata) {
            const breadcrumbText = metadata.breadcrumb || metadata.projectName || currentProjectName;
            breadcrumbs.push({
                text: breadcrumbText,
            });
        }
        return breadcrumbs;
    };
    if (isHomepage) {
        // Homepage: only theme toggle in upper right
        return ((0, jsx_runtime_1.jsx)("div", { style: {
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 1000,
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: colorMode === "light" ? "moon" : "sun", onClick: onToggleColorMode, "aria-label": `Switch to ${colorMode === "light" ? "dark" : "light"} mode` }) }));
    }
    // Other pages: full navbar
    return ((0, jsx_runtime_1.jsx)("div", { "data-exclude-comments": true, style: {
            backgroundColor: "transparent",
            paddingLeft: 0,
            paddingRight: "16px",
            paddingTop: 0,
            paddingBottom: 0,
            height: "48px",
            ...(display === "new" && {
                backgroundColor: euiTheme.colors.backgroundBaseSubdued,
            }),
        }, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: "center", justifyContent: "spaceBetween", gutterSize: "m", wrap: false, style: { height: "100%" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: "center", gutterSize: "m", wrap: false, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                        height: "48px",
                                        paddingTop: "12px",
                                        paddingBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                    }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                                            width: "1px",
                                            height: "24px",
                                            backgroundColor: euiTheme.colors.borderBaseSubdued,
                                        } }) }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)("a", { href: "/", style: { display: "flex", alignItems: "center" }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiIcon, { type: "logoElastic", size: "l" }) }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiBreadcrumbs, { breadcrumbs: getBreadcrumbs() }) })] }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsxs)(eui_1.EuiFlexGroup, { alignItems: "center", gutterSize: "s", wrap: false, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: colorMode === "light" ? "moon" : "sun", onClick: onToggleColorMode, "aria-label": `Switch to ${colorMode === "light" ? "dark" : "light"} mode` }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)("div", { className: "assistantLogo", onClick: onAssistantClick, style: {
                                        width: "29px",
                                        height: "29px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                    }, children: (0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 56 64", fill: "none", children: [(0, jsx_runtime_1.jsx)("path", { d: "M32 28H56V64H32V28Z", fill: "#F04E98" }), (0, jsx_runtime_1.jsx)("path", { d: "M0 46C0 36.0589 8.05888 28 18 28H24V64H18C8.05888 64 0 55.9411 0 46Z", fill: "#00BFB3" }), (0, jsx_runtime_1.jsx)("path", { d: "M56 12C56 18.6274 50.6274 24 44 24C37.3726 24 32 18.6274 32 12C32 5.37258 37.3726 0 44 0C50.6274 0 56 5.37258 56 12Z", fill: "#0B64DD" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 23C2 10.8497 11.8497 1 24 1V23H2Z", fill: "#FEC514" })] }) }) }), (0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { grow: false, children: (0, jsx_runtime_1.jsx)(eui_1.EuiAvatar, { name: "Andrea Delrio", size: "s", color: euiTheme.colors.vis.euiColorVis1 }) })] }) })] }) }));
};
exports.KibanaHeader = KibanaHeader;
//# sourceMappingURL=KibanaHeader.js.map