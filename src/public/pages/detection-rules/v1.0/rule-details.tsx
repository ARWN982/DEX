import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiButtonGroup,
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
  EuiCode,
  EuiCodeBlock,
  EuiDescriptionList,
  EuiHorizontalRule,
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

const RuleDetailsPage: React.FC = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'exceptions' | 'execution'>('overview');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [aboutViewToggle, setAboutViewToggle] = useState('details');

  // Find the rule from parsed data
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
            <EuiButton onClick={() => navigate('/detection-rules')}>
              Back to Rules
            </EuiButton>
          </EuiCallOut>
        </div>
      </>
    );
  }

  const getSeverityColor = (severity: string): 'success' | 'warning' | 'danger' => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'success';
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'alerts' as const, label: 'Alerts' },
    { id: 'exceptions' as const, label: 'Rule exceptions' },
    { id: 'execution' as const, label: 'Execution results' },
  ];

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ 
        backgroundColor: '#F6F9FC', 
        minHeight: '100vh', 
        marginTop: 48,
        marginLeft: 80,
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart">
          {/* Secondary Navigation */}
          <EuiFlexItem grow={false}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                minHeight: 'calc(100vh - 64px)'
              }}
            >
              <RulesSecondaryNav 
                selectedSection="installed"
                onSectionChange={() => {}}
              />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Content */}
          <EuiFlexItem>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                minHeight: 'calc(100vh - 64px)'
              }}
            >
              <div style={{ padding: '24px' }}>
                {/* Back button */}
                <EuiButtonEmpty
                  iconType="arrowLeft"
                  size="s"
                  onClick={() => navigate('/detection-rules')}
                  style={{ marginBottom: 16 }}
                >
                  Rules
                </EuiButtonEmpty>

                {/* Rule Header */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                  <EuiFlexItem>
                    <EuiTitle size="l">
                      <h1>{rule.name}</h1>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiSwitch
                          label="Enable"
                          checked={isEnabled}
                          onChange={(e) => setIsEnabled(e.target.checked)}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton iconType="gear" size="s">
                          Edit rule settings
                        </EuiButton>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType="boxesHorizontal"
                          aria-label="More actions"
                          size="s"
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Metadata - Row 1 */}
                <EuiSpacer size="s" />
                <EuiFlexGroup gutterSize="m" responsive={false} alignItems="center">
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Created by <strong>22468f8712</strong> on Feb 3, 2025 @ 12:13:31.468
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Updated by <strong>2236886732</strong> on Mar 18, 2026 @ 21:15:43.596
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Metadata - Row 2 */}
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="m" responsive={false} alignItems="center">
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued">
                          Last response:
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiHealth color="warning" style={{ fontSize: '12px' }}>
                          warning
                        </EuiHealth>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued">
                          at Mar 18, 2026 @ 21:14:17.686
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="dot" size="s" color="subdued" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued">
                          Notify when alerts generated
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                {/* Tabs */}
                <EuiTabs size="l">
                  {tabs.map((tab) => (
                    <EuiTab
                      key={tab.id}
                      isSelected={selectedTab === tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                    >
                      {tab.label}
                    </EuiTab>
                  ))}
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* Warning Callout */}
                {showWarning && (
                  <>
                    <EuiCallOut
                      title="Warning at Mar 18, 2026 @ 21:14:17.686"
                      color="warning"
                      iconType="warning"
                      onDismiss={() => setShowWarning(false)}
                    >
                      <EuiText size="s">
                        Unable to find warning indices for rule {rule.name}. This warning will persist until one of the following occurs: a matching index is created or the rule is disabled.
                      </EuiText>
                      <EuiSpacer size="s" />
                      <EuiButtonEmpty size="xs" iconType="help">
                        Ask Assistant
                      </EuiButtonEmpty>
                    </EuiCallOut>
                    <EuiSpacer size="m" />
                  </>
                )}

                {/* Main Content: About and Definition */}
                {selectedTab === 'overview' && (
                  <EuiFlexGroup gutterSize="l" alignItems="stretch">
                    {/* Left Column: About (60% width) */}
                    <EuiFlexItem grow={6}>
                      <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m" style={{ height: '100%' }}>
                        <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiTitle size="m">
                              <h2>About</h2>
                            </EuiTitle>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiButtonGroup
                              legend="About view toggle"
                              options={[
                                { id: 'details', label: 'Details' },
                                { id: 'investigation', label: 'Investigation guide' },
                              ]}
                              idSelected={aboutViewToggle}
                              onChange={(id) => setAboutViewToggle(id)}
                              buttonSize="s"
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>

                        <EuiSpacer size="m" />

                        <EuiDescriptionList
                          type="column"
                          style={{ rowGap: '24px', columnGap: '64px' }}
                          listItems={[
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 4 }}>Description</EuiText>,
                              description: <EuiText size="s">{rule.description || 'No description available.'}</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Author</EuiText>,
                              description: <EuiText size="s">Elastic</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Severity</EuiText>,
                              description: (
                                <EuiHealth color={getSeverityColor(rule.severity)}>
                                  {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                                </EuiHealth>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Risk score</EuiText>,
                              description: <EuiText size="s">{rule.riskScore}</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Reference URLs</EuiText>,
                              description: (
                                <ul style={{ margin: 0, paddingLeft: 0, listStylePosition: 'inside' }}>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://research.checkpoint.com/2020/resolving-your-way-into-domain-admin-exploiting-a-17-year-old-bug-in-windows-dns-servers/
                                    </EuiLink>
                                  </li>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://msrc-blog.microsoft.com/2020/07/14/july-2020-security-update-cve-2020-1350-vulnerability-in-windows-domain-name-system-dns-server/
                                    </EuiLink>
                                  </li>
                                  <li>
                                    <EuiLink href="#" external>
                                      https://www.elastic.co/security-labs/detection-rules-for-sigred-vulnerability
                                    </EuiLink>
                                  </li>
                                </ul>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>False positive examples</EuiText>,
                              description: (
                                <EuiText size="s">
                                  <p>
                                    Verified test sets will legitimately spawn when dns.exe service is in a occurring event. 
                                    Denial of Service (DoS) attempts by intentionally crashing the service will also cause new/fault dns to spawn.
                                  </p>
                                </EuiText>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>License</EuiText>,
                              description: <EuiText size="s">Elastic License v2</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>MITRE ATT&CK™</EuiText>,
                              description: (
                                <EuiFlexGroup direction="column" gutterSize="xs">
                                  <EuiFlexItem>
                                    <EuiLink href="#">Lateral Movement [TA0008]</EuiLink>
                                  </EuiFlexItem>
                                  <EuiFlexItem style={{ paddingLeft: 16 }}>
                                    <EuiLink href="#">Exploitation of Remote Services [T1210]</EuiLink>
                                  </EuiFlexItem>
                                </EuiFlexGroup>
                              ),
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Timestamp override</EuiText>,
                              description: <EuiText size="s">event.ingested</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Max alerts per run</EuiText>,
                              description: <EuiText size="s">100</EuiText>,
                            },
                            {
                              title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Tags</EuiText>,
                                description: (
                                  <EuiFlexGroup gutterSize="s" wrap>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Domain: Endpoint</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">OS: Windows</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Use Case: Threat Detection</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Tactic: Lateral Movement</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Resources: Investigation Guide</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Elastic Defend</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Windows Security Event Log</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: System</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: SentinelOne</EuiBadge>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiBadge color="hollow">Data Source: Crowdstrike</EuiBadge>
                                    </EuiFlexItem>
                                  </EuiFlexGroup>
                                ),
                              },
                            ]}
                          />
                      </EuiPanel>
                    </EuiFlexItem>

                    {/* Right Column: Definition & Schedule (40% width) */}
                    <EuiFlexItem grow={4}>
                      <EuiFlexGroup direction="column" gutterSize="m">
                        {/* Definition Section */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m">
                            <EuiTitle size="m">
                              <h2>Definition</h2>
                            </EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                              type="column"
                              style={{ rowGap: '24px', columnGap: '64px' }}
                              listItems={[
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Index patterns</EuiText>,
                                description: (
                                  <EuiFlexGroup gutterSize="s" wrap>
                                    {['endgame-*', 'logs-crowdstrike.fdr*', 'logs-endpoint.events.process-*', 
                                      'logs-m365_defender.event-*', 'logs-sentinel_one_cloud_funnel.*', 
                                      'logs-system.security*', 'logs-windows.forwarded*', 
                                      'logs-windows.sysmon_operational-*', 'winlogbeat-*'].map((pattern, idx) => (
                                      <EuiFlexItem grow={false} key={idx}>
                                        <EuiBadge color="hollow">{pattern}</EuiBadge>
                                      </EuiFlexItem>
                                    ))}
                                  </EuiFlexGroup>
                                ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>EQL query</EuiText>,
                                  description: (
                                    <EuiText size="s" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`process where host.os.type == "windows" and event.type == "start"
  and process.parent.name : "dns.exe" and
  not process.executable :
      ("?:\\Windows\\System32\\werfault.exe",
       "?:\\Windows\\System32\\conhost.exe",
       "?:\\Program Files\\BeyondTrust\\One2OneHost.exe*") and
  /* Consisterthis specific exclusion as it uses NT Object paths */
  (process.name : ("cmd.exe", "powershell.exe",
                   "?:\\DeviceHarddiskVolume?\\Windows\\System32\\conhost.exe")
   and
   not process.parent.executable :
       ("?:\\Program Files\\BeyondTrust\\One2OneHost.exe*"))`}
                                    </EuiText>
                                  ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Rule type</EuiText>,
                                  description: <EuiText size="s">Event Correlation</EuiText>,
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Related integrations</EuiText>,
                                  description: (
                                  <EuiFlexGroup direction="column" gutterSize="s">
                                    {[
                                      { name: 'CrowdStrike', status: 'Not installed', color: 'default' },
                                      { name: 'Elastic Defend', status: 'Installed', color: 'success' },
                                      { name: 'Microsoft Defender XDR', status: 'Not installed', color: 'default' },
                                      { name: 'SentinelOne Cloud Funnel', status: 'Not installed', color: 'default' },
                                      { name: 'Windows', status: 'Not installed', color: 'default' },
                                    ].map((integration, idx) => (
                                      <EuiFlexItem key={idx}>
                                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                          <EuiFlexItem grow={false}>
                                            <EuiLink href="#">{integration.name}</EuiLink>
                                          </EuiFlexItem>
                                          <EuiFlexItem grow={false}>
                                            <EuiBadge color={integration.color as any}>{integration.status}</EuiBadge>
                                          </EuiFlexItem>
                                        </EuiFlexGroup>
                                      </EuiFlexItem>
                                    ))}
                                  </EuiFlexGroup>
                                ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Required fields</EuiText>,
                                  description: (
                                    <EuiFlexGroup direction="column" gutterSize="xs">
                                      {['event.type', 'host.os.type', 'process.executable', 'process.name', 'process.parent.name'].map((field, idx) => (
                                        <EuiFlexItem key={idx}>
                                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                            <EuiFlexItem grow={false}>
                                              <EuiIcon type="tokenField" size="s" />
                                            </EuiFlexItem>
                                            <EuiFlexItem>
                                              <EuiText size="s">{field}</EuiText>
                                            </EuiFlexItem>
                                          </EuiFlexGroup>
                                        </EuiFlexItem>
                                      ))}
                                    </EuiFlexGroup>
                                  ),
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Timeline template</EuiText>,
                                  description: <EuiText size="s">None</EuiText>,
                                },
                            ]}
                            />
                          </EuiPanel>
                        </EuiFlexItem>

                        {/* Schedule Section */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder={true} hasShadow={false} paddingSize="m">
                            <EuiTitle size="m">
                              <h2>Schedule</h2>
                            </EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                              type="column"
                              style={{ rowGap: '24px', columnGap: '64px' }}
                              listItems={[
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Runs every</EuiText>,
                                  description: <EuiText size="s">5m</EuiText>,
                                },
                                {
                                  title: <EuiText size="s" style={{ fontWeight: 'semibold', marginBottom: 12 }}>Additional look-back time</EuiText>,
                                  description: <EuiText size="s">4m</EuiText>,
                                },
                              ]}
                            />
                          </EuiPanel>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}

                {selectedTab !== 'overview' && (
                  <EuiText textAlign="center" color="subdued">
                    <p>No {selectedTab} data available</p>
                  </EuiText>
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
