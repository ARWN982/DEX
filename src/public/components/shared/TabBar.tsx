import React from "react";
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  useEuiTheme,
} from "@elastic/eui";

interface TabBarProps {
  tabTitle?: string;
  onTabClose?: () => void;
  showActions?: boolean;
  backgroundColor?: string;
  rowBackgroundColor?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabTitle = "Incident #4824",
  onTabClose,
  showActions = true,
  backgroundColor,
  rowBackgroundColor,
}) => {
  const { euiTheme } = useEuiTheme();
  const tabBackgroundColor =
    backgroundColor || euiTheme.colors.backgroundBasePlain;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingBottom: "0px",
        // borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        backgroundColor: rowBackgroundColor,
        height: "44px",
      }}
    >
      {/* Tab with 3-part structure: left curve, center content, right curve */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Left curve */}
        <div style={{ width: "8px", height: "8px" }}>
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 8L8 8L8 0C8 4.41716 4.41859 7.99818 0 8Z"
              fill={tabBackgroundColor}
            />
          </svg>
        </div>

        {/* Center tab content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px",
            backgroundColor: tabBackgroundColor,
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            fontSize: "14px",
            fontWeight: 500,
            color: euiTheme.colors.text,
          }}
        >
          <span>{tabTitle}</span>
          <EuiButtonIcon
            iconType="cross"
            aria-label="Close tab"
            size="xs"
            color="text"
            style={{ minWidth: "14px", minHeight: "14px" }}
            onClick={onTabClose}
          />
        </div>

        {/* Right curve */}
        <div style={{ width: "8px", height: "8px" }}>
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 8L1.2813e-07 8L1.2813e-07 0C1.2813e-07 4.41716 3.58141 7.99818 8 8Z"
              fill={tabBackgroundColor}
            />
          </svg>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          justifyContent="flexEnd"
        >
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" aria-label="Inspect">
              {" "}
              Inspect{" "}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" aria-label="Share">
              Share
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" aria-label="Open">
              Open
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" aria-label="Save">
              Save
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </div>
  );
};
