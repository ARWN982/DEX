/**
 * Flattens a nested object into dot notation keys
 * Example: { attributes: { service: { name: "test" } } } becomes { "attributes.service.name": "test" }
 */
export declare function flattenDocument(obj: any, prefix?: string, result?: Record<string, any>): Record<string, any>;
/**
 * Extracts string field paths from a flattened document
 * Only returns paths that have string values (potential dimensions)
 */
export declare function getStringFieldPaths(flatDocument: Record<string, any>): string[];
//# sourceMappingURL=documentFlattener.d.ts.map