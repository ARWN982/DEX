/**
 * Design Tools Color System
 *
 * Centralized color definitions for design tools
 * - Toolbar: Uses reverse theme colors (dark in light mode, light in dark mode)
 * - UI Components: Follow main app theme (light in light mode, dark in dark mode)
 */
export interface DesignToolsColorScheme {
    primary: string;
    secondary: string;
    tertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    buttonActive: string;
    buttonInactive: string;
    buttonHover: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    primaryButton: string;
    primaryButtonText: string;
    link: string;
    shadowLight: string;
    shadowMedium: string;
    shadowHeavy: string;
}
export declare const designToolsColors: {
    light: DesignToolsColorScheme;
    dark: DesignToolsColorScheme;
};
/**
 * Get toolbar colors (reverse theme - dark in light mode, light in dark mode)
 * @param colorMode - Current color mode ('light' or 'dark')
 * @returns Color scheme for toolbar (reverse theme)
 */
export declare const getToolbarColors: (colorMode: "light" | "dark") => DesignToolsColorScheme;
/**
 * Get UI colors for design tools (follows main app theme)
 * @param colorMode - Current color mode ('light' or 'dark')
 * @returns Color scheme for UI components (same as app theme)
 */
export declare const getDesignUIColors: (colorMode: "light" | "dark") => DesignToolsColorScheme;
/**
 * Utility function to create box shadow strings
 */
export declare const createBoxShadow: (colors: DesignToolsColorScheme, intensity?: "light" | "medium" | "heavy") => string;
/**
 * Common style patterns for design tools
 */
export declare const getCommonStyles: (colors: DesignToolsColorScheme) => {
    panel: {
        backgroundColor: string;
        border: string;
        borderRadius: string;
        boxShadow: string;
        color: string;
    };
    input: {
        backgroundColor: string;
        border: string;
        borderRadius: string;
        color: string;
    };
    button: {
        backgroundColor: string;
        border: string;
        borderRadius: string;
        color: string;
    };
    toolbar: {
        backgroundColor: string;
        border: string;
        borderRadius: string;
        boxShadow: string;
    };
};
//# sourceMappingURL=designToolsColors.d.ts.map