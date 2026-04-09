import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVersionStore, Version } from '../public/store/useVersionStore';

vi.mock('../public/utils/pageUtils', () => ({
  getCurrentPage: () => 'test-project',
}));

vi.mock('../public/utils/componentLoader', () => ({
  invalidateVersionCacheForPage: vi.fn(),
}));

function makeVersions(...ids: string[]): Version[] {
  return ids.map((id, i) => ({
    id,
    name: `Version ${id}`,
    createdAt: new Date().toISOString(),
    isActive: i === ids.length - 1,
  }));
}

function seedStore(versionIds: string[], currentVersion?: string) {
  const versions = makeVersions(...versionIds);
  useVersionStore.setState({
    versions,
    currentVersion: currentVersion ?? versionIds[versionIds.length - 1] ?? '1.0',
    isLoading: false,
  });
}

describe('useVersionStore', () => {
  beforeEach(() => {
    useVersionStore.setState({
      versions: [],
      currentVersion: '1.0',
      isLoading: false,
    });
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentVersion', () => {
    it('returns undefined when no versions are loaded', () => {
      expect(useVersionStore.getState().getCurrentVersion()).toBeUndefined();
    });

    it('returns the version matching currentVersion', () => {
      seedStore(['1.0', '1.1', '1.2'], '1.1');
      const current = useVersionStore.getState().getCurrentVersion();
      expect(current).toBeDefined();
      expect(current!.id).toBe('1.1');
    });
  });

  describe('loadVersions', () => {
    it('loads versions from the API on first load', async () => {
      const mockVersions = makeVersions('1.0', '1.1');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ versions: mockVersions, currentVersion: '1.1' }),
      });

      await useVersionStore.getState().loadVersions();

      const state = useVersionStore.getState();
      expect(state.versions).toHaveLength(2);
      expect(state.currentVersion).toBe('1.1');
      expect(state.isLoading).toBe(false);
    });

    it('preserves currentVersion on subsequent loads', async () => {
      seedStore(['1.0', '1.1'], '1.0');

      const mockVersions = makeVersions('1.0', '1.1', '1.2');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ versions: mockVersions, currentVersion: '1.2' }),
      });

      await useVersionStore.getState().loadVersions();

      const state = useVersionStore.getState();
      expect(state.versions).toHaveLength(3);
      // Should keep '1.0' from before, not switch to '1.2' from the API
      expect(state.currentVersion).toBe('1.0');
    });

    it('sets isLoading false on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      await useVersionStore.getState().loadVersions();

      expect(useVersionStore.getState().isLoading).toBe(false);
    });
  });

  describe('setActiveVersion', () => {
    it('updates currentVersion and marks only that version active', async () => {
      seedStore(['1.0', '1.1', '1.2'], '1.2');

      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await useVersionStore.getState().setActiveVersion('1.0');

      const state = useVersionStore.getState();
      expect(state.currentVersion).toBe('1.0');
      expect(state.versions.find((v) => v.id === '1.0')!.isActive).toBe(true);
      expect(state.versions.find((v) => v.id === '1.1')!.isActive).toBe(false);
      expect(state.versions.find((v) => v.id === '1.2')!.isActive).toBe(false);
    });

    it('does not update state if API call fails', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      await useVersionStore.getState().setActiveVersion('1.0');

      expect(useVersionStore.getState().currentVersion).toBe('1.1');
    });
  });

  describe('createVersion', () => {
    it('sends the correct payload to the API', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      const newVersion: Version = {
        id: '1.2',
        name: 'Version 1.2',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newVersion,
      });

      await useVersionStore.getState().createVersion({
        description: 'Test version',
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: '1.2',
          baseVersionId: '1.1',
          description: 'Test version',
          page: 'test-project',
          copyComments: false,
        }),
      });
    });

    it('uses the server-returned id, not the client suggestion', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      const serverVersion: Version = {
        id: '1.3',
        name: 'Version 1.3',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => serverVersion,
      });

      const returnedId = await useVersionStore.getState().createVersion();

      expect(returnedId).toBe('1.3');
      expect(useVersionStore.getState().currentVersion).toBe('1.3');
    });

    it('marks all existing versions inactive and the new one active', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      const newVersion: Version = {
        id: '1.2',
        name: 'Version 1.2',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newVersion,
      });

      await useVersionStore.getState().createVersion();

      const state = useVersionStore.getState();
      const activeVersions = state.versions.filter((v) => v.isActive);
      expect(activeVersions).toHaveLength(1);
      expect(activeVersions[0].id).toBe('1.2');
    });

    it('sends null baseVersionId when starting from scratch', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      const newVersion: Version = {
        id: '1.2',
        name: 'Version 1.2',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newVersion,
      });

      await useVersionStore.getState().createVersion({ startFromScratch: true });

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.baseVersionId).toBeNull();
      expect(body.copyComments).toBe(false);
    });

    it('sends major version id when isMajorVersion is true', async () => {
      seedStore(['1.0', '1.1'], '1.1');

      const newVersion: Version = {
        id: '2.0',
        name: 'Version 2.0',
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newVersion,
      });

      await useVersionStore.getState().createVersion({ isMajorVersion: true });

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(body.versionId).toBe('2.0');
    });

    it('throws when API returns an error', async () => {
      seedStore(['1.0'], '1.0');

      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      await expect(
        useVersionStore.getState().createVersion()
      ).rejects.toThrow('Failed to create version');
    });
  });
});
