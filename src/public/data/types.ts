// Define common interfaces for data generators and documents

// Base document interface that all document types should extend
export interface BaseDocument {
  _id: string;
  [key: string]: any;
}

// Field type definition for log documents
export type FieldType = 'string' | 'number' | 'ip' | 'time' | 'keyword';

// Interface for log documents
export interface LogDocument extends BaseDocument {
  '@timestamp': string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  host: string;
  service: string;
  container_id?: string;
  trace_id?: string;
  latency_ms?: number;
  status_code?: number;
  user_id?: string;
  method?: string;
  path?: string;
  bytes?: number;
  
  // Field type information
  type?: Record<string, FieldType>;
}


// Interface for data generator
export interface DataGenerator<T extends BaseDocument> {
  generateData(params: DataGeneratorParams): Promise<T[]>;
  getAvailableFields(data: T[]): string[];
  formatForDisplay(data: T[]): any[];
}

// Parameters for data generation
export interface AggregationParams {
  operation: string; // sum, avg, min, max, count, median
  field: string;
  groupBy?: string; // optional field to group by
}

export interface FilterParams {
  field: string;
  operator: string; // equals, not_equals, contains, not_contains, greater_than, greater_equal, less_than
  values: string[];
}

export interface DataGeneratorParams {
  indexPattern: string;
  searchQuery?: string;
  from?: string;
  to?: string;
  filters?: FilterParams[];
  aggregations?: AggregationParams[];
}

// Registry of data generators
export interface DataGeneratorRegistry {
  [indexPattern: string]: DataGenerator<any>;
}
