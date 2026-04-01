import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTabs,
  EuiTab,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiCallOut,
  EuiSwitch,
  EuiBadge,
  EuiHealth,
  EuiIcon,
  EuiLink,
  EuiCodeBlock,
  EuiHorizontalRule,
  EuiAccordion,
  EuiStat,
  EuiBasicTable,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

interface DetectionRule {
  id: string;
  name: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  platform?: string;
  ruleType?: string;
  tags?: string[];
  mitreTactics?: string[];
  mitreTechniques?: Array<{ id: string; name: string }>;
  lastRun: string;
  lastResponse: 'Failed' | 'Succeeded';
  lastUpdated: string;
  notify: boolean;
  enabled: boolean;
}

// Simple sparkline SVG
const Sparkline: React.FC<{ color: string; up?: boolean }> = ({ color, up = true }) => (
  <svg width="80" height="32" viewBox="0 0 80 32">
    <polyline
      points={up
        ? '0,28 10,22 20,18 30,20 40,12 50,8 60,14 70,6 80,10'
        : '0,10 10,16 20,14 30,20 40,18 50,24 60,20 70,26 80,22'}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Simple bar chart SVG for execution breakdown
const BarChart: React.FC = () => {
  const bars = [
    { s: 30, w: 2, f: 5 },
    { s: 28, w: 0, f: 3 },
    { s: 35, w: 4, f: 0 },
    { s: 25, w: 6, f: 8 },
    { s: 32, w: 3, f: 2 },
    { s: 38, w: 0, f: 0 },
    { s: 22, w: 5, f: 10 },
    { s: 30, w: 2, f: 4 },
    { s: 34, w: 1, f: 1 },
    { s: 27, w: 8, f: 6 },
  ];
  const max = 50;
  const barW = 24;
  const gap = 8;
  const h = 120;

  return (
    <svg width={(barW + gap) * bars.length} height={h + 20}>
      {bars.map((bar, i) => {
        const x = i * (barW + gap);
        const sh = (bar.s / max) * h;
        const wh = (bar.w / max) * h;
        const fh = (bar.f / max) * h;
        return (
          <g key={i}>
            <rect x={x} y={h - sh} width={barW} height={sh} fill="#54b399" rx={2} />
            <rect x={x} y={h - sh - wh} width={barW} height={wh} fill="#d6bf57" rx={2} />
            <rect x={x} y={h - sh - wh - fh} width={barW} height={fh} fill="#e7664c" rx={2} />
          </g>
        );
      })}
    </svg>
  );
};

// Multi-line chart for alerts
const AlertsChart: React.FC = () => (
  <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
    <polyline points="0,60 40,50 80,40 100,45 140,30 180,35 220,20 260,25 300,15" fill="none" stroke="#54b399" strokeWidth="2" />
    <polyline points="0,70 40,65 80,60 100,55 140,50 180,45 220,55 260,40 300,45" fill="none" stroke="#d6bf57" strokeWidth="2" />
    <polyline points="0,75 40,72 80,70 100,68 140,65 180,70 220,60 260,65 300,62" fill="none" stroke="#e7664c" strokeWidth="2" />
  </svg>
);

const RuleDetailsPage: React.FC = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'executions' | 'history'>('overview');
  const [isEnabled, setIsEnabled] = useState(true);
  const [executionPageIndex, setExecutionPageIndex] = useState(0);
  const [executionPageSize, setExecutionPageSize] = useState(10);
  const [gapFillPageIndex, setGapFillPageIndex] = useState(0);
  const [gapFillPageSize, setGapFillPageSize] = useState(10);
  const [showSourceEventRange, setShowSourceEventRange] = useState(true);
  const [showMetricsColumns, setShowMetricsColumns] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  const rule = parsedRulesData.find((r: any) => r.id === ruleId) as DetectionRule | undefined;

  if (!rule) {
    return (
      <>
        <SecurityHeader onMenuClick={() => {}} />
        <SecuritySideNav />
        <div style={{ marginTop: 48, marginLeft: 80, padding: 24 }}>
          <EuiCallOut title="Rule not found" color="danger" iconType="alert">
            <p>The requested rule could not be found.</p>
            <EuiSpacer size="s" />
            <EuiButton onClick={() => navigate('/detection-rules')}>Back to Rules</EuiButton>
          </EuiCallOut>
        </div>
      </>
    );
  }

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'danger' => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high':
      case 'critical': return 'danger';
      default: return 'success';
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'executions' as const, label: 'Executions' },
    { id: 'history' as const, label: 'History' },
  ];

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{
        backgroundColor: '#F6F9FC',
        height: 'calc(100vh - 56px)',
        marginTop: 48,
        marginLeft: 80,
        padding: 8,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ flex: 1, minHeight: 0 }}>
          {/* Secondary Nav */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <RulesSecondaryNav selectedSection="installed" onSectionChange={() => {}} />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Panel */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', overflowY: 'auto' }}>
              <div style={{ padding: '16px 24px' }}>

                {/* Back button */}
                <EuiButtonEmpty iconType="arrowLeft" size="s" onClick={() => navigate('/detection-rules')} style={{ marginBottom: 8 }}>
                  Rules
                </EuiButtonEmpty>

                {/* Rule header */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}>
                  <EuiFlexItem>
                    <EuiTitle size="l">
                      <h1>{rule.name}</h1>
                    </EuiTitle>
                    <EuiSpacer size="xs" />
                    <EuiFlexGroup gutterSize="l" alignItems="center" responsive={false} wrap>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          <strong>Created by:</strong> Elastic on Mar 16, 2024 @ 10:32:56
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          <strong>Updated by:</strong> John Doe on Jan 13, 2026 @ 14:23:24
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          <strong>Elastic version:</strong> 208
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          <strong>Revision:</strong> 29
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="xs" />
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued"><strong>Last response:</strong></EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiHealth color={rule.lastResponse === 'Succeeded' ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                          {rule.lastResponse === 'Succeeded' ? 'Succeeded' : 'failed'} at Jan 14, 2026 @ 19:13:10
                        </EuiHealth>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="refresh" aria-label="Refresh" size="xs" color="text" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="bell" aria-label="Notifications" size="xs" color="text" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>

                  {/* Actions */}
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiSwitch label="Enable" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton iconType="pencil" size="s">Edit rule</EuiButton>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="s" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                {/* Tabs */}
                <EuiTabs>
                  {tabs.map((tab) => (
                    <EuiTab key={tab.id} isSelected={selectedTab === tab.id} onClick={() => setSelectedTab(tab.id)}>
                      {tab.label}
                    </EuiTab>
                  ))}
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* Overview tab */}
                {selectedTab === 'overview' && (
                  <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false}>

                    {/* LEFT: main content */}
                    <EuiFlexItem style={{ paddingRight: 24, maxWidth: '50%' }}>

                      {/* Alert activity + Alerts charts row */}
                      <EuiFlexGroup gutterSize="m" responsive={false}>
                        {/* Alert activity */}
                        <EuiFlexItem grow={false} style={{ minWidth: 220 }}>
                          <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                            <EuiText size="s" style={{ fontWeight: 700 }}>Alert activity</EuiText>
                            <EuiText size="xs" color="subdued">Last 30 days</EuiText>
                            <EuiSpacer size="m" />
                            <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
                              <EuiFlexItem>
                                <EuiText style={{ fontSize: 28, fontWeight: 700, color: '#bd271e' }}>23138</EuiText>
                                <EuiText size="xs" color="subdued">Active</EuiText>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <Sparkline color="#e7664c" up={false} />
                              </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiSpacer size="s" />
                            <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
                              <EuiFlexItem>
                                <EuiText style={{ fontSize: 28, fontWeight: 700, color: '#017d73' }}>63365</EuiText>
                                <EuiText size="xs" color="subdued">Recovered</EuiText>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <Sparkline color="#54b399" up />
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiPanel>
                        </EuiFlexItem>

                        {/* Alerts chart */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ height: '100%' }}>
                            <EuiText size="s" style={{ fontWeight: 700 }}>Alerts</EuiText>
                            <EuiSpacer size="s" />
                            <AlertsChart />
                            <EuiSpacer size="xs" />
                            <EuiFlexGroup gutterSize="m" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#54b399' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Active</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d6bf57' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Recovered</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e7664c' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Failed</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiPanel>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      {/* Last response + Execution breakdown row */}
                      <EuiFlexGroup gutterSize="m" responsive={false}>
                        {/* Last response */}
                        <EuiFlexItem grow={false} style={{ minWidth: 220 }}>
                          <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                            <EuiText size="s" style={{ fontWeight: 700 }}>Last response</EuiText>
                            <EuiSpacer size="s" />
                            <EuiHealth color="danger">failed</EuiHealth>
                            <EuiSpacer size="m" />
                            <EuiPanel color="danger" hasBorder={false} hasShadow={false} paddingSize="s" style={{ borderLeft: '3px solid #bd271e', background: '#fff0ee', borderRadius: 4 }}>
                              <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 4 }}>Reason</EuiText>
                              <EuiText size="xs">
                                Query timeout after 30s while evaluating ESQL on index logs-*.
                              </EuiText>
                            </EuiPanel>
                            <EuiSpacer size="s" />
                            <EuiButtonEmpty size="xs" iconType="questionInCircle" color="primary" flush="left">
                              How to fix
                            </EuiButtonEmpty>
                          </EuiPanel>
                        </EuiFlexItem>

                        {/* Execution breakdown */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ height: '100%' }}>
                            <EuiText size="s" style={{ fontWeight: 700 }}>Execution breakdown over time</EuiText>
                            <EuiSpacer size="s" />
                            <BarChart />
                            <EuiSpacer size="xs" />
                            <EuiFlexGroup gutterSize="m" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, background: '#54b399' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Succeeded</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, background: '#d6bf57' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Warning</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><div style={{ width: 10, height: 10, background: '#e7664c' }} /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="xs">Failed</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiPanel>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      {/* Exceptions accordion */}
                      <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                        <EuiAccordion id="exceptions-accordion" buttonContent={<EuiText size="s" style={{ fontWeight: 700 }}>Exceptions</EuiText>} initialIsOpen>
                          <EuiSpacer size="s" />
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiText size="s">Error count threshold</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiBadge color="primary">current</EuiBadge>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiAccordion>
                      </EuiPanel>

                      <EuiSpacer size="m" />

                      {/* Artifacts accordion */}
                      <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                        <EuiAccordion id="artifacts-accordion" buttonContent={<EuiText size="s" style={{ fontWeight: 700 }}>Artifacts</EuiText>} initialIsOpen>
                          <EuiSpacer size="s" />
                          <EuiFlexGroup gutterSize="xl" alignItems="flexStart" responsive={false}>
                            {/* Dashboards */}
                            <EuiFlexItem>
                              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}>
                                  <EuiIcon type="dashboardApp" size="s" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                  <EuiText size="s" style={{ fontWeight: 600 }}>Dashboards</EuiText>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                  <EuiButtonIcon iconType="plusInCircle" aria-label="Add dashboard" size="xs" />
                                </EuiFlexItem>
                              </EuiFlexGroup>
                              <EuiSpacer size="s" />
                              {['[Metrics MySQL] Database Overview', '[Logs MySQL] Overview', '[Elastic Agent] CloudWatch Input Metrics'].map((d, i) => (
                                <EuiFlexGroup key={i} gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 6 }}>
                                  <EuiFlexItem>
                                    <EuiLink href="#"><EuiText size="s">{d}</EuiText></EuiLink>
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiButtonIcon iconType="popout" aria-label="Open" size="xs" color="text" />
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" />
                                  </EuiFlexItem>
                                </EuiFlexGroup>
                              ))}
                            </EuiFlexItem>

                            {/* Notification policies */}
                            <EuiFlexItem>
                              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}>
                                  <EuiIcon type="bell" size="s" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                  <EuiText size="s" style={{ fontWeight: 600 }}>Notification policies</EuiText>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                  <EuiLink href="#"><EuiText size="s">Open Notification policies</EuiText></EuiLink>
                                </EuiFlexItem>
                              </EuiFlexGroup>
                              <EuiSpacer size="s" />
                              <EuiText style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>5</EuiText>
                              <EuiText size="xs">Notification policies</EuiText>
                              <EuiSpacer size="xs" />
                              <EuiText size="xs" color="subdued">3 are matching criteria and 2 are catch-all</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiAccordion>
                      </EuiPanel>

                    </EuiFlexItem>

                    {/* RIGHT: Rule conditions */}
                    <EuiFlexItem grow={false} style={{ width: 640, flexShrink: 0, borderLeft: '1px solid #d3dae6', paddingLeft: 24 }}>
                      <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none">
                        <EuiTitle size="s"><h3>Rule conditions</h3></EuiTitle>
                        <EuiSpacer size="m" />

                        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 6 }}>Base query</EuiText>
                        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
{`FROM metrics-us-east-1:traces-apm-default
| STATS cpu = AVG(CPU) BY host.name`}
                        </EuiCodeBlock>

                        <EuiSpacer size="m" />

                        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 6 }}>Alert condition</EuiText>
                        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
{`WHERE cpu > 0.9`}
                        </EuiCodeBlock>

                        <EuiSpacer size="m" />
                        <EuiHorizontalRule margin="none" />
                        <EuiSpacer size="m" />

                        {[
                          { label: 'Data source', value: 'logs-endpoint.alerts-*' },
                          { label: 'Group key', value: 'user.id' },
                          { label: 'Time field', value: '@timestamp' },
                          { label: 'Schedule', value: 'Every 5 minutes' },
                          { label: 'Mode', value: 'Detect only' },
                          { label: 'Recovery', value: 'ESQL recovery query' },
                        ].map(({ label, value }) => (
                          <EuiFlexGroup key={label} gutterSize="s" justifyContent="spaceBetween" responsive={false} style={{ marginBottom: 8 }}>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">{label}</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiText size="xs" textAlign="right">{value}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        ))}

                        <EuiSpacer size="s" />

                        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
{`WHERE cpu > 0.9`}
                        </EuiCodeBlock>

                        <EuiSpacer size="m" />

                        {[
                          { label: 'Alert delay', value: 'After 3 matches' },
                          { label: 'No data config', value: '-' },
                        ].map(({ label, value }) => (
                          <EuiFlexGroup key={label} gutterSize="s" justifyContent="spaceBetween" responsive={false} style={{ marginBottom: 8 }}>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">{label}</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiText size="xs" textAlign="right">{value}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        ))}

                        <EuiSpacer size="m" />
                        <EuiHorizontalRule margin="none" />
                        <EuiSpacer size="m" />

                        <EuiText size="xs" style={{ fontWeight: 700, marginBottom: 10 }}>Metadata</EuiText>

                        {[
                          { label: 'Created by', value: 'joana.cardoso@elastic.co' },
                          { label: 'Created date', value: 'Mar 4, 2026' },
                          { label: 'Last update', value: 'Mar 4, 2026' },
                          { label: 'Updated by', value: 'joana.cardoso@elastic.co' },
                        ].map(({ label, value }) => (
                          <EuiFlexGroup key={label} gutterSize="s" justifyContent="spaceBetween" responsive={false} style={{ marginBottom: 8 }}>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">{label}</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiText size="xs" textAlign="right">{value}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        ))}
                      </EuiPanel>
                    </EuiFlexItem>

                  </EuiFlexGroup>
                )}

                {selectedTab === 'executions' && (
                  <>
                    {/* Execution log */}
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                      <EuiTitle size="m"><h2>Execution log</h2></EuiTitle>
                      <EuiSpacer size="m" />
                      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">Showing 40 rule executions</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiSwitch label="Show source event time range" checked={showSourceEventRange} onChange={(e) => setShowSourceEventRange(e.target.checked)} compressed />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiSwitch label="Show metrics columns" checked={showMetricsColumns} onChange={(e) => setShowMetricsColumns(e.target.checked)} compressed />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiText size="xs" color="subdued">Updated 3 minutes ago</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButtonIcon iconType="refresh" aria-label="Refresh" size="s" />
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton size="s" iconType="calendar">Last 90 days</EuiButton>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiSpacer size="m" />
                      <EuiBasicTable
                        items={[
                          { id: '1', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 1, matchedEvents: 63, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '2', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 2, matchedEvents: 36, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '3', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 0, matchedEvents: 244, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '4', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 1, matchedEvents: 164, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '5', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 64, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '6', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 3, matchedEvents: 46, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '7', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 23, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '8', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 145, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '9', status: 'succeeded', runType: 'Manual', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', duration: '00:01:24', alertsCreated: 4, matchedEvents: 31, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                          { id: '10', status: 'error', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 0, matchedEvents: 153, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        ].slice(executionPageIndex * executionPageSize, (executionPageIndex + 1) * executionPageSize)}
                        columns={[
                          {
                            field: 'status', name: 'Status', width: '120px', truncateText: false,
                            render: (status: string) => {
                              const color = status === 'succeeded' ? 'success' : status === 'failed' ? 'danger' : 'warning';
                              return <div style={{ whiteSpace: 'nowrap' }}><EuiHealth color={color}>{status.charAt(0).toUpperCase() + status.slice(1)}</EuiHealth></div>;
                            },
                          },
                          { field: 'runType', name: 'Run type', width: '110px' },
                          { field: 'timestamp', name: 'Timestamp', width: '200px', truncateText: false, render: (t: string) => <div style={{ whiteSpace: 'nowrap' }}>{t}</div> },
                          ...(showSourceEventRange ? [{ field: 'sourceEventRange', name: 'Source event time range', width: '280px' }] : []),
                          { field: 'duration', name: 'Duration', width: '100px' },
                          { field: 'alertsCreated', name: 'Alerts created', width: '120px' },
                          { field: 'matchedEvents', name: 'Matched events', width: '130px' },
                          { field: 'message', name: 'Message', truncateText: true },
                          {
                            name: 'Action', width: '100px',
                            render: (item: any) => (
                              <EuiLink onClick={() => { setSelectedExecution(item); setIsFlyoutVisible(true); }}>View details</EuiLink>
                            ),
                          },
                        ]}
                        pagination={{ pageIndex: executionPageIndex, pageSize: executionPageSize, totalItemCount: 40, pageSizeOptions: [10, 25, 50], showPerPageOptions: true }}
                        onChange={({ page }: any) => { if (page) { setExecutionPageIndex(page.index); setExecutionPageSize(page.size); } }}
                      />
                    </EuiPanel>

                    <EuiSpacer size="l" />

                    {/* Manual/Gap fill tasks */}
                    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                      <EuiTitle size="m"><h2>Manual/Gap fill tasks</h2></EuiTitle>
                      <EuiSpacer size="m" />
                      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">Showing 20 execution tasks</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Updated 3 minutes ago</EuiText></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiButtonIcon iconType="refresh" aria-label="Refresh" size="s" /></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiButton size="s" iconType="calendar">Last 90 days</EuiButton></EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiSpacer size="m" />
                      <EuiBasicTable
                        items={[
                          { id: '1', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'John@doe.com', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 10, completed: 10, totalTasks: 25 },
                          { id: '2', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 1, completed: 1, totalTasks: 2 },
                          { id: '3', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 0, completed: 0, totalTasks: 1 },
                          { id: '4', status: 'in-progress', createdAt: 'Aug 11, 2023 @11:51:07', createdBy: 'Auto gap fill', sourceEventRange: 'Aug 10, 2023 @15:33:09 - Aug 10, 2023 @15:34:08', errors: 0, pending: 0, running: 0, completed: 0, totalTasks: 1 },
                        ].slice(gapFillPageIndex * gapFillPageSize, (gapFillPageIndex + 1) * gapFillPageSize)}
                        columns={[
                          { field: 'status', name: 'Status', width: '120px', render: () => <EuiHealth color="primary">In progress</EuiHealth> },
                          { field: 'createdAt', name: 'Created at', width: '180px' },
                          { field: 'createdBy', name: 'Created by', width: '150px' },
                          { field: 'sourceEventRange', name: 'Source event time range', width: '280px' },
                          { field: 'errors', name: 'Errors', width: '80px' },
                          { field: 'pending', name: 'Pending', width: '80px' },
                          { field: 'running', name: 'Running', width: '80px' },
                          { field: 'completed', name: 'Completed', width: '100px' },
                          { field: 'totalTasks', name: 'Total tasks', width: '100px' },
                          { name: 'Action', width: '80px', render: () => <EuiLink href="#">Stop</EuiLink> },
                        ]}
                        pagination={{ pageIndex: gapFillPageIndex, pageSize: gapFillPageSize, totalItemCount: 20, pageSizeOptions: [10, 25, 50], showPerPageOptions: true }}
                        onChange={({ page }: any) => { if (page) { setGapFillPageIndex(page.index); setGapFillPageSize(page.size); } }}
                      />
                    </EuiPanel>
                  </>
                )}

                {selectedTab === 'history' && (
                  <EuiText textAlign="center" color="subdued"><p>History data coming soon</p></EuiText>
                )}

              </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
};

export default RuleDetailsPage;
