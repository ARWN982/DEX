import React from "react";
import { DateRange } from "../../store/useAppStore";
interface HistogramProps {
    logs: any[];
    field: string;
    colorMode: "light" | "dark";
    dateRange?: DateRange;
}
export declare const DocumentHistogram: React.FC<HistogramProps>;
export {};
//# sourceMappingURL=DocumentHistogram.d.ts.map