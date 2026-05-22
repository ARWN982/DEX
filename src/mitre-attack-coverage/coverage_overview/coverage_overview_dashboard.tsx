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
     * Column flex that fills the parent (which is also a flex column).
     * Header section: shrinks to content, never scrolls, always visible.
     * Grid section:   fills remaining height, scrolls independently in both axes.
     */
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Fixed header: title + filters — always visible, constrained to panel width ── */}
      <div style={{ flexShrink: 0, overflow: 'hidden' }}>
        <CoverageOverviewHeader />
        <CoverageOverviewFiltersPanel />
        <EuiSpacer size="m" />
      </div>

      {/* ── Independently scrollable tactics grid ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',          /* scrolls in BOTH directions */
          paddingBottom: 16,
        }}
      >
        <EuiFlexGroup
          gutterSize="m"
          wrap={false}
          responsive={false}
          style={{ width: 'max-content', alignItems: 'flex-start' }}
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
