import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEuiTheme } from "@elastic/eui";
import { DashboardPanel } from "./DashboardPanel";

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content: React.ReactNode;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface DashboardGridProps {
  items: GridItem[];
  onItemsChange: (items: GridItem[]) => void;
  columns?: number;
  rowHeight?: number;
  gap?: number;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  items,
  onItemsChange,
  columns = 12,
  rowHeight = 60,
  gap = 12,
}) => {
  const { euiTheme } = useEuiTheme();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Calculate grid template columns
  const gridTemplateColumns = `repeat(${columns}, 1fr)`;

  // Check if two items overlap
  const checkCollision = useCallback((item1: GridItem, item2: GridItem): boolean => {
    return !(
      item1.x + item1.w <= item2.x ||
      item2.x + item2.w <= item1.x ||
      item1.y + item1.h <= item2.y ||
      item2.y + item2.h <= item1.y
    );
  }, []);

  // Resolve collisions by nudging overlapping items
  const resolveCollisions = useCallback((
    draggedItemId: string,
    targetX: number,
    targetY: number,
    currentItems: GridItem[]
  ): GridItem[] => {
    const draggedItem = currentItems.find((i) => i.id === draggedItemId);
    if (!draggedItem) return currentItems;

    // Start with the dragged item at its new position
    const targetItem: GridItem = {
      ...draggedItem,
      x: targetX,
      y: targetY,
    };

    // Create a working copy of items with the dragged item moved
    let workingItems = currentItems.map((item) =>
      item.id === draggedItemId ? targetItem : item
    );

    let changed = true;
    const maxIterations = 100; // Safety limit
    let iterations = 0;

    // Keep resolving collisions until no more collisions exist or max iterations reached
    while (changed && iterations < maxIterations) {
      iterations++;
      changed = false;

      // Check each item for collisions
      for (let i = 0; i < workingItems.length; i++) {
        const item = workingItems[i];

        // Check if this item collides with any other item
        for (let j = i + 1; j < workingItems.length; j++) {
          const otherItem = workingItems[j];

          if (checkCollision(item, otherItem)) {
            // Determine which item to move (always move the non-dragged item)
            const itemToMove = item.id === draggedItemId ? otherItem : item;
            const blockingItem = item.id === draggedItemId ? item : otherItem;

            // Try different nudging strategies
            let newX = itemToMove.x;
            let newY = itemToMove.y;
            let nudged = false;

            // Strategy 1: Move right (preferred)
            const rightX = blockingItem.x + blockingItem.w;
            if (rightX + itemToMove.w <= columns) {
              newX = rightX;
              nudged = true;
            }
            // Strategy 2: Move down
            else if (blockingItem.y + blockingItem.h + itemToMove.h <= 1000) {
              newY = blockingItem.y + blockingItem.h;
              nudged = true;
            }
            // Strategy 3: Move left (if there's space)
            else if (blockingItem.x - itemToMove.w >= 0) {
              newX = blockingItem.x - itemToMove.w;
              nudged = true;
            }
            // Strategy 4: Move up (if there's space)
            else if (blockingItem.y - itemToMove.h >= 0) {
              newY = blockingItem.y - itemToMove.h;
              nudged = true;
            }

            if (nudged) {
              // Update the item position
              workingItems = workingItems.map((it) =>
                it.id === itemToMove.id
                  ? { ...it, x: newX, y: newY }
                  : it
              );
              changed = true;
              break; // Break inner loop to re-check all items from the beginning
            }
          }
        }
        
        // If we made a change, restart the collision check from the beginning
        if (changed) break;
      }
    }

    return workingItems;
  }, [columns, checkCollision]);

  // Handle drag start
  const handleDragStart = useCallback((itemId: string, e: React.DragEvent) => {
    setDraggedItem(itemId);
    const item = items.find((i) => i.id === itemId);
    if (!item || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const itemElement = e.currentTarget as HTMLElement;
    const itemRect = itemElement.getBoundingClientRect();

    // Calculate offset from mouse to item top-left corner
    setDragOffset({
      x: e.clientX - itemRect.left,
      y: e.clientY - itemRect.top,
    });

    // Set drag image
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }, [items]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItem || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const colWidth = (gridRect.width - gap * (columns - 1)) / columns;
    
    // Calculate grid position based on mouse position relative to grid
    const gridX = e.clientX - gridRect.left - gap;
    const gridY = e.clientY - gridRect.top - gap;
    
    const newX = Math.max(0, Math.floor(gridX / (colWidth + gap)));
    const newY = Math.max(0, Math.floor(gridY / (rowHeight + gap)));

    // Update item position only if it changed
    const currentItem = items.find((i) => i.id === draggedItem);
    if (currentItem && (currentItem.x !== newX || currentItem.y !== newY)) {
      const clampedX = Math.min(newX, columns - currentItem.w);
      const clampedY = Math.max(0, newY);
      
      // Resolve collisions by nudging overlapping items
      const updatedItems = resolveCollisions(draggedItem, clampedX, clampedY, items);
      onItemsChange(updatedItems);
    }
  }, [draggedItem, items, columns, rowHeight, gap, resolveCollisions, onItemsChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setResizingItem(null);
  }, []);

  // Handle resize
  const handleResize = useCallback((
    itemId: string,
    direction: "right" | "bottom" | "corner",
    deltaX: number,
    deltaY: number
  ) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const colWidth = (gridRect.width - gap * (columns - 1)) / columns;

    setResizingItem(itemId);

    // First, calculate the new size for the resizing item
    const resizingItem = items.find((item) => item.id === itemId);
    if (!resizingItem) return;

    let newW = resizingItem.w;
    let newH = resizingItem.h;

    if (direction === "right" || direction === "corner") {
      const deltaCols = Math.round(deltaX / (colWidth + gap));
      const proposedW = resizingItem.w + deltaCols;
      newW = Math.max(resizingItem.minW || 2, Math.min(resizingItem.maxW || columns, proposedW));
    }

    if (direction === "bottom" || direction === "corner") {
      const deltaRows = Math.round(deltaY / (rowHeight + gap));
      const proposedH = resizingItem.h + deltaRows;
      newH = Math.max(resizingItem.minH || 1, Math.min(resizingItem.maxH || 20, proposedH));
    }

    // Ensure item doesn't go out of bounds
    if (resizingItem.x + newW > columns) {
      newW = columns - resizingItem.x;
    }

    // Create updated item with new dimensions
    const resizedItem: GridItem = {
      ...resizingItem,
      w: newW,
      h: newH,
    };

    // Start with the resized item and resolve collisions
    let workingItems = items.map((item) =>
      item.id === itemId ? resizedItem : item
    );

    // Resolve collisions caused by the resize
    let changed = true;
    const maxIterations = 100;
    let iterations = 0;

    while (changed && iterations < maxIterations) {
      iterations++;
      changed = false;

      // Check each item for collisions
      for (let i = 0; i < workingItems.length; i++) {
        const item = workingItems[i];

        // Check if this item collides with any other item
        for (let j = i + 1; j < workingItems.length; j++) {
          const otherItem = workingItems[j];

          if (checkCollision(item, otherItem)) {
            // Determine which item to move (prefer moving the non-resizing item)
            const itemToMove = item.id === itemId ? otherItem : item;
            const blockingItem = item.id === itemId ? item : otherItem;

            // Try different nudging strategies (prefer down and left)
            let newX = itemToMove.x;
            let newY = itemToMove.y;
            let nudged = false;

            // Strategy 1: Move down (preferred for resize collisions)
            if (blockingItem.y + blockingItem.h + itemToMove.h <= 1000) {
              newY = blockingItem.y + blockingItem.h;
              nudged = true;
            }
            // Strategy 2: Move left
            else if (blockingItem.x - itemToMove.w >= 0) {
              newX = blockingItem.x - itemToMove.w;
              nudged = true;
            }
            // Strategy 3: Move right (if there's space)
            else if (blockingItem.x + blockingItem.w + itemToMove.w <= columns) {
              newX = blockingItem.x + blockingItem.w;
              nudged = true;
            }
            // Strategy 4: Move up (if there's space)
            else if (blockingItem.y - itemToMove.h >= 0) {
              newY = blockingItem.y - itemToMove.h;
              nudged = true;
            }

            if (nudged) {
              // Update the item position
              workingItems = workingItems.map((it) =>
                it.id === itemToMove.id
                  ? { ...it, x: newX, y: newY }
                  : it
              );
              changed = true;
              break; // Break inner loop to re-check all items from the beginning
            }
          }
        }

        // If we made a change, restart the collision check from the beginning
        if (changed) break;
      }
    }

    onItemsChange(workingItems);
  }, [items, columns, rowHeight, gap, checkCollision, onItemsChange]);

  return (
    <div
      ref={gridRef}
      style={{
        display: "grid",
        gridTemplateColumns,
        gridAutoRows: `${rowHeight}px`,
        gap: `${gap}px`,
        width: "100%",
        height: "100%",
        padding: gap,
        position: "relative",
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        e.preventDefault();
        handleDragEnd();
      }}
    >
      {items.map((item) => (
        <DashboardPanel
          key={item.id}
          item={item}
          columns={columns}
          rowHeight={rowHeight}
          gap={gap}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onResize={handleResize}
          isDragging={draggedItem === item.id}
        />
      ))}
    </div>
  );
};
