import React, { useMemo } from "react";
import { useEuiTheme, EuiIcon, IconType } from "@elastic/eui";
import { Chart, Metric, Settings, MetricDatum, MetricTrendShape, LIGHT_THEME, DARK_THEME, PartialTheme } from "@elastic/charts";
import { useAppStore } from "../../../store/useAppStore";

/** Trend direction for secondary metric icon */
type TrendIcon = "increase" | "decrease" | "stable" | "none";

/** Maps trend icon type to unicode character */
const trendIconMap: Record<TrendIcon, string> = {
  increase: "↑",
  decrease: "↓",
  stable: "→",
  none: "",
};

/** Secondary metric configuration for displaying comparison values */
interface SecondaryMetric {
  /** The secondary value to display (e.g., "87.20") */
  value: string;
  /** Label for the secondary value (e.g., "Last week") */
  label?: string;
  /** Position of the label relative to value */
  labelPosition?: "before" | "after";
  /** Background color for badge styling - enables badge when set */
  badgeColor?: string;
  /** Trend icon to display (uses native Elastic Charts icons) */
  trendIcon?: TrendIcon;
  /** Position of the icon relative to value */
  iconPosition?: "before" | "after";
  /** Badge border configuration */
  badgeBorderColor?: { mode: "none" } | { mode: "auto" } | { mode: "custom"; color: string };
}

interface MetricPanelProps {
  title: string;
  value: string | number;
  /** Text to display before the value (e.g., "$") */
  valuePrefix?: string;
  /** Text to display after the value (e.g., " %", " ms") */
  valuePostfix?: string;
  description?: string;
  color?: "primary" | "success" | "warning" | "danger" | "subdued" | string;
  trend?: {
    value: number;
    label: string;
    data?: { x: number; y: number }[];
  };
  /** Maximum value for progress bar (enables progress bar when set) */
  progressMax?: number;
  /** Direction of the progress bar */
  progressBarDirection?: "horizontal" | "vertical";
  /** Extra text shown below the value (simple string) */
  extra?: string;
  /** Secondary metric with badge styling (native Elastic Charts feature) */
  secondaryMetric?: SecondaryMetric;
  /** EUI icon glyph name to show next to value (e.g., 'sortUp', 'sortDown', 'warning') */
  icon?: IconType;
  /** Icon alignment */
  iconAlign?: "left" | "right";
  /** Color the main value text with the metric color */
  valueColor?: boolean;
  /** Position of the primary metric value ('top' or 'bottom') */
  valuePosition?: "top" | "bottom";
  /** Alignment for title and subtitle */
  titlesTextAlign?: "left" | "center" | "right";
  /** Alignment for the primary metric value */
  valueTextAlign?: "left" | "center" | "right";
  /** Alignment for extra/secondary metric element */
  extraTextAlign?: "left" | "center" | "right";
}

export const MetricPanel: React.FC<MetricPanelProps> = ({
  title,
  value,
  valuePrefix = "",
  valuePostfix = "",
  description,
  color = "primary",
  trend,
  progressMax,
  progressBarDirection = "vertical",
  extra,
  secondaryMetric,
  icon,
  iconAlign = "right",
  valueColor = false,
  valuePosition,
  titlesTextAlign,
  valueTextAlign,
  extraTextAlign,
}) => {
  const { euiTheme } = useEuiTheme();
  const { colorMode } = useAppStore();

  // Map EUI color names to actual colors
  const getColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      primary: euiTheme.colors.backgroundFilledPrimary,
      success: euiTheme.colors.backgroundFilledSuccess,
      warning: euiTheme.colors.backgroundFilledWarning,
      danger: euiTheme.colors.backgroundFilledDanger,
      subdued: euiTheme.colors.backgroundBaseSubdued,
      // Dataviz colors
      vis0: euiTheme.colors.vis.euiColorVis0,
      vis1: euiTheme.colors.vis.euiColorVis1,
      vis2: euiTheme.colors.vis.euiColorVis2,
      vis3: euiTheme.colors.vis.euiColorVis3,
      vis4: euiTheme.colors.vis.euiColorVis4,
      vis5: euiTheme.colors.vis.euiColorVis5,
      vis6: euiTheme.colors.vis.euiColorVis6,
      vis7: euiTheme.colors.vis.euiColorVis7,
      vis8: euiTheme.colors.vis.euiColorVis8,
      vis9: euiTheme.colors.vis.euiColorVis9,
    };
    return colorMap[colorName] || colorName;
  };

  const metricData: MetricDatum[][] = useMemo(() => {
    const resolvedColor = getColor(color);
    
    // Determine extra content - secondary metric takes precedence over simple extra text
    const extraContent = secondaryMetric 
      ? {
          value: secondaryMetric.value,
          label: secondaryMetric.label,
          labelPosition: secondaryMetric.labelPosition,
          badgeColor: secondaryMetric.badgeColor ? getColor(secondaryMetric.badgeColor) : undefined,
          icon: secondaryMetric.trendIcon ? trendIconMap[secondaryMetric.trendIcon] : undefined,
          iconPosition: secondaryMetric.iconPosition,
          badgeBorderColor: secondaryMetric.badgeBorderColor,
        }
      : extra 
        ? { value: extra }
        : undefined;
    
    const baseMetric: MetricDatum = {
      title,
      subtitle: description,
      color: resolvedColor,
      // Color the value text with the metric color when enabled
      ...(valueColor ? { valueColor: resolvedColor } : {}),
      // Value configuration
      ...(typeof value === "number"
        ? {
            value,
            valueFormatter: (v: number) => `${valuePrefix}${v.toLocaleString()}${valuePostfix}`,
          }
        : {
            value: `${valuePrefix}${String(value)}${valuePostfix}`,
          }),
      // Progress bar configuration (native Elastic Charts)
      ...(progressMax !== undefined && typeof value === "number"
        ? {
            domainMax: progressMax,
            progressBarDirection,
          }
        : {}),
      // Extra content - native Elastic Charts SecondaryMetricProps
      ...(extraContent ? { extra: extraContent } : {}),
      // Icon - native Elastic Charts prop using EUI icons
      ...(icon
        ? {
            icon: ({ width, height, color: iconColor }) => (
              <EuiIcon type={icon} size="l" color={iconColor} style={{ width, height }} />
            ),
            iconAlign,
          }
        : {}),
      // Trend sparkline data - native Elastic Charts
      ...(trend?.data
        ? {
            trend: trend.data,
            trendShape: MetricTrendShape.Area,
            trendA11yTitle: `${title} trend`,
            trendA11yDescription: trend.label,
          }
        : {}),
    };

    return [[baseMetric]];
  }, [title, description, color, value, valuePrefix, valuePostfix, trend, progressMax, progressBarDirection, extra, secondaryMetric, icon, iconAlign, valueColor, euiTheme]);

  // Create custom theme for metric-specific settings
  const customTheme: PartialTheme = useMemo(() => ({
    metric: {
      ...(valuePosition ? { valuePosition } : {}),
      ...(titlesTextAlign ? { titlesTextAlign } : {}),
      ...(valueTextAlign ? { valueTextAlign } : {}),
      ...(extraTextAlign ? { extraTextAlign } : {}),
    },
  }), [valuePosition, titlesTextAlign, valueTextAlign, extraTextAlign]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Chart>
        <Settings
          baseTheme={colorMode === "dark" ? DARK_THEME : LIGHT_THEME}
          theme={customTheme}
        />
        <Metric id="metric" data={metricData} />
      </Chart>
    </div>
  );
};
