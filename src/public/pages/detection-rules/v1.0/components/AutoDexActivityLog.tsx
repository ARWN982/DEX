import React, { useEffect, useMemo, useState } from 'react';
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
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiSelectable,
  EuiPopoverTitle,
  EuiTablePagination,
  EuiText,
} from '@elastic/eui';
import { MOCK_AUTODEX_LOGS } from './autoDexMockData';
import type { AutoDexDiffChange } from './autoDexMockData';

type SelectableFilterOption = { label: string; checked?: 'on' };

// ─── Group config ─────────────────────────────────────────────────────────────

const LOG_GROUP_CONFIG: Record<string, { description: string; color: string; bg: string }> = {
  'Execution failure':    { description: 'Rules that have failed executions and AutoDEX has a suggested fix for the issues', color: '#BD271E', bg: '#FBEAEA' },
  'Tuned false positives':{ description: 'High-volume false positive patterns identified and tuned by AutoDEX', color: '#F5A700', bg: '#FEF3E2' },
  'Installed rule':       { description: 'New detection rules installed by AutoDEX to close coverage gaps', color: '#017D73', bg: '#E6F6F0' },
  'Updated rule':         { description: 'Elastic Security Labs rule updates applied by AutoDEX', color: '#0077CC', bg: '#E6F1FA' },
  'Rule updates':         { description: 'Pending rule version updates from Elastic Security Labs requiring analyst sign-off', color: '#0077CC', bg: '#E6F1FA' },
};

// ─── TopGroupAccordion — outer two-level grouping ─────────────────────────────

const TopGroupAccordion: React.FC<{
  title: string;
  count: number;
  countLabel: string;
  badgeColor?: 'warning' | 'primary' | 'success' | 'hollow';
  badgeIcon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, countLabel, badgeColor = 'primary', badgeIcon, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <EuiPanel
      hasBorder
      hasShadow={false}
      paddingSize="none"
      style={{ borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px',
          background: isOpen ? '#F5F7FA' : '#FAFBFD',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: isOpen ? '1px solid #D3DAE6' : 'none',
        }}
      >
        <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="subdued" style={{ flexShrink: 0 }} />
        <EuiText size="s" style={{ fontWeight: 700 }}>{title}</EuiText>
        <EuiBadge color={badgeColor} iconType={badgeIcon}>{count} {countLabel}</EuiBadge>
        <div style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <EuiButtonEmpty
            size="xs"
            iconType="arrowDown"
            iconSide="right"
            color="text"
            style={{ border: '1px solid var(--euiBorderColor)', borderRadius: 4, paddingLeft: 8, paddingRight: 4, height: 28 }}
          >
            Take action
          </EuiButtonEmpty>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '8px' }}>
          {children}
        </div>
      )}
    </EuiPanel>
  );
};

// ─── LogGroupCard — card-style accordion matching the screenshot ──────────────

const LogGroupCard: React.FC<{
  actionType: string;
  pendingCount: number;
  taskCount: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ actionType, pendingCount, taskCount, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cfg = LOG_GROUP_CONFIG[actionType] ?? { description: actionType, color: '#69707D', bg: '#F5F7FA' };

  return (
    <EuiPanel
      hasBorder
      hasShadow={false}
      paddingSize="none"
      style={{
        borderRadius: 8, marginBottom: 10, overflow: 'hidden',
        ...(pendingCount > 0 ? { borderLeft: '3px solid #F5A700' } : {}),
      }}
    >
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: isOpen ? '#FAFBFD' : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: isOpen ? '1px solid #EEF0F3' : 'none',
        }}
      >
        <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="subdued" style={{ flexShrink: 0 }} />
        <EuiBadge color="hollow" style={{ flexShrink: 0 }}>{actionType}</EuiBadge>
        {/* Description — shown inline when collapsed, below header when expanded */}
        {!isOpen && (
          <EuiText
            size="xs"
            color="subdued"
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {cfg.description}
          </EuiText>
        )}
        {/* Right-side meta */}
        <div
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {isOpen && (
            <EuiText size="xs" color="subdued">
              Tasks:&nbsp;<strong>{taskCount}</strong>
            </EuiText>
          )}
          <EuiButtonEmpty
            size="xs"
            iconType="arrowDown"
            iconSide="right"
            color="text"
            style={{ border: '1px solid var(--euiBorderColor)', borderRadius: 4, paddingLeft: 8, paddingRight: 4, height: 28 }}
          >
            Take action
          </EuiButtonEmpty>
        </div>
      </button>

      {/* Description line in expanded state */}
      {isOpen && (
        <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid #EEF0F3' }}>
          <EuiText size="xs" color="subdued">{cfg.description}</EuiText>
        </div>
      )}

      {/* Items */}
      {isOpen && <div>{children}</div>}
    </EuiPanel>
  );
};

// ─── Interface ────────────────────────────────────────────────────────────────

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
  /**
   * When set, applies an additional mandatory filter on top of internal filters.
   * 'pending-approvals' → only logs with needsApproval === true
   * 'rule-update-approvals' → only Updated rule logs that need approval
   */
  lockedFilter?: 'pending-approvals' | 'rule-update-approvals';
  /** When true, groups items by action type using the card-style accordion. */
  grouped?: boolean;
  /** When true, only shows items that have needsApproval === true (flat mode only). */
  pendingOnly?: boolean;
  /** When true, only shows completed / auto-resolved items (excludes pending approvals). */
  completedOnly?: boolean;
  /** When true, renders entries as completed activity log cards. */
  activityMode?: boolean;
  /** Approval decisions from the approvals panel — approved items appear in completed log. */
  approvalDecisions?: Record<string, 'approved' | 'dismissed'>;
  /** Colour of the left border on reasoning summary panels. Defaults to grey (#D3DAE6). */
  reasoningBorderColor?: string;
  /** When true, suppresses the internal search + filter toolbar entirely. */
  hideToolbar?: boolean;
  /** When provided, overrides the internal type filter with these active type labels. */
  activeTypeLabels?: string[];
}

const AutoDexActivityLog: React.FC<AutoDexActivityLogProps> = ({
  onOpenAIAssistant,
  requiresApproval = true,
  searchValue: controlledSearch,
  onSearchChange,
  hideSearchRow = false,
  lockedFilter,
  grouped = false,
  pendingOnly = false,
  completedOnly = false,
  activityMode = false,
  approvalDecisions = {},
  reasoningBorderColor = '#D3DAE6',
  hideToolbar = false,
  activeTypeLabels,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const logSearch = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setLogSearch = onSearchChange ?? setInternalSearch;

  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [typeFilterOptions, setTypeFilterOptions] = useState<SelectableFilterOption[]>([
    { label: 'Fixed execution failure' },
    { label: 'Tuned false positives' },
    { label: 'Installed rule' },
    { label: 'Updated rule' },
  ]);

  const [fullReasoningLogId, setFullReasoningLogId] = useState<string | null>(null);

  const PAGE_SIZE_OPTIONS = [5, 10, 25];
  const [pageSize, setPageSize] = useState(5);
  const [pageIndex, setPageIndex] = useState(0);

  // When the parent activates a locked filter, programmatically select the type filter chips.
  useEffect(() => {
    if (lockedFilter === 'rule-update-approvals') {
      setTypeFilterOptions([
        { label: 'Fixed execution failure' },
        { label: 'Tuned false positives' },
        { label: 'Installed rule' },
        { label: 'Updated rule', checked: 'on' },
      ]);
    }
  }, [lockedFilter]);

  // Reset to page 0 whenever the filtered set or page size changes.
  useEffect(() => {
    setPageIndex(0);
  }, [logSearch, typeFilterOptions, activeTypeLabels, approvalDecisions, pageSize, completedOnly, pendingOnly]);

  const isPendingItem = (log: (typeof MOCK_AUTODEX_LOGS)[0]) =>
    (log.needsApproval || log.isSuggestion) && !approvalDecisions[log.id];

  const actionToTypeLabel = (action: string) => {
    if (action === 'Execution failure') return 'Fixed execution failure';
    if (action === 'Tuned false positives') return 'Tuned false positives';
    if (action === 'Installed rule') return 'Installed rule';
    if (action === 'Updated rule') return 'Updated rule';
    return action;
  };

  const filteredLogs = useMemo(() => {
    const activeTypes = activeTypeLabels !== undefined
      ? activeTypeLabels
      : typeFilterOptions.filter((o) => o.checked === 'on').map((o) => o.label);

    return MOCK_AUTODEX_LOGS.filter((log) => {
      const matchesSearch =
        !logSearch ||
        log.rule.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase());
      const typeLabel = actionToTypeLabel(log.action);
      const matchesType = activeTypes.length === 0 || activeTypes.includes(typeLabel);
      return matchesSearch && matchesType;
    });
  }, [logSearch, typeFilterOptions, activeTypeLabels]);

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
        </EuiFilterGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const ACTION_PANEL_BUTTON_MIN_WIDTH = 176;

  /** Renders one log entry. Activity mode uses the flat approvals-panel row style; otherwise uses the card style. */
  const renderLog = (log: (typeof filteredLogs)[0], i: number, logsArr: typeof filteredLogs, padded = false, forceActivityMode = false) => {
    const decision = approvalDecisions[log.id];
    const inActivityMode = forceActivityMode || activityMode;
    const isExpanded = fullReasoningLogId === log.id;

    // ── Activity mode: flat row matching the approvals panel style ──────────
    if (inActivityMode) {
      const isFirstRow = i === 0;
      const isLastRow = i === logsArr.length - 1;

      const badge = decision === 'dismissed'
        ? 'dismissed'
        : decision === 'approved'
          ? 'approved'
          : log.completedBadge ?? (log.needsApproval ? 'approved' : 'auto');

      const statusBadge = badge === 'dismissed'
        ? <EuiBadge color="default" iconType="minusInCircle">Dismissed</EuiBadge>
        : badge === 'suggestion-resolved'
          ? <EuiBadge color="success" iconType="checkInCircleFilled">Suggestion resolved</EuiBadge>
          : badge === 'approved'
            ? <EuiBadge color="success" iconType="checkInCircleFilled">Approved</EuiBadge>
            : <EuiBadge color="primary" iconType="checkInCircleFilled">Auto</EuiBadge>;

      return (
        <div
          key={log.id}
          style={{
            background: 'var(--euiColorEmptyShade)',
            border: '1px solid var(--euiBorderColor)',
            padding: 12,
            marginBottom: i < logsArr.length - 1 ? -1 : 0,
            borderRadius: isFirstRow && isLastRow ? 6 : isFirstRow ? '6px 6px 0 0' : isLastRow ? '0 0 6px 6px' : undefined,
          }}
        >
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="none">
            <EuiFlexItem>
              <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    size="s"
                    color="text"
                    onClick={() => setFullReasoningLogId(isExpanded ? null : log.id)}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ width: 150 }}>
                  <EuiText size="xs" style={{ fontWeight: 600, color: 'var(--euiColorDarkShade)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {log.action}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>{statusBadge}</EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" style={{ fontWeight: 600 }}>{log.rule}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" color="subdued">{log.timestamp.replace(', 2026', '')}</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <div style={{ width: ACTION_PANEL_BUTTON_MIN_WIDTH, display: 'flex', justifyContent: 'flex-end' }}>
                    <EuiButtonEmpty
                      size="s"
                      iconType="arrowDown"
                      iconSide="right"
                      color="primary"
                      flush="right"
                      onClick={() => onOpenAIAssistant(`Tell me about the AutoDEX action: ${log.action} on rule "${log.rule}"`)}
                    >
                      Actions
                    </EuiButtonEmpty>
                  </div>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    size="s"
                    iconType="boxesHorizontal"
                    color="primary"
                    aria-label="More actions"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Expanded reasoning */}
          {isExpanded && (
            <div style={{ marginTop: 10, marginLeft: 28, background: 'white', border: '1px solid #CAD3E2', borderRadius: 4, padding: '12px 16px' }}>
              {log.fullReasoning ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                    {log.fullReasoning.diagnosis.map((para, idx) => (
                      <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Decision rationale</p>
                    {log.fullReasoning.decision.map((para, idx) => (
                      <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                    ))}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Changes made</p>
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
                <p style={{ margin: 0, fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{log.reasoning}</p>
              )}
            </div>
          )}

        </div>
      );
    }

    // ── Default card style (pending approvals / suggestions in the old view) ──
    const pendingApproval = requiresApproval && log.needsApproval && !decision;
    const isSuggestion = !!log.isSuggestion && !log.needsApproval;
    const leftBorderColor = pendingApproval ? '#fcd883' : isSuggestion ? '#ffcda1' : '#00BFB3';
    const isReasoningOpen = isExpanded;

    return (
      <div
        key={log.id}
        style={{
          background: 'white',
          borderTop: i === 0 ? 'none' : '1px solid #E3E8F2',
          paddingBottom: isReasoningOpen ? 12 : 0,
        }}
      >
        {/* Row header — identical structure to ApprovalsPanel */}
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="none" style={{ padding: '8px 12px' }}>
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType={isReasoningOpen ? 'arrowDown' : 'arrowRight'}
                  aria-label={isReasoningOpen ? 'Collapse' : 'Expand'}
                  size="s"
                  color="text"
                  onClick={() => setFullReasoningLogId(isReasoningOpen ? null : log.id)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ width: 150 }}>
                <EuiText size="xs" style={{ fontWeight: 600, color: 'var(--euiColorDarkShade)', letterSpacing: '0.02em' }}>
                  {log.action.toUpperCase()}
                </EuiText>
              </EuiFlexItem>
              {decision && (
                <EuiFlexItem grow={false}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: decision === 'approved' ? '#D4EFDF' : '#F6F9FC', color: decision === 'approved' ? '#09724D' : '#516381' }}>
                    {decision === 'approved' ? 'Approved' : 'Dismissed'}
                  </span>
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 600 }}>{log.rule}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">{log.timestamp.replace(', 2026', '')}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="s" iconType="popout" iconSide="left" color="primary" flush="right"
                  onClick={() => onOpenAIAssistant(`Tell me more about the AutoDEX action: ${log.action} on rule "${log.rule}"`)}>
                  Take action
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon size="xs" iconType="boxesVertical" color="primary" aria-label="More options" />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Expanded reasoning */}
        {isReasoningOpen && (
          <div style={{ margin: '0 12px 0', background: 'white', border: '1px solid #CAD3E2', borderRadius: 4, padding: '12px 16px' }}>
            {log.fullReasoning ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Diagnosis</p>
                  {log.fullReasoning.diagnosis.map((para, idx) => (
                    <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Decision rationale</p>
                  {log.fullReasoning.decision.map((para, idx) => (
                    <p key={idx} style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--euiTextColor)', lineHeight: '20px' }}>{para}</p>
                  ))}
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#69707D' }}>Changes made</p>
                  <div style={{ border: '1px solid #CAD3E2', borderRadius: 4, overflow: 'hidden' }}>
                    {log.fullReasoning.changesMade.map((change, idx) => {
                      const isLast = idx === log.fullReasoning!.changesMade.length - 1;
                      const borderBottom = isLast ? 'none' : '1px solid #D3DAE6';
                      if (typeof change === 'string') {
                        return <div key={idx} style={{ fontFamily: 'monospace', fontSize: 12, background: '#E6F9F0', color: '#0B5E41', padding: '6px 12px', borderBottom }}><span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#017D73' }}>+</span>{change}</div>;
                      }
                      return (
                        <React.Fragment key={idx}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#FDF0EF', color: '#7C1B1B', padding: '6px 12px', borderBottom: '1px solid #D3DAE6' }}><span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#BD271E' }}>-</span>{change.before}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#E6F9F0', color: '#0B5E41', padding: '6px 12px', borderBottom }}><span style={{ userSelect: 'none', marginRight: 10, fontWeight: 700, color: '#017D73' }}>+</span>{change.after}</div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <EuiText size="s" style={{ color: 'var(--euiTextColor)', lineHeight: '24px' }}>{log.reasoning}</EuiText>
            )}
          </div>
        )}
      </div>
    );
  };

  const toolbar = hideToolbar ? null : filterToolbar;

  // ── Grouped render ──────────────────────────────────────────────────────────
  if (grouped) {
    const ORDER = ['Execution failure', 'Tuned false positives', 'Installed rule', 'Updated rule', 'Rule updates'];

    // Approvals needed: action-type groups containing only pending items
    const pendingGroups = ORDER.map((action) => ({
      action,
      logs: filteredLogs.filter((l) => l.action === action && l.needsApproval && !approvalDecisions[l.id]),
    })).filter((g) => g.logs.length > 0);
    const totalPending = pendingGroups.reduce((sum, g) => sum + g.logs.length, 0);

    // Activity logs: all action-type groups across all logs
    const activityGroups = ORDER.map((action) => ({
      action,
      logs: filteredLogs.filter((l) => l.action === action),
    })).filter((g) => g.logs.length > 0);
    const totalActivity = filteredLogs.length;

    return (
      <div>
        {toolbar}
        {filteredLogs.length === 0 ? (
          <EuiText textAlign="center" color="subdued">
            <p>No activities match your filters.</p>
          </EuiText>
        ) : (
          <>
            {totalPending > 0 && (
              <TopGroupAccordion
                title="Approvals needed"
                count={totalPending}
                countLabel="approvals needed"
                badgeColor="warning"
                badgeIcon="warningFilled"
                defaultOpen
              >
                {pendingGroups.map((group) => (
                  <LogGroupCard
                    key={group.action}
                    actionType={group.action}
                    pendingCount={group.logs.length}
                    taskCount={group.logs.length}
                    defaultOpen={false}
                  >
                    {group.logs.map((log, i) => renderLog(log, i, group.logs, true))}
                  </LogGroupCard>
                ))}
              </TopGroupAccordion>
            )}

            <TopGroupAccordion
              title="Activity logs"
              count={totalActivity}
              countLabel="activities"
              badgeColor="success"
              defaultOpen={totalPending === 0}
            >
              {activityGroups.map((group) => (
                <LogGroupCard
                  key={group.action}
                  actionType={group.action}
                  pendingCount={0}
                  taskCount={group.logs.length}
                  defaultOpen={false}
                >
                  {group.logs.map((log, i) => renderLog(log, i, group.logs, true, true))}
                </LogGroupCard>
              ))}
            </TopGroupAccordion>
          </>
        )}
      </div>
    );
  }

  // ── Flat render (default) ───────────────────────────────────────────────────
  const displayLogs = pendingOnly
    ? [...filteredLogs.filter((l) => isPendingItem(l))]
        .sort((a, b) => (a.isSuggestion ? 1 : 0) - (b.isSuggestion ? 1 : 0))
    : completedOnly
      ? filteredLogs.filter((l) => !isPendingItem(l))
      : filteredLogs;

  const pageCount = Math.max(1, Math.ceil(displayLogs.length / pageSize));
  const pagedLogs = displayLogs.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  return (
    <div>
      {toolbar && <div style={{ padding: '0 24px 12px' }}>{toolbar}</div>}
      {displayLogs.length === 0 ? (
        <EuiText textAlign="center" color="subdued">
          <p>No activities match your filters.</p>
        </EuiText>
      ) : (
        <>
          {pagedLogs.map((log, i) => renderLog(log, i, pagedLogs, false, activityMode))}
          <div style={{ marginTop: 12, padding: '0 24px' }}>
            <EuiTablePagination
              activePage={pageIndex}
              pageCount={pageCount}
              onChangePage={setPageIndex}
              itemsPerPage={pageSize}
              itemsPerPageOptions={PAGE_SIZE_OPTIONS}
              onChangeItemsPerPage={(size) => setPageSize(size)}
              showPerPageOptions
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AutoDexActivityLog;
