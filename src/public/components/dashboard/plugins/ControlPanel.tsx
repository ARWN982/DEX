/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { useEuiTheme, EuiIcon } from "@elastic/eui";
import { css } from "@emotion/react";

export interface ControlOption {
  value: string;
  label: string;
}

interface ControlPanelProps {
  /** The label displayed above the selected value (always shown) */
  label: string;
  /** Available options for the control */
  options?: ControlOption[];
  /** Currently selected value(s) */
  selectedValues?: string[];
  /** Callback when selection changes */
  onChange?: (values: string[]) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Whether to show a border around the dropdown (default: true) */
  showDropdownBorder?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Any",
  showDropdownBorder = true,
}) => {
  const { euiTheme } = useEuiTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Get display text for selected values
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    
    const selectedLabels = selectedValues
      .map(value => options.find(opt => opt.value === value)?.label || value)
      .join(", ");
    
    return selectedLabels;
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (value: string) => {
    if (!onChange) return;
    
    const isSelected = selectedValues.includes(value);
    if (isSelected) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div
      className="control-panel"
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-between;
        padding-top: ${showDropdownBorder ? '0' : '2px'};
        overflow: hidden;
      `}
    >
      {/* Label - sits at top */}
      <div
        className="control-label"
        css={css`
          font-size: 14px;
          line-height: 16px;
          font-weight: 400;
          padding-bottom: ${showDropdownBorder ? '4px' : '0'};
          color: ${euiTheme.colors.textSubdued};
          flex-shrink: 0;
        `}
      >
        {label}
      </div>

      {/* Dropdown - sits at bottom with fixed height */}
      <div
        className="control-dropdown"
        css={css`
          position: relative;
          flex-shrink: 0;
          height: 28px;
        `}
      >
        <button
          type="button"
          onClick={handleToggle}
          css={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 28px;
            background: transparent;
            border: ${showDropdownBorder ? `1px solid ${euiTheme.colors.borderBasePlain}` : 'none'};
            border-radius: ${showDropdownBorder ? '6px' : '0'};
            padding: 0 ${showDropdownBorder ? '8px' : '0'};
            cursor: pointer;
            text-align: left;
            
            &:hover {
              border-color: ${showDropdownBorder ? euiTheme.colors.borderBaseSubdued : 'transparent'};
            }
          `}
        >
          <span
            css={css`
              font-size: 14px;
              color: ${selectedValues.length === 0 ? euiTheme.colors.textSubdued : euiTheme.colors.textParagraph};
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {getDisplayText()}
          </span>

          <div
            css={css`
              display: flex;
              align-items: center;
              gap: 8px;
              margin-left: 8px;
            `}
          >
            {/* Count badge */}
            {selectedValues.length > 0 && (
              <span
                css={css`
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-width: 16px;
                  height: 16px;
                  padding: 0 6px;
                  background-color: ${euiTheme.colors.success};
                  color: white;
                  font-size: 12px;
                  font-weight: 600;
                  border-radius: 4px;
                `}
              >
                {selectedValues.length}
              </span>
            )}

            {/* Dropdown icon */}
            <EuiIcon
              type="arrowDown"
              size="s"
              color="subdued"
              css={css`
                transition: transform 0.15s ease;
                transform: ${isOpen ? "rotate(180deg)" : "rotate(0deg)"};
              `}
            />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && options.length > 0 && (
          <div
            css={css`
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              right: 0;
              background: ${euiTheme.colors.emptyShade};
              border: 1px solid ${euiTheme.colors.borderBasePlain};
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              z-index: 100;
              max-height: 200px;
              overflow-y: auto;
            `}
          >
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  css={css`
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 8px 12px;
                    background: ${isSelected ? euiTheme.colors.backgroundBasePrimary : "transparent"};
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    font-size: 14px;
                    color: ${euiTheme.colors.text};

                    &:hover {
                      background: ${euiTheme.colors.backgroundBaseSubdued};
                    }

                    &:first-of-type {
                      border-radius: 6px 6px 0 0;
                    }

                    &:last-of-type {
                      border-radius: 0 0 6px 6px;
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
