import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiHorizontalRule,
  EuiBadge,
  EuiIcon,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
  EuiBasicTable,
  EuiFacetButton,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

const suggestionCards = [
  {
    icon: 'addDataApp',
    iconColor: '#0077cc',
    title: 'Newly added integrations',
    desc: 'Locate all the rules for your newly added integrations.',
    action: 'Show rules',
  },
  {
    icon: 'users',
    iconColor: '#017d73',
    title: 'Rules Like Mine',
    desc: 'Show which rules are most commonly used by orgs with similar stack profiles.',
    action: 'Begin discovery',
  },
  {
    icon: 'machineLearningApp',
    iconColor: '#F5A700',
    title: 'Machine Learning',
    desc: 'Reference existing detection rules using Elastic ML jobs.',
    action: 'Show rules',
  },
];

const filterSections = [
  { id: 'use-cases',   label: 'Use cases',          count: 6  },
  { id: 'data-source', label: 'Data source',         count: 13 },
  { id: 'mitre',       label: 'MITRE ATT&CK tactic', count: 14 },
  { id: 'tags',        label: 'Tags',                count: 8  },
  { id: 'rule-type',   label: 'Rule type',           count: 7  },
  { id: 'severity',    label: 'Severity',            count: 3  },
  { id: 'data-status', label: 'Data status',         count: 3  },
];

const AddElasticRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isInstallConfigureOpen, setIsInstallConfigureOpen] = useState(false);
  const [isInstallLogsOpen, setIsInstallLogsOpen] = useState(false);
  const [installOn, setInstallOn] = useState(true);
  const [installAutoNew, setInstallAutoNew] = useState(true);
  const [installAutoUpdate, setInstallAutoUpdate] = useState(false);
  const [installThreshold, setInstallThreshold] = useState('medium');
  const [installLevel, setInstallLevel] = useState(2);
  const [activeView, setActiveView] = useState('suggestions');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});

  const toggleFilter = (id: string) =>
    setOpenFilters(prev => ({ ...prev, [id]: !prev[id] }));

  const rules = (parsedRulesData as any[]).slice(0, 40);
  const pageRules = rules.slice(0, 20);

  const getSeverityColor = (s: string) => {
    switch (s?.toLowerCase()) {
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
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Fixed header section */}
              <div style={{ padding: '20px 24px 0 24px', flexShrink: 0 }}>
                {/* Back button */}
                <EuiButtonEmpty
                  iconType="arrowLeft"
                  size="s"
                  onClick={() => navigate('/detection-rules')}
                  style={{ marginBottom: 12 }}
                >
                  Detection rules (SIEM)
                </EuiButtonEmpty>

                {/* Title + Install all */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} style={{ marginBottom: 20 }}>
                  <EuiFlexItem>
                    <EuiTitle size="l"><h1>Add Elastic rules</h1></EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton fill iconType="plusInCircle" size="s">
                      Install all
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Full-width horizontal divider */}
                <EuiHorizontalRule margin="none" />
              </div>

              {/* Scrollable content below divider */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false} style={{ flex: 1 }}>

                  {/* Filter sidebar — full height */}
                  {isFilterOpen && (
                    <EuiFlexItem grow={false} style={{
                      width: 236,
                      flexShrink: 0,
                      borderRight: '1px solid #d3dae6',
                      padding: '16px 16px 16px 24px',
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <EuiButtonIcon
                          iconType="transitionLeftOut"
                          aria-label="Collapse filters"
                          color="text"
                          size="s"
                          display="base"
                          onClick={() => setIsFilterOpen(false)}
                          style={{ height: 40, width: 40, borderRadius: 6, flexShrink: 0 }}
                        />
                        <EuiText size="s" style={{ fontWeight: 700, flex: 1 }}>Filters</EuiText>
                        <EuiButtonEmpty size="xs" color="primary" flush="right">Clear</EuiButtonEmpty>
                      </div>

                      {/* Filter sections */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filterSections.map((f) => (
                          <EuiFacetButton
                            key={f.id}
                            quantity={f.count}
                            onClick={() => toggleFilter(f.id)}
                            style={{ width: '100%', paddingRight: 0 }}
                            icon={<EuiIcon type={openFilters[f.id] ? 'arrowDown' : 'arrowRight'} size="s" />}
                          >
                            {f.label}
                          </EuiFacetButton>
                        ))}
                      </div>
                    </EuiFlexItem>
                  )}

                  {/* Main content */}
                  <EuiFlexItem style={{ minWidth: 0, padding: '16px 24px' }}>

                    {/* Search + button group + cards all in one bordered container */}
                    <div style={{ border: '1px solid #d3dae6', borderRadius: 6, padding: '12px', marginBottom: 16 }}>

                      {/* Search row */}
                      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
                        {!isFilterOpen && (
                          <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                              iconType="transitionLeftIn"
                              aria-label="Expand filters"
                              color="text"
                              size="s"
                              display="base"
                              onClick={() => setIsFilterOpen(true)}
                              style={{ height: 40, width: 40, borderRadius: 6 }}
                            />
                          </EuiFlexItem>
                        )}
                        <EuiFlexItem>
                          <EuiFieldSearch
                            placeholder="What do you want to detect?"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            fullWidth
                            isClearable
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      {/* EuiButtonGroup for Suggestions / Threats / Data sources */}
                      <EuiButtonGroup
                        legend="View selector"
                        options={[
                          { id: 'suggestions', label: 'Suggestions' },
                          { id: 'threats',     label: 'Threats' },
                          { id: 'data_sources',label: 'Data sources' },
                        ]}
                        idSelected={activeView}
                        onChange={(id) => setActiveView(id)}
                        buttonSize="s"
                        style={{ marginBottom: 12 }}
                      />

                      {/* Suggestion cards */}
                      <EuiFlexGroup gutterSize="m" responsive={false}>
                        {/* AutoDEX install card */}
                        <EuiFlexItem>
                          <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <EuiIcon type="sparkles" size="l" style={{ color: '#7B61FF', marginBottom: 12 }} />
                            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
                              <EuiFlexItem grow={false}>
                                <EuiText size="s" style={{ fontWeight: 700 }}>AutoDEX install</EuiText>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiBadge color="success">On</EuiBadge>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiText size="xs" color="subdued" style={{ flex: 1, marginBottom: 12 }}>
                              Let our agent discovery and install rules that are relevant to your organisation and set up as well as new threats.
                            </EuiText>
                            <EuiFlexGroup gutterSize="s" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiButtonEmpty size="xs" iconType="controlsHorizontal" color="primary" flush="left" onClick={() => setIsInstallConfigureOpen(true)}>
                                  Configure
                                </EuiButtonEmpty>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiButtonEmpty size="xs" iconType="list" color="primary" flush="left" onClick={() => setIsInstallLogsOpen(true)}>
                                  View logs
                                </EuiButtonEmpty>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiPanel>
                        </EuiFlexItem>

                        {/* Other suggestion cards */}
                        {suggestionCards.map((card) => (
                          <EuiFlexItem key={card.title}>
                            <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 8, display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <EuiIcon type={card.icon} size="l" style={{ color: card.iconColor, marginBottom: 10 }} />
                              <EuiText size="s" style={{ fontWeight: 700, marginBottom: 6 }}>{card.title}</EuiText>
                              <EuiText size="xs" color="subdued" style={{ flex: 1, marginBottom: 12 }}>{card.desc}</EuiText>
                              <div>
                                <EuiButtonEmpty size="xs" color="primary" flush="left">{card.action}</EuiButtonEmpty>
                              </div>
                            </EuiPanel>
                          </EuiFlexItem>
                        ))}
                      </EuiFlexGroup>
                    </div>{/* end bordered container */}

                    {/* Rules table */}
                    <EuiBasicTable
                      items={pageRules}
                      columns={[
                        {
                          field: 'name',
                          name: 'Rule name',
                          render: (name: string) => (
                            <EuiLink href="#">
                              <EuiText size="s" style={{ fontWeight: 600 }}>{name}</EuiText>
                            </EuiLink>
                          ),
                        },
                        {
                          name: '',
                          width: '110px',
                          render: () => (
                            <EuiFlexGroup gutterSize="xs" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow" iconType="visGauge" iconSide="left">0/2</EuiBadge>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow" iconType="tag" iconSide="left">4</EuiBadge>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          ),
                        },
                        {
                          field: 'riskScore',
                          name: 'Risk score',
                          width: '100px',
                          render: (score: number) => <EuiText size="s">{score || 123}</EuiText>,
                        },
                        {
                          field: 'severity',
                          name: 'Severity',
                          width: '110px',
                          render: (severity: string) => (
                            <EuiHealth color={getSeverityColor(severity)}>
                              {severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'High'}
                            </EuiHealth>
                          ),
                        },
                        {
                          name: '',
                          width: '80px',
                          render: () => (
                            <EuiButtonEmpty size="xs" color="primary" flush="right">Install</EuiButtonEmpty>
                          ),
                        },
                        {
                          name: '',
                          width: '40px',
                          render: () => (
                            <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" />
                          ),
                        },
                      ]}
                      itemId="id"
                      selection={{
                        selectable: () => true,
                        onSelectionChange: () => {},
                      }}
                      pagination={{
                        pageIndex: 0,
                        pageSize: 20,
                        totalItemCount: rules.length,
                        pageSizeOptions: [10, 20, 50],
                        showPerPageOptions: true,
                      }}
                      onChange={() => {}}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* AutoDEX Install — Configure modal */}
      {isInstallConfigureOpen && (
        <EuiModal onClose={() => setIsInstallConfigureOpen(false)} style={{ width: 672 }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}><EuiIcon type="sparkles" color="#7B61FF" /></EuiFlexItem>
                <EuiFlexItem>AutoDEX Install Configuration</EuiFlexItem>
              </EuiFlexGroup>
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiHorizontalRule margin="none" />
          <EuiModalBody>
            <EuiSpacer size="s" />
            <EuiTitle size="xs"><h3>Automatic installation scope</h3></EuiTitle>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">Choose which rules AutoDEX can install automatically.</EuiText>
            <EuiSpacer size="l" />
            {[
              { label: 'Install new Elastic prebuilt rules', desc: 'Automatically install rules that fill detected MITRE coverage gaps for your stack.', value: installAutoNew, set: setInstallAutoNew },
              { label: 'Auto-update installed rules', desc: 'Apply new versions of installed prebuilt rules when they are released.', value: installAutoUpdate, set: setInstallAutoUpdate },
            ].map(({ label, desc, value, set }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <EuiSwitch label={<strong>{label}</strong>} checked={value} onChange={e => set(e.target.checked)} />
                <EuiText size="xs" color="subdued" style={{ marginTop: 6, marginLeft: 44 }}>{desc}</EuiText>
              </div>
            ))}
            <EuiSpacer size="m" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />
            <EuiTitle size="xs"><h3>Automation level</h3></EuiTitle>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">Control how much AutoDEX installs without approval.</EuiText>
            <EuiSpacer size="l" />
            <EuiRange min={1} max={3} value={installLevel} onChange={e => setInstallLevel(Number((e.target as HTMLInputElement).value))} showTicks tickInterval={1} ticks={[{ label: 'Suggest only', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
            <EuiSpacer size="m" />
            <EuiText size="xs" color="subdued">
              {installLevel === 1 && 'AutoDEX will only recommend rules to install. No changes made without your approval.'}
              {installLevel === 2 && 'AutoDEX installs low-risk rules automatically and queues others for approval.'}
              {installLevel === 3 && 'AutoDEX installs all matching rules automatically. Review them in logs at any time.'}
            </EuiText>
            <EuiSpacer size="m" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />
            <EuiTitle size="xs"><h3>Approval threshold</h3></EuiTitle>
            <EuiSpacer size="m" />
            <EuiSelect options={[{ value: 'low', text: 'Low risk and above' }, { value: 'medium', text: 'Medium risk and above (recommended)' }, { value: 'high', text: 'High risk only' }, { value: 'none', text: 'Never ask for approval' }]} value={installThreshold} onChange={e => setInstallThreshold(e.target.value)} fullWidth />
            <EuiSpacer size="s" />
          </EuiModalBody>
          <EuiHorizontalRule margin="none" />
          <EuiModalFooter>
            <EuiButtonEmpty onClick={() => setIsInstallConfigureOpen(false)}>Cancel</EuiButtonEmpty>
            <EuiButton fill color="primary" onClick={() => setIsInstallConfigureOpen(false)}>Save configuration</EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}

      {/* AutoDEX Install — View logs flyout */}
      {isInstallLogsOpen && (
        <EuiFlyout onClose={() => setIsInstallLogsOpen(false)} size="m" ownFocus={false}>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}><EuiIcon type="sparkles" style={{ color: '#7B61FF' }} /></EuiFlexItem>
                  <EuiFlexItem>AutoDEX Install Activity Log</EuiFlexItem>
                </EuiFlexGroup>
              </h2>
            </EuiTitle>
            <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>Rules installed and updated automatically by AutoDEX.</EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            {[
              { id: '1', timestamp: 'Apr 15, 2026 @ 14:22:07', action: 'Installed rule', actionColor: 'primary' as const, rule: 'AWS IAM Assume Role Policy Update', reasoning: 'Your environment has AWS CloudTrail data. This rule covers T1078.004 (Cloud Accounts), identified as a coverage gap. AutoDEX installed and enabled it automatically.' },
              { id: '2', timestamp: 'Apr 15, 2026 @ 13:55:11', action: 'Installed rule', actionColor: 'primary' as const, rule: 'GCP Pub/Sub Subscription Deletion', reasoning: 'GCP audit logs detected in your environment. This rule covers T1562.008 (Disable Cloud Logs). AutoDEX installed it to fill the gap.' },
              { id: '3', timestamp: 'Apr 15, 2026 @ 13:38:02', action: 'Updated rule', actionColor: 'primary' as const, rule: 'Potential Widespread Malware Infection', reasoning: 'Version 3.2→3.3: Elastic Security Labs released a fix for false positives caused by legitimate antivirus scanning. AutoDEX applied the update.' },
              { id: '4', timestamp: 'Apr 15, 2026 @ 13:10:45', action: 'Installed rule', actionColor: 'primary' as const, rule: 'Kubernetes Pod Created in Kube Namespace', reasoning: 'Kubernetes audit logs present in your stack. Rule covers T1610 (Deploy Container). AutoDEX installed it as part of container coverage gap filling.' },
            ].map((log, i, arr) => (
              <div key={log.id}>
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
                  <EuiFlexItem grow={false}><EuiIcon type="checkInCircleFilled" color="success" size="s" /></EuiFlexItem>
                  <EuiFlexItem grow={false}><EuiBadge color={log.actionColor}>{log.action}</EuiBadge></EuiFlexItem>
                  <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">{log.timestamp}</EuiText></EuiFlexItem>
                </EuiFlexGroup>
                <EuiText size="s" style={{ fontWeight: 700, marginBottom: 10 }}>{log.rule}</EuiText>
                <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ borderRadius: 6, background: '#F7F9FF', marginBottom: 10 }}>
                  <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 6 }}>Reasoning</EuiText>
                  <EuiText size="s">{log.reasoning}</EuiText>
                </EuiPanel>
                <EuiFlexGroup gutterSize="s" responsive={false}>
                  <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" iconType="inspect" color="primary" flush="left">View rule</EuiButtonEmpty></EuiFlexItem>
                  <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" iconType="productAgent" flush="left" style={{ color: '#7B61FF' }}>Add to chat</EuiButtonEmpty></EuiFlexItem>
                </EuiFlexGroup>
                {i < arr.length - 1 && <EuiHorizontalRule margin="m" />}
              </div>
            ))}
          </EuiFlyoutBody>
          <EuiFlyoutFooter>
            <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
              <EuiFlexItem grow={false}><EuiButtonEmpty iconType="download" color="primary">Export logs</EuiButtonEmpty></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setIsInstallLogsOpen(false)}>Close</EuiButtonEmpty></EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
        </EuiFlyout>
      )}
    </>
  );
};

export default AddElasticRulesPage;
