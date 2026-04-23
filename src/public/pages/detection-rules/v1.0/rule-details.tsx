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
  EuiBasicTable,
  EuiFilterGroup,
  EuiFilterButton,
  EuiPopover,
  EuiSelectable,
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

// 90-day alerts chart
const AlertsChart: React.FC = () => {
  const W = 500, H = 120, padL = 36, padR = 8, padT = 8, padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // ~13 weeks of data (91 days, sampled weekly)
  const weeks = ['Jan 10','Jan 17','Jan 24','Jan 31','Feb 7','Feb 14','Feb 21','Feb 28','Mar 7','Mar 14','Mar 21','Mar 28','Apr 4'];
  const alerts   = [28, 34, 22, 41, 38, 29, 45, 52, 36, 48, 31, 43, 38];
  const falsePos = [8,  12, 6,  15, 11, 7,  18, 20, 9,  16, 8,  14, 10];

  const maxVal = 60;
  const n = alerts.length;

  const px = (i: number) => padL + (i / (n - 1)) * chartW;
  const py = (v: number) => padT + chartH - (v / maxVal) * chartH;

  const alertsPath  = alerts.map((v, i)  => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ');
  const falsePath   = falsePos.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ');
  const alertsFill  = `${alertsPath} L${px(n-1)},${padT+chartH} L${padL},${padT+chartH} Z`;
  const falseFill   = `${falsePath} L${px(n-1)},${padT+chartH} L${padL},${padT+chartH} Z`;

  const yTicks = [0, 15, 30, 45, 60];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map(v => (
        <line key={v} x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#e0e5ee" strokeWidth="1" strokeDasharray="3,3" />
      ))}

      {/* Y-axis labels */}
      {yTicks.map(v => (
        <text key={v} x={padL - 4} y={py(v) + 4} textAnchor="end" fontSize="9" fill="#98a2b3">{v}</text>
      ))}

      {/* Filled areas */}
      <path d={alertsFill} fill="#54b399" fillOpacity="0.12" />
      <path d={falseFill}  fill="#e7664c" fillOpacity="0.12" />

      {/* Lines */}
      <path d={alertsPath} fill="none" stroke="#54b399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={falsePath}  fill="none" stroke="#e7664c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {alerts.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="3" fill="#54b399" />)}
      {falsePos.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="3" fill="#e7664c" />)}

      {/* X-axis labels — every other week */}
      {weeks.map((w, i) => i % 2 === 0 && (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#98a2b3">{w}</text>
      ))}
    </svg>
  );
};

const RuleDetailsPage: React.FC = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'executions'>('overview');
  const [isEnabled, setIsEnabled] = useState(true);
  const [summaryState, setSummaryState] = useState<'idle' | 'generating' | 'generated'>('idle');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [exceptionsOpen, setExceptionsOpen] = useState(true);
  const [artifactsOpen, setArtifactsOpen] = useState(true);
  const [investigationOpen, setInvestigationOpen] = useState(false);

  // Execution tab state
  const [executionPageIndex, setExecutionPageIndex] = useState(0);
  const [executionPageSize, setExecutionPageSize] = useState(10);
  const [showSourceEventRange, setShowSourceEventRange] = useState(false);
  const [showMetricsColumns, setShowMetricsColumns] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [runTypeOptions, setRunTypeOptions] = useState([{ label: 'Scheduled' }, { label: 'Manual' }, { label: 'Gap fill' }]);
  const [statusOptions, setStatusOptions] = useState([{ label: 'Succeeded' }, { label: 'Failed' }, { label: 'Error' }]);
  const [runTypePopoverOpen, setRunTypePopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const runTypeActiveCount = runTypeOptions.filter((o: any) => o.checked === 'on').length;
  const statusActiveCount = statusOptions.filter((o: any) => o.checked === 'on').length;

  // Execution flow
  const [expandedFlowSteps, setExpandedFlowSteps] = useState<Record<number, boolean>>({});
  const toggleFlowStep = (idx: number) => setExpandedFlowSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  const executionFlowSteps = [
    { label: 'Start rule execution', duration: 'Mar 5 @ 2026 19:36:41.095', children: [] },
    { label: 'Query Elasticsearch', duration: '3m 124 ms', children: [] },
    { label: 'Process results', duration: '124 ms', children: [
      { label: 'No index matching logs-endpoint.alerts-*', duration: '25 ms' },
      { label: 'Changing rule status to "succeeded"', duration: '25 ms' },
    ]},
    { label: 'Generate alerts if found', duration: '234 ms', children: [] },
    { label: 'Completed', duration: '24 ms', children: [] },
  ];

  // Flyout accordion sections
  const [flyoutSections, setFlyoutSections] = useState<Record<string, boolean>>({
    summary: true, message: true, alerts: true, metrics: true, flow: true, matched: true,
  });
  const toggleFlyoutSection = (key: string) => setFlyoutSections(prev => ({ ...prev, [key]: !prev[key] }));

  const generateSummary = () => {
    setSummaryState('generating');
    setTimeout(() => setSummaryState('generated'), 2500);
  };

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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': case 'critical': return 'danger';
      default: return 'subdued';
    }
  };

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ backgroundColor: '#F6F9FC', height: 'calc(100vh - 56px)', marginTop: 48, marginLeft: 80, padding: 8, display: 'flex', overflow: 'hidden' }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ flex: 1, minHeight: 0 }}>
          {/* Secondary Nav */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <RulesSecondaryNav />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Panel */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', overflowY: 'auto' }}>
              <div style={{ padding: '16px 24px' }}>

                {/* Back */}
                <EuiButtonEmpty iconType="arrowLeft" size="s" onClick={() => navigate('/detection-rules')} style={{ marginBottom: 8 }}>
                  Rules
                </EuiButtonEmpty>

                {/* Rule header */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}>
                  <EuiFlexItem>
                    <EuiTitle size="l"><h1>{rule.name}</h1></EuiTitle>
                    <EuiSpacer size="xs" />
                    <EuiFlexGroup gutterSize="l" alignItems="center" responsive={false} wrap>
                      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><strong>Created by:</strong> Elastic on Mar 16, 2024 @ 10:32:56</EuiText></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><strong>Updated by:</strong> John Doe on Jan 13, 2026 @ 14:23:24</EuiText></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><strong>Elastic version:</strong> 209</EuiText></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><strong>Revision:</strong> 29</EuiText></EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="xs" />
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><strong>Last response:</strong></EuiText></EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiHealth color={rule.lastResponse === 'Succeeded' ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                          {rule.lastResponse === 'Succeeded' ? 'Succeeded' : 'Failed'} at Jan 14, 2026 @ 19:13:10
                        </EuiHealth>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiButtonIcon iconType="refresh" aria-label="Refresh" size="xs" color="text" /></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiButtonIcon iconType="bell" aria-label="Notifications" size="xs" color="text" /></EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>

                  {/* Actions */}
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}><EuiSwitch label="Enable" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} /></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiButton size="s" iconType="clock">History</EuiButton></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiButton size="s" iconType="pencil">Edit rule</EuiButton></EuiFlexItem>
                      <EuiFlexItem grow={false}><EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="s" /></EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                {/* Tabs */}
                <EuiTabs>
                  <EuiTab isSelected={selectedTab === 'overview'} onClick={() => setSelectedTab('overview')}>Overview</EuiTab>
                  <EuiTab isSelected={selectedTab === 'executions'} onClick={() => setSelectedTab('executions')}>Executions</EuiTab>
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* ── OVERVIEW TAB ── */}
                {selectedTab === 'overview' && (
                  <EuiFlexGroup gutterSize="none" alignItems="flexStart" responsive={false}>

                    {/* LEFT column */}
                    <EuiFlexItem style={{ paddingRight: 24, maxWidth: '61%' }}>

                      {/* AI-generated summary */}
                      <div style={{ border: '1px solid #d3dae6', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '10px 14px', cursor: 'pointer', background: '#fff' }} onClick={() => setSummaryOpen(!summaryOpen)} responsive={false}>
                          <EuiFlexItem grow={false}><EuiIcon type={summaryOpen ? 'arrowDown' : 'arrowRight'} size="s" /></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiText size="s" style={{ fontWeight: 700 }}>AI-generated summary</EuiText></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                          <EuiFlexItem grow={true} />
                          {summaryState === 'generated' && (
                            <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <EuiButton size="s" iconType="discuss" style={{ background: '#e8e3fc', borderColor: 'transparent', color: '#5a3dc8', borderRadius: 8 }}>Add to chat</EuiButton>
                            </EuiFlexItem>
                          )}
                          <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" color="text" size="xs" />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        {summaryOpen && (
                          <div style={{ padding: '0 14px 14px' }}>
                            {summaryState === 'idle' && (
                              <div style={{ border: '1px solid #d3dae6', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                <EuiText size="s" color="subdued">Analyse the rule and generate an AI summary with recommended actions.</EuiText>
                                <EuiButton size="s" iconType="sparkles" onClick={generateSummary} style={{ whiteSpace: 'nowrap', flexShrink: 0, background: '#e8e3fc', borderColor: 'transparent', color: '#5a3dc8' }}>Generate AI content</EuiButton>
                              </div>
                            )}
                            {summaryState === 'generating' && (
                              <div style={{ border: '1px solid #d3dae6', borderRadius: 8, padding: 16, background: '#fafafa' }}>
                                <EuiText size="s" color="subdued" style={{ fontStyle: 'italic', marginBottom: 12 }}>Generating AI content ...</EuiText>
                                <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #c5b8f5, #e8e3fc, #c5b8f5)', marginBottom: 8 }} />
                                <div style={{ height: 10, borderRadius: 5, width: '65%', background: 'linear-gradient(90deg, #c5b8f5, #e8e3fc, #c5b8f5)' }} />
                              </div>
                            )}
                            {summaryState === 'generated' && (
                              <div style={{ border: '1px solid #d3dae6', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ padding: 16, border: '1.5px dashed #7B61FF', borderRadius: 6, margin: 12, background: 'rgba(232,227,252,0.5)' }}>
                                  <EuiText size="s"><p style={{ margin: 0 }}>This rule detects suspicious process activity. It has a low false positive rate and is currently generating alerts for lateral movement behaviour on Windows endpoints.</p></EuiText>
                                </div>
                                <EuiHorizontalRule margin="none" />
                                <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <EuiText size="xs" color="subdued">Generated by AI on mmm dd, yyyy at hh:mm</EuiText>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <EuiButtonIcon iconType="refresh" aria-label="Regenerate" color="text" size="xs" onClick={() => setSummaryState('idle')} />
                                    <EuiButtonIcon iconType="copy" aria-label="Copy" color="text" size="xs" />
                                    <EuiButtonIcon iconType="thumbsUp" aria-label="Helpful" color="text" size="xs" />
                                    <EuiButtonIcon iconType="thumbsDown" aria-label="Not helpful" color="text" size="xs" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Combined Last response + Stats card */}
                      <EuiPanel hasBorder hasShadow={false} paddingSize="none" style={{ marginBottom: 16, borderRadius: 6 }}>
                        {/* Last response row */}
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid #d3dae6' }}>
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 6 }}>
                            <EuiFlexItem grow={false}><EuiText size="s" style={{ fontWeight: 700 }}>Last response:</EuiText></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiBadge color="danger" iconType="alert">Failed</EuiBadge></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiText size="s" color="subdued">at Jan 14, 2026 @ 19:13:10</EuiText></EuiFlexItem>
                          </EuiFlexGroup>
                          <EuiText size="xs" color="subdued"><strong>Reason:</strong> Query timeout after 30s while evaluating ESQL on index logs-*.</EuiText>
                        </div>
                        {/* 5 stats */}
                        <EuiFlexGroup gutterSize="none" responsive={false}>
                          {[
                            { title: 'Alert yield', value: '0.02%', color: undefined },
                            { title: 'Failure rate', value: '0.4%', color: undefined },
                            { title: 'Gaps', value: '13 min', color: '#bd271e' },
                            { title: 'Suppression rate', value: '99.8%', color: undefined },
                            { title: 'Unique entities', value: '14 hosts', color: undefined },
                          ].map(({ title, value, color }, i, arr) => (
                            <EuiFlexItem key={title} style={{ padding: '12px 16px', borderRight: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                              <EuiText size="xs" color="subdued" style={{ marginBottom: 4 }}>{title}</EuiText>
                              <EuiText style={{ fontSize: 20, fontWeight: 700, color: color || 'inherit' }}>{value}</EuiText>
                            </EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </EuiPanel>

                      {/* Alerts over time */}
                      <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ marginBottom: 16 }}>
                        <EuiText size="s" style={{ fontWeight: 700, marginBottom: 8 }}>Alerts over time</EuiText>
                        <AlertsChart />
                        <EuiSpacer size="xs" />
                        <EuiFlexGroup gutterSize="l" responsive={false} alignItems="center">
                          {[
                            { color: '#54b399', label: 'Alerts', desc: 'Total alerts detected' },
                            { color: '#e7664c', label: 'False positives', desc: 'Alerts marked as false positive' },
                          ].map(({ color, label, desc }) => (
                            <EuiFlexItem grow={false} key={label}>
                              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}><div style={{ width: 24, height: 3, borderRadius: 2, background: color }} /></EuiFlexItem>
                                <EuiFlexItem><EuiText size="xs"><strong>{label}</strong> — {desc}</EuiText></EuiFlexItem>
                              </EuiFlexGroup>
                            </EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </EuiPanel>

                      {/* Exceptions */}
                      <div style={{ marginBottom: 16 }}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ cursor: 'pointer', marginBottom: exceptionsOpen ? 10 : 0 }} onClick={() => setExceptionsOpen(!exceptionsOpen)} responsive={false}>
                          <EuiFlexItem grow={false}><EuiIcon type={exceptionsOpen ? 'arrowDown' : 'arrowRight'} size="s" /></EuiFlexItem>
                          <EuiFlexItem><EuiText size="s" style={{ fontWeight: 700 }}>Exceptions</EuiText></EuiFlexItem>
                        </EuiFlexGroup>
                        {exceptionsOpen && [
                          { name: 'Trusted Administrative Tool Execution', code: 'Effective_process.nameMATCHES CompatTelRunner.exe' },
                          { name: 'Approved PowerShell Usage', code: 'Effective_process.nameMATCHES CompatTelRunner.exe' },
                        ].map((ex, i) => (
                          <EuiFlexGroup key={i} gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}
                            style={{ padding: '10px 14px', border: '1px solid #d3dae6', borderRadius: 4, marginBottom: 8, background: '#fafbfc' }}>
                            <EuiFlexItem>
                              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
                                <EuiFlexItem grow={false}><EuiText size="s">{ex.name}</EuiText></EuiFlexItem>
                                <EuiFlexItem grow={false}><EuiText size="xs" style={{ fontFamily: 'monospace', color: '#343741' }}>{ex.code}</EuiText></EuiFlexItem>
                              </EuiFlexGroup>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" /></EuiFlexItem>
                          </EuiFlexGroup>
                        ))}
                      </div>

                      {/* Artifacts heading */}
                      <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ cursor: 'pointer', marginBottom: artifactsOpen ? 10 : 0 }} onClick={() => setArtifactsOpen(!artifactsOpen)} responsive={false}>
                        <EuiFlexItem grow={false}><EuiIcon type={artifactsOpen ? 'arrowDown' : 'arrowRight'} size="s" /></EuiFlexItem>
                        <EuiFlexItem><EuiText size="s" style={{ fontWeight: 700 }}>Artifacts</EuiText></EuiFlexItem>
                      </EuiFlexGroup>

                      {artifactsOpen && (
                        <EuiFlexGroup direction="column" gutterSize="m">

                          {/* Investigation guide panel */}
                          <EuiFlexItem>
                            <EuiPanel hasBorder hasShadow={false} paddingSize="none" style={{ borderRadius: 6 }}>
                              <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => setInvestigationOpen(!investigationOpen)} responsive={false}>
                                <EuiFlexItem grow={false}><EuiIcon type={investigationOpen ? 'arrowDown' : 'arrowRight'} size="s" /></EuiFlexItem>
                                <EuiFlexItem grow={false}><EuiIcon type="documentation" size="s" /></EuiFlexItem>
                                <EuiFlexItem><EuiText size="s" style={{ fontWeight: 600 }}>Investigation guide</EuiText></EuiFlexItem>
                              </EuiFlexGroup>
                              {investigationOpen && (
                                <div style={{ padding: '0 16px 12px 40px', borderTop: '1px solid #d3dae6' }}>
                                  <EuiSpacer size="s" />
                                  <EuiText size="s" color="subdued">Follow these steps to investigate the alert and determine the appropriate response.</EuiText>
                                </div>
                              )}
                            </EuiPanel>
                          </EuiFlexItem>

                          {/* Dashboards panel */}
                          <EuiFlexItem>
                            <EuiPanel hasBorder hasShadow={false} paddingSize="none" style={{ borderRadius: 6 }}>
                              <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false} style={{ padding: '12px 16px' }}>
                                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><EuiIcon type="dashboardApp" size="s" /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="s" style={{ fontWeight: 700 }}>Dashboards</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                                <EuiButtonIcon iconType="plusInCircle" aria-label="Add dashboard" size="s" />
                              </EuiFlexGroup>
                              {['[Metrics MySQL] Database Overview', '[Logs MySQL] Overview', '[Elastic Agent] CloudWatch Input Metrics'].map((d, i, arr) => (
                                <EuiFlexGroup key={i} gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}
                                  style={{ padding: '10px 16px', borderTop: '1px solid #d3dae6' }}>
                                  <EuiFlexItem>
                                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                      <EuiFlexItem grow={false}><EuiLink href="#">{d}</EuiLink></EuiFlexItem>
                                      <EuiFlexItem grow={false}><EuiButtonIcon iconType="popout" aria-label="Open" size="xs" color="primary" /></EuiFlexItem>
                                    </EuiFlexGroup>
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}><EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" /></EuiFlexItem>
                                </EuiFlexGroup>
                              ))}
                            </EuiPanel>
                          </EuiFlexItem>

                          {/* Cases panel */}
                          <EuiFlexItem>
                            <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                              <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}><EuiIcon type="casesApp" size="s" /></EuiFlexItem>
                                  <EuiFlexItem><EuiText size="s" style={{ fontWeight: 700 }}>Cases</EuiText></EuiFlexItem>
                                </EuiFlexGroup>
                                <EuiFlexItem grow={false}><EuiLink href="#"><EuiText size="s">View cases</EuiText></EuiLink></EuiFlexItem>
                              </EuiFlexGroup>
                              <EuiText style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>5</EuiText>
                              <EuiText size="xs" color="subdued">Active cases</EuiText>
                            </EuiPanel>
                          </EuiFlexItem>

                        </EuiFlexGroup>
                      )}
                    </EuiFlexItem>

                    {/* RIGHT column — Rule conditions */}
                    <EuiFlexItem style={{ borderLeft: '1px solid #d3dae6', paddingLeft: 24, minWidth: 0 }}>
                      <EuiTitle size="s"><h3>Rule conditions</h3></EuiTitle>
                      <EuiHorizontalRule margin="s" />

                      {/* Each section uses marginBottom: 24 for consistent spacing */}

                      {/* Rule type */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 4 }}>Rule type</EuiText>
                        <EuiText size="s">ES|QL</EuiText>
                      </div>

                      {/* Query */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Query</EuiText>
                        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
{`FROM metrics-us-east-1:traces-apm-default
| STATS cpu = AVG(CPU) BY host.name`}
                        </EuiCodeBlock>
                      </div>

                      {/* Index patterns */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Index patterns</EuiText>
                        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                          {['logs-endpoint.events.process-*', 'logs-system.security*', 'winlogbeat-*'].map(p => (
                            <EuiFlexItem grow={false} key={p}><EuiBadge color="hollow">{p}</EuiBadge></EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Description</EuiText>
                        <EuiText size="s">{rule.description || 'Identifies unusual processes running from the WBEM path, uncommon outside WMI-related Windows processes.'}</EuiText>
                      </div>

                      {/* Metadata table */}
                      <div style={{ marginBottom: 36, border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                        {[
                          { label: 'Rule type', value: <EuiText size="s">ES|QL</EuiText> },
                          { label: 'Author', value: <EuiBadge color="hollow" iconType="logoElastic" iconSide="left">Elastic</EuiBadge> },
                          { label: 'Severity', value: <EuiHealth color={getSeverityColor(rule.severity)}>{rule.severity?.charAt(0).toUpperCase() + rule.severity?.slice(1) || 'High'}</EuiHealth> },
                          { label: 'Risk score', value: <EuiText size="s">{String(rule.riskScore || 73)}</EuiText> },
                          { label: 'License', value: <EuiText size="s">Elastic Licence v2</EuiText> },
                          { label: 'Max alerts per run', value: <EuiText size="s">100</EuiText> },
                        ].map(({ label, value }, i, arr) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                            <div style={{ width: '50%', flexShrink: 0, padding: '8px 12px', borderRight: '1px solid #d3dae6' }}>
                              <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21' }}>{label}</EuiText>
                            </div>
                            <div style={{ padding: '8px 12px' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Tags</EuiText>
                        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                          {['Tag name number 1', 'Tag name number 2', 'Tag name number 3'].map(t => (
                            <EuiFlexItem grow={false} key={t}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </div>

                      {/* Related integrations */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Related integrations</EuiText>
                        <div style={{ border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                          {[
                            { name: 'Elastic Defend', status: 'Enabled' },
                            { name: 'Network Packet Capture', status: 'Enabled' },
                          ].map(({ name, status }, i, arr) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                              <EuiLink href="#">{name}</EuiLink>
                              <EuiButtonIcon iconType="popout" aria-label="Open" size="xs" color="primary" />
                              <EuiBadge color="success">{status}</EuiBadge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Required fields */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Required fields</EuiText>
                        <div style={{ border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                          {['event.type', 'File.path'].map((f, i, arr) => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                              <EuiIcon type="tokenField" size="s" color="primary" style={{ flexShrink: 0 }} />
                              <EuiText size="s" style={{ fontFamily: 'monospace' }}>{f}</EuiText>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MITRE ATT&CK */}
                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>MITRE ATT&CK™</EuiText>
                        <EuiLink href="#"><EuiText size="s">Defense Evasion (TA0005)</EuiText></EuiLink>
                        <div style={{ paddingLeft: 16, marginTop: 4 }}>
                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 2 }}>
                            <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">└─</EuiText></EuiFlexItem>
                            <EuiFlexItem><EuiLink href="#"><EuiText size="xs">File and Directory Permissions Modification (T1222)</EuiText></EuiLink></EuiFlexItem>
                          </EuiFlexGroup>
                          <div style={{ paddingLeft: 16 }}>
                            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                              <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">└─</EuiText></EuiFlexItem>
                              <EuiFlexItem><EuiLink href="#"><EuiText size="xs">Windows File and Directory Permissions Modification (T1222.001)</EuiText></EuiLink></EuiFlexItem>
                            </EuiFlexGroup>
                          </div>
                        </div>
                      </div>

                      {/* Timeline template */}
                      <div>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 2 }}>Timeline template</EuiText>
                        <EuiText size="s">None</EuiText>
                      </div>
                    </EuiFlexItem>

                  </EuiFlexGroup>
                )}

                {/* ── EXECUTIONS TAB ── */}
                {selectedTab === 'executions' && (
                  <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false}>

                    {/* LEFT: Execution log */}
                    <EuiFlexItem style={{ paddingRight: 24, maxWidth: '61%' }}>
                  <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6 }}>
                    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}><EuiTitle size="m"><h2>Execution log</h2></EuiTitle></EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiFilterGroup>
                              <EuiPopover
                                button={<EuiFilterButton iconType="arrowDown" iconSide="right" onClick={() => setRunTypePopoverOpen(!runTypePopoverOpen)} isSelected={runTypePopoverOpen} numFilters={runTypeOptions.length} numActiveFilters={runTypeActiveCount} hasActiveFilters={runTypeActiveCount > 0}>Run type</EuiFilterButton>}
                                isOpen={runTypePopoverOpen} closePopover={() => setRunTypePopoverOpen(false)} panelPaddingSize="none"
                              >
                                <EuiSelectable searchable searchProps={{ placeholder: 'Filter list', compressed: true }} options={runTypeOptions} onChange={opts => setRunTypeOptions(opts)}>
                                  {(list, search) => <div style={{ width: 240 }}><div style={{ padding: '8px 8px 4px' }}>{search}</div>{list}</div>}
                                </EuiSelectable>
                              </EuiPopover>
                            </EuiFilterGroup>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiFilterGroup>
                              <EuiPopover
                                button={<EuiFilterButton iconType="arrowDown" iconSide="right" onClick={() => setStatusPopoverOpen(!statusPopoverOpen)} isSelected={statusPopoverOpen} numFilters={statusOptions.length} numActiveFilters={statusActiveCount} hasActiveFilters={statusActiveCount > 0}>Status</EuiFilterButton>}
                                isOpen={statusPopoverOpen} closePopover={() => setStatusPopoverOpen(false)} panelPaddingSize="none"
                              >
                                <EuiSelectable searchable searchProps={{ placeholder: 'Filter list', compressed: true }} options={statusOptions} onChange={opts => setStatusOptions(opts)}>
                                  {(list, search) => <div style={{ width: 240 }}><div style={{ padding: '8px 8px 4px' }}>{search}</div>{list}</div>}
                                </EuiSelectable>
                              </EuiPopover>
                            </EuiFilterGroup>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiButton size="s" iconType="calendar">Last 90 days</EuiButton></EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>

                    <EuiSpacer size="m" />

                    {/* Summary health bar */}
                    <EuiPanel color="plain" hasBorder hasShadow={false} paddingSize="none">
                      <div style={{ padding: '14px 16px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <EuiText size="s"><strong>Overall health:</strong></EuiText>
                        <EuiBadge color="danger">Action required</EuiBadge>
                        <div style={{ width: 1, height: 16, background: '#d3dae6' }} />
                        <EuiText size="s"><strong>Last run:</strong></EuiText>
                        <EuiBadge color="danger">Failed</EuiBadge>
                        <EuiText size="s" color="subdued">4 min ago</EuiText>
                        <div style={{ width: 1, height: 16, background: '#d3dae6' }} />
                        <EuiText size="s"><strong>Failure rate:</strong></EuiText>
                        <EuiBadge color="danger">0.4%</EuiBadge>
                        <div style={{ width: 1, height: 16, background: '#d3dae6' }} />
                        <EuiText size="s"><strong>Total executions:</strong></EuiText>
                        <EuiBadge color="hollow">1532</EuiBadge>
                        <div style={{ width: 1, height: 16, background: '#d3dae6' }} />
                        <EuiText size="s"><strong>Gaps:</strong></EuiText>
                        <EuiBadge color="warning">2 detected</EuiBadge>
                      </div>
                    </EuiPanel>

                    <EuiSpacer size="m" />

                    <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                      <EuiFlexItem grow={false}><EuiText size="s" color="subdued">Showing 40 rule executions</EuiText></EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                          <EuiFlexItem grow={false}><EuiSwitch label="Show source event time range" checked={showSourceEventRange} onChange={e => setShowSourceEventRange(e.target.checked)} compressed /></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiSwitch label="Show metrics columns" checked={showMetricsColumns} onChange={e => setShowMetricsColumns(e.target.checked)} compressed /></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Updated 3 minutes ago</EuiText></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiButtonIcon iconType="refresh" aria-label="Refresh" size="s" /></EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="m" />

                    <EuiBasicTable
                      items={[
                        { id: '1', status: 'failed', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 1, matchedEvents: 63, message: 'The rule is attempting to query data from Elasticsearch indices...' },
                        { id: '2', status: 'succeeded', runType: 'Scheduled', timestamp: 'Aug 11, 2026 @11:51:07', sourceEventRange: '', duration: '00:01:24', alertsCreated: 2, matchedEvents: 36, message: 'The rule is attempting to query data from Elasticsearch indices...' },
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
                        { field: 'status', name: 'Status', width: '120px', render: (s: string) => <div style={{ whiteSpace: 'nowrap' }}><EuiHealth color={s === 'succeeded' ? 'success' : s === 'failed' ? 'danger' : 'warning'}>{s.charAt(0).toUpperCase() + s.slice(1)}</EuiHealth></div> },
                        { field: 'runType', name: 'Run type', width: '110px' },
                        { field: 'timestamp', name: 'Timestamp', width: '200px', render: (t: string) => <div style={{ whiteSpace: 'nowrap' }}>{t}</div> },
                        ...(showSourceEventRange ? [{ field: 'sourceEventRange', name: 'Source event time range', width: '280px' }] : []),
                        { field: 'duration', name: 'Duration', width: '100px' },
                        { field: 'alertsCreated', name: 'Alerts created', width: '120px' },
                        { field: 'matchedEvents', name: 'Matched events', width: '130px' },
                        { field: 'message', name: 'Message', truncateText: true },
                        { name: 'Action', width: '100px', render: () => <EuiLink onClick={() => setIsFlyoutVisible(true)}>View details</EuiLink> },
                      ]}
                      pagination={{ pageIndex: executionPageIndex, pageSize: executionPageSize, totalItemCount: 40, pageSizeOptions: [10, 25, 50], showPerPageOptions: true }}
                      onChange={({ page }: any) => { if (page) { setExecutionPageIndex(page.index); setExecutionPageSize(page.size); } }}
                    />
                  </EuiPanel>
                    </EuiFlexItem>

                    {/* RIGHT: Rule conditions (same as Overview) */}
                    <EuiFlexItem style={{ borderLeft: '1px solid #d3dae6', paddingLeft: 24, minWidth: 0 }}>
                      <EuiTitle size="s"><h3>Rule conditions</h3></EuiTitle>
                      <EuiHorizontalRule margin="s" />

                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 4 }}>Rule type</EuiText>
                        <EuiText size="s">ES|QL</EuiText>
                      </div>

                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Query</EuiText>
                        <EuiCodeBlock language="sql" fontSize="s" paddingSize="s" isCopyable>
{`FROM metrics-us-east-1:traces-apm-default
| STATS cpu = AVG(CPU) BY host.name`}
                        </EuiCodeBlock>
                      </div>

                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Index patterns</EuiText>
                        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                          {['logs-endpoint.events.process-*', 'logs-system.security*', 'winlogbeat-*'].map(p => (
                            <EuiFlexItem grow={false} key={p}><EuiBadge color="hollow">{p}</EuiBadge></EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </div>

                      <div style={{ marginBottom: 36, border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                        {[
                          { label: 'Rule type', value: <EuiText size="s">ES|QL</EuiText> },
                          { label: 'Author', value: <EuiBadge color="hollow" iconType="logoElastic" iconSide="left">Elastic</EuiBadge> },
                          { label: 'Severity', value: <EuiHealth color={getSeverityColor(rule.severity)}>{rule.severity?.charAt(0).toUpperCase() + rule.severity?.slice(1) || 'High'}</EuiHealth> },
                          { label: 'Risk score', value: <EuiText size="s">{String(rule.riskScore || 73)}</EuiText> },
                          { label: 'License', value: <EuiText size="s">Elastic Licence v2</EuiText> },
                          { label: 'Max alerts per run', value: <EuiText size="s">100</EuiText> },
                        ].map(({ label, value }, i, arr) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                            <div style={{ width: '50%', flexShrink: 0, padding: '8px 12px', borderRight: '1px solid #d3dae6' }}>
                              <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21' }}>{label}</EuiText>
                            </div>
                            <div style={{ padding: '8px 12px' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Related integrations</EuiText>
                        <div style={{ border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                          {[{ name: 'Elastic Defend', status: 'Enabled' }, { name: 'Network Packet Capture', status: 'Enabled' }].map(({ name, status }, i, arr) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                              <EuiLink href="#">{name}</EuiLink>
                              <EuiButtonIcon iconType="popout" aria-label="Open" size="xs" color="primary" />
                              <EuiBadge color="success">{status}</EuiBadge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: 36 }}>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 6 }}>Required fields</EuiText>
                        <div style={{ border: '1px solid #d3dae6', borderRadius: 4, overflow: 'hidden' }}>
                          {['event.type', 'File.path'].map((f, i, arr) => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid #d3dae6' : 'none' }}>
                              <EuiIcon type="tokenField" size="s" color="primary" style={{ flexShrink: 0 }} />
                              <EuiText size="s" style={{ fontFamily: 'monospace' }}>{f}</EuiText>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <EuiText size="s" style={{ fontWeight: 700, color: '#1a1c21', marginBottom: 4 }}>Timeline template</EuiText>
                        <EuiText size="s">None</EuiText>
                      </div>
                    </EuiFlexItem>

                  </EuiFlexGroup>
                )}

              </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Execution Details Flyout */}
      {isFlyoutVisible && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 640, background: '#fff', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)', zIndex: 1000, overflowY: 'auto', padding: 24 }}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} style={{ marginBottom: 24 }}>
            <EuiTitle size="s"><h2>Execution ID 9a1a2dae</h2></EuiTitle>
            <EuiButtonIcon iconType="cross" aria-label="Close" size="s" onClick={() => setIsFlyoutVisible(false)} />
          </EuiFlexGroup>
          <EuiText size="xs" color="subdued" style={{ marginBottom: 24 }}>Aug 11, 2026 @11:51:07</EuiText>
          <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              <div><EuiText size="xs" color="subdued">Status</EuiText><EuiSpacer size="xs" /><EuiHealth color="success">Succeeded</EuiHealth></div>
              <div><EuiText size="xs" color="subdued">Run type</EuiText><EuiSpacer size="xs" /><EuiText size="s">Scheduled</EuiText></div>
            </div>
          </EuiPanel>

          {/* Flyout sections */}
          {[
            { key: 'summary', label: 'Execution summary', extra: <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} /> },
            { key: 'metrics', label: 'Execution Metrics' },
            { key: 'flow', label: 'Execution Flow' },
            { key: 'matched', label: 'Matched events' },
          ].map(({ key, label, extra }) => (
            <div key={key} style={{ borderBottom: '1px solid #d3dae6', marginBottom: 4 }}>
              <EuiFlexGroup gutterSize="xs" alignItems="center" style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => toggleFlyoutSection(key)} responsive={false}>
                <EuiFlexItem grow={false}><EuiIcon type={flyoutSections[key] ? 'arrowDown' : 'arrowRight'} size="s" /></EuiFlexItem>
                <EuiFlexItem grow={false}><EuiText size="s" style={{ fontWeight: 700 }}>{label}</EuiText></EuiFlexItem>
                {extra && <EuiFlexItem grow={false}>{extra}</EuiFlexItem>}
              </EuiFlexGroup>
              {flyoutSections[key] && (
                <div style={{ paddingBottom: 12 }}>
                  {key === 'summary' && <EuiText size="s" color="subdued"><p>This rule executed successfully but encountered a configuration issue. No indices matched the index pattern (logs-endpoint.alerts-*).</p></EuiText>}
                  {key === 'metrics' && (
                    <EuiFlexGroup gutterSize="l" responsive={false}>
                      {[{ l: 'Execution time', v: '00:00:00:054' }, { l: 'Events matched', v: '12' }, { l: 'Gap detected', v: '-' }].map(({ l, v }) => (
                        <EuiFlexItem key={l}><EuiText size="xs" color="subdued">{l}</EuiText><EuiText size="s">{v}</EuiText></EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                  )}
                  {key === 'flow' && (
                    <div style={{ background: '#f0f4f9', border: '1px solid #d3dae6', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {executionFlowSteps.map((step, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', border: '1px solid #d3dae6', borderRadius: 10, cursor: step.children.length > 0 ? 'pointer' : 'default' }} onClick={() => step.children.length > 0 && toggleFlowStep(idx)}>
                            <EuiIcon type="check" size="s" color="success" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1a1c21' }}>{step.label}</span>
                            <span style={{ fontSize: 13, color: '#69707d', whiteSpace: 'nowrap' }}>{step.duration}</span>
                            <EuiIcon type={step.children.length > 0 && expandedFlowSteps[idx] ? 'arrowDown' : 'arrowRight'} size="s" color="subdued" />
                          </div>
                          {expandedFlowSteps[idx] && step.children.map((child, ci) => (
                            <div key={ci} style={{ marginLeft: 24, marginTop: 6, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#f5f7fa', border: '1px solid #d3dae6', borderRadius: 8 }}>
                              <EuiText size="xs" style={{ fontFamily: 'monospace', color: '#006bb8' }}>{'>_'}</EuiText>
                              <span style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: '#343741' }}>{child.label}</span>
                              <span style={{ fontSize: 12, color: '#69707d' }}>{child.duration}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {key === 'matched' && (
                    <EuiBasicTable
                      items={[
                        { time: '11:50:10', host: 'james-fleet-714-2', user: 'root', process: 'wget', file: 'Media' },
                        { time: '11:50:13', host: 'james-fleet-714-2', user: 'root', process: 'wget', file: 'Media' },
                      ]}
                      columns={[
                        { field: 'time', name: 'Time', width: '80px' },
                        { field: 'host', name: 'Host', width: '140px' },
                        { field: 'user', name: 'User', width: '60px' },
                        { field: 'process', name: 'Process', width: '80px' },
                        { field: 'file', name: 'File' },
                      ]}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RuleDetailsPage;
