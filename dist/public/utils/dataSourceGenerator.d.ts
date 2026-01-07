/**
 * Data source generator utility for creating realistic Elasticsearch data sources
 * for prototyping and design work.
 *
 * This utility provides a comprehensive list of anonymized data sources
 * categorized by type (Integration, Stream, Index) based on real-world patterns.
 */
export declare const dataSourceTypes: readonly ["Integration", "Stream", "Index"];
export type DataSourceType = (typeof dataSourceTypes)[number];
export interface DataSourceOption {
    label: string;
    type: DataSourceType;
}
/**
 * Comprehensive list of realistic data source options
 * Generated from real Elasticsearch deployment patterns and anonymized
 */
export declare const dataSourceOptions: DataSourceOption[];
/**
 * Get all data source options
 * @returns Array of data source options with labels and types
 */
export declare function getDataSources(): DataSourceOption[];
/**
 * Filter data sources by type
 * @param types - Array of data source types to filter by
 * @returns Filtered array of data source options
 */
export declare function getDataSourcesByType(types: DataSourceType[]): DataSourceOption[];
/**
 * Filter data sources by search term
 * @param searchTerm - Text to search for in data source labels
 * @returns Filtered array of data source options
 */
export declare function getDataSourcesBySearch(searchTerm: string): DataSourceOption[];
/**
 * Filter data sources by both type and search term
 * @param types - Array of data source types to filter by
 * @param searchTerm - Text to search for in data source labels
 * @returns Filtered array of data source options
 */
export declare function filterDataSources(types: DataSourceType[], searchTerm: string): DataSourceOption[];
/**
 * Create mappings for label to index conversion
 * By default, labels map to themselves in lowercase
 * @param customMappings - Optional custom mappings to override defaults
 * @returns Object mapping display labels to actual index values
 */
export declare function createLabelToIndexMapping(customMappings?: Record<string, string>): Record<string, string>;
/**
 * Create reverse mappings for index to label conversion
 * @param labelToIndexMapping - Mapping from labels to indices
 * @returns Object mapping index values to display labels
 */
export declare function createIndexToLabelMapping(labelToIndexMapping: Record<string, string>): Record<string, string>;
/**
 * Get data sources by category (grouped by type)
 * @returns Object with data sources grouped by type
 */
export declare function getDataSourcesByCategory(): Record<DataSourceType, DataSourceOption[]>;
/**
 * Get count of data sources by type
 * @returns Object with counts for each data source type
 */
export declare function getDataSourceCounts(): Record<DataSourceType, number>;
//# sourceMappingURL=dataSourceGenerator.d.ts.map