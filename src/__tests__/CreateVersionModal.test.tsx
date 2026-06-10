import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateVersionModal } from '../public/components/designer-tools/CreateVersionModal';
import { useVersionStore, Version } from '../public/store/useVersionStore';

vi.mock('../public/utils/componentRegistry', () => ({
  getComponentFromRegistry: vi.fn(() => null),
}));

vi.mock('../public/utils/pageUtils', () => ({
  getCurrentPage: () => 'test-project',
}));

function makeVersions(...ids: string[]): Version[] {
  return ids.map((id, i) => ({
    id,
    name: `Version ${id}`,
    createdAt: new Date().toISOString(),
    isActive: i === ids.length - 1,
  }));
}

function seedStore(versionIds: string[]) {
  const versions = makeVersions(...versionIds);
  const currentId = versionIds[versionIds.length - 1] || '1.0';
  useVersionStore.setState({
    versions,
    currentVersion: currentId,
    isCreatingVersion: false,
    creatingVersionId: null,
    creationSteps: [],
    creationStepStatuses: [],
  });
}

describe('CreateVersionModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    seedStore(['1.0', '1.1', '1.2']);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateVersionModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('displays the correct next version number', () => {
    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Version 1\.3/)).toBeInTheDocument();
  });

  it('updates version preview when major version is toggled', async () => {
    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Version 1\.3/)).toBeInTheDocument();

    const majorCheckbox = screen.getByLabelText('Major version');
    fireEvent.click(majorCheckbox);

    expect(screen.getByText(/Version 2\.0/)).toBeInTheDocument();
  });

  it('shows "Based on" with the current version', () => {
    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('v1.2')).toBeInTheDocument();
  });

  it('closes immediately and sets store creation state on create', async () => {
    const neverResolve = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => neverResolve);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    const createButton = screen.getByRole('button', { name: /Create version/i });

    await act(async () => {
      fireEvent.click(createButton);
    });

    // Modal should close immediately
    expect(onClose).toHaveBeenCalled();

    // Store should reflect creation-in-progress
    const state = useVersionStore.getState();
    expect(state.isCreatingVersion).toBe(true);
    expect(state.creatingVersionId).toBe('1.3');
    expect(state.creationSteps).toHaveLength(3);
    expect(state.creationStepStatuses[0]).toBe('active');
    expect(state.creationStepStatuses[1]).toBe('pending');
    expect(state.creationStepStatuses[2]).toBe('pending');
  });

  it('populates step labels that include the version numbers', async () => {
    const neverResolve = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => neverResolve);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Create version/i }));

    const { creationSteps } = useVersionStore.getState();
    expect(creationSteps[0].activeLabel).toMatch(/Scaffolding v1\.3/);
    expect(creationSteps[1].activeLabel).toMatch(/Copying design from v1\.2/);
    expect(creationSteps[2].activeLabel).toMatch(/Registering version/);
  });

  it('advances steps through the store during background orchestration', async () => {
    const { getComponentFromRegistry } = await import('../public/utils/componentRegistry');
    (getComponentFromRegistry as ReturnType<typeof vi.fn>).mockReturnValue(() => null);

    const createVersionMock = vi.fn(() => Promise.resolve('1.3'));
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create version/i }));
    });

    // Step 1 should be active initially
    expect(useVersionStore.getState().creationStepStatuses[0]).toBe('active');

    // Advance past step 1 timer (1750ms)
    await act(async () => {
      vi.advanceTimersByTime(1800);
    });

    expect(useVersionStore.getState().creationStepStatuses[0]).toBe('complete');
    expect(useVersionStore.getState().creationStepStatuses[1]).toBe('active');

    // Advance past step 2 timer (3250ms total)
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(useVersionStore.getState().creationStepStatuses[1]).toBe('complete');
    expect(useVersionStore.getState().creationStepStatuses[2]).toBe('active');
  });

  it('finishes creation and clears store state after completion', async () => {
    const { getComponentFromRegistry } = await import('../public/utils/componentRegistry');
    (getComponentFromRegistry as ReturnType<typeof vi.fn>).mockReturnValue(() => null);

    const createVersionMock = vi.fn(() => Promise.resolve('1.3'));
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create version/i }));
    });

    // Advance through all timers (steps + final pause)
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      const state = useVersionStore.getState();
      expect(state.isCreatingVersion).toBe(false);
      expect(state.creatingVersionId).toBeNull();
    });
  });

  it('resets form state after clicking create', async () => {
    const neverResolve = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => neverResolve);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    const { rerender } = render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    // Toggle major version before creating
    fireEvent.click(screen.getByLabelText('Major version'));
    expect(screen.getByText(/Version 2\.0/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create version/i }));
    });

    // Re-render with isOpen true to simulate reopening
    rerender(<CreateVersionModal isOpen={true} onClose={onClose} />);

    // Form should be reset — showing 1.3 again (not 2.0)
    // Note: the store now has v2.0 being created, but the form resets
    expect(screen.getByText(/Version 1\.3/)).toBeInTheDocument();
  });
});
