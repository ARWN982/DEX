"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentRegistry = void 0;
exports.getComponentFromRegistry = getComponentFromRegistry;
// Automatically import all page components using webpack's require.context
function createComponentRegistry() {
    const registry = {};
    try {
        // Use require.context to find all page components automatically
        const componentContext = require.context('../pages', true, /^\.\/[^/]+\/v[\d.]+\/index\.tsx$/);
        componentContext.keys().forEach((componentPath) => {
            // Parse the path: ./esql-simple-mode/v1.0/index.tsx
            const match = componentPath.match(/^\.\/([^/]+)\/v([\d.]+)\/index\.tsx$/);
            if (match) {
                const [, pageName, version] = match;
                // Load the component
                const componentModule = componentContext(componentPath);
                const component = componentModule.default || componentModule;
                // Initialize page registry if needed
                if (!registry[pageName]) {
                    registry[pageName] = {};
                }
                // Register the component
                registry[pageName][version] = component;
                console.log(`Registered component: ${pageName}/v${version}`);
            }
        });
    }
    catch (error) {
        console.warn('Failed to create component registry:', error);
    }
    return registry;
}
// Create the registry automatically - no hardcoded versions!
exports.componentRegistry = createComponentRegistry();
// Helper function to get a component from the registry
function getComponentFromRegistry(pageName, version) {
    const pageComponents = exports.componentRegistry[pageName];
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
//# sourceMappingURL=componentRegistry.js.map