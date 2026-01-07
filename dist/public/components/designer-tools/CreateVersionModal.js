"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVersionModal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const useVersionStore_1 = require("../../store/useVersionStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const CreateVersionModal = ({ isOpen, onClose, }) => {
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const { getCurrentVersion, createVersion } = (0, useVersionStore_1.useVersionStore)();
    const colors = (0, designToolsColors_1.getToolbarColors)(colorMode);
    const [isMajorVersion, setIsMajorVersion] = (0, react_1.useState)(false);
    const [startFromScratch, setStartFromScratch] = (0, react_1.useState)(false);
    const [description, setDescription] = (0, react_1.useState)("");
    const [isCreating, setIsCreating] = (0, react_1.useState)(false);
    const currentVersion = getCurrentVersion();
    // Calculate what the next version number will be
    const getNextVersionNumber = () => {
        const current = currentVersion?.id || "1.0";
        const [major, minor] = current.split(".").map(Number);
        if (isMajorVersion) {
            return `${major + 1}.0`;
        }
        else {
            return `${major}.${minor + 1}`;
        }
    };
    const nextVersionNumber = getNextVersionNumber();
    const versionTypeText = isMajorVersion ? "Major Version" : "Minor Version";
    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await createVersion({
                isMajorVersion,
                startFromScratch,
                description: description.trim() || undefined,
            });
            // Reset form and close modal
            setIsMajorVersion(false);
            setStartFromScratch(false);
            setDescription("");
            onClose();
        }
        catch (error) {
            console.error("Failed to create version:", error);
        }
        finally {
            setIsCreating(false);
        }
    };
    const handleClose = () => {
        if (!isCreating) {
            // Reset form state when closing
            setIsMajorVersion(false);
            setStartFromScratch(false);
            setDescription("");
            onClose();
        }
    };
    if (!isOpen)
        return null;
    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    };
    const modalStyle = {
        backgroundColor: colors.primary,
        borderRadius: "16px",
        padding: "0",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 32px 64px rgba(0, 0, 0, 0.4)",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
    };
    const headerStyle = {
        padding: "24px 24px 0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    };
    const titleStyle = {
        fontSize: "18px",
        fontWeight: "600",
        color: colors.textPrimary,
        margin: 0,
    };
    const closeButtonStyle = {
        width: "32px",
        height: "32px",
        borderRadius: "16px",
        border: "none",
        backgroundColor: "transparent",
        color: colors.textSecondary,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        outline: "none",
    };
    const contentStyle = {
        padding: "24px",
    };
    const sectionStyle = {
        marginBottom: "20px",
    };
    const labelStyle = {
        display: "block",
        fontSize: "14px",
        fontWeight: "500",
        color: colors.textPrimary,
        marginBottom: "8px",
    };
    const previewStyle = {
        fontSize: "16px",
        fontWeight: "600",
        color: colors.accent,
        marginBottom: "8px",
    };
    const checkboxContainerStyle = {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        marginBottom: "12px",
    };
    const checkboxStyle = {
        width: "16px",
        height: "16px",
        accentColor: colors.accent,
    };
    const radioContainerStyle = {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        marginBottom: "12px",
    };
    const radioStyle = {
        width: "16px",
        height: "16px",
        marginTop: "2px",
        accentColor: colors.accent,
    };
    const radioLabelStyle = {
        fontSize: "14px",
        color: colors.textPrimary,
        lineHeight: "1.4",
    };
    const textareaStyle = {
        width: "100%",
        minHeight: "80px",
        padding: "12px",
        borderRadius: "8px",
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.secondary,
        color: colors.textPrimary,
        fontSize: "14px",
        fontFamily: "inherit",
        resize: "vertical",
        outline: "none",
    };
    const footerStyle = {
        padding: "0 24px 24px 24px",
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
    };
    const buttonBaseStyle = {
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
    };
    const cancelButtonStyle = {
        ...buttonBaseStyle,
        backgroundColor: "transparent",
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
    };
    const createButtonStyle = {
        ...buttonBaseStyle,
        backgroundColor: colors.accent,
        color: "#ffffff",
    };
    const createButtonDisabledStyle = {
        ...createButtonStyle,
        backgroundColor: colors.textMuted,
        cursor: "not-allowed",
    };
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("div", { style: overlayStyle, onClick: handleClose, children: (0, jsx_runtime_1.jsxs)("div", { style: modalStyle, onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { style: headerStyle, children: [(0, jsx_runtime_1.jsx)("h2", { style: titleStyle, children: "Create New Version" }), (0, jsx_runtime_1.jsx)("button", { style: closeButtonStyle, onClick: handleClose, disabled: isCreating, onMouseEnter: (e) => {
                                    if (!isCreating) {
                                        e.target.style.backgroundColor =
                                            colors.buttonHover;
                                    }
                                }, onMouseLeave: (e) => {
                                    e.target.style.backgroundColor = "transparent";
                                }, children: (0, jsx_runtime_1.jsx)(phosphor_react_1.X, { size: 16 }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: contentStyle, children: [(0, jsx_runtime_1.jsxs)("div", { style: sectionStyle, children: [(0, jsx_runtime_1.jsx)("label", { style: labelStyle, children: "New Version" }), (0, jsx_runtime_1.jsxs)("div", { style: previewStyle, children: ["Version ", nextVersionNumber] })] }), (0, jsx_runtime_1.jsx)("div", { style: sectionStyle, children: (0, jsx_runtime_1.jsxs)("div", { style: checkboxContainerStyle, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: "majorVersion", checked: isMajorVersion, onChange: (e) => setIsMajorVersion(e.target.checked), style: checkboxStyle, disabled: isCreating }), (0, jsx_runtime_1.jsx)("label", { htmlFor: "majorVersion", style: labelStyle, children: "This is a major version" })] }) }), (0, jsx_runtime_1.jsxs)("div", { style: sectionStyle, children: [(0, jsx_runtime_1.jsx)("label", { style: labelStyle, children: "Create From" }), (0, jsx_runtime_1.jsxs)("div", { style: radioContainerStyle, children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", id: "basedOnCurrent", name: "baseVersion", checked: !startFromScratch, onChange: () => setStartFromScratch(false), style: radioStyle, disabled: isCreating }), (0, jsx_runtime_1.jsxs)("label", { htmlFor: "basedOnCurrent", style: radioLabelStyle, children: ["Based on", " ", (0, jsx_runtime_1.jsxs)("strong", { children: ["Version ", currentVersion?.id || "1.0"] }), (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("span", { style: { color: colors.textSecondary, fontSize: "12px" }, children: "Copy all comments and job stories from current version" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: radioContainerStyle, children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", id: "startFromScratch", name: "baseVersion", checked: startFromScratch, onChange: () => setStartFromScratch(true), style: radioStyle, disabled: isCreating }), (0, jsx_runtime_1.jsxs)("label", { htmlFor: "startFromScratch", style: radioLabelStyle, children: ["Start from scratch", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("span", { style: { color: colors.textSecondary, fontSize: "12px" }, children: "Begin with empty comments and job stories" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: sectionStyle, children: [(0, jsx_runtime_1.jsx)("label", { style: labelStyle, children: "Description (Optional)" }), (0, jsx_runtime_1.jsx)("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe what's new in this version...", style: textareaStyle, disabled: isCreating })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: footerStyle, children: [(0, jsx_runtime_1.jsx)("button", { style: cancelButtonStyle, onClick: handleClose, disabled: isCreating, onMouseEnter: (e) => {
                                    if (!isCreating) {
                                        e.target.style.backgroundColor =
                                            colors.buttonHover;
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!isCreating) {
                                        e.target.style.backgroundColor =
                                            "transparent";
                                    }
                                }, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { style: isCreating ? createButtonDisabledStyle : createButtonStyle, onClick: handleCreate, disabled: isCreating, onMouseEnter: (e) => {
                                    if (!isCreating) {
                                        e.target.style.backgroundColor = "#0084d1";
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!isCreating) {
                                        e.target.style.backgroundColor =
                                            colors.accent;
                                    }
                                }, children: isCreating
                                    ? "Creating..."
                                    : `Create Version ${nextVersionNumber}` })] })] }) }) }));
};
exports.CreateVersionModal = CreateVersionModal;
//# sourceMappingURL=CreateVersionModal.js.map