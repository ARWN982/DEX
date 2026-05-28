import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiNotificationBadge,
  EuiPopover,
  EuiSpacer,
  EuiTablePagination,
  EuiText,
} from '@elastic/eui';
import type { AutoDexMockLog } from './autoDexMockData';

const ACTION_PANEL_BUTTON_MIN_WIDTH = 176;

export interface AutoDexApprovalsPanelProps {
  items: AutoDexMockLog[];
  approvalDecisions: Record<string, 'approved' | 'dismissed'>;
  onDecide: (id: string, decision: 'approved' | 'dismissed') => void;
  onOpenAIAssistant: (prompt: string) => void;
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace(', 2026', '');
}

function getCategoryLabel(action: string): string {
  return action.toUpperCase();
}

function getRulesAffected(log: AutoDexMockLog): number {
  if (log.rulesAffected != null) return log.rulesAffected;
  return log.action === 'Execution failure' ? 5 : 3;
}

function getApprovalChatPrompt(log: AutoDexMockLog): string {
  return `Help me review this AutoDEX ${log.action.toLowerCase()} action on rule "${log.rule}". ${log.reasoning}`;
}

const AutoDexApprovalsPanel: React.FC<AutoDexApprovalsPanelProps> = ({
  items,
  approvalDecisions,
  onDecide,
  onOpenAIAssistant,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [approvalPopoverId, setApprovalPopoverId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const pendingItems = useMemo(
    () => items.filter((log) => {
      if (approvalDecisions[log.id]) return false;
      return log.needsApproval || log.isSuggestion;
    }),
    [items, approvalDecisions]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [pendingItems.length]);

  const pagedItems = pendingItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const toggleExpanded = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div
      data-test-subj="autodex-approvalsRequiredPanel"
      style={{
        background: '#F6F9FC',
        border: '1px solid #E3E8F2',
        borderRadius: 6,
        padding: '16px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <EuiNotificationBadge size="m" color="accent" data-test-subj="autodex-approvalsCount">
          {pendingItems.length}
        </EuiNotificationBadge>
        <h2 style={{ margin: 0, fontSize: 16, lineHeight: '24px', fontWeight: 500, color: '#111C2C' }}>
          Approvals required
        </h2>
      </div>

      {pendingItems.length === 0 ? (
        <div style={{ padding: 24, width: '100%' }}>
          <EuiEmptyPrompt
            iconType="checkInCircleFilled"
            color="success"
            title={<h3>No approvals required</h3>}
            titleSize="xs"
            body={<EuiText size="s"><p>AutoDEX has no pending actions awaiting your review.</p></EuiText>}
          />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {pagedItems.map((log, index) => {
              const isExpanded = expandedIds.has(log.id);
              const isFirstRow = index === 0;
              const isLastRow = index === pagedItems.length - 1;
              const rulesAffected = getRulesAffected(log);

              return (
                <div
                  key={log.id}
                  style={{
                    background: 'white',
                    border: '1px solid #CAD3E2',
                    padding: 12,
                    marginBottom: index < pagedItems.length - 1 ? -1 : 0,
                    borderRadius: isFirstRow && isLastRow
                      ? 6
                      : isFirstRow
                        ? '6px 6px 0 0'
                        : isLastRow
                          ? '0 0 6px 6px'
                          : undefined,
                  }}
                  data-test-subj={`autodex-approvalItem-${log.id}`}
                >
                  <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="none">
                    <EuiFlexItem>
                      <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiButtonIcon
                            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
                            aria-label={isExpanded ? 'Collapse approval' : 'Expand approval'}
                            size="s"
                            color="text"
                            onClick={() => toggleExpanded(log.id)}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false} style={{ width: 150 }}>
                          <EuiText size="xs" style={{ fontWeight: 600, color: '#516381', letterSpacing: '0.02em' }}>
                            {getCategoryLabel(log.action)}
                          </EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: 20,
                              padding: '0 8px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 500,
                              lineHeight: '16px',
                              background: log.isSuggestion ? '#FFF3D0' : '#FDDDD8',
                              color: log.isSuggestion ? '#836500' : '#A71627',
                            }}
                          >
                            {log.isSuggestion ? 'Suggestion' : 'Approval needed'}
                          </span>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" style={{ fontWeight: 600 }}>{log.rule}</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">{formatTimestamp(log.timestamp)}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} justifyContent="flexEnd">
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow">{rulesAffected} rules affected</EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <div style={{ width: 1, height: 23, background: '#CAD3E2' }} />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <div
                            style={{
                              width: ACTION_PANEL_BUTTON_MIN_WIDTH,
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <EuiPopover
                              isOpen={approvalPopoverId === log.id}
                              closePopover={() => setApprovalPopoverId(null)}
                              panelPaddingSize="s"
                              anchorPosition="downRight"
                              button={
                                <EuiButtonEmpty
                                  size="s"
                                  iconType="arrowDown"
                                  iconSide="right"
                                  color="primary"
                                  flush="right"
                                  onClick={() => setApprovalPopoverId(approvalPopoverId === log.id ? null : log.id)}
                                >
                                  Approval action
                                </EuiButtonEmpty>
                              }
                            >
                              <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                                <EuiListGroupItem
                                  iconType="checkInCircleFilled"
                                  label="Approve"
                                  size="s"
                                  onClick={() => {
                                    onDecide(log.id, 'approved');
                                    setApprovalPopoverId(null);
                                  }}
                                />
                                <EuiListGroupItem
                                  iconType="minusInCircle"
                                  label="Dismiss"
                                  size="s"
                                  onClick={() => {
                                    onDecide(log.id, 'dismissed');
                                    setApprovalPopoverId(null);
                                  }}
                                />
                              </EuiListGroup>
                            </EuiPopover>
                          </div>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiPopover
                            isOpen={openPopoverId === log.id}
                            closePopover={() => setOpenPopoverId(null)}
                            panelPaddingSize="s"
                            anchorPosition="downRight"
                            button={
                              <EuiButtonIcon
                                size="s"
                                iconType="boxesHorizontal"
                                color="primary"
                                aria-label="More actions"
                                onClick={() => setOpenPopoverId(openPopoverId === log.id ? null : log.id)}
                              />
                            }
                          >
                            <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                              <EuiListGroupItem
                                iconType="productAgent"
                                label="Add to chat"
                                size="s"
                                onClick={() => {
                                  setOpenPopoverId(null);
                                  onOpenAIAssistant(getApprovalChatPrompt(log));
                                }}
                              />
                              <EuiListGroupItem iconType="folderClosed" label="Create a case" size="s" onClick={() => setOpenPopoverId(null)} />
                            </EuiListGroup>
                          </EuiPopover>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  {isExpanded && (
                    <>
                      <EuiSpacer size="s" />
                      <div style={{ background: '#FFFFFF', border: '1px solid #D3DAE6', borderRadius: 4, padding: '8px 12px', marginLeft: 28 }}>
                        <EuiText size="xs">
                          <p style={{ margin: 0 }}><strong>Reasoning:</strong> {log.reasoning}</p>
                        </EuiText>
                        {log.fullReasoning?.summary && (
                          <>
                            <EuiSpacer size="xs" />
                            <EuiText size="xs">
                              <p style={{ margin: 0 }}><strong>Summary:</strong> {log.fullReasoning.summary}</p>
                            </EuiText>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: 4, width: '100%' }}>
            <EuiTablePagination
              pageCount={Math.max(1, Math.ceil(pendingItems.length / pageSize))}
              activePage={pageIndex}
              onChangePage={setPageIndex}
              itemsPerPage={pageSize}
              itemsPerPageOptions={[5, 10]}
              onChangeItemsPerPage={(size) => { setPageSize(size); setPageIndex(0); }}
              data-test-subj="autodex-approvalsPagination"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AutoDexApprovalsPanel;
