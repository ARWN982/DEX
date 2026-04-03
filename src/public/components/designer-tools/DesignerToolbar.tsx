import { Cursor, ChatCircle, X } from 'phosphor-react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useVersionStore } from '../../store/useVersionStore';
import { getToolbarColors, createBoxShadow } from '../../styles/designToolsColors';
import { AboutFlyout, type ProjectMetadata } from './AboutFlyout';
import { CreateProjectModal } from './CreateProjectModal';
import { VersionSwitcher } from './VersionSwitcher';


interface DesignerToolbarProps {
  isCommentingEnabled: boolean;
  onToggleCommenting: () => void;
  onCreateVersion?: () => void;
  projectName?: string;
}

const isProduction = process.env.VIBE_DEPLOY_MODE === 'production';

export const DesignerToolbar: React.FC<DesignerToolbarProps> = ({
  isCommentingEnabled,
  onToggleCommenting,
  onCreateVersion,
  projectName,
}) => {
  const location = useLocation();
  const isTemplate = location.pathname.startsWith('/templates/');
  const templateName = isTemplate
    ? location.pathname.split('/').filter(Boolean)[1] || null
    : null;
  const [isVisible, setIsVisible] = useState(false);
  const [isAboutFlyoutOpen, setIsAboutFlyoutOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { colorMode } = useAppStore();
  const { currentVersion } = useVersionStore();
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding the toolbar for 2 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Hover zone that extends above the toolbar to prevent vibration
  const hoverZoneStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '200px',
    height: '80px', // Larger hover area
    zIndex: 1009,
    pointerEvents: 'auto',
  };

  // Get design tools colors
  const colors = getToolbarColors(colorMode);

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: isVisible ? '16px' : '-40px', // Show only 16px when not visible
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: colors.primary,
    borderRadius: '28px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: createBoxShadow(colors, 'medium'),
    transition: 'bottom 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
    zIndex: 1010,
    border: `1px solid ${colors.border}`,
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isActive ? colors.accent : 'transparent',
    color: isActive ? '#ffffff' : colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    outline: 'none',
  });

  // Re-fetch metadata when the flyout opens or the project changes
  useEffect(() => {
    if (projectName && isAboutFlyoutOpen) {
      loadProjectMetadata();
    }
  }, [projectName, isAboutFlyoutOpen]);

  const loadProjectMetadata = async () => {
    if (!projectName) return;
    
    try {
      const response = await fetch(`/api/project-metadata/${projectName}`);
      if (response.ok) {
        const metadata = await response.json();
        setProjectMetadata(metadata);
      }
    } catch (error) {
      console.error('Failed to load project metadata:', error);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleAboutClick = () => {
    setIsAboutFlyoutOpen(true);
  };

  const handleCursorClick = () => {
    if (isCommentingEnabled) {
      onToggleCommenting();
    }
  };

  const handleCommentClick = () => {
    if (!isCommentingEnabled) {
      onToggleCommenting();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render toolbar if dismissed
  if (isDismissed) {
    return (
      <AboutFlyout
        isOpen={isAboutFlyoutOpen}
        onClose={() => setIsAboutFlyoutOpen(false)}
        projectMetadata={projectMetadata}
        currentVersion={currentVersion}
        projectName={projectName}
      />
    );
  }

  return (
    <>
      <div
        style={hoverZoneStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-exclude-comments
      >
        <div style={toolbarStyle}>
          {/* Home Button */}
          <button
            style={{
              backgroundColor: colors.buttonHover,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: '16px',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginRight: '16px',
            }}
            onClick={handleHomeClick}
            title="Go to home page"
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = colors.accent;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
            }}
          >
            Home
          </button>

          {!isProduction && isTemplate && templateName && (
            <button
              style={{
                backgroundColor: colors.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                outline: 'none',
                marginRight: '16px',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setIsCreateProjectModalOpen(true)}
              title="Create a project from this template"
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.opacity = '1';
              }}
            >
              Use this template
            </button>
          )}

          {!isTemplate && (
            <>
              {/* About Button */}
              <button
                style={{
                  backgroundColor: colors.buttonHover,
                  color: colors.textPrimary,
                  border: 'none',
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  marginRight: '16px',
                }}
                onClick={handleAboutClick}
                title="About this project"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = colors.accent;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
                }}
              >
                About
              </button>

              {/* Version Switcher */}
              <div style={{ marginRight: '16px' }}>
                <VersionSwitcher onCreateVersion={onCreateVersion} />
              </div>

              {/* Divider */}
              <div style={{
                width: '1px',
                height: '32px',
                backgroundColor: colors.border,
                marginRight: '16px',
              }} />
            </>
          )}

          {/* Cursor Tool */}
          <button
            style={buttonStyle(!isCommentingEnabled)}
            onClick={handleCursorClick}
            title="Select tool"
            onMouseEnter={(e) => {
              if (isCommentingEnabled) {
                (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
              }
            }}
            onMouseLeave={(e) => {
              if (isCommentingEnabled) {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <Cursor size={20} weight="fill" style={{ pointerEvents: 'none' }} />
          </button>

          {/* Comment Tool - hidden on templates */}
          {!isTemplate && (
            <button
              style={buttonStyle(isCommentingEnabled)}
              onClick={handleCommentClick}
              title="Comment tool"
              onMouseEnter={(e) => {
                if (!isCommentingEnabled) {
                  (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCommentingEnabled) {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <ChatCircle size={20} weight="fill" style={{ pointerEvents: 'none' }} />
            </button>
          )}

          {/* Dismiss Button */}
          <button
            style={buttonStyle(false)}
            onClick={handleDismiss}
            title="Dismiss toolbar"
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = colors.buttonHover;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} weight="fill" style={{ pointerEvents: 'none' }} />
          </button>
        </div>
      </div>

      {/* About Flyout - moved outside container */}
      <AboutFlyout
        isOpen={isAboutFlyoutOpen}
        onClose={() => setIsAboutFlyoutOpen(false)}
        projectMetadata={projectMetadata}
        currentVersion={currentVersion}
        projectName={projectName}
      />

      {/* Create Project from Template Modal (hidden in production mode) */}
      {!isProduction && isTemplate && templateName && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onSuccess={() => {
            setIsCreateProjectModalOpen(false);
          }}
          templateName={templateName}
          defaultProjectName={templateName}
        />
      )}
    </>
  );
};