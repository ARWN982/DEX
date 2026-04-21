import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenu,
  EuiFieldText,
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
type Category = 'attacks' | 'attention' | 'noise' | 'gaps' | 'autodex';

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
  attacks:  { label: 'Active attacks',    icon: 'securitySignalDetected', bg: '#FBEAEA', color: '#BD271E' },
  attention:{ label: 'Needs attention',   icon: 'alert',                  bg: '#FEF3E2', color: '#F5A700' },
  noise:    { label: 'Noise',             icon: 'minusInCircle',          bg: '#FFF8E6', color: '#AD6800' },
  gaps:     { label: 'Detection gaps',    icon: 'eyeClosed',              bg: '#E6F1FA', color: '#0077CC' },
  autodex:  { label: 'AutoDEX approval',  icon: 'sparkles',               bg: '#F0EBFF', color: '#7B61FF' },
};

// ─── Feed data ────────────────────────────────────────────────────────────────

const ALL_FEED_ITEMS: FeedItem[] = [
  // Active attacks
  {
    id: 'a1', type: 'Alert', category: 'attacks',
    title: 'LSASS credential dump — WKSTN-047',
    description: 'Unassigned · no analyst has touched this · 47 min old',
    whyInFeed: 'Unassigned P1. Matches active credential chain on same host.',
    age: '47m ago', severity: 'critical',
    primaryAction: { label: 'Open in timeline', icon: 'timeline' },
  },
  {
    id: 'a2', type: 'Alert', category: 'attacks',
    title: 'Lateral movement — PsExec on DC-01',
    description: 'Unassigned · high-value target · correlates with failed auth 8 min prior',
    whyInFeed: 'Domain controller targeted. Correlated with WKSTN-047 chain.',
    age: '1h ago', severity: 'critical',
    primaryAction: { label: 'Investigate', icon: 'inspect' },
  },
  {
    id: 'a3', type: 'Alert', category: 'attacks',
    title: 'AWS S3 bucket ACL changed to public',
    description: 'Unassigned · outside business hours · potential data exposure',
    whyInFeed: 'Outside business hours. No owner assigned. Data exfil risk.',
    age: '2h ago', severity: 'high',
    primaryAction: { label: 'Assign to me', icon: 'user' },
  },
  {
    id: 'a4', type: 'Alert', category: 'attacks',
    title: 'Okta MFA disabled — 3 accounts in 10 min',
    description: 'Pattern suggests automated attack · outside business hours',
    whyInFeed: 'Automated pattern. Identity provider threat.',
    age: '3h ago', severity: 'high',
    primaryAction: { label: 'Investigate', icon: 'inspect' },
  },
  // Detection health
  {
    id: 'b1', type: 'Rule failure', category: 'attention',
    title: 'DNS activity rule — failing silently',
    description: 'Field schema mismatch · DNS tunneling now unmonitored',
    whyInFeed: 'Rule is your ownership. Blind spot opened 14 min ago.',
    age: '14m ago', severity: 'critical',
    primaryAction: { label: 'Fix rule', icon: 'wrench' },
  },
  {
    id: 'b2', type: 'Rule failure', category: 'attention',
    title: 'FTP activity rule — index pattern not found',
    description: 'Rule enabled but not executing · FTP transfers unmonitored',
    whyInFeed: 'Index pattern removed after data stream rename.',
    age: '2h ago', severity: 'critical',
    primaryAction: { label: 'Fix rule', icon: 'wrench' },
  },
  {
    id: 'b3', type: 'Coverage gap', category: 'attention',
    title: 'MITRE T1486 — ransomware impact uncovered',
    description: 'No active rules · endpoint file telemetry available · 3 rules ready to install',
    whyInFeed: 'Active ransomware campaign targeting your sector. No coverage.',
    age: 'new', severity: 'high',
    primaryAction: { label: 'Install rules', icon: 'plusInCircle' },
  },
  // Noise
  {
    id: 'c1', type: 'Noise', category: 'noise',
    title: '"Potential PowerShell HackTool" — 334 alerts/week from backup-agent.exe',
    description: '98% false positive rate · same process ancestry on all 72 affected hosts',
    whyInFeed: 'AutoDEX proposed a scoped exception. Pending your approval.',
    age: '2 days ago', severity: 'medium',
    primaryAction: { label: 'Review exception', icon: 'eye' },
  },
  {
    id: 'c2', type: 'Noise', category: 'noise',
    title: '"Unusual Execution via MMC" — 197 alerts from developer workstations',
    description: 'Visual Studio build tooling · corp-dev-* machines · 94% false positive',
    whyInFeed: 'Pattern consistent for 30 days. Safe to suppress for dev group.',
    age: '3 days ago', severity: 'low',
    primaryAction: { label: 'Review', icon: 'eye' },
  },
  // AutoDEX approval
  {
    id: 'd1', type: 'AutoDEX', category: 'autodex',
    title: 'Tuning proposal — backup-agent FP suppression',
    description: '340 alerts/week · 98% from backup-agent · exception list entry proposed',
    whyInFeed: 'AutoDEX confidence: 96%. Semi-auto mode requires your sign-off.',
    age: '1h ago', severity: 'medium', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd2', type: 'AutoDEX', category: 'autodex',
    title: 'New rule proposed — Okta impossible travel',
    description: 'T1078.004 gap · matches your Okta integration · low noise estimate',
    whyInFeed: 'AutoDEX confidence: 91%. Rule install scoped to your Okta data stream.',
    age: '2h ago', severity: 'high', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
  {
    id: 'd3', type: 'AutoDEX', category: 'autodex',
    title: 'T1486 rules — install proposal',
    description: '3 prebuilt rules available · all required fields present',
    whyInFeed: 'AutoDEX confidence: 99%. Zero suppressions would be affected.',
    age: '3h ago', severity: 'high', needsApproval: true,
    primaryAction: { label: 'Approve', icon: 'check' },
  },
];

// ─── Section config ───────────────────────────────────────────────────────────

const FEED_SECTIONS: Array<{ id: Category; showReviewAll?: boolean }> = [
  { id: 'attacks' },
  { id: 'attention' },
  { id: 'noise' },
  { id: 'autodex', showReviewAll: true },
];

// ─── Severity icon badge ──────────────────────────────────────────────────────

const SeverityIcon: React.FC<{ severity: Severity }> = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: cfg.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <EuiIcon type={cfg.icon} size="m" style={{ color: cfg.color }} />
    </div>
  );
};

// ─── FeedRow ──────────────────────────────────────────────────────────────────

const FeedRow: React.FC<{ item: FeedItem }> = ({ item }) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [approved, setApproved] = useState(false);
  const sevCfg = SEVERITY_CONFIG[item.severity];

  if (dismissed) return null;

  const contextPanels = [{
    id: 0,
    items: [
      { name: 'Investigate in timeline', icon: 'timeline',      onClick: () => setActionsOpen(false) },
      { name: 'Add to case',             icon: 'folderClosed',  onClick: () => setActionsOpen(false) },
      { name: 'Add to chat',             icon: 'productAgent',  onClick: () => setActionsOpen(false) },
      { name: 'Bookmark',                icon: 'starEmpty',     onClick: () => setActionsOpen(false) },
      { name: 'Dismiss',                 icon: 'minusInCircle', onClick: () => setDismissed(true) },
    ],
  }];

  return (
    <EuiFlexGroup alignItems="flexStart" responsive={false} gutterSize="m" style={{ padding: '14px 0' }}>
      {/* Severity icon */}
      <EuiFlexItem grow={false}>
        <SeverityIcon severity={item.severity} />
      </EuiFlexItem>

      {/* Content */}
      <EuiFlexItem grow={true} style={{ minWidth: 0 }}>
        <EuiText size="s" style={{ fontWeight: 600, marginBottom: 3 }}>{item.title}</EuiText>
        <EuiText size="s" color="subdued" style={{ marginBottom: 8 }}>{item.description}</EuiText>

        {/* Badge row */}
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ flexWrap: 'wrap' }}>
          {/* Severity badge */}
          <EuiFlexItem grow={false}>
            <EuiBadge style={{ background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.color}33` }}>
              {sevCfg.label}
            </EuiBadge>
          </EuiFlexItem>
          {/* Type badge */}
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">{item.type}</EuiBadge>
          </EuiFlexItem>
          {/* Needs approval badge */}
          {item.needsApproval && !approved && (
            <EuiFlexItem grow={false}>
              <EuiBadge
                style={{ background: '#F0EBFF', color: '#7B61FF', border: '1px solid #C9B8FF', fontWeight: 600 }}
                iconType="sparkles"
              >
                Needs approval
              </EuiBadge>
            </EuiFlexItem>
          )}
          {item.needsApproval && !approved && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow" style={{ fontSize: 11, color: '#69707D' }}>AutoDEX · pending</EuiBadge>
            </EuiFlexItem>
          )}
          {approved && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="success" iconType="checkInCircleFilled">Approved</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>

      {/* Age + actions */}
      <EuiFlexItem grow={false} style={{ flexShrink: 0, textAlign: 'right' }}>
        <EuiText size="xs" color="subdued" style={{ marginBottom: 8, whiteSpace: 'nowrap' }}>{item.age}</EuiText>
        {!approved && (
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              {item.needsApproval ? (
                <EuiFlexGroup gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiButton size="s" iconType="check" fill color="primary" onClick={() => setApproved(true)}>
                      Approve
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton size="s" iconType="minusInCircle" color="text" onClick={() => setDismissed(true)}>
                      Dismiss
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ) : (
                <EuiFlexGroup gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiButton size="s" iconType={item.primaryAction.icon}>
                      {item.primaryAction.label}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiPopover
                      isOpen={actionsOpen}
                      closePopover={() => setActionsOpen(false)}
                      button={
                        <EuiButton size="s" iconType="arrowDown" iconSide="right" onClick={() => setActionsOpen(!actionsOpen)}>
                          Take actions
                        </EuiButton>
                      }
                      panelPaddingSize="none"
                      anchorPosition="downRight"
                    >
                      <EuiContextMenu initialPanelId={0} panels={contextPanels} />
                    </EuiPopover>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

// ─── FeedSection ──────────────────────────────────────────────────────────────

const FeedSectionBlock: React.FC<{
  categoryId: Category;
  items: FeedItem[];
  defaultOpen?: boolean;
  showReviewAll?: boolean;
}> = ({ categoryId, items, defaultOpen = false, showReviewAll }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cfg = CATEGORY_CONFIG[categoryId];
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Section header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="subdued" />

        {/* Category icon with colored bg */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <EuiIcon type={cfg.icon} size="s" style={{ color: cfg.color }} />
        </div>

        <EuiText size="xs" style={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: '#343741',
        }}>
          {cfg.label}
        </EuiText>
        <EuiBadge color="hollow" style={{ fontSize: 11 }}>{items.length}</EuiBadge>

        {/* Review all for AutoDEX */}
        {showReviewAll && isOpen && (
          <div style={{ marginLeft: 'auto' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <EuiBadge
              color="warning"
              iconType="popout"
              iconSide="right"
              style={{ cursor: 'pointer', fontWeight: 600 }}
            >
              Review all
            </EuiBadge>
          </div>
        )}
      </button>

      {/* Items */}
      {isOpen && (
        <div style={{ paddingLeft: 32 }}>
          {items.map((item, i) => (
            <div key={item.id}>
              <FeedRow item={item} />
              {i < items.length - 1 && <EuiHorizontalRule margin="none" />}
            </div>
          ))}
        </div>
      )}
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

// ─── Filter popover ───────────────────────────────────────────────────────────

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
      button={
        <EuiButtonEmpty
          size="xs"
          iconType="filter"
          iconSide="left"
          onClick={() => setOpen(!open)}
          style={{ fontWeight: activeCount > 0 ? 700 : 400 }}
        >
          {label}{activeCount > 0 ? ` (${activeCount})` : ''}
        </EuiButtonEmpty>
      }
      panelPaddingSize="none"
      anchorPosition="downRight"
    >
      <EuiSelectable options={options} onChange={onChange}>
        {(list) => <div style={{ width: 200, padding: 8 }}>{list}</div>}
      </EuiSelectable>
    </EuiPopover>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const InboxPage: React.FC = () => {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [aiQuery, setAiQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([
    { label: 'Active attacks',   checked: undefined as 'on' | undefined },
    { label: 'Needs attention',  checked: undefined as 'on' | undefined },
    { label: 'Noise',            checked: undefined as 'on' | undefined },
    { label: 'Detection gaps',   checked: undefined as 'on' | undefined },
    { label: 'AutoDEX approval', checked: undefined as 'on' | undefined },
  ]);
  const [approvalFilter, setApprovalFilter] = useState([
    { label: 'Needs approval', checked: undefined as 'on' | undefined },
    { label: 'Approved',       checked: undefined as 'on' | undefined },
  ]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Derive filtered items
  const activeCats = categoryFilter.filter(o => o.checked === 'on').map(o => o.label.toLowerCase().replace(' ', '_'));
  const activeApprovals = approvalFilter.filter(o => o.checked === 'on').map(o => o.label);

  const getItems = (cat: Category) => {
    let items = ALL_FEED_ITEMS.filter(i => i.category === cat);
    if (activeCats.length > 0 && !activeCats.some(c => CATEGORY_CONFIG[cat].label.toLowerCase().includes(c.replace('_', ' ')))) return [];
    if (activeApprovals.includes('Needs approval')) items = items.filter(i => i.needsApproval);
    return items;
  };

  const totalItems = FEED_SECTIONS.reduce((sum, s) => sum + getItems(s.id).length, 0);

  const METRIC_CARDS = [
    { num: '01', numColor: '#BD271E', label: 'Active attacks',  sub: 'Unassigned P1 on WKSTN-047',         action: 'Assign to me',  actionIcon: 'user',        sectionId: 'attacks' },
    { num: '02', numColor: '#F5A700', label: 'Rules failing',   sub: 'Silent failures since last check',    action: 'Review all',    actionIcon: 'wrench',      sectionId: 'attention' },
    { num: '10', numColor: '#F5A700', label: 'Noise',           sub: 'Exceptions ready for approval',       action: 'Approve all',   actionIcon: 'check',       sectionId: 'noise' },
    { num: '5',  numColor: '#0077CC', label: 'Coverage gaps',   sub: 'MITRE techniques uncovered',          action: 'Review',        actionIcon: 'eye',         sectionId: 'gaps' },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(`feed-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <SecurityHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 48 }}>
        <SecuritySideNav />

        <div style={{ flex: 1, marginLeft: 80, overflowY: 'auto', background: '#F6F9FC', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E3E8F2', minHeight: 'calc(100vh - 80px)', overflow: 'hidden' }}>

            {/* ── Persona selector ─────────────────────────────── */}
            <PersonaSelector persona={persona} onChange={setPersona} />

            <div style={{ padding: '24px 32px 48px' }}>

              {/* ── Page header ──────────────────────────────────── */}
              <EuiFlexGroup alignItems="center" responsive={false} gutterSize="s" style={{ marginBottom: 20 }}>
                <EuiFlexItem>
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiTitle size="l"><h1>Inbox</h1></EuiTitle>
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
                      <EuiToolTip content="Feed history">
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

              {/* ── AI Briefing panel ────────────────────────────── */}
              <EuiPanel hasBorder hasShadow={false} paddingSize="l" style={{ borderRadius: 8, marginBottom: 20, borderLeft: '3px solid #7B61FF' }}>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 12 }}>
                  <EuiFlexItem grow={false}><EuiIcon type="sparkles" size="m" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                  <EuiFlexItem><EuiTitle size="s"><h2 style={{ color: '#7B61FF' }}>Today's briefing</h2></EuiTitle></EuiFlexItem>
                  <EuiFlexItem grow={false}><EuiBadge color="hollow" style={{ fontSize: 11 }}>Detection Engineer view</EuiBadge></EuiFlexItem>
                </EuiFlexGroup>
                <EuiText size="s" style={{ marginBottom: 16, lineHeight: 1.8 }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Your environment has an <strong>active intrusion</strong> in progress on WKSTN-047. A rule covering the lateral movement phase has been <strong>silently failing for 6 hours</strong> due to an index alias mismatch. <EuiBadge color="danger" iconType="alert" style={{ verticalAlign: 'middle' }}>Immediate action needed</EuiBadge></li>
                    <li>AutoDEX has <strong>3 proposals</strong> pending your approval — 2 tuning exceptions and 1 rule install — that reduce noise by ~531 alerts/week.</li>
                    <li>You have <strong>5 MITRE ATT&amp;CK sub-techniques</strong> with no detection coverage. 4 have prebuilt Elastic rules available today.</li>
                  </ul>
                </EuiText>
                <div style={{ position: 'relative' }}>
                  <EuiFieldText
                    placeholder="Ask AI about your detection coverage..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    fullWidth
                    style={{ paddingRight: 160, background: '#FAFBFC' }}
                  />
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                    <EuiButtonEmpty size="xs" iconType="sparkles" style={{ color: '#7B61FF', fontWeight: 600 }}>Elastic AI Agent</EuiButtonEmpty>
                  </div>
                </div>
              </EuiPanel>

              {/* ── Metric cards ─────────────────────────────────── */}
              <EuiFlexGroup gutterSize="m" responsive={false} style={{ marginBottom: 28 }}>
                {METRIC_CARDS.map(card => (
                  <EuiFlexItem key={card.label} grow={1}>
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m"
                      style={{ borderRadius: 8, cursor: 'pointer', borderTop: `3px solid ${card.numColor}` }}
                      onClick={() => scrollToSection(card.sectionId)}
                    >
                      <EuiFlexGroup gutterSize="s" alignItems="baseline" responsive={false} style={{ marginBottom: 4 }}>
                        <EuiFlexItem grow={false}>
                          <span style={{ fontSize: 30, fontWeight: 700, color: card.numColor, lineHeight: 1 }}>{card.num}</span>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" style={{ fontWeight: 600 }}>{card.label}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="xs" color="subdued" style={{ marginBottom: 14 }}>{card.sub}</EuiText>
                      <EuiButton
                        size="s"
                        iconType={card.actionIcon}
                        fullWidth
                        style={{ fontSize: 12 }}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                      >
                        {card.action}
                      </EuiButton>
                    </EuiPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>

              {/* ── Feed header ──────────────────────────────────── */}
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 12 }}>
                <EuiFlexItem grow={false}>
                  <EuiTitle size="xs"><h2>Feed</h2></EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content="Items are ranked by urgency and relevance to your workflow. Dismissed items are hidden but remain in history.">
                    <EuiButtonIcon iconType="info" aria-label="Feed info" color="text" size="xs" />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="hollow">{totalItems} items</EuiBadge>
                </EuiFlexItem>

                {/* Filters — far right */}
                <EuiFlexItem grow={true} />
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">Filter:</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <FilterPopover
                        label="Approval"
                        options={approvalFilter}
                        onChange={setApprovalFilter}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <FilterPopover
                        label="Category"
                        options={categoryFilter}
                        onChange={setCategoryFilter}
                      />
                    </EuiFlexItem>
                    {(approvalFilter.some(o => o.checked === 'on') || categoryFilter.some(o => o.checked === 'on')) && (
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty
                          size="xs"
                          color="danger"
                          onClick={() => {
                            setCategoryFilter(f => f.map(o => ({ ...o, checked: undefined })));
                            setApprovalFilter(f => f.map(o => ({ ...o, checked: undefined })));
                          }}
                        >
                          Clear
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiHorizontalRule margin="none" style={{ marginBottom: 12 }} />

              {/* ── Feed sections ────────────────────────────────── */}
              {FEED_SECTIONS.map(s => (
                <div key={s.id} id={`feed-${s.id}`}>
                  <FeedSectionBlock
                    categoryId={s.id}
                    items={getItems(s.id)}
                    defaultOpen={s.id === 'attacks' || s.id === 'attention'}
                    showReviewAll={s.showReviewAll}
                  />
                  <EuiHorizontalRule margin="none" style={{ marginBottom: 4 }} />
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
