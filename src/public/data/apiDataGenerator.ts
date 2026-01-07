import { DataGenerator, DataGeneratorParams, LogDocument, FieldType } from "./types";

// Helper function to get nested field values using dot notation
const getNestedFieldValue = (obj: any, fieldPath: string): any => {
  return fieldPath.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

export class APIDataGenerator implements DataGenerator<LogDocument> {
  async generateData(params: DataGeneratorParams): Promise<LogDocument[]> {
    try {
      
      // Call the /api/documents endpoint
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: params.indexPattern,
          from: params.from,
          to: params.to,
          size: 1000, // Request more documents for better data
          query: params.searchQuery || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('APIDataGenerator - Raw API response summary:', {
        totalDocuments: data.documents?.length || 0,
        total: data.total,
        hasDocuments: !!data.documents,
        isArray: Array.isArray(data.documents)
      });

      // Extract documents from the response
      let documents: LogDocument[] = [];
      
      if (data.documents && Array.isArray(data.documents)) {
        // Handle the API response format: { documents: [...], total: number, ... }
        documents = data.documents.map((doc: any, index: number) => {
          // Create a LogDocument from the API document
          const logDocument: LogDocument = {
            _id: doc._id || `api-doc-${index}`,
            '@timestamp': doc['@timestamp'] || new Date().toISOString(),
            level: doc.level || doc['log.level'] || doc.event?.category?.[0] || 'info',
            message: doc.message || doc['log.message'] || doc.event?.action || doc.type || 
                    `${doc.data_stream?.dataset || 'observability'} data from ${doc.agent?.name || 'unknown'}` || 'Remote cluster data',
            host: doc.host?.name || doc.host?.hostname || doc.host || 'unknown',
            service: doc.service?.name || doc.service || doc.agent?.name || doc.data_stream?.dataset || 'unknown',
            container_id: doc.container?.id || doc.container_id,
            trace_id: doc.trace?.id || doc.trace_id,
            latency_ms: doc.latency_ms || doc.latency,
            status_code: doc.http?.response?.status_code || doc.status_code,
            user_id: doc.user?.id || doc.user_id,
            method: doc.http?.request?.method || doc.method,
            path: doc.url?.path || doc.path,
            bytes: doc.http?.response?.body?.bytes || doc.bytes,
            memory: doc.system?.memory?.used?.bytes || doc.memory,
            'machine.ram': doc.host?.memory?.total || doc['machine.ram'],
            
            // Include additional fields that might be useful for display
            dataset: doc.data_stream?.dataset,
            agent_type: doc.agent?.type,
            agent_name: doc.agent?.name,
            cloud_provider: doc.cloud?.provider,
            cloud_region: doc.cloud?.region,
            
            // Include all original fields for compatibility
            ...doc,
          };
          
          return logDocument;
        });
      } else if (data.hits && data.hits.hits && Array.isArray(data.hits.hits)) {
        // Handle Elasticsearch response format (backup)
        documents = data.hits.hits.map((hit: any, index: number) => {
          const source = hit._source || {};
          
          const logDocument: LogDocument = {
            _id: hit._id || `api-doc-${index}`,
            '@timestamp': source['@timestamp'] || new Date().toISOString(),
            level: source.level || source['log.level'] || 'info',
            message: source.message || source['log.message'] || 'No message',
            host: source.host?.name || source.host || 'unknown',
            service: source.service?.name || source.service || 'unknown',
            container_id: source.container?.id || source.container_id,
            trace_id: source.trace?.id || source.trace_id,
            latency_ms: source.latency_ms || source.latency,
            status_code: source.http?.response?.status_code || source.status_code,
            user_id: source.user?.id || source.user_id,
            method: source.http?.request?.method || source.method,
            path: source.url?.path || source.path,
            bytes: source.http?.response?.body?.bytes || source.bytes,
            memory: source.system?.memory?.used?.bytes || source.memory,
            'machine.ram': source.host?.memory?.total || source['machine.ram'],
            
            // Include any additional fields from the source
            ...source,
          };
          
          return logDocument;
        });
      } else if (Array.isArray(data)) {
        // Handle case where API returns documents directly as array
        documents = data;
      }

      // Skip frontend search filtering for API data since server already did the search
      // Note: The server-side Elasticsearch query already applied the search filter

      // Apply filters if provided
      if (params.filters && params.filters.length > 0) {
        const beforeFilters = documents.length;
        
        for (const filter of params.filters) {
          const { field, operator, values } = filter;
          
          documents = documents.filter((doc) => {
            const fieldValue = getNestedFieldValue(doc, field);
            if (fieldValue === undefined || fieldValue === null) {
              return false;
            }
            
            const fieldValueStr = String(fieldValue).toLowerCase();
            
            switch (operator) {
              case 'equals':
                return values.some(value => fieldValueStr === value.toLowerCase());
              case 'not_equals':
                return !values.some(value => fieldValueStr === value.toLowerCase());
              case 'contains':
                return values.some(value => fieldValueStr.includes(value.toLowerCase()));
              case 'not_contains':
                return !values.some(value => fieldValueStr.includes(value.toLowerCase()));
              case 'greater_than':
                if (typeof fieldValue === 'number') {
                  return values.some(value => fieldValue > parseFloat(value));
                }
                return false;
              case 'greater_equal':
                if (typeof fieldValue === 'number') {
                  return values.some(value => fieldValue >= parseFloat(value));
                }
                return false;
              case 'less_than':
                if (typeof fieldValue === 'number') {
                  return values.some(value => fieldValue < parseFloat(value));
                }
                return false;
              default:
                return true;
            }
          });
        }
        
      }
      return documents;
      
    } catch (error) {
      console.error('APIDataGenerator - Error fetching data:', error);
      // Return empty array on error
      return [];
    }
  }

  getAvailableFields(data: LogDocument[]): string[] {
    if (!data.length) return [];

    const fields = new Set<string>();
    
    // Helper function to recursively extract field paths
    const extractFields = (obj: any, prefix: string = '') => {
      if (obj === null || obj === undefined) return;
      
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach((key) => {
          const fieldPath = prefix ? `${prefix}.${key}` : key;
          
          // Skip internal fields and type metadata
          if (key === "_id" || key === "type" || fieldPath.includes('.type')) {
            return;
          }
          
          const value = obj[key];
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively process nested objects
            extractFields(value, fieldPath);
          } else {
            // Add the field path
            fields.add(fieldPath);
          }
        });
      }
    };
    
    data.forEach((doc) => {
      extractFields(doc);
    });

    return Array.from(fields).sort();
  }

  formatForDisplay(data: LogDocument[]): LogDocument[] {
    // Return data as-is for logs
    return data;
  }

  // Get field types for API data - this should ideally come from the API
  getFieldTypes(): Record<string, FieldType> {
    // Default field types for common log fields
    return {
      _id: 'keyword',
      '@timestamp': 'time',
      level: 'keyword',
      message: 'string',
      host: 'keyword',
      service: 'keyword',
      container_id: 'keyword',
      trace_id: 'keyword',
      latency_ms: 'number',
      status_code: 'number',
      user_id: 'keyword',
      method: 'keyword',
      path: 'keyword',
      bytes: 'number',
      memory: 'number',
      'machine.ram': 'number',
    };
  }
}