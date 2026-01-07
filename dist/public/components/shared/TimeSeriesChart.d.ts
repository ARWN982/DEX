import React from "react";
interface ChartData {
    x: number;
    y: number;
}
interface SeriesData {
    key: string | Record<string, string>;
    data: ChartData[];
}
interface TimeSeriesChartProps {
    data: ChartData[] | SeriesData[];
    timeRange: {
        from?: string;
        to?: string;
    };
    colorMode: 'light' | 'dark';
    height?: number;
    width?: string;
    isLoading?: boolean;
    error?: string | null;
    chartType?: 'area' | 'line' | 'bar';
    metricName?: string;
    unit?: string;
    showLegend?: boolean;
    colorIndex?: number;
}
export declare const TimeSeriesChart: React.FC<TimeSeriesChartProps>;
export {};
//# sourceMappingURL=TimeSeriesChart.d.ts.map