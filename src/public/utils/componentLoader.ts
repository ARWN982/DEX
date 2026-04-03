import React from "react";
import { getCurrentPage } from './pageUtils';
import { VersionRouteLoading } from '../components/shared/VersionRouteLoading';

const isPublishMode = process.env.VIBE_PUBLISH_MODE === 'true';

export interface PageComponent {
  [key: string]: React.ComponentType<any>;
}

// Helper function to get available versions from the server
let cachedVersions: Record<string, string[]> = {}; // Cache per page

const getAvailableVersions = async (pageName?: string): Promise<string[]> => {
  const page = pageName || getCurrentPage();

  if (cachedVersions[page]) {
    return cachedVersions[page];
  }

  if (isPublishMode) {
    try {
      const versions: string[] = JSON.parse(process.env.PUBLISH_VERSIONS || '[]');
      cachedVersions[page] = versions;
      return versions;
    } catch {
      return ['1.0'];
    }
  }

  try {
    const response = await fetch(`/api/versions?page=${page}`);
    const data = await response.json();
    const versions = data.versions.map((v: any) => v.id);
    cachedVersions[page] = versions;
    return versions;
  } catch (error) {
    console.warn("Failed to fetch available versions:", error);
    const fallback = ["1.0", "1.1"];
    cachedVersions[page] = fallback;
    return fallback;
  }
};

/**
 * Clears the cached version list for a page so the next
 * getAvailableVersions call fetches fresh data from the server.
 */
export const invalidateVersionCacheForPage = (pageName?: string): void => {
  const page = pageName || getCurrentPage();
  delete cachedVersions[page];
};

// Import the component registry
import { getComponentFromRegistry } from "./componentRegistry";

// Component loader using the automatic registry - no dynamic imports!
const tryImportComponent = async (
  pageName: string,
  version: string
): Promise<any | null> => {
  try {
    // Check if version exists before attempting to load
    const availableVersions = await getAvailableVersions(pageName);
    if (!availableVersions.includes(version)) {
      console.warn(`Version ${version} not available for ${pageName}`);
      return null;
    }

    console.log(`Loading component: ${pageName}/v${version}`);

    // Get component from the automatically-generated registry
    const component = getComponentFromRegistry(pageName, version);

    if (!component) {
      console.warn(
        `Component not found in registry for ${pageName}/v${version}`
      );
      return null;
    }

    // Return a mock module structure that matches what dynamic imports return
    return {
      default: component,
      [getComponentName(pageName)]: component,
    };
  } catch (error: any) {
    console.warn(
      `Failed to load ${pageName} v${version}:`,
      error?.message || error
    );
    return null;
  }
};

/**
 * Dynamically loads a page component based on the current version
 * Uses code splitting to only load the required version
 */
export const loadVersionedComponent = async (
  pageName: string,
  version: string
): Promise<React.ComponentType<any> | null> => {
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
  } catch (error) {
    console.error(
      `Failed to load component for ${pageName} v${version}:`,
      error
    );
    return null;
  }
};

/**
 * Gets the expected component name from page name
 * Converts kebab-case to PascalCase
 */
const getComponentName = (pageName: string): string => {
  return pageName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
};

/**
 * Checks if an exported item is a React component
 */
const isReactComponent = (exportedItem: any): boolean => {
  if (!exportedItem) return false;

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
export const VersionedComponentLoader: React.FC<{
  pageName: string;
  version: string;
  fallbackComponent?: React.ComponentType<any>;
  loadingComponent?: React.ComponentType<any>;
  onComponentLoaded?: (component: React.ComponentType<any> | null) => void;
  [key: string]: any;
}> = ({
  pageName,
  version,
  fallbackComponent: FallbackComponent,
  loadingComponent: LoadingComponent,
  onComponentLoaded,
  ...props
}) => {
  const [Component, setComponent] =
    React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Track whether we've ever loaded a component so we can keep it
  // visible during subsequent version transitions instead of flashing
  // a spinner.
  const componentRef = React.useRef<React.ComponentType<any> | null>(null);

  const onComponentLoadedRef = React.useRef(onComponentLoaded);
  React.useEffect(() => {
    onComponentLoadedRef.current = onComponentLoaded;
  }, [onComponentLoaded]);

  React.useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      componentRef.current = null;
      setComponent(null);
      setLoading(true);
      setError(null);

      try {
        const LoadedComponent = await loadVersionedComponent(pageName, version);

        if (mounted) {
          if (LoadedComponent) {
            componentRef.current = LoadedComponent;
            setComponent(() => LoadedComponent);
            if (onComponentLoadedRef.current) {
              onComponentLoadedRef.current(LoadedComponent);
            }
          } else {
            setError(`Component not found: ${pageName} v${version}`);
            if (onComponentLoadedRef.current) {
              onComponentLoadedRef.current(null);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setError(`Failed to load ${pageName} v${version}: ${err}`);
        }
      } finally {
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

  if (loading && !Component) {
    if (LoadingComponent) {
      return React.createElement(LoadingComponent);
    }
    return React.createElement(VersionRouteLoading, { pageName });
  }

  if (error || !Component) {
    console.error("VersionedComponentLoader error:", error);
    if (FallbackComponent) {
      return React.createElement(FallbackComponent, props);
    }

    // Show helpful message for empty pages
    const pageNameCapitalized =
      pageName.charAt(0).toUpperCase() + pageName.slice(1);
    const relativePath = `src/public/pages/${pageName}/v${version}/index.tsx`;

    return React.createElement(
      "div",
      {
        style: {
          padding: "40px",
          textAlign: "center",
          color: "#666",
          fontSize: "16px",
          lineHeight: "1.6",
        },
      },
      `This page is empty. Add functionality to it by targeting "${pageNameCapitalized} - v${version}" in your AI agent or by directly editing ${relativePath}`
    );
  }

  return React.createElement(Component, props);
};

/**
 * Higher-order component that wraps a component with version loading
 */
export const withVersionedComponent = <P extends object>(
  pageName: string,
  fallbackComponent?: React.ComponentType<P>
) => {
  return (Component: React.ComponentType<P & { version: string }>) => {
    const WrappedComponent: React.FC<P & { version: string }> = (props) => {
      const { version, ...otherProps } = props;
      return React.createElement(VersionedComponentLoader, {
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
