import { X } from 'phosphor-react';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVersionStore } from '../../store/useVersionStore';
import { getCurrentPage } from '../../utils/pageUtils';
import { JobStoriesTable, JobStory } from './JobStoriesTable';

interface JobStoriesFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobStoriesFlyout: React.FC<JobStoriesFlyoutProps> = ({
  isOpen,
  onClose,
}) => {
  const { colorMode } = useAppStore();
  const { currentVersion } = useVersionStore();
  const [jobStories, setJobStories] = useState<JobStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load job stories when flyout opens or version changes
  useEffect(() => {
    if (isOpen) {
      loadJobStories();
    }
  }, [isOpen, currentVersion]);

  const loadJobStories = async () => {
    setIsLoading(true);
    try {
      const currentPage = getCurrentPage();
      console.log('Loading job stories for page', currentPage, 'version', currentVersion, 'from API...');
      const response = await fetch(`/api/job-stories?version=${currentVersion}&page=${currentPage}`);
      if (response.ok) {
        const stories = await response.json();
        console.log('Loaded', stories.length, 'job stories for version', currentVersion, ':', stories);
        setJobStories(stories);
      } else {
        console.error('Failed to load job stories. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading job stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoriesChange = async (updatedStories: JobStory[]) => {
    setJobStories(updatedStories);
    
    // Auto-save to version-specific file
    try {
      const currentPage = getCurrentPage();
      console.log('Saving', updatedStories.length, 'job stories for page', currentPage, 'version', currentVersion, 'to API...');
      const response = await fetch(`/api/job-stories?version=${currentVersion}&page=${currentPage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStories),
      });
      
      if (response.ok) {
        console.log('Successfully saved job stories for version', currentVersion);
      } else {
        console.error('Failed to save job stories. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error saving job stories:', error);
    }
  };

  // Only render when open to prevent shadow visibility issues
  if (!isOpen) {
    return null;
  }

  // Flyout styles based on the reference image
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    zIndex: 2000,
    opacity: isOpen ? 1 : 0,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    backdropFilter: 'blur(1px)',
  };

  const flyoutStyle: React.CSSProperties = {
    position: 'fixed',
    top: '16px',
    right: '16px',
    bottom: '16px',
    width: '840px',
    backgroundColor: colorMode === 'light' ? '#f8f9fa' : '#1a1a1a',
    borderRadius: '20px',
    boxShadow: colorMode === 'light' 
      ? '0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)'
      : '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    zIndex: 2001,
    display: 'flex',
    flexDirection: 'column',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 24px 16px 24px',
    borderBottom: `1px solid ${colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  };

  const placeholderStyle: React.CSSProperties = {
    color: colorMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '40px',
  };

  return (
    <>
      {/* Overlay */}
      <div 
        style={overlayStyle} 
        onClick={onClose}
        data-exclude-comments
      />

      {/* Flyout */}
      <div 
        style={flyoutStyle}
        data-exclude-comments
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Job Stories Tracking</h2>
            <div style={{ 
              fontSize: '12px', 
              color: colorMode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              marginTop: '2px' 
            }}>
              Version {currentVersion}
            </div>
          </div>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 
                colorMode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 
                colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {isLoading ? (
            <div style={placeholderStyle}>Loading job stories...</div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => {
                    const newStory = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      jobStory: "",
                      acceptanceCriteria: "",
                      implementation: "Pending" as const,
                    };
                    handleStoriesChange([...jobStories, newStory]);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${colorMode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                    backgroundColor: colorMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    color: colorMode === 'light' ? '#1a1a1a' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  + Add New Story
                </button>
              </div>
              <JobStoriesTable
                stories={jobStories}
                onStoriesChange={handleStoriesChange}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};