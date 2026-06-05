/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiPopover,
  EuiRadioGroup,
  EuiSpacer,
  EuiStat,
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

// ─── Coverage health + legend card (Figma 713:2021) ──────────────────────────
const LEGEND_ITEMS = [
  { color: '#00BFB3',               label: '>10 rules' },
  { color: 'rgba(0,191,179,0.6)',   label: '7-10 rules' },
  { color: 'rgba(0,191,179,0.3)',   label: '3-6 rules' },
  { color: 'rgba(0,191,179,0.15)',  label: '1-2 rules' },
  { color: 'white',                 label: '0 rules', border: true },
];

interface CoverageHealthCardProps {
  mappedRules: number;
  needsReview: number;
  unmappedRules: number;
}
const CoverageHealthCard: React.FC<CoverageHealthCardProps> = ({ mappedRules, needsReview, unmappedRules }) => (
  <EuiPanel paddingSize="none" hasBorder style={{ borderRadius: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 20px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 50, alignItems: 'center', flex: 1, minWidth: 0 }}>
        <EuiStat
          title={mappedRules.toLocaleString()}
          description="mapped rules"
          titleColor="#047471"
          titleSize="l"
          style={{ minWidth: 160 }}
        />
        <EuiStat
          title={needsReview.toLocaleString()}
          description="rules need mapping review"
          titleColor="#966b03"
          titleSize="l"
          style={{ minWidth: 200 }}
        />
        <EuiStat
          title={unmappedRules.toLocaleString()}
          description="unmapped rules"
          titleColor="#a71627"
          titleSize="l"
        />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 69, background: '#E3E8F2', flexShrink: 0 }} />

      {/* Legend */}
      <div style={{ width: 297, flexShrink: 0, padding: '6px 0' }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#343741' }}>Legend </span>
          <span style={{ fontSize: 10.5, fontWeight: 500, color: '#343741' }}>(count will include all rules selected)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0' }}>
          {LEGEND_ITEMS.map(({ color, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 13, height: 13, borderRadius: 10, background: color, flexShrink: 0,
                border: border ? '1px solid #D3DAE6' : undefined,
              }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1C21' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </EuiPanel>
);

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

  // Derive stats from tactic data
  const { mappedRules, needsReview, unmappedRules } = useMemo(() => {
    const enabledIds = new Set<string>();
    const disabledIds = new Set<string>();
    versionedTactics.forEach(tactic => {
      tactic.techniques.forEach(tech => {
        tech.enabledRules.forEach(r => enabledIds.add(r.id));
        tech.disabledRules.forEach(r => disabledIds.add(r.id));
      });
    });
    const unmapped = data?.unmappedRules?.enabledRules?.length ?? 0;
    return {
      mappedRules: enabledIds.size,
      needsReview: disabledIds.size,
      unmappedRules: unmapped,
    };
  }, [versionedTactics, data]);

  // Format badge: "v19 · Latest"
  const versionBadgeLabel = selectedVersion
    ? `${selectedMitreVersionId}${selectedVersion.isLatest ? ' · Latest' : ''}`
    : selectedMitreVersionId;

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
                  {versionBadgeLabel}
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

        {/* Announcement banner */}
        <EuiSpacer size="m" />
        {selectedVersion?.isLatest && (
          <>
            <EuiPanel color="subdued" paddingSize="s" hasBorder style={{ borderRadius: 4 }}>
              <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                <EuiFlexItem grow={false}>
                  <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #00BFB3 0%, #0071c2 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22 }}>🛡️</span>
                  </div>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s"><strong>MITRE ATT&CK {selectedMitreVersionId} is now applied to your coverage view.</strong></EuiText>
                  <EuiText size="xs" color="subdued">Some tactics and techniques have been added, renamed, or revoked since v18.</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="s" iconType="popout" iconSide="right">Learn more</EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton size="s" fill>TBC</EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
            <EuiSpacer size="m" />
          </>
        )}

        {/* Stats + legend card */}
        <CoverageHealthCard
          mappedRules={mappedRules}
          needsReview={needsReview}
          unmappedRules={unmappedRules}
        />
        <EuiSpacer size="m" />

        {/* Filters — sticky above grid */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', paddingBottom: 8 }}>
          <CoverageOverviewFiltersPanel />
        </div>
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
