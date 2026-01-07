import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVersionStore } from '../../store/useVersionStore';
import { getCurrentPage } from '../../utils/pageUtils';
import { JobStoriesTable, JobStory } from './JobStoriesTable';

interface JobStoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobStoriesDrawer: React.FC<JobStoriesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  console.log('JobStoriesDrawer render - isOpen:', isOpen);
  const { colorMode } = useAppStore();
  const { currentVersion } = useVersionStore();
  const [jobStories, setJobStories] = useState<JobStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load job stories when drawer opens or version changes
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

  const handleAddNewStory = () => {
    const newStory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      jobStory: "",
      acceptanceCriteria: "",
      implementation: "Pending" as const,
    };
    handleStoriesChange([...jobStories, newStory]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Simple overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
        }}
        onClick={onClose}
      />
      
      {/* Simple drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '840px',
          height: '100vh',
          backgroundColor: 'white',
          border: '3px solid red',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #d1d5db' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#000' }}>
                Job Stories Tracking
            </h2>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280' }}>
                Version {currentVersion}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ height: '32px', width: '32px', padding: '0', color: '#000', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
              ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: '1', padding: '24px', overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', color: '#6b7280' }}>
                Loading job stories...
            </div>
          ) : (
            <>
              <div className="tw-mb-4">
                <button
                  onClick={handleAddNewStory}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: 'black',
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
