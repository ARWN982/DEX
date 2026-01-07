export interface BaseDocument {
    _id: string;
    [key: string]: any;
}
export type FieldType = 'string' | 'number' | 'ip' | 'time' | 'keyword';
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
    type?: Record<string, FieldType>;
}
export interface DataGenerator<T extends BaseDocument> {
    generateData(params: DataGeneratorParams): Promise<T[]>;
    getAvailableFields(data: T[]): string[];
    formatForDisplay(data: T[]): any[];
}
export interface AggregationParams {
    operation: string;
    field: string;
    groupBy?: string;
}
export interface FilterParams {
    field: string;
    operator: string;
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
export interface DataGeneratorRegistry {
    [indexPattern: string]: DataGenerator<any>;
}
//# sourceMappingURL=types.d.ts.map