/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  CoverageOverviewFilter,
  CoverageOverviewRuleActivity,
  CoverageOverviewRuleSource,
} from '../shims/api_types';
import type { CoverageOverviewDashboard } from '../model/coverage_overview/dashboard';
import { DEFAULT_MITRE_VERSION_ID } from '../data/versions/registry';

export interface CoverageOverviewDashboardState {
  showExpandedCells: boolean;
  filter: CoverageOverviewFilter;
  isLoading: boolean;
  data: CoverageOverviewDashboard | undefined;
  selectedMitreVersionId: string;
}

// Action type names
export const SET_SHOW_EXPANDED_CELLS = 'setShowExpandedCells' as const;
export const SET_RULE_ACTIVITY_FILTER = 'setRuleActivityFilter' as const;
export const SET_RULE_SOURCE_FILTER = 'setRuleSourceFilter' as const;
export const SET_RULE_SEARCH_FILTER = 'setRuleSearchFilter' as const;
export const SET_MITRE_VERSION = 'setMitreVersion' as const;

export type Action =
  | { type: typeof SET_SHOW_EXPANDED_CELLS; value: boolean }
  | { type: typeof SET_RULE_ACTIVITY_FILTER; value: CoverageOverviewRuleActivity[] }
  | { type: typeof SET_RULE_SOURCE_FILTER; value: CoverageOverviewRuleSource[] }
  | { type: typeof SET_RULE_SEARCH_FILTER; value: string }
  | { type: typeof SET_MITRE_VERSION; value: string };

export const createCoverageOverviewDashboardReducer =
  () =>
  (state: CoverageOverviewDashboardState, action: Action): CoverageOverviewDashboardState => {
    switch (action.type) {
      case SET_SHOW_EXPANDED_CELLS: {
        const { value } = action;
        return { ...state, showExpandedCells: value };
      }
      case SET_RULE_ACTIVITY_FILTER: {
        const { value } = action;
        const updatedFilter = { ...state.filter, activity: value.length !== 0 ? value : undefined };
        return { ...state, filter: updatedFilter };
      }
      case SET_RULE_SOURCE_FILTER: {
        const { value } = action;
        const updatedFilter = { ...state.filter, source: value.length !== 0 ? value : undefined };
        return { ...state, filter: updatedFilter };
      }
      case SET_RULE_SEARCH_FILTER: {
        const { value } = action;
        const updatedFilter = {
          ...state.filter,
          search_term: value.length !== 0 ? value : undefined,
        };
        return { ...state, filter: updatedFilter };
      }
      case SET_MITRE_VERSION: {
        return { ...state, selectedMitreVersionId: action.value };
      }
      default:
        return state;
    }
  };
