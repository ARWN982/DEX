import React, { useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
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
  subLine: string;
  isEmpty?: boolean;
  emptySubLine?: string;
  onViewRules: () => void;
  onAddToChat: () => void;
  viewLabel?: string;
}

const SignalCard: React.FC<SignalCardProps> = ({
  accentColor,
  title,
  badge,
  count,
  countColor,
  subLine,
  isEmpty,
  emptySubLine,
  onViewRules,
  onAddToChat,
  viewLabel = 'View rules',
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
      <span style={{ color: isEmpty ? '#69707d' : countColor, lineHeight: 1 }}>{count}</span>
    </EuiTitle>

    {/* Sub-line */}
    <EuiText size="s" color={isEmpty ? 'subdued' : 'default'} style={{ marginTop: 4, flex: 1, lineHeight: '20px' }}>
      {isEmpty ? emptySubLine : subLine}
    </EuiText>

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
  <EuiPanel color="subdued" paddingSize="s" style={{ marginTop: 8, position: 'relative' }}>
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

// ─── AutoDEX mock logs ────────────────────────────────────────────────────────

const MOCK_LOGS = [
  {
    id: '1',
    timestamp: 'Apr 15, 2026 @ 14:22:07',
    action: 'Fixed execution failure',
    actionColor: 'danger' as const,
    rule: 'Unusual Network Destination Domain Name',
    reasoning: 'Rule was timing out due to a missing index alias. AutoDEX updated the index pattern from logs-endpoint.* to logs-endpoint.events.* to match the installed data stream.',
    status: 'success' as const,
  },
  {
    id: '2',
    timestamp: 'Apr 15, 2026 @ 14:18:43',
    action: 'Tuned false positives',
    actionColor: 'warning' as const,
    rule: 'Potential PowerShell HackTool Script by Author',
    reasoning: 'Rule generated 340 alerts/week with 98% originating from the backup-agent process. AutoDEX added an exception for process.name: "backup-agent.exe" on host groups matching "backup-*".',
    status: 'success' as const,
  },
  {
    id: '3',
    timestamp: 'Apr 15, 2026 @ 13:55:11',
    action: 'Tuned false positives',
    actionColor: 'warning' as const,
    rule: 'Unusual Execution via Microsoft Common Console File',
    reasoning: '210 alerts/week — 94% from developer workstations. Added exception for user.name matching internal dev group "corp-dev-*". This pattern was verified against 30 days of historical data.',
    status: 'success' as const,
  },
  {
    id: '4',
    timestamp: 'Apr 15, 2026 @ 13:40:29',
    action: 'Installed rule',
    actionColor: 'primary' as const,
    rule: 'AWS IAM Assume Role Policy Update',
    reasoning: 'Your environment has AWS CloudTrail data in logs-aws.cloudtrail-*. This prebuilt rule covers T1078.004 (Cloud Accounts) which was identified as a coverage gap. AutoDEX installed and enabled it.',
    status: 'success' as const,
  },
  {
    id: '5',
    timestamp: 'Apr 15, 2026 @ 13:38:02',
    action: 'Updated rule',
    actionColor: 'accent' as const,
    rule: 'Potential Widespread Malware Infection Across Multiple Hosts',
    reasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update after verifying no active suppressions would be affected.',
    status: 'success' as const,
  },
];

// ─── AutoDEX Strip ────────────────────────────────────────────────────────────

interface AutoDexStripProps {
  autoDex: DetectionSummaryPanelProps['autoDex'];
  onOpenAIAssistant: (prompt: string) => void;
}

const AutoDexStrip: React.FC<AutoDexStripProps> = ({ autoDex, onOpenAIAssistant }) => {
  const { isRunning, fixedCount, tunedCount, installedCount, updatedCount } = autoDex;

  // Configure modal state
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [autoFixFailures, setAutoFixFailures] = useState(true);
  const [autoTuneNoise, setAutoTuneNoise] = useState(true);
  const [autoInstallRules, setAutoInstallRules] = useState(false);
  const [autoUpdateRules, setAutoUpdateRules] = useState(true);
  const [automationLevel, setAutomationLevel] = useState(2);
  const [approvalThreshold, setApprovalThreshold] = useState('medium');

  // View logs flyout state
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const metrics = [
    {
      label: `${fixedCount} failing rules fixed`,
      prompt: 'Show me the rules AutoDEX fixed automatically and what changes were made',
    },
    {
      label: `${tunedCount} rules tuned with new exceptions`,
      prompt: `Show me the ${tunedCount} rules AutoDEX tuned with new exceptions and the reasoning for each`,
    },
    {
      label: `${installedCount} new Elastic rules installed`,
      prompt: `Show me the ${installedCount} new Elastic rules AutoDEX installed and why they were selected`,
    },
    {
      label: `${updatedCount} Elastic rules updated`,
      prompt: `Show me the ${updatedCount} Elastic rules AutoDEX updated and what changed`,
    },
  ];

  const divider = '1px solid #d3dae6';

  return (
    <>
    {/* ── Configure modal ──────────────────────────────────────────── */}
    {isConfigureOpen && (
      <EuiModal onClose={() => setIsConfigureOpen(false)} style={{ width: 560 }}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}><EuiIcon type="sparkles" color="#7B61FF" /></EuiFlexItem>
              <EuiFlexItem>AutoDEX Configuration</EuiFlexItem>
            </EuiFlexGroup>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiTitle size="xs"><h3>Automation scope</h3></EuiTitle>
          <EuiText size="s" color="subdued">Choose which actions AutoDEX can perform automatically.</EuiText>
          <EuiSpacer size="m" />
          {[
            { label: 'Fix execution failures', desc: 'Automatically resolve index pattern mismatches and query errors.', value: autoFixFailures, set: setAutoFixFailures },
            { label: 'Tune high false positive rules', desc: 'Add exceptions and threshold adjustments based on alert patterns.', value: autoTuneNoise, set: setAutoTuneNoise },
            { label: 'Install new Elastic prebuilt rules', desc: 'Install rules that fill detected MITRE coverage gaps.', value: autoInstallRules, set: setAutoInstallRules },
            { label: 'Update existing Elastic rules', desc: 'Apply new versions of installed prebuilt rules automatically.', value: autoUpdateRules, set: setAutoUpdateRules },
          ].map(({ label, desc, value, set }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <EuiSwitch label={<strong>{label}</strong>} checked={value} onChange={e => set(e.target.checked)} />
              <EuiText size="xs" color="subdued" style={{ marginTop: 4, marginLeft: 44 }}>{desc}</EuiText>
            </div>
          ))}

          <EuiHorizontalRule />

          <EuiTitle size="xs"><h3>Automation level</h3></EuiTitle>
          <EuiText size="s" color="subdued">Control how much AutoDEX acts without your approval.</EuiText>
          <EuiSpacer size="m" />
          <EuiRange
            min={1}
            max={3}
            value={automationLevel}
            onChange={e => setAutomationLevel(Number((e.target as HTMLInputElement).value))}
            showTicks
            tickInterval={1}
            ticks={[
              { label: 'Suggest only', value: 1 },
              { label: 'Semi-auto', value: 2 },
              { label: 'Full auto', value: 3 },
            ]}
            fullWidth
          />
          <EuiSpacer size="m" />
          <EuiText size="xs" color="subdued">
            {automationLevel === 1 && 'AutoDEX will only surface recommendations. No changes are made without explicit approval.'}
            {automationLevel === 2 && 'AutoDEX applies low-risk changes automatically and queues high-risk actions for your approval.'}
            {automationLevel === 3 && 'AutoDEX applies all changes automatically. You can review them in the logs at any time.'}
          </EuiText>

          <EuiHorizontalRule />

          <EuiTitle size="xs"><h3>Approval threshold</h3></EuiTitle>
          <EuiText size="s" color="subdued">Define what risk level requires your manual approval.</EuiText>
          <EuiSpacer size="s" />
          <EuiSelect
            options={[
              { value: 'low', text: 'Low risk and above (most actions require approval)' },
              { value: 'medium', text: 'Medium risk and above (recommended)' },
              { value: 'high', text: 'High risk only (fewer approvals needed)' },
              { value: 'none', text: 'Never ask for approval (full automation)' },
            ]}
            value={approvalThreshold}
            onChange={e => setApprovalThreshold(e.target.value)}
            fullWidth
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButtonEmpty onClick={() => setIsConfigureOpen(false)}>Cancel</EuiButtonEmpty>
          <EuiButtonEmpty color="primary" iconType="sparkles" onClick={() => setIsConfigureOpen(false)} style={{ color: '#7B61FF' }}>
            Save configuration
          </EuiButtonEmpty>
        </EuiModalFooter>
      </EuiModal>
    )}

    {/* ── View logs flyout ─────────────────────────────────────────── */}
    {isLogsOpen && (
      <EuiFlyout onClose={() => setIsLogsOpen(false)} size="m" ownFocus={false}>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s">
            <h2>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}><EuiIcon type="sparkles" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                <EuiFlexItem>AutoDEX Activity Log</EuiFlexItem>
              </EuiFlexGroup>
            </h2>
          </EuiTitle>
          <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
            Actions taken automatically — with full reasoning for each decision.
          </EuiText>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          {MOCK_LOGS.map((log, i) => (
            <div key={log.id}>
              <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none" style={{ marginBottom: 4 }}>
                <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false}>
                  <EuiFlexItem grow={false} style={{ paddingTop: 2 }}>
                    <EuiHealth color={log.status === 'success' ? 'success' : 'warning'} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 4 }}>
                      <EuiFlexItem grow={false}>
                        <EuiBadge color={log.actionColor}>{log.action}</EuiBadge>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">{log.timestamp}</EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiText size="s" style={{ fontWeight: 600, marginBottom: 4 }}>{log.rule}</EuiText>
                    <EuiPanel color="subdued" hasBorder={false} hasShadow={false} paddingSize="s" style={{ borderRadius: 4, borderLeft: '3px solid #98A2B3' }}>
                      <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 4 }}>Reasoning</EuiText>
                      <EuiText size="s">{log.reasoning}</EuiText>
                    </EuiPanel>
                    <EuiButtonEmpty
                      size="xs"
                      iconType="productAgent"
                      flush="left"
                      style={{ color: '#7B61FF', marginTop: 4 }}
                      onClick={() => onOpenAIAssistant(`Tell me more about the AutoDEX action: ${log.action} on rule "${log.rule}"`)}
                    >
                      Ask AI about this action
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
              {i < MOCK_LOGS.length - 1 && <EuiHorizontalRule margin="s" />}
            </div>
          ))}
        </EuiFlyoutBody>

        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="download" color="primary">Export logs</EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={() => setIsLogsOpen(false)}>Close</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    )}

    <EuiPanel
      hasBorder
      hasShadow={false}
      paddingSize="none"
      style={{ borderLeft: '3px solid #7B61FF', marginTop: 8, border: `1px solid #98A2B3`, borderLeft: '3px solid #7B61FF', overflow: 'hidden' }}
    >
      <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false}>

        {/* Anchor column — faint AI gradient background */}
        <EuiFlexItem
          grow={false}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(217,232,255,0.35) 0%, rgba(236,226,254,0.35) 100%)',
            borderRight: divider,
            flexShrink: 0,
          }}
        >
          {/* Row 1 */}
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 4 }}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>AutoDEX</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {isRunning
                ? <EuiBadge color="success" iconType="check">Running</EuiBadge>
                : <EuiBadge color="subdued">Idle</EuiBadge>}
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* Row 2 */}
          <EuiFlexGroup gutterSize="none" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="controlsHorizontal" color="primary" flush="left" onClick={() => setIsConfigureOpen(true)}>
                Configure
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="list" color="primary" flush="left" onClick={() => setIsLogsOpen(true)}>
                View logs
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Metric columns */}
        {metrics.map((m, i) => (
          <EuiFlexItem
            key={m.label}
            grow={false}
            style={{
              padding: '12px 28px 12px 24px',
              borderRight: i < metrics.length - 1 ? divider : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <EuiText size="s" style={{ marginBottom: 4, whiteSpace: 'nowrap' }}>{m.label}</EuiText>
            <EuiButtonEmpty
              size="xs"
              iconType="popout"
              color="primary"
              flush="left"
              style={{ marginLeft: 0, paddingLeft: 0 }}
              onClick={() => onOpenAIAssistant(m.prompt)}
            >
              View details
            </EuiButtonEmpty>
          </EuiFlexItem>
        ))}

      </EuiFlexGroup>
    </EuiPanel>
    </>
  );
};

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
  const [openDrill, setOpenDrill] = useState<DrillCategory>(null);

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

  const topFourTechniques = coverageGaps.slice(0, 4).map(g => g.techniqueId).join(', ');

  return (
    <div>
      {/* ── Four signal cards ─────────────────────────────────────── */}
      <EuiFlexGroup gutterSize="s" responsive={false} alignItems="stretch">

        {/* Card 1 — Execution failures */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor="#BD271E"
            title="Execution failures"
            badge={<EuiBadge color="danger">Action needed</EuiBadge>}
            count={executionFailures.length}
            countColor="#BD271E"
            subLine={`${executionFailures.length} rules failing silently — alerts may be missing`}
            isEmpty={executionFailures.length === 0}
            emptySubLine="No failures — all rules executing"
            onViewRules={() => toggleDrill('failures')}
            onAddToChat={() => onOpenAIAssistant(
              `Show me the ${executionFailures.length} rules with execution failures and diagnose what is causing each one`
            )}
          />
        </EuiFlexItem>

        {/* Card 2 — High false positive rate */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor="#F5A700"
            title="High false positive rate"
            badge={<EuiBadge color="warning">High noise</EuiBadge>}
            count={highNoiseRules.length}
            countColor="#F5A700"
            subLine={`${highNoiseRules.length} rules generating noise — SOC fatigue risk`}
            isEmpty={highNoiseRules.length === 0}
            emptySubLine="No noisy rules — signal quality is good"
            onViewRules={() => toggleDrill('noise')}
            onAddToChat={() => onOpenAIAssistant(
              `Show me the ${highNoiseRules.length} high false positive rules with tuning recommendations for each one`
            )}
          />
        </EuiFlexItem>

        {/* Card 3 — MITRE coverage gaps */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor="#F5A700"
            title="MITRE coverage gaps"
            badge={<EuiBadge color="warning">{coveragePct}% covered</EuiBadge>}
            count={coverageGaps.length}
            countColor="#F5A700"
            subLine={`${coverageGaps.length} high-priority gaps`}
            isEmpty={coverageGaps.length === 0}
            emptySubLine="Full MITRE coverage — no gaps detected"
            viewLabel="View coverage map"
            onViewRules={() => toggleDrill('coverage')}
            onAddToChat={() => onOpenAIAssistant(
              `Show me all ${coverageGaps.length} MITRE coverage gaps and which Elastic prebuilt rules would fill them`
            )}
          />
        </EuiFlexItem>

        {/* Card 4 — Rule updates */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor="#0077CC"
            title="Rule updates"
            badge={<EuiBadge color="primary">{ruleUpdates.length} available</EuiBadge>}
            count={ruleUpdates.length}
            countColor="#0077CC"
            subLine="Elastic prebuilt rules with new versions"
            isEmpty={ruleUpdates.length === 0}
            emptySubLine="All prebuilt rules are up to date"
            onViewRules={() => toggleDrill('updates')}
            onAddToChat={() => onOpenAIAssistant(
              `Review the ${ruleUpdates.length} available prebuilt rule updates and summarise what changed in each`
            )}
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

      {/* ── AutoDEX strip ───────────────────────────────────────────── */}
      <AutoDexStrip autoDex={autoDex} onOpenAIAssistant={onOpenAIAssistant} />
    </div>
  );
};

export default DetectionSummaryPanel;
