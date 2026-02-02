import React, { useMemo } from "react";
import {
  Chart,
  Settings,
  BarSeries,
  Axis,
  ScaleType,
  Position,
  LIGHT_THEME,
  DARK_THEME,
  niceTimeFormatter,
  StackMode,
} from "@elastic/charts";
import { useAppStore } from "../../../store/useAppStore";
import { useEuiTheme } from "@elastic/eui";

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

interface StackedBarChartPanelProps {
  /** Multiple series data for stacking */
  series: SeriesData[];
  /** Chart title */
  title?: string;
  /** Y-axis title */
  yAxisTitle?: string;
  /** X-axis title */
  xAxisTitle?: string;
  /** Show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: Position;
  /** Y-axis value formatter */
  valueFormatter?: (value: number) => string;
  /** X-axis time formatter */
  timeFormatter?: (value: number) => string;
  /** Stack mode - normal or percentage */
  stackMode?: StackMode;
}

export const StackedBarChartPanel: React.FC<StackedBarChartPanelProps> = ({
  series,
  title,
  yAxisTitle,
  xAxisTitle,
  showLegend = true,
  legendPosition = Position.Right,
  valueFormatter,
  timeFormatter,
  stackMode,
}) => {
  const { colorMode } = useAppStore();
  const { euiTheme } = useEuiTheme();
  const baseTheme = colorMode === "dark" ? DARK_THEME : LIGHT_THEME;

  // Determine time range for axis formatting
  const timeRange = useMemo(() => {
    if (!series || series.length === 0) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }

    const allPoints = series.flatMap((s) => s.data);
    const timestamps = allPoints.map((p) => p.x);
    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps),
    };
  }, [series]);

  // Default time formatter based on range
  const defaultTimeFormatter = useMemo(() => {
    return niceTimeFormatter([timeRange.min, timeRange.max]);
  }, [timeRange]);

  const xAxisFormatter = timeFormatter || defaultTimeFormatter;

  // Default value formatter for GHz
  const defaultValueFormatter = (value: number) => {
    if (value === 0) return "0";
    return `${value}GHz`;
  };

  const yFormatter = valueFormatter || defaultValueFormatter;

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Chart Title */}
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: euiTheme.colors.text,
            marginBottom: 8,
            fontFamily: euiTheme.font.family,
          }}
        >
          {title}
        </div>
      )}
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <Chart>
          <Settings
            baseTheme={baseTheme}
            showLegend={showLegend}
            legendPosition={legendPosition}
            theme={{
              legend: {
                labelOptions: {
                  maxLines: 1,
                },
              },
            }}
          />

          {series.map((s) => (
            <BarSeries
              key={s.id}
              id={s.id}
              name={s.name}
              data={s.data}
              xScaleType={ScaleType.Time}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={["y"]}
              stackAccessors={["x"]}
              stackMode={stackMode}
              color={s.color ? [s.color] : undefined}
            />
          ))}

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
            title={yAxisTitle}
            tickFormat={yFormatter}
          />
        </Chart>
      </div>
    </div>
  );
};
