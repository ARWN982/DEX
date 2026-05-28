import React from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiText,
} from '@elastic/eui';

export interface AgentActionItem {
  id: string;
  pillar: string;
  severity: 'critical' | 'warning';
  title: string;
  rulesAffected: number;
  timestamp: string;
}

export interface AgentPillarItem {
  id: string;
  label: string;
  severity: 'Critical' | 'Warning' | 'Healthy';
  summary: string;
}

export interface SiemReadinessAgentContext {
  criticalCount: number;
  warningCount: number;
  actions: AgentActionItem[];
  pillars: AgentPillarItem[];
}

const severityPill = (severity: 'critical' | 'warning' | 'Critical' | 'Warning' | 'Healthy') => {
  const isCritical = severity === 'critical' || severity === 'Critical';
  const isWarning = severity === 'warning' || severity === 'Warning';
  return {
    background: isCritical ? '#FDDDD8' : isWarning ? '#FFF3D0' : '#E8F5E9',
    color: isCritical ? '#A71627' : isWarning ? '#836500' : '#017D73',
    label: isCritical ? 'Critical' : isWarning ? 'Warning' : 'Healthy',
  };
};

interface SiemReadinessAgentCardProps {
  context: SiemReadinessAgentContext;
  onViewData?: (pillarId: string) => void;
}

export const SiemReadinessAgentCard: React.FC<SiemReadinessAgentCardProps> = ({ context, onViewData }) => {
  const { criticalCount, warningCount, actions, pillars } = context;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s" style={{ fontWeight: 600, color: '#1D2A3E' }}>SIEM readiness status</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>

      <div style={{
        background: '#FFF3F1',
        border: '1px solid #FDDDD8',
        borderRadius: 6,
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <EuiIcon type="warning" size="s" color="danger" />
        <EuiText size="xs" style={{ color: '#BD271E', fontWeight: 500 }}>
          You have {criticalCount} critical issue{criticalCount !== 1 ? 's' : ''} and {warningCount} in warning state
        </EuiText>
      </div>

      <div style={{
        background: '#F6F9FC',
        border: '1px solid #E3E8F2',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        {actions.map((action, index) => {
          const pill = severityPill(action.severity);
          return (
            <div
              key={action.id}
              style={{
                background: '#fff',
                borderTop: index > 0 ? '1px solid #CAD3E2' : undefined,
                padding: '8px 10px',
              }}
            >
              <EuiFlexGroup alignItems="flexStart" gutterSize="xs" responsive={false}>
                <EuiFlexItem grow={false} style={{ paddingTop: 2 }}>
                  <EuiIcon type="arrowRight" size="s" color="subdued" />
                </EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 0 }}>
                  <EuiFlexGroup alignItems="center" gutterSize="xs" wrap responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" style={{ fontWeight: 600, color: '#516381', letterSpacing: '0.02em' }}>
                        {action.pillar.toUpperCase()}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 18,
                        padding: '0 6px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: pill.background,
                        color: pill.color,
                        textTransform: 'uppercase',
                      }}>
                        {pill.label}
                      </span>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiText size="xs" style={{ fontWeight: 600, color: '#111C2C', marginTop: 4, lineHeight: '16px' }}>
                    {action.title}
                  </EuiText>
                  <EuiText size="xs" color="subdued" style={{ marginTop: 2 }}>{action.timestamp}</EuiText>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      height: 20,
                      padding: '0 8px',
                      borderRadius: 20,
                      background: '#fff',
                      border: '1px solid #CAD3E2',
                      fontSize: 11,
                      color: '#07101F',
                    }}>
                      <EuiIcon type="radar" size="s" />
                      {action.rulesAffected} rules affected
                    </span>
                  </div>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          );
        })}
      </div>

      <div>
        <EuiText size="xs" style={{ fontWeight: 600, color: '#1D2A3E', marginBottom: 8 }}>Health status</EuiText>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pillars.map((pillar) => {
            const pill = severityPill(pillar.severity);
            return (
              <div key={pillar.id} style={{
                borderBottom: '1px solid #E3E8F2',
                paddingBottom: 10,
              }}>
                <EuiFlexGroup alignItems="flexStart" justifyContent="spaceBetween" responsive={false} gutterSize="s">
                  <EuiFlexItem style={{ minWidth: 0 }}>
                    <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false} wrap>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" style={{ fontWeight: 700 }}>{pillar.label}</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 18,
                          padding: '0 6px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: pill.background,
                          color: pill.color,
                        }}>
                          {pillar.severity}
                        </span>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiText size="xs" color="subdued" style={{ marginTop: 4, lineHeight: '16px' }}>
                      {pillar.summary}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiLink
                      onClick={() => onViewData?.(pillar.id)}
                      style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      View data
                    </EuiLink>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <EuiText size="xs" style={{ fontWeight: 600, color: '#1D2A3E', marginBottom: 6 }}>Next steps you could take:</EuiText>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: '18px', color: '#1D2A3E' }}>
          <li>Resolve data continuity issues such as silent streams, volume drops, and retention gaps.</li>
          <li>Install missing integrations and enable detection rules for integrations missing rules.</li>
          <li>Review ECS field compatibility and rule field issues flagged under Detection health.</li>
        </ul>
        <EuiText size="xs" style={{ marginTop: 10, lineHeight: '18px', color: '#1D2A3E' }}>
          I can help generate a query or dashboard to dig deeper if you&apos;d like.
        </EuiText>
      </div>

      <EuiFlexGroup gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType="copy" aria-label="Copy response" size="s" color="text" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType="refresh" aria-label="Regenerate response" size="s" color="text" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
