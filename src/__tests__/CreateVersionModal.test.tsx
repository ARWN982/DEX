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

  it('disables form controls while creating', async () => {
    const neverResolve = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => neverResolve);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: /Create version/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Major version')).toBeDisabled();
      expect(screen.getByLabelText('Start from scratch')).toBeDisabled();
      expect(screen.getByPlaceholderText(/Describe what's new/)).toBeDisabled();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('locks the version number during creation so it does not change', async () => {
    const createPromise = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => createPromise);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Version 1\.3/)).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Create version/i });
    fireEvent.click(createButton);

    // Simulate the store adding the new version (which would change nextVersionNumber without the lock)
    await act(async () => {
      const updatedVersions = makeVersions('1.0', '1.1', '1.2', '1.3');
      useVersionStore.setState({ versions: updatedVersions, currentVersion: '1.3' });
    });

    // The displayed version should still say 1.3, not 1.4
    expect(screen.getByText(/Version 1\.3/)).toBeInTheDocument();
    expect(screen.queryByText(/Version 1\.4/)).not.toBeInTheDocument();
  });

  it('shows "Creating" text in the button while creating', async () => {
    const neverResolve = new Promise<string>(() => {});
    const createVersionMock = vi.fn(() => neverResolve);
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    render(<CreateVersionModal isOpen={true} onClose={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: /Create version/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Creating/)).toBeInTheDocument();
    });
  });

  it('calls onClose after successful creation', async () => {
    const { getComponentFromRegistry } = await import('../public/utils/componentRegistry');
    (getComponentFromRegistry as ReturnType<typeof vi.fn>).mockReturnValue(() => null);

    const createVersionMock = vi.fn(() => Promise.resolve('1.3'));
    useVersionStore.setState({ createVersion: createVersionMock } as any);

    const onClose = vi.fn();
    render(<CreateVersionModal isOpen={true} onClose={onClose} />);

    const createButton = screen.getByRole('button', { name: /Create version/i });

    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
