/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { CoverageOverviewLink } from '../shims/page_components';

import * as i18n from './translations';
import { CoverageOverviewTacticPanel } from './tactic_panel';
import { CoverageOverviewMitreTechniquePanelPopover } from './technique_panel_popover';
import { CoverageOverviewFiltersPanel } from './filters_panel';
import { useCoverageOverviewDashboardContext } from './coverage_overview_dashboard_context';

// ─── Available ATT&CK versions ────────────────────────────────────────────────
const MITRE_VERSIONS = [
  { id: 'v18.1', label: 'ATT&CK v18.1', isLatest: true },
  { id: 'v17.0', label: 'ATT&CK v17.0', isLatest: false },
  { id: 'v16.1', label: 'ATT&CK v16.1', isLatest: false },
  { id: 'v15.1', label: 'ATT&CK v15.1', isLatest: false },
  { id: 'v14.1', label: 'ATT&CK v14.1', isLatest: false },
];

// ─── Version badge ─────────────────────────────────────────────────────────────
const VersionBadge: React.FC<{ version: string }> = ({ version }) => (
  <EuiBadge
    color="hollow"
    style={{ fontSize: 11, fontWeight: 500, verticalAlign: 'middle', marginLeft: 6, marginBottom: 2 }}
  >
    {version}
  </EuiBadge>
);

// ─── Configuration popover ────────────────────────────────────────────────────
const ConfigurationButton: React.FC<{
  selectedVersion: string;
  onSelect: (v: string) => void;
}> = ({ selectedVersion, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downRight"
      panelPaddingSize="m"
      button={
        <EuiButtonEmpty
          iconType="gear"
          iconSide="left"
          size="s"
          color="primary"
          onClick={() => setIsOpen((v) => !v)}
        >
          Configuration
        </EuiButtonEmpty>
      }
    >
      <div style={{ minWidth: 240 }}>
        <EuiText size="s" style={{ fontWeight: 600, marginBottom: 4 }}>
          MITRE ATT&amp;CK® framework version
        </EuiText>
        <EuiText size="xs" color="subdued" style={{ marginBottom: 12 }}>
          Select which version to apply across Elastic Security detection rules.
        </EuiText>
        <EuiHorizontalRule margin="s" />
        <EuiListGroup flush gutterSize="none">
          {MITRE_VERSIONS.map((v) => (
            <EuiListGroupItem
              key={v.id}
              label={
                <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                  <EuiFlexItem>{v.label}</EuiFlexItem>
                  {v.isLatest && (
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="success" style={{ fontSize: 10 }}>Latest</EuiBadge>
                    </EuiFlexItem>
                  )}
                  {selectedVersion === v.id && (
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="primary" style={{ fontSize: 10 }}>Active</EuiBadge>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              }
              size="s"
              onClick={() => { onSelect(v.id); setIsOpen(false); }}
              style={{ borderRadius: 4 }}
            />
          ))}
        </EuiListGroup>
      </div>
    </EuiPopover>
  );
};

// ─── Dashboard component ──────────────────────────────────────────────────────
const CoverageOverviewDashboardComponent = () => {
  const {
    state: { data },
  } = useCoverageOverviewDashboardContext();

  const [selectedVersion, setSelectedVersion] = useState('v18.1');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── SECTION A: Header — always visible ── */}
      <div style={{ flexShrink: 0, minWidth: 0 }}>

        {/* Title row */}
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" gutterSize="none" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiTitle size="l">
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                    {i18n.COVERAGE_OVERVIEW_DASHBOARD_TITLE}
                  </h1>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <VersionBadge version={selectedVersion} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ConfigurationButton
              selectedVersion={selectedVersion}
              onSelect={setSelectedVersion}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xs" />
        <EuiText color="subdued" size="s">
          <span>{i18n.CoverageOverviewDashboardInformation}</span>{' '}
          <CoverageOverviewLink>Learn more</CoverageOverviewLink>
        </EuiText>

        <EuiSpacer size="m" />
        <CoverageOverviewFiltersPanel />
        <EuiSpacer size="m" />
      </div>

      {/* ── SECTION B: Grid — scrolls in both axes ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        <EuiFlexGroup
          gutterSize="m"
          wrap={false}
          responsive={false}
          style={{
            width: 'max-content',
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
