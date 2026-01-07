import {
  EuiPopover,
  EuiButton,
  useEuiTheme,
  EuiButtonEmpty,
} from "@elastic/eui";
import React, { useState, useEffect, useRef } from "react";

interface TextSelectionExplainerProps {
  onExplain?: (selectedText: string) => void;
}

export const TextSelectionExplainer: React.FC<TextSelectionExplainerProps> = ({
  onExplain,
}) => {
  const { euiTheme } = useEuiTheme();
  const [selectedText, setSelectedText] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout;

    const handleSelection = () => {
      const selection = window.getSelection();

      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim();

        // Wait for 300ms after selection stops changing before showing popover
        selectionTimeout = setTimeout(() => {
          const currentSelection = window.getSelection();
          const currentText = currentSelection?.toString().trim();

          // Only show if selection is still active and has meaningful content
          if (currentSelection && currentText && currentText.length > 2) {
            setSelectedText(currentText);

            // Get the range and its bounding rectangle
            if (currentSelection.rangeCount > 0) {
              const range = currentSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();

              // Position the popover near the end of the selection
              setPopoverPosition({
                x: rect.right + 10,
                y: rect.top + rect.height / 2,
              });

              setIsPopoverOpen(true);
            }
          }
        }, 300);
      } else {
        // Hide popover when selection is cleared
        setIsPopoverOpen(false);
        setSelectedText("");
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the popover itself
      if (
        popoverRef.current &&
        popoverRef.current.contains(event.target as Node)
      ) {
        return;
      }

      // Close popover when clicking outside
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setIsPopoverOpen(false);
          setSelectedText("");
        }
      }, 100);
    };

    // Add event listeners
    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, []);

  const handleExplainClick = () => {
    if (selectedText && onExplain) {
      onExplain(selectedText);
    }
    setIsPopoverOpen(false);
    setSelectedText("");

    // Clear the selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  if (!isPopoverOpen || !selectedText) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        left: popoverPosition.x,
        top: popoverPosition.y,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <EuiPopover
        button={<div style={{ display: "none" }} />}
        isOpen={true}
        closePopover={() => {}}
        panelPaddingSize="s"
        anchorPosition="rightCenter"
        hasArrow={false}
        repositionOnScroll={true}
        ownFocus={false}
        // panelStyle={{
        //   boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
        //   border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        // }}
      >
        <EuiButtonEmpty
          size="xs"
          iconType="sparkles"
          onClick={handleExplainClick}
          color="text"
        >
          Explain
        </EuiButtonEmpty>
      </EuiPopover>
    </div>
  );
};
