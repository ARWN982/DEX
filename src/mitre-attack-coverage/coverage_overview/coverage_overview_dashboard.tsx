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
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiRadioGroup,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import * as i18n from './translations';
import { CoverageOverviewLink } from '../shims/page_components';

const MitreIconSVG: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.825 7.6189L7.2 7.8939L7.1875 16.2564L9.7375 13.7064L18.775 22.7376L22.3125 19.2064L13.275 10.1689L15.825 7.6189Z" fill="#153385" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M16.2313 7.21265L7.60625 7.48765L7.59375 15.8501L10.1437 13.3001L19.1813 22.3314L22.7188 18.8001L13.6813 9.76265L16.2313 7.21265Z" fill="#48EFCF" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M64.0496 7.6189L72.6746 7.8939L72.6871 16.2564L70.1371 13.7064L61.1059 22.7376L57.5684 19.2064L66.5996 10.1689L64.0496 7.6189Z" fill="#153385" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M63.6434 7.21265L72.2684 7.48765L72.2809 15.8501L69.7309 13.3001L60.6934 22.3314L57.1621 18.8001L66.1934 9.76265L63.6434 7.21265Z" fill="#48EFCF" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M15.825 65.1313L7.2 64.8563L7.1875 56.4938L9.7375 59.0438L18.775 50.0063L22.3125 53.5438L13.275 62.5813L15.825 65.1313Z" fill="#153385" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M16.2313 65.5376L7.60625 65.2626L7.59375 56.9001L10.1437 59.4501L19.1813 50.4126L22.7188 53.9501L13.6813 62.9876L16.2313 65.5376Z" fill="#48EFCF" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M64.0496 65.1313L72.6746 64.8563L72.6871 56.4938L70.1371 59.0438L61.1059 50.0063L57.5684 53.5438L66.5996 62.5813L64.0496 65.1313Z" fill="#153385" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M63.6434 65.5376L72.2684 65.2626L72.2809 56.9001L69.7309 59.4501L60.6934 50.4126L57.1621 53.9501L66.1934 62.9876L63.6434 65.5376Z" fill="#48EFCF" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M14.8062 13.7563C14.8062 13.7563 18.0562 22.4313 18.0562 36.7563C18.0562 51.0813 14.8062 57.7876 14.8062 57.7876C14.8062 57.7876 23.7812 54.9501 40.2499 54.9501C56.7187 54.9501 65.0749 57.7876 65.0749 57.7876C65.0749 57.7876 61.9874 49.6001 61.9874 35.8126C61.9874 22.0251 65.0749 13.7688 65.0749 13.7688C65.0749 13.7688 55.0749 16.6063 40.8499 16.6063C32.1124 16.5688 23.3937 15.6126 14.8062 13.7563Z" fill="#0B64DD" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M32.2122 32.6875H27.2935V49.3563H32.2122V32.6875Z" fill="white"/>
    <path d="M32.2122 30.0437H27.2935V37.225H32.2122V30.0437Z" fill="#48EFCF"/>
    <path d="M52.5809 23.3875H47.6621V30.2H52.5809V23.3875Z" fill="#48EFCF"/>
    <path d="M42.3748 27.8313H37.4561V49.3563H42.3748V27.8313Z" fill="white"/>
    <path d="M52.5311 30.2249H47.6123V49.3624H52.5311V30.2249Z" fill="white"/>
    <path d="M42.3997 25.2561H37.481V41.1749H42.3997V25.2561Z" fill="#48EFCF"/>
    <path d="M41.9498 72.2312C50.5311 68.75 56.7561 61.3812 56.7561 54.45V45.0437L41.9498 40.1375H41.9061L28.3936 45.0437V54.45C28.3936 61.3875 33.3311 68.75 41.9061 72.2312H41.9498Z" fill="#153385" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M41.9499 72.2312C50.1374 68.75 55.4624 61.3812 55.4624 54.45V45.0437L41.9499 40.1375H41.9124L28.3999 45.0437V54.45C28.3999 61.3875 33.7249 68.75 41.9124 72.2312H41.9499Z" fill="#48EFCF" stroke="#101C3F" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M41.6686 48.2251C43.2873 48.2251 44.5998 49.5376 44.5998 51.1563V54.4501H38.7373V51.1563C38.7373 49.5376 40.0498 48.2251 41.6686 48.2251Z" stroke="#0B64DD" strokeWidth="1.60714" strokeMiterlimit="10"/>
    <path d="M47.5498 53.0376H35.8623V62.0938H47.5498V53.0376Z" fill="#0B64DD"/>
    <path d="M41.7061 58.0752C42.5345 58.0752 43.2061 57.4036 43.2061 56.5752C43.2061 55.7468 42.5345 55.0752 41.7061 55.0752C40.8776 55.0752 40.2061 55.7468 40.2061 56.5752C40.2061 57.4036 40.8776 58.0752 41.7061 58.0752Z" fill="#101C3F"/>
    <path d="M42.3874 55.9126H41.0249V60.4063H42.3874V55.9126Z" fill="#101C3F"/>
  </svg>
);
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
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

        {/* Announcement banner — Figma 713:2020 */}
        <EuiSpacer size="m" />
        {selectedVersion?.isLatest && !bannerDismissed && (
          <>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px',
              background: '#F6F9FC',
              border: '1px solid #E3E8F2',
              borderRadius: 4,
            }}>
              {/* MITRE icon — same as rule details page */}
              <div style={{ flexShrink: 0, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EuiIcon type="securityAnalyticsApp" size="xxl" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: '#111C2C', marginBottom: 2 }}>
                  MITRE ATT&amp;CK {selectedMitreVersionId} is now applied to your coverage view.
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: '#516381' }}>
                  Some tactics and techniques have been added, renamed, or revoked since v18.
                </div>
              </div>

              {/* Actions — Figma 713:2535: only Learn more pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#D9E8FF', border: 'none', borderRadius: 4,
                    padding: '0 8px', height: 32, cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, color: '#1750BA',
                  }}
                >
                  Learn more
                  <EuiIcon type="popout" size="s" color="#1750BA" />
                </button>
              </div>

              {/* Dismiss */}
              <EuiButtonIcon
                size="xs"
                iconType="cross"
                aria-label="Dismiss banner"
                color="text"
                style={{ position: 'absolute', top: 4, right: 4 }}
                onClick={() => setBannerDismissed(true)}
              />
            </div>
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
