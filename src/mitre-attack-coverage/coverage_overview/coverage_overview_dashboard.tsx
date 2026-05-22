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
    /**
     * Two-section column layout that fills the parent's explicit height.
     *
     * SECTION A — Header (flex-shrink:0)
     *   Always visible. Constrained to panel width (overflow:hidden).
     *   Contains: title, subtitle, filter bar, legend.
     *
     * SECTION B — Grid (flex:1, min-height:0)
     *   Fills remaining height. Scrolls independently:
     *     - overflow:auto  →  scrollbar appears when content exceeds bounds
     *     - width:max-content on the inner EuiFlexGroup  →  horizontal scroll
     */
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── SECTION A: Header — always visible, never overflows ── */}
      <div style={{ flexShrink: 0, overflow: 'hidden', minWidth: 0 }}>
        <CoverageOverviewHeader />
        <CoverageOverviewFiltersPanel />
        <EuiSpacer size="m" />
      </div>

      {/* ── SECTION B: Grid — scrolls in both axes ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,       /* without this, flex children ignore overflow */
          overflow: 'auto',   /* scrollbar on BOTH axes when content overflows */
        }}
      >
        <EuiFlexGroup
          gutterSize="m"
          wrap={false}
          responsive={false}
          style={{
            width: 'max-content',     /* forces H-scroll when > parent width */
            alignItems: 'flex-start',
            paddingBottom: 16,
          }}
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

              {tactic.techniques.map((technique, idx) => (
                <EuiFlexItem grow={false} key={`${technique.id}-${idx}`}>
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
