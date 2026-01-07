import React from "react";
interface FieldListProps {
    availableFields: string[];
    selectedFields: Record<string, boolean>;
    fieldTypes: Record<string, any>;
    onFieldToggle: (fieldName: string) => void;
    getFieldTypeIcon: (fieldType: any) => string;
    filteredAvailableFieldsCount: number;
    filteredSelectedFieldsCount: number;
}
export declare const FieldList: React.FC<FieldListProps>;
export {};
//# sourceMappingURL=FieldList.d.ts.map