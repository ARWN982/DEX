/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiPanel } from '@elastic/eui';
import SecurityHeader from '../../public/pages/detection-rules/v1.0/components/SecurityHeader';
import SecuritySideNav from '../../public/pages/detection-rules/v1.0/components/SecuritySideNav';
import RulesSecondaryNav from '../../public/pages/detection-rules/v1.0/components/RulesSecondaryNav';
import { CoverageOverviewDashboardContextProvider } from './coverage_overview_dashboard_context';
import { CoverageOverviewDashboard } from './coverage_overview_dashboard';

export const CoverageOverviewPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
    <SecurityHeader onMenuClick={() => {}} />
    <SecuritySideNav />

    {/* Gray outer wrapper — explicit height, no overflow */}
    <div
      style={{
        backgroundColor: '#F6F9FC',
        position: 'absolute',
        top: 48,
        left: 80,
        right: 0,
        bottom: 0,
        padding: 8,
        overflow: 'hidden',
      }}
    >
      {/* Row: secondary nav + main panel */}
      <div style={{ display: 'flex', height: '100%', gap: 8 }}>

        {/* Secondary nav */}
        <div style={{ flexShrink: 0, height: '100%' }}>
          <EuiPanel
            paddingSize="none"
            hasShadow
            style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}
          >
            <RulesSecondaryNav />
          </EuiPanel>
        </div>

        {/* Main content — fills remaining width */}
        <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
          <EuiPanel
            paddingSize="none"
            hasShadow
            style={{
              borderRadius: 8,
              height: '100%',
              overflow: 'hidden',   /* keeps border-radius clip on content edges */
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            {/* Inner padding wrapper — passes flex height down */}
            <div
              style={{
                padding: '24px',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CoverageOverviewDashboardContextProvider>
                <CoverageOverviewDashboard />
              </CoverageOverviewDashboardContextProvider>
            </div>
          </EuiPanel>
        </div>

      </div>
    </div>
  </div>
);
