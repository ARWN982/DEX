import React, { useMemo, useState } from 'react';
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
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [activityExpanded, setActivityExpanded] = useState(true);
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

        {/* Grey outer wrapper */}
        <div style={{ backgroundColor: '#F6F9FC', position: 'absolute', top: 48, left: 80, right: 0, bottom: 0, padding: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', height: '100%', gap: 8 }}>

            {/* Secondary nav */}
            <div style={{ flexShrink: 0, height: '100%' }}>
              <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                <RulesSecondaryNav />
              </EuiPanel>
            </div>

            {/* Main white panel */}
            <div style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
              <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, background: 'linear-gradient(90deg, #F9F9FB 0%, #FFFFFF 8%, #FFFFFF 92%, #F9F9FB 100%)', minHeight: '100%' }}>
                <div style={{ padding: '32px 40px 48px' }}>
                  <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>

                    {/* Top-right buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
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

                    {/* Title + status */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" viewBox="0 0 89 89" fill="none" style={{ flexShrink: 0 }} className="autodex-sparkles">
                          <style>{`
                            @keyframes sparkle-shift {
                              0%   { filter: hue-rotate(0deg) brightness(1) saturate(1); }
                              20%  { filter: hue-rotate(40deg) brightness(1.2) saturate(1.3); }
                              40%  { filter: hue-rotate(-30deg) brightness(1.15) saturate(1.2); }
                              60%  { filter: hue-rotate(25deg) brightness(1.25) saturate(1.4); }
                              80%  { filter: hue-rotate(-15deg) brightness(1.1) saturate(1.15); }
                              100% { filter: hue-rotate(0deg) brightness(1) saturate(1); }
                            }
                            .autodex-sparkles { animation: sparkle-shift 2s ease-in-out 5 forwards; }
                          `}</style>
                          <path fill="url(#adx-a)" fillRule="evenodd" d="M66.75 2.781a2.781 2.781 0 1 0-5.563 0c0 2.336-.723 5.903-2.813 8.805-1.987 2.76-5.324 5.101-11.093 5.101a2.781 2.781 0 0 0 0 5.563c5.769 0 9.106 2.341 11.093 5.102 2.09 2.902 2.813 6.468 2.813 8.804a2.781 2.781 0 1 0 5.563 0c0-2.336.724-5.902 2.813-8.804 1.988-2.76 5.325-5.102 11.093-5.102a2.781 2.781 0 1 0 0-5.563c-5.768 0-9.105-2.34-11.093-5.101-2.09-2.902-2.813-6.469-2.813-8.805Zm3.248 16.688a17.242 17.242 0 0 1-4.949-4.633 18.946 18.946 0 0 1-1.08-1.683 18.97 18.97 0 0 1-1.08 1.683 17.242 17.242 0 0 1-4.95 4.633 17.24 17.24 0 0 1 4.95 4.633 19.2 19.2 0 0 1 1.08 1.682 18.97 18.97 0 0 1 1.08-1.682 17.24 17.24 0 0 1 4.949-4.633Z" clipRule="evenodd"/>
                          <path fill="url(#adx-b)" fillRule="evenodd" d="M33.375 19.469a2.781 2.781 0 1 0-5.563 0v.035a20.729 20.729 0 0 1-.047.962 31.335 31.335 0 0 1-.35 2.891c-.403 2.425-1.207 5.617-2.785 8.774-1.574 3.147-3.89 6.209-7.312 8.49-3.405 2.27-8.07 3.879-14.537 3.879a2.781 2.781 0 1 0 0 5.563c6.467 0 11.132 1.608 14.537 3.878 3.422 2.282 5.738 5.344 7.312 8.49 1.578 3.158 2.382 6.349 2.786 8.774.2 1.206.3 2.205.35 2.892a20.729 20.729 0 0 1 .046.962v.032a2.781 2.781 0 1 0 5.563.003v-.035l.005-.185c.006-.17.018-.434.042-.777.05-.687.149-1.686.35-2.892.404-2.425 1.207-5.616 2.786-8.774 1.573-3.146 3.89-6.208 7.312-8.49 3.405-2.27 8.07-3.879 14.536-3.879a2.781 2.781 0 1 0 0-5.562c-6.466 0-11.131-1.609-14.536-3.879-3.422-2.281-5.739-5.343-7.312-8.49-1.579-3.157-2.382-6.349-2.786-8.774a31.335 31.335 0 0 1-.35-2.891 20.729 20.729 0 0 1-.046-.962l-.001-.035Z" clipRule="evenodd"/>
                          <path fill="url(#adx-c)" fillRule="evenodd" d="M69.531 50.063a2.781 2.781 0 0 1 2.781 2.78c0 2.337.724 5.903 2.814 8.805 1.987 2.76 5.324 5.102 11.093 5.102a2.781 2.781 0 0 1 0 5.563c-5.769 0-9.106 2.34-11.093 5.101-2.09 2.902-2.814 6.469-2.814 8.805a2.781 2.781 0 0 1-5.562 0c0-2.336-.724-5.903-2.813-8.805-1.988-2.76-5.325-5.102-11.093-5.102a2.781 2.781 0 1 1 0-5.562c5.768 0 9.105-2.341 11.093-5.102 2.09-2.902 2.813-6.468 2.813-8.804a2.781 2.781 0 0 1 2.781-2.782Z" clipRule="evenodd"/>
                          <defs>
                            <linearGradient id="adx-a" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                            <linearGradient id="adx-b" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                            <linearGradient id="adx-c" x1="-5.91" x2="88.379" y1="-38.938" y2="-23.331" gradientUnits="userSpaceOnUse"><stop stopColor="#75ACFF"/><stop offset=".995" stopColor="#CFB4FF"/></linearGradient>
                          </defs>
                        </svg>
                        <h1 style={{ fontSize: 31, fontWeight: 500, margin: 0, color: 'var(--euiTitleColor)', lineHeight: '40px' }}>AutoDEX</h1>
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

                    {/* Combined Actions + Activity log grey card */}
                    <div style={{ background: 'linear-gradient(180deg, #EEF1F7 0%, #F6F9FC 50%, #EEF1F7 100%)', border: '1px solid #CAD3E2', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>

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
                        <div style={{ paddingBottom: 16 }}>
                          <AutoDexActivityLog
                            onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)}
                            requiresApproval={false}
                            completedOnly
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

        <AutoDexConfigureModal isOpen={configureModalOpen} onClose={() => setConfigureModalOpen(false)} />
      </div>
    </>
  );
};

export default AutoDexPage;
