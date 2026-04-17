import React, { useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
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
  EuiPopover,
  EuiPopoverTitle,
  EuiRange,
  EuiSelect,
  EuiSelectable,
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
  statText?: string;
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
  statText,
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
      <span style={{ color: isEmpty ? '#69707d' : countColor, lineHeight: 1 }}>
        {isEmpty ? count : (statText ?? count)}
      </span>
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

// ─── AutoDEX mock logs ────────────────────────────────────────────────────────

const MOCK_LOGS = [
  {
    id: '1',
    timestamp: 'Apr 15, 2026 @ 14:22:07',
    action: 'Execution failure',
    actionColor: 'danger' as const,
    rule: 'Unusual Network Destination Domain Name',
    reasoning: 'Rule was timing out due to a missing index alias. AutoDEX updated the index pattern from logs-endpoint.* to logs-endpoint.events.* to match the installed data stream.',
    fullReasoning: {
      summary: 'AutoDEX diagnosed and remediated a persistent execution failure caused by an index alias mismatch introduced after a recent Elastic Agent policy update.',
      diagnosis: [
        'The rule "Unusual Network Destination Domain Name" had been failing silently for 6 hours. No alerts were being generated despite active network telemetry flowing into the cluster.',
        'AutoDEX first checked the rule\'s execution log and found repeated "index_not_found_exception" errors referencing logs-endpoint.*. Cross-referencing the installed Elastic Agent integrations, AutoDEX confirmed that the Endpoint integration (v8.13) now writes to the namespaced index logs-endpoint.events.* rather than the wildcard catch-all.',
        'The root cause was a data stream namespace change introduced in Elastic Agent 8.12.1. The rule\'s index pattern had not been updated to reflect this change, causing every execution to produce zero results and trigger a failure status.',
      ],
      decision: [
        'AutoDEX evaluated three possible remediation paths: (1) update the rule\'s index pattern, (2) create a legacy alias to bridge the old index name, or (3) flag the rule for manual review.',
        'Path 1 was selected because the change is deterministic — the new data stream name is directly observable from the installed integrations manifest. The risk of a false-positive index pattern is effectively zero when the destination index already exists with active write throughput.',
        'The index pattern was updated from logs-endpoint.* to logs-endpoint.events.* and the rule was re-enabled. AutoDEX verified the next scheduled execution returned results before marking the action complete.',
      ],
      confidence: 98,
      riskLevel: 'Low',
      changesMade: ['Updated index_patterns: ["logs-endpoint.events.*", "logs-endpoint.*", "endgame-*"]'],
      relatedMitreIds: ['T1071.001 — Application Layer Protocol: Web Protocols'],
    },
    status: 'success' as const,
    needsApproval: true,
  },
  {
    id: '2',
    timestamp: 'Apr 15, 2026 @ 14:18:43',
    action: 'Tuned false positives',
    actionColor: 'warning' as const,
    rule: 'Potential PowerShell HackTool Script by Author',
    reasoning: 'Rule generated 340 alerts/week with 98% originating from the backup-agent process. AutoDEX added an exception for process.name: "backup-agent.exe" on host groups matching "backup-*".',
    fullReasoning: {
      summary: 'AutoDEX identified a high-volume false positive pattern in the PowerShell HackTool rule driven entirely by a legitimate backup automation process and added a scoped exception.',
      diagnosis: [
        'Over the prior 7 days, the rule triggered 340 alerts. AutoDEX aggregated the alert data and found that 98.2% of alerts (334/340) shared the same process ancestry: backup-agent.exe → powershell.exe. The parent binary was signed by an internal certificate authority and its hash was stable across all 72 affected hosts.',
        'The remaining 6 alerts (1.8%) originated from distinct user sessions on endpoints not in the backup fleet, with novel command-line arguments consistent with known red-team tooling. These were preserved as valid detections.',
        'AutoDEX cross-referenced the backup-agent.exe binary against the internal asset inventory via the fleet API and confirmed it is a managed, approved process deployed by the IT Operations team on all hosts matching the "backup-*" naming convention.',
      ],
      decision: [
        'Rather than adding a broad process.name exception (which would suppress all PowerShell activity from backup-agent.exe globally), AutoDEX scoped the exception to host.name: backup-* to ensure coverage is maintained on any non-backup host where backup-agent.exe would be anomalous.',
        'The exception was written as: process.name: "backup-agent.exe" AND host.name: backup-*. This preserves detection on the 1.8% of alerts that do not match this pattern.',
        'AutoDEX calculated the expected alert volume reduction as ~334 alerts/week, reducing SOC analyst triage time for this rule by an estimated 11 hours per week.',
      ],
      confidence: 96,
      riskLevel: 'Low',
      changesMade: ['Added exception: process.name = "backup-agent.exe" AND host.name = "backup-*"'],
      relatedMitreIds: ['T1059.001 — Command and Scripting Interpreter: PowerShell'],
    },
    status: 'success' as const,
    needsApproval: false,
  },
  {
    id: '3',
    timestamp: 'Apr 15, 2026 @ 13:55:11',
    action: 'Tuned false positives',
    actionColor: 'warning' as const,
    rule: 'Unusual Execution via Microsoft Common Console File',
    reasoning: '210 alerts/week — 94% from developer workstations. Added exception for user.name matching internal dev group "corp-dev-*". This pattern was verified against 30 days of historical data.',
    fullReasoning: {
      summary: 'AutoDEX surfaced a persistent false positive pattern on developer workstations driven by legitimate IDE and build tooling, and proposed a scoped exception pending analyst approval.',
      diagnosis: [
        'The rule "Unusual Execution via Microsoft Common Console File" generated 210 alerts over 7 days. AutoDEX clustered the alert data and found 94% (197 alerts) shared the process lineage: devenv.exe or msbuild.exe → mmc.exe → cmd.exe. All affected machines were developer workstations in the corp-dev-* Active Directory OU.',
        'The behaviour is explained by Visual Studio\'s use of MMC snap-ins during project build and deployment pipelines. This is a documented false positive class for this rule type and is consistent with patterns observed across multiple Elastic Security customer telemetry cohorts.',
        'The 6% of remaining alerts (13) showed mmc.exe spawned by unexpected parent processes including a cloud sync daemon and a browser process — these were flagged as higher-interest detections.',
      ],
      decision: [
        'This action requires approval because the automation level for false positive tuning is set to Semi-auto. AutoDEX has proposed the exception but will not apply it without analyst sign-off.',
        'Proposed exception scope: user.name: corp-dev-* — this targets the Active Directory group containing all developer workstations, ensuring the exception does not apply to production or server hosts where mmc.exe spawned by devenv.exe would be genuinely suspicious.',
        'If approved, the expected reduction is ~197 alerts/week. AutoDEX will continue monitoring the remaining 13 alerts and will escalate if the pattern changes.',
      ],
      confidence: 91,
      riskLevel: 'Medium — requires approval',
      changesMade: ['Proposed exception (pending approval): user.name = "corp-dev-*"'],
      relatedMitreIds: ['T1218.014 — System Binary Proxy Execution: MMC'],
    },
    status: 'success' as const,
    needsApproval: true,
  },
  {
    id: '4',
    timestamp: 'Apr 15, 2026 @ 13:40:29',
    action: 'Installed rule',
    actionColor: 'primary' as const,
    rule: 'AWS IAM Assume Role Policy Update',
    reasoning: 'Your environment has AWS CloudTrail data in logs-aws.cloudtrail-*. This prebuilt rule covers T1078.004 (Cloud Accounts) which was identified as a coverage gap. AutoDEX installed and enabled it.',
    fullReasoning: {
      summary: 'AutoDEX identified a MITRE ATT&CK coverage gap for T1078.004 (Cloud Accounts) and automatically installed the corresponding Elastic prebuilt rule after verifying data availability and absence of conflicts.',
      diagnosis: [
        'A periodic coverage audit found that T1078.004 (Valid Accounts: Cloud Accounts) had no active detection rules in the current ruleset. This technique is frequently used in AWS account takeover attacks and was flagged as a high-priority gap given your environment\'s active AWS footprint.',
        'AutoDEX confirmed that CloudTrail logs are actively flowing into logs-aws.cloudtrail-* with a write rate of ~12,000 events/hour. The prebuilt rule "AWS IAM Assume Role Policy Update" targets this index and requires no additional configuration.',
        'AutoDEX verified that no existing rules or suppression lists would conflict with the new rule, and that the rule\'s required fields (event.action, aws.cloudtrail.request_parameters) are present in the data.',
      ],
      decision: [
        'AutoDEX selected the Elastic prebuilt rule over writing a custom rule because the prebuilt version is maintained by Elastic Security Labs, receives automatic updates, and already includes tuned thresholds based on CloudTrail baseline behaviour.',
        'The rule was installed at severity "Medium" with the default schedule of every 5 minutes and a look-back of 9 minutes. AutoDEX enabled it immediately given the active data stream and absence of any known noise concerns.',
        'No approval was required as the automation level for rule installation is set to Full auto.',
      ],
      confidence: 99,
      riskLevel: 'Low',
      changesMade: ['Installed rule: AWS IAM Assume Role Policy Update (v1.0.2)', 'Status: Enabled', 'Severity: Medium'],
      relatedMitreIds: ['T1078.004 — Valid Accounts: Cloud Accounts'],
    },
    status: 'success' as const,
    needsApproval: false,
  },
  {
    id: '5',
    timestamp: 'Apr 15, 2026 @ 13:38:02',
    action: 'Updated rule',
    actionColor: 'primary' as const,
    rule: 'Potential Widespread Malware Infection Across Multiple Hosts',
    reasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update after verifying no active suppressions would be affected.',
    fullReasoning: {
      summary: 'AutoDEX applied an Elastic Security Labs patch update to address a known false positive issue with legitimate antivirus processes, after verifying the change would not disrupt any active exceptions or suppressions.',
      diagnosis: [
        'Elastic Security Labs published rule version 3.3 for "Potential Widespread Malware Infection Across Multiple Hosts". The changelog described a fix for false positives triggered by Windows Defender\'s MsMpEng.exe and similar AV scanning processes that share network spread patterns with lateral movement malware.',
        'AutoDEX reviewed the diff between v3.2 and v3.3. The key change was an additional filter clause: NOT (process.name: ("MsMpEng.exe" OR "SentinelAgent.exe" OR "CylanceSvc.exe")). This narrows the detection to exclude known AV processes while preserving coverage for actual malware propagation.',
        'AutoDEX checked whether any existing exceptions or suppressions in your environment overlapped with the new built-in filter. No conflicts were found — the new exclusions are more specific than any custom suppression currently in place.',
      ],
      decision: [
        'The update was categorised as low-risk because it narrows detection scope (reducing false positives) rather than broadening it. A broadening change would require additional review.',
        'AutoDEX applied the update with no changes to the rule\'s schedule, severity, or index pattern. Version history was preserved in the audit log.',
        'This action required approval under the current Semi-auto configuration. AutoDEX has logged the update for analyst review but applied it immediately due to the low-risk, false-positive-reducing nature of the change.',
      ],
      confidence: 97,
      riskLevel: 'Low',
      changesMade: ['Updated rule version: 3.2 → 3.3', 'Added process exclusions for MsMpEng.exe, SentinelAgent.exe, CylanceSvc.exe'],
      relatedMitreIds: ['T1210 — Exploitation of Remote Services', 'T1570 — Lateral Tool Transfer'],
    },
    status: 'success' as const,
    needsApproval: true,
  },
];

// ─── AutoDEX Strip ────────────────────────────────────────────────────────────

interface AutoDexStripProps {
  autoDex: DetectionSummaryPanelProps['autoDex'];
  autoDexState: 'off' | 'running' | 'healthy';
  onToggle: () => void;
  onOpenAIAssistant: (prompt: string) => void;
}

const AutoDexStrip: React.FC<AutoDexStripProps> = ({ autoDex, autoDexState, onToggle, onOpenAIAssistant }) => {
  const { fixedCount, tunedCount, installedCount, updatedCount } = autoDex;
  const isOn = autoDexState !== 'off';
  const isHealthy = autoDexState === 'healthy';

  // Configure modal state
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [autoFixFailures, setAutoFixFailures] = useState(true);
  const [autoTuneNoise, setAutoTuneNoise] = useState(true);
  const [autoInstallRules, setAutoInstallRules] = useState(true);
  const [autoUpdateRules, setAutoUpdateRules] = useState(true);
  const [levelFixFailures, setLevelFixFailures] = useState(3);
  const [levelTuneNoise, setLevelTuneNoise] = useState(3);
  const [levelInstallRules, setLevelInstallRules] = useState(3);
  const [levelUpdateRules, setLevelUpdateRules] = useState(3);

  // View logs flyout state
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [approvalPopoverOpen, setApprovalPopoverOpen] = useState<Record<string, boolean>>({});
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [fullReasoningLogId, setFullReasoningLogId] = useState<string | null>(null);
  const toggleApprovalPopover = (id: string) => setApprovalPopoverOpen(prev => ({ ...prev, [id]: !prev[id] }));
  const decide = (id: string, decision: 'approved' | 'dismissed') => {
    setApprovalDecisions(prev => ({ ...prev, [id]: decision }));
    setApprovalPopoverOpen(prev => ({ ...prev, [id]: false }));
  };
  const [typeFilterOptions, setTypeFilterOptions] = useState([
    { label: 'Fixed execution failure' },
    { label: 'Tuned false positives' },
    { label: 'Installed rule' },
    { label: 'Updated rule' },
  ]);

  const metrics = [
    {
      label: `${fixedCount} failing rules fixed`,
      status: 'progress' as const,
      prompt: 'Show me the rules AutoDEX fixed automatically and what changes were made',
    },
    {
      label: `${tunedCount} rules tuned with new exceptions`,
      status: 'complete' as const,
      prompt: `Show me the ${tunedCount} rules AutoDEX tuned with new exceptions and the reasoning for each`,
    },
    {
      label: `${installedCount} new Elastic rules installed`,
      status: 'complete' as const,
      prompt: `Show me the ${installedCount} new Elastic rules AutoDEX installed and why they were selected`,
    },
    {
      label: `${updatedCount} Elastic rules updated`,
      status: 'complete' as const,
      prompt: `Show me the ${updatedCount} Elastic rules AutoDEX updated and what changed`,
    },
  ];

  const divider = '1px solid #d3dae6';

  // Approval mode: true when at least one automation level is NOT full-auto
  const requiresApproval = levelFixFailures < 3 || levelTuneNoise < 3 || levelInstallRules < 3 || levelUpdateRules < 3;
  const pendingApprovalCount = MOCK_LOGS.filter(l => l.needsApproval && !approvalDecisions[l.id]).length;

  return (
    <>
    {/* ── Configure modal ──────────────────────────────────────────── */}
    {isConfigureOpen && (
      <EuiModal onClose={() => setIsConfigureOpen(false)} style={{ width: 672 }}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}><EuiIcon type="sparkles" color="#7B61FF" /></EuiFlexItem>
              <EuiFlexItem>AutoDEX Configuration</EuiFlexItem>
            </EuiFlexGroup>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiHorizontalRule margin="none" />

        <EuiModalBody>
          <EuiSpacer size="xl" />
          <EuiTitle size="s"><h3>Automation scope</h3></EuiTitle>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">Choose which actions AutoDEX can perform automatically.</EuiText>
          <EuiSpacer size="l" />

          {[
            { label: 'Fix execution failures', desc: 'Automatically resolve index pattern mismatches and query errors.', value: autoFixFailures, set: setAutoFixFailures, level: levelFixFailures, setLevel: setLevelFixFailures },
            { label: 'Tune high false positive rules', desc: 'Add exceptions and threshold adjustments based on alert patterns.', value: autoTuneNoise, set: setAutoTuneNoise, level: levelTuneNoise, setLevel: setLevelTuneNoise },
            { label: 'Install new Elastic prebuilt rules', desc: 'Install rules that fill detected MITRE coverage gaps.', value: autoInstallRules, set: setAutoInstallRules, level: levelInstallRules, setLevel: setLevelInstallRules },
            { label: 'Update existing Elastic rules', desc: 'Apply new versions of installed prebuilt rules automatically.', value: autoUpdateRules, set: setAutoUpdateRules, level: levelUpdateRules, setLevel: setLevelUpdateRules },
          ].map(({ label, desc, value, set, level, setLevel }, i, arr) => (
            <div key={label} style={{ marginBottom: i < arr.length - 1 ? 28 : 8 }}>
              {/* Toggle + label */}
              <EuiSwitch label={<strong>{label}</strong>} checked={value} onChange={e => set(e.target.checked)} />
              {/* Description */}
              <EuiText size="s" color="subdued" style={{ marginTop: 4, marginLeft: 44, marginBottom: 16 }}>{desc}</EuiText>
              {/* Per-item automation level */}
              <div style={{ marginLeft: 44 }}>
                <EuiText size="s" style={{ fontWeight: 700, marginBottom: 8 }}>Automation level</EuiText>
                <EuiRange
                  min={1}
                  max={3}
                  value={level}
                  onChange={e => setLevel(Number((e.target as HTMLInputElement).value))}
                  showTicks
                  tickInterval={1}
                  ticks={[
                    { label: 'Suggest only', value: 1 },
                    { label: 'Semi-auto', value: 2 },
                    { label: 'Full auto', value: 3 },
                  ]}
                  fullWidth
                  disabled={!value}
                />
                <EuiSpacer size="s" />
                <EuiText size="xs" color="subdued">
                  {level === 1 && 'AutoDEX will only surface recommendations. No changes are made without your approval.'}
                  {level === 2 && 'AutoDEX applies low-risk changes automatically and queues high-risk actions for your approval.'}
                  {level === 3 && 'AutoDEX applies all changes automatically. You can review them in the logs at any time.'}
                </EuiText>
              </div>
            </div>
          ))}
          <EuiSpacer size="xl" />
        </EuiModalBody>

        <EuiHorizontalRule margin="none" />
        <EuiModalFooter>
          <EuiButtonEmpty onClick={() => setIsConfigureOpen(false)}>Cancel</EuiButtonEmpty>
          <EuiButton fill color="primary" onClick={() => setIsConfigureOpen(false)}>
            Save configuration
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    )}

    {/* ── View logs flyout ─────────────────────────────────────────── */}
    {isLogsOpen && (
      <EuiFlyout
        onClose={() => { setIsLogsOpen(false); setFullReasoningLogId(null); }}
        size={fullReasoningLogId ? 960 : 480}
        ownFocus={false}
        style={{ transition: 'width 0.25s ease' }}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem>
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
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>

        {/* Two-column body: left = full reasoning (when open), right = log list */}
        <EuiFlyoutBody style={{ padding: 0 }}>
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* ── LEFT: Full reasoning panel ────────────────────────── */}
            {fullReasoningLogId && (() => {
              const frLog = MOCK_LOGS.find(l => l.id === fullReasoningLogId);
              if (!frLog || !frLog.fullReasoning) return null;
              const fr = frLog.fullReasoning;
              return (
                <div style={{
                  width: 500,
                  flexShrink: 0,
                  borderRight: '1px solid #E3E8F2',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: '#fff',
                }}>
                  {/* Left panel sub-header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #E3E8F2', flexShrink: 0 }}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 4 }}>
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="chevronLimitLeft" size="m" color="primary" />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiTitle size="xs"><h3>Full reasoning</h3></EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType="cross"
                          aria-label="Close full reasoning"
                          size="xs"
                          color="subdued"
                          onClick={() => setFullReasoningLogId(null)}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiText size="xs" color="subdued">{frLog.action} · {frLog.timestamp}</EuiText>
                  </div>

                  {/* Left panel scrollable content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
                    <EuiText size="s" style={{ fontWeight: 700, marginBottom: 6 }}>{frLog.rule}</EuiText>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 20 }}>
                      <EuiFlexItem grow={false}><EuiBadge color={frLog.actionColor}>{frLog.action}</EuiBadge></EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiBadge color={fr.riskLevel.startsWith('Low') ? 'success' : fr.riskLevel.startsWith('Medium') ? 'warning' : 'danger'}>
                          {fr.riskLevel}
                        </EuiBadge>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">Confidence: <strong>{fr.confidence}%</strong></EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>

                    {/* AI summary */}
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6, marginBottom: 20, background: 'linear-gradient(135deg, rgba(217,232,255,0.2) 0%, rgba(236,226,254,0.2) 100%)' }}>
                      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
                        <EuiFlexItem grow={false}><EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                        <EuiFlexItem><EuiText size="s" style={{ fontWeight: 700, color: '#7B61FF' }}>AI summary</EuiText></EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="s">{fr.summary}</EuiText>
                    </EuiPanel>

                    <EuiTitle size="xs"><h4 style={{ marginBottom: 10 }}>Diagnosis</h4></EuiTitle>
                    {fr.diagnosis.map((para, idx) => (
                      <EuiText key={idx} size="s" style={{ marginBottom: 10, color: '#343741' }}><p>{para}</p></EuiText>
                    ))}

                    <EuiHorizontalRule margin="m" />

                    <EuiTitle size="xs"><h4 style={{ marginBottom: 10 }}>Decision rationale</h4></EuiTitle>
                    {fr.decision.map((para, idx) => (
                      <EuiText key={idx} size="s" style={{ marginBottom: 10, color: '#343741' }}><p>{para}</p></EuiText>
                    ))}

                    <EuiHorizontalRule margin="m" />

                    <EuiTitle size="xs"><h4 style={{ marginBottom: 10 }}>Changes made</h4></EuiTitle>
                    {fr.changesMade.map((change, idx) => (
                      <EuiPanel key={idx} hasBorder hasShadow={false} paddingSize="s" style={{ borderRadius: 4, marginBottom: 8, background: '#F5F7FA', borderLeft: '3px solid #0077CC' }}>
                        <EuiText size="xs" style={{ fontFamily: 'monospace', color: '#343741' }}>{change}</EuiText>
                      </EuiPanel>
                    ))}

                    <EuiHorizontalRule margin="m" />

                    <EuiTitle size="xs"><h4 style={{ marginBottom: 10 }}>Related MITRE ATT&CK™</h4></EuiTitle>
                    {fr.relatedMitreIds.map((m, idx) => (
                      <EuiBadge key={idx} color="hollow" style={{ marginRight: 6, marginBottom: 6 }}>{m}</EuiBadge>
                    ))}

                    <EuiSpacer size="l" />

                    <EuiButtonEmpty
                      iconType="productAgent"
                      style={{ color: '#7B61FF' }}
                      onClick={() => onOpenAIAssistant(`Explain the full AutoDEX reasoning for: ${frLog.action} on rule "${frLog.rule}"`)}
                    >
                      Add to chat
                    </EuiButtonEmpty>
                  </div>
                </div>
              );
            })()}

            {/* ── RIGHT: Log list (always visible) ────────────────── */}
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 24px' }}>
          {/* Search + Type filter */}
          <EuiFlexGroup gutterSize="s" responsive={false} style={{ marginBottom: 16 }}>
            <EuiFlexItem>
              <EuiFieldSearch
                placeholder="Search logs..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                isClearable
                fullWidth
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFilterGroup>
                <EuiPopover
                  button={
                    <EuiFilterButton
                      iconType="filter"
                      onClick={() => setIsTypePopoverOpen(!isTypePopoverOpen)}
                      isSelected={isTypePopoverOpen}
                      numFilters={typeFilterOptions.length}
                      hasActiveFilters={typeFilterOptions.some((o: any) => o.checked === 'on')}
                      numActiveFilters={typeFilterOptions.filter((o: any) => o.checked === 'on').length}
                    >
                      Type
                    </EuiFilterButton>
                  }
                  isOpen={isTypePopoverOpen}
                  closePopover={() => setIsTypePopoverOpen(false)}
                  panelPaddingSize="none"
                >
                  <EuiSelectable
                    searchable
                    searchProps={{ placeholder: 'Filter list', compressed: true }}
                    options={typeFilterOptions}
                    onChange={opts => setTypeFilterOptions(opts)}
                  >
                    {(list, search) => (
                      <div style={{ width: 260 }}>
                        <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
                        {list}
                      </div>
                    )}
                  </EuiSelectable>
                </EuiPopover>
              </EuiFilterGroup>
            </EuiFlexItem>
          </EuiFlexGroup>

          {(() => {
            const activeTypes = typeFilterOptions.filter((o: any) => o.checked === 'on').map(o => o.label);
            const filtered = MOCK_LOGS.filter(log => {
              const matchesSearch = !logSearch || log.rule.toLowerCase().includes(logSearch.toLowerCase()) || log.action.toLowerCase().includes(logSearch.toLowerCase());
              const matchesType = activeTypes.length === 0 || activeTypes.includes(log.action);
              return matchesSearch && matchesType;
            });
            return filtered.length === 0 ? (
              <EuiText textAlign="center" color="subdued"><p>No logs match your filters.</p></EuiText>
            ) : filtered.map((log, i) => {
              const decision = approvalDecisions[log.id];
              const isApprovalOpen = !!approvalPopoverOpen[log.id];
              const pendingApproval = requiresApproval && log.needsApproval && !decision;
              return (
              <div key={log.id}>
                {/* Row 1: icon + badge + timestamp + [approval button] */}
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon
                      type={pendingApproval ? 'warning' : decision === 'approved' ? 'checkInCircleFilled' : decision === 'dismissed' ? 'minusInCircle' : 'checkInCircleFilled'}
                      color={pendingApproval ? 'warning' : decision === 'approved' ? 'success' : decision === 'dismissed' ? 'subdued' : 'success'}
                      size="s"
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color={log.actionColor}>{log.action}</EuiBadge>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs" color="subdued">{log.timestamp}</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={true} />
                  {/* Approval button — only when NOT full-auto and entry needs approval */}
                  {requiresApproval && log.needsApproval && (
                    <EuiFlexItem grow={false}>
                      {!decision ? (
                        <EuiPopover
                          isOpen={isApprovalOpen}
                          closePopover={() => setApprovalPopoverOpen(prev => ({ ...prev, [log.id]: false }))}
                          button={
                            <EuiButtonEmpty
                              size="xs"
                              iconType="arrowDown"
                              iconSide="right"
                              color="primary"
                              onClick={() => toggleApprovalPopover(log.id)}
                              style={{
                                border: '1px solid #D3DAE6',
                                borderRadius: 4,
                                paddingLeft: 8,
                                paddingRight: 8,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Approval required
                            </EuiButtonEmpty>
                          }
                          panelPaddingSize="none"
                          anchorPosition="downRight"
                        >
                          <div style={{ minWidth: 160 }}>
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '10px 16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: '#007871',
                                fontWeight: 500,
                              }}
                              onClick={() => decide(log.id, 'approved')}
                            >
                              <EuiIcon type="checkInCircleFilled" color="success" size="s" />
                              Approve
                            </button>
                            <div style={{ borderTop: '1px solid #E3E8F2' }} />
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '10px 16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: '#BD271E',
                                fontWeight: 500,
                              }}
                              onClick={() => decide(log.id, 'dismissed')}
                            >
                              <EuiIcon type="minusInCircle" color="danger" size="s" />
                              Dismiss
                            </button>
                          </div>
                        </EuiPopover>
                      ) : (
                        <EuiBadge
                          color={decision === 'approved' ? 'success' : 'default'}
                          iconType={decision === 'approved' ? 'checkInCircleFilled' : 'minusInCircle'}
                        >
                          {decision === 'approved' ? 'Approved' : 'Dismissed'}
                        </EuiBadge>
                      )}
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>

                {/* Row 2: rule name bold */}
                <EuiText size="s" style={{ fontWeight: 700, marginBottom: 10 }}>{log.rule}</EuiText>

                {/* Row 3: reasoning summary panel */}
                <EuiPanel
                  hasBorder
                  hasShadow={false}
                  paddingSize="m"
                  style={{ borderRadius: 6, background: '#F7F9FF', marginBottom: 10 }}
                >
                  <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 6 }}>
                    Reasoning summary
                  </EuiText>
                  <EuiText size="s" style={{ marginBottom: 10 }}>{log.reasoning}</EuiText>
                  <EuiButtonEmpty
                    size="xs"
                    iconType="chevronLimitLeft"
                    color="primary"
                    flush="left"
                    onClick={() => setFullReasoningLogId(log.id)}
                  >
                    Full reasoning
                  </EuiButtonEmpty>
                </EuiPanel>

                {/* Row 4: Add to chat only */}
                <EuiFlexGroup gutterSize="s" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      size="xs"
                      iconType="productAgent"
                      flush="left"
                      style={{ color: '#7B61FF' }}
                      onClick={() => onOpenAIAssistant(`Tell me more about the AutoDEX action: ${log.action} on rule "${log.rule}"`)}
                    >
                      Add to chat
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {i < filtered.length - 1 && <EuiHorizontalRule margin="m" />}
              </div>
              );
            });
          })()}
            </div>{/* end right log list */}
          </div>{/* end two-column flex */}
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
      style={{ marginTop: 16, border: '1px solid #E3E8F2', borderLeft: '3px solid #7B61FF', overflow: 'hidden' }}
    >
      <EuiFlexGroup gutterSize="none" alignItems={isOn ? 'stretch' : 'center'} responsive={false}>

        {/* Anchor column — faint AI gradient background */}
        <EuiFlexItem
          grow={false}
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, rgba(217,232,255,0.35) 0%, rgba(236,226,254,0.35) 100%)',
            borderRight: divider,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top — name + toggle */}
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ flex: 1 }}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>AutoDEX</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSwitch label={isOn ? 'On' : 'Off'} checked={isOn} onChange={onToggle} compressed />
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Bottom — controls pinned to base */}
          <EuiFlexGroup gutterSize="none" responsive={false} style={{ marginTop: 'auto', paddingTop: 8 }}>
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

        {/* Off state — no events */}
        {!isOn && (
          <EuiFlexItem style={{ paddingLeft: 24 }}>
            <EuiText size="s" color="subdued">No events to show</EuiText>
          </EuiFlexItem>
        )}

        {/* Metric columns — only when on */}
        {isOn && metrics.map((m, i) => (
          <EuiFlexItem
            key={m.label}
            grow={false}
            style={{
              padding: '16px 28px 16px 24px',
              borderRight: (i < metrics.length - 1 || requiresApproval) ? divider : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >

            {/* Label + inline status icon */}
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ whiteSpace: 'nowrap' }}>{m.label}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {isHealthy
                  ? <EuiIcon type="checkInCircleFilled" size="s" color="success" />
                  : <EuiIcon type="clock" size="s" color="primary" />}
              </EuiFlexItem>
            </EuiFlexGroup>

            {/* View details pinned to base */}
            <div style={{ marginTop: 'auto' }}>
              <EuiButtonEmpty
                size="xs"
                iconType="maximize"
                color="primary"
                flush="left"
                style={{ marginLeft: 0, paddingLeft: 0 }}
                onClick={() => onOpenAIAssistant(m.prompt)}
              >
                View details
              </EuiButtonEmpty>
            </div>
          </EuiFlexItem>
        ))}

        {/* Approval needed cell — only when semi/suggest-only mode is active */}
        {isOn && requiresApproval && (
          <EuiFlexItem
            grow={false}
            style={{
              padding: '16px 28px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minWidth: 180,
            }}
          >
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#BD271E' }}>
                  {pendingApprovalCount} action{pendingApprovalCount !== 1 ? 's' : ''} need{pendingApprovalCount === 1 ? 's' : ''} approval
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(189, 39, 30, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <EuiIcon type="warning" size="s" color="danger" />
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>

            <div style={{ marginTop: 'auto' }}>
              <EuiButtonEmpty
                size="xs"
                iconType="popout"
                iconSide="left"
                color="primary"
                flush="left"
                style={{ marginLeft: 0, paddingLeft: 0 }}
                onClick={() => setIsLogsOpen(true)}
              >
                View actions to approve
              </EuiButtonEmpty>
            </div>
          </EuiFlexItem>
        )}

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
  // 'off' | 'running' | 'healthy'
  const [autoDexState, setAutoDexState] = useState<'off' | 'running' | 'healthy'>('off');

  const toggleDrill = (cat: NonNullable<DrillCategory>) => {
    setOpenDrill(prev => (prev === cat ? null : cat));
    onViewRules(cat);
  };

  const handleAutoDexToggle = () => {
    if (autoDexState === 'off') {
      setAutoDexState('running');
      setTimeout(() => setAutoDexState('healthy'), 12000);
    } else {
      setAutoDexState('off');
    }
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
      {/* ── Four signal cards ─────────────────────────────────────── */}
      <EuiFlexGroup gutterSize="m" responsive={false} alignItems="stretch">

        {/* Card 1 — Execution failures */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : '#BD271E'}
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
          />
        </EuiFlexItem>

        {/* Card 2 — False positive rate */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : '#F5A700'}
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
          />
        </EuiFlexItem>

        {/* Card 3 — Gaps detected */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : '#F5A700'}
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
          />
        </EuiFlexItem>

        {/* Card 4 — Rule updates */}
        <EuiFlexItem grow={1}>
          <SignalCard
            accentColor={isHealthy ? '#017D73' : '#0077CC'}
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
      <AutoDexStrip
        autoDex={{ ...autoDex, isRunning: isOn }}
        autoDexState={autoDexState}
        onToggle={handleAutoDexToggle}
        onOpenAIAssistant={onOpenAIAssistant}
      />
    </div>
  );
};

export default DetectionSummaryPanel;
