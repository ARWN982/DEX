import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiBasicTable,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
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
  EuiPopover,
  EuiSelect,
  EuiSelectable,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

// ── Simulated AI responses ────────────────────────────────────────────────────
const AI_RESPONSES: Record<string, { title: string; summary: string; rules: { name: string; desc: string; severity: string }[] }> = {
  okta: {
    title: 'Here are your Okta rules that we recommend.',
    summary: 'Based on your Okta integration data, these rules cover the most common identity-based threats including credential attacks, session hijacking, and privilege escalation through your Okta environment.',
    rules: [
      { name: 'Okta User Account Locked Out',    desc: 'Detects repeated authentication failures that result in an account lockout — a common indicator of brute-force or credential stuffing attacks.', severity: 'medium' },
      { name: 'Okta MFA Bypass Attempt',         desc: 'Identifies attempts to bypass multi-factor authentication, which may indicate a sophisticated attacker with valid credentials.',                    severity: 'high' },
      { name: 'Okta Admin Role Assigned',        desc: 'Fires whenever an administrative role is granted to a user. Unexpected privilege escalation is a key lateral movement signal.',                    severity: 'high' },
      { name: 'Okta User Session Impersonation', desc: 'Detects impersonation events where a support or admin user takes over another user\'s session.',                                                    severity: 'critical' },
      { name: 'Okta Policy Rule Modified',       desc: 'Tracks changes to Okta authentication policies. Weakening MFA or IP restriction policies is a common attacker persistence technique.',             severity: 'medium' },
    ],
  },
  default: {
    title: 'Here are the rules we recommend for your query.',
    summary: 'Based on your description, AutoDEX has identified the following detection rules as most relevant to your environment and threat model.',
    rules: [
      { name: 'Unusual Network Destination Domain Name',      desc: 'Detects connections to rare or newly registered domains, often used in C2 communication.',                           severity: 'medium' },
      { name: 'Potential Credential Access via LSASS Memory', desc: 'Identifies attempts to read LSASS memory, a key technique for credential harvesting.',                                severity: 'high' },
      { name: 'Lateral Movement via Remote Services',         desc: 'Flags remote service usage patterns consistent with lateral movement across the environment.',                        severity: 'high' },
    ],
  },
};

// ── Rule groups ───────────────────────────────────────────────────────────────
const allRules = parsedRulesData as any[];

const RULE_GROUPS = [
  {
    key:            'elastic',
    label:          'Elastic Rules',
    icon:           '/images/icon-elastic.png',
    installedCount: 143,
    totalCount:     412,
    rules: allRules
      .filter((r: any) =>
        !r.name?.toLowerCase().includes('aws') &&
        !r.name?.toLowerCase().includes('okta') &&
        !r.name?.toLowerCase().includes('gcp') &&
        !r.name?.toLowerCase().includes('azure')
      ),
  },
  {
    key:            'aws',
    label:          'AWS Rules',
    icon:           '/images/icon-aws.png',
    installedCount: 38,
    totalCount:     187,
    rules: allRules
      .filter((r: any) => r.name?.toLowerCase().includes('aws')),
  },
  {
    key:            'okta',
    label:          'Okta Rules',
    icon:           '/images/icon-okta.png',
    installedCount: 12,
    totalCount:     134,
    rules: allRules
      .filter((r: any) => r.name?.toLowerCase().includes('okta')),
  },
  {
    key:            'endpoint',
    label:          'Endpoint Rules',
    icon:           '/images/icon-endpoint.png',
    installedCount: 67,
    totalCount:     298,
    rules: allRules
      .filter((r: any) =>
        r.name?.toLowerCase().includes('windows') ||
        r.name?.toLowerCase().includes('linux') ||
        r.name?.toLowerCase().includes('macos') ||
        r.name?.toLowerCase().includes('endpoint')
      ),
  },
  {
    key:            'custom',
    label:          'Custom Rules',
    icon:           '/images/icon-custom.png',
    installedCount: 0,
    totalCount:     0,
    rules:          [] as any[],
  },
];

// ── Integration sources (filter list) ────────────────────────────────────────
const INTEGRATIONS = [
  'AWS CloudTrail', 'AWS GuardDuty', 'AWS S3', 'AWS EC2', 'AWS IAM',
  'Okta', 'Microsoft Azure', 'Azure Active Directory', 'Azure Sentinel',
  'Google Cloud Platform', 'Google Workspace', 'Microsoft 365', 'Microsoft Defender',
  'GitHub', 'GitLab', 'Elastic Agent', 'Windows Event Logs', 'Linux auditd',
  'macOS Unified Logs', 'Palo Alto Networks', 'Cisco Umbrella', 'CrowdStrike Falcon',
  'SentinelOne', 'Carbon Black', 'Zeek / Corelight',
];

// ── Component ────────────────────────────────────────────────────────────────
const AddElasticRulesPage: React.FC = () => {
  const navigate = useNavigate();

  const [chatValue, setChatValue]                     = useState('');
  const [aiResponse, setAiResponse]                   = useState<typeof AI_RESPONSES['okta'] | null>(null);
  const [responseExpanded, setResponseExpanded]       = useState(true);
  const [isInstallConfigureOpen, setIsInstallConfigureOpen] = useState(false);
  const [isInstallLogsOpen, setIsInstallLogsOpen]     = useState(false);
  const [installAutoNew, setInstallAutoNew]           = useState(true);
  const [installAutoUpdate, setInstallAutoUpdate]     = useState(false);
  const [installThreshold, setInstallThreshold]       = useState('medium');
  const [installLevel, setInstallLevel]               = useState(2);
  const [isThinking, setIsThinking]                   = useState(false);
  const [thinkingStep, setThinkingStep]               = useState(0);
  const [submittedQuery, setSubmittedQuery]           = useState('');
  const [expandedGroups, setExpandedGroups]           = useState<Set<string>>(new Set());

  const [filterOpen, setFilterOpen]   = useState(false);
  const [feedOpen, setFeedOpen]       = useState(false);
  const [filterOptions, setFilterOptions] = useState(
    INTEGRATIONS.map(name => ({ label: name, checked: undefined as 'on' | undefined }))
  );

  const THREAT_FEED = [
    { id: '1', title: 'CISA KEV: Active exploitation of Ivanti EPMM (CVE-2025-4427)', date: 'Jun 28', severity: 'critical', source: 'CISA' },
    { id: '2', title: 'Elastic Security Labs: New BLOODALCHEMY malware targeting SEA government networks', date: 'Jun 27', severity: 'high', source: 'Elastic Labs' },
    { id: '3', title: 'UNC3944 using compromised Okta sessions to pivot into AWS environments', date: 'Jun 27', severity: 'high', source: 'Mandiant' },
    { id: '4', title: 'Microsoft patches 3 zero-days actively used in ransomware campaigns', date: 'Jun 26', severity: 'high', source: 'Microsoft' },
    { id: '5', title: 'New detection: LSASS memory access via Windows Error Reporting bypass', date: 'Jun 26', severity: 'medium', source: 'Elastic Labs' },
    { id: '6', title: 'Scattered Spider TTPs: fresh SIM-swap and MFA fatigue wave observed', date: 'Jun 25', severity: 'high', source: 'CrowdStrike' },
    { id: '7', title: 'Prebuilt rule update: 14 AWS rules updated for GuardDuty v4 schema', date: 'Jun 25', severity: 'info', source: 'Elastic' },
    { id: '8', title: 'Supply chain: malicious npm packages targeting CI/CD credential stores', date: 'Jun 24', severity: 'medium', source: 'Sonatype' },
  ];

  const severityStyle = (s: string) => {
    switch (s) {
      case 'critical': return { bg: '#FDDDD8', color: '#A71627' };
      case 'high':     return { bg: '#FDE9B5', color: '#7A4700' };
      case 'medium':   return { bg: '#FFF3CD', color: '#6B4C00' };
      default:         return { bg: '#E6F5F3', color: '#017D73' };
    }
  };

  const activeFilterCount = filterOptions.filter(o => o.checked === 'on').length;

  const toggleGroup = (key: string) =>
    setExpandedGroups(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  const handleChatSubmit = () => {
    if (!chatValue.trim()) return;
    const q        = chatValue.toLowerCase();
    const response = q.includes('okta') ? AI_RESPONSES.okta : AI_RESPONSES.default;
    setSubmittedQuery(chatValue);
    setAiResponse(null);
    setIsThinking(true);
    setThinkingStep(0);
    setChatValue('');
    setTimeout(() => setThinkingStep(1), 800);
    setTimeout(() => setThinkingStep(2), 2000);
    setTimeout(() => setThinkingStep(3), 3400);
    setTimeout(() => {
      setIsThinking(false);
      setSubmittedQuery('');
      setAiResponse(response);
      setResponseExpanded(true);
    }, 5000);
  };


  const getSeverityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'low':      return 'success';
      case 'medium':   return 'warning';
      case 'high':
      case 'critical': return 'danger';
      default:         return 'subdued';
    }
  };

  const tableColumns = [
    {
      field: 'name', name: 'Rule name',
      render: (name: string) => <EuiLink href="#"><EuiText size="s" style={{ fontWeight: 600 }}>{name}</EuiText></EuiLink>,
    },
    {
      name: '', width: '110px',
      render: () => <div style={{ display: 'flex', gap: 4 }}><EuiBadge color="hollow" iconType="visGauge" iconSide="left">0/2</EuiBadge><EuiBadge color="hollow" iconType="tag" iconSide="left">4</EuiBadge></div>,
    },
    {
      field: 'riskScore', name: 'Risk score', width: '100px',
      render: (score: number) => <EuiText size="s">{score || 47}</EuiText>,
    },
    {
      field: 'severity', name: 'Severity', width: '110px',
      render: (severity: string) => <EuiHealth color={getSeverityColor(severity)}>{severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'High'}</EuiHealth>,
    },
    { name: '', width: '80px',  render: () => <EuiButtonEmpty size="xs" color="primary" flush="right">Install</EuiButtonEmpty> },
    { name: '', width: '40px',  render: () => <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" /> },
  ];

  return (
    <>
      <style>{`
        .elastic-chat-input:focus { outline: none; }
        @keyframes thinking-pulse { 0%,100% { opacity: 0.4; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
        .thinking-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #7B61FF; animation: thinking-pulse 1.2s ease-in-out infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ backgroundColor: '#F6F9FC', height: 'calc(100vh - 56px)', marginTop: 48, marginLeft: 80, padding: 8, display: 'flex', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>

          {/* Secondary Nav */}
          <div style={{ flexShrink: 0, height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <RulesSecondaryNav />
            </EuiPanel>
          </div>

          {/* Main Panel */}
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>

              {/* ── Sticky top zone: title + chat ── */}
              <div style={{ flexShrink: 0, borderBottom: '1px solid #E3E8F2', background: 'linear-gradient(135deg, rgba(75,172,255,0.08) 0%, rgba(255,255,255,1) 45%, rgba(123,97,255,0.07) 100%)', padding: '32px 40px 24px' }}>
                <div style={{ maxWidth: 1118, margin: '0 auto', width: '100%' }}>

                {/* Illustration + Title — centred */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <img src="/images/illustration-results.png" alt="" style={{ width: 72, height: 72, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
                  <EuiTitle size="l">
                    <h1 style={{ margin: '0 0 4px', color: '#111C2C', textAlign: 'center' }}>Add Elastic Rules</h1>
                  </EuiTitle>
                  <EuiText color="subdued" size="s" style={{ marginBottom: 20, textAlign: 'center' }}>
                    Describe what you want to detect or browse using the filters and latest threat feed.
                  </EuiText>
                </div>

                {/* ── Gradient-bordered chat input ── */}
                <div style={{ background: 'linear-gradient(135deg, #00BFB3 0%, #0B64DD 50%, #7B61FF 100%)', padding: '2px', borderRadius: 14 }}>
                  <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px 12px' }}>
                    <textarea
                      className="elastic-chat-input"
                      placeholder="What do you want to detect? e.g. 'What rules do I need for Okta?'"
                      value={chatValue}
                      onChange={e => setChatValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                      rows={2}
                      style={{ width: '100%', border: 'none', resize: 'none', fontSize: 14, color: '#111C2C', background: 'transparent', fontFamily: 'inherit', lineHeight: '22px' }}
                    />
                    {/* Bottom bar: quick-filter chips + icon buttons + send */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: '1px solid #E3E8F2', gap: 6 }}>
                      {/* Quick-prompt chips */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        {[
                          { label: 'My integrations',  prompt: 'Show rules for my active integrations' },
                          { label: 'My data',          prompt: 'Show rules relevant to my data sources' },
                          { label: 'Latest releases',  prompt: 'Show the latest released Elastic rules' },
                          { label: 'Most popular',     prompt: 'Show the most popular Elastic rules' },
                        ].map(chip => (
                          <button
                            key={chip.label}
                            onClick={() => setChatValue(chip.prompt)}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, border: '1px solid #CAD3E2', background: '#F6F9FC', fontSize: 12, color: '#516381', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {/* Right: filter + feed + send */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, position: 'relative' }}>

                        {/* ── Filter — icon button + EuiPopover + EuiSelectable ── */}
                        <EuiPopover
                          isOpen={filterOpen}
                          closePopover={() => setFilterOpen(false)}
                          panelPaddingSize="none"
                          anchorPosition="downRight"
                          button={
                            <button
                              onClick={() => { setFilterOpen(o => !o); setFeedOpen(false); }}
                              title="Filter by integration"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: `1px solid ${filterOpen || activeFilterCount > 0 ? '#0B64DD' : '#CAD3E2'}`, background: filterOpen ? '#EEF4FF' : 'white', cursor: 'pointer', position: 'relative' }}
                            >
                              <EuiIcon type="filter" size="s" color={filterOpen || activeFilterCount > 0 ? '#0B64DD' : 'subdued'} />
                              {activeFilterCount > 0 && (
                                <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#0B64DD', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {activeFilterCount}
                                </span>
                              )}
                            </button>
                          }
                        >
                          <div style={{ width: 240 }}>
                            <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#69707D', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Filter by source</span>
                              {activeFilterCount > 0 && (
                                <button onClick={() => setFilterOptions(o => o.map(x => ({ ...x, checked: undefined })))} style={{ fontSize: 11, color: '#0B64DD', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  Clear all
                                </button>
                              )}
                            </div>
                            <EuiSelectable
                              options={filterOptions}
                              onChange={newOpts => setFilterOptions(newOpts as typeof filterOptions)}
                              listProps={{ bordered: false, rowHeight: 32 }}
                              style={{ maxHeight: 260, overflowY: 'auto' }}
                            >
                              {list => list}
                            </EuiSelectable>
                          </div>
                        </EuiPopover>

                        {/* ── Threat feed button ── */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setFeedOpen(o => !o)}
                            title="Latest threats"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: `1px solid ${feedOpen ? '#0B64DD' : '#CAD3E2'}`, background: feedOpen ? '#EEF4FF' : 'white', cursor: 'pointer' }}
                          >
                            <EuiIcon type="article" size="s" color={feedOpen ? '#0B64DD' : 'subdued'} />
                          </button>

                          {/* Feed dropdown */}
                          {feedOpen && (
                            <div style={{ position: 'absolute', top: 40, right: 0, width: 340, background: 'white', border: '1px solid #E3E8F2', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #E3E8F2' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#111C2C', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Latest threats &amp; updates</span>
                              </div>
                              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {THREAT_FEED.map((item, i) => {
                                  const { bg, color } = severityStyle(item.severity);
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => { setChatValue(`Tell me about: ${item.title}`); setFeedOpen(false); }}
                                      style={{ padding: '10px 14px', borderBottom: i < THREAT_FEED.length - 1 ? '1px solid #F0F4F8' : 'none', cursor: 'pointer' }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: bg, color, flexShrink: 0, marginTop: 2, textTransform: 'uppercase' }}>{item.severity}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111C2C', lineHeight: '17px', marginBottom: 3 }}>{item.title}</div>
                                          <div style={{ fontSize: 11, color: '#98A2B3' }}>{item.source} · {item.date}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ padding: '8px 14px', borderTop: '1px solid #E3E8F2', textAlign: 'center' }}>
                                <button style={{ fontSize: 12, color: '#0B64DD', background: 'none', border: 'none', cursor: 'pointer' }}>View all threat intelligence →</button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Send button */}
                        <button
                          onClick={handleChatSubmit}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: chatValue.trim() ? 'linear-gradient(135deg, #00BFB3, #0B64DD)' : '#0B64DD', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <EuiIcon type="sortUp" size="m" color="ghost" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                </div>{/* end maxWidth wrapper */}
              </div>{/* end sticky top zone */}

              {/* ── Scrollable content below sticky header ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 48px' }}>
                <div style={{ maxWidth: 1118, margin: '0 auto', width: '100%' }}>

                {/* Thinking state */}
                {isThinking && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <div style={{ background: '#EEF3FF', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 14, color: '#1D2A3E', maxWidth: '60%' }}>
                        {submittedQuery}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { step: 0, text: 'Thinking...' },
                        { step: 1, text: 'Deciding what to do next...' },
                        { step: 2, text: 'Loading the detection rule skill to understand how to find and work with detection rules....', arrow: true },
                        { step: 3, text: `Searching Security Labs for ${submittedQuery.toLowerCase().includes('okta') ? 'Okta-related' : 'relevant'} threat intelligence....`, arrow: true },
                      ]
                        .filter(item => thinkingStep >= item.step)
                        .map(item => (
                          <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <EuiIcon type="logoElastic" size="m" />
                            <span style={{ fontSize: 14, color: '#343741', lineHeight: '20px' }}>{item.text}</span>
                            {item.arrow && <EuiIcon type="arrowRight" size="s" color="subdued" />}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* AI response card */}
                {aiResponse && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ border: '2px solid #7B61FF', borderRadius: 16, background: 'white', overflow: 'hidden', boxShadow: '0 0 0 4px rgba(123,97,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D4F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <EuiIcon type="sparkles" size="s" color="#00875A" />
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#111C2C', lineHeight: '26px' }}>{aiResponse.title}</div>
                        </div>
                        <button onClick={() => setAiResponse(null)} style={{ background: 'none', border: '1px solid #CAD3E2', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
                          <EuiIcon type="cross" size="s" color="subdued" />
                        </button>
                      </div>
                      {responseExpanded && (
                        <div style={{ padding: '0 24px 20px', borderTop: '1px solid #F0F4F8' }}>
                          <p style={{ margin: '16px 0 16px', fontSize: 13, color: '#516381', lineHeight: '20px' }}>{aiResponse.summary}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {aiResponse.rules.map((rule, idx) => (
                              <div key={rule.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#F6F9FC', borderRadius: 8, border: '1px solid #E3E8F2' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#516381', paddingTop: 2, minWidth: 16 }}>{idx + 1}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>{rule.name}</div>
                                  <div style={{ fontSize: 12, color: '#516381', lineHeight: '18px' }}>{rule.desc}</div>
                                </div>
                                <EuiHealth color={rule.severity === 'critical' ? 'danger' : rule.severity === 'high' ? 'danger' : 'warning'} style={{ flexShrink: 0, paddingTop: 2 }}>
                                  {rule.severity}
                                </EuiHealth>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <EuiButton fill size="s" iconType="plusInCircle">Install these rules</EuiButton>
                            <EuiButtonEmpty size="s" iconType="expand" iconSide="right" color="primary">View all rules</EuiButtonEmpty>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Rule group accordions ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {RULE_GROUPS.map(group => {
                    const isOpen = expandedGroups.has(group.key);
                    return (
                      <div key={group.key} style={{ border: '1px solid #CAD3E2', borderRadius: 10, overflow: 'hidden' }}>
                        {/* Accordion header */}
                        <div
                          onClick={() => toggleGroup(group.key)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', background: 'white', borderBottom: isOpen ? '1px solid #CAD3E2' : 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={group.icon} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#111C2C' }}>{group.label}</span>
                            <span style={{ fontSize: 13, color: '#C2C8D1' }}>·</span>
                            <span style={{ fontSize: 13, color: '#69707D' }}>
                              {group.totalCount > 0
                                ? `${group.installedCount}/${group.totalCount} available`
                                : 'No rules yet'}
                            </span>
                          </div>
                          <EuiIcon type={isOpen ? 'arrowUp' : 'arrowDown'} size="m" color="subdued" />
                        </div>

                        {/* Accordion body */}
                        {isOpen && (
                          <div style={{ padding: '0 0 8px' }}>
                            {group.rules.length > 0 ? (
                              <EuiBasicTable
                                items={group.rules.slice(0, 10)}
                                columns={tableColumns}
                                itemId="id"
                                selection={{ selectable: () => true, onSelectionChange: () => {} }}
                                pagination={{ pageIndex: 0, pageSize: 10, totalItemCount: group.rules.length, pageSizeOptions: [10, 20, 50], showPerPageOptions: true }}
                                onChange={() => {}}
                              />
                            ) : (
                              <div style={{ padding: '24px', textAlign: 'center', color: '#69707D' }}>
                                <EuiIcon type="user" size="xl" color="subdued" style={{ marginBottom: 12 }} />
                                <EuiText size="s" color="subdued">No custom rules yet.</EuiText>
                                <div style={{ marginTop: 12 }}>
                                  <EuiButton size="s" iconType="plusInCircle" fill>Create custom rule</EuiButton>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>{/* end rule groups */}

                </div>{/* end maxWidth wrapper */}
              </div>{/* end scrollable */}
            </EuiPanel>
          </div>
        </div>
      </div>

      {/* AutoDEX Install — Configure modal */}
      {isInstallConfigureOpen && (
        <EuiModal onClose={() => setIsInstallConfigureOpen(false)} style={{ width: 672 }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EuiIcon type="sparkles" color="#7B61FF" />
                AutoDEX Install Configuration
              </div>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiHorizontalRule margin="none" />
          <EuiModalBody>
            <EuiSpacer size="s" />
            <EuiTitle size="xs"><h3>Automatic installation scope</h3></EuiTitle>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">Choose which rules AutoDEX can install automatically.</EuiText>
            <EuiSpacer size="l" />
            {[
              { label: 'Install new Elastic prebuilt rules',  desc: 'Automatically install rules that fill detected MITRE coverage gaps for your stack.', value: installAutoNew,    set: setInstallAutoNew },
              { label: 'Auto-update installed rules',         desc: 'Apply new versions of installed prebuilt rules when they are released.',              value: installAutoUpdate, set: setInstallAutoUpdate },
            ].map(({ label, desc, value, set }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <EuiSwitch label={<strong>{label}</strong>} checked={value} onChange={e => set(e.target.checked)} />
                <EuiText size="xs" color="subdued" style={{ marginTop: 6, marginLeft: 44 }}>{desc}</EuiText>
              </div>
            ))}
            <EuiSpacer size="m" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />
            <EuiTitle size="xs"><h3>Automation level</h3></EuiTitle>
            <EuiSpacer size="m" />
            <EuiRange min={1} max={3} value={installLevel} onChange={e => setInstallLevel(Number((e.target as HTMLInputElement).value))} showTicks tickInterval={1} ticks={[{ label: 'Suggest only', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
            <EuiSpacer size="m" />
            <EuiText size="xs" color="subdued">
              {installLevel === 1 && 'AutoDEX will only recommend rules to install. No changes made without your approval.'}
              {installLevel === 2 && 'AutoDEX installs low-risk rules automatically and queues others for approval.'}
              {installLevel === 3 && 'AutoDEX installs all matching rules automatically. Review them in logs at any time.'}
            </EuiText>
            <EuiSpacer size="m" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />
            <EuiTitle size="xs"><h3>Approval threshold</h3></EuiTitle>
            <EuiSpacer size="m" />
            <EuiSelect options={[{ value: 'low', text: 'Low risk and above' }, { value: 'medium', text: 'Medium risk and above (recommended)' }, { value: 'high', text: 'High risk only' }, { value: 'none', text: 'Never ask for approval' }]} value={installThreshold} onChange={e => setInstallThreshold(e.target.value)} fullWidth />
            <EuiSpacer size="s" />
          </EuiModalBody>
          <EuiHorizontalRule margin="none" />
          <EuiModalFooter>
            <EuiButtonEmpty onClick={() => setIsInstallConfigureOpen(false)}>Cancel</EuiButtonEmpty>
            <EuiButton fill color="primary" onClick={() => setIsInstallConfigureOpen(false)}>Save configuration</EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}

      {/* AutoDEX Install — View logs flyout */}
      {isInstallLogsOpen && (
        <EuiFlyout onClose={() => setIsInstallLogsOpen(false)} size="m" ownFocus={false}>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EuiIcon type="sparkles" style={{ color: '#7B61FF' }} />
                  AutoDEX Install Activity Log
                </div>
              </h2>
            </EuiTitle>
            <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>Rules installed and updated automatically by AutoDEX.</EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            {[
              { id: '1', timestamp: 'Apr 15 @ 14:22:07', rule: 'AWS IAM Assume Role Policy Update',        reasoning: 'Your environment has AWS CloudTrail data. This rule covers T1078.004 (Cloud Accounts), identified as a coverage gap. AutoDEX installed and enabled it automatically.' },
              { id: '2', timestamp: 'Apr 15 @ 13:55:11', rule: 'GCP Pub/Sub Subscription Deletion',        reasoning: 'GCP audit logs detected in your environment. This rule covers T1562.008 (Disable Cloud Logs). AutoDEX installed it to fill the gap.' },
              { id: '3', timestamp: 'Apr 15 @ 13:38:02', rule: 'Potential Widespread Malware Infection',   reasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update.' },
            ].map((log, i, arr) => (
              <div key={log.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <EuiIcon type="checkInCircleFilled" color="success" size="s" />
                  <EuiBadge color="primary">Installed rule</EuiBadge>
                  <EuiText size="xs" color="subdued">{log.timestamp}</EuiText>
                </div>
                <EuiText size="s" style={{ fontWeight: 700, marginBottom: 10 }}>{log.rule}</EuiText>
                <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6, background: '#F7F9FF', marginBottom: 10 }}>
                  <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 6 }}>Reasoning</EuiText>
                  <EuiText size="s">{log.reasoning}</EuiText>
                </EuiPanel>
                <div style={{ display: 'flex', gap: 4 }}>
                  <EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left">View rule</EuiButtonEmpty>
                  <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }}>Add to chat</EuiButtonEmpty>
                </div>
                {i < arr.length - 1 && <EuiHorizontalRule margin="m" />}
              </div>
            ))}
          </EuiFlyoutBody>
          <EuiFlyoutFooter>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <EuiButtonEmpty iconType="download" color="primary">Export logs</EuiButtonEmpty>
              <EuiButtonEmpty onClick={() => setIsInstallLogsOpen(false)}>Close</EuiButtonEmpty>
            </div>
          </EuiFlyoutFooter>
        </EuiFlyout>
      )}
    </>
  );
};

export default AddElasticRulesPage;
