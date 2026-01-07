import {
  Chart,
  Settings,
  BarSeries,
  Axis,
  ScaleType,
  Position,
  HistogramBarSeries,
  Metric,
  LIGHT_THEME,
  DARK_THEME,
} from "@elastic/charts";
import dateMath from "@elastic/datemath";
import { EuiButtonIcon, EuiSuperSelect } from "@elastic/eui";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { DateRange } from "../../store/useAppStore";

interface HistogramProps {
  logs: any[]; // Renamed from logs to documents for clarity, but keeping the prop name for backward compatibility
  field: string;
  colorMode: "light" | "dark";
  dateRange?: DateRange;
}

// Helper types for better type safety
type DataPoint = {
  x: string | number;
  y: number;
  x0?: number; // For histogram bins
};

type HistogramResult = {
  histogramData: DataPoint[];
  axisTitle: string;
  valueFormatter: (d: any) => string;
  scaleType: ScaleType;
  isSingleMetric: boolean;
  metricValue?: number;
  metricTitle?: string;
};

export const DocumentHistogram: React.FC<HistogramProps> = ({
  logs,
  field,
  colorMode,
  dateRange,
}) => {
  // Generate histogram data based on the field
  const {
    histogramData,
    axisTitle,
    valueFormatter,
    scaleType,
    isSingleMetric,
    metricValue,
    metricTitle,
  } = useMemo(() => {
    if (logs.length === 0) {
      return {
        histogramData: [],
        axisTitle: "",
        valueFormatter: (d: any) => `${d}`,
        scaleType: ScaleType.Ordinal,
        isSingleMetric: false,
      };
    }

    // Check if this is a single aggregation result
    console.log("DocumentHistogram - Received logs:", logs, "field:", field);
    const isAggregationData = logs.length === 1 && logs[0].aggregation === true;
    console.log("DocumentHistogram - isAggregationData:", isAggregationData);
    if (isAggregationData) {
      const aggregationLog = logs[0];
      console.log("DocumentHistogram - aggregationLog:", aggregationLog);
      // Find the aggregation field (exclude metadata fields)
      const metricField = Object.keys(aggregationLog).find(
        (key) =>
          !["aggregation", "aggregation_type", "aggregation_field"].includes(
            key
          )
      );

      if (metricField) {
        const value = aggregationLog[metricField];
        // Use the actual field name from the data as the title
        // This ensures we always show the correct operation name
        const title = metricField;
        console.log(
          "DocumentHistogram - Using metric field:",
          metricField,
          "value:",
          value,
          "title:",
          title
        );

        return {
          histogramData: [],
          axisTitle: title,
          valueFormatter: (d: any) => `${d}`,
          scaleType: ScaleType.Ordinal,
          isSingleMetric: true,
          metricValue: typeof value === "number" ? value : parseFloat(value),
          metricTitle: title,
        };
      }
    }

    // Data is already filtered by time range in the data generator
    // No need to filter here - just use logs directly
    const filteredLogs = logs;

    let data: DataPoint[] = [];
    let title = field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    let formatter = (d: any) => `${d}`;
    let scale = ScaleType.Ordinal; // Default scale type

    // Detect data type from the first item with the field
    const sampleItem = filteredLogs.find((item) => item[field] !== undefined);
    const fieldType = sampleItem ? typeof sampleItem[field] : "unknown";

    // Create appropriate visualization based on field type
    // First detect the data type of the field
    const fieldValues = filteredLogs
      .map((log) => log[field])
      .filter((val) => val !== undefined);
    const firstValue = fieldValues[0];
    const fieldDataType = typeof firstValue;

    // Handle different field types with appropriate visualizations
    if (
      field === "@timestamp" ||
      (fieldDataType === "string" &&
        firstValue &&
        /^\d{4}-\d{2}-\d{2}/.test(firstValue))
    ) {
      // For timestamps, bin by time ranges
      const timeData: Record<string, number> = {};

      // Smart bucketing: determine best interval based on actual time range
      const timestamps = filteredLogs
        .map((log) => log[field])
        .filter((ts) => ts)
        .map((ts) => new Date(ts).getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const timeRangeMs = maxTime - minTime;

      // Determine bucket interval based on time range (aiming for 10-30 buckets)
      let bucketIntervalMs: number;
      let formatKey: (date: Date) => string;

      if (timeRangeMs <= 10 * 60 * 1000) {
        // <= 10 minutes: use 30-second buckets
        bucketIntervalMs = 30 * 1000;
        formatKey = (date) => {
          const seconds = Math.floor(date.getSeconds() / 30) * 30;
          return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        };
      } else if (timeRangeMs <= 30 * 60 * 1000) {
        // <= 30 minutes: use 1-minute buckets
        bucketIntervalMs = 60 * 1000;
        formatKey = (date) => {
          return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        };
      } else if (timeRangeMs <= 2 * 60 * 60 * 1000) {
        // <= 2 hours: use 5-minute buckets
        bucketIntervalMs = 5 * 60 * 1000;
        formatKey = (date) => {
          const minutes = Math.floor(date.getMinutes() / 5) * 5;
          return `${date.getHours().toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        };
      } else if (timeRangeMs <= 24 * 60 * 60 * 1000) {
        // <= 24 hours: use 1-hour buckets
        bucketIntervalMs = 60 * 60 * 1000;
        formatKey = (date) => {
          return `${date.getMonth() + 1}/${date.getDate()} ${date
            .getHours()
            .toString()
            .padStart(2, "0")}:00`;
        };
      } else {
        // > 24 hours: use 6-hour buckets
        bucketIntervalMs = 6 * 60 * 60 * 1000;
        formatKey = (date) => {
          const hour = Math.floor(date.getHours() / 6) * 6;
          return `${date.getMonth() + 1}/${date.getDate()} ${hour
            .toString()
            .padStart(2, "0")}:00`;
        };
      }

      // Group logs using the determined bucket interval
      const bucketTimestamps: Record<string, number> = {}; // Store actual bucket timestamp

      filteredLogs.forEach((log) => {
        const timestamp = log[field];
        if (timestamp) {
          const date = new Date(timestamp);

          if (!isNaN(date.getTime())) {
            // Round timestamp down to bucket boundary
            const bucketTime =
              Math.floor(date.getTime() / bucketIntervalMs) * bucketIntervalMs;
            const bucketDate = new Date(bucketTime);
            const key = formatKey(bucketDate);

            timeData[key] = (timeData[key] || 0) + 1;
            bucketTimestamps[key] = bucketTime; // Store the actual timestamp for this bucket
          }
        }
      });

      // If we have actual timestamp data, use it
      if (Object.keys(timeData).length > 0) {
        data = Object.entries(timeData)
          .map(([key, count]) => ({
            key,
            timestamp: bucketTimestamps[key],
            count,
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(({ timestamp, count }) => ({
            x: timestamp,
            y: count,
          }));
      } else {
        // Fallback to sample data if no timestamps
        const now = Date.now();
        const dayAgo = now - 86400000; // 24 hours ago

        data = Array(24)
          .fill(0)
          .map((_, i) => {
            const timestamp = dayAgo + i * 3600000; // each hour
            return {
              x: timestamp,
              y: Math.floor(Math.random() * 100) + 10, // Random count between 10-110
            };
          });
      }

      // Show the applied date range instead of generic "Timestamp Distribution"
      if (dateRange) {
        // Format the date range for display in the requested format
        const formatDateRange = (range: DateRange) => {
          const { start, end } = range;

          // Custom formatter function for the requested format with error handling
          const formatDateTime = (date: Date) => {
            // Validate the date object
            if (!date || isNaN(date.getTime())) {
              return "Invalid date";
            }

            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];

            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");
            const milliseconds = date
              .getMilliseconds()
              .toString()
              .padStart(3, "0");

            // Additional validation for NaN values
            if (
              isNaN(day) ||
              isNaN(year) ||
              isNaN(date.getHours()) ||
              isNaN(date.getMinutes())
            ) {
              return "Invalid date";
            }

            return `${month} ${day}, ${year} @ ${hours}:${minutes}:${seconds}.${milliseconds}`;
          };

          // Parse dates using the same logic as in Discover.tsx
          try {
            const startMoment = dateMath.parse(start);
            const endMoment = dateMath.parse(end, { roundUp: true });

            // Validate dates
            if (!startMoment || !endMoment) {
              return "Custom time range";
            }

            // Convert Moment objects to Date objects
            const startDate = startMoment.toDate();
            const endDate = endMoment.toDate();

            const formattedStart = formatDateTime(startDate);
            const formattedEnd = formatDateTime(endDate);

            return `${formattedStart} - ${formattedEnd}`;
          } catch (error) {
            return "Custom time range";
          }
        };

        title = formatDateRange(dateRange);
      } else {
        title = "Timestamp Distribution";
      }
      formatter = (d: any) => {
        if (typeof d === "number") {
          const momentDate = moment(d);
          return momentDate.isValid()
            ? momentDate.format("MMM DD HH:mm")
            : "Invalid";
        }
        return d;
      };
      scale = ScaleType.Time as any; // Use time scale for proper time-based data
    } else if (
      field === "level" ||
      (fieldDataType === "string" &&
        ["info", "warn", "error", "debug"].includes(firstValue?.toLowerCase()))
    ) {
      // For log levels - count actual levels in the data
      const levelCounts: Record<string, number> = {};

      filteredLogs.forEach((log) => {
        if (log[field]) {
          const level = String(log[field]).toLowerCase();
          levelCounts[level] = (levelCounts[level] || 0) + 1;
        }
      });

      // If we have actual level data, use it
      if (Object.keys(levelCounts).length > 0) {
        data = Object.entries(levelCounts).map(([level, count]) => ({
          x: level,
          y: count,
        }));
      } else {
        // Fallback to sample data
        data = [
          { x: "info", y: 65 },
          { x: "warn", y: 25 },
          { x: "error", y: 10 },
          { x: "debug", y: 30 },
        ];
      }

      title = "Log Level Distribution";
      formatter = (d: string) => d;
      scale = ScaleType.Ordinal;
    } else if (
      field === "status_code" ||
      (fieldDataType === "string" && /^\d{3}$/.test(firstValue)) ||
      (fieldDataType === "number" && firstValue >= 100 && firstValue < 600)
    ) {
      // For status codes - count actual status codes in the data
      const statusCounts: Record<string, number> = {};

      filteredLogs.forEach((log) => {
        if (log[field] !== undefined) {
          const status = String(log[field]);
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });

      // If we have actual status code data, use it
      if (Object.keys(statusCounts).length > 0) {
        data = Object.entries(statusCounts).map(([status, count]) => ({
          x: status,
          y: count,
        }));
      } else {
        // Fallback to sample data
        data = [
          { x: "200", y: 75 },
          { x: "404", y: 15 },
          { x: "500", y: 5 },
          { x: "301", y: 8 },
          { x: "403", y: 3 },
        ];
      }

      title = "HTTP Status Code Distribution";
      formatter = (d: string) => d;
      scale = ScaleType.Ordinal;
    } else if (
      fieldDataType === "number" ||
      field === "latency_ms" ||
      field === "bytes"
    ) {
      // For numeric fields like latency or bytes
      const fieldName =
        field === "latency_ms"
          ? "Latency (ms)"
          : field === "bytes"
          ? "Bytes"
          : field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      // Collect actual values
      const values: number[] = [];
      filteredLogs.forEach((log) => {
        const value = log[field];
        if (
          value !== undefined &&
          (typeof value === "number" || !isNaN(Number(value)))
        ) {
          values.push(typeof value === "number" ? value : Number(value));
        }
      });

      // If we have actual data, create bins based on it
      if (values.length > 0) {
        // Find min and max values
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal;

        // Create appropriate number of bins based on data range
        const bins = Math.min(
          10,
          Math.max(5, Math.ceil(Math.sqrt(values.length)))
        );
        const binSize = range / bins || 1; // Avoid division by zero

        // Initialize bins
        const binCounts: Record<number, number> = {};
        for (let i = 0; i < bins; i++) {
          binCounts[i] = 0;
        }

        // Count values in each bin
        values.forEach((value) => {
          const binIndex = Math.min(
            Math.floor((value - minVal) / binSize),
            bins - 1
          );
          binCounts[binIndex] = (binCounts[binIndex] || 0) + 1;
        });

        // Create histogram data
        for (let i = 0; i < bins; i++) {
          const start = minVal + i * binSize;
          data.push({
            x0: start,
            x: start + binSize,
            y: binCounts[i],
          });
        }

        // For numeric histograms, use linear scale
        scale = ScaleType.Linear as any;
      } else {
        // Fallback to sample data if no actual values
        const maxVal =
          field === "latency_ms" ? 1000 : field === "bytes" ? 10000 : 100;

        // Generate bins with random counts
        const bins = 10;
        const binSize = maxVal / bins;

        for (let i = 0; i < bins; i++) {
          const start = i * binSize;
          data.push({
            x0: start,
            x: start + binSize,
            y: Math.floor(Math.random() * 50) + 5, // Random count between 5-55
          });
        }

        // For numeric histograms, use linear scale
        scale = ScaleType.Linear as any;
      }

      title = `${fieldName} Distribution`;
      formatter =
        field === "latency_ms"
          ? (d: number) => `${Math.round(d)}ms`
          : field === "bytes"
          ? (d: number) => `${Math.round(d)} bytes`
          : (d: number) => `${Math.round(d)}`;
    } else {
      // For other string fields, create categorical distribution
      const valueCounts: Record<string, number> = {};

      filteredLogs.forEach((log) => {
        if (log[field] !== undefined) {
          const value = String(log[field]).substring(0, 30); // Truncate long values
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });

      // If we have actual data, use it
      if (Object.keys(valueCounts).length > 0) {
        // Sort by count and take top values to avoid overcrowding
        data = Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15) // Take top 15 values
          .map(([value, count]) => ({
            x: value,
            y: count,
          }));
      } else {
        // Fallback to sample data
        data = [
          { x: "Value 1", y: 45 },
          { x: "Value 2", y: 30 },
          { x: "Value 3", y: 25 },
          { x: "Value 4", y: 15 },
          { x: "Value 5", y: 10 },
        ];
      }

      title = `${field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())} Distribution`;
      formatter = (d: string) => d;
      scale = ScaleType.Ordinal;
    }

    return {
      histogramData: data,
      axisTitle: title,
      valueFormatter: formatter,
      scaleType: scale,
      isSingleMetric: false,
    };
  }, [logs, field, dateRange]);

  // Toolbar state
  const [autoInterval, setAutoInterval] = useState("Auto interval");
  const [breakdownBy, setBreakdownBy] = useState("No breakdown");

  // Toolbar component
  const renderToolbar = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "32px",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <EuiButtonIcon
          iconType="transitionTopOut"
          aria-label="Field options"
          color="text"
          display="base"
          size="s"
        />
        <EuiSuperSelect
          options={[
            { value: "Auto interval", inputDisplay: "Auto interval" },
            { value: "1 minute", inputDisplay: "1 minute" },
            { value: "5 minutes", inputDisplay: "5 minutes" },
            { value: "15 minutes", inputDisplay: "15 minutes" },
            { value: "30 minutes", inputDisplay: "30 minutes" },
            { value: "1 hour", inputDisplay: "1 hour" },
          ]}
          valueOfSelected={autoInterval}
          onChange={setAutoInterval}
          compressed
          style={{ minWidth: "140px" }}
        />
        <EuiSuperSelect
          options={[
            {
              value: "Breakdown by log.level",
              inputDisplay: "Breakdown by log.level",
            },
            {
              value: "Breakdown by status_code",
              inputDisplay: "Breakdown by status_code",
            },
            {
              value: "Breakdown by message",
              inputDisplay: "Breakdown by message",
            },
            { value: "No breakdown", inputDisplay: "No breakdown" },
          ]}
          valueOfSelected={breakdownBy}
          onChange={setBreakdownBy}
          compressed
          style={{ minWidth: "200px" }}
        />
      </div>
      <div style={{ display: "flex" }}>
        <EuiButtonIcon
          style={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderRight: 0,
          }}
          size="s"
          color="text"
          iconType="pencil"
          display="base"
        />
        <EuiButtonIcon
          style={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          size="s"
          color="text"
          iconType="save"
          display="base"
        />
      </div>
    </div>
  );

  // Show metric chart for single aggregation results
  if (isSingleMetric && metricValue !== undefined) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "0 16px 16px 16px",
        }}
      >
        {renderToolbar()}
        <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
          <Chart>
            <Settings
              theme={colorMode === "dark" ? DARK_THEME : LIGHT_THEME}
              baseTheme={colorMode === "dark" ? DARK_THEME : LIGHT_THEME}
            />
            <Metric
              id="metric"
              data={[
                [
                  {
                    value: metricValue,
                    title: metricTitle || axisTitle,
                    subtitle: "", // Empty subtitle to match the design
                    valueFormatter: (value: number) => {
                      // Format large numbers with commas
                      return new Intl.NumberFormat("en-US").format(value);
                    },
                    color: colorMode === "dark" ? "#000000" : "#ffffff",
                  },
                ],
              ]}
            />
          </Chart>
        </div>
      </div>
    );
  }

  if (histogramData.length === 0) {
    return (
      <div
        style={{
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>No data available for histogram</p>
      </div>
    );
  }

  // Determine if we need a histogram series (for binned data) or bar series
  const needsHistogramSeries =
    histogramData.length > 0 && "x0" in histogramData[0];
  const isTimeSeries = field === "@timestamp";
  const isOrdinal =
    !needsHistogramSeries && typeof histogramData[0]?.x === "string";

  return (
    <div
      className="histogram-section"
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        // padding: "8px 16px 16px 16px",
        padding: "8px",
      }}
    >
      {renderToolbar()}
      <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
        <Chart>
          <Settings
            rotation={0}
            theme={colorMode === "dark" ? DARK_THEME : LIGHT_THEME}
            animateData={false}
            debug={false}
            showLegend={false}
            baseTheme={colorMode === "dark" ? DARK_THEME : LIGHT_THEME}
          />

          {/* Use appropriate chart type based on data */}
          {needsHistogramSeries ? (
            <HistogramBarSeries
              id="histogram"
              name={axisTitle}
              data={histogramData}
              xScaleType={isTimeSeries ? ScaleType.Time : ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor={isTimeSeries ? "x" : (d) => d.x}
              yAccessors={["y"]}
            />
          ) : (
            <BarSeries
              id="bar"
              name={axisTitle}
              data={histogramData}
              xScaleType={
                isTimeSeries
                  ? ScaleType.Time
                  : isOrdinal
                  ? ScaleType.Ordinal
                  : ScaleType.Linear
              }
              yScaleType={ScaleType.Linear}
              xAccessor={isTimeSeries ? "x" : (d) => d.x}
              yAccessors={["y"]}
            />
          )}

          {/* Bottom axis with proper configuration */}
          <Axis
            id="bottom"
            position={Position.Bottom}
            title={axisTitle}
            showOverlappingTicks={false}
            tickFormat={isTimeSeries ? valueFormatter : undefined}
          />

          {/* Left axis for count values */}
          <Axis
            id="left"
            title="results"
            position={Position.Left}
            tickFormat={(d) => (Number.isInteger(d) ? d.toString() : "")}
          />
        </Chart>
      </div>
    </div>
  );
};
