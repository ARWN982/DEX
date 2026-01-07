"use strict";
/**
 * Data source generator utility for creating realistic Elasticsearch data sources
 * for prototyping and design work.
 *
 * This utility provides a comprehensive list of anonymized data sources
 * categorized by type (Integration, Stream, Index) based on real-world patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = exports.dataSourceTypes = void 0;
exports.getDataSources = getDataSources;
exports.getDataSourcesByType = getDataSourcesByType;
exports.getDataSourcesBySearch = getDataSourcesBySearch;
exports.filterDataSources = filterDataSources;
exports.createLabelToIndexMapping = createLabelToIndexMapping;
exports.createIndexToLabelMapping = createIndexToLabelMapping;
exports.getDataSourcesByCategory = getDataSourcesByCategory;
exports.getDataSourceCounts = getDataSourceCounts;
// Data source types
exports.dataSourceTypes = ["Integration", "Stream", "Index"];
/**
 * Comprehensive list of realistic data source options
 * Generated from real Elasticsearch deployment patterns and anonymized
 */
exports.dataSourceOptions = [
    // Integrations (start with capital letters)
    { label: "ActiveMQ", type: "Integration" },
    { label: "Akamai", type: "Integration" },
    { label: "Apache HTTP Server", type: "Integration" },
    { label: "Apache Spark", type: "Integration" },
    { label: "Docker", type: "Integration" },
    { label: "Elastic Agent", type: "Integration" },
    { label: "Kubernetes", type: "Integration" },
    { label: "MongoDB", type: "Integration" },
    { label: "MySQL", type: "Integration" },
    { label: "Nginx", type: "Integration" },
    { label: "PostgreSQL", type: "Integration" },
    { label: "Redis", type: "Integration" },
    { label: "AWS CloudTrail", type: "Integration" },
    { label: "Azure Monitor", type: "Integration" },
    { label: "Google Cloud Platform", type: "Integration" },
    { label: "Salesforce", type: "Integration" },
    { label: "Office 365", type: "Integration" },
    { label: "Okta", type: "Integration" },
    // Streams (infrastructure and system data streams)
    { label: ".alerts-security.alerts-default", type: "Stream" },
    { label: ".kibana-event-log-*", type: "Stream" },
    { label: ".slo-observability.sli", type: "Stream" },
    { label: "elastic-cluster-sample-2025-03-10", type: "Stream" },
    { label: "elastic-cluster-serverless-1", type: "Stream" },
    { label: "elastic-cluster-w-slos", type: "Stream" },
    { label: "elastic-graph-2025-03-10", type: "Stream" },
    { label: "elastic-overview-relationships-test", type: "Stream" },
    { label: "elastic-overview-serverless-slos-2", type: "Stream" },
    { label: "elastic-overview-slos-2", type: "Stream" },
    { label: "elastic-overview-slos-3", type: "Stream" },
    // Index patterns (logs, metrics, profiling data)
    { label: "alerts-*", type: "Index" },
    { label: "logs-*", type: "Index" },
    { label: "auditbeat-*", type: "Index" },
    { label: "filebeat-*", type: "Index" },
    { label: "metricbeat-*", type: "Index" },
    { label: "packetbeat-*", type: "Index" },
    { label: "winlogbeat-*", type: "Index" },
    { label: "heartbeat-*", type: "Index" },
    { label: "apm-*", type: "Index" },
    { label: "synthetics-browser-classic_space", type: "Index" },
    { label: "synthetics-browser-default", type: "Index" },
    { label: "synthetics-browser.network-classic_space", type: "Index" },
    { label: "synthetics-browser.network-default", type: "Index" },
    { label: "synthetics-browser.screenshot-classic_space", type: "Index" },
    { label: "synthetics-browser.screenshot-default", type: "Index" },
    { label: "synthetics-http-default", type: "Index" },
    { label: "synthetics-icmp-classic_space", type: "Index" },
    { label: "profiling-events-5pow09", type: "Index" },
    { label: "profiling-events-5pow10", type: "Index" },
    { label: "profiling-events-5pow11", type: "Index" },
    { label: "profiling-events-all", type: "Index" },
    { label: "profiling-executables", type: "Index" },
    { label: "profiling-hosts", type: "Index" },
    { label: "profiling-metrics", type: "Index" },
    { label: "profiling-returnpads-private", type: "Index" },
    { label: "profiling-sq-executables", type: "Index" },
    { label: "profiling-sq-leafframes", type: "Index" },
    { label: "profiling-stackframes", type: "Index" },
    { label: "profiling-stacktraces", type: "Index" },
    { label: "metrics-apm.app.accountingservice-default", type: "Index" },
    { label: "metrics-apm.app.adservice-default", type: "Index" },
    { label: "metrics-apm.app.aws-lambdas-default", type: "Index" },
    { label: "metrics-apm.app.azure-functions-default", type: "Index" },
    { label: "metrics-apm.app.cartservice-default", type: "Index" },
    { label: "metrics-apm.app.checkoutservice-default", type: "Index" },
    { label: "metrics-apm.app.currencyservice-default", type: "Index" },
    { label: "metrics-apm.app.emailservice-default", type: "Index" },
    { label: "metrics-apm.app.flagd-default", type: "Index" },
    { label: "metrics-apm.app.frauddetectionservice-default", type: "Index" },
    { label: "metrics-apm.app.frontend-default", type: "Index" },
    { label: "metrics-apm.app.frontend_web-default", type: "Index" },
    { label: "logs-elastic_agent-default", type: "Index" },
    { label: "logs-elastic_agent.filebeat-default", type: "Index" },
    { label: "logs-elastic_agent.metricbeat-default", type: "Index" },
    { label: "logs-generic.otel-default", type: "Index" },
    { label: "logs-kubernetes.container_logs-default", type: "Index" },
    { label: "logs-microsoft_sqlserver.log-default", type: "Index" },
    { label: "logs-mysql.error-default", type: "Index" },
    { label: "logs-mysql.slowlog-default", type: "Index" },
    { label: "logs-nginx.access-default", type: "Index" },
    { label: "logs-postgresql.log-default", type: "Index" },
    { label: "logs-synth-default", type: "Index" },
    { label: "logs-system.auth-default", type: "Index" },
    { label: "customer-bps-graph-data", type: "Index" },
    { label: "customer-graph-bps", type: "Index" },
    { label: "customer-graph-bps-1", type: "Index" },
    { label: "customer-graph-bps-2025-03-11", type: "Index" },
    { label: "customer-graph-bps-2025-03-11-c", type: "Index" },
    { label: "customer-graph-bps-2025-03-11_b", type: "Index" },
    { label: "customer-sample-dashboards-alerts-tags", type: "Index" },
    { label: "core-entities-1", type: "Index" },
    { label: "entities-sample-1", type: "Index" },
    { label: "entities-sample-2", type: "Index" },
    { label: "esql-test-host-os", type: "Index" },
];
/**
 * Get all data source options
 * @returns Array of data source options with labels and types
 */
function getDataSources() {
    return exports.dataSourceOptions;
}
/**
 * Filter data sources by type
 * @param types - Array of data source types to filter by
 * @returns Filtered array of data source options
 */
function getDataSourcesByType(types) {
    if (types.length === 0)
        return exports.dataSourceOptions;
    return exports.dataSourceOptions.filter(option => types.includes(option.type));
}
/**
 * Filter data sources by search term
 * @param searchTerm - Text to search for in data source labels
 * @returns Filtered array of data source options
 */
function getDataSourcesBySearch(searchTerm) {
    if (!searchTerm.trim())
        return exports.dataSourceOptions;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return exports.dataSourceOptions.filter(option => option.label.toLowerCase().includes(lowerSearchTerm));
}
/**
 * Filter data sources by both type and search term
 * @param types - Array of data source types to filter by
 * @param searchTerm - Text to search for in data source labels
 * @returns Filtered array of data source options
 */
function filterDataSources(types, searchTerm) {
    let filtered = exports.dataSourceOptions;
    // Apply type filter
    if (types.length > 0) {
        filtered = filtered.filter(option => types.includes(option.type));
    }
    // Apply search filter
    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(option => option.label.toLowerCase().includes(lowerSearchTerm));
    }
    return filtered;
}
/**
 * Create mappings for label to index conversion
 * By default, labels map to themselves in lowercase
 * @param customMappings - Optional custom mappings to override defaults
 * @returns Object mapping display labels to actual index values
 */
function createLabelToIndexMapping(customMappings = {}) {
    const defaultMappings = Object.fromEntries(exports.dataSourceOptions.map(option => [option.label, option.label.toLowerCase()]));
    return { ...defaultMappings, ...customMappings };
}
/**
 * Create reverse mappings for index to label conversion
 * @param labelToIndexMapping - Mapping from labels to indices
 * @returns Object mapping index values to display labels
 */
function createIndexToLabelMapping(labelToIndexMapping) {
    return Object.fromEntries(Object.entries(labelToIndexMapping).map(([label, index]) => [index, label]));
}
/**
 * Get data sources by category (grouped by type)
 * @returns Object with data sources grouped by type
 */
function getDataSourcesByCategory() {
    const grouped = exports.dataSourceOptions.reduce((acc, option) => {
        if (!acc[option.type]) {
            acc[option.type] = [];
        }
        acc[option.type].push(option);
        return acc;
    }, {});
    return grouped;
}
/**
 * Get count of data sources by type
 * @returns Object with counts for each data source type
 */
function getDataSourceCounts() {
    const counts = exports.dataSourceOptions.reduce((acc, option) => {
        acc[option.type] = (acc[option.type] || 0) + 1;
        return acc;
    }, {});
    return counts;
}
//# sourceMappingURL=dataSourceGenerator.js.map