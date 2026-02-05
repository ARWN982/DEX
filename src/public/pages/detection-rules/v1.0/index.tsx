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
  EuiCallOut,
  EuiLink,
  EuiPageSidebar,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';

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
  },
];

const DetectionRulesPage: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<DetectionRule[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTab, setSelectedTab] = useState<'installed' | 'monitoring' | 'updates'>('installed');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [navIsOpen, setNavIsOpen] = useState(true);

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
      width: '60px',
      render: () => (
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type="analyzeEvent" size="s" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIcon type="tag" size="s" />
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
      <SecurityHeader onMenuClick={() => setNavIsOpen(!navIsOpen)} />
      <SecuritySideNav isOpen={navIsOpen} onClose={() => setNavIsOpen(false)} />
      
      <div style={{ backgroundColor: 'white', minHeight: '100vh', marginTop: 48 }}>
        <EuiPage paddingSize="none" style={{ backgroundColor: 'white' }}>
          <EuiPageBody style={{ padding: '16px', backgroundColor: 'white' }}>
        {/* Page Header */}
        <EuiPageHeader
          pageTitle="Rules"
          rightSideItems={[
            <EuiButton iconType="plusInCircle" fill size="s" key="create">
              Create new rule
            </EuiButton>,
            <EuiButtonEmpty iconType="importAction" size="s" key="import">
              Import rules
            </EuiButtonEmpty>,
            <EuiButtonEmpty iconType="download" size="s" key="manage-value">
              Manage value lists
            </EuiButtonEmpty>,
            <EuiButtonEmpty iconType="plusInCircle" size="s" key="add-elastic">
              Add Elastic rules
              <EuiBadge color="hollow" style={{ marginLeft: 8 }}>
                1517
              </EuiBadge>
            </EuiButtonEmpty>,
            <EuiButtonEmpty iconType="gear" size="s" key="settings">
              Settings
            </EuiButtonEmpty>,
          ]}
        />

        <EuiSpacer size="m" />

        {/* Info Banner */}
        <EuiCallOut size="s" iconType="iInCircle">
          <EuiText size="s">
            In rule is one action per rule, built or created in version 7.13, multiple actions are no longer{' '}
            <EuiLink>Learn more</EuiLink>
          </EuiText>
        </EuiCallOut>

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
              <EuiBadge color="hollow" style={{ marginLeft: 8 }}>
                {tab.count}
              </EuiBadge>
            </EuiTab>
          ))}
        </EuiTabs>

        <EuiSpacer size="m" />

        {/* Search Bar */}
        <EuiFieldSearch
          placeholder="e.g. rule name, index pattern or MITRE ATT&CK tactic, if more or creation, multiple actions support"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          isClearable={true}
          fullWidth
        />

        <EuiSpacer size="s" />

        {/* Filter Buttons */}
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued">
              <strong>Tags: all</strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="arrowDown" iconSide="right" color="text">
              Last response
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="arrowDown" iconSide="right" color="text">
              Elastic rules: <strong style={{ marginLeft: 4 }}>Elastic</strong>
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="arrowDown" iconSide="right" color="text">
              Enabled status
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="arrowDown" iconSide="right" color="text">
              Monitoring status
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="m" />

        {/* Table */}
        {selectedTab === 'installed' && (
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
        )}

        {selectedTab === 'monitoring' && (
          <EuiText textAlign="center" color="subdued">
            <p>No monitoring data available</p>
          </EuiText>
        )}

        {selectedTab === 'updates' && (
          <EuiText textAlign="center" color="subdued">
            <p>No updates available</p>
          </EuiText>
        )}
        </EuiPageBody>
        </EuiPage>
      </div>
    </>
  );
};

export default DetectionRulesPage;
