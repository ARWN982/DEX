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
  EuiHorizontalRule,
  EuiListGroup,
  EuiListGroupItem,
  EuiNotificationBadge,
  EuiPanel,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSpacer,
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
  <div style={{ width: 1, background: '#E3E8F2', alignSelf: 'stretch', margin: '12px 0' }} />
);

const AutoDexPage: React.FC = () => {
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [typeOptions, setTypeOptions] = useState<{ label: string; checked?: 'on' }[]>([
    { label: 'Execution failure',      checked: 'on' },
    { label: 'Tuned false positives',  checked: 'on' },
    { label: 'Fixed execution failure' },
    { label: 'Installed rule' },
    { label: 'Updated rule' },
  ]);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);

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
              <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, background: 'white', minHeight: '100%' }}>
                <div style={{ padding: '32px 40px 48px' }}>
                  <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>

                    {/* Top-right buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <EuiButtonEmpty size="s" iconType="gear" iconSide="left" color="text" style={{ color: '#343741', fontWeight: 500 }} onClick={() => setConfigureModalOpen(true)}>
                        Configuration
                      </EuiButtonEmpty>
                      <EuiButtonEmpty size="s" color="text" style={{ color: '#343741', fontWeight: 500 }}>
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
                      <h1 style={{ fontSize: 43, fontWeight: 700, marginBottom: 8, color: '#111C2C', lineHeight: '52px' }}>AutoDEX</h1>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <EuiBadge color="success" style={{ fontSize: 13 }}>Running</EuiBadge>
                        <span style={{ fontSize: 17, color: '#111C2C' }}>
                          You have <strong>{pendingCount}</strong> actions required
                        </span>
                      </div>
                    </div>

                    {/* Stat card */}
                    <EuiPanel hasBorder hasShadow={false} paddingSize="none" style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Actions required</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#BD271E', margin: '0 0 2px', lineHeight: 1.1 }}>{pendingCount}</p>
                          <EuiText size="xs" color="subdued">pending review</EuiText>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Activities today</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#017D73', margin: '0 0 2px', lineHeight: 1.1 }}>{totalCount}</p>
                          <EuiBadge color="success" iconType="sortUp" style={{ fontSize: 11 }}>+2 from last week</EuiBadge>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Approval rate</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#1d2a3e', margin: '0 0 2px', lineHeight: 1.1 }}>91%</p>
                          <EuiText size="xs" color="subdued">compared to previous</EuiText>
                        </div>
                        {SUMMARY_DIVIDER}
                        <div style={{ flex: 1, padding: '16px 20px' }}>
                          <EuiText size="xs" color="subdued" style={{ fontWeight: 600, marginBottom: 4 }}>Total tokens used</EuiText>
                          <p style={{ fontSize: 28, fontWeight: 700, color: '#1d2a3e', margin: '0 0 2px', lineHeight: 1.1 }}>1.24M</p>
                          <EuiText size="xs" color="subdued">this month</EuiText>
                        </div>
                      </div>
                    </EuiPanel>

                    {/* Combined Actions + Activity log grey card */}
                    <div style={{ background: '#F6F9FC', border: '1px solid #E3E8F2', borderRadius: 8, overflow: 'hidden' }}>

                      {/* Actions heading */}
                      <div style={{ padding: '16px 24px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <EuiTitle size="s"><h2 style={{ margin: 0 }}>Actions</h2></EuiTitle>
                          <EuiNotificationBadge size="m" color="accent">{pendingCount}</EuiNotificationBadge>
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

                      {/* Activity log — accordion */}
                      <div style={{ padding: '16px 24px' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: activityExpanded ? 16 : 0 }}
                          onClick={() => setActivityExpanded(e => !e)}
                        >
                          <EuiButtonIcon
                            iconType={activityExpanded ? 'arrowDown' : 'arrowRight'}
                            aria-label={activityExpanded ? 'Collapse' : 'Expand'}
                            size="xs" color="text"
                          />
                          <EuiTitle size="s"><h2 style={{ margin: 0 }}>Activity log</h2></EuiTitle>
                        </div>

                        {activityExpanded && (
                          <>
                            {/* Search + Type filter */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                              <EuiFieldSearch
                                placeholder="Search activities"
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
                                      hasActiveFilters={typeOptions.some(o => o.checked === 'on')}
                                      numActiveFilters={typeOptions.filter(o => o.checked === 'on').length}
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
                                    onChange={opts => setTypeOptions(opts as { label: string; checked?: 'on' }[])}
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
                              onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)}
                              requiresApproval={false}
                              completedOnly
                            />
                          </>
                        )}
                      </div>

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
