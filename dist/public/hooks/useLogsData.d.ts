import { LogDocument, DataGeneratorParams } from '../data/types';
/**
 * Reusable hook for generating and managing logs data
 * Perfect for designers who want to quickly add realistic log data to their pages
 */
export declare const useLogsData: (params?: Partial<DataGeneratorParams>) => {
    data: LogDocument[];
    loading: boolean;
    error: string | null;
    regenerateData: (customParams?: Partial<DataGeneratorParams>) => Promise<void>;
    availableFields: string[];
    fieldTypes: Record<string, import("../data/types").FieldType>;
};
/**
 * Quick data generation utilities for designers
 */
export declare const LogsDataUtils: {
    /**
     * Generate logs with error focus (useful for error dashboards)
     */
    generateErrorLogs: () => Promise<LogDocument[]>;
    /**
     * Generate logs for a specific service (useful for service-specific dashboards)
     */
    generateServiceLogs: (serviceName: string) => Promise<LogDocument[]>;
    /**
     * Generate performance-focused logs (high latency)
     */
    generatePerformanceLogs: () => Promise<LogDocument[]>;
    /**
     * Generate aggregated data (useful for summary dashboards)
     */
    generateAggregatedData: (field: string, operation: "sum" | "avg" | "min" | "max" | "count" | "median", groupBy?: string) => Promise<LogDocument[]>;
    /**
     * Clear the data cache (useful for getting fresh data)
     */
    clearCache: () => void;
};
/**
 * Available log levels for filtering
 */
export declare const LOG_LEVELS: readonly ["info", "warn", "error", "debug"];
/**
 * Available services for filtering
 */
export declare const AVAILABLE_SERVICES: readonly ["auditbeat", "opbeans-python", "opbeans-java", "metricbeat", "filebeat", "heartbeat", "elasticsearch", "kibana", "logstash", "apm-server"];
/**
 * Available hosts for filtering
 */
export declare const AVAILABLE_HOSTS: readonly ["gke-edge-oblt-edge-oblt-pool-2d608c26-mbwx", "gke-prod-cluster-default-pool-7f9a8b2c-xyz", "ip-10-0-1-100.ec2.internal", "aks-nodepool1-12345678-vmss000000"];
/**
 * Numeric fields available for aggregations
 */
export declare const NUMERIC_FIELDS: readonly ["latency_ms", "status_code", "bytes", "memory", "machine.ram", "host.cpu.cache.l2.size", "host.cpu.family", "host.cpu.model.id", "cloud.instance.id"];
//# sourceMappingURL=useLogsData.d.ts.map