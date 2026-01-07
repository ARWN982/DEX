/**
 * Utility functions for page/project detection and management
 */
/**
 * Dynamically determines the current page/project from the URL pathname
 * This works for any project folder under 'pages/'
 * @returns The current page/project name (e.g., 'controls', 'esql-simple-mode', etc.)
 */
export declare const getCurrentPage: () => string;
/**
 * Gets all available pages/projects by scanning the current pathname structure
 * This is a helper for understanding what projects are available
 * @returns Array of known project names
 */
export declare const getKnownPages: () => string[];
/**
 * Validates if a given page name is valid
 * @param pageName - The page name to validate
 * @returns boolean indicating if the page is valid
 */
export declare const isValidPage: (pageName: string) => boolean;
//# sourceMappingURL=pageUtils.d.ts.map