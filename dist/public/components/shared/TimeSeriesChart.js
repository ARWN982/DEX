"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSeriesChart = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const charts_1 = require("@elastic/charts");
const datemath_1 = __importDefault(require("@elastic/datemath"));
const eui_1 = require("@elastic/eui");
const valueFormatters_1 = require("../../utils/valueFormatters");
const TimeSeriesChart = ({ data, timeRange, colorMode, height = 150, width = "100%", isLoading = false, error = null, chartType = 'area', metricName = 'metric', unit, showLegend = false, colorIndex, }) => {
    const { euiTheme } = (0, eui_1.useEuiTheme)();
    // Create array of EUI vis colors for cycling
    const visColors = [
        euiTheme.colors.vis.euiColorVis0,
        euiTheme.colors.vis.euiColorVis1,
        euiTheme.colors.vis.euiColorVis2,
        euiTheme.colors.vis.euiColorVis3,
        euiTheme.colors.vis.euiColorVis4,
        euiTheme.colors.vis.euiColorVis5,
        euiTheme.colors.vis.euiColorVis6,
        euiTheme.colors.vis.euiColorVis7,
        euiTheme.colors.vis.euiColorVis8,
        euiTheme.colors.vis.euiColorVis9,
    ];
    // Get color for this chart (cycle through colors if colorIndex provided)
    const chartColor = colorIndex !== undefined ? visColors[colorIndex % visColors.length] : undefined;
    // Value formatter
    const valueFormatter = (0, valueFormatters_1.getValueFormatter)(unit);
    // Check if we have multi-series data
    const hasDimensions = data.length > 0 && typeof data[0] === 'object' && 'key' in data[0];
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { style: {
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiLoadingChart, { size: "m" }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { style: {
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: (0, jsx_runtime_1.jsx)(eui_1.EuiText, { color: "danger", textAlign: "center", children: error }) }));
    }
    // Use date picker range for x-axis bounds - parse datemath expressions
    const startDate = datemath_1.default.parse(timeRange.from || 'now-1h');
    const endDate = datemath_1.default.parse(timeRange.to || 'now');
    const xBounds = [
        startDate?.valueOf() || Date.now() - 86400000, // fallback to 24h ago if parsing fails
        endDate?.valueOf() || Date.now(), // fallback to now if parsing fails
    ];
    return ((0, jsx_runtime_1.jsx)(eui_1.EuiFlexItem, { style: { height }, children: (0, jsx_runtime_1.jsxs)(charts_1.Chart, { size: { height, width }, children: [(0, jsx_runtime_1.jsx)(charts_1.Settings, { baseTheme: colorMode === "light" ? charts_1.LIGHT_THEME : charts_1.DARK_THEME, xDomain: { min: xBounds[0], max: xBounds[1] }, showLegend: showLegend }), (0, jsx_runtime_1.jsx)(charts_1.Axis, { id: "bottom", position: "bottom", gridLine: { visible: true, stroke: "#e0e0e0", strokeWidth: 1 }, tickFormat: (0, charts_1.niceTimeFormatter)(xBounds) }), (0, jsx_runtime_1.jsx)(charts_1.Axis, { id: "left", position: "left", gridLine: { visible: false }, tickFormat: valueFormatter }), hasDimensions
                    ? // Render multiple series for dimensions
                        data.map((series) => {
                            // Serialize key for React and display purposes
                            const seriesKey = typeof series.key === "object"
                                ? JSON.stringify(series.key)
                                : series.key;
                            const displayName = typeof series.key === "object"
                                ? Object.values(series.key).join(" - ")
                                : series.key;
                            if (chartType === "bar") {
                                return ((0, jsx_runtime_1.jsx)(charts_1.BarSeries, { id: `${metricName}-${seriesKey}`, name: displayName, data: series.data, xAccessor: "x", yAccessors: ["y"], xScaleType: charts_1.ScaleType.Time, stackAccessors: ["x"] }, seriesKey));
                            }
                            return ((0, jsx_runtime_1.jsx)(charts_1.LineSeries, { id: `${metricName}-${seriesKey}`, name: displayName, data: series.data, xAccessor: "x", yAccessors: ["y"], xScaleType: charts_1.ScaleType.Time }, seriesKey));
                        })
                    : // Render single series for no dimensions
                        (() => {
                            if (chartType === "bar") {
                                return ((0, jsx_runtime_1.jsx)(charts_1.BarSeries, { id: metricName, data: data, xAccessor: "x", yAccessors: ["y"], xScaleType: charts_1.ScaleType.Time, color: chartColor }));
                            }
                            if (chartType === "line") {
                                return ((0, jsx_runtime_1.jsx)(charts_1.LineSeries, { id: metricName, data: data, xAccessor: "x", yAccessors: ["y"], xScaleType: charts_1.ScaleType.Time, color: chartColor }));
                            }
                            return ((0, jsx_runtime_1.jsx)(charts_1.AreaSeries, { id: metricName, data: data, xAccessor: "x", yAccessors: ["y"], xScaleType: charts_1.ScaleType.Time, color: chartColor }));
                        })()] }) }));
};
exports.TimeSeriesChart = TimeSeriesChart;
//# sourceMappingURL=TimeSeriesChart.js.map