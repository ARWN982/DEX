"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AboutFlyout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const eui_1 = require("@elastic/eui");
const phosphor_react_1 = require("phosphor-react");
const useAppStore_1 = require("../../store/useAppStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const AboutFlyout = ({ isOpen, onClose, projectMetadata, }) => {
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const colors = (0, designToolsColors_1.getDesignUIColors)(colorMode);
    // Only render when open to prevent shadow visibility issues
    if (!isOpen) {
        return null;
    }
    if (!projectMetadata)
        return null;
    // Flyout styles based on the reference image (copied exactly from JobStoriesFlyout)
    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(128, 128, 128, 0.1)",
        zIndex: 2000,
        opacity: isOpen ? 1 : 0,
        transition: "opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)",
        backdropFilter: "blur(1px)",
    };
    const flyoutStyle = {
        position: "fixed",
        top: "16px",
        right: "16px",
        bottom: "16px",
        width: "500px", // Smaller than job stories
        backgroundColor: colorMode === "light" ? "#f8f9fa" : "#1a1a1a",
        borderRadius: "20px",
        boxShadow: colorMode === "light"
            ? "0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)"
            : "0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        zIndex: 2001,
        display: "flex",
        flexDirection: "column",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    };
    const headerStyle = {
        padding: "24px 24px 16px 24px",
        borderBottom: `1px solid ${colorMode === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    };
    const titleStyle = {
        fontSize: "18px",
        fontWeight: "600",
        color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
        margin: 0,
    };
    const closeButtonStyle = {
        width: "32px",
        height: "32px",
        borderRadius: "16px",
        border: "none",
        backgroundColor: colorMode === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
        color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        outline: "none",
    };
    const contentStyle = {
        flex: 1,
        padding: "24px",
        overflow: "auto",
    };
    const sectionStyle = {
        marginBottom: "24px",
    };
    const headingStyle = {
        fontSize: "16px",
        fontWeight: "600",
        color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
        marginBottom: "12px",
        margin: 0,
    };
    const labelStyle = {
        fontSize: "14px",
        fontWeight: "600",
        color: colorMode === "light" ? "#1a1a1a" : "#ffffff",
        marginBottom: "4px",
    };
    const valueStyle = {
        fontSize: "14px",
        color: colorMode === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
        marginBottom: "12px",
    };
    const linkStyle = {
        fontSize: "14px",
        color: colors.link,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: overlayStyle, onClick: onClose, "data-exclude-comments": true }), (0, jsx_runtime_1.jsxs)("div", { style: flyoutStyle, "data-exclude-comments": true, children: [(0, jsx_runtime_1.jsxs)("div", { style: headerStyle, children: [(0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("h2", { style: titleStyle, children: projectMetadata.projectName }) }), (0, jsx_runtime_1.jsx)("button", { style: closeButtonStyle, onClick: onClose, onMouseEnter: (e) => {
                                    e.target.style.backgroundColor =
                                        colorMode === "light"
                                            ? "rgba(0, 0, 0, 0.15)"
                                            : "rgba(255, 255, 255, 0.15)";
                                }, onMouseLeave: (e) => {
                                    e.target.style.backgroundColor =
                                        colorMode === "light"
                                            ? "rgba(0, 0, 0, 0.1)"
                                            : "rgba(255, 255, 255, 0.1)";
                                }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.X, { size: 16, weight: "bold" }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: contentStyle, children: [(0, jsx_runtime_1.jsx)("style", { children: `
              .about-flyout-description-list-title {
                font-size: 14px !important;
                font-weight: 600 !important;
              }
            ` }), (0, jsx_runtime_1.jsx)(eui_1.EuiDescriptionList, { type: "row", align: "left", className: "about-flyout-description-list", titleProps: { className: "about-flyout-description-list-title" }, listItems: [
                                    {
                                        title: "Designer",
                                        description: projectMetadata.designer || "Not specified",
                                    },
                                    {
                                        title: "Product Manager",
                                        description: projectMetadata.pm || "Not specified",
                                    },
                                    ...(projectMetadata.briefDescription
                                        ? [
                                            {
                                                title: "Description",
                                                description: projectMetadata.briefDescription,
                                            },
                                        ]
                                        : []),
                                    ...(projectMetadata.prdLink
                                        ? [
                                            {
                                                title: "PRD",
                                                description: ((0, jsx_runtime_1.jsx)("a", { href: projectMetadata.prdLink, target: "_blank", rel: "noopener noreferrer", style: linkStyle, children: "Open PRD" })),
                                            },
                                        ]
                                        : []),
                                    ...(projectMetadata.githubIssueLink
                                        ? [
                                            {
                                                title: "GitHub Issue",
                                                description: ((0, jsx_runtime_1.jsx)("a", { href: projectMetadata.githubIssueLink, target: "_blank", rel: "noopener noreferrer", style: linkStyle, children: "Open Issue" })),
                                            },
                                        ]
                                        : []),
                                ] })] })] })] }));
};
exports.AboutFlyout = AboutFlyout;
//# sourceMappingURL=AboutFlyout.js.map