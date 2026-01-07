"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withVersionedComponent = exports.VersionedComponentLoader = exports.loadVersionedComponent = void 0;
const react_1 = __importDefault(require("react"));
const pageUtils_1 = require("./pageUtils");
// Helper function to get available versions from the server
let cachedVersions = {}; // Cache per page
const getAvailableVersions = async (pageName) => {
    const page = pageName || (0, pageUtils_1.getCurrentPage)();
    if (cachedVersions[page]) {
        return cachedVersions[page];
    }
    try {
        const response = await fetch(`/api/versions?page=${page}`);
        const data = await response.json();
        const versions = data.versions.map((v) => v.id);
        cachedVersions[page] = versions;
        return versions;
    }
    catch (error) {
        console.warn("Failed to fetch available versions:", error);
        const fallback = ["1.0", "1.1"];
        cachedVersions[page] = fallback;
        return fallback;
    }
};
// Import the component registry
const componentRegistry_1 = require("./componentRegistry");
// Component loader using the automatic registry - no dynamic imports!
const tryImportComponent = async (pageName, version) => {
    try {
        // Check if version exists before attempting to load
        const availableVersions = await getAvailableVersions(pageName);
        if (!availableVersions.includes(version)) {
            console.warn(`Version ${version} not available for ${pageName}`);
            return null;
        }
        console.log(`Loading component: ${pageName}/v${version}`);
        // Get component from the automatically-generated registry
        const component = (0, componentRegistry_1.getComponentFromRegistry)(pageName, version);
        if (!component) {
            console.warn(`Component not found in registry for ${pageName}/v${version}`);
            return null;
        }
        // Return a mock module structure that matches what dynamic imports return
        return {
            default: component,
            [getComponentName(pageName)]: component,
        };
    }
    catch (error) {
        console.warn(`Failed to load ${pageName} v${version}:`, error?.message || error);
        return null;
    }
};
/**
 * Dynamically loads a page component based on the current version
 * Uses code splitting to only load the required version
 */
const loadVersionedComponent = async (pageName, version) => {
    try {
        const module = await tryImportComponent(pageName, version);
        if (!module) {
            console.warn(`Component not found for ${pageName} v${version}`);
            return null;
        }
        // Try different export patterns (named export, default export, etc.)
        const expectedComponentName = getComponentName(pageName);
        let ComponentClass = module[expectedComponentName] || module.default;
        // If we didn't find the expected component, check all exports for React components
        if (!ComponentClass) {
            const allExports = Object.keys(module);
            for (const exportName of allExports) {
                const exportedItem = module[exportName];
                // Check if it's a React component (function or class with proper shape)
                if (isReactComponent(exportedItem)) {
                    ComponentClass = exportedItem;
                    break;
                }
            }
        }
        // Validate that we found a proper React component
        if (!ComponentClass || !isReactComponent(ComponentClass)) {
            console.warn(`Component not found in module for ${pageName} v${version}`);
            return null;
        }
        return ComponentClass;
    }
    catch (error) {
        console.error(`Failed to load component for ${pageName} v${version}:`, error);
        return null;
    }
};
exports.loadVersionedComponent = loadVersionedComponent;
/**
 * Gets the expected component name from page name
 * Converts kebab-case to PascalCase
 */
const getComponentName = (pageName) => {
    return pageName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
};
/**
 * Checks if an exported item is a React component
 */
const isReactComponent = (exportedItem) => {
    if (!exportedItem)
        return false;
    // Check if it's a function (functional component)
    if (typeof exportedItem === "function") {
        // Additional check: React components should have either displayName, name, or be constructable
        return true;
    }
    // Check if it's a class component (has prototype.render)
    if (typeof exportedItem === "object" && exportedItem.prototype?.render) {
        return true;
    }
    return false;
};
/**
 * React component wrapper that loads versioned components dynamically
 */
const VersionedComponentLoader = ({ pageName, version, fallbackComponent: FallbackComponent, loadingComponent: LoadingComponent, ...props }) => {
    const [Component, setComponent] = react_1.default.useState(null);
    const [loading, setLoading] = react_1.default.useState(true);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        let mounted = true;
        const loadComponent = async () => {
            setLoading(true);
            setError(null);
            try {
                const LoadedComponent = await (0, exports.loadVersionedComponent)(pageName, version);
                if (mounted) {
                    if (LoadedComponent) {
                        setComponent(() => LoadedComponent);
                    }
                    else {
                        setError(`Component not found: ${pageName} v${version}`);
                    }
                }
            }
            catch (err) {
                if (mounted) {
                    setError(`Failed to load ${pageName} v${version}: ${err}`);
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        loadComponent();
        return () => {
            mounted = false;
        };
    }, [pageName, version]);
    if (loading) {
        if (LoadingComponent) {
            return react_1.default.createElement(LoadingComponent);
        }
        return react_1.default.createElement("div", {}, `Loading ${pageName} v${version}...`);
    }
    if (error || !Component) {
        console.error("VersionedComponentLoader error:", error);
        if (FallbackComponent) {
            return react_1.default.createElement(FallbackComponent, props);
        }
        // Show helpful message for empty pages
        const pageNameCapitalized = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        const relativePath = `src/public/pages/${pageName}/v${version}/index.tsx`;
        return react_1.default.createElement("div", {
            style: {
                padding: "40px",
                textAlign: "center",
                color: "#666",
                fontSize: "16px",
                lineHeight: "1.6",
            },
        }, `This page is empty. Add functionality to it by targeting "${pageNameCapitalized} - v${version}" in your AI agent or by directly editing ${relativePath}`);
    }
    return react_1.default.createElement(Component, props);
};
exports.VersionedComponentLoader = VersionedComponentLoader;
/**
 * Higher-order component that wraps a component with version loading
 */
const withVersionedComponent = (pageName, fallbackComponent) => {
    return (Component) => {
        const WrappedComponent = (props) => {
            const { version, ...otherProps } = props;
            return react_1.default.createElement(exports.VersionedComponentLoader, {
                pageName,
                version,
                fallbackComponent,
                ...otherProps,
            });
        };
        WrappedComponent.displayName = `withVersionedComponent(${pageName})`;
        return WrappedComponent;
    };
};
exports.withVersionedComponent = withVersionedComponent;
//# sourceMappingURL=componentLoader.js.map