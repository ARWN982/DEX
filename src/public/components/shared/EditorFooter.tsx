import React, { useMemo } from 'react';
import { EuiButtonEmpty, EuiIcon } from '@elastic/eui';

interface EditorFooterProps {
  value: string;
  euiTheme: any;
  compressed?: boolean;
  onQuickEdit?: () => void;
  isDarkMode?: boolean;
  /** Whether to use gradient styling for the Quick search button. Defaults to true. */
  useGradient?: boolean;
  /** Whether to show a search icon instead of the keyboard shortcut. Defaults to false. */
  showIcon?: boolean;
  /** Whether VisorHex is currently open. When true, gradient is disabled. Defaults to false. */
  isVisorOpen?: boolean;
}

export const EditorFooter: React.FC<EditorFooterProps> = ({
  value,
  euiTheme,
  compressed = false,
  onQuickEdit,
  isDarkMode = false,
  useGradient = true,
  showIcon = false,
  isVisorOpen = false,
}) => {
  // Calculate line count dynamically
  const lineCount = useMemo(() => {
    if (!value) return 1;
    return value.split("\n").length;
  }, [value]);

  // Only show gradient when useGradient is true AND VisorHex is not open
  const showGradient = useGradient && !isVisorOpen;

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
          <>
            {showGradient && (
              <>
                {/* Hidden SVG for gradient definition */}
                <svg width="0" height="0" style={{ position: "absolute" }}>
                  <defs>
                    <linearGradient
                      id="quick-search-gradient"
                      x1={isDarkMode ? "18.35%" : "21.85%"}
                      y1="0%"
                      x2={isDarkMode ? "112.9%" : "98.82%"}
                      y2="100%"
                      gradientUnits="objectBoundingBox"
                    >
                      {isDarkMode ? (
                        <>
                          <stop offset="18.35%" stopColor="#61A2FF" />
                          <stop offset="51.95%" stopColor="#8A82E8" />
                          <stop offset="88.68%" stopColor="#D846BB" />
                          <stop offset="112.9%" stopColor="#FF27A5" />
                        </>
                      ) : (
                        <>
                          <stop offset="21.85%" stopColor="#0B64DD" />
                          <stop offset="98.82%" stopColor="#FF27A5" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                </svg>
                <style>
                  {`
                    .gradient-sparkles-icon-footer svg path {
                      fill: url(#quick-search-gradient) !important;
                    }
                    
                    .quick-search-text {
                      background: ${isDarkMode
                        ? "linear-gradient(90deg, #61A2FF, #8A82E8, #D846BB, #FF27A5, #61A2FF)"
                        : "linear-gradient(90deg, #0B64DD, #8A4FD6, #FF27A5, #0B64DD)"};
                      background-size: 200% 200%;
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      transition: all 0.15s ease-out;
                    }
                    
                    .quick-search-button:hover .quick-search-text {
                      background: none;
                      -webkit-background-clip: unset;
                      -webkit-text-fill-color: ${euiTheme.colors.primaryText};
                      background-clip: unset;
                    }
                  `}
                </style>
              </>
            )}
            <button
              className={showGradient ? "quick-search-button" : undefined}
              onClick={onQuickEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "18px",
                padding: "0 8px",
                border: "none",
                background: "transparent",
                fontSize: "12px",
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
                color: showGradient ? undefined : euiTheme.colors.primaryText,
              }}
            >
              {showIcon && (
                <EuiIcon type="search" size="s" color={showGradient ? undefined : euiTheme.colors.primaryText} />
              )}
              {showGradient ? (
                <>
                  <span className="quick-search-text">
                    Quick search
                  </span>
                  {!showIcon && (
                    <span 
                      className="quick-search-text"
                      style={{ fontSize: "11px" }}
                    >
                      (⌘K)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>Quick search</span>
                  {!showIcon && (
                    <span style={{ fontSize: "11px" }}>(⌘K)</span>
                  )}
                </>
              )}
            </button>
          </>
        )}
        {/* <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          flush="right"
          size="xs"
          iconType="plusInCircle"
        >
          Add control
        </EuiButtonEmpty> */}
        {/* <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          flush="right"
          size="xs"
          iconType="comment"
        >
          Feedback
        </EuiButtonEmpty> */}
        {/* <EuiButtonEmpty
          style={{
            height: "18px",
          }}
          size="xs"
          flush="right"
          iconType="starFilled"
        >
          Starred
        </EuiButtonEmpty> */}
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

