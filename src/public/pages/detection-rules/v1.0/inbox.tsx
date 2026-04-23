import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFieldText,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSelectable,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import SecuritySideNav from './components/SecuritySideNav';
import SecurityHeader from './components/SecurityHeader';

// ─── Persona definitions ──────────────────────────────────────────────────────

interface Persona {
  id: string;
  label: string;
  description: string;
  icon: string;
  focusTags: string[];
}

const PERSONAS: Persona[] = [
  {
    id: 'detectioner',
    label: 'Detection Engineer',
    description: 'Rule health, coverage gaps, false positive tuning, threat intel alignment',
    icon: 'radar',
    focusTags: ['Rule failures', 'Coverage gaps', 'Noise tuning', 'MITRE coverage'],
  },
  {
    id: 'soc_analyst',
    label: 'SOC Analyst',
    description: 'Alert triage, case management, active investigation, shift handoff',
    icon: 'securitySignal',
    focusTags: ['Active attacks', 'Unassigned alerts', 'Cases', 'Escalations'],
  },
  {
    id: 'soc_manager',
    label: 'SOC Manager',
    description: 'Team workload, SLA tracking, escalations, program-level posture',
    icon: 'user',
    focusTags: ['SLA breaches', 'Team workload', 'Escalations', 'Program health'],
  },
  {
    id: 'threat_hunter',
    label: 'Threat Hunter',
    description: 'Anomaly signals, hypothesis generation, low-frequency TTPs, pivot points',
    icon: 'bullseye',
    focusTags: ['Anomalies', 'Low-frequency TTPs', 'Hypothesis leads', 'Intel gaps'],
  },
];

// ─── Feed types ───────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'attention' | 'noise' | 'gaps' | 'autodex';

interface FeedItem {
  id: string;
  type: string;
  category: Category;
  title: string;
  description: string;
  whyInFeed: string;
  age: string;
  severity: Severity;
  needsApproval?: boolean;
  primaryAction: { label: string; icon: string };
}

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; color: string; icon: string }> = {
  critical: { label: 'Critical', bg: '#FBEAEA', color: '#BD271E', icon: 'error' },
  high:     { label: 'High',     bg: '#FEF3E2', color: '#F5A700', icon: 'alert' },
  medium:   { label: 'Medium',   bg: '#FFF8E6', color: '#AD6800', icon: 'warning' },
  low:      { label: 'Low',      bg: '#E6F1FA', color: '#0077CC', icon: 'iInCircle' },
};

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; bg: string; color: string }> = {
  attention:{ label: 'Rule health',       icon: 'alert',         bg: '#FEF3E2', color: '#F5A700' },
  noise:    { label: 'Noise / FP',        icon: 'minusInCircle', bg: '#FFF8E6', color: '#AD6800' },
  gaps:     { label: 'Coverage gaps',     icon: 'eyeClosed',     bg: '#E6F1FA', color: '#0077CC' },
  autodex:  { label: 'AutoDEX',           icon: 'sparkles',      bg: '#F0EBFF', color: '#7B61FF' },
};

// ─── Feed data (detection-engineering focused) ────────────────────────────────

const ALL_FEED_ITEMS: FeedItem[] = [
  // ── Rule health ──────────────────────────────────────────────────────────────
  {
    id: 'b1', type: 'Rule failure', category: 'attention',
    title: 'DNS activity rule — failing silently',
    description: 'Field schema mismatch after Agent 8.14 upgrade · DNS tunneling now unmonitored',
    whyInFeed: 'Rule is your ownership. Blind spot opened 14 min ago. AutoDEX detected index_not_found_exception in execution log.',
    age: '14m ago', severity: 'critical',
    primaryAction: { label: 'Fix rule', icon: 'wrench' },
  },
  {
    id: 'b2', type: 'Rule failure', category: 'attention',
    title: 'FTP activity rule — index pattern not found',
    description: 'Rule enabled but not executing · FTP transfers unmonitored · data stream renamed',
    whyInFeed: 'Index pattern removed after data stream migration. AutoDEX identified the correct target index and proposed a fix.',
    age: '2h ago', severity: 'critical',
    primaryAction: { label: 'Fix rule', icon: 'wrench' },
  },
  {
    id: 'b3', type: 'Rule failure', category: 'attention',
    title: 'SMB lateral movement rule — field mapping broken',
    description: 'process.parent.executable field path changed in Agent 8.14 · rule returns zero results',
    whyInFeed: 'Upgrade-related regression. Lateral movement on Windows now has a blind spot. AutoDEX flagged the field mismatch.',
    age: '1h ago', severity: 'critical',
    primaryAction: { label: 'Fix rule', icon: 'wrench' },
  },
  {
    id: 'b4', type: 'Rule failure', category: 'attention',
    title: 'PowerShell encoded command rule — consistent execution timeout',
    description: 'Query too broad for current data volume · execution times out every run',
    whyInFeed: 'AutoDEX detected 100% timeout rate over 24 hours. Query needs scoping or time-window reduction.',
    age: '4h ago', severity: 'high',
    primaryAction: { label: 'Optimise query', icon: 'wrench' },
  },
  {
    id: 'b5', type: 'Version update', category: 'attention',
    title: 'Potential Widespread Malware rule — v3.3 available',
    description: 'Elastic Security Labs patch · fixes AV scanning false positives · your version: v3.2',
    whyInFeed: 'AutoDEX verified no active suppressions conflict with v3.3. Low-risk update ready to apply.',
    age: '3h ago', severity: 'low',
    primaryAction: { label: 'Review update', icon: 'inspect' },
  },
  // ── Coverage gaps ─────────────────────────────────────────────────────────────
  {
    id: 'g1', type: 'Coverage gap', category: 'gaps',
    title: 'T1055 — Process Injection: no detection coverage',
    description: 'High-priority technique · endpoint telemetry available · 3 candidate prebuilt rules identified',
    whyInFeed: 'AutoDEX identified this gap in the latest MITRE coverage audit. In-progress gap fill — 65% complete.',
    age: '6h ago', severity: 'high',
    primaryAction: { label: 'View gap', icon: 'eye' },
  },
  {
    id: 'g2', type: 'Coverage gap', category: 'gaps',
    title: 'T1003 — OS Credential Dumping: LSASS rule missing',
    description: 'Partial coverage only · Mimikatz variant undetected · endpoint telemetry confirmed active',
    whyInFeed: 'AutoDEX correlated with recent threat intel feed. Gap fill in progress — LSASS memory protection rule being staged.',
    age: '1 day ago', severity: 'critical',
    primaryAction: { label: 'Install rules', icon: 'plusInCircle' },
  },
  {
    id: 'g3', type: 'Coverage gap', category: 'gaps',
    title: 'T1486 — Data Encrypted for Impact: no active rules',
    description: 'No active rules · endpoint file telemetry available · 3 prebuilt rules ready to install',
    whyInFeed: 'Active ransomware campaigns targeting your sector. AutoDEX has 3 Elastic prebuilt rules ready with no noise concerns.',
    age: 'new', severity: 'high',
    primaryAction: { label: 'Install rules', icon: 'plusInCircle' },
  },
  // ── Noise / FP tuning ────────────────────────────────────────────────────────
  {
    id: 'c1', type: 'False positive', category: 'noise',
    title: '"Potential PowerShell HackTool" — 334 alerts/week from backup-agent.exe',
    description: '98% false positive rate · same process ancestry on all 72 affected hosts · backup-agent signed by internal CA',
    whyInFeed: 'AutoDEX proposed a scoped exception (process.name: backup-agent.exe AND host.name: backup-*). Pending your approval.',
    age: '2 days ago', severity: 'medium',
    primaryAction: { label: 'Review exception', icon: 'eye' },
  },
  {
    id: 'c2', type: 'False positive', category: 'noise',
    title: '"Unusual Execution via MMC" — 197 alerts from developer workstations',
    description: 'Visual Studio build tooling · corp-dev-* machines · 94% false positive · consistent for 30 days',
    whyInFeed: 'AutoDEX proposed exception: user.name: corp-dev-*. Preserves detection on non-dev hosts. Pending your approval.',
    age: '3 days ago', severity: 'low',
    primaryAction: { label: 'Review exception', icon: 'eye' },
  },
  {
    id: 'c3', type: 'False positive', category: 'noise',
    title: '"Windows Registry Modification via reg.exe" — 312 alerts/week from SCCM',
    description: '89% FP from sccm-agent.exe · all on managed endpoints · IT confirmed as approved tooling',
    whyInFeed: 'AutoDEX identified SCCM as the source via fleet API. Scoped exception proposed for managed endpoint group.',
    age: '1 day ago', severity: 'medium',
    primaryAction: { label: 'Review exception', icon: 'eye' },
  },
  // ── AutoDEX actions ───────────────────────────────────────────────────────────
  {
    id: 'd1', type: 'AutoDEX approval', category: 'autodex',
    title: 'Tuning proposal — backup-agent.exe FP suppression on PowerShell rule',
    description: '334 alerts/week suppressed · scoped to host.name: backup-* · confidence 96%',
    whyInFeed: 'AutoDEX confidence: 96%. Semi-auto mode requires your sign-off before applying the exception.',
    age: '1h ago', severity: 'medium', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd2', type: 'AutoDEX approval', category: 'autodex',
    title: 'New rule install — Okta impossible travel detection',
    description: 'T1078.004 coverage gap · matches your Okta integration · low noise estimate from similar environments',
    whyInFeed: 'AutoDEX confidence: 91%. Rule install scoped to your Okta data stream. No existing suppressions conflict.',
    age: '2h ago', severity: 'high', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd3', type: 'AutoDEX approval', category: 'autodex',
    title: 'Rule install proposal — T1486 Data Destruction (3 rules)',
    description: '3 prebuilt rules · all required fields present · zero suppressions affected',
    whyInFeed: 'AutoDEX confidence: 99%. Closes ransomware impact gap immediately. Requires your approval under Semi-auto mode.',
    age: '3h ago', severity: 'high', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd4', type: 'AutoDEX approval', category: 'autodex',
    title: 'Rule version update — Potential Widespread Malware v3.2→v3.3',
    description: 'Elastic Security Labs patch · adds AV process exclusions · narrows detection scope',
    whyInFeed: 'AutoDEX verified no suppressions conflict with v3.3. Low-risk, false-positive-reducing update awaiting sign-off.',
    age: '30m ago', severity: 'low', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd5', type: 'AutoDEX action', category: 'autodex',
    title: 'Exception applied — Unusual Execution via MMC (corp-dev-* workstations)',
    description: 'user.name: corp-dev-* exception applied · 197 alerts/week suppressed · Full-auto action',
    whyInFeed: 'AutoDEX Full-auto applied based on 30-day validated pattern. Detection preserved on all non-dev hosts.',
    age: '2h ago', severity: 'low',
    primaryAction: { label: 'View action log', icon: 'inspect' },
  },
  {
    id: 'd6', type: 'AutoDEX action', category: 'autodex',
    title: 'Index pattern corrected — DNS activity rule restored',
    description: 'AutoDEX updated logs-endpoint.* → logs-endpoint.events.* · rule now executing successfully',
    whyInFeed: 'AutoDEX fixed execution failure on your owned rule. Verified next scheduled run returned results.',
    age: '12m ago', severity: 'low',
    primaryAction: { label: 'View action log', icon: 'inspect' },
  },
];


// ─── FeedRow — matches AutoDEX activity log card pattern ─────────────────────

const FeedRow: React.FC<{ item: FeedItem }> = ({ item }) => {
  const [dismissed, setDismissed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const sevCfg = SEVERITY_CONFIG[item.severity];
  const pendingApproval = !!item.needsApproval && !approved;

  if (dismissed) return null;

  return (
    <div style={{ padding: '12px 0' }}>
      {/* ── Header row: icon | type badge | approval badge | title | age | approval buttons ── */}
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={pendingApproval ? 'warningFilled' : approved ? 'checkInCircleFilled' : 'checkInCircleFilled'}
            color={pendingApproval ? 'warning' : 'success'}
            size="s"
          />
        </EuiFlexItem>

        {/* Type badge — hollow, no colour */}
        <EuiFlexItem grow={false}>
          <EuiBadge color="hollow">{item.type}</EuiBadge>
        </EuiFlexItem>

        {/* Approvals needed badge sits immediately after type badge */}
        {pendingApproval && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="warning">Approvals needed</EuiBadge>
          </EuiFlexItem>
        )}
        {approved && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="success" iconType="checkInCircleFilled">Approved</EuiBadge>
          </EuiFlexItem>
        )}

        <EuiFlexItem grow={true}>
          <EuiText size="s" style={{ fontWeight: 700 }}>{item.title}</EuiText>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued" style={{ whiteSpace: 'nowrap' }}>{item.age}</EuiText>
        </EuiFlexItem>

        {/* Approval action buttons in header (approval items only) */}
        {pendingApproval && (
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="none" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs" iconType="check" color="primary"
                  onClick={() => setApproved(true)}
                  style={{ border: '1px solid #D3DAE6', borderRadius: 4, paddingLeft: 8, paddingRight: 8, fontSize: 12, fontWeight: 600 }}
                >
                  Approve
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      {/* ── Reasoning panel — left stroke yellow if pending approval, grey otherwise ── */}
      <EuiPanel
        hasBorder
        hasShadow={false}
        paddingSize="m"
        style={{
          borderRadius: 6,
          background: '#F7F9FF',
          marginBottom: 4,
          borderLeft: `3px solid ${pendingApproval ? '#F5A700' : '#D3DAE6'}`,
        }}
      >
        <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 6 }}>
          Why in your feed
        </EuiText>
        <EuiText size="s" style={{ marginBottom: 10 }}>{item.whyInFeed}</EuiText>

        {/* Severity badge */}
        <div style={{ marginBottom: 8 }}>
          <EuiBadge style={{ background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.color}33` }}>
            {sevCfg.label}
          </EuiBadge>
        </div>

        {/* Expand for description */}
        <EuiButtonEmpty
          size="xs"
          iconType={expanded ? 'chevronSingleDown' : 'chevronSingleRight'}
          color="primary"
          flush="left"
          onClick={() => setExpanded(!expanded)}
        >
          Details
        </EuiButtonEmpty>
        {expanded && (
          <EuiText size="s" color="subdued" style={{ marginTop: 8, marginBottom: 4 }}>
            {item.description}
          </EuiText>
        )}

        {/* Action buttons */}
        <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 8 }}>
          {!pendingApproval && !approved && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType={item.primaryAction.icon} flush="left" color="primary">
                {item.primaryAction.label}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }}>
              Add to chat
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="xs" iconType="minusInCircle" flush="left" color="text" onClick={() => setDismissed(true)}>
              Dismiss
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
};


// ─── Persona selector ─────────────────────────────────────────────────────────

const PersonaSelector: React.FC<{ persona: Persona; onChange: (p: Persona) => void }> = ({ persona, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(217,232,255,0.3) 0%, rgba(236,226,254,0.3) 100%)',
      borderBottom: '1px solid #E3E8F2',
      borderRadius: '8px 8px 0 0',
    }}>
      <EuiIcon type="sparkles" size="m" style={{ color: '#7B61FF' }} />
      <EuiText size="s" color="subdued">Personalised for</EuiText>
      <EuiPopover
        isOpen={open}
        closePopover={() => setOpen(false)}
        button={
          <button
            onClick={() => setOpen(!open)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', background: '#fff',
              border: '1px solid #D3DAE6', borderRadius: 4,
              cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#343741',
            }}
          >
            <EuiIcon type={persona.icon} size="s" color="primary" />
            {persona.label}
            <EuiIcon type="arrowDown" size="s" color="subdued" />
          </button>
        }
        anchorPosition="downLeft"
        panelStyle={{ minWidth: 340 }}
      >
        <div style={{ padding: 8 }}>
          <EuiText size="xs" color="subdued" style={{ padding: '4px 8px 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select your workflow
          </EuiText>
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                width: '100%', padding: '10px 12px',
                background: p.id === persona.id ? '#F0F4FF' : 'none',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                textAlign: 'left', marginBottom: 2,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: p.id === persona.id ? '#E6F1FA' : '#F5F7FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <EuiIcon type={p.icon} size="s" color={p.id === persona.id ? 'primary' : 'text'} />
              </div>
              <div style={{ flex: 1 }}>
                <EuiText size="s" style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</EuiText>
                <EuiText size="xs" color="subdued">{p.description}</EuiText>
                <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  {p.focusTags.map(tag => (
                    <EuiFlexItem key={tag} grow={false}>
                      <EuiBadge color="hollow" style={{ fontSize: 10 }}>{tag}</EuiBadge>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </div>
              {p.id === persona.id && <EuiIcon type="checkInCircleFilled" color="primary" size="s" />}
            </button>
          ))}
        </div>
      </EuiPopover>
      <EuiText size="xs" color="subdued" style={{ marginLeft: 4 }}>
        {persona.focusTags.join(' · ')}
      </EuiText>
    </div>
  );
};

// ─── Filter popover (EuiFilterButton style — matches AutoDEX activity log) ────

const FilterPopover: React.FC<{
  label: string;
  options: Array<{ label: string; checked?: 'on' | undefined }>;
  onChange: (opts: any[]) => void;
}> = ({ label, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const activeCount = options.filter(o => o.checked === 'on').length;

  return (
    <EuiPopover
      isOpen={open}
      closePopover={() => setOpen(false)}
      panelPaddingSize="none"
      button={
        <EuiFilterButton
          iconType="arrowDown"
          onClick={() => setOpen(!open)}
          isSelected={open}
          numFilters={options.length}
          hasActiveFilters={activeCount > 0}
          numActiveFilters={activeCount}
        >
          {label}
        </EuiFilterButton>
      }
    >
      <EuiSelectable options={options} onChange={onChange}>
        {(list) => <div style={{ width: 220 }}>{list}</div>}
      </EuiSelectable>
    </EuiPopover>
  );
};

// ─── Feed grouping ────────────────────────────────────────────────────────────

const GROUP_ORDER = [
  'Rule failure',
  'Version update',
  'Coverage gap',
  'False positive',
  'AutoDEX approval',
  'AutoDEX action',
];

const FEED_GROUP_CONFIG: Record<string, { description: string; color: string; bg: string }> = {
  'Rule failure':     { description: 'Rules that have failed executions and AutoDEX has a suggested fix for the issues', color: '#BD271E', bg: '#FBEAEA' },
  'Version update':   { description: 'Elastic prebuilt rule updates AutoDEX has verified are safe to apply', color: '#F5A700', bg: '#FEF3E2' },
  'Coverage gap':     { description: 'MITRE ATT&CK techniques with no detection coverage in your environment', color: '#0077CC', bg: '#E6F1FA' },
  'False positive':   { description: 'High-volume false positive patterns with AutoDEX exception proposals pending review', color: '#AD6800', bg: '#FFF8E6' },
  'AutoDEX approval': { description: 'AutoDEX proposals in semi-auto mode that require your sign-off before being applied', color: '#7B61FF', bg: '#F0EBFF' },
  'AutoDEX action':   { description: 'AutoDEX fully automated actions applied to your ruleset — logged for your review', color: '#017D73', bg: '#E6F6F0' },
};

const FeedGroup: React.FC<{
  typeLabel: string;
  items: FeedItem[];
  defaultOpen?: boolean;
}> = ({ typeLabel, items, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cfg = FEED_GROUP_CONFIG[typeLabel] ?? { description: typeLabel, color: '#69707D', bg: '#F5F7FA' };
  const pendingCount = items.filter((i) => i.needsApproval).length;

  if (items.length === 0) return null;

  return (
    <EuiPanel
      hasBorder
      hasShadow={false}
      paddingSize="none"
      style={{ borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}
    >
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: isOpen ? '#FAFBFD' : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: isOpen ? '1px solid #EEF0F3' : 'none',
        }}
      >
        <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="subdued" style={{ flexShrink: 0 }} />
        <EuiBadge color="hollow" style={{ flexShrink: 0 }}>{typeLabel}</EuiBadge>
        {pendingCount > 0 && (
          <EuiBadge color="warning" iconType="warningFilled" style={{ flexShrink: 0 }}>
            {pendingCount} Approvals needed
          </EuiBadge>
        )}
        {/* Description inline when collapsed */}
        {!isOpen && (
          <EuiText
            size="xs"
            color="subdued"
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {cfg.description}
          </EuiText>
        )}
        {/* Right meta */}
        <div
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {isOpen && (
            <EuiText size="xs" color="subdued">
              Tasks:&nbsp;<strong>{items.length}</strong>
            </EuiText>
          )}
          <EuiButtonEmpty
            size="xs"
            iconType="arrowDown"
            iconSide="right"
            color="text"
            style={{ border: '1px solid #D3DAE6', borderRadius: 4, paddingLeft: 8, paddingRight: 4, height: 28 }}
          >
            Take action
          </EuiButtonEmpty>
        </div>
      </button>

      {/* Description below header in expanded state */}
      {isOpen && (
        <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #EEF0F3' }}>
          <EuiText size="xs" color="subdued">{cfg.description}</EuiText>
        </div>
      )}

      {/* Items */}
      {isOpen && (
        <div>
          {items.map((item, i) => (
            <div key={item.id} style={{ padding: '0 14px' }}>
              <FeedRow item={item} />
              {i < items.length - 1 && <EuiHorizontalRule margin="none" />}
            </div>
          ))}
        </div>
      )}
    </EuiPanel>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const METRIC_CARDS = [
  { num: '03', numColor: '#F5A700', label: 'Rules failing',          sub: 'Silent failures since last check',         action: 'Review all', actionIcon: 'wrench', catLabel: 'Rule health' },
  { num: '4',  numColor: '#017D73', label: 'Execution gaps',         sub: 'AutoDEX filling 4 MITRE techniques',       action: 'View gaps',  actionIcon: 'eye',    catLabel: 'Coverage gaps' },
  { num: '10', numColor: '#AD6800', label: 'Noise / FP',             sub: 'Exception proposals pending approval',     action: 'Review all', actionIcon: 'check',  catLabel: 'Noise / FP' },
  { num: '72%',numColor: '#0077CC', label: 'MITRE ATT&CK coverage',  sub: '5 techniques without detection coverage',  action: 'View gaps',  actionIcon: 'eyeClosed', catLabel: 'Coverage gaps' },
];

const InboxPage: React.FC = () => {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [aiQuery, setAiQuery] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([
    { label: 'Rule health',   checked: undefined as 'on' | undefined },
    { label: 'Noise / FP',    checked: undefined as 'on' | undefined },
    { label: 'Coverage gaps', checked: undefined as 'on' | undefined },
    { label: 'AutoDEX',       checked: undefined as 'on' | undefined },
  ]);
  const [approvalFilter, setApprovalFilter] = useState([
    { label: 'Needs approval', checked: undefined as 'on' | undefined },
    { label: 'Approved',       checked: undefined as 'on' | undefined },
  ]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const filteredItems = useMemo(() => {
    const activeCatLabels = categoryFilter.filter(o => o.checked === 'on').map(o => o.label);
    const wantNeedsApproval = approvalFilter.find(o => o.label === 'Needs approval')?.checked === 'on';
    const hasApprovalFilter = approvalFilter.some(o => o.checked === 'on');

    return ALL_FEED_ITEMS.filter(item => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.type.toLowerCase().includes(q)) return false;
      }
      if (activeCatLabels.length > 0) {
        const itemCatLabel = CATEGORY_CONFIG[item.category].label;
        if (!activeCatLabels.includes(itemCatLabel)) return false;
      }
      if (hasApprovalFilter && wantNeedsApproval) {
        if (!item.needsApproval) return false;
      }
      return true;
    });
  }, [search, categoryFilter, approvalFilter]);

  const hasActiveFilters = search.length > 0 || categoryFilter.some(o => o.checked === 'on') || approvalFilter.some(o => o.checked === 'on');

  const groupedItems = useMemo(
    () =>
      GROUP_ORDER.map(type => ({
        type,
        items: filteredItems.filter(item => item.type === type),
      })).filter(g => g.items.length > 0),
    [filteredItems]
  );

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter(f => f.map(o => ({ ...o, checked: undefined })));
    setApprovalFilter(f => f.map(o => ({ ...o, checked: undefined })));
  };

  /** Clicking a metric card activates its category filter */
  const filterByCategory = (catLabel: string) => {
    setCategoryFilter(prev => prev.map(o => ({ ...o, checked: o.label === catLabel ? 'on' : undefined })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <SecurityHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 48 }}>
        <SecuritySideNav />

        <div style={{ flex: 1, marginLeft: 80, overflowY: 'auto', background: '#F6F9FC', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E3E8F2', minHeight: 'calc(100vh - 80px)', overflow: 'hidden' }}>

            <PersonaSelector persona={persona} onChange={setPersona} />

            <div style={{ padding: '24px 32px 48px' }}>

              {/* ── Page header ── */}
              <EuiFlexGroup alignItems="center" responsive={false} gutterSize="s" style={{ marginBottom: 20 }}>
                <EuiFlexItem>
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiTitle size="l"><h1>AI Briefing</h1></EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="hollow" style={{ fontSize: 11 }}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#017D73' }} />
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>Updated {timeStr}</EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip content="History">
                        <EuiButtonIcon iconType="clock" aria-label="History" color="text" />
                      </EuiToolTip>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon iconType="gear" aria-label="Settings" color="text" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon iconType="refresh" aria-label="Refresh" color="text" />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>

              {/* ── 1. Metric cards (top) ── */}
              <EuiFlexGroup gutterSize="m" responsive={false} style={{ marginBottom: 24 }}>
                {METRIC_CARDS.map(card => (
                  <EuiFlexItem key={card.label} grow={1}>
                    <EuiPanel
                      hasBorder hasShadow={false} paddingSize="m"
                      style={{ borderRadius: 8, cursor: 'pointer', borderLeft: `3px solid ${card.numColor}`, display: 'flex', flexDirection: 'column' }}
                      onClick={() => filterByCategory(card.catLabel)}
                    >
                      <EuiFlexGroup gutterSize="s" alignItems="baseline" responsive={false} style={{ marginBottom: 4 }}>
                        <EuiFlexItem grow={false}>
                          <span style={{ fontSize: 30, fontWeight: 700, color: card.numColor, lineHeight: 1 }}>{card.num}</span>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" style={{ fontWeight: 600 }}>{card.label}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="xs" color="subdued" style={{ marginBottom: 8, flex: 1 }}>{card.sub}</EuiText>
                      <div>
                        <EuiButtonEmpty
                          size="xs" iconType={card.actionIcon} flush="left" color="primary"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                        >
                          {card.action}
                        </EuiButtonEmpty>
                      </div>
                    </EuiPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>

              {/* ── 2. Today's briefing (below cards) ── */}
              <EuiPanel hasBorder hasShadow={false} paddingSize="l" style={{ borderRadius: 8, marginBottom: 24, borderLeft: '3px solid #7B61FF' }}>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 12 }}>
                  <EuiFlexItem grow={false}><EuiIcon type="sparkles" size="m" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                  <EuiFlexItem><EuiTitle size="s"><h2 style={{ color: '#7B61FF' }}>Today's briefing</h2></EuiTitle></EuiFlexItem>
                  <EuiFlexItem grow={false}><EuiBadge color="hollow" style={{ fontSize: 11 }}>Detection Engineer view</EuiBadge></EuiFlexItem>
                </EuiFlexGroup>
                <EuiText size="s" style={{ marginBottom: 16, lineHeight: 1.8 }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li><strong>3 rules are failing silently</strong> — DNS, FTP, and SMB lateral movement rules have execution errors. Blind spots have been open for up to 6 hours. AutoDEX has identified the root causes. <EuiBadge color="danger" iconType="alert" style={{ verticalAlign: 'middle' }}>Immediate action needed</EuiBadge></li>
                    <li>AutoDEX has <strong>4 proposals</strong> pending your approval — 3 tuning exceptions and 1 rule install — estimated to reduce noise by ~531 alerts/week.</li>
                    <li>You have <strong>3 MITRE ATT&amp;CK techniques</strong> with no detection coverage. AutoDEX is actively filling 4 gaps; 2 are ready to install today.</li>
                  </ul>
                </EuiText>
                <div style={{ position: 'relative' }}>
                  <EuiFieldText
                    placeholder="Ask AI about your detection coverage..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    fullWidth
                    style={{ paddingRight: 140, background: '#FAFBFC' }}
                  />
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                    <EuiButtonEmpty size="xs" iconType="sparkles" style={{ color: '#7B61FF', fontWeight: 600 }}>Add to chat</EuiButtonEmpty>
                  </div>
                </div>
              </EuiPanel>

              {/* ── 3. Feed header: search + filters ── */}
              <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center" style={{ marginBottom: 10 }}>
                <EuiFlexItem grow={false}>
                  <EuiTitle size="xs"><h2>Feed</h2></EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="hollow" style={{ fontSize: 11 }}>{filteredItems.length} items</EuiBadge>
                </EuiFlexItem>
                <EuiFlexItem grow={true} />
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={true}>
                      <EuiFieldSearch
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        isClearable
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiFilterGroup>
                        <FilterPopover label="Category" options={categoryFilter} onChange={setCategoryFilter} />
                        <FilterPopover label="Approval" options={approvalFilter} onChange={setApprovalFilter} />
                      </EuiFilterGroup>
                    </EuiFlexItem>
                    {hasActiveFilters && (
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty size="xs" color="danger" onClick={clearAllFilters}>Clear</EuiButtonEmpty>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiHorizontalRule margin="none" style={{ marginBottom: 4 }} />

              {/* ── 4. Grouped feed ── */}
              {groupedItems.length === 0 ? (
                <EuiText textAlign="center" color="subdued" style={{ marginTop: 40 }}>
                  <p>No items match your filters.</p>
                </EuiText>
              ) : (
                groupedItems.map(group => (
                  <FeedGroup
                    key={group.type}
                    typeLabel={group.type}
                    items={group.items}
                    defaultOpen={group.type === 'Rule failure' || group.type === 'AutoDEX approval'}
                  />
                ))
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
