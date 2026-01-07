import React, { useMemo } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { Command, ArrowFatUp } from 'phosphor-react';

interface EditorFooterProps {
  value: string;
  euiTheme: any;
  compressed?: boolean;
  onQuickEdit?: () => void;
}

export const EditorFooter: React.FC<EditorFooterProps> = ({
  value,
  euiTheme,
  compressed = false,
  onQuickEdit,
}) => {
  // Calculate line count dynamically
  const lineCount = useMemo(() => {
    if (!value) return 1;
    return value.split("\n").length;
  }, [value]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "12px",
        color: euiTheme.colors.textSubdued,
        backgroundColor: euiTheme.colors.emptyShade,
        borderBottom: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
        ...(compressed
          ? {
              height: "24px",
              minHeight: "24px",
              maxHeight: "24px",
            }
          : {}),
        padding: compressed ? "0px 8px" : "6px 12px",
        borderRadius: "0",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compressed ? "8px" : "12px",
        }}
      >
        {!compressed && (
          <span>
            {lineCount} line{lineCount !== 1 ? "s" : ""}
          </span>
        )}
        <span>@timestamp found</span>
        <span>LIMIT 1000 rows</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {onQuickEdit && (
          <button
            onClick={onQuickEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "18px",
              padding: "0 8px",
              border: "none",
              background: "transparent",
              color: euiTheme.colors.primaryText,
              fontSize: "12px",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <span>Quick edit</span>
            <div style={{ display: "flex", fontSize: "11px", alignItems: "center" }}>
              <span>(</span>
              <Command size={13}  />
              <ArrowFatUp size={13} />
              <span>K)</span>
            </div>
          </button>
        )}
        <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          flush="right"
          size="xs"
          iconType="plusInCircle"
        >
          Add control
        </EuiButtonEmpty>
        <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          flush="right"
          size="xs"
          iconType="comment"
        >
          Feedback
        </EuiButtonEmpty>
        <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          size="xs"
          flush="right"
          iconType="starFilled"
        >
          Starred
        </EuiButtonEmpty>
        <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          size="xs"
          flush="right"
          iconType="clockCounter"
        >
          History
        </EuiButtonEmpty>
      </div>
    </div>
  );
};

