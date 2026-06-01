import React, { useState } from 'react';
import moment, { type Moment } from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTabs,
  EuiTab,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiCallOut,
  EuiSwitch,
  EuiBadge,
  EuiHealth,
  EuiIcon,
  EuiLink,
  EuiCode,
  EuiCodeBlock,
  EuiDescriptionList,
  EuiHorizontalRule,
  EuiBasicTable,
  EuiTablePagination,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiAccordion,
  EuiProgress,
  EuiFilterGroup,
  EuiFilterButton,
  EuiPopover,
  EuiSelectable,
  EuiContextMenu,
  EuiFieldSearch,
  EuiListGroup,
  EuiListGroupItem,
  EuiDatePicker,
  EuiLoadingElastic,
  EuiToolTip,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

interface DetectionRule {
  id: string;
  name: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  platform?: string;
  ruleType?: string;
  tags?: string[];
  mitreTactics?: string[];
  mitreTechniques?: Array<{ id: string; name: string }>;
  lastRun: string;
  lastResponse: 'Failed' | 'Succeeded';
  lastUpdated: string;
  notify: boolean;
  enabled: boolean;
}

// ─── MitreTechniqueBadge ─────────────────────────────────────────────────────

interface MitreTechniqueBadgeProps {
  id: string;
  name: string;
  status: 'current' | 'outdated' | 'revoked';
  replacedBy?: Array<{ id: string; name: string; tacticId: string; tacticName: string }>;
  revocationReason?: string;
  attackVersion: string;
  isEnterprise: boolean;
  onRemapWithAI: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const MitreTechniqueBadge: React.FC<MitreTechniqueBadgeProps> = ({
  id, name, status, replacedBy, revocationReason, attackVersion,
  isEnterprise, onRemapWithAI, isOpen, onOpen, onClose,
}) => {
  const isActionable = status === 'outdated' || status === 'revoked';

  const badgeColor = status === 'revoked' ? 'danger' : status === 'outdated' ? 'warning' : 'hollow';
  const badgeIcon = status === 'revoked' ? 'minusInCircle' : status === 'outdated' ? 'clock' : undefined;
  const tooltipContent = status === 'revoked'
    ? `This technique was revoked in ATT&CK ${attackVersion}. Click for details.`
    : status === 'outdated'
      ? `This technique was updated in ATT&CK ${attackVersion}. A newer revision exists. Click for details.`
      : undefined;

  const badge = (
    <span
      role={isActionable ? 'button' : undefined}
      tabIndex={isActionable ? 0 : undefined}
      aria-label={`${id} ${name} — ${status}`}
      onClick={isActionable ? onOpen : undefined}
      onKeyDown={isActionable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); } : undefined}
      style={{ cursor: isActionable ? 'pointer' : 'default', display: 'inline-flex' }}
    >
      <EuiBadge
        color={badgeColor}
        iconType={badgeIcon}
        iconSide="left"
        style={status === 'revoked' ? { textDecoration: 'line-through', opacity: 0.85, pointerEvents: 'none' } : { pointerEvents: 'none' }}
      >
        {id} · {name}
      </EuiBadge>
    </span>
  );

  if (!isActionable) {
    return tooltipContent
      ? <EuiToolTip content={tooltipContent}>{badge}</EuiToolTip>
      : badge;
  }

  const remapButton = isEnterprise ? (
    <EuiButton size="s" iconType="sparkles" fill onClick={() => { onRemapWithAI(); onClose(); }}>
      Remap with AI
    </EuiButton>
  ) : (
    <EuiToolTip content="Remap with AI requires an Enterprise licence. Upgrade to access this feature.">
      <EuiButton size="s" iconType="sparkles" fill disabled>
        Remap with AI
      </EuiButton>
    </EuiToolTip>
  );

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={onClose}
      anchorPosition="downLeft"
      panelPaddingSize="m"
      button={tooltipContent && !isOpen
        ? <EuiToolTip content={tooltipContent}>{badge}</EuiToolTip>
        : badge
      }
    >
      <div style={{ width: 340 }}>
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
          <EuiFlexItem grow={false}>
            <EuiIcon
              type={status === 'revoked' ? 'minusInCircle' : 'clock'}
              color={status === 'revoked' ? 'danger' : 'warning'}
              size="m"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s" style={{ fontWeight: 700 }}>
              {status === 'revoked' ? 'Technique revoked' : 'Technique updated'}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin="s" />

        <EuiText size="xs" color="subdued" style={{ marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current mapping</EuiText>
        <EuiBadge color={badgeColor} iconType={badgeIcon} iconSide="left"
          style={status === 'revoked' ? { textDecoration: 'line-through', opacity: 0.85 } : undefined}
          iconOnClick={() => {}} iconOnClickAriaLabel="technique icon"
        >
          {id} · {name}
        </EuiBadge>

        {revocationReason && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued" style={{ marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why it changed</EuiText>
            <EuiText size="s"><p style={{ margin: 0 }}>{revocationReason}</p></EuiText>
          </>
        )}

        {replacedBy && replacedBy.length > 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued" style={{ marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested replacement{replacedBy.length > 1 ? 's' : ''}
            </EuiText>
            <EuiFlexGroup direction="column" gutterSize="xs">
              {replacedBy.map((r) => (
                <EuiFlexItem key={r.id}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="hollow">{r.id}</EuiBadge>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiLink href="#" style={{ fontSize: 13 }}>{r.name}</EuiLink>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">{r.tacticName}</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </>
        )}

        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" responsive={false} justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" onClick={onClose}>Dismiss</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{remapButton}</EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPopover>
  );
};

const RuleDetailsPage: React.FC = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'exceptions' | 'execution'>('overview');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [aboutViewToggle, setAboutViewToggle] = useState('details');
  const [executionPageIndex, setExecutionPageIndex] = useState(0);
  const [executionPageSize, setExecutionPageSize] = useState(10);
  const [gapFillPageIndex, setGapFillPageIndex] = useState(0);
  const [gapFillPageSize, setGapFillPageSize] = useState(10);
  const [showSourceEventRange, setShowSourceEventRange] = useState(true);
  const [showMetricsColumns, setShowMetricsColumns] = useState(false);
  const [runTypeOptions, setRunTypeOptions] = useState([
    { label: 'Scheduled' },
    { label: 'Manual' },
    { label: 'Gap fill' },
  ]);
  const [statusOptions, setStatusOptions] = useState([
    { label: 'Succeeded' },
    { label: 'Failed' },
    { label: 'Error' },
  ]);
  const [runTypePopoverOpen, setRunTypePopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const runTypeActiveCount = runTypeOptions.filter((o: any) => o.checked === 'on').length;
  const statusActiveCount = statusOptions.filter((o: any) => o.checked === 'on').length;
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isHistoryPaneOpen, setIsHistoryPaneOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number>(0);
  const [expandedHistoryVersion, setExpandedHistoryVersion] = useState<number | null>(5);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Moment | null>(null);
  const [dateTo, setDateTo] = useState<Moment | null>(null);
  const [expandedNoteIdx, setExpandedNoteIdx] = useState<number | null>(null);

  // ── MITRE stale-mapping feature ───────────────────────────────────────────
  const isEnterprise = true; // mock tier — swap for real license check

  const [staleMappingCalloutDismissed, setStaleMappingCalloutDismissed] = useState(false);
  const [openMitreBadgeId, setOpenMitreBadgeId] = useState<string | null>(null);

  interface MitreTechnique {
    id: string;
    name: string;
    status: 'current' | 'outdated' | 'revoked';
    replacedBy?: Array<{ id: string; name: string; tacticId: string; tacticName: string }>;
    revocationReason?: string;
  }
  interface MitreTactic {
    id: string;
    name: string;
  }
  interface MitreMappingEntry {
    tactic: MitreTactic;
    technique: MitreTechnique;
    subTechnique?: MitreTechnique;
  }

  const mitreMappings: MitreMappingEntry[] = [
    {
      tactic: { id: 'TA0008', name: 'Lateral Movement' },
      technique: {
        id: 'T1210',
        name: 'Exploitation of Remote Services',
        status: 'current',
      },
    },
    {
      tactic: { id: 'TA0003', name: 'Persistence' },
      technique: {
        id: 'T1133',
        name: 'External Remote Services',
        status: 'outdated',
        revocationReason: 'ATT&CK v14 restructured this technique to clarify scope and split cloud-specific variants.',
        replacedBy: [
          { id: 'T1133.001', name: 'External Remote Services: VPN', tacticId: 'TA0003', tacticName: 'Persistence' },
          { id: 'T1133.002', name: 'External Remote Services: RDP', tacticId: 'TA0003', tacticName: 'Persistence' },
        ],
      },
    },
    {
      tactic: { id: 'TA0006', name: 'Credential Access' },
      technique: {
        id: 'T1078',
        name: 'Valid Accounts',
        status: 'current',
      },
      subTechnique: {
        id: 'T1078.001',
        name: 'Default Accounts',
        status: 'revoked',
        revocationReason: 'This sub-technique was merged into T1078 (Valid Accounts) in ATT&CK v15 as the distinction no longer provided analytical value.',
        replacedBy: [
          { id: 'T1078', name: 'Valid Accounts', tacticId: 'TA0006', tacticName: 'Credential Access' },
        ],
      },
    },
  ];

  const staleMappings = mitreMappings.filter(
    (m) => m.technique.status !== 'current' || m.subTechnique?.status === 'outdated' || m.subTechnique?.status === 'revoked'
  );
  const staleCount = staleMappings.length;
  const attackVersion = 'v19';

  const handleRemapWithAI = () => {
    // placeholder — wire to AI remap flow
    console.log('Remap with AI triggered');
  };
  const [diffChangeIdx, setDiffChangeIdx] = useState(0);

  type DiffLine = { text: string; type: 'normal' | 'added' | 'removed' };

  // Full JSON base lines shared across versions
  const BASE_JSON: DiffLine[] = [
    { text: '{', type: 'normal' },
    { text: '  "name": "Okta Credential Stuffing with Successful Account Takeover",', type: 'normal' },
    { text: '  "description": "Detects a full credential stuffing attack chain in Okta where the same user', type: 'normal' },
    { text: '    and source IP exhibit multiple failed logins, at least one MFA failure, a successful', type: 'normal' },
    { text: '    authentication, followed by post-compromise activity such as privilege grants or policy', type: 'normal' },
    { text: '    modifications. This sequence indicates a likely successful account takeover.",', type: 'normal' },
    { text: '  "risk_score": 73,', type: 'normal' },
    { text: '  "severity": "high",', type: 'normal' },
    { text: '  "type": "esql",', type: 'normal' },
    { text: '  "language": "esql",', type: 'normal' },
    { text: '  "query": "FROM logs-okta* | WHERE event.dataset == \\"okta.system\\"',  type: 'normal' },
    { text: '    | STATS failed_logins = COUNT(*) WHERE event.action == \\"user.session.start\\"', type: 'normal' },
    { text: '    AND event.outcome == \\"failure\\" AND okta.outcome.reason == \\"INVALID_CREDENTIALS\\",', type: 'normal' },
    { text: '    mfa_failures = COUNT(*) WHERE event.action IN (\\"user.mfa.attempt_bypass\\"),', type: 'normal' },
    { text: '    successful_logins = COUNT(*) WHERE event.outcome == \\"success\\"', type: 'normal' },
    { text: '    BY user.name, source.ip | WHERE failed_logins >= 3 AND successful_logins >= 1",', type: 'normal' },
    { text: '  "index": ["logs-okta*"],', type: 'normal' },
    { text: '  "interval": "5m",', type: 'normal' },
    { text: '  "from": "now-30m",', type: 'normal' },
    { text: '  "to": "now",', type: 'normal' },
    { text: '  "enabled": true,', type: 'normal' },
    { text: '  "author": ["Elastic"],', type: 'normal' },
    { text: '  "license": "Elastic License v2",', type: 'normal' },
    { text: '  "rule_id": "okta-credstuff-takeover-001",', type: 'normal' },
    { text: '  "version": 4,', type: 'normal' },
    { text: '  "tags": [', type: 'normal' },
    { text: '    "Domain: Identity",', type: 'normal' },
    { text: '    "Data Source: Okta",', type: 'normal' },
    { text: '    "Use Case: Identity and Access Audit",', type: 'normal' },
    { text: '    "Tactic: Credential Access",', type: 'normal' },
    { text: '    "Tactic: Initial Access",', type: 'normal' },
    { text: '    "Resources: Investigation Guide"', type: 'normal' },
    { text: '  ],', type: 'normal' },
    { text: '  "threat": [', type: 'normal' },
    { text: '    { "framework": "MITRE ATT&CK",', type: 'normal' },
    { text: '      "tactic": { "id": "TA0006", "name": "Credential Access" },', type: 'normal' },
    { text: '      "technique": [{ "id": "T1110", "name": "Brute Force",', type: 'normal' },
    { text: '        "subtechnique": [{ "id": "T1110.004", "name": "Credential Stuffing" }] }]', type: 'normal' },
    { text: '    },', type: 'normal' },
    { text: '    { "framework": "MITRE ATT&CK",', type: 'normal' },
    { text: '      "tactic": { "id": "TA0001", "name": "Initial Access" },', type: 'normal' },
    { text: '      "technique": [{ "id": "T1078", "name": "Valid Accounts" }]', type: 'normal' },
    { text: '    }', type: 'normal' },
    { text: '  ],', type: 'normal' },
    { text: '  "false_positives": [', type: 'normal' },
    { text: '    "Legitimate users who fail multiple logins then successfully authenticate', type: 'normal' },
    { text: '      and perform admin actions. Tune thresholds based on baseline behavior."', type: 'normal' },
    { text: '  ],', type: 'normal' },
    { text: '  "references": [', type: 'normal' },
    { text: '    "https://attack.mitre.org/techniques/T1110/004/",', type: 'normal' },
    { text: '    "https://developer.okta.com/docs/reference/api/system-log/"', type: 'normal' },
    { text: '  ],', type: 'normal' },
    { text: '  "max_signals": 100,', type: 'normal' },
    { text: '  "exceptions_list": [],', type: 'normal' },
    { text: '  "actions": []', type: 'normal' },
    { text: '}', type: 'normal' },
  ];

  const VERSION_DIFFS: DiffLine[][] = [
    // Index 0 — current: 4 changes (risk_score, severity, tags, version)
    [
      ...BASE_JSON.slice(0, 2),
      ...BASE_JSON.slice(2, 6),
      { text: '  "risk_score": 73,', type: 'added' },
      { text: '  "risk_score": 47,', type: 'removed' },
      { text: '  "severity": "high",', type: 'added' },
      { text: '  "severity": "medium",', type: 'removed' },
      ...BASE_JSON.slice(9, 25),
      { text: '  "version": 4,', type: 'added' },
      { text: '  "version": 3,', type: 'removed' },
      ...BASE_JSON.slice(26, 32),
      { text: '    "Resources: Investigation Guide"', type: 'added' },
      ...BASE_JSON.slice(32),
    ],
    // Index 1 — 1 week ago: description + tag removed
    [
      ...BASE_JSON.slice(0, 2),
      { text: '  "description": "Detects a full credential stuffing attack chain in Okta where the same user', type: 'added' },
      { text: '    and source IP exhibit multiple failed logins, at least one MFA failure...',  type: 'added' },
      { text: '  "description": "Monitors for Okta token creation events that may indicate', type: 'removed' },
      { text: '    unauthorised access or lateral movement within Okta.",', type: 'removed' },
      ...BASE_JSON.slice(6, 25),
      { text: '  "version": 3,', type: 'added' },
      { text: '  "version": 2,', type: 'removed' },
      ...BASE_JSON.slice(26, 31),
      { text: '    "Tactic: Initial Access"', type: 'removed' },
      ...BASE_JSON.slice(32),
    ],
    // Index 2 — 2 weeks ago: risk_score + severity
    [
      ...BASE_JSON.slice(0, 6),
      { text: '  "risk_score": 47,', type: 'added' },
      { text: '  "risk_score": 21,', type: 'removed' },
      { text: '  "severity": "medium",', type: 'added' },
      { text: '  "severity": "low",', type: 'removed' },
      ...BASE_JSON.slice(9),
    ],
    // Index 3 — 1 month ago: query update + index
    [
      ...BASE_JSON.slice(0, 10),
      { text: '  "query": "FROM logs-okta* | WHERE event.dataset == \\"okta.system\\"',  type: 'added' },
      { text: '    | STATS failed_logins = COUNT(*) ...",', type: 'added' },
      { text: '  "query": "event.dataset: okta.system AND event.action: user.token.create",', type: 'removed' },
      ...BASE_JSON.slice(16, 17),
      { text: '  "index": ["logs-okta*"],', type: 'added' },
      { text: '  "index": ["auditbeat-*", "filebeat-*"],', type: 'removed' },
      ...BASE_JSON.slice(18),
    ],
    // Index 4 — Enabled (no content diff)
    [
      ...BASE_JSON.slice(0, 20),
      { text: '  "enabled": true,', type: 'added' },
      { text: '  "enabled": false,', type: 'removed' },
      ...BASE_JSON.slice(21),
    ],
    // Index 5 — Disabled (no content diff)
    [
      ...BASE_JSON.slice(0, 20),
      { text: '  "enabled": false,', type: 'added' },
      { text: '  "enabled": true,', type: 'removed' },
      ...BASE_JSON.slice(21),
    ],
    // Index 6 — major refactor: interval + from + false_positives
    [
      ...BASE_JSON.slice(0, 18),
      { text: '  "interval": "5m",', type: 'added' },
      { text: '  "interval": "10m",', type: 'removed' },
      { text: '  "from": "now-30m",', type: 'added' },
      { text: '  "from": "now-60m",', type: 'removed' },
      ...BASE_JSON.slice(20, 44),
      { text: '    "Legitimate users who fail multiple logins then successfully authenticate', type: 'added' },
      { text: '      and perform admin actions. Tune thresholds based on baseline behavior."', type: 'added' },
      { text: '    "None identified."', type: 'removed' },
      ...BASE_JSON.slice(46),
    ],
    // Index 7 — added MITRE threat block + references
    [
      ...BASE_JSON.slice(0, 33),
      { text: '    { "framework": "MITRE ATT&CK",', type: 'added' },
      { text: '      "tactic": { "id": "TA0006", "name": "Credential Access" },', type: 'added' },
      { text: '      "technique": [{ "id": "T1110", "name": "Brute Force" }]', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '  "threat": [],', type: 'removed' },
      ...BASE_JSON.slice(44, 48),
      { text: '    "https://attack.mitre.org/techniques/T1110/004/",', type: 'added' },
      { text: '    "https://developer.okta.com/docs/reference/api/system-log/"', type: 'added' },
      { text: '  // no references previously', type: 'removed' },
      ...BASE_JSON.slice(50),
    ],
    // Index 8 — rule renamed + rule_id updated
    [
      ...BASE_JSON.slice(0, 1),
      { text: '  "name": "Okta Credential Stuffing with Successful Account Takeover",', type: 'added' },
      { text: '  "name": "Okta Token Alert",', type: 'removed' },
      ...BASE_JSON.slice(2, 22),
      { text: '  "rule_id": "okta-credstuff-takeover-001",', type: 'added' },
      { text: '  "rule_id": "okta_token_alert",', type: 'removed' },
      ...BASE_JSON.slice(24),
    ],
    // Index 9 — initial creation (all lines added)
    BASE_JSON.map(l => ({ ...l, type: 'added' as const })),
  ];

  const RULE_YAML_LINES = VERSION_DIFFS[selectedHistoryIdx] ?? VERSION_DIFFS[0];
  const diffChanges = RULE_YAML_LINES.filter(l => l.type !== 'normal');

  // Inline diff segments per version for the UI view
  type InlineSeg = { text: string; type: 'normal' | 'added' | 'removed' };
  type TagDiff  = { label: string; type: 'normal' | 'added' | 'removed' };
  const INLINE_DIFFS: Record<number, { description?: InlineSeg[]; query?: InlineSeg[]; tags?: TagDiff[]; riskScore?: string; riskScoreOld?: string; severity?: string; severityOld?: string }> = {
    0: {
      description: [
        { text: "Detects attempts to create an Okta API token. An adversary may create an Okta API token to maintain access to an organization's network while they work to achieve their objectives. An attacker may abuse an ", type: 'normal' },
        { text: 'API token', type: 'added' },
        { text: 'Okta token', type: 'removed' },
        { text: ' to execute techniques such as creating user accounts or disabling security rules or policies.', type: 'normal' },
      ],
      tags: [
        { label: 'Domain: Endpoint', type: 'normal' },
        { label: 'OS: Windows', type: 'normal' },
        { label: 'Use Case: Threat Detection', type: 'normal' },
        { label: 'Tactic: Lateral Movement', type: 'normal' },
        { label: 'Resources: Investigation Guide', type: 'added' },
        { label: 'Data Source: Elastic Defend', type: 'normal' },
      ],
      riskScore: '73', riskScoreOld: '47', severity: 'high', severityOld: 'medium',
    },
    1: {
      description: [
        { text: "Detects attempts to create an Okta API token. An adversary may create an Okta API token to maintain access to an organization's network while they work to achieve their objectives. An attacker may abuse an API token to execute techniques such as creating user accounts or ", type: 'normal' },
        { text: 'disabling security rules or policies.', type: 'added' },
        { text: 'disabling security rules or policies via token abuse.', type: 'removed' },
      ],
      tags: [
        { label: 'Domain: Endpoint', type: 'normal' },
        { label: 'OS: Windows', type: 'normal' },
        { label: 'Use Case: Threat Detection', type: 'normal' },
        { label: 'Tactic: Lateral Movement', type: 'normal' },
        { label: 'Data Source: Elastic Defend', type: 'normal' },
        { label: 'Okta tokens', type: 'removed' },
      ],
    },
    2: {
      description: [
        { text: 'Monitors for suspicious Okta token activity across the environment. ', type: 'removed' },
        { text: "Detects attempts to create an Okta API token. An adversary may create an Okta API token to maintain access to an organization's network.", type: 'added' },
      ],
      riskScore: '47', riskScoreOld: '21', severity: 'medium', severityOld: 'low',
    },
    3: {
      query: [
        { text: 'event.kind: alert and event.module: okta and event.type: creation', type: 'added' },
        { text: 'event.dataset: okta.system and event.action: user.token.create', type: 'removed' },
      ],
      tags: [
        { label: 'Domain: Endpoint', type: 'normal' },
        { label: 'Tactic: Lateral Movement', type: 'normal' },
        { label: 'Data Source: Elastic Defend', type: 'normal' },
        { label: 'EQL', type: 'added' },
        { label: 'Okta tokens', type: 'normal' },
      ],
    },
    6: {
      description: [
        { text: 'Detects a full credential stuffing attack chain in Okta where the same user and source IP exhibit multiple failed logins, at least one MFA failure, a successful authentication, followed by ', type: 'normal' },
        { text: 'post-compromise activity such as privilege grants or policy modifications.', type: 'added' },
        { text: 'anomalous post-authentication events.', type: 'removed' },
        { text: ' This sequence indicates a likely successful account takeover.', type: 'normal' },
      ],
      query: [
        { text: 'FROM logs-okta* | WHERE event.dataset == "okta.system"\n  | STATS failed_logins = COUNT(*), successful_logins = COUNT(*) BY user.name', type: 'added' },
        { text: 'event.dataset: okta.system AND event.action: user.session.start AND event.outcome: failure', type: 'removed' },
      ],
      tags: [
        { label: 'Domain: Endpoint', type: 'normal' },
        { label: 'Tactic: Lateral Movement', type: 'normal' },
        { label: 'Use Case: Threat Detection', type: 'removed' },
        { label: 'Use Case: Identity and Access Audit', type: 'added' },
        { label: 'Data Source: Elastic Defend', type: 'normal' },
      ],
    },
    7: {
      description: [
        { text: 'Monitors for suspicious Okta token activity across the environment.', type: 'removed' },
        { text: 'Detects a full credential stuffing attack chain in Okta where the same user and source IP exhibit multiple failed logins, at least one MFA failure, and a successful authentication.', type: 'added' },
      ],
    },
    8: {
      description: [
        { text: 'Alert on Okta token events.', type: 'removed' },
        { text: 'Monitors for suspicious Okta token activity across the environment.', type: 'added' },
      ],
      query: [
        { text: 'event.dataset: okta.system', type: 'added' },
        { text: 'event.action: user.token.create', type: 'removed' },
      ],
      tags: [
        { label: 'Domain: Endpoint', type: 'added' },
        { label: 'OS: Windows', type: 'added' },
      ],
    },
  };

  const activeDiff = isHistoryPaneOpen ? INLINE_DIFFS[selectedHistoryIdx] : undefined;

  const renderInlineText = (segs?: InlineSeg[]) => {
    if (!segs) return null;
    return (
      <span>
        {segs.map((seg, i) => {
          if (seg.type === 'normal') return <span key={i}>{seg.text}</span>;
          const bg = seg.type === 'added' ? 'rgba(0,191,179,0.18)' : 'rgba(189,39,30,0.12)';
          const decoration = seg.type === 'removed' ? 'line-through' : 'none';
          const color = seg.type === 'added' ? '#017D73' : '#BD271E';
          return (
            <span key={i} style={{ background: bg, color, textDecoration: decoration, borderRadius: 2, padding: '0 2px' }}>
              {seg.text}
            </span>
          );
        })}
      </span>
    );
  };


  const versionHistory = [
    { timestamp: 'May 12 2026 @14.23', author: 'Alex Nightingale', isElastic: false, detail: '4 changes',  ruleVersion: 'R78', version: 'V5', isCurrent: true,  note: null },
    { timestamp: 'May 12 2026 @14.23', author: 'Alex Nightingale', isElastic: false, detail: '4 changes',  ruleVersion: 'R77', version: 'V5', isCurrent: false, note: "Removed 'Okta tokens' tag If this goes long then once expanded we can view the whole message up to a max character count. Maybe around 200?" },
    { timestamp: 'May 10 2026 @17.18', author: 'Elastic',          isElastic: true,  detail: '4 changes',  ruleVersion: 'R76', version: 'V5', isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Pavel M',          isElastic: false, detail: '12 changes', ruleVersion: 'R75', version: 'V4', isCurrent: false, note: null },
    { timestamp: 'May 12 2026 @14.23', author: 'Alex Nightingale', isElastic: false, detail: '6 changes',  ruleVersion: 'R74', version: 'V4', isCurrent: false, note: "Removed 'Okta tokens' tag If this goes long then once expanded we can view the whole message up to a max character count. Maybe around 200?" },
    { timestamp: 'May 10 2026 @17.18', author: 'Elastic',          isElastic: true,  detail: '4 changes',  ruleVersion: 'R73', version: 'V4', isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Alex Nightingale', isElastic: false, detail: 'Enabled the rule',     ruleVersion: '',    version: '',    isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Alex Nightingale', isElastic: false, detail: 'Disabled the rule',    ruleVersion: '',    version: '',    isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Pavel M',          isElastic: false, detail: '7 changes',  ruleVersion: 'R72', version: 'V3', isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Pavel M',          isElastic: false, detail: '8 changes',  ruleVersion: 'R71', version: 'V3', isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Alex Nightingale', isElastic: false, detail: 'Enabled notifications',  ruleVersion: '', version: '', isCurrent: false, note: null },
    { timestamp: 'May 10 2026 @17.18', author: 'Alex Nightingale', isElastic: false, detail: 'Snooze notifications',   ruleVersion: '', version: '', isCurrent: false, note: null },
  ];
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [summaryState, setSummaryState] = useState<'idle' | 'generating' | 'generated'>('idle');

  const generateSummary = () => {
    setSummaryState('generating');
    setTimeout(() => setSummaryState('generated'), 2500);
  };
  const [flyoutSections, setFlyoutSections] = useState<Record<string, boolean>>({
    summary: true,
    message: true,
    alerts: true,
    metrics: true,
    flow: true,
    logs: true,
    matched: true,
  });
  const toggleFlyoutSection = (key: string) =>
    setFlyoutSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const [expandedFlowSteps, setExpandedFlowSteps] = useState<Record<number, boolean>>({});
  const toggleFlowStep = (idx: number) =>
    setExpandedFlowSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const executionFlowSteps = [
    {
      label: 'Start rule execution',
      duration: 'Mar 5 @ 2026 19:36:41.095',
      children: [],
    },
    {
      label: 'Query Elasticsearch',
      duration: '3m 124 ms',
      children: [],
    },
    {
      label: 'Process results',
      duration: '124 ms',
      children: [
        { label: 'No index matching logs-endpoint.alerts-*', duration: '25 ms' },
        { label: 'Changing rule status to "succeeded"', duration: '25 ms' },
      ],
    },
    {
      label: 'Generate alerts if found',
      duration: '234 ms',
      children: [],
    },
    {
      label: 'Completed',
      duration: '24 ms',
      children: [],
    },
  ];
  const [flyoutTab, setFlyoutTab] = useState('overview');
  const [isCompactHeader, setIsCompactHeader] = useState(false);

  // Find the rule from parsed data
  const rule = parsedRulesData.find((r: any) => r.id === ruleId) as DetectionRule | undefined;

  if (!rule) {
    return (
      <>
        <SecurityHeader onMenuClick={() => {}} />
        <SecuritySideNav />
        <div style={{ marginTop: 48, marginLeft: 80, padding: 24 }}>
          <EuiCallOut title="Rule not found" color="danger" iconType="alert">
            <p>The requested rule could not be found.</p>
            <EuiSpacer size="s" />
            <EuiButton onClick={() => navigate('/detection-rules')}>
              Back to Rules
            </EuiButton>
          </EuiCallOut>
        </div>
      </>
    );
  }

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'danger' => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'success';
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'alerts' as const, label: 'Alerts' },
    { id: 'exceptions' as const, label: 'Rule exceptions' },
    { id: 'execution' as const, label: 'Execution results' },
  ];

  const visibleTabs = isHistoryPaneOpen ? [] : tabs;

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ 
        backgroundColor: '#F6F9FC', 
        minHeight: '100vh', 
        marginTop: 48,
        marginLeft: 80,
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart">
          {/* Secondary Navigation */}
          <EuiFlexItem grow={false}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                minHeight: 'calc(100vh - 64px)'
              }}
            >
              <RulesSecondaryNav />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Content */}
          <EuiFlexItem>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                minHeight: 'calc(100vh - 64px)',
                position: 'relative',
              }}
            >
              <div style={{ padding: '24px' }}>
                {/* Title row: back arrow + rule name + action buttons */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                  <EuiFlexItem>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType="arrowLeft"
                          aria-label="Back to rules"
                          color="text"
                          size="s"
                          onClick={() => navigate('/detection-rules')}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiTitle size="l">
                          <h1>{rule.name}</h1>
                        </EuiTitle>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiSwitch
                          label={isEnabled ? 'Enabled' : 'Disabled'}
                          checked={isEnabled}
                          onChange={(e) => !isHistoryPaneOpen && setIsEnabled(e.target.checked)}
                          disabled={isHistoryPaneOpen}
                          compressed
                        />
                      </EuiFlexItem>
                      {!isHistoryPaneOpen && (
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty iconType="play" size="s">
                          Manual run
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                      )}
                      {!isHistoryPaneOpen && (
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty iconType="discuss" size="s">
                          Add to chat
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                      )}
                      {!isHistoryPaneOpen && <EuiFlexItem grow={false}>
                        <EuiPopover
                          button={
                            <EuiButtonIcon
                              iconType="boxesHorizontal"
                              aria-label="More actions"
                              size="s"
                              color="text"
                              onClick={() => setIsMoreActionsOpen((v) => !v)}
                            />
                          }
                          isOpen={isMoreActionsOpen}
                          closePopover={() => setIsMoreActionsOpen(false)}
                          panelPaddingSize="none"
                          anchorPosition="downRight"
                        >
                          <EuiContextMenu
                            initialPanelId={0}
                            panels={[
                              {
                                id: 0,
                                items: [
                                  {
                                    name: 'History',
                                    icon: 'clock',
                                    onClick: () => {
                                      setIsMoreActionsOpen(false);
                                      setIsHistoryPaneOpen(true);
                                      setViewMode('json');
                                      setSelectedTab('overview');
                                    },
                                  },
                                  {
                                    name: 'Duplicate rule',
                                    icon: 'copy',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Export rule',
                                    icon: 'exportAction',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Snooze notifications',
                                    icon: 'bell',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Refresh',
                                    icon: 'refresh',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Delete rule',
                                    icon: 'trash',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  { isSeparator: true },
                                  {
                                    name: 'Add integrations',
                                    icon: 'plusInCircle',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Documentation',
                                    icon: 'popout',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                  {
                                    name: 'Feedback',
                                    icon: 'editorComment',
                                    onClick: () => setIsMoreActionsOpen(false),
                                  },
                                ],
                              },
                            ]}
                          />
                        </EuiPopover>
                      </EuiFlexItem>}
                      {!isHistoryPaneOpen && (
                      <EuiFlexItem grow={false}>
                        <EuiButton iconType="pencil" size="s" fill>
                          Edit
                        </EuiButton>
                      </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Metadata - single row */}
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="m" responsive={false} alignItems="center" wrap>
                  <EuiFlexItem grow={false}>
                    <EuiHealth color="warning" style={{ fontSize: '12px' }}>
                      Warning at Mar 24, 2026 @ 12:32:54.909
                    </EuiHealth>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Created by: analyst on Oct 10, 2024 @ 00:11:03.178
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Updated by: analyst on Feb 8, 2026 @ 04:37:53.533
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                {/* MITRE stale-mapping banner — above tabs */}
                {viewMode === 'ui' && staleCount > 0 && !staleMappingCalloutDismissed && !isHistoryPaneOpen && (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 16px',
                      background: '#F6F9FC',
                      border: '1px solid #E3E8F2',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{ flexShrink: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EuiIcon type="securityAnalyticsApp" size="xl" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#111C2C', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                            MITRE ATT&amp;CK {attackVersion} is out
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#111C2C', lineHeight: '20px', width: 10, textAlign: 'center' }}>·</span>
                          <span style={{ fontSize: 14, color: '#516381', lineHeight: '20px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            This rule is mapped to techniques that have been revoked or updated.
                          </span>
                        </div>
                        <span style={{ fontSize: 14, color: '#516381', lineHeight: '20px' }}>
                          Review and remap to keep your detection coverage current.
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <EuiButtonEmpty size="s" iconType="popout" iconSide="right" color="primary" href="#" target="_blank">
                          Learn more
                        </EuiButtonEmpty>
                        {isEnterprise ? (
                          <EuiButton size="s" iconType="sparkles" iconSide="left" color="primary" onClick={handleRemapWithAI}>
                            Remap with AI
                          </EuiButton>
                        ) : (
                          <EuiToolTip content="Remap with AI requires an Enterprise licence. Upgrade to access this feature.">
                            <EuiButton size="s" iconType="sparkles" iconSide="left" color="primary" onClick={handleRemapWithAI}>
                              Remap with AI
                            </EuiButton>
                          </EuiToolTip>
                        )}
                      </div>
                      <EuiButtonIcon
                        iconType="cross"
                        aria-label="Dismiss MITRE ATT&CK banner"
                        color="text"
                        size="xs"
                        display="empty"
                        onClick={() => setStaleMappingCalloutDismissed(true)}
                        style={{ flexShrink: 0 }}
                      />
                    </div>
                    <EuiSpacer size="m" />
                  </>
                )}

                {/* Tabs — hidden in JSON mode or when history pane is open */}
                {viewMode === 'ui' && !isHistoryPaneOpen && (
                  <EuiTabs size="l">
                    {visibleTabs.map((tab) => (
                      <EuiTab
                        key={tab.id}
                        isSelected={selectedTab === tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                      >
                        {tab.label}
                      </EuiTab>
                    ))}
                  </EuiTabs>
                )}

                <EuiSpacer size="m" />

                {/* ── JSON diff view ── */}
                {viewMode === 'json' && (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: 6,
                      overflow: 'auto',
                      fontFamily: "'Roboto Mono', 'Fira Code', monospace",
                      fontSize: 12,
                      lineHeight: '22px',
                      border: '1px solid #D3DAE6',
                    }}>
                      {RULE_YAML_LINES.map((line, i) => {
                        const lineNum = i + 1;
                        const bg = line.type === 'added' ? '#E6F9F0' : line.type === 'removed' ? '#FDF0EF' : 'transparent';
                        const color = line.type === 'added' ? '#017D73' : line.type === 'removed' ? '#BD271E' : '#343741';
                        return (
                          <div key={i} style={{ display: 'flex', background: bg, minHeight: 22 }}>
                            <span style={{
                              minWidth: 44, textAlign: 'right', padding: '0 12px 0 8px',
                              color: '#98A2B3', userSelect: 'none', flexShrink: 0,
                              borderRight: '1px solid #EEF0F3',
                            }}>
                              {lineNum}
                            </span>
                            <span style={{ padding: '0 16px', color, whiteSpace: 'pre', flex: 1 }}>
                              {line.text || '\u00A0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Warning Callout + tabs content — only in UI mode */}
                {viewMode === 'ui' && showWarning && (
                  <>
                    <EuiCallOut
                      title="Warning at Mar 18, 2026 @ 21:14:17.686"
                      color="warning"
                      iconType="warning"
                      onDismiss={() => setShowWarning(false)}
                    >
                      <EuiText size="s">
                        Unable to find warning indices for rule {rule.name}. This warning will persist until one of the following occurs: a matching index is created or the rule is disabled.
                      </EuiText>
                      <EuiSpacer size="s" />
                      <EuiButtonEmpty size="xs" iconType="help">
                        Ask Assistant
                      </EuiButtonEmpty>
                    </EuiCallOut>
                    <EuiSpacer size="m" />
                  </>
                )}

                {/* Main Content: About and Definition — UI mode only */}
                {viewMode === 'ui' && selectedTab === 'overview' && (
                  <EuiFlexGroup gutterSize="l" alignItems="stretch">
                    {/* Left Column: About (60% width) */}
                    <EuiFlexItem grow={6}>
                      <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m" style={{ height: '100%' }}>
                        <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiTitle size="m">
                              <h2>About</h2>
                            </EuiTitle>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiButtonGroup
                              legend="About view toggle"
                              options={[
                                { id: 'details', label: 'Details' },
                                { id: 'investigation', label: 'Investigation guide' },
                              ]}
                              idSelected={aboutViewToggle}
                              onChange={(id) => setAboutViewToggle(id)}
                              buttonSize="s"
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>

                        <EuiSpacer size="m" />

                        <EuiDescriptionList
                          type="column"
                          style={{ rowGap: '24px', columnGap: '64px' }}
                          listItems={[
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 4 }}>Description</EuiText>,
                              description: (
                                <EuiText size="s">
                                  {activeDiff?.description
                                    ? renderInlineText(activeDiff.description)
                                    : (rule.description || 'No description available.')
                                  }
                                </EuiText>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Version</EuiText>,
                              description: <EuiBadge color="hollow">209</EuiBadge>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Revision</EuiText>,
                              description: <EuiBadge color="hollow">29</EuiBadge>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Author</EuiText>,
                              description: <EuiText size="s">Elastic</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Severity</EuiText>,
                              description: (
                                <EuiHealth color={getSeverityColor(rule.severity)}>
                                  {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                                </EuiHealth>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Risk score</EuiText>,
                              description: (
                                <EuiText size="s">
                                  {activeDiff?.riskScore ? (
                                    <span>
                                      <span style={{ background: 'rgba(0,191,179,0.18)', color: '#017D73', borderRadius: 2, padding: '0 3px' }}>{activeDiff.riskScore}</span>
                                      {' '}
                                      <span style={{ background: 'rgba(189,39,30,0.12)', color: '#BD271E', textDecoration: 'line-through', borderRadius: 2, padding: '0 3px' }}>{activeDiff.riskScoreOld}</span>
                                    </span>
                                  ) : rule.riskScore}
                                </EuiText>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Reference URLs</EuiText>,
                              description: (
                                <ul style={{ margin: 0, paddingLeft: 0, listStylePosition: 'inside' }}>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://research.checkpoint.com/2020/resolving-your-way-into-domain-admin-exploiting-a-17-year-old-bug-in-windows-dns-servers/
                                    </EuiLink>
                                  </li>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://msrc-blog.microsoft.com/2020/07/14/july-2020-security-update-cve-2020-1350-vulnerability-in-windows-domain-name-system-dns-server/
                                    </EuiLink>
                                  </li>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://www.elastic.co/security-labs/detection-rules-for-sigred-vulnerability
                                    </EuiLink>
                                  </li>
                                </ul>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>False positive examples</EuiText>,
                              description: (
                                <EuiText size="s">
                                  <p>
                                    Verified test sets will legitimately spawn when dns.exe service is in a occurring event. 
                                    Denial of Service (DoS) attempts by intentionally crashing the service will also cause new/fault dns to spawn.
                                  </p>
                                </EuiText>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>License</EuiText>,
                              description: <EuiText size="s">Elastic License v2</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>MITRE ATT&amp;CK™</EuiText>,
                              description: (
                                <EuiFlexGroup direction="column" gutterSize="xs">
                                  <EuiFlexItem>
                                    <EuiLink href="#">Lateral Movement [TA0008]</EuiLink>
                                  </EuiFlexItem>
                                  <EuiFlexItem style={{ paddingLeft: 16 }}>
                                    <EuiLink href="#">Exploitation of Remote Services [T1210]</EuiLink>
                                  </EuiFlexItem>
                                </EuiFlexGroup>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Timestamp override</EuiText>,
                              description: <EuiText size="s">event.ingested</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Max alerts per run</EuiText>,
                              description: <EuiText size="s">100</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Tags</EuiText>,
                                description: (
                                  <EuiFlexGroup gutterSize="s" wrap>
                                    {activeDiff?.tags ? activeDiff.tags.map((t, i) => (
                                      <EuiFlexItem key={i} grow={false}>
                                        <EuiBadge
                                          color={t.type === 'added' ? 'success' : t.type === 'removed' ? 'danger' : 'hollow'}
                                          style={t.type === 'added' ? { background: 'rgba(0,191,179,0.15)', border: '1px solid #00BFB3', color: '#017D73' } : t.type === 'removed' ? { background: 'rgba(189,39,30,0.1)', border: '1px solid #BD271E', color: '#BD271E', textDecoration: 'line-through' } : undefined}
                                        >
                                          {t.label}
                                        </EuiBadge>
                                      </EuiFlexItem>
                                    )) : (
                                      <>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Domain: Endpoint</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">OS: Windows</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Use Case: Threat Detection</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Tactic: Lateral Movement</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Resources: Investigation Guide</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Elastic Defend</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Windows Security Event Log</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: System</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: SentinelOne</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Crowdstrike</EuiBadge>
                                    </EuiFlexItem>
                                    </>
                                    )}
                                  </EuiFlexGroup>
                                ),
                              },
                            ]}
                          />
                      </EuiPanel>
                    </EuiFlexItem>

                    {/* Right Column: Definition & Schedule (40% width) */}
                    <EuiFlexItem grow={4}>
                      <EuiFlexGroup direction="column" gutterSize="m">
                        {/* Definition Section */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m">
                            <EuiTitle size="m">
                              <h2>Definition</h2>
                            </EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                              type="column"
                              style={{ rowGap: '24px', columnGap: '64px' }}
                              listItems={[
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Index patterns</EuiText>,
                                description: (
                                  <EuiFlexGroup gutterSize="s" wrap>
                                    {['endgame-*', 'logs-crowdstrike.fdr*', 'logs-endpoint.events.process-*', 
                                      'logs-m365_defender.event-*', 'logs-sentinel_one_cloud_funnel.*', 
                                      'logs-system.security*', 'logs-windows.forwarded*', 
                                      'logs-windows.sysmon_operational-*', 'winlogbeat-*'].map((pattern, idx) => (
                                      <EuiFlexItem grow={false} key={idx}>
                                        <EuiBadge color="hollow">{pattern}</EuiBadge>
                                      </EuiFlexItem>
                                    ))}
                                  </EuiFlexGroup>
                                ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>EQL query</EuiText>,
                                  description: (
                                    <EuiText size="s" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                      {activeDiff?.query ? renderInlineText(activeDiff.query) :
`process where host.os.type == "windows" and event.type == "start"
  and process.parent.name : "dns.exe" and
  not process.executable :
      ("?:\\Windows\\System32\\werfault.exe",
       "?:\\Windows\\System32\\conhost.exe",
       "?:\\Program Files\\BeyondTrust\\One2OneHost.exe*") and
  (process.name : ("cmd.exe", "powershell.exe",
                   "?:\\DeviceHarddiskVolume?\\Windows\\System32\\conhost.exe")
   and
   not process.parent.executable :
       ("?:\\Program Files\\BeyondTrust\\One2OneHost.exe*"))`}
                                    </EuiText>
                                  ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Rule type</EuiText>,
                                  description: <EuiText size="s">Event Correlation</EuiText>,
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Related integrations</EuiText>,
                                  description: (
                                  <EuiFlexGroup direction="column" gutterSize="s">
                                    {[
                                      { name: 'CrowdStrike', status: 'Not installed', color: 'default' },
                                      { name: 'Elastic Defend', status: 'Installed', color: 'success' },
                                      { name: 'Microsoft Defender XDR', status: 'Not installed', color: 'default' },
                                      { name: 'SentinelOne Cloud Funnel', status: 'Not installed', color: 'default' },
                                      { name: 'Windows', status: 'Not installed', color: 'default' },
                                    ].map((integration, idx) => (
                                      <EuiFlexItem key={idx}>
                                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                          <EuiFlexItem grow={false}>
                                            <EuiLink href="#">{integration.name}</EuiLink>
                                          </EuiFlexItem>
                                          <EuiFlexItem grow={false}>
                                            <EuiBadge color={integration.color as any}>{integration.status}</EuiBadge>
                                          </EuiFlexItem>
                                        </EuiFlexGroup>
                                      </EuiFlexItem>
                                    ))}
                                  </EuiFlexGroup>
                                ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Required fields</EuiText>,
                                  description: (
                                    <EuiFlexGroup direction="column" gutterSize="xs">
                                      {['event.type', 'host.os.type', 'process.executable', 'process.name', 'process.parent.name'].map((field, idx) => (
                                        <EuiFlexItem key={idx}>
                                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                            <EuiFlexItem grow={false}>
                                              <EuiIcon type="tokenField" size="s" />
                                            </EuiFlexItem>
                                            <EuiFlexItem>
                                              <EuiText size="s">{field}</EuiText>
                                            </EuiFlexItem>
                                          </EuiFlexGroup>
                                        </EuiFlexItem>
                                      ))}
                                    </EuiFlexGroup>
                                  ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Timeline template</EuiText>,
                                  description: <EuiText size="s">None</EuiText>,
                                },
                            ]}
                            />
                          </EuiPanel>
                        </EuiFlexItem>

                        {/* Schedule Section */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m">
                            <EuiTitle size="m">
                              <h2>Schedule</h2>
                            </EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                              type="column"
                              style={{ rowGap: '24px', columnGap: '64px' }}
                              listItems={[
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Runs every</EuiText>,
                                  description: <EuiText size="s">5m</EuiText>,
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 600, marginBottom: 12 }}>Additional look-back time</EuiText>,
                                  description: <EuiText size="s">4m</EuiText>,
                                },
                              ]}
                            />
                          </EuiPanel>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}

                {viewMode === 'ui' && selectedTab === 'execution' && (
                  <>
                    {/* Execution log */}
                    <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m" style={{ borderRadius: '6px' }}>

                      {/* Panel title row with filter dropdowns */}
                      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiTitle size="m"><h2>Execution log</h2></EuiTitle>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiFilterGroup>
                                <EuiPopover
                                  button={
                                    <EuiFilterButton
                                      iconType="arrowDown"
                                      iconSide="right"
                                      onClick={() => setRunTypePopoverOpen(!runTypePopoverOpen)}
                                      isSelected={runTypePopoverOpen}
                                      numFilters={runTypeOptions.length}
                                      numActiveFilters={runTypeActiveCount}
                                      hasActiveFilters={runTypeActiveCount > 0}
                                    >
                                      Run type
                                    </EuiFilterButton>
                                  }
                                  isOpen={runTypePopoverOpen}
                                  closePopover={() => setRunTypePopoverOpen(false)}
                                  panelPaddingSize="none"
                                >
                                  <EuiSelectable
                                    searchable
                                    searchProps={{ placeholder: 'Filter list', compressed: true }}
                                    options={runTypeOptions}
                                    onChange={(opts) => setRunTypeOptions(opts)}
                                  >
                                    {(list, search) => (
                                      <div style={{ width: 240 }}>
                                        <div style={{ padding: '8px 8px 4px' }}>{search}</div>
                                        {list}
                                      </div>
                                    )}
                                  </EuiSelectable>
                                </EuiPopover>
                              </EuiFilterGroup>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiFilterGroup>
                                <EuiPopover
                                  button={
                                    <EuiFilterButton
                                      iconType="arrowDown"
                                      iconSide="right"
                                      onClick={() => setStatusPopoverOpen(!statusPopoverOpen)}
                                      isSelected={statusPopoverOpen}
                                      numFilters={statusOptions.length}
                                      numActiveFilters={statusActiveCount}
                                      hasActiveFilters={statusActiveCount > 0}
                                    >
                                      Status
                                    </EuiFilterButton>
                                  }
                                  isOpen={statusPopoverOpen}
                                  closePopover={() => setStatusPopoverOpen(false)}
                                  panelPaddingSize="none"
                                >
                                  <EuiSelectable
                                    searchable
                                    searchProps={{ placeholder: 'Filter list', compressed: true }}
                                    options={statusOptions}
                                    onChange={(opts) => setStatusOptions(opts)}
                                  >
                                    {(list, search) => (
                                      <div style={{ width: 240 }}>
                                        <div style={{ padding: '8px 8px 4px' }}>{search}</div>
                                        {list}
                                      </div>
                                    )}
                                  </EuiSelectable>
                                </EuiPopover>
                              </EuiFilterGroup>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton size="s" iconType="calendar">Last 90 days</EuiButton>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      {/* Summary health bar */}
                      <EuiPanel color="plain" hasBorder hasShadow={false} paddingSize="none">
                        <div style={{ padding: '14px 16px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                          <EuiText size="s"><strong>Overall health:</strong></EuiText>
                          <EuiBadge color="danger">Action required</EuiBadge>

                          <div style={{ width: 1, height: 16, background: '#d3dae6' }} />

                          <EuiText size="s"><strong>Last run:</strong></EuiText>
                          <EuiBadge color="danger">Failed</EuiBadge>
                          <EuiText size="s" color="subdued">4 min ago</EuiText>

                          <div style={{ width: 1, height: 16, background: '#d3dae6' }} />

                          <EuiText size="s"><strong>Failure rate:</strong></EuiText>
                          <EuiBadge color="danger">0.4%</EuiBadge>

                          <div style={{ width: 1, height: 16, background: '#d3dae6' }} />

                          <EuiText size="s"><strong>Total executions:</strong></EuiText>
                          <EuiBadge color="hollow">1532</EuiBadge>

                          <div style={{ width: 1, height: 16, background: '#d3dae6' }} />

                          <EuiText size="s"><strong>Gaps:</strong></EuiText>
                          <EuiBadge color="warning">2 detected</EuiBadge>
                        </div>
                      </EuiPanel>

                      <EuiSpacer size="m" />

                      {/* Filters and controls */}
                      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">Showing 40 rule executions</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiSwitch
                                label="Show source event time range"
                                checked={showSourceEventRange}
                                onChange={(e) => setShowSourceEventRange(e.target.checked)}
                                compressed
                              />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiSwitch
                                label="Show metrics columns"
                                checked={showMetricsColumns}
                                onChange={(e) => setShowMetricsColumns(e.target.checked)}
                                compressed
                              />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">Updated 3 minutes ago</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButtonIcon iconType="refresh" aria-label="Refresh" size="s" />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      <EuiBasicTable
                      items={[
                        { id: '1', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 1, matchedEvents: 63, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '2', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 2, matchedEvents: 36, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '3', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 0, matchedEvents: 244, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '4', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 1, matchedEvents: 164, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '5', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 64, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '6', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 3, matchedEvents: 46, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '7', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 23, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '8', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 145, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '9', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 4, matchedEvents: 31, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '10', status: 'error', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 153, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                      ].slice(executionPageIndex * executionPageSize, (executionPageIndex + 1) * executionPageSize)}
                      columns={[
                        {
                          field: 'status',
                          name: 'Status',
                          width: '120px',
                          truncateText: false,
                          render: (status: string) => {
                            const color = status === 'succeeded' ? 'success' : status === 'failed' ? 'danger' : 'warning';
                            return (
                              <div style={{ whiteSpace: 'nowrap' }}>
                                <EuiHealth color={color}>{status.charAt(0).toUpperCase() + status.slice(1)}</EuiHealth>
                              </div>
                            );
                          },
                        },
                        {
                          field: 'runType',
                          name: 'Run type',
                          width: '110px',
                        },
                        {
                          field: 'timestamp',
                          name: 'Timestamp',
                          width: '200px',
                          truncateText: false,
                          render: (timestamp: string) => (
                            <div style={{ whiteSpace: 'nowrap' }}>{timestamp}</div>
                          ),
                        },
                        ...(showSourceEventRange ? [{
                          field: 'sourceEventRange',
                          name: 'Source event time range',
                          width: '280px',
                        }] : []),
                        {
                          field: 'duration',
                          name: 'Duration',
                          width: '100px',
                        },
                        {
                          field: 'alertsCreated',
                          name: 'Alerts created',
                          width: '120px',
                        },
                        {
                          field: 'matchedEvents',
                          name: 'Matched events',
                          width: '130px',
                        },
                        {
                          field: 'message',
                          name: 'Message',
                          truncateText: true,
                        },
                        {
                          name: 'Action',
                          width: '100px',
                          render: (item: any) => (
                            <EuiLink 
                              onClick={() => {
                                setSelectedExecution(item);
                                setIsFlyoutVisible(true);
                              }}
                            >
                              View details
                            </EuiLink>
                          ),
                        },
                      ]}
                      pagination={{
                        pageIndex: executionPageIndex,
                        pageSize: executionPageSize,
                        totalItemCount: 40,
                        pageSizeOptions: [10, 25, 50],
                        showPerPageOptions: true,
                      }}
                      onChange={({ page }: any) => {
                        if (page) {
                          setExecutionPageIndex(page.index);
                          setExecutionPageSize(page.size);
                        }
                      }}
                    />
                    </EuiPanel>

                    <EuiSpacer size="l" />

                    {/* Manual/Gap fill tasks */}
                    <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m" style={{ borderRadius: '6px' }}>
                      <EuiTitle size="m">
                        <h2>Manual/Gap fill tasks</h2>
                      </EuiTitle>
                      <EuiSpacer size="m" />

                      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">
                            Showing 20 execution tasks
                          </EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">
                                Updated 3 minutes ago
                              </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButtonIcon iconType="refresh" aria-label="Refresh" size="s" />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton size="s" iconType="calendar">
                                Last 90 days
                              </EuiButton>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      <EuiBasicTable
                      items={[
                        { id: '1', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'John@doe.com', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 10, completed: 10, totalTasks: 25 },
                        { id: '2', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 1, completed: 1, totalTasks: 2 },
                        { id: '3', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 0, completed: 0, totalTasks: 1 },
                        { id: '4', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 0, completed: 0, totalTasks: 1 },
                      ].slice(gapFillPageIndex * gapFillPageSize, (gapFillPageIndex + 1) * gapFillPageSize)}
                      columns={[
                        {
                          field: 'status',
                          name: 'Status',
                          width: '120px',
                          render: (status: string) => (
                            <EuiHealth color="primary">In progress</EuiHealth>
                          ),
                        },
                        {
                          field: 'createdAt',
                          name: 'Created at',
                          width: '180px',
                        },
                        {
                          field: 'createdBy',
                          name: 'Created by',
                          width: '150px',
                        },
                        {
                          field: 'sourceEventRange',
                          name: 'Source event time range',
                          width: '280px',
                        },
                        {
                          field: 'errors',
                          name: 'Errors',
                          width: '80px',
                        },
                        {
                          field: 'pending',
                          name: 'Pending',
                          width: '80px',
                        },
                        {
                          field: 'running',
                          name: 'Running',
                          width: '80px',
                        },
                        {
                          field: 'completed',
                          name: 'Completed',
                          width: '100px',
                        },
                        {
                          field: 'totalTasks',
                          name: 'Total tasks',
                          width: '100px',
                        },
                        {
                          name: 'Action',
                          width: '80px',
                          render: () => (
                            <EuiLink href="#">Stop</EuiLink>
                          ),
                        },
                      ]}
                      pagination={{
                        pageIndex: gapFillPageIndex,
                        pageSize: gapFillPageSize,
                        totalItemCount: 20,
                        pageSizeOptions: [10, 25, 50],
                        showPerPageOptions: true,
                      }}
                      onChange={({ page }: any) => {
                        if (page) {
                          setGapFillPageIndex(page.index);
                          setGapFillPageSize(page.size);
                        }
                      }}
                    />
                    </EuiPanel>
                  </>
                )}

                {selectedTab !== 'overview' && selectedTab !== 'execution' && (
                  <EuiText textAlign="center" color="subdued">
                    <p>No {selectedTab} data available</p>
                  </EuiText>
                )}
              </div>

              {/* Floating view-toggle removed — JSON diff is the only mode */}
              {false && (
              <div style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: 10,
                  boxShadow: '0 1px 1px rgba(43,57,79,0.16), 0 5px 8px rgba(43,57,79,0.14), 0 10px 10px rgba(43,57,79,0.08)',
                  padding: '7px 8px',
                  pointerEvents: 'auto',
                }}>
                  <div style={{
                    background: '#F6F9FC',
                    border: '1px solid #E3E8F2',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 3,
                  }}>
                    {/* Change navigation — only in JSON mode */}
                    {viewMode === 'json' && (
                      <>
                        <button type="button" onClick={() => setDiffChangeIdx(Math.max(0, diffChangeIdx - 1))}
                          style={{ background: 'none', border: 'none', cursor: diffChangeIdx > 0 ? 'pointer' : 'default', color: diffChangeIdx > 0 ? '#0077CC' : '#D3DAE6', fontSize: 18, lineHeight: '32px', width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ‹
                        </button>
                        <span style={{ fontSize: 12, color: '#343741', fontWeight: 500, whiteSpace: 'nowrap', padding: '0 4px' }}>
                          {diffChangeIdx + 1} of {diffChanges.length} changes
                        </span>
                        <button type="button" onClick={() => setDiffChangeIdx(Math.min(diffChanges.length - 1, diffChangeIdx + 1))}
                          style={{ background: 'none', border: 'none', cursor: diffChangeIdx < diffChanges.length - 1 ? 'pointer' : 'default', color: diffChangeIdx < diffChanges.length - 1 ? '#0077CC' : '#D3DAE6', fontSize: 18, lineHeight: '32px', width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ›
                        </button>
                        <div style={{ width: 1, height: 20, background: '#D3DAE6', margin: '0 2px' }} />
                      </>
                    )}
                    {/* UI / table view */}
                    <button
                      type="button"
                      aria-label="UI view"
                      onClick={() => setViewMode('ui')}
                      style={{
                        width: 32, height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 3, border: 'none', cursor: 'pointer',
                        background: viewMode === 'ui' ? 'white' : 'transparent',
                        boxShadow: viewMode === 'ui'
                          ? '0 0 1px rgba(43,57,79,0.16), 0 1px 2px rgba(43,57,79,0.06), 0 2px 4px rgba(43,57,79,0.05)'
                          : 'none',
                      }}
                    >
                      <EuiIcon type="table" size="m" color={viewMode === 'ui' ? 'primary' : 'subdued'} />
                    </button>
                    {/* JSON / code view */}
                    <button
                      type="button"
                      aria-label="JSON view"
                      onClick={() => setViewMode('json')}
                      style={{
                        width: 32, height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 3, border: 'none', cursor: 'pointer',
                        background: viewMode === 'json' ? 'white' : 'transparent',
                        boxShadow: viewMode === 'json'
                          ? '0 0 1px rgba(43,57,79,0.16), 0 1px 2px rgba(43,57,79,0.06), 0 2px 4px rgba(43,57,79,0.05)'
                          : 'none',
                      }}
                    >
                      <EuiIcon type="editorCodeBlock" size="m" color={viewMode === 'json' ? 'primary' : 'subdued'} />
                    </button>
                  </div>
                </div>
              </div>
              )}
            </EuiPanel>
          </EuiFlexItem>

          {/* Version History Pane */}
          {isHistoryPaneOpen && (
            <EuiFlexItem grow={false} style={{ width: 640 }}>
              <EuiPanel
                paddingSize="none"
                hasShadow={true}
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  minHeight: 'calc(100vh - 64px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Pane header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #D3DAE6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <EuiText style={{ fontWeight: 700, fontSize: 16 }}>Version history</EuiText>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EuiPopover
                      isOpen={calendarPopoverOpen}
                      closePopover={() => setCalendarPopoverOpen(false)}
                      anchorPosition="downRight"
                      panelPaddingSize="m"
                      button={
                        <EuiButtonIcon
                          iconType="calendar"
                          aria-label="Filter by date"
                          color={dateFrom || dateTo ? 'primary' : 'text'}
                          size="s"
                          onClick={() => setCalendarPopoverOpen((v) => !v)}
                        />
                      }
                    >
                      <div style={{ width: 280 }}>
                        <EuiText size="s" style={{ fontWeight: 600, marginBottom: 8 }}>Filter by date range</EuiText>
                        <EuiText size="xs" color="subdued" style={{ marginBottom: 4 }}>From</EuiText>
                        <EuiDatePicker
                          selected={dateFrom}
                          onChange={(date) => setDateFrom(date)}
                          maxDate={dateTo ?? undefined}
                          placeholder="Start date"
                        />
                        <div style={{ marginTop: 10 }}>
                          <EuiText size="xs" color="subdued" style={{ marginBottom: 4 }}>To</EuiText>
                          <EuiDatePicker
                            selected={dateTo}
                            onChange={(date) => setDateTo(date)}
                            minDate={dateFrom ?? undefined}
                            placeholder="End date"
                          />
                        </div>
                        {(dateFrom || dateTo) && (
                          <div style={{ marginTop: 10 }}>
                            <EuiButtonEmpty
                              size="xs"
                              color="danger"
                              iconType="cross"
                              flush="left"
                              onClick={() => { setDateFrom(null); setDateTo(null); }}
                            >
                              Clear dates
                            </EuiButtonEmpty>
                          </div>
                        )}
                      </div>
                    </EuiPopover>
                    <EuiPopover
                      isOpen={filterPopoverOpen}
                      closePopover={() => setFilterPopoverOpen(false)}
                      anchorPosition="downRight"
                      panelPaddingSize="none"
                      button={
                        <EuiButtonIcon
                          iconType="filter"
                          aria-label="Filter"
                          color="text"
                          size="s"
                          onClick={() => setFilterPopoverOpen((v) => !v)}
                        />
                      }
                    >
                      <div style={{ width: 260, borderRadius: 6, overflow: 'hidden' }}>
                        {/* Search */}
                        <div style={{ padding: 8 }}>
                          <EuiFieldSearch
                            placeholder="Type text"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            compressed
                            fullWidth
                          />
                        </div>

                        {/* Field changed group */}
                        <div style={{ padding: '4px 0 0' }}>
                          <div style={{ padding: '4px 12px 6px', fontWeight: 700, fontSize: 13, color: '#1d2a3e', borderBottom: '1px solid #EEF0F3' }}>
                            Field changed
                          </div>
                          <EuiListGroup flush gutterSize="none" style={{ paddingBottom: 8 }}>
                            {['Description', 'Query', 'Tags', 'Risk score', 'Reference URLs', 'MITRE ATT&CK™', 'Index patterns', 'Related integrations']
                              .filter(i => !filterSearch || i.toLowerCase().includes(filterSearch.toLowerCase()))
                              .map((item) => (
                                <EuiListGroupItem
                                  key={item}
                                  label={item}
                                  size="s"
                                  onClick={() => setFilterPopoverOpen(false)}
                                />
                              ))}
                          </EuiListGroup>
                        </div>

                        {/* Author group */}
                        <div style={{ borderTop: '1px solid #EEF0F3' }}>
                          <div style={{ padding: '8px 12px 6px', fontWeight: 700, fontSize: 13, color: '#1d2a3e', borderBottom: '1px solid #EEF0F3' }}>
                            Author
                          </div>
                          <EuiListGroup flush gutterSize="none" style={{ paddingBottom: 8 }}>
                            {['Pavel M', 'Alex Nightingale', 'John Doe', 'Tinsae E']
                              .filter(i => !filterSearch || i.toLowerCase().includes(filterSearch.toLowerCase()))
                              .map((item) => (
                                <EuiListGroupItem
                                  key={item}
                                  label={item}
                                  size="s"
                                  onClick={() => setFilterPopoverOpen(false)}
                                />
                              ))}
                          </EuiListGroup>
                        </div>
                      </div>
                    </EuiPopover>
                    <div style={{ width: 1, height: 16, background: '#D3DAE6', margin: '0 4px' }} />
                    <EuiButtonIcon
                      iconType="cross"
                      aria-label="Close history"
                      color="text"
                      size="s"
                      onClick={() => { setIsHistoryPaneOpen(false); setViewMode('ui'); }}
                    />
                  </div>
                </div>

                {/* Version list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {versionHistory.filter((entry) => {
                    if (!dateFrom && !dateTo) return true;
                    const cleaned = entry.timestamp.replace('@', '').trim();
                    const entryDate = moment(cleaned, 'MMM DD YYYY HH.mm');
                    if (dateFrom && entryDate.isBefore(dateFrom, 'day')) return false;
                    if (dateTo && entryDate.isAfter(dateTo, 'day')) return false;
                    return true;
                  }).map((entry, idx) => {
                    const isSelected = selectedHistoryIdx === idx;
                    const isStatusChange = entry.detail === 'Enabled the rule' || entry.detail === 'Disabled the rule';
                    const isNotification = entry.detail === 'Enabled notifications' || entry.detail === 'Snooze notifications';
                    const isSpecialRow = isStatusChange || isNotification;
                    const hasNote = !!entry.note;
                    const isNoteExpanded = expandedNoteIdx === idx;

                    // Current row: teal tint, prominent border
                    const cardBg = isSelected
                      ? '#D9E8FF'
                      : isSpecialRow
                        ? '#f6f9fc'
                        : '#fff';
                    const cardBorder = isSelected
                      ? '1px solid rgba(23,80,186,0.04)'
                      : '1px solid #CAD3E2';

                    return (
                      <div
                        key={idx}
                        style={{
                          borderRadius: 6,
                          border: cardBorder,
                          background: cardBg,
                          overflow: 'hidden',
                          cursor: isSpecialRow ? 'default' : 'pointer',
                        }}
                        onClick={() => {
                          if (isSpecialRow) return;
                          setSelectedHistoryIdx(idx);
                          setDiffChangeIdx(0);
                        }}
                      >
                        {/* ── Main row ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 16px', minHeight: 66 }}>

                          {/* Left: timestamp + author */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                            <span style={{ fontSize: 12.25, fontWeight: 600, color: '#111c2c', lineHeight: '16px', whiteSpace: 'nowrap' }}>
                              {entry.timestamp}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {/* Author icon */}
                              {entry.isElastic
                                ? <EuiIcon type="logoElastic" size="s" />
                                : <EuiIcon type="user" size="s" color="subdued" />
                              }
                              <span style={{ fontSize: 12.25, color: '#516381', lineHeight: '16px' }}>{entry.author}</span>
                              {!isSpecialRow && (
                                <>
                                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#516381', display: 'inline-block', flexShrink: 0 }} />
                                  <span style={{ fontSize: 12.25, color: '#516381', lineHeight: '16px' }}>{entry.detail}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right: badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {entry.isCurrent && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                height: 20, padding: '0 8px',
                                background: '#fff', border: '1px solid #CAD3E2',
                                borderRadius: 20, fontSize: 12, fontWeight: 500,
                                color: '#1d2a3e', whiteSpace: 'nowrap',
                              }}>
                                Current version
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#1d2a3e', display: 'inline-block', flexShrink: 0 }} />
                                {entry.ruleVersion}
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#1d2a3e', display: 'inline-block', flexShrink: 0 }} />
                                {entry.version}
                              </span>
                            )}
                            {!entry.isCurrent && !isSpecialRow && (
                              <>
                                <EuiBadge color="hollow">{entry.ruleVersion}</EuiBadge>
                                <EuiBadge color="hollow">{entry.version}</EuiBadge>
                              </>
                            )}
                            {isStatusChange && (
                              <EuiBadge color="hollow">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{
                                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                    background: entry.detail === 'Enabled the rule' ? '#017D73' : '#BD271E',
                                    display: 'inline-block',
                                  }} />
                                  {entry.detail}
                                </span>
                              </EuiBadge>
                            )}
                            {isNotification && (
                              <EuiBadge color="hollow" iconType={entry.detail === 'Snooze notifications' ? 'bellSlash' : 'bell'} iconSide="left">
                                {entry.detail}
                              </EuiBadge>
                            )}
                          </div>

                        </div>

                        {/* ── Note strip (collapsed/expanded) ── */}
                        {hasNote && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedNoteIdx(isNoteExpanded ? null : idx);
                            }}
                            style={{
                              display: 'flex', alignItems: isNoteExpanded ? 'flex-start' : 'center',
                              gap: 8,
                              margin: '0 16px 8px',
                              padding: '4px 8px',
                              background: '#F6F9FC',
                              border: 'none', borderRadius: 4,
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <EuiIcon
                              type={isNoteExpanded ? 'chevronSingleDown' : 'chevronSingleRight'}
                              size="s" color="subdued"
                              style={{ flexShrink: 0, marginTop: isNoteExpanded ? 2 : 0 }}
                            />
                            <EuiIcon type="editorComment" size="s" color="subdued" style={{ flexShrink: 0, marginTop: isNoteExpanded ? 2 : 0 }} />
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12.6, color: '#516381', lineHeight: '20px',
                              flex: 1, minWidth: 0,
                              overflow: isNoteExpanded ? 'visible' : 'hidden',
                              textOverflow: isNoteExpanded ? 'unset' : 'ellipsis',
                              whiteSpace: isNoteExpanded ? 'normal' : 'nowrap',
                            }}>
                              {entry.note}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #D3DAE6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}>
                  <EuiIcon type="hourglass" size="m" color="subdued" />
                  <EuiText size="xs" color="subdued">On Jan 1 2026 @ 00.00 History started</EuiText>
                </div>
              </EuiPanel>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </div>

      {/* Execution Details Flyout */}
      {isFlyoutVisible && (
        <EuiFlyout
          onClose={() => setIsFlyoutVisible(false)}
          size={640}
          ownFocus={false}
          hideCloseButton
          paddingSize="none"
          maxWidth={false}
          resizable
          minWidth={420}
          aria-labelledby="executionDetailsFlyoutTitle"
        >
          {/* Compact header (sticky) */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 19,
            background: '#fff',
            borderBottom: '1px solid #d3dae6',
            boxShadow: '0 4px 8px -2px rgba(0,0,0,0.08)',
            transform: isCompactHeader ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isCompactHeader ? 1 : 0,
            pointerEvents: isCompactHeader ? 'auto' : 'none',
            transition: 'transform 240ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease'
          }}>
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EuiText size="s" style={{ 
                fontWeight: 600, 
                flex: 1, 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                Execution ID 9a1a2dae
              </EuiText>
              <EuiBadge color="success">Succeeded</EuiBadge>
            </div>
          </div>

          <EuiFlyoutBody className="executionFlyoutBody">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Full header - scrolls naturally */}
              <div style={{ padding: '28px 16px 16px 16px', background: '#fff', position: 'relative' }}>
                {/* Close button */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <EuiButtonIcon
                    iconType="cross"
                    aria-label="Close flyout"
                    color="text"
                    size="s"
                    onClick={() => setIsFlyoutVisible(false)}
                  />
                </div>

                <EuiTitle size="s">
                  <h2 id="executionDetailsFlyoutTitle" style={{ 
                    color: '#1a1c21',
                    fontWeight: 600,
                    lineHeight: '28px',
                    fontSize: 20
                  }}>
                    Execution ID 9a1a2dae
                  </h2>
                </EuiTitle>
                <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
                  Aug 11, 2026 @11:51:07
                </EuiText>

                {/* Info panel — 2 columns only */}
                <EuiPanel 
                  hasBorder 
                  hasShadow={false} 
                  paddingSize="m" 
                  style={{ marginTop: 12, borderRadius: 4 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { label: 'Status', content: <EuiHealth color="success">Succeeded</EuiHealth> },
                      { label: 'Run type', content: <EuiText size="s">Scheduled</EuiText> },
                    ].map((item, idx, arr) => (
                      <div
                        key={item.label}
                        style={{
                          paddingRight: idx < arr.length - 1 ? 16 : 0,
                          paddingLeft: idx > 0 ? 16 : 0,
                          borderRight: idx < arr.length - 1 ? '1px solid #d3dae6' : 'none',
                        }}
                      >
                        <EuiText size="xs" color="subdued" style={{ fontWeight: 600 }}>
                          {item.label}
                        </EuiText>
                        <EuiSpacer size="xs" />
                        {item.content}
                      </div>
                    ))}
                  </div>
                </EuiPanel>
              </div>

              {/* Body section with accordions */}
              <div style={{ padding: '8px 16px 24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Execution summary */}
                <div style={{ borderBottom: '1px solid #d3dae6' }}>
                  {/* Header row */}
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('summary')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.summary ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Execution summary</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
                    </EuiFlexItem>
                    <EuiFlexItem grow={true} />
                    {summaryState === 'generated' && (
                      <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <EuiButton
                          size="s"
                          iconType="discuss"
                          style={{ background: '#e8e3fc', borderColor: 'transparent', color: '#5a3dc8', borderRadius: 8 }}
                        >
                          Add to chat
                        </EuiButton>
                      </EuiFlexItem>
                    )}
                    <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <EuiButtonIcon iconType="boxesHorizontal" aria-label="More options" color="text" size="xs" />
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  {/* Expanded content */}
                  {flyoutSections.summary && (
                    <div style={{ paddingBottom: 12 }}>

                      {/* STATE: idle — prompt + generate button */}
                      {summaryState === 'idle' && (
                        <div style={{
                          border: '1px solid #d3dae6',
                          borderRadius: 8,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          background: '#fff',
                        }}>
                          <EuiText size="s" color="subdued">
                            Analyse the execution result and generate an AI summary with recommended actions.
                          </EuiText>
                          <EuiButton
                            size="s"
                            iconType="sparkles"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); generateSummary(); }}
                            style={{ whiteSpace: 'nowrap', flexShrink: 0, background: '#e8e3fc', borderColor: 'transparent', color: '#5a3dc8' }}
                          >
                            Generate AI content
                          </EuiButton>
                        </div>
                      )}

                      {/* STATE: generating — loading skeleton */}
                      {summaryState === 'generating' && (
                        <div style={{
                          border: '1px solid #d3dae6',
                          borderRadius: 8,
                          padding: '16px',
                          background: '#fafafa',
                        }}>
                          <EuiText size="s" color="subdued" style={{ marginBottom: 12, fontStyle: 'italic' }}>
                            Generating AI content ...
                          </EuiText>
                          <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #c5b8f5 0%, #e8e3fc 60%, #c5b8f5 100%)', marginBottom: 8, backgroundSize: '200% 100%' }} />
                          <div style={{ height: 10, borderRadius: 5, width: '65%', background: 'linear-gradient(90deg, #c5b8f5 0%, #e8e3fc 60%, #c5b8f5 100%)', backgroundSize: '200% 100%' }} />
                        </div>
                      )}

                      {/* STATE: generated — AI content */}
                      {summaryState === 'generated' && (
                        <div style={{ border: '1px solid #d3dae6', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                          {/* Dotted content area */}
                          <div style={{ padding: '16px', border: '1.5px dashed #7B61FF', borderRadius: 6, margin: 12, background: 'rgba(232, 227, 252, 0.5)' }}>
                            <EuiText size="s">
                              <p style={{ margin: 0, lineHeight: '20px', color: '#343741' }}>
                                This rule executed successfully but encountered a configuration issue. The query returned 0 
                                matching events because no indices matched the rule's index pattern (logs-endpoint.alerts-*). As a 
                                result, no alerts were generated.
                              </p>
                            </EuiText>
                            <EuiSpacer size="s" />
                            <EuiText size="xs" style={{ fontWeight: 700 }}>Recommended actions</EuiText>
                            <EuiText size="s">
                              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                                <li>Verify that the index pattern is correct.</li>
                                <li>Confirm that data is being ingested into the expected indices.</li>
                                <li>If Endpoint Security was recently deployed, alerts may appear once data is available.</li>
                              </ul>
                            </EuiText>
                          </div>

                          {/* Footer */}
                          <EuiHorizontalRule margin="none" />
                          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <EuiText size="xs" color="subdued">Generated by AI on mmm dd, yyyy at hh:mm</EuiText>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <EuiButtonIcon iconType="refresh" aria-label="Regenerate" color="text" size="xs" onClick={() => setSummaryState('idle')} />
                              <EuiButtonIcon iconType="copy" aria-label="Copy" color="text" size="xs" />
                              <EuiButtonIcon iconType="thumbsUp" aria-label="Helpful" color="text" size="xs" />
                              <EuiButtonIcon iconType="thumbsDown" aria-label="Not helpful" color="text" size="xs" />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Message */}
                <div style={{ borderBottom: '1px solid #d3dae6' }}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('message')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.message ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Message</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {flyoutSections.message && (
                    <div style={{ paddingBottom: 12 }}>
                      <EuiCodeBlock language="text" fontSize="s" paddingSize="m" isCopyable={false}>
                        Rule executed successfully
                      </EuiCodeBlock>
                    </div>
                  )}
                </div>

                {/* Alerts */}
                <div style={{ borderBottom: '1px solid #d3dae6' }}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('alerts')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.alerts ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Alerts</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {flyoutSections.alerts && (<div style={{ paddingBottom: 12 }}>
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        {[
                          { label: 'Alerts created', value: '5' },
                          { label: 'Candidate alerts', value: '5' },
                        ].map((item, idx, arr) => (
                          <div
                            key={item.label}
                            style={{
                              paddingRight: idx < arr.length - 1 ? 16 : 0,
                              paddingLeft: idx > 0 ? 16 : 0,
                              borderRight: idx < arr.length - 1 ? '1px solid #d3dae6' : 'none',
                            }}
                          >
                            <EuiText size="s" style={{ fontWeight: 600 }}>{item.label}</EuiText>
                            <EuiSpacer size="xs" />
                            <EuiText size="m" style={{ fontWeight: 700 }}>{item.value}</EuiText>
                          </div>
                        ))}
                      </div>
                    </EuiPanel>
                  </div>)}
                </div>

                {/* Execution Metrics */}
                <div style={{ borderBottom: '1px solid #d3dae6' }}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('metrics')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.metrics ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Execution Metrics</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {flyoutSections.metrics && (<div style={{ paddingBottom: 12 }}>
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                      <EuiFlexGroup gutterSize="l">
                        <EuiFlexItem>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600 }}>
                            Execution time ⓘ
                          </EuiText>
                          <EuiSpacer size="xs" />
                          <EuiText size="s">00:00:00:054</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600 }}>
                            Events matched
                          </EuiText>
                          <EuiSpacer size="xs" />
                          <EuiText size="s">12</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600 }}>
                            Gap detected ⓘ
                          </EuiText>
                          <EuiSpacer size="xs" />
                          <EuiText size="s">-</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiPanel>
                  </div>)}
                </div>

                {/* Execution Flow */}
                <div style={{ borderBottom: '1px solid #d3dae6' }}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('flow')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.flow ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Execution Flow</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {flyoutSections.flow && (
                    <div style={{ paddingBottom: 12 }}>
                    <div style={{
                      background: '#f0f4f9',
                      border: '1px solid #d3dae6',
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}>
                      {executionFlowSteps.map((step, idx) => (
                        <div key={idx}>
                          {/* Parent step card */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              background: '#fff',
                              border: '1px solid #d3dae6',
                              borderRadius: 10,
                              cursor: step.children.length > 0 ? 'pointer' : 'default',
                            }}
                            onClick={() => step.children.length > 0 && toggleFlowStep(idx)}
                          >
                            <EuiIcon type="check" size="s" color="success" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1a1c21' }}>
                              {step.label}
                            </span>
                            <span style={{ fontSize: 13, color: '#69707d', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {step.duration}
                            </span>
                            {step.children.length > 0 ? (
                              <EuiIcon
                                type={expandedFlowSteps[idx] ? 'arrowDown' : 'arrowRight'}
                                size="s"
                                color="subdued"
                                style={{ flexShrink: 0 }}
                              />
                            ) : (
                              <EuiIcon type="arrowRight" size="s" color="subdued" style={{ flexShrink: 0 }} />
                            )}
                          </div>

                          {/* Child step cards */}
                          {expandedFlowSteps[idx] && step.children.length > 0 && (
                            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                              {step.children.map((child, cIdx) => (
                                <div
                                  key={cIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 16px',
                                    background: '#f5f7fa',
                                    border: '1px solid #d3dae6',
                                    borderRadius: 8,
                                  }}
                                >
                                  <EuiText size="xs" style={{ fontFamily: 'monospace', color: '#006bb8', flexShrink: 0 }}>
                                    {'> _'}
                                  </EuiText>
                                  <span style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: '#343741' }}>
                                    {child.label}
                                  </span>
                                  <span style={{ fontSize: 12, color: '#69707d', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {child.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                </div>

                {/* Matched events */}
                <div>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection('matched')}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type={flyoutSections.matched ? 'arrowDown' : 'arrowRight'} size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Matched events</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  {flyoutSections.matched && (
                    <div style={{ paddingBottom: 12 }}>
                      <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                        <EuiBasicTable
                          items={[
                            { time: '11:50:10', host: 'james-fleet-714-2', user: 'root', process: 'wget', file: 'Media' },
                            { time: '11:50:13', host: 'james-fleet-714-2', user: 'root', process: 'wget', file: 'Media' },
                            { time: '11:50:16', host: 'james-fleet-714-2', user: 'root', process: 'wget', file: 'Media' },
                          ]}
                          columns={[
                            { field: 'time', name: 'Time', width: '80px' },
                            { field: 'host', name: 'Host', width: '140px' },
                            { field: 'user', name: 'User', width: '60px' },
                            { field: 'process', name: 'Process', width: '80px' },
                            { field: 'file', name: 'File', width: '80px' },
                          ]}
                        />
                      </EuiPanel>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </EuiFlyoutBody>

          <EuiFlyoutFooter style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #d3dae6' }}>
            <EuiFlexGroup justifyContent="flexEnd" gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty iconType="discuss" iconSide="left" size="s" color="primary">
                  Add to chat
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton fill iconType="arrowDown" iconSide="right" size="s">
                  Take action
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
        </EuiFlyout>
      )}
    </>
  );
};

export default RuleDetailsPage;
