/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import { CoverageOverviewLink, HeaderPage } from '../shims/page_components';

import * as i18n from './translations';
import { CoverageOverviewTacticPanel } from './tactic_panel';
import { CoverageOverviewMitreTechniquePanelPopover } from './technique_panel_popover';
import { CoverageOverviewFiltersPanel } from './filters_panel';
import { useCoverageOverviewDashboardContext } from './coverage_overview_dashboard_context';

const CoverageOverviewHeaderComponent = () => (
  <HeaderPage
    title={i18n.COVERAGE_OVERVIEW_DASHBOARD_TITLE}
    subtitle={
      <EuiText color="subdued" size="s">
        <span>{i18n.CoverageOverviewDashboardInformation}</span>{' '}
        <CoverageOverviewLink>Learn more</CoverageOverviewLink>
      </EuiText>
    }
  />
);

const CoverageOverviewHeader = React.memo(CoverageOverviewHeaderComponent);

const CoverageOverviewDashboardComponent = () => {
  const {
    state: { data },
  } = useCoverageOverviewDashboardContext();

  return (
    /*
     * Outer wrapper: column flex that fills the parent's height.
     * The parent (from index.tsx) is `overflowY: auto`, so the sticky
     * header sticks within that scroll container.
     */
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Sticky header: title + filter bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'white',
          paddingBottom: 8,
        }}
      >
        <CoverageOverviewHeader />
        <CoverageOverviewFiltersPanel />
        <EuiSpacer size="m" />
      </div>

      {/* ── Horizontally scrollable tactics grid ── */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'visible',
          paddingBottom: 24,
          /* Give the scrollbar some breathing room */
          paddingRight: 4,
        }}
      >
        <EuiFlexGroup
          gutterSize="m"
          wrap={false}
          responsive={false}
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          {data?.mitreTactics.map((tactic) => (
            <EuiFlexGroup
              data-test-subj={`coverageOverviewTacticGroup-${tactic.id}`}
              direction="column"
              key={tactic.id}
              gutterSize="s"
              style={{ flexShrink: 0 }}
            >
              <EuiFlexItem grow={false}>
                <CoverageOverviewTacticPanel tactic={tactic} />
              </EuiFlexItem>

              {tactic.techniques.map((technique, techniqueKey) => (
                <EuiFlexItem grow={false} key={`${technique.id}-${techniqueKey}`}>
                  <CoverageOverviewMitreTechniquePanelPopover technique={technique} />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          ))}
        </EuiFlexGroup>
      </div>

    </div>
  );
};

export const CoverageOverviewDashboard = CoverageOverviewDashboardComponent;
