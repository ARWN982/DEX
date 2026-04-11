import { useEuiTheme } from '@elastic/eui';
import { CaretDown, Plus } from 'phosphor-react';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVersionStore } from '../../store/useVersionStore';
import { getToolbarColors, dtRadius } from '../../styles/designToolsTokens';

interface VersionSwitcherProps {
  onCreateVersion?: () => void;
}

export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  onCreateVersion
}) => {
  const { colorMode } = useAppStore();
  const { 
    versions, 
    currentVersion, 
    isLoading, 
    loadVersions, 
    setActiveVersion,
    getCurrentVersion 
  } = useVersionStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const { euiTheme } = useEuiTheme();
  const colors = getToolbarColors(colorMode);

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, []);

  const currentVersionObj = getCurrentVersion();

  const handleVersionSelect = async (versionId: string) => {
    await setActiveVersion(versionId);
    setIsOpen(false);
  };

  const handleCreateVersion = () => {
    setIsOpen(false);
    onCreateVersion?.();
  };

  if (isLoading) {
    return (
      <div style={{
        padding: `${euiTheme.size.s} ${euiTheme.size.m}`,
        borderRadius: dtRadius.panel,
        backgroundColor: colors.secondary,
        color: colors.textSecondary,
        fontSize: '11px',
      }}>
        Loading...
      </div>
    );
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: euiTheme.size.s,
    padding: `${euiTheme.size.s} ${euiTheme.size.m}`,
    borderRadius: dtRadius.panel,
    border: 'none',
    backgroundColor: colors.secondary,
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    outline: 'none',
    minWidth: '120px',
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: colors.tertiary,
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: euiTheme.size.xs,
    backgroundColor: colors.primary,
    border: `1px solid ${colors.border}`,
    borderRadius: dtRadius.large,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    minWidth: '200px',
    overflow: 'hidden',
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${euiTheme.size.m} ${euiTheme.size.base}`,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: '11px',
    width: '100%',
    textAlign: 'left',
    transition: 'background-color 0.2s ease',
  };

  const menuItemHoverStyle: React.CSSProperties = {
    backgroundColor: colors.buttonHover,
  };

  const createButtonStyle: React.CSSProperties = {
    ...menuItemStyle,
    color: colors.accent,
    borderTop: `1px solid ${colors.border}`,
    fontWeight: '500',
  };

  const activeIndicatorStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: colors.accent,
  };

  return (
    <div style={dropdownStyle}>
      <button
        style={isOpen ? buttonHoverStyle : buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          if (!isOpen) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            Object.assign(e.currentTarget.style, buttonStyle);
          }
        }}
      >
        <span>{currentVersionObj?.name || `Version ${currentVersion}`}</span>
        <CaretDown 
          size={14} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div style={menuStyle}>
            {versions.map((version) => (
              <button
                key={version.id}
                style={menuItemStyle}
                onClick={() => handleVersionSelect(version.id)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, menuItemHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, menuItemStyle);
                }}
              >
                <div>
                  <div style={{ fontWeight: version.isActive ? '600' : '400' }}>
                    {version.name}
                  </div>
                  {version.description && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: colors.textSecondary,
                      marginTop: '2px' 
                    }}>
                      {version.description}
                    </div>
                  )}
                </div>
                {version.isActive && <div style={activeIndicatorStyle} />}
              </button>
            ))}
            
            {/* Create new version button - only in full app, not in published output */}
            {onCreateVersion && (
              <button
                style={createButtonStyle}
                onClick={handleCreateVersion}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, {
                    ...createButtonStyle,
                    backgroundColor: colors.buttonHover,
                  });
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, createButtonStyle);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: euiTheme.size.s }}>
                  <Plus size={16} />
                  <span>Create New Version</span>
                </div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};