import React, { useCallback, useRef } from "react";
import { useEuiTheme } from "@elastic/eui";
import ReactGridLayout, { Layout, LayoutItem, useContainerWidth } from "react-grid-layout";
import type { GridLayoutProps } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { DashboardPanel } from "./DashboardPanel";

export type PanelType = "markdown" | "metric" | "timeseries" | "links" | "control" | "table" | "other";

export interface GridItem extends LayoutItem {
  content: React.ReactNode;
  title?: string;
  showTitle?: boolean;
  /** If true, panel content padding is set to 0 (e.g., for metric panels) */
  noPadding?: boolean;
  /** Panel type for determining settings options */
  panelType?: PanelType;
  /** Markdown content for markdown panels */
  markdownContent?: string;
  /** If true, panel height will automatically adjust to fit content */
  autoHeight?: boolean;
  /** If false, panel border/shadow is hidden (used for control panels) */
  showBorder?: boolean;
  /** Control panel configuration */
  controlConfig?: {
    label: string;
    options: Array<{ value: string; label: string }>;
    selectedValues: string[];
  };
}

interface DashboardGridProps {
  items: GridItem[];
  onItemsChange: (items: GridItem[]) => void;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  onSettingsClick?: (itemId: string) => void;
  /** If true, grid height auto-sizes to fit content. If false, fills parent container. Default: false */
  autoSize?: boolean;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  items,
  onItemsChange,
  columns = 12,
  rowHeight = 20,
  gap = 8,
  onSettingsClick,
  autoSize = false,
}) => {
  const { euiTheme } = useEuiTheme();
  const { width, containerRef, mounted } = useContainerWidth();
  
  // Calculate grid height based on items when autoSize is true
  const calculatedHeight = React.useMemo(() => {
    if (!autoSize || items.length === 0) return undefined;
    
    // Find the maximum y + h to determine total rows needed
    const maxRow = items.reduce((max, item) => {
      const bottom = item.y + item.h;
      return bottom > max ? bottom : max;
    }, 0);
    
    // Calculate height: (rows * rowHeight) + ((rows - 1) * gap) + (2 * containerPadding)
    // containerPadding is the same as gap
    const height = (maxRow * rowHeight) + ((maxRow - 1) * gap) + (2 * gap);
    return height;
  }, [autoSize, items, rowHeight, gap]);
  
  // Track pending height updates to batch them
  const pendingHeightUpdates = useRef<Map<string, number>>(new Map());

  // Convert pixel height to grid rows
  const pixelsToGridRows = useCallback((pixels: number): number => {
    // Formula: pixels = rows * rowHeight + (rows - 1) * gap
    // Solving for rows: rows = (pixels + gap) / (rowHeight + gap)
    return Math.ceil((pixels + gap) / (rowHeight + gap));
  }, [rowHeight, gap]);

  // Handle auto-height updates from panels
  const handleAutoHeight = useCallback((itemId: string, contentHeight: number) => {
    const item = items.find(i => i.i === itemId);
    if (!item?.autoHeight) return;
    
    const requiredRows = pixelsToGridRows(contentHeight);
    const minRows = item.minH || 1;
    const newHeight = Math.max(requiredRows, minRows);
    
    // Only update if height actually changed
    if (item.h !== newHeight) {
      pendingHeightUpdates.current.set(itemId, newHeight);
      
      // Batch updates using requestAnimationFrame
      requestAnimationFrame(() => {
        if (pendingHeightUpdates.current.size > 0) {
          const updates = new Map(pendingHeightUpdates.current);
          pendingHeightUpdates.current.clear();
          
          const updatedItems = items.map(item => {
            const newH = updates.get(item.i);
            if (newH !== undefined) {
              return { ...item, h: newH };
            }
            return item;
          });
          onItemsChange(updatedItems);
        }
      });
    }
  }, [items, onItemsChange, pixelsToGridRows]);

  // Convert GridItem[] to Layout[] for react-grid-layout
  const layout: Layout = items.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW,
    maxW: item.maxW,
    minH: item.minH,
    maxH: item.maxH,
    static: item.static,
  }));

  // Handle layout changes from react-grid-layout
  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      // Map layout back to GridItem[] preserving content and other properties
      const updatedItems: GridItem[] = newLayout.map((layoutItem) => {
        const originalItem = items.find((item) => item.i === layoutItem.i);
        if (originalItem) {
          return {
            ...originalItem,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
        // Fallback (shouldn't happen)
        return {
          i: layoutItem.i,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
          content: <div>Missing content</div>,
        };
      });
      onItemsChange(updatedItems);
    },
    [items, onItemsChange]
  );

  if (!mounted) {
    return <div ref={containerRef as any} style={{ width: "100%", height: autoSize ? "auto" : "100%" }} />;
  }

  return (
    <div ref={containerRef as any} style={{ width: "100%", height: autoSize ? calculatedHeight : "100%", position: 'relative', overflow: 'hidden' }}>
      <ReactGridLayout
        layout={layout}
        width={width}
        gridConfig={{
          cols: columns,
          rowHeight: rowHeight,
          margin: [gap, gap],
          containerPadding: [gap, gap],
        }}
        dragConfig={{
          enabled: true,
          handle: ".drag-handle",
        }}
        resizeConfig={{
          enabled: true,
          handles: ["se"],
        }}
        onLayoutChange={handleLayoutChange}
      >
        {items.map((item) => (
          <div key={item.i} style={{ width: "100%", height: "100%" }}>
            <DashboardPanel
              item={item}
              onSettingsClick={onSettingsClick || (() => {})}
              rowHeight={rowHeight}
              gap={gap}
              noPadding={item.noPadding}
              autoHeight={item.autoHeight}
              onAutoHeight={handleAutoHeight}
              showBorder={item.showBorder}
            />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};
