import React, { useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiButton,
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
  method: string;
  runs: string;
  severity: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
  lastResponse: string;
  version: string;
  tags: string[];
  enabled: boolean;
  hasWarning: boolean;
}

const mockRules: DetectionRule[] = [
  {
    id: '1',
    name: 'Persistence via Scheduled Discovery/Setubot/Schtask Windows API Execution',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.123',
    lastResponse: '2.9s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Persistence'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '2',
    name: 'Msi.Exec Detection via Added Windows Shell or Command Web Processes',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'High',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.148',
    lastResponse: '7.0s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Execution'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '3',
    name: 'AWS SG (to any) EventTypes (e.g. Sensitive Entries on Window Matching',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Medium',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.149',
    lastResponse: '7.0s',
    version: 'V. 1.0 and later',
    tags: ['AWS', 'Configuration'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '4',
    name: 'Unusual Cobalt/detect Cmd Upstart',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'High',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.151',
    lastResponse: '2.8s',
    version: 'V. 1.0 and later',
    tags: ['Linux', 'Persistence'],
    enabled: true,
    hasWarning: true,
  },
  {
    id: '5',
    name: 'Andmed processes CMD',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.152',
    lastResponse: '2.8s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Defense Evasion'],
    enabled: false,
    hasWarning: false,
  },
  {
    id: '6',
    name: 'Possible Encoding Attempts via WScript Library',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.152',
    lastResponse: '2.8s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Execution'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '7',
    name: 'Regsvcs.EXE Service Cmd Uninstallation',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.152',
    lastResponse: '2.8s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Defense Evasion'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '8',
    name: 'Azure ML Studio Notebook',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.246',
    lastResponse: '7.1s',
    version: 'V. 1.0 and later',
    tags: ['Azure', 'Execution'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '9',
    name: 'Executing Default Calltab via VMToolsd',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.156',
    lastResponse: '2.8s',
    version: 'V. 1.0 and later',
    tags: ['Linux', 'Execution'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '10',
    name: 'Account Password Reset Remotely',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'High',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.204',
    lastResponse: '7.1s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Persistence'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '11',
    name: 'Encoding Default Calltab via VMToolsd',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'Low',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.292',
    lastResponse: '7.1s',
    version: 'V. 1.0 and later',
    tags: ['Linux', 'Execution'],
    enabled: true,
    hasWarning: false,
  },
  {
    id: '12',
    name: 'LDAP System Mutual Authentication Windows Directory Mutating',
    method: 'Modified',
    runs: 'Every 5m',
    severity: 'High',
    lastUpdated: 'Dec 5, 2024 at 17:17:27.304',
    lastResponse: '7.1s',
    version: 'V. 1.0 and later',
    tags: ['Windows', 'Credential Access'],
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
      width: '22%',
      sortable: true,
      render: (name: string, item: DetectionRule) => (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          {item.hasWarning && (
            <EuiFlexItem grow={false}>
              <EuiIcon type="alert" color="danger" size="m" />
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <EuiLink>
              <EuiText size="s">
                <strong>{name}</strong>
              </EuiText>
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'method',
      name: 'Method',
      width: '100px',
      render: (method: string) => (
        <EuiBadge color="hollow" style={{ fontSize: '11px' }}>
          {method}
        </EuiBadge>
      ),
    },
    {
      field: 'runs',
      name: 'Runs',
      width: '80px',
      sortable: true,
      render: (runs: string) => <EuiText size="xs">{runs}</EuiText>,
    },
    {
      field: 'severity',
      name: 'Severity',
      width: '100px',
      sortable: true,
      render: (severity: string) => (
        <EuiHealth color={getSeverityColor(severity)} style={{ fontSize: '12px' }}>
          {severity}
        </EuiHealth>
      ),
    },
    {
      field: 'lastUpdated',
      name: (
        <EuiToolTip content="Last updated">
          <span>
            Last updated <EuiIcon type="sortable" size="s" />
          </span>
        </EuiToolTip>
      ),
      width: '180px',
      sortable: true,
      render: (lastUpdated: string) => (
        <EuiText size="xs" color="subdued" style={{ whiteSpace: 'nowrap' }}>
          {lastUpdated}
        </EuiText>
      ),
    },
    {
      field: 'lastResponse',
      name: 'Last response',
      width: '110px',
      sortable: true,
      render: (lastResponse: string) => <EuiText size="xs">{lastResponse}</EuiText>,
    },
    {
      field: 'version',
      name: 'Version',
      width: '120px',
      render: (version: string) => (
        <EuiText size="xs" color="subdued">
          {version}
        </EuiText>
      ),
    },
    {
      field: 'tags',
      name: 'Tags',
      width: '140px',
      render: (tags: string[]) => (
        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
          {tags.slice(0, 2).map((tag, index) => (
            <EuiFlexItem key={index} grow={false}>
              <EuiBadge color="hollow" style={{ fontSize: '10px' }}>
                {tag}
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ),
    },
    {
      field: 'enabled',
      name: 'Enabled',
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
      width: '40px',
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
      
      <EuiPage paddingSize="l" style={{ marginTop: 48, marginLeft: navIsOpen ? 72 : 0 }}>
        <EuiPageBody>
        {/* Page Header */}
        <EuiPageHeader
          pageTitle="Rules"
          rightSideItems={[
            <EuiButton iconType="gear" color="text" size="s" key="settings">
              Settings
            </EuiButton>,
            <EuiButton iconType="plusInCircle" color="text" size="s" key="add-elastic">
              Add Elastic rules
            </EuiButton>,
            <EuiButtonIcon iconType="iInCircle" aria-label="Info" color="text" key="info" />,
            <EuiButton iconType="gear" color="text" size="s" key="manage">
              Manage rules
            </EuiButton>,
            <EuiButton iconType="importAction" color="text" size="s" key="import">
              Import rules
            </EuiButton>,
            <EuiButton iconType="plusInCircle" fill size="s" key="create">
              Create new rule
            </EuiButton>,
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
    </>
  );
};

export default DetectionRulesPage;
