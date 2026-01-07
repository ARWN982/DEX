import { useState, useEffect } from 'react';

export interface ProjectMetadata {
  projectName: string;
  designer: string;
  pm: string;
  briefDescription: string;
  prdLink: string;
  githubIssueLink: string;
  breadcrumb: string;
  thumbnail?: {
    filename: string;
    version: string;
    createdAt: string;
    url: string;
  };
}

export const useProjectMetadata = (projectName: string | null) => {
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectName) {
      setMetadata(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/project-metadata/${projectName}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching project metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        // Set fallback metadata
        setMetadata({
          projectName,
          designer: '',
          pm: '',
          briefDescription: '',
          prdLink: '',
          githubIssueLink: '',
          breadcrumb: projectName,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [projectName]);

  return { metadata, loading, error };
};