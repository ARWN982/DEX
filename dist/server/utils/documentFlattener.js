"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: For prototype purposes, using 'any' types to avoid spending time on complex document structure typing.
// In production, these should be properly typed based on the specific document structures being flattened.
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenDocument = flattenDocument;
exports.getStringFieldPaths = getStringFieldPaths;
/**
 * Flattens a nested object into dot notation keys
 * Example: { attributes: { service: { name: "test" } } } becomes { "attributes.service.name": "test" }
 */
function flattenDocument(obj, prefix = '', result = {}) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
                // Recursively flatten nested objects
                flattenDocument(value, newKey, result);
            }
            else {
                // Store the flattened key-value pair
                result[newKey] = value;
            }
        }
    }
    return result;
}
/**
 * Extracts string field paths from a flattened document
 * Only returns paths that have string values (potential dimensions)
 */
function getStringFieldPaths(flatDocument) {
    return Object.entries(flatDocument)
        .filter(([_, value]) => typeof value === 'string')
        .map(([key, _]) => key);
}
//# sourceMappingURL=documentFlattener.js.map