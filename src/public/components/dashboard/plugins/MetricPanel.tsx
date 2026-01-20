import React from "react";
import { EuiText, EuiStat } from "@elastic/eui";
import { useEuiTheme } from "@elastic/eui";

interface MetricPanelProps {
  title: string;
  value: string | number;
  description?: string;
  color?: "primary" | "success" | "warning" | "danger" | "subdued";
  trend?: {
    value: number;
    label: string;
  };
}

export const MetricPanel: React.FC<MetricPanelProps> = ({
  title,
  value,
  description,
  color = "primary",
  trend,
}) => {
  const { euiTheme } = useEuiTheme();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <EuiStat
        title={typeof value === "number" ? value.toLocaleString() : value}
        description={title}
        titleColor={color}
        textAlign="left"
      >
        {description && (
          <EuiText size="s" color="subdued" style={{ marginTop: euiTheme.size.xs }}>
            {description}
          </EuiText>
        )}
        {trend && (
          <EuiText size="xs" color="subdued" style={{ marginTop: euiTheme.size.xs }}>
            {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
          </EuiText>
        )}
      </EuiStat>
    </div>
  );
};
