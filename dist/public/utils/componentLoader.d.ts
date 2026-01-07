import React from "react";
export interface PageComponent {
    [key: string]: React.ComponentType<any>;
}
/**
 * Dynamically loads a page component based on the current version
 * Uses code splitting to only load the required version
 */
export declare const loadVersionedComponent: (pageName: string, version: string) => Promise<React.ComponentType<any> | null>;
/**
 * React component wrapper that loads versioned components dynamically
 */
export declare const VersionedComponentLoader: React.FC<{
    pageName: string;
    version: string;
    fallbackComponent?: React.ComponentType<any>;
    loadingComponent?: React.ComponentType<any>;
    [key: string]: any;
}>;
/**
 * Higher-order component that wraps a component with version loading
 */
export declare const withVersionedComponent: <P extends object>(pageName: string, fallbackComponent?: React.ComponentType<P>) => (Component: React.ComponentType<P & {
    version: string;
}>) => React.FC<P & {
    version: string;
}>;
//# sourceMappingURL=componentLoader.d.ts.map