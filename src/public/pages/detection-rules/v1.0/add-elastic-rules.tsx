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

const AddElasticRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [chatValue, setChatValue] = useState('');
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [isInstallConfigureOpen, setIsInstallConfigureOpen] = useState(false);
  const [isInstallLogsOpen, setIsInstallLogsOpen] = useState(false);
  const [installAutoNew, setInstallAutoNew] = useState(true);
  const [installAutoUpdate, setInstallAutoUpdate] = useState(false);
  const [installThreshold, setInstallThreshold] = useState('medium');
  const [installLevel, setInstallLevel] = useState(2);

  const rules = (parsedRulesData as any[]).slice(0, 40);

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
                <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
                  <EuiTitle size="l">
                    <h1 style={{ marginBottom: 8, color: '#111C2C' }}>Add Elastic Rules</h1>
                  </EuiTitle>
                  <EuiText color="subdued" size="m" style={{ marginBottom: 32 }}>
                    Describe what you want to detect and AutoDEX will find the right rules for your environment.
                  </EuiText>

                  {/* Suggestion cards */}
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
                        placeholder="What do you want to detect? e.g. 'lateral movement via RDP on Windows endpoints'"
                        value={chatValue}
                        onChange={e => setChatValue(e.target.value)}
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
                </div>

                {/* ── Elastic Rules accordion ── */}
                <div style={{
                  border: '1px solid #CAD3E2',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}>
                  {/* Accordion header */}
                  <div
                    onClick={() => setRulesExpanded(e => !e)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px', cursor: 'pointer',
                      background: 'white',
                      borderBottom: rulesExpanded ? '1px solid #CAD3E2' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <EuiIcon type="logoElastic" size="l" />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111C2C' }}>Elastic Rules</div>
                        <div style={{ fontSize: 12, color: '#516381' }}>{rules.length} prebuilt rules available</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <EuiButton fill size="s" iconType="plusInCircle" onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}>
                        Install all
                      </EuiButton>
                      <EuiIcon
                        type={rulesExpanded ? 'arrowUp' : 'arrowDown'}
                        size="m" color="subdued"
                      />
                    </div>
                  </div>

                  {/* Accordion body */}
                  {rulesExpanded && (
                    <div style={{ padding: '0 0 8px' }}>
                      <EuiBasicTable
                        items={(parsedRulesData as any[]).slice(0, 20)}
                        columns={[
                          {
                            field: 'name',
                            name: 'Rule name',
                            render: (name: string) => (
                              <EuiLink href="#"><EuiText size="s" style={{ fontWeight: 600 }}>{name}</EuiText></EuiLink>
                            ),
                          },
                          {
                            name: '',
                            width: '110px',
                            render: () => (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <EuiBadge color="hollow" iconType="visGauge" iconSide="left">0/2</EuiBadge>
                                <EuiBadge color="hollow" iconType="tag" iconSide="left">4</EuiBadge>
                              </div>
                            ),
                          },
                          {
                            field: 'riskScore',
                            name: 'Risk score',
                            width: '100px',
                            render: (score: number) => <EuiText size="s">{score || 47}</EuiText>,
                          },
                          {
                            field: 'severity',
                            name: 'Severity',
                            width: '110px',
                            render: (severity: string) => (
                              <EuiHealth color={getSeverityColor(severity)}>
                                {severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'High'}
                              </EuiHealth>
                            ),
                          },
                          {
                            name: '',
                            width: '80px',
                            render: () => <EuiButtonEmpty size="xs" color="primary" flush="right">Install</EuiButtonEmpty>,
                          },
                          {
                            name: '',
                            width: '40px',
                            render: () => <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" />,
                          },
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
