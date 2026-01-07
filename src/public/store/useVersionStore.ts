import { create } from 'zustand';
import { getCurrentPage } from '../utils/pageUtils';

export interface Version {
  id: string; // "1.0", "1.1", "2.0"
  name: string; // "Version 1.0", "Version 1.1"
  description?: string;
  createdAt: string;
  basedOn?: string | null; // Version ID this was copied from, or null for "from scratch"
  isActive: boolean;
}

export interface CreateVersionOptions {
  isMajorVersion?: boolean; // Default: false
  baseVersionId?: string; // Default: current active version
  startFromScratch?: boolean; // Default: false
  description?: string;
}

interface VersionStore {
  // State
  versions: Version[];
  currentVersion: string;
  isLoading: boolean;

  // Actions
  loadVersions: () => Promise<void>;
  setActiveVersion: (versionId: string) => Promise<void>;
  createVersion: (options?: CreateVersionOptions) => Promise<string>;
  
  // Helpers
  getCurrentVersion: () => Version | undefined;
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  // Initial state
  versions: [],
  currentVersion: '1.0',
  isLoading: false,

  // Load versions from API
  loadVersions: async () => {
    set({ isLoading: true });
    try {
      const currentPage = getCurrentPage();
      const response = await fetch(`/api/versions?page=${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        set({ 
          versions: data.versions,
          currentVersion: data.currentVersion || '1.0',
          isLoading: false 
        });
      } else {
        console.error('Failed to load versions');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      set({ isLoading: false });
    }
  },

  // Switch to a different version
  setActiveVersion: async (versionId: string) => {
    try {
      const currentPage = getCurrentPage();
      const response = await fetch('/api/versions/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, page: currentPage }),
      });

      if (response.ok) {
        set({ currentVersion: versionId });
        
        // Update versions array to reflect new active version
        const { versions } = get();
        const updatedVersions = versions.map(v => ({
          ...v,
          isActive: v.id === versionId
        }));
        set({ versions: updatedVersions });
      } else {
        console.error('Failed to set active version');
      }
    } catch (error) {
      console.error('Error setting active version:', error);
    }
  },

  // Create a new version
  createVersion: async (options: CreateVersionOptions = {}) => {
    const { 
      isMajorVersion = false, 
      baseVersionId, 
      startFromScratch = false,
      description 
    } = options;

    try {
      const { currentVersion } = get();
      const baseVersion = baseVersionId || currentVersion;
      
      // Generate a suggested version ID, but let backend handle collisions
      const [major, minor] = currentVersion.split('.').map(Number);
      const suggestedVersionId = isMajorVersion ? `${major + 1}.0` : `${major}.${minor + 1}`;

      const currentPage = getCurrentPage();
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: suggestedVersionId,
          baseVersionId: startFromScratch ? null : baseVersion,
          description,
          page: currentPage,
        }),
      });

      if (response.ok) {
        const newVersion = await response.json();
        
        // Add new version to store and make it active
        const { versions } = get();
        const updatedVersions = versions.map(v => ({ ...v, isActive: false }));
        updatedVersions.push({ ...newVersion, isActive: true });
        
        set({ 
          versions: updatedVersions,
          currentVersion: newVersion.id 
        });

        return newVersion.id;
      } else {
        console.error('Failed to create version');
        throw new Error('Failed to create version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  },

  // Get current active version object
  getCurrentVersion: () => {
    const { versions, currentVersion } = get();
    return versions.find(v => v.id === currentVersion);
  },
}));