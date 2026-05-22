/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPopover,
  EuiRadioGroup,
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
import { MITRE_VERSION_REGISTRY, getMitreVersion } from '../data/versions/registry';
import { useVersionedTactics } from './use_versioned_tactics';

// ─── Configuration popover ────────────────────────────────────────────────────
const ConfigurationPopover: React.FC<{
  selectedVersionId: string;
  onSelect: (id: string) => void;
}> = ({ selectedVersionId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelection, setLocalSelection] = useState(selectedVersionId);

  const handleOpen = () => {
    setLocalSelection(selectedVersionId);
    setIsOpen(true);
  };

  const handleApply = () => {
    onSelect(localSelection);
    setIsOpen(false);
  };

  const radioOptions = MITRE_VERSION_REGISTRY.map(v => ({
    id: v.id,
    label: (
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false} style={{ minWidth: 120 }}>
          <EuiText size="s">{v.label}</EuiText>
        </EuiFlexItem>
        {v.isLatest && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="success" style={{ fontSize: 10 }}>Latest</EuiBadge>
          </EuiFlexItem>
        )}
        {selectedVersionId === v.id && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary" style={{ fontSize: 10 }}>Active</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    ) as unknown as string,
  }));

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downRight"
      panelPaddingSize="m"
      button={
        <EuiButtonEmpty iconType="gear" iconSide="left" size="s" color="primary" onClick={handleOpen}>
          Configuration
        </EuiButtonEmpty>
      }
    >
      <div style={{ minWidth: 300, maxWidth: 360 }}>
        <EuiText size="s" style={{ fontWeight: 600, marginBottom: 4 }}>
          MITRE ATT&amp;CK® framework version
        </EuiText>
        <EuiText size="xs" color="subdued" style={{ marginBottom: 12 }}>
          Select which version to apply across Elastic Security detection rules.
        </EuiText>
        <EuiHorizontalRule margin="s" />

        <EuiRadioGroup
          options={radioOptions}
          idSelected={localSelection}
          onChange={setLocalSelection}
          style={{ marginBottom: 16 }}
        />

        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" onClick={() => setIsOpen(false)}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              fill
              onClick={handleApply}
              isDisabled={localSelection === selectedVersionId}
            >
              Apply
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPopover>
  );
};

// ─── Dashboard component ──────────────────────────────────────────────────────
const CoverageOverviewDashboardComponent = () => {
  const {
    state: { data, selectedMitreVersionId },
    actions: { setMitreVersion },
  } = useCoverageOverviewDashboardContext();

  const selectedVersion = getMitreVersion(selectedMitreVersionId);
  const versionedTactics = useVersionedTactics(data, selectedVersion);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header — always visible ── */}
      <div style={{ flexShrink: 0, minWidth: 0 }}>

        {/* Title row */}
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false} wrap={false}>
              <EuiFlexItem grow={false}>
                <EuiTitle size="l">
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                    {i18n.COVERAGE_OVERVIEW_DASHBOARD_TITLE}
                  </h1>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge
                  color="hollow"
                  style={{ fontSize: 11, fontWeight: 500, verticalAlign: 'middle', marginLeft: 4 }}
                >
                  {selectedMitreVersionId}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ConfigurationPopover
              selectedVersionId={selectedMitreVersionId}
              onSelect={setMitreVersion}
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

      {/* ── Grid — scrolls independently in both axes ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <EuiFlexGroup
          gutterSize="m"
          wrap={false}
          responsive={false}
          style={{ width: 'max-content', alignItems: 'flex-start', paddingBottom: 16 }}
        >
          {versionedTactics.map((tactic) => (
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
