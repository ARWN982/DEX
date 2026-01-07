"use strict";
/**
 * Utility functions for page/project detection and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPage = exports.getKnownPages = exports.getCurrentPage = void 0;
/**
 * Dynamically determines the current page/project from the URL pathname
 * This works for any project folder under 'pages/'
 * @returns The current page/project name (e.g., 'controls', 'esql-simple-mode', etc.)
 */
const getCurrentPage = () => {
    const path = window.location.pathname;
    // Remove leading slash and get the first segment
    const segments = path.split('/').filter(segment => segment.length > 0);
    // If no segments (root path '/'), default to 'simple-esql'
    if (segments.length === 0) {
        return 'simple-esql';
    }
    // Special cases for routes that map to specific pages
    const routeToPageMap = {
        'discover': 'simple-esql',
        // Add more route mappings here as needed
    };
    const firstSegment = segments[0];
    // Check if there's a specific mapping for this route
    if (routeToPageMap[firstSegment]) {
        return routeToPageMap[firstSegment];
    }
    // Otherwise, use the first segment as the page name
    return firstSegment;
};
exports.getCurrentPage = getCurrentPage;
/**
 * Gets all available pages/projects by scanning the current pathname structure
 * This is a helper for understanding what projects are available
 * @returns Array of known project names
 */
const getKnownPages = () => {
    // This could be expanded to dynamically scan available projects
    // For now, return the known projects
    return ['simple-esql'];
};
exports.getKnownPages = getKnownPages;
/**
 * Validates if a given page name is valid
 * @param pageName - The page name to validate
 * @returns boolean indicating if the page is valid
 */
const isValidPage = (pageName) => {
    const knownPages = (0, exports.getKnownPages)();
    return knownPages.includes(pageName);
};
exports.isValidPage = isValidPage;
//# sourceMappingURL=pageUtils.js.map