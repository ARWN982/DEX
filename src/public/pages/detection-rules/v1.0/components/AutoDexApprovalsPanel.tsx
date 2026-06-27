import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
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
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 24px', gap: 8 }}>
            {pagedItems.map((log, index) => {
              const isExpanded = expandedIds.has(log.id);
              const rulesAffected = getRulesAffected(log);

              return (
                <div
                  key={log.id}
                  onClick={() => toggleExpanded(log.id)}
                  style={{
                    background: 'white',
                    border: isExpanded ? '1.5px solid #1750BA' : '1px solid #E3E8F2',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    boxShadow: isExpanded ? '0 0 0 3px rgba(23,80,186,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  data-test-subj={`autodex-approvalItem-${log.id}`}
                >
                  {/* Collapsed: title + metadata */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--euiTitleColor)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.rule}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#98A2B3', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <EuiIcon type="clock" size="s" color="subdued" />{formatTimestamp(log.timestamp)}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--euiColorDarkShade)', letterSpacing: '0.04em', textTransform: 'uppercase', background: '#F6F9FC', padding: '2px 8px', borderRadius: 20, border: '1px solid #E3E8F2' }}>
                          {getCategoryLabel(log.action)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: log.isSuggestion ? '#FFF3D0' : '#FDDDD8', color: log.isSuggestion ? '#836500' : '#A71627' }}>
                          {log.isSuggestion ? 'Action required' : 'Approval needed'}
                        </span>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <EuiPopover
                        isOpen={openPopoverId === log.id}
                        closePopover={() => setOpenPopoverId(null)}
                        panelPaddingSize="s"
                        anchorPosition="downRight"
                        button={<EuiButtonIcon size="xs" iconType="boxesVertical" color="text" aria-label="More" onClick={() => setOpenPopoverId(openPopoverId === log.id ? null : log.id)} />}
                      >
                        <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                          <EuiListGroupItem iconType="productAgent" label="Add to chat" size="s" onClick={() => { setOpenPopoverId(null); onOpenAIAssistant(getApprovalChatPrompt(log)); }} />
                          <EuiListGroupItem iconType="folderClosed" label="Create a case" size="s" onClick={() => setOpenPopoverId(null)} />
                        </EuiListGroup>
                      </EuiPopover>
                    </div>
                  </div>

                  {isExpanded && (
                    <div onClick={e => e.stopPropagation()}>
                      <div style={{ height: 1, background: '#E3E8F2', margin: '12px 0' }} />
                      <div style={{ marginBottom: 12 }}>
                        {log.isSuggestion ? (
                          <>
                            <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--euiTextColor)', lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{log.reasoning}</p>
                            </div>
                            {log.manualFixSteps && (
                              <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '10px 12px' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#69707D' }}>Actions required</p>
                                <ol style={{ margin: 0, paddingLeft: 18 }}>{log.manualFixSteps.map((step: string, idx: number) => <li key={idx} style={{ fontSize: 12, color: 'var(--euiTextColor)', lineHeight: '18px', marginBottom: 4 }}>{step}</li>)}</ol>
                              </div>
                            )}
                          </>
                        ) : log.fullReasoning ? (
                          <>
                            <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                              {log.fullReasoning.diagnosis.slice(0, 2).map((para: string, idx: number) => <p key={idx} style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--euiTextColor)', lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{para}</p>)}
                            </div>
                            <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#69707D' }}>Decision rationale</p>
                              {log.fullReasoning.decision.slice(0, 2).map((para: string, idx: number) => <p key={idx} style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--euiTextColor)', lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{para}</p>)}
                            </div>
                            <div style={{ border: '1px solid #E3E8F2', borderRadius: 6, overflow: 'hidden' }}>
                              {log.fullReasoning.changesMade.map((change: any, idx: number) => {
                                const isLast = idx === log.fullReasoning!.changesMade.length - 1;
                                const bb = isLast ? 'none' : '1px solid #D3DAE6';
                                if (typeof change === 'string') {
                                  return <div key={idx} style={{ fontFamily: 'monospace', fontSize: 11, background: '#E6F9F0', color: '#0B5E41', padding: '5px 10px', borderBottom: bb }}><span style={{ marginRight: 8, fontWeight: 700, color: '#017D73' }}>+</span>{change}</div>;
                                }
                                return (
                                  <React.Fragment key={idx}>
                                    <div style={{ fontFamily: 'monospace', fontSize: 11, background: '#FDF0EF', color: '#7C1B1B', padding: '5px 10px', borderBottom: '1px solid #D3DAE6' }}><span style={{ marginRight: 8, fontWeight: 700, color: '#BD271E' }}>−</span>{change.before}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 11, background: '#E6F9F0', color: '#0B5E41', padding: '5px 10px', borderBottom: bb }}><span style={{ marginRight: 8, fontWeight: 700, color: '#017D73' }}>+</span>{change.after}</div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '10px 12px' }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--euiTextColor)', lineHeight: '18px' }}>{log.reasoning}</p>
                          </div>
                        )}
                      </div>

                      {/* Discard / Edit / Approve row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <button
                          onClick={() => { onDecide(log.id, 'dismissed'); }}
                          style={{ height: 28, padding: '0 12px', borderRadius: 20, border: '1px solid #CAD3E2', background: 'white', fontSize: 12, fontWeight: 500, color: '#516381', cursor: 'pointer' }}
                        >
                          Discard
                        </button>
                        <button
                          style={{ height: 28, padding: '0 12px', borderRadius: 20, border: '1px solid #CAD3E2', background: 'white', fontSize: 12, fontWeight: 500, color: '#516381', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { onDecide(log.id, 'approved'); }}
                          style={{ height: 28, padding: '0 14px', borderRadius: 20, border: 'none', background: '#00875A', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <EuiIcon type="check" size="s" color="white" /> Approve
                        </button>
                      </div>
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
