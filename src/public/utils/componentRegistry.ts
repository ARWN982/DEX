import React from 'react';

// This file uses webpack's require.context to automatically discover all components
// No hardcoded version numbers needed!

// Type for the context function
interface WebpackContext {
  (id: string): any;
  keys(): string[];
  resolve(id: string): string;
  id: string;
}

// Declare require.context for TypeScript
declare const require: {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
    mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once'
  ): WebpackContext;
};

// Automatically import all page components using webpack's require.context
function createComponentRegistry(): Record<string, Record<string, React.ComponentType<any>>> {
  const registry: Record<string, Record<string, React.ComponentType<any>>> = {};
  
  try {
    // Use require.context to find all page components automatically
    const componentContext = require.context('../pages', true, /^\.\/[^/]+\/v[\d.]+\/index\.tsx$/);
    
    componentContext.keys().forEach((componentPath) => {
      // Skip simple-esql files (they've been deleted)
      if (componentPath.includes('simple-esql')) {
        return;
      }
      
      // Parse the path: ./esql-simple-mode/v1.0/index.tsx
      const match = componentPath.match(/^\.\/([^/]+)\/v([\d.]+)\/index\.tsx$/);
      
      if (match) {
        const [, pageName, version] = match;
        
        // Skip simple-esql page
        if (pageName === 'simple-esql') {
          return;
        }
        
        try {
          // Load the component
          const componentModule = componentContext(componentPath);
          const component = componentModule.default || componentModule;
          
          if (!component) {
            console.warn(`No component found at ${componentPath}`);
            return;
          }
          
          // Initialize page registry if needed
          if (!registry[pageName]) {
            registry[pageName] = {};
          }
          
          // Register the component
          registry[pageName][version] = component;
          
          console.log(`Registered component: ${pageName}/v${version}`);
        } catch (error) {
          console.warn(`Failed to load component at ${componentPath}:`, error);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to create component registry:', error);
  }
  
  return registry;
}

// Create the registry automatically - no hardcoded versions!
export const componentRegistry = createComponentRegistry();

// Helper function to get a component from the registry
export function getComponentFromRegistry(pageName: string, version: string): React.ComponentType<any> | null {
  const pageComponents = componentRegistry[pageName];
  if (!pageComponents) {
    console.warn(`No components found for page: ${pageName}`);
    return null;
  }
  
  const component = pageComponents[version];
  if (!component) {
    console.warn(`Component not found for ${pageName}/v${version}. Available versions:`, Object.keys(pageComponents));
    return null;
  }
  
  return component;
}