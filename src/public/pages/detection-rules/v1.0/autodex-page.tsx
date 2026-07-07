import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiAvatar,
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import AutoDexApprovalsPanel from './components/AutoDexApprovalsPanel';
import AutoDexActivityLog from './components/AutoDexActivityLog';
import AutoDexConfigureModal from './components/AutoDexConfigureModal';
import { MOCK_AUTODEX_LOGS } from './components/autoDexMockData';

const SUMMARY_DIVIDER = (
  <div style={{ width: 1, background: 'var(--euiBorderColor)', alignSelf: 'stretch', margin: '12px 0' }} />
);

const AutoDexPage: React.FC = () => {
  const navigate = useNavigate();
  const [isEnabled] = useState(() => localStorage.getItem('autodex-enabled') === 'true');
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [actionsSearch, setActionsSearch] = useState('');

  const isPendingItem = (log: typeof MOCK_AUTODEX_LOGS[0]) =>
    (log.needsApproval || log.isSuggestion) && !approvalDecisions[log.id];

  const pendingCount = useMemo(
    () => MOCK_AUTODEX_LOGS.filter(isPendingItem).length,
    [approvalDecisions]
  );
  const totalCount = MOCK_AUTODEX_LOGS.length;

  const handleDecide = (id: string, decision: 'approved' | 'dismissed') => {
    setApprovalDecisions(prev => ({ ...prev, [id]: decision }));
  };

  return (
    <>
      <style>{`
        @media (max-width: 1400px) { .autodex-root { zoom: 0.9; } }
        @media (max-width: 1200px) { .autodex-root { zoom: 0.8; } }
        @media (max-width: 1024px) { .autodex-root { zoom: 0.7; } }
      `}</style>
      <div className="autodex-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SecurityHeader onMenuClick={() => {}} />
        <SecuritySideNav />

        <div style={{ backgroundColor: '#F6F9FC', position: 'absolute', top: 48, left: 80, right: 0, bottom: 0, padding: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', height: '100%', gap: 8 }}>

            {/* Secondary nav */}
            <div style={{ flexShrink: 0, height: '100%' }}>
              <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                <RulesSecondaryNav />
              </EuiPanel>
            </div>

            {/* Main panel */}
            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
              <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>

                {!isEnabled ? (
                  /* ── First-time empty state ── */
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <div style={{ textAlign: 'center', maxWidth: 480 }}>
                      <img src="/images/autodex-illustration.png" alt="" style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto 28px', opacity: 0.85 }} />
                      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111C2C', margin: '0 0 12px' }}>AutoDEX hasn't been set up yet</h1>
                      <p style={{ fontSize: 15, color: '#69707D', lineHeight: '24px', margin: '0 0 32px' }}>
                        AutoDEX is your AI powered detection engineer. It monitors your ruleset, fixes silent failures, reduces false positive noise, and keeps your rules up to date automatically.
                      </p>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                          { icon: 'alert',       text: 'Fixes execution failures' },
                          { icon: 'stats',       text: 'Tunes high false positive rules' },
                          { icon: 'plusInCircle',text: 'Installs new Elastic rules' },
                          { icon: 'refresh',     text: 'Keeps rules up to date' },
                        ].map(f => (
                          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F9FC', border: '1px solid #E3E8F2', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#343741' }}>
                            <EuiIcon type={f.icon} size="s" color="#0B64DD" />
                            {f.text}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 40 }}>
                        <button
                          onClick={() => navigate('/autodex/get-started')}
                          style={{
                            background: 'linear-gradient(135deg, #0B64DD, #7B61FF)',
                            border: 'none', borderRadius: 10, cursor: 'pointer',
                            color: 'white', fontSize: 16, fontWeight: 700,
                            padding: '14px 40px', display: 'inline-flex', alignItems: 'center', gap: 8,
                          }}
                        >
                          <EuiIcon type="sparkles" size="m" color="ghost" />
                          Get started with AutoDEX
                        </button>
                        <p style={{ fontSize: 12, color: '#98A2B3', marginTop: 12 }}>Takes about 2 minutes to configure</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Top buttons — full panel width, pinned to right edge */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 24px 0', flexShrink: 0 }}>
                  <EuiButtonEmpty size="s" iconType="gear" iconSide="left" color="text" style={{ color: 'var(--euiTextColor)', fontWeight: 500 }} onClick={() => setConfigureModalOpen(true)}>
                    Configuration
                  </EuiButtonEmpty>
                  <EuiButtonEmpty size="s" color="text" style={{ color: 'var(--euiTextColor)', fontWeight: 500 }}>
                    View all cases&nbsp;<EuiBadge color="hollow">0</EuiBadge>
                  </EuiButtonEmpty>
                  <EuiPopover
                    isOpen={dotsOpen}
                    closePopover={() => setDotsOpen(false)}
                    panelPaddingSize="s"
                    anchorPosition="downRight"
                    button={<EuiButtonIcon iconType="boxesVertical" color="text" size="s" aria-label="More options" onClick={() => setDotsOpen(o => !o)} />}
                  >
                    <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                      <EuiListGroupItem iconType="productAgent" label="Add to chat" size="s" onClick={() => setDotsOpen(false)} />
                      <EuiListGroupItem iconType="exportAction" label="Export" size="s" onClick={() => setDotsOpen(false)} />
                    </EuiListGroup>
                  </EuiPopover>
                </div>

                {/* ── Scrollable content ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 48px' }}>
                  <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>

                    {/* ── Hero: centred block, illustration left, text right ── */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                        <img src="/images/autodex-illustration.png" alt="AutoDEX" style={{ width: 110, height: 110, objectFit: 'contain', flexShrink: 0 }} />
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E6F9F7', border: '1px solid #00BFB3', borderRadius: 20, padding: '2px 10px', marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#017D73', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Running live</span>
                          </div>
                          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 4px', color: '#111C2C', lineHeight: 1.1 }}>AutoDEX</h1>
                          <p style={{ fontSize: 16, color: '#69707D', margin: 0, fontWeight: 500 }}>Agentic detection rules</p>
                        </div>
                      </div>
                    </div>

                    {/* Stat card */}
                    <EuiPanel hasShadow={false} paddingSize="none" style={{ marginBottom: 24, border: '1px solid #CAD3E2', borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Actions required</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#BD271E', margin: '0 0 2px', lineHeight: 1.1 }}>{pendingCount}</p>
                          <EuiText size="xs" color="subdued">pending review</EuiText>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Minutes saved</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#017D73', margin: '0 0 2px', lineHeight: 1.1 }}>47 min</p>
                          <EuiText size="xs" color="subdued">2% from last week</EuiText>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Approval rate</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--euiTextColor)', margin: '0 0 2px', lineHeight: 1.1 }}>91%</p>
                          <EuiText size="xs" color="subdued">compared to previous</EuiText>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Total tokens used</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--euiTextColor)', margin: '0 0 2px', lineHeight: 1.1 }}>1.24M</p>
                          <EuiText size="xs" color="subdued">this month</EuiText>
                        </div>
                      </div>
                    </EuiPanel>

                    {/* ── AI summary ── */}
                    {(() => {
                      const [summaryOpen, setSummaryOpen] = React.useState(true);
                      return (
                        <div style={{ border: '1px solid #E3E8F2', borderRadius: 8, marginBottom: 20, background: 'linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)', overflow: 'hidden' }}>
                          {/* Header row: toggle + icon + title left | generated + refresh + ⋮ right */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer' }} onClick={() => setSummaryOpen(o => !o)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <EuiButtonIcon iconType={summaryOpen ? 'arrowDown' : 'arrowRight'} size="xs" color="text" aria-label="toggle" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSummaryOpen(o => !o); }} />
                              <EuiIcon type="sparkles" color="text" size="m" />
                              <span style={{ fontSize: 15, fontWeight: 600, color: '#111C2C' }}>AI summary</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: '#98A2B3' }}>Generated on Jun 29, 2026 at 20:58</span>
                              <EuiButtonIcon iconType="refresh" size="xs" color="text" aria-label="Refresh" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
                              <EuiButtonIcon iconType="boxesVertical" size="xs" color="text" aria-label="More" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
                            </div>
                          </div>
                          {summaryOpen && (
                            <div style={{ padding: '0 20px 16px' }}>
                              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'disc' }}>
                                {[
                                  { type: 'Action',  text: 'Windows Registry Modification is failing — index pattern mismatch from Agent 8.14. Fix queued.' },
                                  { type: 'Insight', text: '78% of Unusual Execution alerts are false positives. Add a process parent exception for mmc.exe.' },
                                  { type: 'Insight', text: 'Suspicious PowerShell ImageLoad failed silently 6 hrs due to a renamed Fleet index.' },
                                ].map((item, i) => (
                                  <li key={i} style={{ fontSize: 13, color: '#343741', lineHeight: '20px' }}>
                                    <EuiBadge color="hollow" style={{ marginRight: 8, verticalAlign: 'middle', color: '#111C2C', fontWeight: 600 }}>{item.type}</EuiBadge>
                                    {item.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Combined Actions + Activity log grey card */}
                    <div style={{ background: 'linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)', border: '1px solid #E3E8F2', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                      {/* Actions heading + search/filter */}
                      <div style={{ padding: '16px 24px 12px' }}>
                        <EuiTitle size="s"><h2 style={{ marginBottom: 12 }}>Actions</h2></EuiTitle>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <EuiFieldSearch placeholder="Search actions" value={actionsSearch} onChange={e => setActionsSearch(e.target.value)} isClearable fullWidth />
                          <EuiFilterGroup style={{ flexShrink: 0 }}>
                            <EuiFilterButton
                              iconType="arrowDown"
                              style={{ minWidth: 80, whiteSpace: 'nowrap' }}
                            >
                              Type
                            </EuiFilterButton>
                          </EuiFilterGroup>
                        </div>
                      </div>

                      {/* Actions panel — rows fill the card */}
                      <AutoDexApprovalsPanel
                        items={MOCK_AUTODEX_LOGS}
                        approvalDecisions={approvalDecisions}
                        onDecide={handleDecide}
                        onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)}
                      />

                      {/* Divider */}
                      <EuiHorizontalRule margin="none" />

                      {/* Activity log — accordion header */}
                      <div style={{ padding: '16px 24px 12px' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                          onClick={() => setActivityExpanded(e => !e)}
                        >
                          <EuiButtonIcon
                            iconType={activityExpanded ? 'arrowDown' : 'arrowRight'}
                            aria-label={activityExpanded ? 'Collapse' : 'Expand'}
                            size="xs" color="text"
                          />
                          <EuiTitle size="s"><h2 style={{ margin: 0 }}>Activity log</h2></EuiTitle>
                        </div>
                      </div>

                      {/* Activity log rows — edge-to-edge, no wrapper padding */}
                      {activityExpanded && (
                        <div style={{ padding: '0 24px 16px' }}>
                          <AutoDexActivityLog
                            onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)}
                            requiresApproval={false}
                            completedOnly
                          />
                        </div>
                      )}

                    </div>

                  </div>
                </div>{/* end scrollable */}

                  </>
                )}{/* end isEnabled conditional */}
              </EuiPanel>
            </div>

          </div>
        </div>

        <AutoDexConfigureModal isOpen={configureModalOpen} onClose={() => setConfigureModalOpen(false)} />
      </div>
    </>
  );
};

export default AutoDexPage;
