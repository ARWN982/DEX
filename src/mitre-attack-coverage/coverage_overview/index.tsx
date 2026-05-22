/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import SecurityHeader from '../../public/pages/detection-rules/v1.0/components/SecurityHeader';
import SecuritySideNav from '../../public/pages/detection-rules/v1.0/components/SecuritySideNav';
import RulesSecondaryNav from '../../public/pages/detection-rules/v1.0/components/RulesSecondaryNav';
import { CoverageOverviewDashboardContextProvider } from './coverage_overview_dashboard_context';
import { CoverageOverviewDashboard } from './coverage_overview_dashboard';

export const CoverageOverviewPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
    <SecurityHeader onMenuClick={() => {}} />
    <SecuritySideNav />

    <div
      style={{
        backgroundColor: '#F6F9FC',
        height: 'calc(100vh - 56px)',
        marginTop: 48,
        marginLeft: 80,
        padding: 8,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ flex: 1, minHeight: 0 }}>

        {/* Secondary navigation */}
        <EuiFlexItem grow={false} style={{ height: '100%' }}>
          <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
            <RulesSecondaryNav />
          </EuiPanel>
        </EuiFlexItem>

        {/* Main content */}
        <EuiFlexItem style={{ height: '100%', minWidth: 0, overflow: 'hidden' }}>
          <EuiPanel
            paddingSize="none"
            hasShadow
            style={{ borderRadius: 8, height: '100%', overflowY: 'auto', overflowX: 'hidden', background: 'white' }}
          >
            <div style={{ padding: '24px', minHeight: '100%' }}>
              <CoverageOverviewDashboardContextProvider>
                <CoverageOverviewDashboard />
              </CoverageOverviewDashboardContextProvider>
            </div>
          </EuiPanel>
        </EuiFlexItem>

      </EuiFlexGroup>
    </div>
  </div>
);
