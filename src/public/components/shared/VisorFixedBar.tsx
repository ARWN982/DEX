import React, { useRef, useEffect, useState } from "react";
import { EuiIcon, useEuiTheme } from "@elastic/eui";

interface VisorFixedBarProps {
  onSubmit: (prompt: string, language: string, dataSource: string) => void;
  currentDataSource?: string;
}

export const VisorFixedBar: React.FC<VisorFixedBarProps> = ({ 
  onSubmit,
  currentDataSource = "logs-*"
}) => {
  const { euiTheme, colorMode } = useEuiTheme();
  const isDarkMode = colorMode === "DARK";
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (inputValue.trim()) {
        onSubmit(inputValue, selectedLanguage, selectedDataSource);
        setInputValue("");
      }
    }
  };

  // Gradient border style for Natural language mode
  const gradientBorder: React.CSSProperties | null = selectedLanguage === "Natural language" ? {
    background: isDarkMode
      ? "linear-gradient(104.14deg, #61A2FF 18.35%, #8A82E8 51.95%, #D846BB 88.68%, #FF27A5 112.9%)"
      : "linear-gradient(107.9deg, #0B64DD 21.85%, #FF27A5 98.82%)",
    borderRadius: "6px",
    padding: "1px",
    width: "600px",
    height: "32px",
  } : null;

  const innerContainerStyle: React.CSSProperties = {
    width: selectedLanguage === "Natural language" ? "100%" : "600px",
    height: selectedLanguage === "Natural language" ? "30px" : "32px",
    padding: "0",
    background: euiTheme.colors.emptyShade,
    border: selectedLanguage === "Natural language" ? "none" : `1px solid ${euiTheme.colors.borderBaseSubdued}`,
    borderRadius: selectedLanguage === "Natural language" ? "5px" : "6px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  };

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
            borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
            borderRadius: selectedLanguage === "KQL" ? "6px 0 0 6px" : "6px 0 0 6px",
            fontSize: "12px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            backgroundColor: "transparent",
            color: selectedLanguage === "Natural language" ? euiTheme.colors.primary : euiTheme.colors.text,
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
            color={selectedLanguage === "Natural language" ? euiTheme.colors.primary : undefined}
          />
        </button>
        {isLanguagePopoverOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              backgroundColor: euiTheme.colors.emptyShade,
              border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
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
                  color: euiTheme.colors.text,
                  backgroundColor: selectedLanguage === lang ? euiTheme.colors.backgroundBaseSubdued : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (selectedLanguage !== lang) {
                    e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
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
      
      {/* Data Source dropdown (only for KQL) */}
      {selectedLanguage === "KQL" && (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }} data-popover-container>
          <button
            onClick={() => setIsDataSourcePopoverOpen(!isDataSourcePopoverOpen)}
            style={{
              height: "100%",
              padding: "0 12px",
              border: "none",
              borderRight: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
              fontSize: "12px",
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              backgroundColor: "transparent",
              color: euiTheme.colors.text,
              outline: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {selectedDataSource}
            <EuiIcon type="arrowDown" size="s" />
          </button>
          {isDataSourcePopoverOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                backgroundColor: euiTheme.colors.emptyShade,
                border: `1px solid ${euiTheme.colors.borderBaseSubdued}`,
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
                    color: euiTheme.colors.text,
                    backgroundColor: selectedDataSource === source ? euiTheme.colors.backgroundBaseSubdued : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDataSource !== source) {
                      e.currentTarget.style.backgroundColor = euiTheme.colors.backgroundBaseSubdued;
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
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={selectedLanguage === "KQL" ? "Search" : "Ask about your data..."}
        style={{
          flex: 1,
          height: "100%",
          padding: "0 12px",
          border: "none",
          borderRadius: "0 6px 6px 0",
          fontSize: "13px",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          backgroundColor: "transparent",
          color: euiTheme.colors.text,
          outline: "none",
        }}
      />
    </div>
  );

  // Wrap with gradient border if Natural language is selected
  return gradientBorder ? (
    <div style={gradientBorder}>
      {content}
    </div>
  ) : content;
};

