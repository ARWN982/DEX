"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NUMERIC_FIELDS = exports.AVAILABLE_HOSTS = exports.AVAILABLE_SERVICES = exports.LOG_LEVELS = exports.LogsDataUtils = exports.useLogsData = void 0;
const react_1 = require("react");
const logsDataGenerator_1 = require("../data/logsDataGenerator");
/**
 * Reusable hook for generating and managing logs data
 * Perfect for designers who want to quickly add realistic log data to their pages
 */
const useLogsData = (params) => {
    const [data, setData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const generator = new logsDataGenerator_1.LogsDataGenerator();
    const generateData = async (customParams) => {
        try {
            setLoading(true);
            setError(null);
            const finalParams = {
                indexPattern: 'logs-*',
                from: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                to: new Date().toISOString(),
                ...params,
                ...customParams
            };
            const logs = await generator.generateData(finalParams);
            setData(logs);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate logs data');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        generateData();
    }, []);
    return {
        data,
        loading,
        error,
        regenerateData: generateData,
        availableFields: generator.getAvailableFields(data),
        fieldTypes: generator.getFieldTypes(),
    };
};
exports.useLogsData = useLogsData;
/**
 * Quick data generation utilities for designers
 */
exports.LogsDataUtils = {
    /**
     * Generate logs with error focus (useful for error dashboards)
     */
    generateErrorLogs: async () => {
        const generator = new logsDataGenerator_1.LogsDataGenerator();
        return await generator.generateData({
            indexPattern: 'logs-*',
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            to: new Date().toISOString(),
            filters: [{
                    field: 'level',
                    operator: 'equals',
                    values: ['error']
                }]
        });
    },
    /**
     * Generate logs for a specific service (useful for service-specific dashboards)
     */
    generateServiceLogs: async (serviceName) => {
        const generator = new logsDataGenerator_1.LogsDataGenerator();
        return await generator.generateData({
            indexPattern: 'logs-*',
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            filters: [{
                    field: 'service',
                    operator: 'equals',
                    values: [serviceName]
                }]
        });
    },
    /**
     * Generate performance-focused logs (high latency)
     */
    generatePerformanceLogs: async () => {
        const generator = new logsDataGenerator_1.LogsDataGenerator();
        return await generator.generateData({
            indexPattern: 'logs-*',
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            filters: [{
                    field: 'latency_ms',
                    operator: 'greater_than',
                    values: ['500']
                }]
        });
    },
    /**
     * Generate aggregated data (useful for summary dashboards)
     */
    generateAggregatedData: async (field, operation, groupBy) => {
        const generator = new logsDataGenerator_1.LogsDataGenerator();
        return await generator.generateData({
            indexPattern: 'logs-*',
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            aggregations: [{
                    operation,
                    field,
                    groupBy
                }]
        });
    },
    /**
     * Clear the data cache (useful for getting fresh data)
     */
    clearCache: () => {
        logsDataGenerator_1.LogsDataGenerator.clearCache();
    }
};
/**
 * Available log levels for filtering
 */
exports.LOG_LEVELS = ['info', 'warn', 'error', 'debug'];
/**
 * Available services for filtering
 */
exports.AVAILABLE_SERVICES = [
    'auditbeat',
    'opbeans-python',
    'opbeans-java',
    'metricbeat',
    'filebeat',
    'heartbeat',
    'elasticsearch',
    'kibana',
    'logstash',
    'apm-server'
];
/**
 * Available hosts for filtering
 */
exports.AVAILABLE_HOSTS = [
    'gke-edge-oblt-edge-oblt-pool-2d608c26-mbwx',
    'gke-prod-cluster-default-pool-7f9a8b2c-xyz',
    'ip-10-0-1-100.ec2.internal',
    'aks-nodepool1-12345678-vmss000000'
];
/**
 * Numeric fields available for aggregations
 */
exports.NUMERIC_FIELDS = [
    'latency_ms',
    'status_code',
    'bytes',
    'memory',
    'machine.ram',
    'host.cpu.cache.l2.size',
    'host.cpu.family',
    'host.cpu.model.id',
    'cloud.instance.id'
];
//# sourceMappingURL=useLogsData.js.map