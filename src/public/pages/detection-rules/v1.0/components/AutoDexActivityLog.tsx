import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSelectable,
  EuiPopoverTitle,
  EuiText,
} from '@elastic/eui';
import { MOCK_AUTODEX_LOGS } from './autoDexMockData';

type SelectableFilterOption = { label: string; checked?: 'on' };

export interface AutoDexActivityLogProps {
  onOpenAIAssistant: (prompt: string) => void;
  /** When true, show approval popovers on pending items (semi-auto mode). */
  requiresApproval?: boolean;
  /** External search value (optional); if omitted, internal state is used. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /**
   * When true, the parent supplies the search field; this component still renders
   * Type + Approval filters below the parent toolbar.
   */
  hideSearchRow?: boolean;
}

const AutoDexActivityLog: React.FC<AutoDexActivityLogProps> = ({
  onOpenAIAssistant,
  requiresApproval = true,
  searchValue: controlledSearch,
  onSearchChange,
  hideSearchRow = false,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const logSearch = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setLogSearch = onSearchChange ?? setInternalSearch;

  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [isApprovalFilterOpen, setIsApprovalFilterOpen] = useState(false);
  const [typeFilterOptions, setTypeFilterOptions] = useState<SelectableFilterOption[]>([
    { label: 'Fixed execution failure' },
    { label: 'Tuned false positives' },
    { label: 'Installed rule' },
    { label: 'Updated rule' },
  ]);
  const [approvalFilterOptions, setApprovalFilterOptions] = useState<SelectableFilterOption[]>([
    { label: 'Needs approval' },
    { label: 'No approval needed' },
  ]);

  const [approvalPopoverOpen, setApprovalPopoverOpen] = useState<Record<string, boolean>>({});
  const [approvalDecisions, setApprovalDecisions] = useState<Record<string, 'approved' | 'dismissed'>>({});
  const [fullReasoningLogId, setFullReasoningLogId] = useState<string | null>(null);

  const toggleApprovalPopover = (id: string) =>
    setApprovalPopoverOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const decide = (id: string, decision: 'approved' | 'dismissed') => {
    setApprovalDecisions((prev) => ({ ...prev, [id]: decision }));
    setApprovalPopoverOpen((prev) => ({ ...prev, [id]: false }));
  };

  const actionToTypeLabel = (action: string) => {
    if (action === 'Execution failure') return 'Fixed execution failure';
    if (action === 'Tuned false positives') return 'Tuned false positives';
    if (action === 'Installed rule') return 'Installed rule';
    if (action === 'Updated rule') return 'Updated rule';
    return action;
  };

  const filteredLogs = useMemo(() => {
    const activeTypes = typeFilterOptions.filter((o) => o.checked === 'on').map((o) => o.label);
    const wantNeedsApproval = approvalFilterOptions.find((o) => o.label === 'Needs approval')?.checked === 'on';
    const wantNoApproval = approvalFilterOptions.find((o) => o.label === 'No approval needed')?.checked === 'on';

    return MOCK_AUTODEX_LOGS.filter((log) => {
      const matchesSearch =
        !logSearch ||
        log.rule.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase());
      const typeLabel = actionToTypeLabel(log.action);
      const matchesType = activeTypes.length === 0 || activeTypes.includes(typeLabel);
      let matchesApproval = true;
      if (wantNeedsApproval && !wantNoApproval) matchesApproval = log.needsApproval;
      else if (!wantNeedsApproval && wantNoApproval) matchesApproval = !log.needsApproval;
      else if (wantNeedsApproval && wantNoApproval) matchesApproval = true;
      return matchesSearch && matchesType && matchesApproval;
    });
  }, [logSearch, typeFilterOptions, approvalFilterOptions]);

  const filterToolbar = (
    <EuiFlexGroup gutterSize="s" responsive={false} style={{ marginBottom: 12 }} alignItems="center">
      {!hideSearchRow && (
        <EuiFlexItem grow={true}>
          <EuiFieldSearch
            placeholder="Search"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            isClearable
            fullWidth
          />
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={hideSearchRow}>
        <EuiFilterGroup>
          <EuiPopover
            button={
              <EuiFilterButton
                iconType="arrowDown"
                onClick={() => setIsTypePopoverOpen(!isTypePopoverOpen)}
                isSelected={isTypePopoverOpen}
                numFilters={typeFilterOptions.length}
                hasActiveFilters={typeFilterOptions.some((o) => o.checked === 'on')}
                numActiveFilters={typeFilterOptions.filter((o) => o.checked === 'on').length}
              >
                Type
              </EuiFilterButton>
            }
            isOpen={isTypePopoverOpen}
            closePopover={() => setIsTypePopoverOpen(false)}
            panelPaddingSize="none"
          >
            <EuiSelectable
              searchable
              searchProps={{ placeholder: 'Filter list', compressed: true }}
              options={typeFilterOptions}
              onChange={(opts) => setTypeFilterOptions(opts)}
            >
              {(list, search) => (
                <div style={{ width: 260 }}>
                  <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
                  {list}
                </div>
              )}
            </EuiSelectable>
          </EuiPopover>
          <EuiPopover
            button={
              <EuiFilterButton
                iconType="arrowDown"
                onClick={() => setIsApprovalFilterOpen(!isApprovalFilterOpen)}
                isSelected={isApprovalFilterOpen}
                hasActiveFilters={approvalFilterOptions.some((o) => o.checked === 'on')}
                numActiveFilters={approvalFilterOptions.filter((o) => o.checked === 'on').length}
              >
                Approval
              </EuiFilterButton>
            }
            isOpen={isApprovalFilterOpen}
            closePopover={() => setIsApprovalFilterOpen(false)}
            panelPaddingSize="none"
          >
            <EuiSelectable options={approvalFilterOptions} onChange={(opts) => setApprovalFilterOptions(opts)}>
              {(list) => <div style={{ width: 220 }}>{list}</div>}
            </EuiSelectable>
          </EuiPopover>
        </EuiFilterGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const logList = (
    <>
      {filterToolbar}

      {filteredLogs.length === 0 ? (
        <EuiText textAlign="center" color="subdued">
          <p>No activities match your filters.</p>
        </EuiText>
      ) : (
        filteredLogs.map((log, i) => {
          const decision = approvalDecisions[log.id];
          const isApprovalOpen = !!approvalPopoverOpen[log.id];
          const pendingApproval = requiresApproval && log.needsApproval && !decision;
          return (
            <div key={log.id}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
                <EuiFlexItem grow={false}>
                  <EuiIcon
                    type={
                      pendingApproval
                        ? 'warning'
                        : decision === 'approved'
                          ? 'checkInCircleFilled'
                          : decision === 'dismissed'
                            ? 'minusInCircle'
                            : 'checkInCircleFilled'
                    }
                    color={
                      pendingApproval
                        ? 'warning'
                        : decision === 'approved'
                          ? 'success'
                          : decision === 'dismissed'
                            ? 'subdued'
                            : 'success'
                    }
                    size="s"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color={log.actionColor}>{log.action}</EuiBadge>
                </EuiFlexItem>
                <EuiFlexItem grow={true}>
                  <EuiText size="s" style={{ fontWeight: 700 }}>
                    {log.rule}
                  </EuiText>
                </EuiFlexItem>
                {log.needsApproval && (
                  <EuiFlexItem grow={false}>
                    <EuiBadge color="warning">Approvals needed</EuiBadge>
                  </EuiFlexItem>
                )}
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {log.timestamp}
                  </EuiText>
                </EuiFlexItem>
                {requiresApproval && log.needsApproval && (
                  <EuiFlexItem grow={false}>
                    {!decision ? (
                      <EuiPopover
                        isOpen={isApprovalOpen}
                        closePopover={() => setApprovalPopoverOpen((prev) => ({ ...prev, [log.id]: false }))}
                        button={
                          <EuiButtonEmpty
                            size="xs"
                            iconType="arrowDown"
                            iconSide="right"
                            color="primary"
                            onClick={() => toggleApprovalPopover(log.id)}
                            style={{
                              border: '1px solid #D3DAE6',
                              borderRadius: 4,
                              paddingLeft: 8,
                              paddingRight: 8,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Approval
                          </EuiButtonEmpty>
                        }
                        panelPaddingSize="none"
                        anchorPosition="downRight"
                      >
                        <div style={{ minWidth: 160 }}>
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 14,
                              color: '#007871',
                              fontWeight: 500,
                            }}
                            onClick={() => decide(log.id, 'approved')}
                          >
                            <EuiIcon type="checkInCircleFilled" color="success" size="s" />
                            Approve
                          </button>
                          <div style={{ borderTop: '1px solid #E3E8F2' }} />
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 14,
                              color: '#BD271E',
                              fontWeight: 500,
                            }}
                            onClick={() => decide(log.id, 'dismissed')}
                          >
                            <EuiIcon type="minusInCircle" color="danger" size="s" />
                            Dismiss
                          </button>
                        </div>
                      </EuiPopover>
                    ) : (
                      <EuiBadge
                        color={decision === 'approved' ? 'success' : 'default'}
                        iconType={decision === 'approved' ? 'checkInCircleFilled' : 'minusInCircle'}
                      >
                        {decision === 'approved' ? 'Approved' : 'Dismissed'}
                      </EuiBadge>
                    )}
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>

              <EuiPanel
                hasBorder
                hasShadow={false}
                paddingSize="m"
                style={{ borderRadius: 6, background: '#F7F9FF', marginBottom: 10 }}
              >
                <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 6 }}>
                  Reasoning summary
                </EuiText>
                <EuiText size="s" style={{ marginBottom: 10 }}>
                  {log.reasoning}
                </EuiText>
                <EuiButtonEmpty
                  size="xs"
                  iconType={fullReasoningLogId === log.id ? 'chevronSingleDown' : 'chevronSingleRight'}
                  color="primary"
                  flush="left"
                  onClick={() => setFullReasoningLogId(fullReasoningLogId === log.id ? null : log.id)}
                >
                  Full reasoning
                </EuiButtonEmpty>
                {fullReasoningLogId === log.id && log.fullReasoning && (
                  <div style={{ marginTop: 16 }}>
                    <EuiHorizontalRule margin="s" />
                    <EuiText
                      size="xs"
                      style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#69707D',
                        marginBottom: 8,
                      }}
                    >
                      Diagnosis
                    </EuiText>
                    {log.fullReasoning.diagnosis.map((para, idx) => (
                      <EuiText key={idx} size="s" style={{ marginBottom: 8, color: '#343741' }}>
                        <p>{para}</p>
                      </EuiText>
                    ))}
                    <EuiHorizontalRule margin="s" />
                    <EuiText
                      size="xs"
                      style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#69707D',
                        marginBottom: 8,
                      }}
                    >
                      Decision rationale
                    </EuiText>
                    {log.fullReasoning.decision.map((para, idx) => (
                      <EuiText key={idx} size="s" style={{ marginBottom: 8, color: '#343741' }}>
                        <p>{para}</p>
                      </EuiText>
                    ))}
                    <EuiHorizontalRule margin="s" />
                    <EuiText
                      size="xs"
                      style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#69707D',
                        marginBottom: 8,
                      }}
                    >
                      Changes made
                    </EuiText>
                    {log.fullReasoning.changesMade.map((change, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          marginBottom: 6,
                          background: '#F0F4FF',
                          borderLeft: '3px solid #0077CC',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: '#343741',
                        }}
                      >
                        {change}
                      </div>
                    ))}
                  </div>
                )}
              </EuiPanel>

              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="xs"
                    iconType="productAgent"
                    flush="left"
                    style={{ color: '#7B61FF' }}
                    onClick={() =>
                      onOpenAIAssistant(`Tell me more about the AutoDEX action: ${log.action} on rule "${log.rule}"`)
                    }
                  >
                    Add to chat
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>

              {i < filteredLogs.length - 1 && <EuiHorizontalRule margin="m" />}
            </div>
          );
        })
      )}
    </>
  );

  return <div>{logList}</div>;
};

export default AutoDexActivityLog;
