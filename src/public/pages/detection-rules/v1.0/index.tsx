import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetectionSummaryPanel } from './components/DetectionSummaryPanel';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTabs,
  EuiTab,
  EuiFieldSearch,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiHealth,
  EuiBadge,
  EuiSwitch,
  EuiButtonIcon,
  EuiIcon,
  EuiText,
  EuiToolTip,
  EuiLink,
  EuiPageSidebar,
  EuiFilterButton,
  EuiFilterGroup,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiPanel,
  EuiCallOut,
  EuiAccordion,
  EuiHorizontalRule,
  EuiCheckbox,
  EuiFacetButton,
  EuiButtonGroup,
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
  hasWarning?: boolean;
  alertsCount: string;
  tagsCount: number;
}

// Process parsed rules to add alertsCount and tagsCount
const mockRules: DetectionRule[] = (parsedRulesData as any[]).map((rule, index) => ({
  ...rule,
  alertsCount: `0/${Math.floor(Math.random() * 10) + 1}`,
  tagsCount: rule.tags?.length || 0,
  hasWarning: false,
}));

interface MonitoringRule {
  id: string;
  name: string;
  method: string;
  ruleId: string;
  status: string;
  queryTimeMax: string;
  gapDuration: string;
  lastRunFP: string;
  unifiedPageDuration: string;
  lastResponse: 'Warning' | 'Failed' | 'Succeeded';
  lastRun: string;
  enabled: boolean;
}

// Convert detection rules to monitoring format
const mockMonitoringRules: MonitoringRule[] = mockRules.map((rule) => ({
  id: rule.id,
  name: rule.name,
  method: rule.ruleType === 'eql' ? 'EQL' : rule.ruleType === 'query' ? 'Query' : 'Modified',
  ruleId: `-${Math.floor(Math.random() * 10)}/${Math.floor(Math.random() * 2)}`,
  status: `-${(Math.random() * 10).toFixed(1)}`,
  queryTimeMax: '--',
  gapDuration: '--',
  lastRunFP: '--',
  unifiedPageDuration: '--',
  lastResponse: rule.lastResponse === 'Failed' ? 'Failed' : Math.random() > 0.7 ? 'Warning' : 'Succeeded',
  lastRun: rule.lastRun,
  enabled: rule.enabled,
}));

const DetectionRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<DetectionRule[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTab, setSelectedTab] = useState<'installed' | 'monitoring' | 'updates'>('installed');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showDeprecatedCallout, setShowDeprecatedCallout] = useState(true);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [aiSectionOpen, setAiSectionOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});

  const toggleFilterOpen = (filterId: string) => {
    setOpenFilters((prev) => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  const toggleFilterOption = (filterId: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterId] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [filterId]: updated };
    });
    // Reset pagination when filters change
    setPageIndex(0);
  };

  // Map rule type display names to ruleType field values
  const ruleTypeMap: Record<string, string[]> = {
    'ES|QL': ['esql'],
    'Custom query': ['query'],
    'Threshold': ['threshold'],
    'Event correlation': ['eql'],
    'Indicator match': ['threat_match'],
    'New terms': ['new_terms'],
    'Machine learning': ['machine_learning'],
  };

  // Apply all active filters to mockRules
  const filteredRules = mockRules.filter((rule) => {
    const sel = selectedFilters;

    // Rule type
    if (sel['rule-type']?.length) {
      const matchedTypes = sel['rule-type'].flatMap((o) => ruleTypeMap[o] || [o.toLowerCase()]);
      if (!matchedTypes.some((t) => rule.ruleType?.toLowerCase().includes(t))) return false;
    }

    // Severity
    if (sel['severity']?.length) {
      const severityMatch = sel['severity'].map((s) => s.toLowerCase());
      if (!severityMatch.includes(rule.severity?.toLowerCase())) return false;
    }

    // Last response
    if (sel['last-response']?.length) {
      if (!sel['last-response'].includes(rule.lastResponse)) return false;
    }

    // Status
    if (sel['status']?.length) {
      const wantEnabled = sel['status'].includes('Enabled');
      const wantDisabled = sel['status'].includes('Disabled');
      if (wantEnabled && !wantDisabled && !rule.enabled) return false;
      if (wantDisabled && !wantEnabled && rule.enabled) return false;
    }

    // MITRE ATT&CK tactic
    if (sel['mitre-tactic']?.length) {
      const tacticMatches = sel['mitre-tactic'].some((tactic) =>
        rule.mitreTactics?.some((t) => t.toLowerCase().includes(tactic.toLowerCase()))
      );
      if (!tacticMatches) return false;
    }

    // Tags (Domain: X, OS: X etc.)
    if (sel['tags']?.length) {
      const tagMatches = sel['tags'].some((tag) =>
        rule.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!tagMatches) return false;
    }

    // Use cases (tags prefixed with "Use Case:")
    if (sel['use-cases']?.length) {
      const ucMatches = sel['use-cases'].some((uc) =>
        rule.tags?.some((t) => t.toLowerCase().includes(uc.toLowerCase()))
      );
      if (!ucMatches) return false;
    }

    // Data source (tags prefixed with "Data Source:")
    if (sel['data-source']?.length) {
      const dsMatches = sel['data-source'].some((ds) =>
        rule.tags?.some((t) => t.toLowerCase().includes(ds.toLowerCase()))
      );
      if (!dsMatches) return false;
    }

    // Rule category (Elastic / Custom based on tags)
    if (sel['rule-category']?.length) {
      const isElastic = rule.tags?.some((t) => t.toLowerCase().includes('elastic'));
      const isCustom = !isElastic;
      const wantElastic = sel['rule-category'].some((c) => c.toLowerCase().includes('elastic'));
      const wantCustom = sel['rule-category'].includes('Custom');
      if (wantElastic && !isElastic) return false;
      if (wantCustom && !isCustom) return false;
    }

    return true;
  });
  
  // Filter popover states
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);
  const [isResponsePopoverOpen, setIsResponsePopoverOpen] = useState(false);
  
  // Filter options
  const [tagsOptions, setTagsOptions] = useState([
    { label: 'Windows' },
    { label: 'Linux' },
    { label: 'AWS' },
    { label: 'Azure' },
  ]);
  
  const [responseOptions, setResponseOptions] = useState([
    { label: 'Failed', checked: 'on' as const },
    { label: 'Succeeded', checked: 'on' as const },
    { label: 'Warning', checked: 'on' as const },
  ]);

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
  
  const capitalizeSeverity = (severity: string): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const columns: Array<EuiBasicTableColumn<DetectionRule>> = [
    {
      field: 'name',
      name: 'Rule',
      width: '30%',
      sortable: true,
      render: (name: string, item: DetectionRule) => (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiLink onClick={() => navigate(`/detection-rules/${item.id}`)}>
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {name}
              </EuiText>
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      name: '',
      width: '140px',
      render: (item: DetectionRule) => (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow" iconType="analyzeEvent" iconSide="left">
              {item.alertsCount}
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow" iconType="tag" iconSide="left">
              {item.tagsCount}
            </EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'riskScore',
      name: (
        <span>
          Risk score <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '100px',
      sortable: true,
      render: (riskScore: number) => (
        <EuiText size="xs">{riskScore}</EuiText>
      ),
    },
    {
      field: 'severity',
      name: (
        <span>
          Severity <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '120px',
      sortable: true,
      render: (severity: string) => (
        <EuiHealth color={getSeverityColor(severity)} style={{ fontSize: '12px', fontWeight: 500 }}>
          {capitalizeSeverity(severity)}
        </EuiHealth>
      ),
    },
    {
      field: 'lastRun',
      name: (
        <span>
          Last run <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '140px',
      sortable: true,
      render: (lastRun: string) => (
        <EuiText size="xs" style={{ fontSize: '12px' }}>
          {lastRun}
        </EuiText>
      ),
    },
    {
      field: 'lastResponse',
      name: (
        <span>
          Last response <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '140px',
      sortable: true,
      render: (lastResponse: 'Failed' | 'Succeeded') => (
        <EuiHealth 
          color={lastResponse === 'Failed' ? 'danger' : 'success'} 
          style={{ fontSize: '12px', fontWeight: 500 }}
        >
          {lastResponse}
        </EuiHealth>
      ),
    },
    {
      field: 'lastUpdated',
      name: (
        <span>
          Last updated <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '180px',
      sortable: true,
      render: (lastUpdated: string) => (
        <EuiText size="xs" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
          {lastUpdated}
        </EuiText>
      ),
    },
    {
      field: 'notify',
      name: (
        <span>
          Notify <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '80px',
      align: 'center',
      render: (notify: boolean) => (
        notify ? <EuiIcon type="bell" size="m" /> : null
      ),
    },
    {
      field: 'enabled',
      name: (
        <span>
          Enabled <EuiIcon type="sortable" size="s" />
        </span>
      ),
      width: '80px',
      align: 'center',
      render: (enabled: boolean) => (
        <EuiSwitch
          compressed
          checked={enabled}
          onChange={() => {}}
          showLabel={false}
          label=""
        />
      ),
    },
    {
      name: '',
      width: '50px',
      align: 'center',
      render: () => (
        <EuiButtonIcon
          iconType="boxesHorizontal"
          aria-label="More actions"
          color="text"
          size="s"
        />
      ),
    },
  ];

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: filteredRules.length,
    pageSizeOptions: [10, 20, 50, 100],
    showPerPageOptions: true,
  };

  const onTableChange = ({ page }: { page?: { index: number; size: number } }) => {
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
  };


  const tabs = [
    {
      id: 'installed' as const,
      label: 'Installed rules',
      count: mockRules.length,
    },
    {
      id: 'monitoring' as const,
      label: 'Rule monitoring',
      count: mockMonitoringRules.length,
    },
    {
      id: 'updates' as const,
      label: 'Rule updates',
      count: 0,
    },
  ];

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />
      
      {/* Gray Background Container */}
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
          {/* Secondary Navigation Card */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                height: '100%',
              }}
            >
              <RulesSecondaryNav 
                selectedSection="installed"
                onSectionChange={(section) => {
                  // Keep on Detection rules (SIEM) section since all tabs are part of it
                  if (section === 'installed') {
                    setSelectedTab('installed');
                  }
                }}
              />
            </EuiPanel>
          </EuiFlexItem>

          {/* Rules Panel Card */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Fixed top section - never scrolls */}
              <div style={{ padding: '24px 24px 0 24px', flexShrink: 0 }}>
        {/* Page Header */}
        <div style={{ marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px' }}>
          <EuiPageHeader
            pageTitle="Detection rules (SIEM)"
            responsive={false}
            paddingSize="none"
            rightSideItems={[
              <EuiFlexGroup gutterSize="s" responsive={false} wrap={false} key="buttons-group">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty iconType="gear" size="s">
                    Settings
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty iconType="plusInCircle" size="s" onClick={() => navigate('/detection-rules/add')}>
                    Add Elastic rules
                    <EuiBadge color="hollow" style={{ marginLeft: 8 }}>
                      1517
                    </EuiBadge>
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty iconType="download" size="s">
                    Manage exceptions
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    button={
                      <EuiButton
                        iconType="arrowDown"
                        iconSide="right"
                        fill
                        size="s"
                        onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                      >
                        Create new rule
                      </EuiButton>
                    }
                    isOpen={isCreateMenuOpen}
                    closePopover={() => setIsCreateMenuOpen(false)}
                    panelPaddingSize="none"
                    anchorPosition="downRight"
                  >
                    <div style={{ minWidth: 200 }}>
                      {[
                        { label: 'AI Rule creation', icon: 'sparkles', onClick: () => navigate('/detection-rules/create') },
                        { label: 'Manual Rule creation', icon: 'pencil', onClick: () => navigate('/detection-rules/create') },
                        { label: 'Import rules', icon: 'importAction', onClick: () => {} },
                        { label: 'Migrate rules', icon: 'merge', onClick: () => {} },
                      ].map(({ label, icon, onClick }) => (
                        <EuiButtonEmpty
                          key={label}
                          iconType={icon}
                          size="s"
                          color="text"
                          flush="both"
                          style={{ width: '100%', padding: '8px 16px', justifyContent: 'flex-start' }}
                          onClick={() => { setIsCreateMenuOpen(false); onClick(); }}
                        >
                          {label}
                        </EuiButtonEmpty>
                      ))}
                    </div>
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
            ]}
          />
        </div>

        <EuiSpacer size="xl" />

        {/* Detection Summary Panel (AI signal cards + AutoDEX strip) */}
        <DetectionSummaryPanel
          executionFailures={[
            { id: 'r1', name: 'Unusual Network Destination Domain Name', severity: 'high', contextLabel: 'Timeout after 30s · logs-endpoint.*', actionLabel: 'Diagnose', aiPrompt: 'Diagnose the execution failure for rule "Unusual Network Destination Domain Name"' },
            { id: 'r2', name: 'Route53 Resolver Query Log Configuration Deleted', severity: 'medium', contextLabel: 'Index not found · logs-aws.*', actionLabel: 'Diagnose', aiPrompt: 'Diagnose the execution failure for rule "Route53 Resolver Query Log Configuration Deleted"' },
            { id: 'r3', name: 'Suspicious File Renamed via SMB', severity: 'high', contextLabel: 'EQL parse error · logs-system.*', actionLabel: 'Diagnose', aiPrompt: 'Diagnose the execution failure for rule "Suspicious File Renamed via SMB"' },
          ]}
          highNoiseRules={[
            { id: 'n1', name: 'Potential PowerShell HackTool Script by Author', severity: 'medium', contextLabel: '340 alerts/week · 98% from backup-agent', actionLabel: 'Tune', aiPrompt: 'Show me tuning recommendations for "Potential PowerShell HackTool Script by Author"' },
            { id: 'n2', name: 'Unusual Execution via Microsoft Common Console File', severity: 'low', contextLabel: '210 alerts/week · 94% from dev-hosts', actionLabel: 'Tune', aiPrompt: 'Show me tuning recommendations for "Unusual Execution via Microsoft Common Console File"' },
            { id: 'n3', name: 'EC2 AMI Shared with Another Account', severity: 'medium', contextLabel: '180 alerts/week · 91% from ci-pipeline', actionLabel: 'Tune', aiPrompt: 'Show me tuning recommendations for "EC2 AMI Shared with Another Account"' },
          ]}
          coverageGaps={[
            { id: 'g1', name: 'Credential Dumping via Reg.exe', severity: 'critical', techniqueId: 'T1003', contextLabel: 'No rule covers this technique', actionLabel: 'Add rule', aiPrompt: 'Which prebuilt rules cover T1003 Credential Dumping via Reg.exe?' },
            { id: 'g2', name: 'DLL Side-Loading', severity: 'high', techniqueId: 'T1574.002', contextLabel: 'Partial coverage only', actionLabel: 'Add rule', aiPrompt: 'Which prebuilt rules cover T1574.002 DLL Side-Loading?' },
            { id: 'g3', name: 'Scheduled Task Creation', severity: 'high', techniqueId: 'T1053.005', contextLabel: 'No rule covers this technique', actionLabel: 'Add rule', aiPrompt: 'Which prebuilt rules cover T1053.005 Scheduled Task Creation?' },
            { id: 'g4', name: 'Token Impersonation', severity: 'high', techniqueId: 'T1134', contextLabel: 'No rule covers this technique', actionLabel: 'Add rule', aiPrompt: 'Which prebuilt rules cover T1134 Token Impersonation?' },
          ]}
          coveragePct={67}
          ruleUpdates={[
            { id: 'u1', name: 'Unusual Network Destination Domain Name', severity: 'high', contextLabel: 'v8.11 → v8.12 · 3 changes', changeDescription: 'Updated MITRE mapping and query performance', actionLabel: 'Review', aiPrompt: 'Summarise what changed in the latest update for "Unusual Network Destination Domain Name"' },
            { id: 'u2', name: 'Potential Widespread Malware Infection', severity: 'high', contextLabel: 'v3.2 → v3.3 · 1 change', changeDescription: 'Fixed false positive on backup processes', actionLabel: 'Review', aiPrompt: 'Summarise what changed in the latest update for "Potential Widespread Malware Infection"' },
            { id: 'u3', name: 'AWS EC2 Admin Credential Fetch', severity: 'medium', contextLabel: 'v2.1 → v2.2 · 2 changes', changeDescription: 'Improved detection coverage', actionLabel: 'Review', aiPrompt: 'Summarise what changed in the latest update for "AWS EC2 Admin Credential Fetch"' },
          ]}
          autoDex={{
            isRunning: true,
            lastRunAt: '3 min ago',
            fixedCount: 2,
            tunedCount: 5,
            installedCount: 4,
            updatedCount: 5,
          }}
          onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)}
          onViewRules={(category) => console.log('View rules:', category)}
          onNavigateToRule={(id) => navigate(`/detection-rules/${id}`)}
        />

        <EuiSpacer size="m" />

        {/* Tabs hidden on DEX-Vision branch */}
        <div style={{ display: 'none' }}>
          <EuiTabs size="l">
            {tabs.map((tab) => (
              <EuiTab
                key={tab.id}
                isSelected={selectedTab === tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setPageIndex(0);
                }}
              >
                {tab.label}
                <EuiBadge color="hollow" style={{ marginLeft: 8 }}>
                  {tab.count}
                </EuiBadge>
              </EuiTab>
            ))}
          </EuiTabs>
        </div>
              </div>

        {/* Scrollable section — filter + table only */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px', minHeight: 0 }}>
        <EuiSpacer size="m" />

        {/* Main content: Filter panel + Table */}
        <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false} style={{ flex: 1 }}>

          {/* Facet Filter Panel */}
          {isFilterPanelOpen && (
            <EuiFlexItem grow={false} style={{
              width: 236,
              flexShrink: 0,
              borderRight: '1px solid #d3dae6',
              paddingRight: 16,
              paddingTop: 4,
            }}>
              {/* Filters header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <EuiButtonIcon
                  iconType="transitionLeftOut"
                  aria-label="Collapse filters"
                  color="text"
                  size="s"
                  display="base"
                  onClick={() => setIsFilterPanelOpen(false)}
                  style={{ flexShrink: 0 }}
                />
                <EuiText size="s" style={{ fontWeight: 700, flex: 1 }}>Filters</EuiText>
                <EuiButtonEmpty size="xs" flush="right" color="primary">
                  Clear
                </EuiButtonEmpty>
              </div>

              {/* Filter accordions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {[
                  {
                    id: 'rule-category', label: 'Rule category', count: 3,
                    options: ['Elastic', 'Elastic modified', 'Custom'],
                  },
                  {
                    id: 'rule-type', label: 'Rule type', count: 7,
                    options: ['ES|QL', 'Custom query', 'Threshold', 'Event correlation', 'Indicator match', 'New terms', 'Machine learning'],
                  },
                  {
                    id: 'data-source', label: 'Data source', count: 13,
                    options: ['Active Directory', 'Amazon Web Services', 'Auditd Manager', 'AWS', 'AWS IAM', 'Crowdstrike', 'Elastic Defend', 'Elastic Endgame', 'Github', 'Microsoft Defender for Endpoint', 'Okta', 'PowerShell Logs', 'SentinelOne', 'Sysmon', 'System', 'Windows Security Event Logs'],
                  },
                  {
                    id: 'mitre-tactic', label: 'MITRE ATT&CK tactic', count: 14,
                    options: ['Initial Access', 'Persistence', 'Defense Evasion', 'Discovery', 'Collection', 'Impact', 'Reconnaissance', 'Credential Dumping', 'Remote Services', 'Supply Chain Compromise', 'Application Layer Protocol', 'Information Discovery', 'User Execution', 'Phishing', 'Cloud Service Provider', 'Access Token Manipulation'],
                  },
                  {
                    id: 'use-cases', label: 'Use cases', count: 6,
                    options: ['Active Directory Monitoring', 'Identity and Access Audit', 'Lateral Movement Detection', 'Log Auditing', 'Threat Detection', 'Vulnerability'],
                  },
                  {
                    id: 'tags', label: 'Tags', count: 8,
                    options: ['Domain: Cloud', 'Domain: Endpoint', 'OS: Linux', 'OS: Windows', 'Promotion: External Alerts', 'Resources: Investigation Guide', 'Threat: Lightning Framework', 'Threat: Orbit'],
                  },
                  {
                    id: 'status', label: 'Status', count: 2,
                    options: ['Enabled', 'Disabled'],
                  },
                  {
                    id: 'last-response', label: 'Last response', count: 3,
                    options: ['Succeeded', 'Warning', 'Failed'],
                  },
                  {
                    id: 'severity', label: 'Severity', count: 3,
                    options: ['Low', 'Medium', 'High'],
                  },
                ].map((filter) => {
                  const selected = selectedFilters[filter.id] || [];
                  const badgeCount = selected.length > 0 ? selected.length : filter.count;
                  const isOpen = !!openFilters[filter.id];

                  return (
                    <div key={filter.id}>
                      <EuiFacetButton
                        quantity={badgeCount}
                        isSelected={selected.length > 0}
                        onClick={() => toggleFilterOpen(filter.id)}
                        style={{ width: '100%', paddingRight: 0 }}
                        icon={
                          <EuiIcon
                            type={isOpen ? 'arrowDown' : 'arrowRight'}
                            size="s"
                          />
                        }
                      >
                        {filter.label}
                      </EuiFacetButton>

                      {isOpen && (
                        <div style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {filter.options.map((option) => (
                            <EuiCheckbox
                              key={option}
                              id={`${filter.id}-${option}`}
                              label={<EuiText size="xs">{option}</EuiText>}
                              checked={selected.includes(option)}
                              onChange={() => toggleFilterOption(filter.id, option)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </EuiFlexItem>
          )}

          {/* Table + search area */}
          <EuiFlexItem style={{ paddingLeft: isFilterPanelOpen ? 16 : 0, minWidth: 0, alignSelf: 'flex-start', width: '100%' }}>

            {/* Search Bar row — expand button sits inline when panel is collapsed */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              {!isFilterPanelOpen && (
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="transitionLeftIn"
                    aria-label="Expand filters"
                    color="text"
                    size="s"
                    display="base"
                    onClick={() => setIsFilterPanelOpen(true)}
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={true}>
                <EuiFieldSearch
                  placeholder='Rule name, index pattern (e.g., "filebeat-*"), or MITRE ATT&CK tactic or technique'
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  isClearable={true}
                  fullWidth
                />
              </EuiFlexItem>

            </EuiFlexGroup>

            <EuiSpacer size="m" />

            {/* Table */}
            {selectedTab === 'installed' && (
            <>
              {/* Table toolbar */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">
                  Showing {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, filteredRules.length)} of {filteredRules.length} rules
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">
                  Selected {selectedItems.length} rules
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="pagesSelect"
                  onClick={() => setSelectedItems(filteredRules)}
                >
                  Select all {filteredRules.length} rules
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="arrowDown"
                  iconSide="right"
                >
                  Bulk actions
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="refresh"
                >
                  Refresh
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="s" />

            <EuiBasicTable
              items={filteredRules.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
              columns={columns}
              itemId="id"
              selection={{
                selectable: () => true,
                onSelectionChange: setSelectedItems,
              }}
              tableLayout="auto"
              pagination={pagination}
              onChange={onTableChange}
            />
          </>
        )}

            {selectedTab === 'monitoring' && (
          <>
            <EuiPanel hasShadow={false} hasBorder={true} color="plain" paddingSize="m">
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s">
                        <strong>Rules with gaps</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="success">0/0</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="iInCircle" size="s" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s">
                        <strong>Auto gap fill status:</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="success">On</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>

            <EuiSpacer size="m" />

            {/* Monitoring table toolbar */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">
                  Showing {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, mockMonitoringRules.length)} of {mockMonitoringRules.length} rules
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">
                  Selected {selectedItems.length} rules
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="pagesSelect"
                  onClick={() => setSelectedItems(mockMonitoringRules as any)}
                >
                  Select all {mockMonitoringRules.length} rules
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="arrowDown"
                  iconSide="right"
                >
                  Bulk actions
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="xs"
                  iconType="refresh"
                >
                  Refresh
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="s" />

            <EuiBasicTable
              items={mockMonitoringRules.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
              columns={[
                {
                  field: 'name',
                  name: 'Rule',
                  width: '25%',
                  sortable: true,
                  render: (name: string, item: any) => (
                    <EuiLink onClick={() => navigate(`/detection-rules/${item.id}`)}>
                      <EuiText size="s" style={{ fontWeight: 600 }}>
                        {name}
                      </EuiText>
                    </EuiLink>
                  ),
                },
                {
                  field: 'method',
                  name: 'Method',
                  width: '100px',
                  sortable: true,
                  render: (method: string) => (
                    <EuiText size="xs">{method}</EuiText>
                  ),
                },
                {
                  field: 'ruleId',
                  name: (
                    <span>
                      Rule ID <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '80px',
                  sortable: true,
                  render: (ruleId: string) => (
                    <EuiText size="xs">{ruleId}</EuiText>
                  ),
                },
                {
                  field: 'status',
                  name: (
                    <span>
                      Status <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '80px',
                  sortable: true,
                  render: (status: string) => (
                    <EuiText size="xs">{status}</EuiText>
                  ),
                },
                {
                  field: 'queryTimeMax',
                  name: (
                    <span>
                      Query time max <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '120px',
                  sortable: true,
                  render: (queryTimeMax: string) => (
                    <EuiText size="xs">{queryTimeMax}</EuiText>
                  ),
                },
                {
                  field: 'gapDuration',
                  name: (
                    <span>
                      Gap till status <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '120px',
                  sortable: true,
                  render: (gapDuration: string) => (
                    <EuiText size="xs">{gapDuration}</EuiText>
                  ),
                },
                {
                  field: 'lastRunFP',
                  name: (
                    <span>
                      Last run FP <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '100px',
                  sortable: true,
                  render: (lastRunFP: string) => (
                    <EuiText size="xs">{lastRunFP}</EuiText>
                  ),
                },
                {
                  field: 'unifiedPageDuration',
                  name: (
                    <span>
                      Unified page duration <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '150px',
                  sortable: true,
                  render: (unifiedPageDuration: string) => (
                    <EuiText size="xs">{unifiedPageDuration}</EuiText>
                  ),
                },
                {
                  field: 'lastResponse',
                  name: (
                    <span>
                      Last response <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '140px',
                  sortable: true,
                  render: (lastResponse: 'Failed' | 'Succeeded' | 'Warning') => (
                    <EuiHealth 
                      color={lastResponse === 'Warning' ? 'warning' : lastResponse === 'Failed' ? 'danger' : 'success'} 
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    >
                      {lastResponse}
                    </EuiHealth>
                  ),
                },
                {
                  field: 'lastRun',
                  name: (
                    <span>
                      Last run <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '120px',
                  sortable: true,
                  render: (lastRun: string) => (
                    <EuiText size="xs">{lastRun}</EuiText>
                  ),
                },
                {
                  field: 'enabled',
                  name: (
                    <span>
                      Enabled <EuiIcon type="sortable" size="s" />
                    </span>
                  ),
                  width: '80px',
                  align: 'center',
                  render: (enabled: boolean) => (
                    <EuiSwitch
                      compressed
                      checked={enabled}
                      onChange={() => {}}
                      showLabel={false}
                      label=""
                    />
                  ),
                },
                {
                  name: '',
                  width: '50px',
                  align: 'center',
                  render: () => (
                    <EuiButtonIcon
                      iconType="boxesHorizontal"
                      aria-label="More actions"
                      color="text"
                      size="s"
                    />
                  ),
                },
              ]}
              itemId="id"
              tableLayout="auto"
              pagination={{
                pageIndex,
                pageSize,
                totalItemCount: mockMonitoringRules.length,
                pageSizeOptions: [10, 20, 50, 100],
                showPerPageOptions: true,
              }}
              onChange={onTableChange}
            />
          </>
        )}

            {selectedTab === 'updates' && (
              <EuiText textAlign="center" color="subdued">
                <p>No updates available</p>
              </EuiText>
            )}

          </EuiFlexItem>
        </EuiFlexGroup>
        </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
};

export default DetectionRulesPage;
