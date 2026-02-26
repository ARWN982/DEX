import React, { useState } from "react";
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  useEuiTheme,
} from "@elastic/eui";
import { AppMenuBar, AppMenuBarConfig } from "./AppMenuBar";
import { useAppStore } from "../../store/useAppStore";

export interface Tab {
  id: string;
  title: string;
  isActive?: boolean;
}

interface TabBarProps {
  // Single tab mode (backward compatible)
  tabTitle?: string;
  onTabClose?: () => void;
  showActions?: boolean;
  
  // Multiple tabs mode
  tabs?: Tab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabCloseMultiple?: (tabId: string) => void;
  onAddTab?: () => void;
  
  // AppMenuBar integration
  appMenuBarConfig?: AppMenuBarConfig;
  showAppMenuBar?: boolean;
  
  // Styling
  backgroundColor?: string;
  rowBackgroundColor?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabTitle,
  onTabClose,
  showActions = true,
  tabs,
  activeTabId,
  onTabClick,
  onTabCloseMultiple,
  onAddTab,
  appMenuBarConfig,
  showAppMenuBar = false,
  backgroundColor,
  rowBackgroundColor,
}) => {
  const { euiTheme } = useEuiTheme();
  const { colorMode } = useAppStore();
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const tabBackgroundColor = backgroundColor || euiTheme.colors.backgroundBasePlain;
  const isMultipleTabsMode = tabs && tabs.length > 0;
  const activeTabIdToUse = activeTabId || (isMultipleTabsMode && tabs ? (tabs.find((t) => t.isActive)?.id || tabs[0]?.id) : undefined);
  
  // Kibana-specific measurements: TabBar height: 40px, Tab height: 32px
  const TAB_BAR_HEIGHT = 42;
  const TAB_HEIGHT = 36;

  const renderTab = (tab: Tab, isActive: boolean) => {
    const isHovered = hoveredTabId === tab.id;
    const hasMultipleTabs = isMultipleTabsMode && tabs && tabs.length > 1;
    const shouldShowCloseButton = (onTabClose || onTabCloseMultiple) && hasMultipleTabs && isHovered;
    const shouldReserveCloseButtonSpace = hasMultipleTabs;
    
    const curveSize = euiTheme.size.s; // 8px
    const tabPaddingY = euiTheme.size.m; // 12px
    const hoverColor = colorMode === "light" ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.07)";
    const closeButtonWidth = 24; // EuiButtonIcon size="xs" is 24px
    const closeButtonBuffer = 2; // 2px buffer
    const closeButtonTotalSpace = closeButtonWidth + closeButtonBuffer; // 26px
    
    return (
      <div
        key={tab.id}
        style={{
          display: "flex",
          alignItems: "flex-end",
          cursor: isMultipleTabsMode ? "pointer" : "default",
        }}
        onClick={() => isMultipleTabsMode && onTabClick?.(tab.id)}
        onMouseEnter={() => setHoveredTabId(tab.id)}
        onMouseLeave={() => setHoveredTabId(null)}
      >
        {/* Left curve */}
        <div style={{ width: curveSize, height: curveSize }}>
          <svg width={curveSize} height={curveSize} viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 8L8 8L8 0C8 4.41716 4.41859 7.99818 0 8Z"
              fill={isActive ? tabBackgroundColor : "transparent"}
            />
          </svg>
        </div>

        {/* Center tab content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: euiTheme.size.s,
            paddingTop: tabPaddingY,
            paddingBottom: tabPaddingY,
            paddingLeft: euiTheme.size.s, // 8px
            paddingRight: euiTheme.size.xs, // 4px
            minWidth: "100px",
            height: `${TAB_HEIGHT}px`,
            boxSizing: "border-box",
            backgroundColor: isActive ? tabBackgroundColor : "transparent",
            borderRadius: `${euiTheme.border.radius.medium} ${euiTheme.border.radius.medium} 0 0`,
            position: "relative",
          }}
        >
          {/* Hover background - inset from bottom */}
          {!isActive && (
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: "2px",
                right: "2px",
                bottom: "4px",
                borderRadius: euiTheme.border.radius.medium,
                backgroundColor: isHovered ? hoverColor : "transparent",
                transition: "background-color 0.15s ease",
                pointerEvents: "none",
              }}
            />
          )}
          <EuiText 
            size="s" 
            color={isActive ? "default" : "subdued"}
            style={{
              ...(shouldReserveCloseButtonSpace && isHovered ? {
                width: `calc(100% - ${closeButtonTotalSpace}px)`,
                maskImage: `linear-gradient(to right, rgb(0, 0, 0) calc(100% - 8px), rgba(0, 0, 0, 0.1) 100%)`,
                WebkitMaskImage: `linear-gradient(to right, rgb(0, 0, 0) calc(100% - 8px), rgba(0, 0, 0, 0.1) 100%)`,
              } : {}),
            }}
          >
            {tab.title}
          </EuiText>
          {shouldReserveCloseButtonSpace && (
            <EuiButtonIcon
              iconType="cross"
              aria-label="Close tab"
              size="xs"
              color="text"
              style={{
                opacity: shouldShowCloseButton ? 1 : 0,
                transition: "opacity 0.2s",
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (isMultipleTabsMode && onTabCloseMultiple) {
                  onTabCloseMultiple(tab.id);
                } else if (onTabClose) {
                  onTabClose();
                }
              }}
            />
          )}
        </div>

        {/* Right curve */}
        <div style={{ width: curveSize, height: curveSize }}>
          <svg width={curveSize} height={curveSize} viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 8L1.2813e-07 8L1.2813e-07 0C1.2813e-07 4.41716 3.58141 7.99818 8 8Z"
              fill={isActive ? tabBackgroundColor : "transparent"}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingRight: euiTheme.size.s,
        paddingBottom: 0,
        backgroundColor: colorMode === "light" ? "#ecf1f9" : "#172336",
        height: `${TAB_BAR_HEIGHT}px`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 0,
        }}
      >
        {isMultipleTabsMode && tabs ? (
          <>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabIdToUse;
              return renderTab(tab, isActive);
            })}
            {onAddTab && (
              <EuiButtonIcon
                iconType="plus"
                aria-label="Add tab"
                size="s"
                color="text"
                onClick={onAddTab}
                style={{
                  marginLeft: euiTheme.size.xs,
                  marginBottom: euiTheme.size.xs,
                }}
              />
            )}
          </>
        ) : (
          renderTab({ id: "single", title: tabTitle || "Untitled", isActive: true }, true)
        )}
      </div>

      {/* Right side: AppMenuBar or Action buttons */}
      {showAppMenuBar && appMenuBarConfig ? (
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center",
            alignSelf: "center",
            gap: euiTheme.size.xs,
          }}
        >
          {/* Arrow down icon and separator - only for Discover template with tabs */}
          {appMenuBarConfig === "discover" && isMultipleTabsMode && tabs && tabs.length > 0 && (
            <>
              <EuiButtonIcon
                iconType="arrowDown"
                aria-label="Toggle dropdown"
                size="s"
                color="text"
                onClick={() => console.log("Dropdown clicked")}
              />
              <div
                style={{
                  width: "1px",
                  height: "16px",
                  backgroundColor: euiTheme.colors.borderBaseDisabled,
                }}
              />
            </>
          )}
          <AppMenuBar config={appMenuBarConfig} isInsideTabBar={true} />
        </div>
      ) : showActions && !showAppMenuBar ? (
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
      ) : null}
    </div>
  );
};
