import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RuleSummaryItem {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  contextLabel: string;
  actionLabel: string;
  aiPrompt: string;
}

export interface CoverageGapItem extends RuleSummaryItem {
  techniqueId: string;
}

export interface RuleUpdateItem extends RuleSummaryItem {
  changeDescription: string;
}

export interface DetectionSummaryPanelProps {
  executionFailures: RuleSummaryItem[];
  highNoiseRules: RuleSummaryItem[];
  coverageGaps: CoverageGapItem[];
  coveragePct: number;
  ruleUpdates: RuleUpdateItem[];
  autoDex: {
    isRunning: boolean;
    lastRunAt: string;
    fixedCount: number;
    tunedCount: number;
    installedCount: number;
    updatedCount: number;
  };
  onOpenAIAssistant: (prefilledPrompt: string) => void;
  onViewRules: (category: 'failures' | 'noise' | 'coverage' | 'updates') => void;
  onNavigateToRule?: (ruleId: string) => void;
}

type DrillCategory = 'failures' | 'noise' | 'coverage' | 'updates' | null;

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': case 'high': return 'danger';
    case 'medium': return 'warning';
    default: return 'success';
  }
};

// ─── Signal Card ─────────────────────────────────────────────────────────────

interface SignalCardProps {
  accentColor: string;
  title: string;
  badge?: React.ReactNode;
  count: number;
  countColor: string;
  statText?: string;
  subLine: string;
  isEmpty?: boolean;
  emptySubLine?: string;
  onViewRules: () => void;
  onAddToChat: () => void;
  viewLabel?: string;
  /** Part 1 (Option A): AutoDEX resolution line shown between sub-line and actions. */
  autoDexLine?: React.ReactNode;
}

const SignalCard: React.FC<SignalCardProps> = ({
  accentColor,
  title,
  badge,
  count,
  countColor,
  statText,
  subLine,
  isEmpty,
  emptySubLine,
  onViewRules,
  onAddToChat,
  viewLabel = 'View rules',
  autoDexLine,
}) => (
  <EuiPanel
    hasBorder
    hasShadow={false}
    paddingSize="m"
    style={{ borderLeft: `3px solid ${accentColor}`, height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    {/* Header */}
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 6 }}>
      <EuiFlexItem grow={false}>
        <EuiText size="s" style={{ fontWeight: 600 }}>{title}</EuiText>
      </EuiFlexItem>
      {!isEmpty && badge && <EuiFlexItem grow={false}>{badge}</EuiFlexItem>}
    </EuiFlexGroup>

    {/* Stat */}
    <EuiTitle size="l">
      <span style={{ color: isEmpty ? '#69707d' : countColor, lineHeight: 1 }}>
        {isEmpty ? count : (statText ?? count)}
      </span>
    </EuiTitle>

    {/* Sub-line */}
    <EuiText size="s" color={isEmpty ? 'subdued' : 'default'} style={{ marginTop: 4, flex: 1, lineHeight: '20px' }}>
      {isEmpty ? emptySubLine : subLine}
    </EuiText>

    {/* Part 1 (Option A): AutoDEX resolution line */}
    {autoDexLine && (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginTop: 8 }}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="success">{autoDexLine}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    )}

    {/* Actions */}
    <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 10 }}>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left" onClick={onViewRules}>
          {viewLabel}
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          size="xs"
          iconType="productAgent"
          onClick={onAddToChat}
          style={{ color: '#7B61FF' }}
        >
          Add to chat
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
);

// ─── Drill-down Panel ─────────────────────────────────────────────────────────

interface DrillPanelProps {
  items: RuleSummaryItem[];
  onClose: () => void;
  onOpenAIAssistant: (prompt: string) => void;
  onNavigateToRule?: (id: string) => void;
}

const DrillPanel: React.FC<DrillPanelProps> = ({ items, onClose, onOpenAIAssistant, onNavigateToRule }) => (
  <EuiPanel color="subdued" paddingSize="s" style={{ marginTop: 16, position: 'relative' }}>
    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
      <EuiButtonIcon iconType="cross" aria-label="Close" size="xs" color="text" onClick={onClose} />
    </div>
    <EuiBasicTable
      items={items}
      columns={[
        {
          field: 'severity',
          name: 'Severity',
          width: '90px',
          render: (sev: string) => (
            <EuiHealth color={severityColor(sev)}>
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </EuiHealth>
          ),
        },
        {
          field: 'name',
          name: 'Rule name',
          render: (name: string, item: RuleSummaryItem) => (
            <EuiLink onClick={() => onNavigateToRule?.(item.id)}>{name}</EuiLink>
          ),
        },
        {
          field: 'contextLabel',
          name: 'Context',
          render: (label: string) => <EuiText size="s" color="subdued">{label}</EuiText>,
        },
        {
          name: 'Action',
          width: '140px',
          render: (item: RuleSummaryItem) => (
            <EuiButtonEmpty size="xs" iconType="discuss" color="primary" onClick={() => onOpenAIAssistant(item.aiPrompt)}>
              {item.actionLabel}
            </EuiButtonEmpty>
          ),
        },
      ]}
      rowHeader="name"
    />
  </EuiPanel>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const DetectionSummaryPanel: React.FC<DetectionSummaryPanelProps> = ({
  executionFailures,
  highNoiseRules,
  coverageGaps,
  coveragePct,
  ruleUpdates,
  autoDex,
  onOpenAIAssistant,
  onViewRules,
  onNavigateToRule,
}) => {
  const navigate = useNavigate();
  const [openDrill, setOpenDrill] = useState<DrillCategory>(null);
  // 'off' | 'running' | 'healthy'
  const [autoDexState, setAutoDexState] = useState<'off' | 'running' | 'healthy'>('off');

  const toggleDrill = (cat: NonNullable<DrillCategory>) => {
    setOpenDrill(prev => (prev === cat ? null : cat));
    onViewRules(cat);
  };

  const drillItems: Record<NonNullable<DrillCategory>, RuleSummaryItem[]> = {
    failures:  executionFailures,
    noise:     highNoiseRules,
    coverage:  coverageGaps,
    updates:   ruleUpdates,
  };

  const isOn = autoDexState !== 'off';
  const isHealthy = autoDexState === 'healthy';
  const isRunning = autoDexState === 'running';

  // Part 1 (Option A): AutoDEX resolution lines + conditional accent override
  const AUTODEX_SUCCESS = '#017D73';
  const failuresAutoDexLine = autoDex.fixedCount > 0
    ? `AutoDEX fixed ${autoDex.fixedCount} today` : undefined;
  const noiseAutoDexLine = autoDex.tunedCount > 0
    ? `AutoDEX tuned ${autoDex.tunedCount} today` : undefined;
  const gapsAutoDexLine = autoDex.installedCount > 0
    ? `AutoDEX installed ${autoDex.installedCount} rules` : undefined;
  const updatesAutoDexLine = autoDex.updatedCount > 0
    ? `AutoDEX applied ${autoDex.updatedCount} updates` : undefined;

  // Part 2 (Option D): callout title segments
  const calloutSegments: string[] = [];
  if (autoDex.fixedCount > 0) calloutSegments.push(`fixed ${autoDex.fixedCount} failure${autoDex.fixedCount > 1 ? 's' : ''}`);
  if (autoDex.tunedCount > 0) calloutSegments.push(`tuned ${autoDex.tunedCount} rule${autoDex.tunedCount > 1 ? 's' : ''}`);
  if (autoDex.installedCount > 0) calloutSegments.push(`installed ${autoDex.installedCount} rule${autoDex.installedCount > 1 ? 's' : ''}`);
  if (autoDex.updatedCount > 0) calloutSegments.push(`updated ${autoDex.updatedCount} rule${autoDex.updatedCount > 1 ? 's' : ''}`);
  const showCallout = calloutSegments.length > 0;
  const calloutTitle = `AutoDEX activity today: ${calloutSegments.join(' · ')}`;

  // AutoDEX in-progress badge added to each card header when running
  const autoDexBadge = isRunning ? (
    <EuiBadge
      iconType="sparkles"
      iconSide="left"
      style={{
        background: 'linear-gradient(to right, #D9E8FF, #ECE2FE)',
        color: '#3D4AB8',
        border: 'none',
        fontWeight: 600,
      }}
    >
      AutoDEX in progress
    </EuiBadge>
  ) : null;

  return (
    <div>
      {/* ── Part 2 (Option D): AutoDEX activity callout strip — above cards ── */}
      {showCallout && (
        <EuiCallOut
          color="success"
          iconType="sparkles"
          title={calloutTitle}
          style={{ marginBottom: 16 }}
        >
          <EuiButtonEmpty
            size="s"
            iconType="popout"
            color="success"
            onClick={() => navigate('/autodex')}
          >
            View in AutoDEX
          </EuiButtonEmpty>
        </EuiCallOut>
      )}

      {/* ── Four signal cards ─────────────────────────────────────── */}
      <EuiFlexGroup gutterSize="m" responsive={false} alignItems="stretch">

        {/* Card 1 — Execution failures */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : failuresAutoDexLine ? AUTODEX_SUCCESS : '#BD271E'}
            title="Execution failures"
            badge={
              isHealthy
                ? <EuiBadge color="success">Healthy</EuiBadge>
                : <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" style={{ flexWrap: 'nowrap' }}>
                    <EuiFlexItem grow={false}><EuiBadge color="danger">Action needed</EuiBadge></EuiFlexItem>
                    {autoDexBadge && <EuiFlexItem grow={false}>{autoDexBadge}</EuiFlexItem>}
                  </EuiFlexGroup>
            }
            count={isHealthy ? 0 : executionFailures.length}
            countColor={isHealthy ? '#017D73' : '#BD271E'}
            subLine={isHealthy ? '0 rules failing — based on the last 24 hours' : `${executionFailures.length} rules failing silently — alerts may be missing`}
            isEmpty={false}
            onViewRules={() => toggleDrill('failures')}
            onAddToChat={() => onOpenAIAssistant(`Show me the ${executionFailures.length} rules with execution failures and diagnose what is causing each one`)}
            autoDexLine={failuresAutoDexLine}
          />
        </EuiFlexItem>

        {/* Card 2 — False positive rate */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : noiseAutoDexLine ? AUTODEX_SUCCESS : '#F5A700'}
            title="False positive rate"
            badge={
              isHealthy
                ? <EuiBadge color="success">Low</EuiBadge>
                : <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" style={{ flexWrap: 'nowrap' }}>
                    <EuiFlexItem grow={false}><EuiBadge color="warning">High noise</EuiBadge></EuiFlexItem>
                    {autoDexBadge && <EuiFlexItem grow={false}>{autoDexBadge}</EuiFlexItem>}
                  </EuiFlexGroup>
            }
            count={isHealthy ? 0 : highNoiseRules.length}
            countColor={isHealthy ? '#017D73' : '#F5A700'}
            subLine={isHealthy ? '0 rules generating noise' : `${highNoiseRules.length} rules generating noise — SOC fatigue risk`}
            isEmpty={false}
            onViewRules={() => toggleDrill('noise')}
            onAddToChat={() => onOpenAIAssistant(`Show me the ${highNoiseRules.length} high false positive rules with tuning recommendations for each one`)}
            autoDexLine={noiseAutoDexLine}
          />
        </EuiFlexItem>

        {/* Card 3 — Gaps detected */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : gapsAutoDexLine ? AUTODEX_SUCCESS : '#F5A700'}
            title="Gaps detected"
            badge={
              isHealthy
                ? <EuiBadge color="success">No gaps</EuiBadge>
                : <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" style={{ flexWrap: 'nowrap' }}>
                    <EuiFlexItem grow={false}><EuiBadge color="#FEF3C7" style={{ color: '#92400E', border: '1px solid #FDE68A', borderRadius: 12 }}>Filling in progress</EuiBadge></EuiFlexItem>
                    {autoDexBadge && <EuiFlexItem grow={false}>{autoDexBadge}</EuiFlexItem>}
                  </EuiFlexGroup>
            }
            count={coverageGaps.length}
            statText={isHealthy ? '0 mins' : '21 mins'}
            countColor={isHealthy ? '#017D73' : '#F5A700'}
            subLine={isHealthy ? 'Across 0 rules' : 'Across 6 rules'}
            isEmpty={false}
            viewLabel="View gaps"
            onViewRules={() => toggleDrill('coverage')}
            onAddToChat={() => onOpenAIAssistant(`Show me all ${coverageGaps.length} MITRE coverage gaps and which Elastic prebuilt rules would fill them`)}
            autoDexLine={gapsAutoDexLine}
          />
        </EuiFlexItem>

        {/* Card 4 — Rule updates */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : updatesAutoDexLine ? AUTODEX_SUCCESS : '#0077CC'}
            title="Rule updates"
            badge={
              isHealthy
                ? <EuiBadge color="success">All rules are up to date</EuiBadge>
                : <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" style={{ flexWrap: 'nowrap' }}>
                    <EuiFlexItem grow={false}><EuiBadge color="primary">{ruleUpdates.length} available</EuiBadge></EuiFlexItem>
                    {autoDexBadge && <EuiFlexItem grow={false}>{autoDexBadge}</EuiFlexItem>}
                  </EuiFlexGroup>
            }
            count={isHealthy ? 0 : ruleUpdates.length}
            countColor={isHealthy ? '#017D73' : '#0077CC'}
            subLine="Elastic prebuilt rules with new versions"
            isEmpty={false}
            onViewRules={() => toggleDrill('updates')}
            onAddToChat={() => onOpenAIAssistant(`Review the ${ruleUpdates.length} available prebuilt rule updates and summarise what changed in each`)}
            autoDexLine={updatesAutoDexLine}
          />
        </EuiFlexItem>

      </EuiFlexGroup>

      {/* ── Drill-down panel ────────────────────────────────────────── */}
      {openDrill && drillItems[openDrill].length > 0 && (
        <DrillPanel
          items={drillItems[openDrill]}
          onClose={() => setOpenDrill(null)}
          onOpenAIAssistant={onOpenAIAssistant}
          onNavigateToRule={onNavigateToRule}
        />
      )}


    </div>
  );
};

export default DetectionSummaryPanel;
