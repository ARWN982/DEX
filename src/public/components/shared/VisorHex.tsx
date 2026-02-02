import React, { useState, useEffect } from "react";
import { EuiIcon } from "@elastic/eui";

interface VisorHexProps {
  isDarkMode?: boolean;
  euiTheme?: any;
  onClose?: () => void;
  onSubmit?: (prompt: string, language: string, dataSource: string) => void;
  currentDataSource?: string;
  isGenerating?: boolean;
}

export const VisorHex: React.FC<VisorHexProps> = ({ 
  isDarkMode, 
  euiTheme, 
  onClose,
  onSubmit,
  currentDataSource = "logs-*",
  isGenerating = false
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLanguagePopoverOpen, setIsLanguagePopoverOpen] = useState(false);
  const [isDataSourcePopoverOpen, setIsDataSourcePopoverOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Natural language");
  const [selectedDataSource, setSelectedDataSource] = useState(currentDataSource);
  
  // Update selected data source when prop changes
  useEffect(() => {
    setSelectedDataSource(currentDataSource);
  }, [currentDataSource]);
  
  // Common data sources
  const dataSources = ["logs-*", "metrics-*", "traces-*", "filebeat-*", "metricbeat-*"];

  useEffect(() => {
    // Close popovers when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popover-container]')) {
        setIsLanguagePopoverOpen(false);
        setIsDataSourcePopoverOpen(false);
      }
    };

    if (isLanguagePopoverOpen || isDataSourcePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguagePopoverOpen, isDataSourcePopoverOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && onSubmit) {
        onSubmit(inputValue, selectedLanguage, selectedDataSource);
        setInputValue("");
      }
    }
  };
  
  // Theme-aware colors
  const borderColor = euiTheme?.colors?.borderBaseSubdued || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)');
  const bgColor = euiTheme?.colors?.emptyShade || (isDarkMode ? '#1D1E24' : '#FFFFFF');
  const iconColor = euiTheme?.colors?.primary || '#6B5FD6';
  const boxShadow = isDarkMode 
    ? '0px 6px 14px 0px rgba(137, 157, 170, 0.28)' 
    : '0px 6px 14px 0px rgba(11, 14, 22, 0.03)';

  // Shared gradient border base style
  const gradientBorderBase: React.CSSProperties = {
    background: isDarkMode
      ? "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)"
      : "linear-gradient(107.9deg, #0B64DD 21.85%, #FF27A5 98.82%)",
    borderRadius: "6px",
    padding: "1px",
    height: "32px",
    boxShadow: boxShadow,
    flexShrink: 0,
  };

  // Main input gradient border
  const gradientBorder: React.CSSProperties = {
    ...gradientBorderBase,
    width: "50%",
  };

  // Close button gradient border
  const closeButtonGradientBorder: React.CSSProperties = {
    ...gradientBorderBase,
    width: "32px",
    marginLeft: "8px",
  };

  const innerContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "30px",
    padding: "0",
    background: bgColor,
    border: "none",
    borderRadius: "5px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    boxShadow: "none",
    transition: "box-shadow 0.15s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
  };
  
  // Generating state content
  const generatingContent = (
    <div style={innerContainerStyle}>
      <style>
        {`
          @keyframes dotPulse {
            0%, 20% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.3;
            }
          }
          .generating-dot {
            display: inline-block;
            animation: dotPulse 1.4s infinite;
          }
          .generating-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .generating-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        `}
      </style>
      <div style={{
        fontSize: "13px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        color: iconColor,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        paddingLeft: "12px",
      }}>
        <span>Generating</span>
        <span className="generating-dot">.</span>
        <span className="generating-dot">.</span>
        <span className="generating-dot">.</span>
      </div>
    </div>
  );
  
  const content = (
    <div style={innerContainerStyle}>
      {/* CSS for gradient sparkles icon */}
      <style>
        {`
          .gradient-sparkles-icon-visor svg path {
            fill: url(#sparkles-gradient-visor) !important;
          }
        `}
      </style>
      
      {/* Hidden SVG for gradient definition */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient
            id="sparkles-gradient-visor"
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
      
      {/* Language dropdown */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }} data-popover-container>
        <button
          onClick={() => setIsLanguagePopoverOpen(!isLanguagePopoverOpen)}
          style={{
            height: "100%",
            padding: "0 12px",
            border: "none",
            borderRight: `1px solid ${borderColor}`,
            borderRadius: selectedLanguage === "KQL" ? "6px 0 0 6px" : "6px 0 0 6px",
            fontSize: "12px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            backgroundColor: "transparent",
            color: selectedLanguage === "Natural language" 
              ? iconColor 
              : (selectedLanguage === "KQL" || selectedLanguage === "PromQL") 
                ? euiTheme?.colors?.textPrimary 
                : euiTheme?.colors?.text,
            outline: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLanguage === "Natural language" && (
            <div className="gradient-sparkles-icon-visor">
              <EuiIcon type="sparkles" size="s" />
            </div>
          )}
          {selectedLanguage}
          <EuiIcon 
            type="arrowDown" 
            size="s"
            color={selectedLanguage === "Natural language" 
              ? iconColor 
              : (selectedLanguage === "KQL" || selectedLanguage === "PromQL") 
                ? euiTheme?.colors?.textPrimary 
                : undefined}
          />
        </button>
        {isLanguagePopoverOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "6px",
              padding: "4px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
              zIndex: 10000,
              minWidth: "140px",
            }}
          >
            {["Natural language", "KQL", "PromQL"].map((lang) => (
              <div
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  setIsLanguagePopoverOpen(false);
                }}
                style={{
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                  borderRadius: "4px",
                  color: euiTheme?.colors?.text,
                  backgroundColor: selectedLanguage === lang ? euiTheme?.colors?.backgroundBaseSubdued : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (selectedLanguage !== lang) {
                    e.currentTarget.style.backgroundColor = euiTheme?.colors?.backgroundBaseSubdued;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLanguage !== lang) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {lang}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Data Source dropdown (for KQL and PromQL) */}
      {(selectedLanguage === "KQL" || selectedLanguage === "PromQL") && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }} data-popover-container>
          <button
            onClick={() => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen)}
            style={{
              height: "100%",
              padding: "0 12px",
              border: "none",
              borderRight: `1px solid ${borderColor}`,
              fontSize: "12px",
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              backgroundColor: "transparent",
              color: euiTheme?.colors?.textPrimary,
              outline: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {selectedDataSource}
            <EuiIcon type="arrowDown" size="s" color={euiTheme?.colors?.textPrimary} />
          </button>
          {isDataSourcePopoverOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "6px",
                padding: "4px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                zIndex: 10000,
                minWidth: "140px",
              }}
            >
              {dataSources.map((source) => (
                <div
                  key={source}
                  onClick={() => {
                    setSelectedDataSource(source);
                    setIsDataSourcePopoverOpen(false);
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                    cursor: "pointer",
                    borderRadius: "4px",
                    color: euiTheme?.colors?.text,
                    backgroundColor: selectedDataSource === source ? euiTheme?.colors?.backgroundBaseSubdued : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDataSource !== source) {
                      e.currentTarget.style.backgroundColor = euiTheme?.colors?.backgroundBaseSubdued;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDataSource !== source) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {source}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Input field */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={selectedLanguage === "KQL" || selectedLanguage === "PromQL" ? "Search..." : "Ask about your data..."}
        autoFocus
        style={{
          flex: 1,
          height: "100%",
          padding: "0 12px",
          border: "none",
          borderRadius: "0",
          fontSize: "13px",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          backgroundColor: "transparent",
          color: euiTheme?.colors?.text,
          outline: "none",
        }}
      />
    </div>
  );
  
  const closeButtonInnerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: bgColor,
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  // Always wrap with gradient border
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "slideUpFromBottom 0.15s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        transformOrigin: "bottom",
      }}
    >
      <style>
        {`
          @keyframes slideUpFromBottom {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div style={gradientBorder}>
        {isGenerating ? generatingContent : content}
      </div>
      
      {/* Close Button - with gradient border */}
      <div style={closeButtonGradientBorder}>
        <div 
          style={closeButtonInnerStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = euiTheme?.colors?.backgroundBaseSubdued || (isDarkMode ? '#25262E' : '#F5F7FA');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = bgColor;
          }}
        >
          <EuiIcon type="cross" size="m" color="subdued" />
        </div>
      </div>
    </div>
  );
};

