import {
  EuiFieldSearch,
  EuiSpacer,
  EuiAccordion,
  EuiText,
  EuiNotificationBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToken,
  EuiButtonIcon,
  EuiToolTip,
} from "@elastic/eui";
import React, { useState, useMemo, useRef, useEffect } from "react";

interface FieldListProps {
  availableFields: string[];
  selectedFields: Record<string, boolean>;
  fieldTypes: Record<string, any>;
  onFieldToggle: (fieldName: string) => void;
  getFieldTypeIcon: (fieldType: any) => string;
  filteredAvailableFieldsCount: number;
  filteredSelectedFieldsCount: number;
}

// Component to handle dynamic field row alignment based on text wrapping
const FieldRow: React.FC<{
  fieldName: string;
  fieldType: any;
  getFieldTypeIcon: (fieldType: any) => string;
  children: React.ReactNode;
}> = ({ fieldName, fieldType, getFieldTypeIcon, children }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isMultiLine, setIsMultiLine] = useState(false);

  useEffect(() => {
    const checkTextWrapping = () => {
      if (textRef.current) {
        const lineHeight = parseFloat(
          getComputedStyle(textRef.current).lineHeight
        );
        const height = textRef.current.offsetHeight;
        setIsMultiLine(height > lineHeight * 1.2); // Allow for slight rounding
      }
    };

    checkTextWrapping();
    window.addEventListener("resize", checkTextWrapping);
    return () => window.removeEventListener("resize", checkTextWrapping);
  }, [fieldName]);

  const iconType = fieldType ? getFieldTypeIcon(fieldType) : "tokenString";

  return (
    <EuiFlexGroup
      alignItems={isMultiLine ? "flexStart" : "center"}
      gutterSize="xs"
    >
      <EuiFlexItem
        grow={false}
        style={isMultiLine ? { paddingTop: "2px" } : {}}
      >
        <EuiToken iconType={iconType} size="s" />
      </EuiFlexItem>
      <EuiFlexItem>
        <div
          className="field-list-item"
          style={{
            display: "flex",
            alignItems: isMultiLine ? "flex-start" : "center",
            position: "relative",
            width: "100%",
            minHeight: "24px",
          }}
        >
          <div style={{ flex: 1, marginRight: "8px", minWidth: 0 }}>
            <EuiText size="xs">
              <span
                ref={textRef}
                style={{
                  wordWrap: "break-word",
                  wordBreak: "break-word",
                  lineHeight: "1.2",
                  display: "block",
                }}
              >
                {fieldName}
              </span>
            </EuiText>
          </div>
          {children}
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const FieldList: React.FC<FieldListProps> = ({
  availableFields,
  selectedFields,
  fieldTypes,
  onFieldToggle,
  getFieldTypeIcon,
  filteredAvailableFieldsCount,
  filteredSelectedFieldsCount,
}) => {
  const [fieldSearchTerm, setFieldSearchTerm] = useState("");

  // Filter fields based on search term
  const filteredSelectedFields = useMemo(() => {
    const selected = Object.keys(selectedFields).filter(
      (field) => selectedFields[field]
    );
    return fieldSearchTerm
      ? selected.filter((field) =>
          field.toLowerCase().includes(fieldSearchTerm.toLowerCase())
        )
      : selected;
  }, [selectedFields, fieldSearchTerm]);

  const filteredAvailableFields = useMemo(() => {
    const unselected = availableFields.filter(
      (field) => !selectedFields[field]
    );
    return fieldSearchTerm
      ? unselected.filter((field) =>
          field.toLowerCase().includes(fieldSearchTerm.toLowerCase())
        )
      : unselected;
  }, [availableFields, selectedFields, fieldSearchTerm]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: 0 }}>
      {/* Sticky search bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "inherit",
          zIndex: 10,
          paddingBottom: "8px",
        }}
      >
        <EuiFlexGroup gutterSize="xs" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="transitionLeftOut"
              aria-label="Field options"
              color="text"
              display="base"
              size="s"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFieldSearch
              placeholder="Search field names"
              compressed
              fullWidth
              value={fieldSearchTerm}
              onChange={(e) => setFieldSearchTerm(e.target.value)}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: "4px" }}>
        {/* Selected Fields Accordion */}
        <EuiAccordion
          id="selectedFields"
          buttonContent={
            <EuiText size="s">
              <strong>Selected fields</strong>
            </EuiText>
          }
          extraAction={
            <EuiNotificationBadge size="s" color="subdued">
              {filteredSelectedFields.length}
            </EuiNotificationBadge>
          }
          initialIsOpen={true}
          paddingSize="none"
        >
          <EuiSpacer size="s" />
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredSelectedFields.map((fieldName) => {
              return (
                <div
                  key={`selected-${fieldName}`}
                  style={{
                    marginBottom: "4px",
                    minHeight: "24px",
                  }}
                  className="field-list-item-container"
                  onMouseEnter={(e) => {
                    const removeButton = e.currentTarget.querySelector(
                      ".field-remove-button"
                    );
                    if (removeButton) {
                      (removeButton as HTMLElement).style.opacity = "1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const removeButton = e.currentTarget.querySelector(
                      ".field-remove-button"
                    );
                    if (removeButton) {
                      (removeButton as HTMLElement).style.opacity = "0";
                    }
                  }}
                >
                  <FieldRow
                    fieldName={fieldName}
                    fieldType={fieldTypes[fieldName]}
                    getFieldTypeIcon={getFieldTypeIcon}
                  >
                    <div
                      className="field-remove-button"
                      style={{
                        opacity: 0,
                        transition: "opacity 0.2s",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      <EuiToolTip content="Remove field">
                        <EuiButtonIcon
                          size="xs"
                          iconType="cross"
                          color="danger"
                          onClick={() => onFieldToggle(fieldName)}
                          aria-label={`Remove ${fieldName} field`}
                        />
                      </EuiToolTip>
                    </div>
                  </FieldRow>
                </div>
              );
            })}
          </div>
        </EuiAccordion>

        <EuiSpacer size="m" />

        {/* Available Fields Accordion - flex: 1 to fill remaining space */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <EuiAccordion
            id="availableFields"
            buttonContent={
              <EuiText size="s">
                <strong>Available fields</strong>
              </EuiText>
            }
            extraAction={
              <EuiNotificationBadge size="s" color="subdued">
                {filteredAvailableFields.length}
              </EuiNotificationBadge>
            }
            initialIsOpen={true}
            paddingSize="none"
          >
            <EuiSpacer size="s" />
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredAvailableFields.map((fieldName) => {
                return (
                  <div
                    key={`available-${fieldName}`}
                    style={{
                      marginBottom: "4px",
                      minHeight: "24px",
                    }}
                    className="field-list-item-container"
                    onMouseEnter={(e) => {
                      const addButton =
                        e.currentTarget.querySelector(".field-add-button");
                      if (addButton) {
                        (addButton as HTMLElement).style.opacity = "1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const addButton =
                        e.currentTarget.querySelector(".field-add-button");
                      if (addButton) {
                        (addButton as HTMLElement).style.opacity = "0";
                      }
                    }}
                  >
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => onFieldToggle(fieldName)}
                    >
                      <FieldRow
                        fieldName={fieldName}
                        fieldType={fieldTypes[fieldName]}
                        getFieldTypeIcon={getFieldTypeIcon}
                      >
                        <div
                          className="field-add-button"
                          style={{
                            opacity: 0,
                            transition: "opacity 0.2s",
                            flexShrink: 0,
                            marginTop: "1px",
                          }}
                        >
                          <EuiToolTip content="Add field to table">
                            <EuiButtonIcon
                              size="xs"
                              iconType="plusInCircle"
                              color="primary"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onFieldToggle(fieldName);
                              }}
                              aria-label={`Add ${fieldName} field`}
                            />
                          </EuiToolTip>
                        </div>
                      </FieldRow>
                    </div>
                  </div>
                );
              })}
            </div>
          </EuiAccordion>
        </div>
      </div>
    </div>
  );
};
