import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiButton,
  EuiButtonEmpty,
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
  const [showWarning, setShowWarning] = useState(true);

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

                {/* Metadata */}
                <EuiSpacer size="s" />
                <EuiFlexGroup gutterSize="m" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Created by <strong>Elastic</strong> on {rule.lastUpdated}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      Updated by <strong>Elastic</strong> on {rule.lastUpdated}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="clock" size="s" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued">
                          Last response: {rule.lastRun}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="bell" size="s" />
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
                {showWarning && rule.lastResponse === 'Failed' && (
                  <>
                    <EuiCallOut
                      title={`Warning at ${rule.lastRun}`}
                      color="warning"
                      iconType="warning"
                      onDismiss={() => setShowWarning(false)}
                    >
                      <EuiText size="s">
                        Unable to find warning reason for rule {rule.name}. This warning will persist until one of the following occurs: a matching index is created or the rule is disabled.
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
                  <EuiFlexGroup gutterSize="m" alignItems="flexStart">
                    {/* Left Column: About */}
                    <EuiFlexItem grow={6}>
                      <EuiTitle size="s">
                        <h2>About</h2>
                      </EuiTitle>
                      <EuiSpacer size="m" />

                      {/* Description */}
                      <EuiTitle size="xs">
                        <h3>Description</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s">
                        {rule.description || 'No description available.'}
                      </EuiText>

                      <EuiSpacer size="m" />

                      {/* Author */}
                      <EuiTitle size="xs">
                        <h3>Author</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s">Elastic</EuiText>

                      <EuiSpacer size="m" />

                      {/* Severity */}
                      <EuiTitle size="xs">
                        <h3>Severity</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiHealth color={getSeverityColor(rule.severity)}>
                        {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                      </EuiHealth>

                      <EuiSpacer size="m" />

                      {/* Risk score */}
                      <EuiTitle size="xs">
                        <h3>Risk score</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s">{rule.riskScore}</EuiText>

                      <EuiSpacer size="m" />

                      {/* MITRE ATT&CK */}
                      {rule.mitreTactics && rule.mitreTactics.length > 0 && (
                        <>
                          <EuiTitle size="xs">
                            <h3>MITRE ATT&CK</h3>
                          </EuiTitle>
                          <EuiSpacer size="s" />
                          <EuiFlexGroup gutterSize="s" wrap>
                            {rule.mitreTactics.map((tactic, idx) => (
                              <EuiFlexItem grow={false} key={idx}>
                                <EuiBadge color="hollow">{tactic}</EuiBadge>
                              </EuiFlexItem>
                            ))}
                          </EuiFlexGroup>
                          {rule.mitreTechniques && rule.mitreTechniques.length > 0 && (
                            <>
                              <EuiSpacer size="s" />
                              <EuiFlexGroup gutterSize="s" wrap>
                                {rule.mitreTechniques.map((technique, idx) => (
                                  <EuiFlexItem grow={false} key={idx}>
                                    <EuiBadge color="hollow">
                                      {technique.id}: {technique.name}
                                    </EuiBadge>
                                  </EuiFlexItem>
                                ))}
                              </EuiFlexGroup>
                            </>
                          )}
                          <EuiSpacer size="m" />
                        </>
                      )}

                      {/* Tags */}
                      {rule.tags && rule.tags.length > 0 && (
                        <>
                          <EuiTitle size="xs">
                            <h3>Tags</h3>
                          </EuiTitle>
                          <EuiSpacer size="s" />
                          <EuiFlexGroup gutterSize="s" wrap>
                            {rule.tags.map((tag, idx) => (
                              <EuiFlexItem grow={false} key={idx}>
                                <EuiBadge color="hollow">{tag}</EuiBadge>
                              </EuiFlexItem>
                            ))}
                          </EuiFlexGroup>
                          <EuiSpacer size="m" />
                        </>
                      )}

                      {/* Reference URLs */}
                      <EuiTitle size="xs">
                        <h3>Reference URLs</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s" color="subdued">
                        No reference URLs available
                      </EuiText>

                      <EuiSpacer size="m" />

                      {/* False positive examples */}
                      <EuiTitle size="xs">
                        <h3>False positive examples</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s" color="subdued">
                        No false positive examples documented
                      </EuiText>
                    </EuiFlexItem>

                    {/* Right Column: Definition */}
                    <EuiFlexItem grow={4}>
                      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiTitle size="s">
                            <h2>Definition</h2>
                          </EuiTitle>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiFlexGroup gutterSize="s" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiButton size="s" fill>
                                Details
                              </EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiButton size="s">
                                Investigation guide
                              </EuiButton>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      {/* Index patterns */}
                      <EuiTitle size="xs">
                        <h3>Index patterns</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiPanel color="subdued" paddingSize="s">
                        <EuiText size="s">
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>
                              <EuiCode>logs-endpoint.events.process-*</EuiCode>
                            </li>
                            <li>
                              <EuiCode>logs-system.security-*</EuiCode>
                            </li>
                            <li>
                              <EuiCode>endgame-*</EuiCode>
                            </li>
                            <li>
                              <EuiCode>winlogbeat-*</EuiCode>
                            </li>
                          </ul>
                        </EuiText>
                      </EuiPanel>

                      <EuiSpacer size="m" />

                      {/* Rule type */}
                      <EuiTitle size="xs">
                        <h3>Rule type</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s">
                        {rule.ruleType ? rule.ruleType.toUpperCase() : 'Query'}
                      </EuiText>

                      <EuiSpacer size="m" />

                      {/* Query */}
                      <EuiTitle size="xs">
                        <h3>{rule.ruleType === 'eql' ? 'EQL query' : 'Query'}</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiCodeBlock language="sql" fontSize="s" paddingSize="s">
{rule.ruleType === 'eql' 
  ? `sequence by host.id with maxspan=10s
  [process where event.type == "start" and
   process.name == "dns.exe" and
   not process.parent.name == "svchost.exe"]`
  : `event.type == "start" and
process.name: "${rule.name.split(' ')[0].toLowerCase()}" and
not process.parent.executable: *`}
                      </EuiCodeBlock>

                      <EuiSpacer size="m" />

                      {/* Timeline template */}
                      <EuiTitle size="xs">
                        <h3>Timeline template</h3>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      <EuiText size="s" color="subdued">
                        None
                      </EuiText>
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
