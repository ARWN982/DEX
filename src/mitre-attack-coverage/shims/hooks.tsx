/**
 * STUB: replaces Kibana-specific hooks
 * STUB: useFetchCoverageOverviewQuery — returns mock data
 * STUB: useExecuteBulkAction — no-op
 * STUB: useUserPrivileges — grants all privileges
 * STUB: useKibana — returns minimal services shape
 * STUB: useRouteBasedCpsPickerAccess / ProjectRoutingAccess — no-op
 */
import { useState, useCallback } from 'react';
import type { CoverageOverviewFilter } from './api_types';
import type { CoverageOverviewDashboard } from '../model/coverage_overview/dashboard';

// ── useFetchCoverageOverviewQuery ─────────────────────────────────────────────
// STUB: returns pre-built mock dashboard via dynamic import of mock_data.ts
export function useFetchCoverageOverviewQuery(_filter: CoverageOverviewFilter) {
  // We import the mock builder lazily so callers get real data shapes.
  const [state, setState] = useState<{
    data: CoverageOverviewDashboard | undefined;
    isLoading: boolean;
  }>({ data: undefined, isLoading: true });

  // Run once on mount using a side-effect-free approach (useState initialiser)
  useState(() => {
    import('../mock_data').then(({ buildMockDashboard }) => {
      setState({ data: buildMockDashboard(), isLoading: false });
    });
  });

  const refetch = useCallback(() => {
    import('../mock_data').then(({ buildMockDashboard }) => {
      setState({ data: buildMockDashboard(), isLoading: false });
    });
  }, []);

  return { data: state.data, isLoading: state.isLoading, refetch };
}

// ── useExecuteBulkAction ──────────────────────────────────────────────────────
// STUB: no-op bulk action hook
export function useExecuteBulkAction() {
  const executeBulkAction = useCallback(async (_action: unknown) => {
    console.warn('[STUB] useExecuteBulkAction: no-op — wire up real API to enable/disable rules');
  }, []);
  return { executeBulkAction };
}

// ── useUserPrivileges ────────────────────────────────────────────────────────
// STUB: grants full edit access
export function useUserPrivileges() {
  return {
    rulesPrivileges: {
      enableDisable: { edit: true },
    },
  };
}

// ── useKibana ────────────────────────────────────────────────────────────────
// STUB: minimal services shell
export function useKibana() {
  return {
    services: {
      application: { navigateToUrl: (_url: string) => {} },
      cps: null,
    },
  };
}

// ── useRouteBasedCpsPickerAccess / ProjectRoutingAccess ──────────────────────
// STUB: no-op — CPS is Kibana's cross-project spaces feature
export enum ProjectRoutingAccess {
  READONLY = 'readonly',
  READWRITE = 'readwrite',
}
export function useRouteBasedCpsPickerAccess(_opts: unknown) {
  return null;
}

// ── RuleLink ──────────────────────────────────────────────────────────────────
// STUB: renders rule name as a link to /detection-rules/:id
import React from 'react';
import { EuiLink } from '@elastic/eui';
export const RuleLink: React.FC<{ id: string; name: string }> = ({ id, name }) => (
  <EuiLink href={`/detection-rules/${id}`}>{name}</EuiLink>
);
