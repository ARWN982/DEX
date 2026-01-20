/** @jsxImportSource @emotion/react */
import React, { useState, useRef, useCallback } from "react";
import { useEuiTheme, euiShadow } from "@elastic/eui";
import { css } from "@emotion/react";
import { GridItem } from "./DashboardGrid";

interface DashboardPanelProps {
  item: GridItem;
  columns: number;
  rowHeight: number;
  gap: number;
  onDragStart: (itemId: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onResize: (itemId: string, direction: "right" | "bottom" | "corner", deltaX: number, deltaY: number) => void;
  isDragging: boolean;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  item,
  columns,
  rowHeight,
  gap,
  onDragStart,
  onDragEnd,
  onResize,
  isDragging,
}) => {
  const euiThemeContext = useEuiTheme();
  const { euiTheme } = euiThemeContext;
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate grid position
  const gridColumn = `${item.x + 1} / ${item.x + item.w + 1}`;
  const gridRow = `${item.y + 1} / ${item.y + item.h + 1}`;

  // Handle resize start
  const handleResizeStart = useCallback((
    direction: "right" | "bottom" | "corner",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      onResize(item.id, direction, deltaX, deltaY);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [item.id, onResize]);

  return (
    <div
      ref={panelRef}
      draggable
      onDragStart={(e) => onDragStart(item.id, e)}
      onDragEnd={onDragEnd}
      style={{
        gridColumn,
        gridRow,
        position: "relative",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.8 : 1,
      }}
      css={css`
        ${euiShadow(euiThemeContext, "xs")};
        background-color: ${euiTheme.colors.emptyShade};
        border-radius: 4px;
        border: 1px solid ${euiTheme.colors.borderBaseSubdued};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: opacity 0.2s ease;

        &:hover {
          .resize-handle {
            opacity: 1;
          }
        }
      `}
    >
      {/* Panel Content */}
      <div style={{ flex: 1, overflow: "auto", padding: euiTheme.size.m }}>
        {item.content}
      </div>

      {/* Resize Handles */}
      {/* Right handle */}
      <div
        className="resize-handle resize-handle-right"
        onMouseDown={(e) => handleResizeStart("right", e)}
        css={css`
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: ew-resize;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;

          &:hover {
            opacity: 1;
            background-color: ${euiTheme.colors.primary};
          }
        `}
      />

      {/* Bottom handle */}
      <div
        className="resize-handle resize-handle-bottom"
        onMouseDown={(e) => handleResizeStart("bottom", e)}
        css={css`
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          cursor: ns-resize;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;

          &:hover {
            opacity: 1;
            background-color: ${euiTheme.colors.primary};
          }
        `}
      />

      {/* Corner handle */}
      <div
        className="resize-handle resize-handle-corner"
        onMouseDown={(e) => handleResizeStart("corner", e)}
        css={css`
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          cursor: nwse-resize;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 11;
          background-color: ${euiTheme.colors.primary};
          border-radius: 0 0 4px 0;

          &:hover {
            opacity: 1;
          }
        `}
      />
    </div>
  );
};
