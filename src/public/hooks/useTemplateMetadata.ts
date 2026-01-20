import { useState, useEffect } from 'react';

export interface TemplateMetadata {
  templateName: string;
  name?: string; // Optional display name
  thumbnail?: {
    filename: string;
    createdAt: string;
    url: string;
  };
}

export const useTemplateMetadata = (templateName: string | null) => {
  const [metadata, setMetadata] = useState<TemplateMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateName) {
      setMetadata(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/template-metadata/${templateName}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching template metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        // Set fallback metadata
        setMetadata({
          templateName,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [templateName]);

  // Helper function to get display name
  const getDisplayName = (): string => {
    if (!metadata) return '';
    
    // If name is explicitly set in metadata, use it
    if (metadata.name) {
      return metadata.name;
    }
    
    // Otherwise, derive from templateName (capitalize first letter, convert kebab-case to title case)
    return metadata.templateName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return { metadata, loading, error, displayName: getDisplayName() };
};
