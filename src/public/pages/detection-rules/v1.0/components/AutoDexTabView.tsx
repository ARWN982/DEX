import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiPanel,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import AutoDexActivityLog from './AutoDexActivityLog';
import AutoDexApprovalsPanel from './AutoDexApprovalsPanel';
import { MOCK_AUTODEX_LOGS } from './autoDexMockData';

export interface AutoDexTabViewProps {
  onOpenAIAssistant: (prompt: string) => void;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ManagedRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastAction: string;
  lastActionDate: string;
  lastActionReasoning: string;
  status: 'enabled' | 'disabled';
  mitre: string;
  tactic: string;
  ruleType: string;
  query: string;
  indexPatterns: string[];
  description: string;
  author: string;
  riskScore: number;
  license: string;
  maxAlertsPerRun: number;
  tags: string[];
  relatedIntegrations: { name: string; enabled: boolean }[];
  requiredFields: string[];
}

interface CoverageGap {
  id: string;
  techniqueId: string;
  technique: string;
  tactic: string;
  status: 'in_progress' | 'scheduled' | 'completed';
  progress: number;
  eta: string;
  note: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MANAGED_RULES: ManagedRule[] = [
  {
    id: 'r1', name: 'Unusual Network Destination Domain Name', severity: 'high',
    lastAction: 'Fixed execution failure', lastActionDate: 'Apr 15, 2026',
    lastActionReasoning: 'Rule was timing out due to a missing index alias. AutoDEX updated the index pattern from logs-endpoint.* to logs-endpoint.events.* to match the installed data stream.',
    status: 'enabled', mitre: 'T1071.001', tactic: 'Command and Control',
    ruleType: 'ES|QL',
    query: 'FROM logs-endpoint.events.*\n| WHERE event.type == "network"\n| STATS count = COUNT() BY dns.question.name\n| WHERE count < 3',
    indexPatterns: ['logs-endpoint.events.process-*', 'logs-system.security*', 'winlogbeat-*'],
    description: 'A request to a web application server contained no identifying user agent string.',
    author: 'Elastic', riskScore: 47, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['Domain Generation', 'Network', 'Threat Detection'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }, { name: 'Network Packet Capture', enabled: true }],
    requiredFields: ['event.type', 'File.path'],
  },
  {
    id: 'r2', name: 'Potential PowerShell HackTool Script by Author', severity: 'high',
    lastAction: 'Tuned false positives', lastActionDate: 'Apr 15, 2026',
    lastActionReasoning: 'Rule generated 340 alerts/week with 98% originating from backup-agent process. AutoDEX added an exception for process.name: "backup-agent.exe" on host groups matching "backup-*".',
    status: 'enabled', mitre: 'T1059.001', tactic: 'Execution',
    ruleType: 'Query',
    query: 'event.category:process and host.os.type:windows and\nprocess.name:powershell.exe and\nprocess.args:(-nop or -NoProfile)',
    indexPatterns: ['logs-endpoint.events.process-*', 'logs-system.security*', 'winlogbeat-*'],
    description: 'Identifies PowerShell scripts that contain the signatures of known HackTool authors.',
    author: 'Elastic', riskScore: 73, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['PowerShell', 'Execution', 'Windows'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }, { name: 'Windows', enabled: false }],
    requiredFields: ['event.category', 'process.name', 'process.args'],
  },
  {
    id: 'r3', name: 'Unusual Execution via Microsoft Common Console File', severity: 'medium',
    lastAction: 'Tuned false positives', lastActionDate: 'Apr 15, 2026',
    lastActionReasoning: '210 alerts/week — 94% from developer workstations. Added exception for user.name matching "corp-dev-*". Pattern verified against 30 days of historical data.',
    status: 'enabled', mitre: 'T1218.014', tactic: 'Defense Evasion',
    ruleType: 'Query',
    query: 'event.category:process and host.os.type:windows and\nprocess.name:mmc.exe and\nnot process.parent.name:(mmc.exe or explorer.exe)',
    indexPatterns: ['logs-endpoint.events.process-*', 'winlogbeat-*'],
    description: 'Identifies execution of mmc.exe with suspicious parent processes that may indicate lateral movement.',
    author: 'Elastic', riskScore: 47, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['Defense Evasion', 'Windows', 'Living off the Land'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }],
    requiredFields: ['event.category', 'process.name', 'process.parent.name'],
  },
  {
    id: 'r4', name: 'AWS IAM Assume Role Policy Update', severity: 'medium',
    lastAction: 'Installed rule', lastActionDate: 'Apr 15, 2026',
    lastActionReasoning: 'Your environment has AWS CloudTrail data in logs-aws.cloudtrail-*. This prebuilt rule covers T1078.004 (Cloud Accounts) which was identified as a coverage gap.',
    status: 'enabled', mitre: 'T1078.004', tactic: 'Persistence',
    ruleType: 'Query',
    query: 'event.dataset:aws.cloudtrail and\nevent.provider:iam.amazonaws.com and\nevent.action:UpdateAssumeRolePolicy and\nevent.outcome:success',
    indexPatterns: ['logs-aws.cloudtrail-*'],
    description: 'Identifies when an IAM assume role policy is updated, which may indicate privilege escalation or persistence in AWS.',
    author: 'Elastic', riskScore: 21, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['AWS', 'IAM', 'Persistence', 'Cloud'],
    relatedIntegrations: [{ name: 'AWS', enabled: true }],
    requiredFields: ['event.dataset', 'event.action', 'event.outcome'],
  },
  {
    id: 'r5', name: 'Potential Widespread Malware Infection Across Multiple Hosts', severity: 'critical',
    lastAction: 'Updated rule', lastActionDate: 'Apr 15, 2026',
    lastActionReasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update after verifying no active suppressions.',
    status: 'enabled', mitre: 'T1210', tactic: 'Lateral Movement',
    ruleType: 'Threshold',
    query: 'event.category:process and event.type:start and\nnot process.name:(MsMpEng.exe or SentinelAgent.exe or CylanceSvc.exe)',
    indexPatterns: ['logs-endpoint.events.process-*'],
    description: 'Identifies a potential widespread malware infection by detecting the same process spawning across many endpoints in a short time window.',
    author: 'Elastic', riskScore: 99, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['Malware', 'Lateral Movement', 'Threat Detection'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }],
    requiredFields: ['event.category', 'process.name', 'host.name'],
  },
  {
    id: 'r6', name: 'Windows Registry Modification via reg.exe', severity: 'medium',
    lastAction: 'Tuned false positives', lastActionDate: 'Apr 14, 2026',
    lastActionReasoning: 'Rule generating noise from legitimate IT deployment scripts. AutoDEX identified 3 known installer processes and added targeted exceptions reducing false positives by 76%.',
    status: 'enabled', mitre: 'T1112', tactic: 'Defense Evasion',
    ruleType: 'Query',
    query: 'event.category:process and host.os.type:windows and\nprocess.name:reg.exe and process.args:add',
    indexPatterns: ['logs-endpoint.events.process-*', 'winlogbeat-*'],
    description: 'Identifies use of reg.exe to add registry keys, which may indicate persistence or defense evasion.',
    author: 'Elastic', riskScore: 47, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['Registry', 'Defense Evasion', 'Windows', 'Persistence'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }, { name: 'Windows', enabled: true }],
    requiredFields: ['event.category', 'process.name', 'process.args'],
  },
  {
    id: 'r7', name: 'Suspicious PowerShell Engine ImageLoad', severity: 'high',
    lastAction: 'Fixed execution failure', lastActionDate: 'Apr 14, 2026',
    lastActionReasoning: 'Rule was failing due to missing field mappings after an Elastic Agent policy update. AutoDEX corrected the index pattern and verified execution resumed successfully.',
    status: 'enabled', mitre: 'T1059.001', tactic: 'Execution',
    ruleType: 'Query',
    query: 'event.category:library and host.os.type:windows and\ndll.name:(system.management.automation.dll or\nsystem.management.automation.ni.dll)',
    indexPatterns: ['logs-endpoint.events.library-*'],
    description: 'Identifies the load of the PowerShell execution engine by processes other than PowerShell itself, indicating script-based execution evasion.',
    author: 'Elastic', riskScore: 47, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['PowerShell', 'Execution', 'Windows', 'In-memory'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }],
    requiredFields: ['event.category', 'dll.name'],
  },
  {
    id: 'r8', name: 'Potential SSH-IT SSH Worm Downloaded', severity: 'high',
    lastAction: 'Installed rule', lastActionDate: 'Apr 13, 2026',
    lastActionReasoning: 'Coverage gap identified for T1570 (Lateral Tool Transfer) in Linux environments. AutoDEX installed this prebuilt rule after confirming SSH audit logs are flowing.',
    status: 'enabled', mitre: 'T1570', tactic: 'Lateral Movement',
    ruleType: 'Query',
    query: 'event.category:network and host.os.type:linux and\ndestination.ip:* and source.port:22 and\nevent.type:connection',
    indexPatterns: ['logs-endpoint.events.network-*', 'auditbeat-*'],
    description: 'Detects the download of the SSH-IT SSH worm or similar SSH-propagating tools that spread laterally via SSH connection chains.',
    author: 'Elastic', riskScore: 73, license: 'Elastic Licence v2', maxAlertsPerRun: 100,
    tags: ['SSH', 'Lateral Movement', 'Linux', 'Worm'],
    relatedIntegrations: [{ name: 'Elastic Defend', enabled: true }],
    requiredFields: ['event.category', 'destination.ip', 'source.port'],
  },
];

const MOCK_COVERAGE_GAPS: CoverageGap[] = [
  { id: 'g1', techniqueId: 'T1055', technique: 'Process Injection', tactic: 'Defense Evasion', status: 'in_progress', progress: 65, eta: 'Est. 4 mins remaining', note: 'Evaluating 3 candidate prebuilt rules' },
  { id: 'g2', techniqueId: 'T1003', technique: 'OS Credential Dumping', tactic: 'Credential Access', status: 'in_progress', progress: 40, eta: 'Est. 7 mins remaining', note: 'Installing LSASS memory protection rule' },
  { id: 'g3', techniqueId: 'T1547', technique: 'Boot or Logon Autostart Execution', tactic: 'Persistence', status: 'in_progress', progress: 80, eta: 'Est. 2 mins remaining', note: 'Adding Registry Run Key detection rule' },
  { id: 'g4', techniqueId: 'T1021.002', technique: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement', status: 'in_progress', progress: 20, eta: 'Est. 12 mins remaining', note: 'Analysing data availability in your environment' },
  { id: 'g5', techniqueId: 'T1566', technique: 'Phishing', tactic: 'Initial Access', status: 'scheduled', progress: 0, eta: 'Scheduled: Apr 23, 2026', note: 'Awaiting email telemetry index confirmation' },
  { id: 'g6', techniqueId: 'T1190', technique: 'Exploit Public-Facing Application', tactic: 'Initial Access', status: 'scheduled', progress: 0, eta: 'Scheduled: Apr 24, 2026', note: 'Requires WAF log data stream' },
  { id: 'g7', techniqueId: 'T1485', technique: 'Data Destruction', tactic: 'Impact', status: 'completed', progress: 100, eta: 'Completed Apr 14, 2026', note: '2 prebuilt rules installed and enabled' },
  { id: 'g8', techniqueId: 'T1133', technique: 'External Remote Services', tactic: 'Persistence', status: 'completed', progress: 100, eta: 'Completed Apr 13, 2026', note: 'VPN anomaly detection rule installed' },
];

const GAP_SUMMARY_SEGMENTS = [
  { label: 'Filled', rules: 21, mins: 89, color: '#00BFB3' },
  { label: 'In-progress', rules: 16, mins: 35, color: '#6092C0' },
  { label: 'Unfilled', rules: 12, mins: 8, color: '#E7664C' },
  { label: 'Error', rules: 3, mins: 4, color: '#F5A700' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityColor = (s: ManagedRule['severity']): 'danger' | 'warning' | 'primary' | 'default' => {
  if (s === 'critical') return 'danger';
  if (s === 'high') return 'warning';
  if (s === 'medium') return 'primary';
  return 'default';
};

const gapStatusLabel = (s: CoverageGap['status']) =>
  s === 'in_progress' ? 'In progress' : s === 'scheduled' ? 'Scheduled' : 'Completed';

const gapStatusBadgeColor = (s: CoverageGap['status']): 'primary' | 'warning' | 'success' =>
  s === 'in_progress' ? 'primary' : s === 'scheduled' ? 'warning' : 'success';

// ─── SVG Donut chart ──────────────────────────────────────────────────────────

const GapDonutChart: React.FC = () => {
  const total = GAP_SUMMARY_SEGMENTS.reduce((sum, s) => sum + s.rules, 0);
  const totalMins = GAP_SUMMARY_SEGMENTS.reduce((sum, s) => sum + s.mins, 0);
  const r = 42;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 8, marginBottom: 20 }}>
      <EuiText size="s" style={{ fontWeight: 700, marginBottom: 16 }}>
        Rule gap summary
      </EuiText>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
          <svg width={128} height={128} viewBox="0 0 128 128">
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {GAP_SUMMARY_SEGMENTS.map((seg) => {
                const dash = (seg.rules / total) * circumference;
                const offset = -(cumulative / total) * circumference;
                cumulative += seg.rules;
                return (
                  <circle
                    key={seg.label}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={20}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                  />
                );
              })}
            </g>
          </svg>
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2, color: 'var(--euiTextColor)' }}>
              {totalMins} mins
            </div>
            <div style={{ fontSize: 11, color: '#69707D', lineHeight: 1.3 }}>Total duration</div>
          </div>
        </div>

        <table style={{ borderCollapse: 'collapse', flex: 1, minWidth: 200 }}>
          <thead>
            <tr>
              {['Gap fill status', 'Rules', 'Total gap duration'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left', fontSize: 12, fontWeight: 700,
                    color: 'var(--euiTextColor)', paddingBottom: 8,
                    paddingRight: h === 'Gap fill status' ? 24 : 16,
                    borderBottom: '1px solid #D3DAE6',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GAP_SUMMARY_SEGMENTS.map((seg) => (
              <tr key={seg.label}>
                <td style={{ padding: '7px 24px 7px 0', fontSize: 13, borderBottom: '1px solid #EEF0F3' }}>
                  <span
                    style={{
                      display: 'inline-block', width: 10, height: 10,
                      borderRadius: '50%', background: seg.color, marginRight: 8, verticalAlign: 'middle',
                    }}
                  />
                  {seg.label}
                </td>
                <td style={{ padding: '7px 16px 7px 0', fontSize: 13, color: 'var(--euiTextColor)', borderBottom: '1px solid #EEF0F3' }}>
                  {seg.rules}
                </td>
                <td style={{ padding: '7px 0', fontSize: 13, color: 'var(--euiTextColor)', borderBottom: '1px solid #EEF0F3' }}>
                  {seg.mins} mins
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EuiPanel>
  );
};

// ─── Flyout: managed rules (accordion) ───────────────────────────────────────

const RuleAccordionCard: React.FC<{
  rule: ManagedRule;
  isOpen: boolean;
  onToggle: () => void;
  onOpenAIAssistant: (prompt: string) => void;
}> = ({ rule, isOpen, onToggle, onOpenAIAssistant }) => {
  const tdLabel: React.CSSProperties = {
    padding: '7px 16px 7px 0', fontSize: 13, color: '#69707D',
    borderBottom: '1px solid #EEF0F3', whiteSpace: 'nowrap', verticalAlign: 'top',
  };
  const tdValue: React.CSSProperties = {
    padding: '7px 0', fontSize: 13, color: 'var(--euiTextColor)',
    borderBottom: '1px solid #EEF0F3', verticalAlign: 'top',
  };

  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="none" style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
      {/* Accordion header — full width clickable */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 16px', background: isOpen ? '#F0F4FF' : '#FAFBFD',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: isOpen ? '1px solid #D3DAE6' : 'none',
          transition: 'background 0.15s ease',
        }}
      >
        <svg
          width={14} height={14} viewBox="0 0 14 14"
          style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <path d="M4 2l6 5-6 5" fill="none" stroke="#69707D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--euiTextColor)', lineHeight: 1.3 }}>{rule.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <EuiBadge color={severityColor(rule.severity)}>{rule.severity}</EuiBadge>
            <EuiBadge color="hollow" style={{ fontFamily: 'monospace', fontSize: 11 }}>{rule.mitre}</EuiBadge>
            <span style={{ fontSize: 11, color: '#69707D' }}>{rule.tactic}</span>
          </div>
        </div>
        <EuiBadge color="success" style={{ flexShrink: 0 }}>{rule.status}</EuiBadge>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ padding: '16px 16px 12px' }}>

          {/* Rule conditions */}
          <EuiText size="s" style={{ fontWeight: 700, marginBottom: 10 }}>Rule conditions</EuiText>

          <EuiText size="xs" color="subdued" style={{ marginBottom: 2 }}>Rule type</EuiText>
          <EuiText size="s" style={{ marginBottom: 10 }}>{rule.ruleType}</EuiText>

          <EuiText size="xs" color="subdued" style={{ marginBottom: 4 }}>Query</EuiText>
          <div
            style={{
              background: '#F7F9FF', border: '1px solid var(--euiBorderColor)', borderRadius: 4,
              padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
              color: 'var(--euiTextColor)', whiteSpace: 'pre', overflowX: 'auto', marginBottom: 10,
            }}
          >
            {rule.query}
          </div>

          <EuiText size="xs" color="subdued" style={{ marginBottom: 6 }}>Index patterns</EuiText>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {rule.indexPatterns.map((p) => (
              <EuiBadge key={p} color="hollow" style={{ fontFamily: 'monospace', fontSize: 11 }}>{p}</EuiBadge>
            ))}
          </div>

          <EuiText size="xs" color="subdued" style={{ marginBottom: 2 }}>Description</EuiText>
          <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>{rule.description}</EuiText>

          <EuiHorizontalRule margin="s" />

          {/* Metadata table */}
          <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 16 }}>
            <tbody>
              {([
                ['Rule type', rule.ruleType],
                ['Author', rule.author],
                ['Severity', rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)],
                ['Risk score', String(rule.riskScore)],
                ['License', rule.license],
                ['Max alerts per run', String(rule.maxAlertsPerRun)],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label}>
                  <td style={tdLabel}>{label}</td>
                  <td style={tdValue}>
                    {label === 'Author' ? (
                      <span>🌐 {value}</span>
                    ) : label === 'Severity' ? (
                      <span>
                        <span
                          style={{
                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                            marginRight: 6, verticalAlign: 'middle',
                            background: rule.severity === 'critical' ? '#BD271E'
                              : rule.severity === 'high' ? '#F5A700'
                              : rule.severity === 'medium' ? '#0077CC' : '#69707D',
                          }}
                        />
                        {value}
                      </span>
                    ) : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tags */}
          <EuiText size="xs" color="subdued" style={{ marginBottom: 6 }}>Tags</EuiText>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {rule.tags.map((t) => <EuiBadge key={t} color="hollow">{t}</EuiBadge>)}
          </div>

          {/* Related integrations */}
          <EuiText size="xs" color="subdued" style={{ marginBottom: 8 }}>Related integrations</EuiText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {rule.relatedIntegrations.map((i) => (
              <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#0077CC' }}>{i.name}</span>
                <EuiBadge color={i.enabled ? 'success' : 'hollow'}>{i.enabled ? 'Enabled' : 'Disabled'}</EuiBadge>
              </div>
            ))}
          </div>

          {/* Required fields */}
          <EuiText size="xs" color="subdued" style={{ marginBottom: 6 }}>Required fields</EuiText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
            {rule.requiredFields.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#69707D', fontSize: 12, fontFamily: 'monospace' }}>F</span>
                <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--euiTextColor)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* MITRE ATT&CK */}
          <EuiText size="xs" color="subdued" style={{ marginBottom: 6 }}>MITRE ATT&amp;CK™</EuiText>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#0077CC', marginBottom: 2 }}>{rule.tactic}</div>
            <div style={{ paddingLeft: 12, fontSize: 13, color: '#0077CC' }}>└─ {rule.mitre}</div>
          </div>

          <EuiHorizontalRule margin="s" />

          {/* Last AutoDEX action */}
          <EuiText size="xs" color="subdued" style={{ marginBottom: 4 }}>
            Last AutoDEX action · {rule.lastAction} · {rule.lastActionDate}
          </EuiText>
          <EuiPanel hasBorder hasShadow={false} paddingSize="s" style={{ background: '#F7F9FF', borderRadius: 6, marginBottom: 10 }}>
            <EuiText size="s" color="subdued" style={{ fontStyle: 'italic', fontSize: 12 }}>
              {rule.lastActionReasoning}
            </EuiText>
          </EuiPanel>

          <EuiButtonEmpty
            size="xs" iconType="productAgent" flush="left"
            style={{ color: '#7B61FF' }}
            onClick={() => onOpenAIAssistant(`Tell me about AutoDEX actions on the rule "${rule.name}"`)}
          >
            Add to chat
          </EuiButtonEmpty>
        </div>
      )}
    </EuiPanel>
  );
};

const RulesFlyout: React.FC<{
  onClose: () => void;
  onOpenAIAssistant: (prompt: string) => void;
}> = ({ onClose, onOpenAIAssistant }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <EuiFlyout onClose={onClose} size="m" ownFocus={false}>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={true}>
            <EuiTitle size="s">
              <h2>AutoDEX-managed rules</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary">47 rules</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
          Detection rules currently managed or monitored by AutoDEX
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {MOCK_MANAGED_RULES.map((rule) => (
          <RuleAccordionCard
            key={rule.id}
            rule={rule}
            isOpen={expandedId === rule.id}
            onToggle={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
            onOpenAIAssistant={onOpenAIAssistant}
          />
        ))}
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued" textAlign="center">
          Showing 8 of 47 AutoDEX-managed rules
        </EuiText>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

// ─── Flyout: coverage gaps ────────────────────────────────────────────────────

const GapsFlyout: React.FC<{
  onClose: () => void;
  onOpenAIAssistant: (prompt: string) => void;
}> = ({ onClose, onOpenAIAssistant }) => {
  const inProgress = MOCK_COVERAGE_GAPS.filter((g) => g.status === 'in_progress').length;
  const scheduled = MOCK_COVERAGE_GAPS.filter((g) => g.status === 'scheduled').length;
  const completed = MOCK_COVERAGE_GAPS.filter((g) => g.status === 'completed').length;

  return (
    <EuiFlyout onClose={onClose} size="m" ownFocus={false}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2>Coverage gap filling</h2>
        </EuiTitle>
        <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
          AutoDEX is filling {MOCK_COVERAGE_GAPS.length} MITRE ATT&amp;CK coverage gaps across your environment
        </EuiText>
        <EuiFlexGroup gutterSize="s" responsive={false} style={{ marginTop: 10 }} wrap>
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary">{inProgress} in progress</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="warning">{scheduled} scheduled</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="success">{completed} completed</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <GapDonutChart />
        {MOCK_COVERAGE_GAPS.map((gap, i) => (
          <div key={gap.id}>
            <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={false}>
              <EuiFlexItem grow={true}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} wrap>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color="hollow" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {gap.techniqueId}
                    </EuiBadge>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" style={{ fontWeight: 600 }}>
                      {gap.technique}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs" color="subdued">
                      · {gap.tactic}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
                  {gap.note}
                </EuiText>
                {gap.status === 'in_progress' && (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: '#EDF0F5',
                        overflow: 'hidden',
                        maxWidth: 200,
                      }}
                    >
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: '#0077CC',
                          width: `${gap.progress}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <EuiText size="xs" color="subdued" style={{ marginTop: 2 }}>
                      {gap.progress}% · {gap.eta}
                    </EuiText>
                  </div>
                )}
                {gap.status !== 'in_progress' && (
                  <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
                    {gap.eta}
                  </EuiText>
                )}
                <div style={{ marginTop: 4 }}>
                  <EuiButtonEmpty
                    size="xs"
                    iconType="productAgent"
                    flush="left"
                    style={{ color: '#7B61FF' }}
                    onClick={() =>
                      onOpenAIAssistant(
                        `Tell me about the AutoDEX gap filling for MITRE technique ${gap.techniqueId} – ${gap.technique}`
                      )
                    }
                  >
                    Add to chat
                  </EuiButtonEmpty>
                </div>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ flexShrink: 0 }}>
                <EuiBadge color={gapStatusBadgeColor(gap.status)}>{gapStatusLabel(gap.status)}</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
            {i < MOCK_COVERAGE_GAPS.length - 1 && <EuiHorizontalRule margin="s" />}
          </div>
        ))}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

// ─── Token breakdown data ─────────────────────────────────────────────────────

const TOKEN_WORKFLOWS: { label: string; value: string; color: string }[] = [
  { label: 'False positive tuning', value: '891k', color: '#6b3c9f' },
  { label: 'Rule repair',           value: '223k', color: '#0f658a' },
  { label: 'Discovery',             value: '99k',  color: '#d13680' },
  { label: 'Gap analysis',          value: '27k',  color: '#9e3a16' },
];

const SUMMARY_DIVIDER = (
  <div style={{ width: 0, borderLeft: '1px solid #D3DAE6', flexShrink: 0, margin: '8px 0' }} />
);

const AutoDexTabView: React.FC<AutoDexTabViewProps> = ({ onOpenAIAssistant }) => {
  const [rulesFlyoutOpen, setRulesFlyoutOpen] = useState(false);
  const [gapsFlyoutOpen, setGapsFlyoutOpen] = useState(false);
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [sharedSearch, setSharedSearch] = useState('');
  const [typeOptions, setTypeOptions] = useState<{ label: string; checked?: 'on' }[]>([
    { label: 'Fixed execution failure' },
    { label: 'Tuned false positives' },
    { label: 'Installed rule' },
    { label: 'Updated rule' },
  ]);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const activeTypeLabels = typeOptions.filter((o) => o.checked === 'on').map((o) => o.label);

  const isPendingItem = (log: (typeof MOCK_AUTODEX_LOGS)[0]) =>
    (log.needsApproval || log.isSuggestion) && !approvalDecisions[log.id];

  const pendingCount = useMemo(
    () => MOCK_AUTODEX_LOGS.filter(isPendingItem).length,
    [approvalDecisions]
  );
  const totalCount = MOCK_AUTODEX_LOGS.length;

  const handleDecide = (id: string, decision: 'approved' | 'dismissed') => {
    setApprovalDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Summary card — horizontal stats at top ── */}
      <EuiPanel hasBorder hasShadow={false} paddingSize="none">
        <div style={{ display: 'flex' }}>

          <div style={{ flex: 1, padding: '16px 20px' }}>
            <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Actions required</EuiText>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#BD271E', margin: '0 0 2px', lineHeight: 1.1 }}>
              {pendingCount}
            </p>
            <EuiText size="xs" color="subdued">pending review</EuiText>
          </div>

          {SUMMARY_DIVIDER}

          <div style={{ flex: 1, padding: '16px 20px' }}>
            <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Activities today</EuiText>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#017D73', margin: '0 0 2px', lineHeight: 1.1 }}>
              {totalCount}
            </p>
            <EuiBadge color="success" iconType="sortUp" style={{ fontSize: 11 }}>+2 from last week</EuiBadge>
          </div>

          {SUMMARY_DIVIDER}

          <div style={{ flex: 1, padding: '16px 20px' }}>
            <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Approval rate</EuiText>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--euiTextColor)', margin: '0 0 2px', lineHeight: 1.1 }}>
              91%
            </p>
            <EuiText size="xs" color="subdued">compared to previous</EuiText>
          </div>

          {SUMMARY_DIVIDER}

          <div style={{ flex: 1, padding: '16px 20px' }}>
            <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Total tokens used</EuiText>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--euiTextColor)', margin: '0 0 2px', lineHeight: 1.1 }}>
              1.24M
            </p>
            <EuiText size="xs" color="subdued">this month</EuiText>
          </div>

        </div>
      </EuiPanel>

      {/* ── Approvals required (SIEM Readiness action panel pattern) ── */}
      <AutoDexApprovalsPanel
        items={MOCK_AUTODEX_LOGS}
        approvalDecisions={approvalDecisions}
        onDecide={handleDecide}
        onOpenAIAssistant={onOpenAIAssistant}
      />

      <EuiSpacer size="s" />

      {/* ── Completed activity log ── */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--euiTitleColor)', margin: '8px 0 6px' }}>Completed activity log</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <EuiFieldSearch
          placeholder="Search activities"
          value={sharedSearch}
          onChange={(e) => setSharedSearch(e.target.value)}
          isClearable
          fullWidth
        />
        <EuiFilterGroup style={{ flexShrink: 0 }}>
          <EuiPopover
            button={
              <EuiFilterButton
                iconType="arrowDown"
                onClick={() => setTypePopoverOpen(!typePopoverOpen)}
                isSelected={typePopoverOpen}
                numFilters={typeOptions.length}
                hasActiveFilters={typeOptions.some((o) => o.checked === 'on')}
                numActiveFilters={activeTypeLabels.length}
                style={{ minWidth: 80, whiteSpace: 'nowrap' }}
              >
                Type
              </EuiFilterButton>
            }
            isOpen={typePopoverOpen}
            closePopover={() => setTypePopoverOpen(false)}
            panelPaddingSize="none"
          >
            <EuiSelectable
              searchable
              searchProps={{ placeholder: 'Filter list', compressed: true }}
              options={typeOptions}
              onChange={(opts) => setTypeOptions(opts as { label: string; checked?: 'on' }[])}
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
      </div>

      <AutoDexActivityLog
        onOpenAIAssistant={onOpenAIAssistant}
        requiresApproval={false}
        completedOnly
        activityMode
        grouped={false}
        hideToolbar
        searchValue={sharedSearch}
        activeTypeLabels={activeTypeLabels}
        approvalDecisions={approvalDecisions}
      />

      {rulesFlyoutOpen && (
        <RulesFlyout onClose={() => setRulesFlyoutOpen(false)} onOpenAIAssistant={onOpenAIAssistant} />
      )}
      {gapsFlyoutOpen && (
        <GapsFlyout onClose={() => setGapsFlyoutOpen(false)} onOpenAIAssistant={onOpenAIAssistant} />
      )}
    </div>
  );
};

export default AutoDexTabView;
