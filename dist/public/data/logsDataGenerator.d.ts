import { DataGenerator, DataGeneratorParams, LogDocument, FieldType } from "./types";
export declare class LogsDataGenerator implements DataGenerator<LogDocument> {
    private static cachedLogs;
    private fieldTypeMap;
    generateData(params: DataGeneratorParams): Promise<LogDocument[]>;
    getAvailableFields(data: LogDocument[]): string[];
    formatForDisplay(data: LogDocument[]): LogDocument[];
    private static cachedData;
    static clearCache(): void;
    private generateSampleLogData;
    getFieldTypes(): Record<string, FieldType>;
}
//# sourceMappingURL=logsDataGenerator.d.ts.map