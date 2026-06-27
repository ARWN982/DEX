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
    <div data-test-subj="autodex-approvalsRequiredPanel">
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
              const rulesAffected = getRulesAffected(log);

              return (
                <div
                  key={log.id}
                  style={{
                    background: 'white',
                    borderTop: index === 0 ? 'none' : '1px solid #E3E8F2',
                    padding: 12,
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
                          <EuiText size="xs" style={{ fontWeight: 600, color: 'var(--euiColorDarkShade)', letterSpacing: '0.02em' }}>
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
                            {log.isSuggestion ? 'Action required' : 'Approval needed'}
                          </span>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false} style={{ maxWidth: 340, minWidth: 0 }}>
                          <EuiText size="s" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.rule}</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">{formatTimestamp(log.timestamp)}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} justifyContent="flexEnd">
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
                                  {log.isSuggestion ? 'Actions' : 'Approval action'}
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
                                iconType="boxesVertical"
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
                    <div style={{ marginTop: 10, marginLeft: 28 }}>
                      {log.isSuggestion ? (
                        <>
                          {/* DIAGNOSIS */}
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{log.reasoning}</p>
                          </div>

                          {/* ACTIONS REQUIRED */}
                          {log.manualFixSteps && (
                            <div>
                              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Actions required</p>
                              <ol style={{ margin: 0, paddingLeft: 20 }}>
                                {log.manualFixSteps.map((step, idx) => (
                                  <li key={idx} style={{ fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px', marginBottom: 6 }}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </>
                      ) : log.fullReasoning ? (
                        <>
                          {/* DIAGNOSIS */}
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                            {log.fullReasoning.diagnosis.map((para, idx) => (
                              <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                            ))}
                          </div>

                          {/* DECISION RATIONALE */}
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Decision rationale</p>
                            {log.fullReasoning.decision.map((para, idx) => (
                              <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                            ))}
                          </div>

                          {/* CHANGES SUGGESTED */}
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Changes suggested</p>
                            <div style={{ border: '1px solid var(--euiBorderColor)', borderRadius: 4, overflow: 'hidden' }}>
                              {log.fullReasoning.changesMade.map((change, idx) => {
                                const isLast = idx === log.fullReasoning!.changesMade.length - 1;
                                const borderBottom = isLast ? 'none' : '1px solid #D3DAE6';
                                if (typeof change === 'string') {
                                  return (
                                    <div key={idx} style={{ fontFamily: 'monospace', fontSize: 12, background: '#E6F9F0', color: '#0B5E41', padding: '6px 12px', borderBottom }}>
                                      <span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#017D73' }}>+</span>{change}
                                    </div>
                                  );
                                }
                                return (
                                  <React.Fragment key={idx}>
                                    <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#FDF0EF', color: '#7C1B1B', padding: '6px 12px', borderBottom: '1px solid #D3DAE6' }}>
                                      <span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#BD271E' }}>-</span>{change.before}
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#E6F9F0', color: '#0B5E41', padding: '6px 12px', borderBottom }}>
                                      <span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#017D73' }}>+</span>{change.after}
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ background: 'var(--euiColorEmptyShade)', border: '1px solid var(--euiBorderColor)', borderRadius: 4, padding: '8px 12px' }}>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--euiTextColor)' }}>{log.reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: 4, paddingLeft: 24, paddingRight: 24 }}>
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
