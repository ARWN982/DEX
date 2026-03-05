import React, { useState } from 'react';
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
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';

interface DetectionRule {
  id: string;
  name: string;
  riskScore: number;
  severity: 'Low' | 'Medium' | 'High';
  lastRun: string;
  lastResponse: 'Failed' | 'Succeeded';
  lastUpdated: string;
  notify: boolean;
  enabled: boolean;
  hasWarning: boolean;
  alertsCount: string;
  tagsCount: number;
}

const mockRules: DetectionRule[] = [
  {
    id: '1',
    name: 'Unusual Network Destination Domain Name',
    riskScore: 50,
    severity: 'High',
    lastRun: '29 minutes ago',
    lastResponse: 'Failed',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: true,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/1',
    tagsCount: 7,
  },
  {
    id: '2',
    name: 'Potential PowerShell HackTool Script by Author',
    riskScore: 50,
    severity: 'Low',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: false,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/6',
    tagsCount: 13,
  },
  {
    id: '3',
    name: 'Potential Widespread Malware Infection Across Multiple Hosts',
    riskScore: 50,
    severity: 'High',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: true,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/6',
    tagsCount: 14,
  },
  {
    id: '4',
    name: 'Route53 Resolver Query Log Configuration Deleted',
    riskScore: 50,
    severity: 'Medium',
    lastRun: '29 minutes ago',
    lastResponse: 'Failed',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: false,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/6',
    tagsCount: 12,
  },
  {
    id: '5',
    name: 'Potential File Download via a Headless Browser',
    riskScore: 50,
    severity: 'Low',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: true,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/5',
    tagsCount: 8,
  },
  {
    id: '6',
    name: 'EC2 AM Shared with Another Account',
    riskScore: 50,
    severity: 'Medium',
    lastRun: '29 minutes ago',
    lastResponse: 'Failed',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: false,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/3',
    tagsCount: 9,
  },
  {
    id: '7',
    name: 'Suspicious File Renamed via SMB',
    riskScore: 50,
    severity: 'Low',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: true,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/4',
    tagsCount: 11,
  },
  {
    id: '8',
    name: 'AWS EC2 Admin Credential Fetch via Assumed Role',
    riskScore: 50,
    severity: 'High',
    lastRun: '29 minutes ago',
    lastResponse: 'Failed',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: false,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/2',
    tagsCount: 10,
  },
  {
    id: '9',
    name: 'Unusual Execution via Microsoft Common Console File',
    riskScore: 50,
    severity: 'Medium',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: true,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/7',
    tagsCount: 15,
  },
  {
    id: '10',
    name: 'Unsigned DLL Loaded by a Trusted Process',
    riskScore: 50,
    severity: 'Low',
    lastRun: '29 minutes ago',
    lastResponse: 'Succeeded',
    lastUpdated: 'Sep 25, 2024 @ 20:11:41.666',
    notify: false,
    enabled: true,
    hasWarning: false,
    alertsCount: '0/8',
    tagsCount: 6,
  },
];

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

const mockMonitoringRules: MonitoringRule[] = [
  {
    id: '1',
    name: 'Unusual DNS Process of dns.exe',
    method: 'Modified',
    ruleId: '-8/0',
    status: '-1.5',
    queryTimeMax: '--',
    gapDuration: '--',
    lastRunFP: '--',
    unifiedPageDuration: '--',
    lastResponse: 'Warning',
    lastRun: '5 minutes ago',
    enabled: true,
  },
  {
    id: '2',
    name: 'System Shells via Services',
    method: 'Modified',
    ruleId: '-8/0',
    status: '-1.5',
    queryTimeMax: '--',
    gapDuration: '--',
    lastRunFP: '--',
    unifiedPageDuration: '--',
    lastResponse: 'Warning',
    lastRun: '5 minutes ago',
    enabled: true,
  },
  {
    id: '3',
    name: 'Web Shell Detection: Script Process Child of Common Web Processes',
    method: 'Modified',
    ruleId: '-8/0',
    status: '-7.0',
    queryTimeMax: '--',
    gapDuration: '--',
    lastRunFP: '--',
    unifiedPageDuration: '--',
    lastResponse: 'Warning',
    lastRun: '5 minutes ago',
    enabled: true,
  },
  {
    id: '4',
    name: 'UAC Bypass Attempt via Windows Directory Masquerading',
    method: 'Modified',
    ruleId: '-8/0',
    status: '-1.4',
    queryTimeMax: '--',
    gapDuration: '--',
    lastRunFP: '--',
    unifiedPageDuration: '--',
    lastResponse: 'Warning',
    lastRun: '5 minutes ago',
    enabled: true,
  },
];

const DetectionRulesPage: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<DetectionRule[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTab, setSelectedTab] = useState<'installed' | 'monitoring' | 'updates'>('installed');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
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
        return 'danger';
      default:
        return 'success';
    }
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
            <EuiLink href="#">
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
          {severity}
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
    totalItemCount: mockRules.length,
    pageSizeOptions: [10, 25, 50, 100],
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
      label: 'Installed Rules',
      count: 188,
    },
    {
      id: 'monitoring' as const,
      label: 'Rule Monitoring',
      count: 0,
    },
    {
      id: 'updates' as const,
      label: 'Rule Updates',
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
        minHeight: '100vh', 
        marginTop: 48,
        marginLeft: 80,
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ minHeight: 'calc(100vh - 64px)' }}>
          {/* Secondary Navigation Card */}
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
                selectedSection={selectedTab} 
                onSectionChange={(section) => setSelectedTab(section as 'installed' | 'monitoring' | 'updates')}
              />
            </EuiPanel>
          </EuiFlexItem>

          {/* Rules Panel Card */}
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
        {/* Page Header */}
        <div style={{ marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px' }}>
          <EuiPageHeader
            pageTitle="Rules"
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
                  <EuiButtonEmpty iconType="plusInCircle" size="s">
                    Add Elastic rules
                    <EuiBadge color="hollow" style={{ marginLeft: 8 }}>
                      1517
                    </EuiBadge>
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty iconType="download" size="s">
                    Manage value lists
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty iconType="importAction" size="s">
                    Import rules
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton iconType="plusInCircle" fill size="s">
                    Create new rule
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            ]}
          />
        </div>

        <EuiSpacer size="m" />

        {/* Tabs */}
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

        <EuiSpacer size="m" />

        {/* Search Bar and Filters - Single Row */}
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          {/* Search Bar - grows to fill space */}
          <EuiFlexItem grow={10}>
            <EuiFieldSearch
              placeholder='Rule name, index pattern (e.g., "filebeat-*"), or MITRE ATT&CK tactic or technique (e.g., "Def'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              isClearable={true}
              fullWidth
            />
          </EuiFlexItem>

          {/* Tags Filter */}
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              <EuiPopover
                button={
                  <EuiFilterButton
                    iconType="arrowDown"
                    iconSide="right"
                    onClick={() => setIsTagsPopoverOpen(!isTagsPopoverOpen)}
                    isSelected={isTagsPopoverOpen}
                    numFilters={46}
                    hasActiveFilters={false}
                  >
                    Tags
                  </EuiFilterButton>
                }
                isOpen={isTagsPopoverOpen}
                closePopover={() => setIsTagsPopoverOpen(false)}
                panelPaddingSize="none"
              >
                <EuiSelectable
                  searchable
                  searchProps={{
                    placeholder: 'Filter tags',
                    compressed: true,
                  }}
                  options={tagsOptions}
                  onChange={(newOptions) => setTagsOptions(newOptions)}
                >
                  {(list, search) => (
                    <div style={{ width: 300 }}>
                      <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
                      {list}
                    </div>
                  )}
                </EuiSelectable>
              </EuiPopover>
            </EuiFilterGroup>
          </EuiFlexItem>

          {/* Last Response Filter */}
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              <EuiPopover
                button={
                  <EuiFilterButton
                    iconType="arrowDown"
                    iconSide="right"
                    onClick={() => setIsResponsePopoverOpen(!isResponsePopoverOpen)}
                    isSelected={isResponsePopoverOpen}
                    numActiveFilters={3}
                    hasActiveFilters={true}
                  >
                    Last response
                  </EuiFilterButton>
                }
                isOpen={isResponsePopoverOpen}
                closePopover={() => setIsResponsePopoverOpen(false)}
                panelPaddingSize="none"
              >
                <EuiSelectable
                  allowExclusions
                  options={responseOptions}
                  onChange={(newOptions) => setResponseOptions(newOptions)}
                >
                  {(list) => (
                    <div style={{ width: 240 }}>
                      {list}
                    </div>
                  )}
                </EuiSelectable>
              </EuiPopover>
            </EuiFilterGroup>
          </EuiFlexItem>

          {/* Elastic rules / Custom rules - Button Group */}
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              <EuiFilterButton hasActiveFilters={true} withNext>
                Elastic rules (128)
              </EuiFilterButton>
              <EuiFilterButton hasActiveFilters={false}>
                Custom rules (2)
              </EuiFilterButton>
            </EuiFilterGroup>
          </EuiFlexItem>

          {/* Enabled / Disabled rules - Button Group */}
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              <EuiFilterButton hasActiveFilters={false} withNext>
                Enabled rules
              </EuiFilterButton>
              <EuiFilterButton hasActiveFilters={false}>
                Disabled rules
              </EuiFilterButton>
            </EuiFilterGroup>
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
                  Showing {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, mockRules.length)} of {mockRules.length} rules
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
                  onClick={() => setSelectedItems(mockRules)}
                >
                  Select all {mockRules.length} rules
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
              items={mockRules.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
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
                  render: (name: string) => (
                    <EuiLink href="#">
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
                pageSizeOptions: [10, 25, 50, 100],
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
              </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
};

export default DetectionRulesPage;
