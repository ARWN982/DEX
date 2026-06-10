/** @jsxImportSource @emotion/react */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useEuiTheme, EuiText, EuiIcon } from "@elastic/eui";
import { css } from "@emotion/react";
import { GridItem } from "./DashboardGrid";
import { useDashboardPanelSettings } from "../../store/useDashboardPanelSettings";

interface DashboardPanelProps {
  item: GridItem;
  onSettingsClick: (itemId: string) => void;
  rowHeight?: number;
  gap?: number;
  /** If true, panel padding is set to 0 (e.g., for metric panels) */
  noPadding?: boolean;
  /** If true, panel will auto-size to fit content */
  autoHeight?: boolean;
  /** Callback when auto-height panel measures its content */
  onAutoHeight?: (itemId: string, contentHeight: number) => void;
  /** If false, panel border/shadow is hidden */
  showBorder?: boolean;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  item,
  onSettingsClick,
  rowHeight = 20,
  gap = 8,
  noPadding = false,
  autoHeight = false,
  onAutoHeight,
  showBorder = true,
}) => {
  const euiThemeContext = useEuiTheme();
  const { euiTheme } = euiThemeContext;
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  
  // Get panel settings from store
  const panelSettings = useDashboardPanelSettings();
  
  // Measure content and report height for auto-height panels (only on initial mount)
  const hasAutoSized = useRef(false);
  
  useEffect(() => {
    if (!autoHeight || !onAutoHeight || !panelRef.current || hasAutoSized.current) return;
    
    // Only auto-size once on initial mount - manual resizing takes precedence after that
    const measureHeight = () => {
      const titleHeight = titleRef.current?.offsetHeight || 0;
      const contentHeight = contentRef.current?.scrollHeight || 0;
      const contentPadding = noPadding 
        ? 0 
        : panelSettings.panelPaddingTop + panelSettings.panelPaddingBottom;
      
      const totalHeight = titleHeight + contentHeight + contentPadding;
      onAutoHeight(item.i, totalHeight);
      hasAutoSized.current = true;
    };
    
    // Use requestAnimationFrame to ensure DOM is fully rendered before measuring
    requestAnimationFrame(measureHeight);
  }, [autoHeight, onAutoHeight, item.i, noPadding, panelSettings.panelPaddingTop, panelSettings.panelPaddingBottom]);
  
  // Get the border color from EUI theme based on the selected key
  const getBorderColor = () => {
    const colorMap: Record<string, string> = {
      borderBaseSubdued: euiTheme.colors.borderBaseSubdued,
      borderBasePlain: euiTheme.colors.borderBasePlain,
      borderBaseDisabled: euiTheme.colors.borderBaseDisabled,
      borderBasePrimary: euiTheme.colors.borderBasePrimary,
      borderBaseSuccess: euiTheme.colors.borderBaseSuccess,
      borderBaseWarning: euiTheme.colors.borderBaseWarning,
      borderBaseDanger: euiTheme.colors.borderBaseDanger,
    };
    return colorMap[panelSettings.borderColorKey] || euiTheme.colors.borderBaseSubdued;
  };
  const borderColor = getBorderColor();
  
  // Determine border or shadow styles based on setting
  const useBorder = panelSettings.borderStyle === "border";
  
  // Use decorative box-shadow style when not using border
  const decorativeShadow = "0px 0px 0px 1px rgba(0, 0, 0, 0.06), 0px 1px 2px -1px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(0, 0, 0, 0.04)";
  const boxShadowValue = showBorder && !useBorder ? decorativeShadow : "none";

  const handleSettingsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSettingsClick(item.i);
    },
    [item.i, onSettingsClick]
  );

  return (
    <div
      ref={panelRef}
      css={css`
        box-sizing: border-box;
        background-color: ${showBorder ? euiTheme.colors.emptyShade : "transparent"};
        border-radius: ${showBorder ? panelSettings.borderRadius : 0}px;
        border: none;
        box-shadow: ${boxShadowValue};
        overflow: visible;
        display: flex;
        flex-direction: column;
        position: relative;
        height: ${showBorder ? "100%" : "auto"};
        width: 100%;
        margin: 0;
        min-height: 0;

        /* Border pseudo-element - renders on top of content so it's always visible */
        ${showBorder && useBorder ? `
          &::before {
            content: '';
            position: absolute;
            inset: 0;
            border: ${panelSettings.borderWidth}px solid ${borderColor};
            border-radius: ${panelSettings.borderRadius}px;
            pointer-events: none;
            z-index: 10;
          }
        ` : ''}

        &:hover {
          .floating-actions {
            opacity: 1;
            visibility: visible;
          }
        }
      `}
      onMouseEnter={() => setShowFloatingActions(true)}
      onMouseLeave={() => setShowFloatingActions(false)}
    >
      {/* Floating Actions - appears on hover floating above the panel */}
      <div
        className="floating-actions"
        css={css`
          position: absolute;
          top: -16px;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: ${euiTheme.colors.emptyShade};
          border: 1px solid ${euiTheme.colors.borderBaseSubdued};
          border-radius: 8px;
          padding: 4px;
          height: 32px;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          z-index: 9000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        `}
      >
        {/* Drag Handle */}
        <button
          className="drag-handle action-btn"
          css={css`
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            cursor: grab;
            color: ${euiTheme.colors.textSubdued};
            border-radius: 4px;
            transition: background-color 0.15s ease, color 0.15s ease;
            user-select: none;

            &:hover {
              color: ${euiTheme.colors.text};
              background-color: #f1f5f9;
            }
            &:active {
              cursor: grabbing;
            }
          `}
        >
          <EuiIcon type="move" size="m" />
        </button>
        {/* Settings Button */}
        <button
          className="action-btn"
          onClick={handleSettingsClick}
          aria-label="Panel settings"
          css={css`
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            cursor: pointer;
            color: ${euiTheme.colors.textSubdued};
            border-radius: 4px;
            transition: background-color 0.15s ease, color 0.15s ease;

            &:hover {
              color: ${euiTheme.colors.text};
              background-color: #f1f5f9;
            }
          `}
        >
          <EuiIcon type="gear" size="m" />
        </button>
      </div>

      {/* Panel Title */}
      {item.showTitle !== false && item.title && (
        <div
          ref={titleRef}
          data-title
          className="panel-title"
          css={css`
            padding: ${panelSettings.titlePaddingTop}px ${panelSettings.titlePaddingRight}px ${panelSettings.titlePaddingBottom}px ${panelSettings.titlePaddingLeft}px;
            display: flex;
            align-items: center;
            height: ${panelSettings.titleHeight}px;
            flex-shrink: 0;
          `}
        >
          <EuiText 
            size="s" 
            style={{ 
              fontWeight: panelSettings.titleFontWeight, 
              fontSize: `${panelSettings.titleFontSize}px`,
              // lineHeight: '24px',
              flex: 1 
            }}
          >
            {item.title}
          </EuiText>
        </div>
      )}

      {/* Panel Content - padding controlled by Leva settings (except for metric panels, control panels, or when border is hidden) */}
      {/* When showBorder is false, render content directly without wrapper */}
      {showBorder ? (
        <div
          ref={contentRef}
          style={{
            width: "100%",
            overflow: autoHeight ? "visible" : "auto",
            minHeight: 0,
            flex: autoHeight ? "none" : 1,
            padding: noPadding
              ? 0 
              : item.panelType === "control"
                ? "0 8px" // Custom padding for control panels
                : `${panelSettings.panelPaddingTop}px ${panelSettings.panelPaddingRight}px ${panelSettings.panelPaddingBottom}px ${panelSettings.panelPaddingLeft}px`,
          }}
        >
          {item.content}
        </div>
      ) : (
        item.content
      )}
    </div>
  );
};
