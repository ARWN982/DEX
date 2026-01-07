import { useState, useEffect } from 'react';
import { LogsDataGenerator } from '../data/logsDataGenerator';
import { LogDocument, DataGeneratorParams } from '../data/types';

/**
 * Reusable hook for generating and managing logs data
 * Perfect for designers who want to quickly add realistic log data to their pages
 */
export const useLogsData = (params?: Partial<DataGeneratorParams>) => {
  const [data, setData] = useState<LogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generator = new LogsDataGenerator();

  const generateData = async (customParams?: Partial<DataGeneratorParams>) => {
    try {
      setLoading(true);
      setError(null);

      const finalParams: DataGeneratorParams = {
        indexPattern: 'logs-*',
        from: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        to: new Date().toISOString(),
        ...params,
        ...customParams
      };

      const logs = await generator.generateData(finalParams);
      setData(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate logs data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

/**
 * Quick data generation utilities for designers
 */
export const LogsDataUtils = {
  /**
   * Generate logs with error focus (useful for error dashboards)
   */
  generateErrorLogs: async () => {
    const generator = new LogsDataGenerator();
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
  generateServiceLogs: async (serviceName: string) => {
    const generator = new LogsDataGenerator();
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
    const generator = new LogsDataGenerator();
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
  generateAggregatedData: async (field: string, operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median', groupBy?: string) => {
    const generator = new LogsDataGenerator();
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
    LogsDataGenerator.clearCache();
  }
};

/**
 * Available log levels for filtering
 */
export const LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const;

/**
 * Available services for filtering
 */
export const AVAILABLE_SERVICES = [
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
] as const;

/**
 * Available hosts for filtering
 */
export const AVAILABLE_HOSTS = [
  'gke-edge-oblt-edge-oblt-pool-2d608c26-mbwx',
  'gke-prod-cluster-default-pool-7f9a8b2c-xyz',
  'ip-10-0-1-100.ec2.internal',
  'aks-nodepool1-12345678-vmss000000'
] as const;

/**
 * Numeric fields available for aggregations
 */
export const NUMERIC_FIELDS = [
  'latency_ms',
  'status_code', 
  'bytes',
  'memory',
  'machine.ram',
  'host.cpu.cache.l2.size',
  'host.cpu.family',
  'host.cpu.model.id',
  'cloud.instance.id'
] as const;