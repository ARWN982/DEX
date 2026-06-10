import React, { useState } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiButtonIcon,
  EuiButton,
  EuiSuperDatePicker,
  useEuiTheme,
} from "@elastic/eui";

interface UnifiedSearchProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  onAddClick?: () => void;
  onRefresh?: () => void;
  onTimeChange?: (start: string, end: string) => void;
  start?: string;
  end?: string;
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  searchValue = "",
  onSearchChange,
  onFilterClick,
  onAddClick,
  onRefresh,
  onTimeChange,
  start = "now-15m",
  end = "now",
}) => {
  const { euiTheme } = useEuiTheme();
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [dateRange, setDateRange] = useState({ start, end });

  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleTimeChange = ({ start, end }: { start: string; end: string }) => {
    setDateRange({ start, end });
    if (onTimeChange) {
      onTimeChange(start, end);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };


  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      style={{
        backgroundColor: euiTheme.colors.emptyShade,
        gap: "8px",
        margin: 0,
        padding: euiTheme.size.s,
        flexShrink: 0,
        height: "auto",
        minHeight: "auto",
      }}
    >
      {/* Left side: Filter and Add buttons */}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="none" style={{ margin: 0 }}>
          <EuiButtonIcon
            iconType="filter"
            color="text"
            display="base"
            aria-label="Filter"
            onClick={onFilterClick}
            size="s"
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
          <EuiButtonIcon
            iconType="plusInCircle"
            aria-label="Add"
            color="text"
            display="base"
            onClick={onAddClick}
            size="s"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              marginLeft: "-1px",
            }}
          />
        </EuiFlexGroup>
      </EuiFlexItem>

      {/* Center: Search input */}
      <EuiFlexItem>
        <EuiFieldSearch
          placeholder="Filter your data using KQL syntax"
          value={localSearchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          fullWidth
          compressed
          style={{
            borderLeft: "none",
            borderRight: "none",
          }}
        />
      </EuiFlexItem>

      {/* Right side: Date range and refresh */}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="xs" alignItems="center">
          {/* Date range selector */}
          <EuiFlexItem grow={false}>
            <EuiSuperDatePicker
              start={dateRange.start}
              end={dateRange.end}
              onTimeChange={handleTimeChange}
              showUpdateButton={false}
              width="auto"
              isAutoRefreshOnly={false}
              compressed
              commonlyUsedRanges={[
                { start: "now-15m", end: "now", label: "Last 15 minutes" },
                { start: "now-30m", end: "now", label: "Last 30 minutes" },
                { start: "now-1h", end: "now", label: "Last 1 hour" },
                { start: "now-24h", end: "now", label: "Last 24 hours" },
                { start: "now-7d", end: "now", label: "Last 7 days" },
                { start: "now-30d", end: "now", label: "Last 30 days" },
              ]}
            />
          </EuiFlexItem>

          {/* Navigation arrows */}
          {/* <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs">
              <EuiButtonIcon
                iconType="arrowLeft"
                aria-label="Previous"
                onClick={() => console.log("Previous")}
                size="s"
              />
              <EuiButtonIcon
                iconType="magnifyWithMinus"
                aria-label="Zoom out"
                onClick={() => console.log("Zoom out")}
                size="s"
              />
              <EuiButtonIcon
                iconType="arrowRight"
                aria-label="Next"
                onClick={() => console.log("Next")}
                size="s"
              />
            </EuiFlexGroup>
          </EuiFlexItem> */}

          {/* Refresh button */}
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="refresh"
              onClick={handleRefresh}
              size="s"
              color="primary"
            >
              Refresh
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
