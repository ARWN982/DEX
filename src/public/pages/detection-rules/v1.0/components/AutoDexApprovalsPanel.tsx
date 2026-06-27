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
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{log.reasoning}</p>
                            {log.manualFixSteps && (
                              <>
                                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Actions required</p>
                                <ol style={{ margin: 0, paddingLeft: 20 }}>{log.manualFixSteps.map((step: string, idx: number) => <li key={idx} style={{ fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px', marginBottom: 6 }}>{step}</li>)}</ol>
                              </>
                            )}
                          </>
                        ) : log.fullReasoning ? (
                          <>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                            {log.fullReasoning.diagnosis.map((para: string, idx: number) => <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>)}
                            <p style={{ margin: '12px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Decision rationale</p>
                            {log.fullReasoning.decision.map((para: string, idx: number) => <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>)}
                          </>
                        ) : (
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{log.reasoning}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EuiPopover
                          isOpen={approvalPopoverId === log.id}
                          closePopover={() => setApprovalPopoverId(null)}
                          panelPaddingSize="s"
                          anchorPosition="downRight"
                          button={<EuiButtonEmpty size="s" iconType="arrowDown" iconSide="right" color="primary" flush="left" onClick={() => setApprovalPopoverId(approvalPopoverId === log.id ? null : log.id)}>{log.isSuggestion ? 'Actions' : 'Approval action'}</EuiButtonEmpty>}
                        >
                          <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                            <EuiListGroupItem iconType="checkInCircleFilled" label="Approve" size="s" onClick={() => { onDecide(log.id, 'approved'); setApprovalPopoverId(null); }} />
                            <EuiListGroupItem iconType="minusInCircle" label="Dismiss" size="s" onClick={() => { onDecide(log.id, 'dismissed'); setApprovalPopoverId(null); }} />
                          </EuiListGroup>
                        </EuiPopover>
                        <EuiText size="xs" color="subdued">{rulesAffected} rules affected</EuiText>
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
