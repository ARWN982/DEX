/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';

import { SecuritySolutionPageWrapper, SpyRoute } from '../shims/page_components';


import { CoverageOverviewDashboardContextProvider } from './coverage_overview_dashboard_context';
import { CoverageOverviewDashboard } from './coverage_overview_dashboard';
import { useKibana, useRouteBasedCpsPickerAccess, ProjectRoutingAccess } from '../shims/hooks';

export const CoverageOverviewPage = () => {
  const { application, cps } = useKibana().services;
  useRouteBasedCpsPickerAccess({ access: ProjectRoutingAccess.READONLY });

  return (
    <>
      <CoverageOverviewDashboardContextProvider>
        <SecuritySolutionPageWrapper data-test-subj="coverageOverviewPage">
          <CoverageOverviewDashboard />
        </SecuritySolutionPageWrapper>
      </CoverageOverviewDashboardContextProvider>
      <SpyRoute pageName={'coverage-overview'} />
    </>
  );
};
