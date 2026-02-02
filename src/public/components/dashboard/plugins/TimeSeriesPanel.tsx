import React, { useMemo } from "react";
import {
  Chart,
  Settings,
  AreaSeries,
  LineSeries,
  BarSeries,
  Axis,
  ScaleType,
  Position,
  LIGHT_THEME,
  DARK_THEME,
  niceTimeFormatter,
} from "@elastic/charts";
import { useAppStore } from "../../../store/useAppStore";

interface DataPoint {
  x: number; // timestamp in milliseconds
  y: number;
}

interface SeriesData {
  id: string;
  name: string;
  data: DataPoint[];
  color?: string;
}

interface TimeSeriesPanelProps {
  /** Single series data as array of {x, y} points */
  data?: DataPoint[];
  /** Multiple series data */
  series?: SeriesData[];
  /** Chart title (shown on Y axis) */
  title?: string;
  /** Chart type */
  chartType?: "area" | "line" | "bar";
  /** Color for single series */
  color?: string;
  /** Show legend for multiple series */
  showLegend?: boolean;
  /** Y-axis value formatter */
  valueFormatter?: (value: number) => string;
  /** X-axis time formatter */
  timeFormatter?: (value: number) => string;
  /** X-axis title label (e.g., "@timestamp every 3 hours") */
  xAxisTitle?: string;
}

export const TimeSeriesPanel: React.FC<TimeSeriesPanelProps> = ({
  data,
  series,
  title = "Value",
  chartType = "area",
  color,
  showLegend = false,
  valueFormatter = (v) => v.toLocaleString(),
  timeFormatter,
  xAxisTitle,
}) => {
  const { colorMode } = useAppStore();
  const theme = colorMode === "dark" ? DARK_THEME : LIGHT_THEME;

  // Determine time range for axis formatting
  const timeRange = useMemo(() => {
    let allPoints: DataPoint[] = [];
    
    if (data && data.length > 0) {
      allPoints = data;
    } else if (series && series.length > 0) {
      allPoints = series.flatMap((s) => s.data);
    }

    if (allPoints.length === 0) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }

    const timestamps = allPoints.map((p) => p.x);
    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps),
    };
  }, [data, series]);

  // Default time formatter based on range
  const defaultTimeFormatter = useMemo(() => {
    return niceTimeFormatter([timeRange.min, timeRange.max]);
  }, [timeRange]);

  const xAxisFormatter = timeFormatter || defaultTimeFormatter;

  // Generate sample data if none provided
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    
    if (series && series.length > 0) {
      return null; // Will use series data directly
    }

    // Generate sample data for demo
    const now = Date.now();
    const points: DataPoint[] = [];
    for (let i = 0; i < 24; i++) {
      points.push({
        x: now - (23 - i) * 3600000, // Last 24 hours
        y: Math.floor(Math.random() * 100) + 20,
      });
    }
    return points;
  }, [data, series]);

  // Render the appropriate series type
  const renderSeries = () => {
    const SeriesComponent = 
      chartType === "line" ? LineSeries : 
      chartType === "bar" ? BarSeries : 
      AreaSeries;

    if (series && series.length > 0) {
      // Multiple series
      return series.map((s) => (
        <SeriesComponent
          key={s.id}
          id={s.id}
          name={s.name}
          data={s.data}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          color={s.color ? [s.color] : undefined}
        />
      ));
    }

    // Single series
    return (
      <SeriesComponent
        id="timeseries"
        name={title}
        data={chartData || []}
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={["y"]}
        color={color ? [color] : undefined}
      />
    );
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Chart>
        <Settings
          baseTheme={theme}
          showLegend={showLegend}
          legendPosition={Position.Bottom}
        />
        
        {renderSeries()}

        <Axis
          id="bottom"
          position={Position.Bottom}
          title={xAxisTitle}
          tickFormat={xAxisFormatter}
          showOverlappingTicks={false}
        />

        <Axis
          id="left"
          position={Position.Left}
          title={title}
          tickFormat={valueFormatter}
        />
      </Chart>
    </div>
  );
};
