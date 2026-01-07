import { DataGenerator, DataGeneratorParams, LogDocument, FieldType } from "./types";
export declare class APIDataGenerator implements DataGenerator<LogDocument> {
    generateData(params: DataGeneratorParams): Promise<LogDocument[]>;
    getAvailableFields(data: LogDocument[]): string[];
    formatForDisplay(data: LogDocument[]): LogDocument[];
    getFieldTypes(): Record<string, FieldType>;
}
//# sourceMappingURL=apiDataGenerator.d.ts.map