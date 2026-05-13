import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EuiProvider } from '@elastic/eui';
import { EmptyState } from '../public/components/shared/EmptyState';
import { useAppStore } from '../public/store/useAppStore';
import { useVersionStore } from '../public/store/useVersionStore';

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

function renderEmpty(pageName: string, versionId: string) {
  useVersionStore.setState({ currentVersion: versionId });
  return render(
    <EuiProvider colorMode="light">
      <EmptyState pageName={pageName} versionId={versionId} />
    </EuiProvider>
  );
}

describe('EmptyState', () => {
  beforeEach(() => {
    useAppStore.setState({ colorMode: 'light' });
    vi.clearAllMocks();
  });

  it('maintains the isEmptyState static property', () => {
    expect(EmptyState.isEmptyState).toBe(true);
  });

  it('shows version pill and welcome headline', () => {
    renderEmpty('my-project', '2.1');

    expect(screen.getByText('Version 2.1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Your canvas is ready/i })).toBeInTheDocument();
    expect(screen.getByText(/^Edit$/)).toBeInTheDocument();
    expect(screen.getByText(/or ask your agent/i)).toBeInTheDocument();
  });

  it('renders for pages with leading underscores', () => {
    // The display name itself comes from the server-side metadata
    // (about.md → /api/project-metadata), not from a client-side
    // slug formatter, so we just verify the version pill renders
    // and no error is thrown for a slug that starts with `_`.
    renderEmpty('_30-april', '1.0');

    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
  });

  it('shows the correct file path', () => {
    renderEmpty('my-project', '1.3');

    expect(
      screen.getByText('src/public/pages/my-project/v1.3/index.tsx')
    ).toBeInTheDocument();
  });

  it('copies the file path when the copy button is clicked', async () => {
    renderEmpty('my-project', '1.3');

    const btn = screen.getByRole('button', { name: /Copy file path for editing/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'src/public/pages/my-project/v1.3/index.tsx'
      );
    });
  });
});
