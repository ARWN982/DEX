import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiNotificationBadge,
  EuiPopover,
  useEuiTheme,
} from "@elastic/eui";
import React, { useState } from "react";
import {
  filterDataSources,
  createLabelToIndexMapping,
  createIndexToLabelMapping,
  type DataSourceType,
  dataSourceTypes,
} from "../../../../utils/dataSourceGenerator";

interface DataSourceSelectorProps {
  selectedIndex: string;
  onDataSourceChange: (newIndex: string) => void;
  width?: number;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  selectedIndex,
  onDataSourceChange,
  width = 176,
}) => {
  const { euiTheme } = useEuiTheme();
  
  const [isDataSourcePopoverOpen, setIsDataSourcePopoverOpen] = useState(false);
  const [dataSourceSearchTerm, setDataSourceSearchTerm] = useState("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<DataSourceType[]>([]);
  const [showTypeFilters, setShowTypeFilters] = useState(false);

  // Create label mappings using utility functions
  const labelToIndexMapping = createLabelToIndexMapping();
  const indexToLabelMapping = createIndexToLabelMapping(labelToIndexMapping);

  // Filtered options based on search term and type filters
  const filteredIndexOptions = filterDataSources(selectedTypeFilters, dataSourceSearchTerm);

  const handleDataSourceSelection = (newIndex: string) => {
    onDataSourceChange(newIndex);
    setIsDataSourcePopoverOpen(false);
    setDataSourceSearchTerm("");
    setShowTypeFilters(false);
  };

  return (
    <EuiPopover
      button={
        <div
          onClick={() => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen)}
          style={{
            border: `1px solid ${euiTheme.colors.borderBasePlain}`,
            borderRadius: euiTheme.border.radius.medium,
            backgroundColor: euiTheme.colors.emptyShade,
            width: `${width}px`,
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: euiTheme.colors.text,
          }}
        >
          <span>{indexToLabelMapping[selectedIndex] || selectedIndex}</span>
          <EuiIcon type="arrowDown" size="s" />
        </div>
      }
      isOpen={isDataSourcePopoverOpen}
      closePopover={() => {
        setIsDataSourcePopoverOpen(false);
        setDataSourceSearchTerm("");
        setShowTypeFilters(false);
      }}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <div style={{ width: 400 }}>
        {/* Search bar with filter button at the top */}
        <div
          style={{
            padding: "8px",
            borderBottom: "1px solid #D3DAE6",
          }}
        >
          <EuiFieldSearch
            placeholder="Search data sources"
            value={dataSourceSearchTerm}
            onChange={(e) => setDataSourceSearchTerm(e.target.value)}
            compressed
            fullWidth
            append={
              <EuiButtonEmpty
                size="s"
                color="text"
                onClick={() => setShowTypeFilters(!showTypeFilters)}
                style={{
                  width: "56px",
                  minWidth: "56px",
                  paddingInline: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                css={{
                  "& .euiButtonEmpty__content": {
                    paddingBottom: "2px",
                  },
                }}
                aria-label="Filter by type"
              >
                <EuiIcon type="filter" size="m" />
                <EuiNotificationBadge
                  style={{ marginLeft: "8px" }}
                  color={selectedTypeFilters.length > 0 ? "accent" : "subdued"}
                  size="s"
                >
                  {selectedTypeFilters.length}
                </EuiNotificationBadge>
              </EuiButtonEmpty>
            }
          />
        </div>

        {/* Type filter section */}
        {showTypeFilters && (
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid #D3DAE6",
              backgroundColor: "#F7F8FC",
            }}
          >
            <div
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Filter by type
            </div>
            <EuiFlexGroup gutterSize="s" direction="column">
              {dataSourceTypes.map((type: DataSourceType) => (
                <EuiFlexItem key={type}>
                  <EuiCheckbox
                    id={`type-filter-${type}`}
                    label={type}
                    checked={selectedTypeFilters.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTypeFilters([...selectedTypeFilters, type]);
                      } else {
                        setSelectedTypeFilters(
                          selectedTypeFilters.filter((t) => t !== type)
                        );
                      }
                    }}
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
            <EuiFlexGroup
              gutterSize="s"
              justifyContent="spaceBetween"
              style={{ marginTop: "8px" }}
            >
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  onClick={() => setSelectedTypeFilters([])}
                  disabled={selectedTypeFilters.length === 0}
                >
                  Clear all
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  onClick={() => setShowTypeFilters(false)}
                >
                  Done
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}

        {/* Data source options list */}
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {filteredIndexOptions.length > 0 ? (
            filteredIndexOptions.map((option: any) => (
              <div
                key={option.label}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${euiTheme.border.color}`,
                  backgroundColor:
                    labelToIndexMapping[option.label] === selectedIndex
                      ? euiTheme.colors.backgroundBaseHighlighted
                      : "transparent",
                }}
                onClick={() =>
                  handleDataSourceSelection(
                    labelToIndexMapping[option.label] || option.label
                  )
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    euiTheme.colors.backgroundBaseHighlighted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    labelToIndexMapping[option.label] === selectedIndex
                      ? euiTheme.colors.backgroundBaseHighlighted
                      : "transparent";
                }}
              >
                <EuiFlexGroup
                  justifyContent="spaceBetween"
                  alignItems="center"
                  gutterSize="s"
                >
                  <EuiFlexItem>{option.label}</EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge
                      color={
                        option.type === "Integration"
                          ? "primary"
                          : option.type === "Stream"
                            ? "success"
                            : "default"
                      }
                      style={{ fontSize: "11px" }}
                    >
                      {option.type}
                    </EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "#69707D",
              }}
            >
              No data views found
            </div>
          )}
        </div>
      </div>
    </EuiPopover>
  );
};