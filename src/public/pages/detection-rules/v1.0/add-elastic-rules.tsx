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
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

const suggestionCards = [
  {
    icon: 'sparkles',
    iconColor: '#7B61FF',
    title: 'AutoDEX install',
    badge: 'On',
    desc: 'Let our agent discover and install rules relevant to your organisation and new threats.',
    actions: [
      { label: 'Configure', icon: 'controlsHorizontal', onClickKey: 'configure' },
      { label: 'View logs',  icon: 'list',               onClickKey: 'logs'      },
    ],
  },
  {
    icon: 'addDataApp',
    iconColor: '#0077CC',
    title: 'Newly added integrations',
    badge: null,
    desc: 'Locate all the rules for your newly added integrations.',
    actions: [{ label: 'Show rules', icon: 'arrowRight', onClickKey: null }],
  },
  {
    icon: 'users',
    iconColor: '#017D73',
    title: 'Rules like mine',
    badge: null,
    desc: 'Rules most commonly used by organisations with similar stack profiles.',
    actions: [{ label: 'Begin discovery', icon: 'arrowRight', onClickKey: null }],
  },
  {
    icon: 'machineLearningApp',
    iconColor: '#F5A700',
    title: 'Machine learning',
    badge: null,
    desc: 'Reference existing detection rules using Elastic ML jobs.',
    actions: [{ label: 'Show rules', icon: 'arrowRight', onClickKey: null }],
  },
];

// ── Simulated AI responses keyed by keyword ──────────────────────────────────
const AI_RESPONSES: Record<string, { title: string; summary: string; rules: { name: string; desc: string; severity: string }[] }> = {
  okta: {
    title: 'Here are your Okta rules that we recommend.',
    summary: 'Based on your Okta integration data, these rules cover the most common identity-based threats including credential attacks, session hijacking, and privilege escalation through your Okta environment.',
    rules: [
      { name: 'Okta User Account Locked Out', desc: 'Detects repeated authentication failures that result in an account lockout — a common indicator of brute-force or credential stuffing attacks.', severity: 'medium' },
      { name: 'Okta MFA Bypass Attempt', desc: 'Identifies attempts to bypass multi-factor authentication, which may indicate a sophisticated attacker with valid credentials.', severity: 'high' },
      { name: 'Okta Admin Role Assigned', desc: 'Fires whenever an administrative role is granted to a user. Unexpected privilege escalation is a key lateral movement signal.', severity: 'high' },
      { name: 'Okta User Session Impersonation', desc: 'Detects impersonation events where a support or admin user takes over another user\'s session, which may indicate insider threat or compromised admin account.', severity: 'critical' },
      { name: 'Okta Policy Rule Modified', desc: 'Tracks changes to Okta authentication policies. Weakening MFA or IP restriction policies is a common attacker persistence technique.', severity: 'medium' },
    ],
  },
  default: {
    title: 'Here are the rules we recommend for your query.',
    summary: 'Based on your description, AutoDEX has identified the following detection rules as most relevant to your environment and threat model.',
    rules: [
      { name: 'Unusual Network Destination Domain Name', desc: 'Detects connections to rare or newly registered domains, often used in C2 communication.', severity: 'medium' },
      { name: 'Potential Credential Access via LSASS Memory', desc: 'Identifies attempts to read LSASS memory, a key technique for credential harvesting.', severity: 'high' },
      { name: 'Lateral Movement via Remote Services', desc: 'Flags remote service usage patterns consistent with lateral movement across the environment.', severity: 'high' },
    ],
  },
};

const AddElasticRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [chatValue, setChatValue] = useState('');
  const [aiResponse, setAiResponse] = useState<typeof AI_RESPONSES['okta'] | null>(null);
  const [responseExpanded, setResponseExpanded] = useState(true);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [isInstallConfigureOpen, setIsInstallConfigureOpen] = useState(false);
  const [isInstallLogsOpen, setIsInstallLogsOpen] = useState(false);
  const [installAutoNew, setInstallAutoNew] = useState(true);
  const [installAutoUpdate, setInstallAutoUpdate] = useState(false);
  const [installThreshold, setInstallThreshold] = useState('medium');
  const [installLevel, setInstallLevel] = useState(2);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

  const rules = (parsedRulesData as any[]).slice(0, 40);

  const [submittedQuery, setSubmittedQuery] = useState('');

  const handleChatSubmit = () => {
    if (!chatValue.trim()) return;
    const q = chatValue.toLowerCase();
    const response = q.includes('okta') ? AI_RESPONSES.okta : AI_RESPONSES.default;
    setSubmittedQuery(chatValue);
    setAiResponse(null);
    setIsThinking(true);
    setThinkingStep(0);
    setChatValue('');
    // Cycle through reasoning messages over 5s
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

  return (
    <>
      <style>{`
        .elastic-chat-input:focus { outline: none; }
        .elastic-rules-accordion { transition: all 0.25s ease; }
        @keyframes thinking-pulse { 0%,100% { opacity: 0.4; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes thinking-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .thinking-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #7B61FF; animation: thinking-pulse 1.2s ease-in-out infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        .thinking-step-done { color: #00875A; }
        .thinking-step-active { color: #7B61FF; font-weight: 600; }
        .thinking-step-pending { color: #98A2B3; }
      `}</style>

      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{
        backgroundColor: '#F6F9FC',
        height: 'calc(100vh - 56px)',
        marginTop: 48,
        marginLeft: 80,
        padding: 8,
        display: 'flex',
        overflow: 'hidden',
      }}>
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

              {/* Back button */}
              <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
                <EuiButtonEmpty iconType="arrowLeft" size="s" onClick={() => navigate('/detection-rules')} flush="left">
                  Detection rules (SIEM)
                </EuiButtonEmpty>
              </div>

              {/* Scrollable main content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px' }}>

                {/* ── Hero section ── */}
                <div style={{ maxWidth: 1265, margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 89 89" fill="none" style={{ flexShrink: 0 }}>
                      <path fill="url(#sp-a)" fillRule="evenodd" d="M66.75 2.781a2.781 2.781 0 1 0-5.563 0c0 2.336-.723 5.903-2.813 8.805-1.987 2.76-5.324 5.101-11.093 5.101a2.781 2.781 0 0 0 0 5.563c5.769 0 9.106 2.341 11.093 5.102 2.09 2.902 2.813 6.468 2.813 8.804a2.781 2.781 0 1 0 5.563 0c0-2.336.724-5.902 2.813-8.804 1.988-2.76 5.325-5.102 11.093-5.102a2.781 2.781 0 1 0 0-5.563c-5.768 0-9.105-2.34-11.093-5.101-2.09-2.902-2.813-6.469-2.813-8.805Zm3.248 16.688a17.242 17.242 0 0 1-4.949-4.633 18.946 18.946 0 0 1-1.08-1.683 18.97 18.97 0 0 1-1.08 1.683 17.242 17.242 0 0 1-4.95 4.633 17.24 17.24 0 0 1 4.95 4.633 19.2 19.2 0 0 1 1.08 1.682 18.97 18.97 0 0 1 1.08-1.682 17.24 17.24 0 0 1 4.949-4.633Z" clipRule="evenodd"/>
                      <path fill="url(#sp-b)" fillRule="evenodd" d="M33.375 19.469a2.781 2.781 0 1 0-5.563 0v.035a20.729 20.729 0 0 1-.047.962 31.335 31.335 0 0 1-.35 2.891c-.403 2.425-1.207 5.617-2.785 8.774-1.574 3.147-3.89 6.209-7.312 8.49-3.405 2.27-8.07 3.879-14.537 3.879a2.781 2.781 0 1 0 0 5.563c6.467 0 11.132 1.608 14.537 3.878 3.422 2.282 5.738 5.344 7.312 8.49 1.578 3.158 2.382 6.349 2.786 8.774.2 1.206.3 2.205.35 2.892a20.729 20.729 0 0 1 .046.962v.032a2.781 2.781 0 1 0 5.563.003v-.035l.005-.185c.006-.17.018-.434.042-.777.05-.687.149-1.686.35-2.892.404-2.425 1.207-5.616 2.786-8.774 1.573-3.146 3.89-6.208 7.312-8.49 3.405-2.27 8.07-3.879 14.536-3.879a2.781 2.781 0 1 0 0-5.562c-6.466 0-11.131-1.609-14.536-3.879-3.422-2.281-5.739-5.343-7.312-8.49-1.579-3.157-2.382-6.349-2.786-8.774a31.335 31.335 0 0 1-.35-2.891 20.729 20.729 0 0 1-.046-.962l-.001-.035ZM44.436 47.28a26.24 26.24 0 0 1-3.652-2.031c-4.4-2.934-7.298-6.825-9.201-10.631a33.005 33.005 0 0 1-.99-2.173 33.06 33.06 0 0 1-.988 2.173c-1.903 3.806-4.802 7.697-9.202 10.63a26.245 26.245 0 0 1-3.652 2.032 26.235 26.235 0 0 1 3.652 2.032c4.4 2.933 7.299 6.824 9.202 10.63.364.729.692 1.455.989 2.174.296-.719.625-1.445.989-2.173 1.903-3.807 4.802-7.698 9.201-10.631a26.25 26.25 0 0 1 3.652-2.032Z" clipRule="evenodd"/>
                      <path fill="url(#sp-c)" fillRule="evenodd" d="M69.531 50.063a2.781 2.781 0 0 1 2.781 2.78c0 2.337.724 5.903 2.814 8.805 1.987 2.76 5.324 5.102 11.093 5.102a2.781 2.781 0 0 1 0 5.563c-5.769 0-9.106 2.34-11.093 5.101-2.09 2.902-2.814 6.469-2.814 8.805a2.781 2.781 0 0 1-5.562 0c0-2.336-.724-5.903-2.813-8.805-1.988-2.76-5.325-5.102-11.093-5.102a2.781 2.781 0 1 1 0-5.562c5.768 0 9.105-2.341 11.093-5.102 2.09-2.902 2.813-6.468 2.813-8.804a2.781 2.781 0 0 1 2.781-2.782Zm1.08 14.835a17.24 17.24 0 0 0 4.95 4.633 17.242 17.242 0 0 0-4.95 4.633c-.395.55-.754 1.112-1.08 1.683a18.97 18.97 0 0 0-1.08-1.683 17.242 17.242 0 0 0-4.949-4.633 17.24 17.24 0 0 0 4.949-4.633 18.97 18.97 0 0 0 1.08-1.682 19.2 19.2 0 0 0 1.08 1.682Z" clipRule="evenodd"/>
                      <defs>
                        <linearGradient id="sp-a" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                        <linearGradient id="sp-b" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                        <linearGradient id="sp-c" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                      </defs>
                    </svg>
                    <EuiTitle size="l">
                      <h1 style={{ margin: 0, color: '#111C2C' }}>Add Elastic Rules</h1>
                    </EuiTitle>
                  </div>
                  <EuiText color="subdued" size="m" style={{ marginBottom: 32 }}>
                    Describe what you want to detect and AutoDEX will find the right rules for your environment.
                  </EuiText>

                  {/* Thinking / reasoning — minimal inline style matching screenshots */}
                  {isThinking && (
                    <div style={{ marginBottom: 24, textAlign: 'left' }}>
                      {/* User query bubble — right aligned */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <div style={{ background: '#EEF3FF', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 14, color: '#1D2A3E', maxWidth: '60%' }}>
                          {submittedQuery}
                        </div>
                      </div>
                      {/* Reasoning lines — only show up to current step */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                          { step: 0, text: 'Thinking...' },
                          { step: 1, text: 'Deciding what to do next...' },
                          { step: 2, text: `Loading the detection rule skill to understand how to find and work with detection rules....`, arrow: true },
                          { step: 3, text: `Searching Security Labs for ${submittedQuery.toLowerCase().includes('okta') ? 'Okta-related' : 'relevant'} threat intelligence and detection guidance....`, arrow: true },
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

                  {/* AI Response card — shown after a query is submitted */}
                  {aiResponse ? (
                    <div style={{ marginBottom: 24, textAlign: 'left' }}>
                      <div style={{
                        border: '2px solid #7B61FF',
                        borderRadius: 16,
                        background: 'white',
                        overflow: 'hidden',
                        boxShadow: '0 0 0 4px rgba(123,97,255,0.08)',
                      }}>
                        {/* Response header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D4F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <EuiIcon type="sparkles" size="s" color="#00875A" />
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#111C2C', lineHeight: '26px' }}>
                              {aiResponse.title}
                            </div>
                          </div>
                          <button
                            onClick={() => setAiResponse(null)}
                            style={{ background: 'none', border: '1px solid #CAD3E2', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}
                          >
                            <EuiIcon type="cross" size="s" color="subdued" />
                          </button>
                        </div>

                        {/* Response body */}
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
                              <EuiButtonEmpty size="s" iconType="expand" iconSide="right" color="primary" onClick={() => setRulesExpanded(true)}>
                                View all rules
                              </EuiButtonEmpty>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                  /* Suggestion cards — shown when no active query */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32, textAlign: 'left' }}>
                    {suggestionCards.map((card) => (
                      <EuiPanel key={card.title} hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 10, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <EuiIcon type={card.icon} size="m" style={{ color: card.iconColor }} />
                          {card.badge && <EuiBadge color="success" style={{ fontSize: 10 }}>{card.badge}</EuiBadge>}
                        </div>
                        <EuiText size="s" style={{ fontWeight: 700, marginBottom: 6, color: '#111C2C' }}>{card.title}</EuiText>
                        <EuiText size="xs" color="subdued" style={{ flex: 1, marginBottom: 10, lineHeight: '18px' }}>{card.desc}</EuiText>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {card.actions.map(a => (
                            <EuiButtonEmpty
                              key={a.label}
                              size="xs"
                              iconType={a.icon}
                              iconSide="right"
                              color="primary"
                              flush="left"
                              onClick={() => {
                                if (a.onClickKey === 'configure') setIsInstallConfigureOpen(true);
                                if (a.onClickKey === 'logs')      setIsInstallLogsOpen(true);
                              }}
                            >
                              {a.label}
                            </EuiButtonEmpty>
                          ))}
                        </div>
                      </EuiPanel>
                    ))}
                  </div>
                  )}

                  {/* ── Gradient-bordered chat input ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, #00BFB3 0%, #0B64DD 50%, #7B61FF 100%)',
                    padding: '2px',
                    borderRadius: 14,
                    marginBottom: 40,
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: '16px 18px 12px',
                    }}>
                      <textarea
                        className="elastic-chat-input"
                        placeholder="What do you want to detect? e.g. 'What rules do I need for Okta?'"
                        value={chatValue}
                        onChange={e => setChatValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                        rows={3}
                        style={{
                          width: '100%',
                          border: 'none',
                          resize: 'none',
                          fontSize: 15,
                          color: '#111C2C',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          lineHeight: '24px',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #E3E8F2' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['ATT&CK technique', 'Data source', 'Severity'].map(tag => (
                            <span key={tag} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 10px', borderRadius: 20,
                              border: '1px solid #CAD3E2', fontSize: 12,
                              color: '#516381', cursor: 'pointer',
                              background: '#F6F9FC',
                            }}>
                              <EuiIcon type="plus" size="s" color="subdued" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={handleChatSubmit}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: 10,
                            background: chatValue.trim()
                              ? 'linear-gradient(135deg, #00BFB3, #0B64DD)'
                              : '#E3E8F2',
                            border: 'none', cursor: chatValue.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                          }}
                        >
                          <EuiIcon type="sortUp" size="m" color={chatValue.trim() ? 'ghost' : 'subdued'} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Elastic Rules accordion — below chat ── */}
                  <div style={{ border: '1px solid #CAD3E2', borderRadius: 10, overflow: 'hidden', marginBottom: 24, textAlign: 'left' }}>
                    <div
                      onClick={() => setRulesExpanded(e => !e)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', background: 'white', borderBottom: rulesExpanded ? '1px solid #CAD3E2' : 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <EuiIcon type="logoElastic" size="l" />
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111C2C' }}>Elastic Rules</div>
                          <div style={{ fontSize: 12, color: '#516381' }}>{rules.length} prebuilt rules available</div>
                        </div>
                      </div>
                      <EuiIcon type={rulesExpanded ? 'arrowUp' : 'arrowDown'} size="m" color="subdued" />
                    </div>
                    {rulesExpanded && (
                      <div style={{ padding: '0 0 8px' }}>
                        <EuiBasicTable
                          items={(parsedRulesData as any[]).slice(0, 20)}
                          columns={[
                            { field: 'name', name: 'Rule name', render: (name: string) => <EuiLink href="#"><EuiText size="s" style={{ fontWeight: 600 }}>{name}</EuiText></EuiLink> },
                            { name: '', width: '110px', render: () => <div style={{ display: 'flex', gap: 4 }}><EuiBadge color="hollow" iconType="visGauge" iconSide="left">0/2</EuiBadge><EuiBadge color="hollow" iconType="tag" iconSide="left">4</EuiBadge></div> },
                            { field: 'riskScore', name: 'Risk score', width: '100px', render: (score: number) => <EuiText size="s">{score || 47}</EuiText> },
                            { field: 'severity', name: 'Severity', width: '110px', render: (severity: string) => <EuiHealth color={getSeverityColor(severity)}>{severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'High'}</EuiHealth> },
                            { name: '', width: '80px', render: () => <EuiButtonEmpty size="xs" color="primary" flush="right">Install</EuiButtonEmpty> },
                            { name: '', width: '40px', render: () => <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" /> },
                          ]}
                          itemId="id"
                          selection={{ selectable: () => true, onSelectionChange: () => {} }}
                          pagination={{ pageIndex: 0, pageSize: 20, totalItemCount: rules.length, pageSizeOptions: [10, 20, 50], showPerPageOptions: true }}
                          onChange={() => {}}
                        />
                      </div>
                    )}
                  </div>

                </div>


              </div>
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
              { label: 'Install new Elastic prebuilt rules', desc: 'Automatically install rules that fill detected MITRE coverage gaps for your stack.', value: installAutoNew, set: setInstallAutoNew },
              { label: 'Auto-update installed rules', desc: 'Apply new versions of installed prebuilt rules when they are released.', value: installAutoUpdate, set: setInstallAutoUpdate },
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
              { id: '1', timestamp: 'Apr 15 @ 14:22:07', rule: 'AWS IAM Assume Role Policy Update', reasoning: 'Your environment has AWS CloudTrail data. This rule covers T1078.004 (Cloud Accounts), identified as a coverage gap. AutoDEX installed and enabled it automatically.' },
              { id: '2', timestamp: 'Apr 15 @ 13:55:11', rule: 'GCP Pub/Sub Subscription Deletion', reasoning: 'GCP audit logs detected in your environment. This rule covers T1562.008 (Disable Cloud Logs). AutoDEX installed it to fill the gap.' },
              { id: '3', timestamp: 'Apr 15 @ 13:38:02', rule: 'Potential Widespread Malware Infection', reasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update.' },
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
