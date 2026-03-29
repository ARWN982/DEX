import { create } from 'zustand';
import { getCurrentPage } from '../utils/pageUtils';
import { invalidateVersionCacheForPage } from '../utils/componentLoader';

const isPublishMode = process.env.VIBE_PUBLISH_MODE === 'true';

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
  copyComments?: boolean; // Default: false — only relevant when not starting from scratch
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

function getPublishVersions(): Version[] {
  try {
    const versionIds: string[] = JSON.parse(process.env.PUBLISH_VERSIONS || '[]');
    return versionIds.map((id, i) => ({
      id,
      name: `Version ${id}`,
      description: '',
      createdAt: new Date().toISOString(),
      basedOn: null,
      isActive: i === versionIds.length - 1,
    }));
  } catch {
    return [];
  }
}

function getHighestVersion(versions: Version[]): string {
  if (versions.length === 0) return '1.0';
  return versions
    .map(v => v.id)
    .sort((a, b) => {
      const [aMaj, aMin] = a.split('.').map(Number);
      const [bMaj, bMin] = b.split('.').map(Number);
      return aMaj !== bMaj ? bMaj - aMaj : bMin - aMin;
    })[0];
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  // Initial state
  versions: [],
  currentVersion: '1.0',
  isLoading: false,

  loadVersions: async () => {
    if (isPublishMode) {
      const versions = getPublishVersions();
      const latestVersion = versions.length > 0 ? versions[versions.length - 1].id : '1.0';
      set({ versions, currentVersion: latestVersion, isLoading: false });
      return;
    }

    const isFirstLoad = get().versions.length === 0;
    set({ isLoading: true });
    try {
      const currentPage = getCurrentPage();
      const response = await fetch(`/api/versions?page=${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        set({ 
          versions: data.versions,
          currentVersion: isFirstLoad
            ? (data.currentVersion || '1.0')
            : get().currentVersion,
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

  setActiveVersion: async (versionId: string) => {
    if (isPublishMode) {
      set({ currentVersion: versionId });
      const { versions } = get();
      set({ versions: versions.map(v => ({ ...v, isActive: v.id === versionId })) });
      return;
    }

    try {
      const currentPage = getCurrentPage();
      const response = await fetch('/api/versions/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, page: currentPage }),
      });

      if (response.ok) {
        set({ currentVersion: versionId });
        
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

  createVersion: async (options: CreateVersionOptions = {}) => {
    if (isPublishMode) {
      throw new Error('Cannot create versions in publish mode');
    }

    const { 
      isMajorVersion = false, 
      baseVersionId, 
      startFromScratch = false,
      copyComments = false,
      description 
    } = options;

    try {
      const { currentVersion, versions } = get();
      const baseVersion = baseVersionId || currentVersion;
      
      const highest = getHighestVersion(versions);
      const [major, minor] = highest.split('.').map(Number);
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
          copyComments: startFromScratch ? false : copyComments,
        }),
      });

      if (response.ok) {
        const newVersion = await response.json();

        invalidateVersionCacheForPage(currentPage);

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

  getCurrentVersion: () => {
    const { versions, currentVersion } = get();
    return versions.find(v => v.id === currentVersion);
  },
}));