/**
 * Utility functions for page/project detection and management
 */

/**
 * Dynamically determines the current page/project from the URL pathname
 * This works for any project folder under 'pages/'
 * @returns The current page/project name (e.g., 'controls', 'esql-simple-mode', etc.)
 */
export const getCurrentPage = (): string => {
  const path = window.location.pathname;
  
  // Remove leading slash and get the first segment
  const segments = path.split('/').filter(segment => segment.length > 0);
  
  // If no segments (root path '/'), return empty string
  // This indicates we're on the homepage, not a project page
  if (segments.length === 0) {
    return '';
  }
  
  const firstSegment = segments[0];
  
  // Skip template routes - they don't have project pages
  if (firstSegment === 'templates') {
    return '';
  }
  
  // Otherwise, use the first segment as the page name
  return firstSegment;
};

/**
 * Gets all available pages/projects by scanning the current pathname structure
 * This is a helper for understanding what projects are available
 * @returns Array of known project names
 */
export const getKnownPages = (): string[] => {
  // This could be expanded to dynamically scan available projects
  // For now, return empty array - projects are discovered dynamically via API
  return [];
};

/**
 * Validates if a given page name is valid
 * @param pageName - The page name to validate
 * @returns boolean indicating if the page is valid
 */
export const isValidPage = (pageName: string): boolean => {
  const knownPages = getKnownPages();
  return knownPages.includes(pageName);
};