"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionSwitcher = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const phosphor_react_1 = require("phosphor-react");
const react_1 = require("react");
const useAppStore_1 = require("../../store/useAppStore");
const useVersionStore_1 = require("../../store/useVersionStore");
const designToolsColors_1 = require("../../styles/designToolsColors");
const VersionSwitcher = ({ onCreateVersion }) => {
    const { colorMode } = (0, useAppStore_1.useAppStore)();
    const { versions, currentVersion, isLoading, loadVersions, setActiveVersion, getCurrentVersion } = (0, useVersionStore_1.useVersionStore)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const colors = (0, designToolsColors_1.getToolbarColors)(colorMode);
    // Load versions on mount
    (0, react_1.useEffect)(() => {
        loadVersions();
    }, []);
    const currentVersionObj = getCurrentVersion();
    const handleVersionSelect = async (versionId) => {
        await setActiveVersion(versionId);
        setIsOpen(false);
    };
    const handleCreateVersion = () => {
        setIsOpen(false);
        onCreateVersion?.();
    };
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { style: {
                padding: '8px 12px',
                borderRadius: '16px',
                backgroundColor: colors.secondary,
                color: colors.textSecondary,
                fontSize: '14px',
            }, children: "Loading..." }));
    }
    const dropdownStyle = {
        position: 'relative',
        display: 'inline-block',
    };
    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '16px',
        border: 'none',
        backgroundColor: colors.secondary,
        color: colors.textPrimary,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        outline: 'none',
        minWidth: '120px',
    };
    const buttonHoverStyle = {
        ...buttonStyle,
        backgroundColor: colors.tertiary,
    };
    const menuStyle = {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: '4px',
        backgroundColor: colors.primary,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        minWidth: '200px',
        overflow: 'hidden',
    };
    const menuItemStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        border: 'none',
        backgroundColor: 'transparent',
        color: colors.textPrimary,
        cursor: 'pointer',
        fontSize: '14px',
        width: '100%',
        textAlign: 'left',
        transition: 'background-color 0.2s ease',
    };
    const menuItemHoverStyle = {
        backgroundColor: colors.buttonHover,
    };
    const createButtonStyle = {
        ...menuItemStyle,
        color: colors.accent,
        borderTop: `1px solid ${colors.border}`,
        fontWeight: '500',
    };
    const activeIndicatorStyle = {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: colors.accent,
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: dropdownStyle, children: [(0, jsx_runtime_1.jsxs)("button", { style: isOpen ? buttonHoverStyle : buttonStyle, onClick: () => setIsOpen(!isOpen), onMouseEnter: (e) => {
                    if (!isOpen) {
                        Object.assign(e.currentTarget.style, buttonHoverStyle);
                    }
                }, onMouseLeave: (e) => {
                    if (!isOpen) {
                        Object.assign(e.currentTarget.style, buttonStyle);
                    }
                }, children: [(0, jsx_runtime_1.jsx)("span", { children: currentVersionObj?.name || `Version ${currentVersion}` }), (0, jsx_runtime_1.jsx)(phosphor_react_1.CaretDown, { size: 14, style: {
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        } })] }), isOpen && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                        }, onClick: () => setIsOpen(false) }), (0, jsx_runtime_1.jsxs)("div", { style: menuStyle, children: [versions.map((version) => ((0, jsx_runtime_1.jsxs)("button", { style: menuItemStyle, onClick: () => handleVersionSelect(version.id), onMouseEnter: (e) => {
                                    Object.assign(e.currentTarget.style, menuItemHoverStyle);
                                }, onMouseLeave: (e) => {
                                    Object.assign(e.currentTarget.style, menuItemStyle);
                                }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: version.isActive ? '600' : '400' }, children: version.name }), version.description && ((0, jsx_runtime_1.jsx)("div", { style: {
                                                    fontSize: '12px',
                                                    color: colors.textSecondary,
                                                    marginTop: '2px'
                                                }, children: version.description }))] }), version.isActive && (0, jsx_runtime_1.jsx)("div", { style: activeIndicatorStyle })] }, version.id))), (0, jsx_runtime_1.jsx)("button", { style: createButtonStyle, onClick: handleCreateVersion, onMouseEnter: (e) => {
                                    Object.assign(e.currentTarget.style, {
                                        ...createButtonStyle,
                                        backgroundColor: colors.buttonHover,
                                    });
                                }, onMouseLeave: (e) => {
                                    Object.assign(e.currentTarget.style, createButtonStyle);
                                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)(phosphor_react_1.Plus, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: "Create New Version" })] }) })] })] }))] }));
};
exports.VersionSwitcher = VersionSwitcher;
//# sourceMappingURL=VersionSwitcher.js.map