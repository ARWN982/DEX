/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { invariant } from '../shims/common_utils';
import {
  BulkActionTypeEnum,
  CoverageOverviewRuleActivity,
  CoverageOverviewRuleSource,
} from '../shims/api_types';
import type { CoverageOverviewDashboardState } from './coverage_overview_dashboard_reducer';
import {
  SET_SHOW_EXPANDED_CELLS,
  SET_RULE_ACTIVITY_FILTER,
  SET_RULE_SOURCE_FILTER,
  SET_RULE_SEARCH_FILTER,
  SET_MITRE_VERSION,
  createCoverageOverviewDashboardReducer,
} from './coverage_overview_dashboard_reducer';
import { DEFAULT_MITRE_VERSION_ID } from '../data/versions/registry';
import { useFetchCoverageOverviewQuery } from '../shims/hooks';
import { useExecuteBulkAction } from '../shims/hooks';

export interface CoverageOverviewDashboardActions {
  refetch: () => void;
  setShowExpandedCells: (value: boolean) => void;
  setRuleActivityFilter: (value: CoverageOverviewRuleActivity[]) => void;
  setRuleSourceFilter: (value: CoverageOverviewRuleSource[]) => void;
  setRuleSearchFilter: (value: string) => void;
  setMitreVersion: (versionId: string) => void;
  enableAllDisabled: (ruleIds: string[]) => Promise<void>;
}

export interface CoverageOverviewDashboardContextType {
  state: CoverageOverviewDashboardState;
  actions: CoverageOverviewDashboardActions;
}

export const CoverageOverviewDashboardContext =
  createContext<CoverageOverviewDashboardContextType | null>(null);

interface CoverageOverviewDashboardContextProviderProps {
  children: React.ReactNode;
}

export const initialState: CoverageOverviewDashboardState = {
  showExpandedCells: false,
  filter: {
    activity: [CoverageOverviewRuleActivity.Enabled],
    source: [CoverageOverviewRuleSource.Prebuilt, CoverageOverviewRuleSource.Custom],
  },
  data: undefined,
  isLoading: false,
  selectedMitreVersionId: DEFAULT_MITRE_VERSION_ID,
};

export const CoverageOverviewDashboardContextProvider = ({
  children,
}: CoverageOverviewDashboardContextProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read initial version from URL ?mitreVersion=vX.Y
  const urlVersion = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('mitreVersion') ?? DEFAULT_MITRE_VERSION_ID;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [state, dispatch] = useReducer(
    createCoverageOverviewDashboardReducer(),
    { ...initialState, selectedMitreVersionId: urlVersion }
  );
  const { data, isLoading, refetch } = useFetchCoverageOverviewQuery(state.filter);
  const { executeBulkAction } = useExecuteBulkAction();

  useEffect(() => {
    refetch();
  }, [refetch, state.filter]);

  const setShowExpandedCells = useCallback(
    (value: boolean): void => {
      dispatch({
        type: SET_SHOW_EXPANDED_CELLS,
        value,
      });
    },
    [dispatch]
  );

  const setRuleActivityFilter = useCallback(
    (value: CoverageOverviewRuleActivity[]): void => {
      dispatch({
        type: SET_RULE_ACTIVITY_FILTER,
        value,
      });
    },
    [dispatch]
  );

  const setRuleSourceFilter = useCallback(
    (value: CoverageOverviewRuleSource[]): void => {
      dispatch({
        type: SET_RULE_SOURCE_FILTER,
        value,
      });
    },
    [dispatch]
  );

  const setRuleSearchFilter = useCallback(
    (value: string): void => {
      dispatch({
        type: SET_RULE_SEARCH_FILTER,
        value,
      });
    },
    [dispatch]
  );

  const setMitreVersion = useCallback(
    (versionId: string) => {
      dispatch({ type: SET_MITRE_VERSION, value: versionId });
      // Persist to URL so refresh keeps the selection
      const params = new URLSearchParams(location.search);
      params.set('mitreVersion', versionId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    },
    [dispatch, navigate, location]
  );

  const enableAllDisabled = useCallback(
    async (ruleIds: string[]) => {
      await executeBulkAction({ type: BulkActionTypeEnum.enable, ids: ruleIds });
    },
    [executeBulkAction]
  );

  const actions = useMemo(
    () => ({
      refetch,
      setShowExpandedCells,
      setRuleActivityFilter,
      setRuleSourceFilter,
      setRuleSearchFilter,
      setMitreVersion,
      enableAllDisabled,
    }),
    [
      refetch,
      setRuleActivityFilter,
      setRuleSearchFilter,
      setRuleSourceFilter,
      setShowExpandedCells,
      setMitreVersion,
      enableAllDisabled,
    ]
  );

  const providerValue = useMemo<CoverageOverviewDashboardContextType>(() => {
    return {
      state: { ...state, isLoading, data },
      actions,
    };
  }, [actions, data, isLoading, state]);

  return (
    <CoverageOverviewDashboardContext.Provider value={providerValue}>
      {children}
    </CoverageOverviewDashboardContext.Provider>
  );
};

export const useCoverageOverviewDashboardContext = (): CoverageOverviewDashboardContextType => {
  const dashboardContext = useContext(CoverageOverviewDashboardContext);
  invariant(
    dashboardContext,
    'useCoverageOverviewDashboardContext should be used inside CoverageOverviewDashboardContextProvider'
  );

  return dashboardContext;
};
