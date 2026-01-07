"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentHistogram = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const charts_1 = require("@elastic/charts");
const datemath_1 = __importDefault(require("@elastic/datemath"));
const eui_1 = require("@elastic/eui");
const moment_1 = __importDefault(require("moment"));
const react_1 = require("react");
const DocumentHistogram = ({ logs, field, colorMode, dateRange, }) => {
    // Generate histogram data based on the field
    const { histogramData, axisTitle, valueFormatter, scaleType, isSingleMetric, metricValue, metricTitle, } = (0, react_1.useMemo)(() => {
        if (logs.length === 0) {
            return {
                histogramData: [],
                axisTitle: "",
                valueFormatter: (d) => `${d}`,
                scaleType: charts_1.ScaleType.Ordinal,
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
            const metricField = Object.keys(aggregationLog).find((key) => !["aggregation", "aggregation_type", "aggregation_field"].includes(key));
            if (metricField) {
                const value = aggregationLog[metricField];
                // Use the actual field name from the data as the title
                // This ensures we always show the correct operation name
                const title = metricField;
                console.log("DocumentHistogram - Using metric field:", metricField, "value:", value, "title:", title);
                return {
                    histogramData: [],
                    axisTitle: title,
                    valueFormatter: (d) => `${d}`,
                    scaleType: charts_1.ScaleType.Ordinal,
                    isSingleMetric: true,
                    metricValue: typeof value === "number" ? value : parseFloat(value),
                    metricTitle: title,
                };
            }
        }
        // Data is already filtered by time range in the data generator
        // No need to filter here - just use logs directly
        const filteredLogs = logs;
        let data = [];
        let title = field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
        let formatter = (d) => `${d}`;
        let scale = charts_1.ScaleType.Ordinal; // Default scale type
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
        if (field === "@timestamp" ||
            (fieldDataType === "string" &&
                firstValue &&
                /^\d{4}-\d{2}-\d{2}/.test(firstValue))) {
            // For timestamps, bin by time ranges
            const timeData = {};
            // Smart bucketing: determine best interval based on actual time range
            const timestamps = filteredLogs
                .map((log) => log[field])
                .filter((ts) => ts)
                .map((ts) => new Date(ts).getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const timeRangeMs = maxTime - minTime;
            // Determine bucket interval based on time range (aiming for 10-30 buckets)
            let bucketIntervalMs;
            let formatKey;
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
            }
            else if (timeRangeMs <= 30 * 60 * 1000) {
                // <= 30 minutes: use 1-minute buckets
                bucketIntervalMs = 60 * 1000;
                formatKey = (date) => {
                    return `${date.getHours().toString().padStart(2, "0")}:${date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`;
                };
            }
            else if (timeRangeMs <= 2 * 60 * 60 * 1000) {
                // <= 2 hours: use 5-minute buckets
                bucketIntervalMs = 5 * 60 * 1000;
                formatKey = (date) => {
                    const minutes = Math.floor(date.getMinutes() / 5) * 5;
                    return `${date.getHours().toString().padStart(2, "0")}:${minutes
                        .toString()
                        .padStart(2, "0")}`;
                };
            }
            else if (timeRangeMs <= 24 * 60 * 60 * 1000) {
                // <= 24 hours: use 1-hour buckets
                bucketIntervalMs = 60 * 60 * 1000;
                formatKey = (date) => {
                    return `${date.getMonth() + 1}/${date.getDate()} ${date
                        .getHours()
                        .toString()
                        .padStart(2, "0")}:00`;
                };
            }
            else {
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
            const bucketTimestamps = {}; // Store actual bucket timestamp
            filteredLogs.forEach((log) => {
                const timestamp = log[field];
                if (timestamp) {
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        // Round timestamp down to bucket boundary
                        const bucketTime = Math.floor(date.getTime() / bucketIntervalMs) * bucketIntervalMs;
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
            }
            else {
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
                const formatDateRange = (range) => {
                    const { start, end } = range;
                    // Custom formatter function for the requested format with error handling
                    const formatDateTime = (date) => {
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
                        if (isNaN(day) ||
                            isNaN(year) ||
                            isNaN(date.getHours()) ||
                            isNaN(date.getMinutes())) {
                            return "Invalid date";
                        }
                        return `${month} ${day}, ${year} @ ${hours}:${minutes}:${seconds}.${milliseconds}`;
                    };
                    // Parse dates using the same logic as in Discover.tsx
                    try {
                        const startMoment = datemath_1.default.parse(start);
                        const endMoment = datemath_1.default.parse(end, { roundUp: true });
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
                    }
                    catch (error) {
                        return "Custom time range";
                    }
                };
                title = formatDateRange(dateRange);
            }
            else {
                title = "Timestamp Distribution";
            }
            formatter = (d) => {
                if (typeof d === "number") {
                    const momentDate = (0, moment_1.default)(d);
                    return momentDate.isValid()
                        ? momentDate.format("MMM DD HH:mm")
                        : "Invalid";
                }
                return d;
            };
            scale = charts_1.ScaleType.Time; // Use time scale for proper time-based data
        }
        else if (field === "level" ||
            (fieldDataType === "string" &&
                ["info", "warn", "error", "debug"].includes(firstValue?.toLowerCase()))) {
            // For log levels - count actual levels in the data
            const levelCounts = {};
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
            }
            else {
                // Fallback to sample data
                data = [
                    { x: "info", y: 65 },
                    { x: "warn", y: 25 },
                    { x: "error", y: 10 },
                    { x: "debug", y: 30 },
                ];
            }
            title = "Log Level Distribution";
            formatter = (d) => d;
            scale = charts_1.ScaleType.Ordinal;
        }
        else if (field === "status_code" ||
            (fieldDataType === "string" && /^\d{3}$/.test(firstValue)) ||
            (fieldDataType === "number" && firstValue >= 100 && firstValue < 600)) {
            // For status codes - count actual status codes in the data
            const statusCounts = {};
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
            }
            else {
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
            formatter = (d) => d;
            scale = charts_1.ScaleType.Ordinal;
        }
        else if (fieldDataType === "number" ||
            field === "latency_ms" ||
            field === "bytes") {
            // For numeric fields like latency or bytes
            const fieldName = field === "latency_ms"
                ? "Latency (ms)"
                : field === "bytes"
                    ? "Bytes"
                    : field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            // Collect actual values
            const values = [];
            filteredLogs.forEach((log) => {
                const value = log[field];
                if (value !== undefined &&
                    (typeof value === "number" || !isNaN(Number(value)))) {
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
                const bins = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(values.length))));
                const binSize = range / bins || 1; // Avoid division by zero
                // Initialize bins
                const binCounts = {};
                for (let i = 0; i < bins; i++) {
                    binCounts[i] = 0;
                }
                // Count values in each bin
                values.forEach((value) => {
                    const binIndex = Math.min(Math.floor((value - minVal) / binSize), bins - 1);
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
                scale = charts_1.ScaleType.Linear;
            }
            else {
                // Fallback to sample data if no actual values
                const maxVal = field === "latency_ms" ? 1000 : field === "bytes" ? 10000 : 100;
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
                scale = charts_1.ScaleType.Linear;
            }
            title = `${fieldName} Distribution`;
            formatter =
                field === "latency_ms"
                    ? (d) => `${Math.round(d)}ms`
                    : field === "bytes"
                        ? (d) => `${Math.round(d)} bytes`
                        : (d) => `${Math.round(d)}`;
        }
        else {
            // For other string fields, create categorical distribution
            const valueCounts = {};
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
            }
            else {
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
            formatter = (d) => d;
            scale = charts_1.ScaleType.Ordinal;
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
    const [autoInterval, setAutoInterval] = (0, react_1.useState)("Auto interval");
    const [breakdownBy, setBreakdownBy] = (0, react_1.useState)("No breakdown");
    // Toolbar component
    const renderToolbar = () => ((0, jsx_runtime_1.jsxs)("div", { style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "32px",
            marginBottom: "8px",
        }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { iconType: "transitionTopOut", "aria-label": "Field options", color: "text", display: "base", size: "s" }), (0, jsx_runtime_1.jsx)(eui_1.EuiSuperSelect, { options: [
                            { value: "Auto interval", inputDisplay: "Auto interval" },
                            { value: "1 minute", inputDisplay: "1 minute" },
                            { value: "5 minutes", inputDisplay: "5 minutes" },
                            { value: "15 minutes", inputDisplay: "15 minutes" },
                            { value: "30 minutes", inputDisplay: "30 minutes" },
                            { value: "1 hour", inputDisplay: "1 hour" },
                        ], valueOfSelected: autoInterval, onChange: setAutoInterval, compressed: true, style: { minWidth: "140px" } }), (0, jsx_runtime_1.jsx)(eui_1.EuiSuperSelect, { options: [
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
                        ], valueOfSelected: breakdownBy, onChange: setBreakdownBy, compressed: true, style: { minWidth: "200px" } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex" }, children: [(0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { style: {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 0,
                        }, size: "s", color: "text", iconType: "pencil", display: "base" }), (0, jsx_runtime_1.jsx)(eui_1.EuiButtonIcon, { style: {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                        }, size: "s", color: "text", iconType: "save", display: "base" })] })] }));
    // Show metric chart for single aggregation results
    if (isSingleMetric && metricValue !== undefined) {
        return ((0, jsx_runtime_1.jsxs)("div", { style: {
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                padding: "0 16px 16px 16px",
            }, children: [renderToolbar(), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, width: "100%", minHeight: 0 }, children: (0, jsx_runtime_1.jsxs)(charts_1.Chart, { children: [(0, jsx_runtime_1.jsx)(charts_1.Settings, { theme: colorMode === "dark" ? charts_1.DARK_THEME : charts_1.LIGHT_THEME, baseTheme: colorMode === "dark" ? charts_1.DARK_THEME : charts_1.LIGHT_THEME }), (0, jsx_runtime_1.jsx)(charts_1.Metric, { id: "metric", data: [
                                    [
                                        {
                                            value: metricValue,
                                            title: metricTitle || axisTitle,
                                            subtitle: "", // Empty subtitle to match the design
                                            valueFormatter: (value) => {
                                                // Format large numbers with commas
                                                return new Intl.NumberFormat("en-US").format(value);
                                            },
                                            color: colorMode === "dark" ? "#000000" : "#ffffff",
                                        },
                                    ],
                                ] })] }) })] }));
    }
    if (histogramData.length === 0) {
        return ((0, jsx_runtime_1.jsx)("div", { style: {
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: (0, jsx_runtime_1.jsx)("p", { children: "No data available for histogram" }) }));
    }
    // Determine if we need a histogram series (for binned data) or bar series
    const needsHistogramSeries = histogramData.length > 0 && "x0" in histogramData[0];
    const isTimeSeries = field === "@timestamp";
    const isOrdinal = !needsHistogramSeries && typeof histogramData[0]?.x === "string";
    return ((0, jsx_runtime_1.jsxs)("div", { className: "histogram-section", style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            // padding: "8px 16px 16px 16px",
            padding: "8px",
        }, children: [renderToolbar(), (0, jsx_runtime_1.jsx)("div", { style: { flex: 1, width: "100%", minHeight: 0 }, children: (0, jsx_runtime_1.jsxs)(charts_1.Chart, { children: [(0, jsx_runtime_1.jsx)(charts_1.Settings, { rotation: 0, theme: colorMode === "dark" ? charts_1.DARK_THEME : charts_1.LIGHT_THEME, animateData: false, debug: false, showLegend: false, baseTheme: colorMode === "dark" ? charts_1.DARK_THEME : charts_1.LIGHT_THEME }), needsHistogramSeries ? ((0, jsx_runtime_1.jsx)(charts_1.HistogramBarSeries, { id: "histogram", name: axisTitle, data: histogramData, xScaleType: isTimeSeries ? charts_1.ScaleType.Time : charts_1.ScaleType.Linear, yScaleType: charts_1.ScaleType.Linear, xAccessor: isTimeSeries ? "x" : (d) => d.x, yAccessors: ["y"] })) : ((0, jsx_runtime_1.jsx)(charts_1.BarSeries, { id: "bar", name: axisTitle, data: histogramData, xScaleType: isTimeSeries
                                ? charts_1.ScaleType.Time
                                : isOrdinal
                                    ? charts_1.ScaleType.Ordinal
                                    : charts_1.ScaleType.Linear, yScaleType: charts_1.ScaleType.Linear, xAccessor: isTimeSeries ? "x" : (d) => d.x, yAccessors: ["y"] })), (0, jsx_runtime_1.jsx)(charts_1.Axis, { id: "bottom", position: charts_1.Position.Bottom, title: axisTitle, showOverlappingTicks: false, tickFormat: isTimeSeries ? valueFormatter : undefined }), (0, jsx_runtime_1.jsx)(charts_1.Axis, { id: "left", title: "results", position: charts_1.Position.Left, tickFormat: (d) => (Number.isInteger(d) ? d.toString() : "") })] }) })] }));
};
exports.DocumentHistogram = DocumentHistogram;
//# sourceMappingURL=DocumentHistogram.js.map