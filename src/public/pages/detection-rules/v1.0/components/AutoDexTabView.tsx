import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSwitch,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import AutoDexActivityLog from './AutoDexActivityLog';
import { MOCK_AUTODEX_LOGS } from './autoDexMockData';

export interface AutoDexTabViewProps {
  onOpenAIAssistant: (prompt: string) => void;
}

const flexItemCard: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  alignSelf: 'stretch',
};

const MetricCard: React.FC<{
  accent: string;
  value: React.ReactNode;
  valueColor: string;
  title: string;
  sub: string;
  badge?: React.ReactNode;
  viewLabel: string;
  onView: () => void;
  onChat: () => void;
}> = ({ accent, value, valueColor, title, sub, badge, viewLabel, onView, onChat }) => (
  <EuiPanel
    hasBorder
    hasShadow={false}
    paddingSize="s"
    style={{
      borderRadius: 8,
      borderTop: `3px solid ${accent}`,
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <EuiFlexGroup gutterSize="xs" alignItems="flexStart" responsive={false} justifyContent="spaceBetween" wrap={false}>
      <EuiFlexItem grow={false}>
        <EuiText size="s" style={{ fontWeight: 600 }}>
          {title}
        </EuiText>
      </EuiFlexItem>
      {badge && <EuiFlexItem grow={false}>{badge}</EuiFlexItem>}
    </EuiFlexGroup>
    <div style={{ marginTop: 2 }}>
      <EuiTitle size="s">
        <span style={{ color: valueColor, lineHeight: 1.1, fontSize: 26, fontWeight: 600 }}>{value}</span>
      </EuiTitle>
    </div>
    <EuiText size="s" color="subdued" style={{ marginTop: 4, flex: 1, lineHeight: 1.35 }}>
      {sub}
    </EuiText>
    <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 'auto', paddingTop: 8 }}>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left" onClick={onView}>
          {viewLabel}
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }} onClick={onChat}>
          Add to chat
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
);

const TOKEN_WORKFLOWS: { label: string; value: string; color: string; widthPct: number }[] = [
  { label: 'FP tuning', value: '891k', color: '#7B61FF', widthPct: 78 },
  { label: 'Rule repair', value: '223k', color: '#0077CC', widthPct: 22 },
  { label: 'Discovery', value: '99k', color: '#017D73', widthPct: 12 },
  { label: 'Gap analysis', value: '27k', color: '#F5A700', widthPct: 5 },
];

const UsageTotalTokensCard: React.FC<{ onChat: () => void }> = ({ onChat }) => (
  <EuiPanel
    hasBorder
    hasShadow={false}
    paddingSize="s"
    style={{
      borderRadius: 8,
      borderTop: '3px solid #F5A700',
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <EuiFlexGroup gutterSize="s" alignItems="flexStart" responsive={true} style={{ flex: 1, minHeight: 0 }}>
      <EuiFlexItem grow={false} style={{ minWidth: 112 }}>
        <EuiText size="s" style={{ fontWeight: 600 }}>
          Total tokens
        </EuiText>
        <div style={{ marginTop: 2 }}>
          <EuiTitle size="s">
            <span style={{ color: '#F5A700', lineHeight: 1.1, fontSize: 26, fontWeight: 600 }}>1.24M</span>
          </EuiTitle>
        </div>
        <EuiText size="xs" color="subdued" style={{ marginTop: 2 }}>
          of 2M limit
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={true} style={{ minWidth: 160, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <EuiText
          size="xs"
          color="subdued"
          style={{ fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          By workflow
        </EuiText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {TOKEN_WORKFLOWS.map((w) => (
            <div key={w.label}>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem grow={true}>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: '#EDF0F5',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${w.widthPct}%`,
                        height: 5,
                        borderRadius: 3,
                        background: w.color,
                        maxWidth: '100%',
                      }}
                    />
                  </div>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ minWidth: 40 }}>
                  <EuiText size="xs" style={{ fontWeight: 500, fontSize: 11 }}>
                    {w.value}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiText size="xs" color="subdued" style={{ marginTop: 1, fontSize: 11, lineHeight: 1.2 }}>
                {w.label}
              </EuiText>
            </div>
          ))}
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
      <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }} onClick={onChat}>
        Add to chat
      </EuiButtonEmpty>
    </div>
  </EuiPanel>
);

const AutoDexTabView: React.FC<AutoDexTabViewProps> = ({ onOpenAIAssistant }) => {
  const [summarySection, setSummarySection] = useState<'summary' | 'usage'>('summary');
  const [activityFeedOn, setActivityFeedOn] = useState(true);

  const pendingApprovals = useMemo(
    () => MOCK_AUTODEX_LOGS.filter((l) => l.needsApproval).length,
    []
  );

  const now = new Date();
  const updatedStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, flex: 1 }}>
      <EuiButtonGroup
        legend="AutoDEX view"
        options={[
          { id: 'summary', label: 'Summary' },
          { id: 'usage', label: 'Usage' },
        ]}
        idSelected={summarySection}
        onChange={(id) => setSummarySection(id as 'summary' | 'usage')}
        buttonSize="s"
        color="primary"
      />

      {summarySection === 'summary' ? (
        <EuiFlexGroup gutterSize="s" responsive={true} alignItems="stretch">
          <EuiFlexItem grow={1} style={flexItemCard}>
            <MetricCard
              accent="#F5A700"
              value="5"
              valueColor="#F5A700"
              title="Approvals"
              sub="approvals needed."
              viewLabel="View approvals"
              onView={() => onOpenAIAssistant('List AutoDEX actions that need my approval')}
              onChat={() => onOpenAIAssistant('Summarise pending AutoDEX approvals')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1} style={flexItemCard}>
            <MetricCard
              accent="#0077CC"
              value="47"
              valueColor="#0077CC"
              title="Rules managed"
              sub="of 1200 enabled rules."
              badge={
                <EuiBadge color="success" iconType="sortUp">
                  +12% this week
                </EuiBadge>
              }
              viewLabel="View"
              onView={() => onOpenAIAssistant('Show AutoDEX-managed detection rules')}
              onChat={() => onOpenAIAssistant('Explain how AutoDEX is managing my rules')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1} style={flexItemCard}>
            <MetricCard
              accent="#017D73"
              value="72%"
              valueColor="#017D73"
              title="MITRE coverage"
              sub="3 rules added in the last 7 days."
              badge={
                <EuiBadge color="success" iconType="sortUp">
                  +12% this week
                </EuiBadge>
              }
              viewLabel="View logs"
              onView={() => onOpenAIAssistant('Show MITRE coverage changes from AutoDEX')}
              onChat={() => onOpenAIAssistant('How did AutoDEX improve MITRE coverage?')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1} style={flexItemCard}>
            <MetricCard
              accent="#F5A700"
              value="21/23 mins"
              valueColor="#F5A700"
              title="Gap filling"
              sub="Across 8 rules."
              badge={<EuiBadge color="warning">Filling in progress</EuiBadge>}
              viewLabel="View gaps"
              onView={() => onOpenAIAssistant('Show coverage gaps AutoDEX is filling')}
              onChat={() => onOpenAIAssistant('Explain gap filling progress')}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1} style={flexItemCard}>
            <MetricCard
              accent="#0077CC"
              value="6/8"
              valueColor="#0077CC"
              title="Rule updates"
              sub="2 more rules require approval."
              viewLabel="View approvals"
              onView={() => onOpenAIAssistant('Show Elastic rule updates pending approval')}
              onChat={() => onOpenAIAssistant('Summarise pending rule updates from AutoDEX')}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <EuiFlexGroup gutterSize="s" responsive={true} alignItems="stretch">
          <EuiFlexItem grow={1} style={flexItemCard}>
            <EuiPanel
              hasBorder
              hasShadow={false}
              paddingSize="s"
              style={{
                borderRadius: 8,
                borderTop: '3px solid #017D73',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <EuiFlexGroup gutterSize="xs" alignItems="flexStart" responsive={false} justifyContent="spaceBetween" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" style={{ fontWeight: 600 }}>
                    Actions this week
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="success" iconType="sortUp">
                    ↑ 12% this week
                  </EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
              <div style={{ marginTop: 2 }}>
                <EuiTitle size="s">
                  <span style={{ color: '#343741', lineHeight: 1.1, fontSize: 26, fontWeight: 600 }}>34</span>
                </EuiTitle>
              </div>
              <EuiText size="s" color="subdued" style={{ marginTop: 4, flex: 1, lineHeight: 1.35 }}>
                28 auto · 6 approved
              </EuiText>
              <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 'auto', paddingTop: 8 }}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left" onClick={() => onOpenAIAssistant('Show AutoDEX action logs for this week')}>
                    View logs
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }} onClick={() => onOpenAIAssistant('Summarise AutoDEX actions this week')}>
                    Add to chat
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem grow={1} style={flexItemCard}>
            <EuiPanel
              hasBorder
              hasShadow={false}
              paddingSize="s"
              style={{
                borderRadius: 8,
                borderTop: '3px solid #017D73',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <EuiFlexGroup gutterSize="xs" alignItems="flexStart" responsive={false} justifyContent="spaceBetween" wrap={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" style={{ fontWeight: 600 }}>
                    Approval rate
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color="success" iconType="sortUp">
                    ↑ 4% this week
                  </EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
              <div style={{ marginTop: 2 }}>
                <EuiTitle size="s">
                  <span style={{ color: '#343741', lineHeight: 1.1, fontSize: 26, fontWeight: 600 }}>91%</span>
                </EuiTitle>
              </div>
              <EuiText size="s" color="subdued" style={{ marginTop: 4, flex: 1, lineHeight: 1.35 }}>
                of proposals accepted
              </EuiText>
              <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginTop: 'auto', paddingTop: 8 }}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left" onClick={() => onOpenAIAssistant('Show AutoDEX proposal approvals')}>
                    View approvals
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }} onClick={() => onOpenAIAssistant('Explain AutoDEX approval rate trends')}>
                    Add to chat
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem grow={2} style={flexItemCard}>
            <UsageTotalTokensCard onChat={() => onOpenAIAssistant('Break down AutoDEX token usage by workflow')} />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}

      <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 8, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <EuiFlexGroup gutterSize="m" responsive={false} alignItems="center" style={{ marginBottom: 12 }}>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              Showing 1-{MOCK_AUTODEX_LOGS.length} of 55 AutoDEX activities
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              Updated {updatedStr}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Refresh activity">
              <EuiButtonIcon iconType="refresh" aria-label="Refresh activity" color="text" size="s" />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSwitch
              label="Live"
              checked={activityFeedOn}
              onChange={() => setActivityFeedOn(!activityFeedOn)}
              compressed
            />
          </EuiFlexItem>
          <EuiFlexItem grow={true} />
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">{pendingApprovals} pending approvals</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 200, paddingRight: 4 }}>
          {activityFeedOn ? (
            <AutoDexActivityLog onOpenAIAssistant={onOpenAIAssistant} requiresApproval />
          ) : (
            <EuiText size="s" color="subdued">
              Activity feed paused. Turn on Live to show AutoDEX activities.
            </EuiText>
          )}
        </div>
      </EuiPanel>
    </div>
  );
};

export default AutoDexTabView;
