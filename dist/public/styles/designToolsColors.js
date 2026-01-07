"use strict";
/**
 * Design Tools Color System
 *
 * Centralized color definitions for design tools
 * - Toolbar: Uses reverse theme colors (dark in light mode, light in dark mode)
 * - UI Components: Follow main app theme (light in light mode, dark in dark mode)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonStyles = exports.createBoxShadow = exports.getDesignUIColors = exports.getToolbarColors = exports.designToolsColors = void 0;
exports.designToolsColors = {
    // Light mode colors (used for toolbar in light mode, and UI components in dark mode)
    light: {
        // Background colors
        primary: "#2c2c2c", // Main background for tools
        secondary: "#2a2a2a", // Secondary surfaces (inputs, etc.)
        tertiary: "#333333", // Tertiary surfaces (buttons, etc.)
        // Text colors
        textPrimary: "#ffffff", // Primary text
        textSecondary: "#b3b3b3", // Secondary text
        textMuted: "#666666", // Muted text
        // Border colors
        border: "#333333", // Main borders
        borderLight: "#2a2a2a", // Light borders
        // Interactive colors
        buttonActive: "#ffffff", // Active button text
        buttonInactive: "#666666", // Inactive button text
        buttonHover: "#333333", // Button hover background
        // Accent colors
        accent: "#0d99ff", // Primary accent (blue)
        success: "#1bc47d", // Success (green)
        warning: "#ffb020", // Warning (orange)
        error: "#f9c3d6", // Error (red)
        primaryButton: "#b3c7ff", // Primary color for buttons
        primaryButtonText: "#1a1a1a", // Text color for primary buttons (dark text on light button)
        // Link colors
        link: "#b3c7ff", // Link color for light mode (reverse theme)
        // Shadow colors
        shadowLight: "rgba(0, 0, 0, 0.2)",
        shadowMedium: "rgba(0, 0, 0, 0.4)",
        shadowHeavy: "rgba(0, 0, 0, 0.6)",
    },
    // Dark mode colors (used for toolbar in dark mode, and UI components in light mode)
    dark: {
        // Background colors
        primary: "#ffffff", // Main background for tools
        secondary: "#f8f8f8", // Secondary surfaces (inputs, etc.)
        tertiary: "#e5e5e5", // Tertiary surfaces (buttons, etc.)
        // Text colors
        textPrimary: "#333333", // Primary text
        textSecondary: "#666666", // Secondary text
        textMuted: "#999999", // Muted text
        // Border colors
        border: "#e5e5e5", // Main borders
        borderLight: "#f0f0f0", // Light borders
        // Interactive colors
        buttonActive: "#333333", // Active button text
        buttonInactive: "#999999", // Inactive button text
        buttonHover: "#f0f0f0", // Button hover background
        // Accent colors
        accent: "#0d99ff", // Primary accent (blue)
        success: "#1bc47d", // Success (green)
        warning: "#ffb020", // Warning (orange)
        error: "#8a0f3a", // Error (red)
        primaryButton: "#3d50f5", // Primary color for buttons
        primaryButtonText: "#ffffff", // Text color for primary buttons (white text on dark button)
        // Link colors
        link: "#3d50f5", // Link color for dark mode (reverse theme)
        // Shadow colors
        shadowLight: "rgba(0, 0, 0, 0.08)",
        shadowMedium: "rgba(0, 0, 0, 0.12)",
        shadowHeavy: "rgba(0, 0, 0, 0.16)",
    },
};
/**
 * Get toolbar colors (reverse theme - dark in light mode, light in dark mode)
 * @param colorMode - Current color mode ('light' or 'dark')
 * @returns Color scheme for toolbar (reverse theme)
 */
const getToolbarColors = (colorMode) => {
    return exports.designToolsColors[colorMode];
};
exports.getToolbarColors = getToolbarColors;
/**
 * Get UI colors for design tools (follows main app theme)
 * @param colorMode - Current color mode ('light' or 'dark')
 * @returns Color scheme for UI components (same as app theme)
 */
const getDesignUIColors = (colorMode) => {
    // Return colors that match the app theme instead of reverse
    const baseColors = exports.designToolsColors[colorMode === "light" ? "dark" : "light"];
    return {
        ...baseColors,
        // Override link colors to follow the app theme pattern
        link: colorMode === "light" ? "#3d50f5" : "#b3c7ff",
    };
};
exports.getDesignUIColors = getDesignUIColors;
/**
 * Utility function to create box shadow strings
 */
const createBoxShadow = (colors, intensity = "medium") => {
    const shadowMap = {
        light: colors.shadowLight,
        medium: colors.shadowMedium,
        heavy: colors.shadowHeavy,
    };
    const shadowColor = shadowMap[intensity];
    switch (intensity) {
        case "light":
            return `0 2px 8px ${shadowColor}`;
        case "medium":
            return `0 8px 32px ${shadowColor}`;
        case "heavy":
            return `0 16px 64px ${shadowColor}`;
        default:
            return `0 8px 32px ${shadowColor}`;
    }
};
exports.createBoxShadow = createBoxShadow;
/**
 * Common style patterns for design tools
 */
const getCommonStyles = (colors) => ({
    // Card/panel style
    panel: {
        backgroundColor: colors.primary,
        border: "none",
        borderRadius: "16px",
        boxShadow: (0, exports.createBoxShadow)(colors, "medium"),
        color: colors.textPrimary,
    },
    // Input style
    input: {
        backgroundColor: colors.secondary,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        color: colors.textPrimary,
    },
    // Button style
    button: {
        backgroundColor: colors.tertiary,
        border: "none",
        borderRadius: "8px",
        color: colors.buttonActive,
    },
    // Toolbar style
    toolbar: {
        backgroundColor: colors.primary,
        border: `1px solid ${colors.border}`,
        borderRadius: "28px",
        boxShadow: (0, exports.createBoxShadow)(colors, "medium"),
    },
});
exports.getCommonStyles = getCommonStyles;
//# sourceMappingURL=designToolsColors.js.map