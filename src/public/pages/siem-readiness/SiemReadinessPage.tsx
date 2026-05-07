/**
 * SIEM Readiness — prototype matching:
 * x-pack/solutions/security/plugins/security_solution/public/siem_readiness
 * Ref: b82902bcd072892a944d2241ae685228d3f5d1d4
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiAccordion,
  EuiBadge,
  EuiBetaBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCallOut,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiPageHeader,
  EuiPageSection,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import type { EuiBasicTableColumn } from '@elastic/eui';
import SecurityHeader from '../detection-rules/v1.0/components/SecurityHeader';
import SecuritySideNav from '../detection-rules/v1.0/components/SecuritySideNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type VisibilityStatus = 'healthy' | 'actionsRequired' | 'noData';
type VisibilityTabId  = 'coverage' | 'quality' | 'continuity' | 'retention';

// ─── Secondary nav ────────────────────────────────────────────────────────────

const SiemSecondaryNav: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isActive  = (p: string) => location.pathname === p;
  const itemStyle = { height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13 };
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#1d2a3e', paddingLeft: 4, marginBottom: 4, marginTop: 8 };

  return (
    <div style={{ width: 220, padding: '16px 12px', minHeight: 'calc(100vh - 64px)' }}>
      <p style={sectionTitle}>Launchpad</p>
      <EuiListGroup flush gutterSize="none" style={{ marginBottom: 4 }}>
        <EuiListGroupItem label={<span style={{ fontSize: 13 }}>Get started</span>} onClick={() => {}} style={itemStyle} />
        <EuiListGroupItem
          label={<span style={{ fontSize: 13, color: isActive('/siem-readiness') ? '#1750BA' : undefined, fontWeight: isActive('/siem-readiness') ? 600 : 400 }}>SIEM Readiness</span>}
          onClick={() => navigate('/siem-readiness')}
          isActive={isActive('/siem-readiness')}
          style={itemStyle}
        />
        <EuiListGroupItem label={<span style={{ fontSize: 13 }}>Value report</span>} onClick={() => {}} style={itemStyle} />
      </EuiListGroup>
      <EuiSpacer size="s" />
      <p style={{ ...sectionTitle, marginTop: 12 }}>Migrations</p>
      <EuiListGroup flush gutterSize="none">
        <EuiListGroupItem label={<span style={{ fontSize: 13 }}>Manage automatic migrations</span>} onClick={() => {}} style={{ ...itemStyle, height: 'auto', paddingTop: 6, paddingBottom: 6 }} />
        <EuiListGroupItem label={<span style={{ fontSize: 13 }}>Translated rules</span>} onClick={() => {}} style={itemStyle} />
        <EuiListGroupItem label={<span style={{ fontSize: 13 }}>Translated dashboards</span>} onClick={() => {}} style={itemStyle} />
      </EuiListGroup>
    </div>
  );
};

// ─── Visibility section boxes (pillar cards) ──────────────────────────────────

interface VisibilityBox {
  id: VisibilityTabId;
  title: string;
  status: VisibilityStatus;
  icon: string;
  descriptions: Record<VisibilityStatus, string>;
}

const BOXES: VisibilityBox[] = [
  { id: 'coverage',   title: 'Coverage',   status: 'actionsRequired', icon: 'securitySignalResolved',
    descriptions: { healthy: 'All enabled rules have required integrations.', actionsRequired: 'Integrations required for some enabled rules.', noData: 'You have not installed and enabled any rules yet.' } },
  { id: 'quality',    title: 'Quality',    status: 'actionsRequired', icon: 'inspect',
    descriptions: { healthy: 'ECS Compatibility is healthy.', actionsRequired: 'ECS Incompatibility Detected.', noData: 'No data to check yet.' } },
  { id: 'continuity', title: 'Continuity', status: 'actionsRequired',  icon: 'visArea',
    descriptions: { healthy: 'Ingest pipeline is healthy.', actionsRequired: 'Ingest pipeline failures occurred.', noData: 'No data currently being ingested.' } },
  { id: 'retention',  title: 'Retention',  status: 'noData',          icon: 'clock',
    descriptions: { healthy: 'All Lifecycle Policies meet requirements.', actionsRequired: 'Some Lifecycle Policies need increasing.', noData: 'No data in Lifecycle management.' } },
];

const BADGE_CONFIG: Record<VisibilityStatus, { label: string; color: string; icon: string }> = {
  healthy:         { label: 'Healthy',          color: 'success', icon: 'check'     },
  actionsRequired: { label: 'Actions required', color: 'warning', icon: 'warning'   },
  noData:          { label: 'No data',          color: 'default', icon: 'iInCircle' },
};

const VisibilitySectionBoxes: React.FC<{ selectedTabId: VisibilityTabId; onTabSelect: (id: VisibilityTabId) => void }> = ({ selectedTabId, onTabSelect }) => {
  const { euiTheme } = useEuiTheme();
  return (
    <EuiFlexGroup gutterSize="m" responsive={false}>
      {BOXES.map((box) => {
        const isSelected = selectedTabId === box.id;
        const badge      = BADGE_CONFIG[box.status];
        return (
          <EuiFlexItem key={box.id}>
            <EuiPanel hasBorder paddingSize="m" onClick={() => onTabSelect(box.id)} style={{
              cursor: 'pointer', minHeight: 120, textAlign: 'left',
              background: isSelected ? euiTheme.colors.highlight : euiTheme.colors.emptyShade,
              outline: isSelected ? `2px solid ${euiTheme.colors.primary}` : 'none',
              outlineOffset: -1,
            }}>
              <EuiFlexGroup gutterSize="s" alignItems="flexStart" justifyContent="spaceBetween" responsive={false}>
                <EuiFlexItem>
                  <EuiTitle size="xs"><h3 style={{ color: euiTheme.colors.primary }}>{box.title}</h3></EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiBadge color={badge.color} iconType={badge.icon} style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{badge.label}</EuiBadge>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              <EuiFlexGroup alignItems="flexEnd" justifyContent="spaceBetween" responsive={false} gutterSize="s">
                <EuiFlexItem>
                  <EuiText size="s" color="subdued"><p style={{ fontSize: 12, margin: 0 }}>{box.descriptions[box.status]}</p></EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={box.icon} size="xl" color="subdued" />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};

// ─── Section header (title left, actions right) ───────────────────────────────

const SectionHeader: React.FC<{ title: string; caseCount?: number }> = ({ title, caseCount = 0 }) => (
  <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s" style={{ marginBottom: 12 }}>
    <EuiFlexItem grow={false}>
      <EuiTitle size="xs"><h3>{title}</h3></EuiTitle>
    </EuiFlexItem>
    <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center" style={{ flexShrink: 0 }}>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary" data-test-subj="viewCases">
          View Cases&nbsp;<EuiBadge color="hollow">{caseCount}</EuiBadge>
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary" data-test-subj="createCase">
          Create new case
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiFlexGroup>
);

// ─── Coverage tab ─────────────────────────────────────────────────────────────

interface IntegrationRow { id: string; label: string; statusColor: 'success' | 'danger'; count: number }
interface CategoryRow    { id: string; category: string; hasData: boolean; rulesCount: number }

const INTEGRATION_ROWS: IntegrationRow[] = [
  { id: 'enabled', label: 'Enabled Integrations',             statusColor: 'success', count: 0 },
  { id: 'missing', label: 'Missing or Disabled Integrations', statusColor: 'danger',  count: 0 },
];

// Category order matches real Kibana: CATEGORY_ORDER in data_coverage_panel.tsx
// hasData = totalDocs > 0 from mainCategoriesMap
const CATEGORY_ROWS: CategoryRow[] = [
  { id: 'endpoint',   category: 'Endpoint',         hasData: true,  rulesCount: 24 },
  { id: 'identity',   category: 'Identity',          hasData: false, rulesCount: 17 },
  { id: 'network',    category: 'Network',           hasData: false, rulesCount: 75 },
  { id: 'cloud',      category: 'Cloud',             hasData: false, rulesCount: 61 },
  { id: 'appsaas',   category: 'Application/SaaS',  hasData: false, rulesCount: 17 },
];

const CoverageTab: React.FC = () => {
  const [ruleFilter, setRuleFilter] = useState<'all' | 'mitre'>('all');

  const integrationColumns: Array<EuiBasicTableColumn<IntegrationRow>> = [
    {
      field: 'label', name: 'Data Source status',
      render: (label: string, row: IntegrationRow) => <EuiHealth color={row.statusColor}>{label}</EuiHealth>,
    },
    { field: 'count', name: '# of rules associated', width: '200px' },
    {
      name: 'Actions', width: '220px',
      render: (row: IntegrationRow) => (
        <EuiButtonEmpty size="xs" color="primary">
          View Integrations&nbsp;<EuiBadge color="hollow">{row.count}</EuiBadge>
        </EuiButtonEmpty>
      ),
    },
  ];

  // Matches data_coverage_panel.tsx: 'Has data' / 'Missing data'
  const hasMissingData = CATEGORY_ROWS.some((r) => !r.hasData);
  const missingCount   = CATEGORY_ROWS.filter((r) => !r.hasData).length;

  const categoryColumns: Array<EuiBasicTableColumn<CategoryRow>> = [
    { field: 'category', name: 'Log Category' },
    {
      name: 'Coverage status', width: '200px',
      render: (row: CategoryRow) => (
        <EuiBadge color={row.hasData ? 'success' : 'warning'} iconType={row.hasData ? 'check' : 'alert'}>
          {row.hasData ? 'Has data' : 'Missing data'}
        </EuiBadge>
      ),
    },
    {
      name: 'Action', width: '220px',
      render: (row: CategoryRow) => (
        <EuiButtonEmpty size="xs" color="primary">
          View Integrations&nbsp;<EuiBadge color="hollow">{row.rulesCount}</EuiBadge>
        </EuiButtonEmpty>
      ),
    },
  ];

  return (
    <div>
      {/* Data rule coverage */}
      <EuiPanel hasBorder paddingSize="m">
        <SectionHeader title="Data rule coverage" />

        <EuiCallOut color="warning" size="s">
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}><EuiIcon type="warning" color="warning" size="m" /></EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>No rules are currently enabled</strong>
                <br />
                <span style={{ color: '#69707D' }}>
                  Get started by installing and enabling rules in{' '}
                  <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>detection rules</EuiButtonEmpty>.
                </span>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiCallOut>

        <EuiSpacer size="m" />

        <EuiButtonGroup
          legend="Rule filter"
          options={[{ id: 'all', label: 'All enabled rules' }, { id: 'mitre', label: 'MITRE ATT&CK enabled rules' }]}
          idSelected={ruleFilter}
          onChange={(id) => setRuleFilter(id as 'all' | 'mitre')}
          buttonSize="s"
          color="primary"
        />

        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
          The following table shows the total number of enabled rules, and those with missing or disabled integrations.
        </EuiText>

        <EuiFlexGroup gutterSize="xl" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: '16px solid #00BFB3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <EuiText textAlign="center">
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1d2a3e' }}>0</p>
                <p style={{ fontSize: 10, color: '#69707D', margin: 0 }}>Total enabled<br />rules</p>
              </EuiText>
            </div>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiBasicTable<IntegrationRow>
              items={INTEGRATION_ROWS}
              columns={integrationColumns}
              itemId="id"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Data coverage */}
      <EuiPanel hasBorder paddingSize="m">
        <SectionHeader title="Data coverage" />

        {/* Warning callout when categories have missing data — matches data_coverage_panel.tsx */}
        {hasMissingData && (
          <>
            <EuiCallOut
              color="warning"
              size="s"
              title={`Some log categories are missing required integrations.`}
            >
              <EuiText size="s">
                <p>
                  {missingCount} log categor{missingCount === 1 ? 'y is' : 'ies are'} missing integrations,
                  limiting visibility and detection coverage. Create a case to install the missing integrations
                  or view <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>docs</EuiButtonEmpty> for more information.
                </p>
              </EuiText>
            </EuiCallOut>
            <EuiSpacer size="m" />
          </>
        )}

        <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
          View the coverage status for each log category below to ensure you have incoming data.
        </EuiText>
        <EuiBasicTable<CategoryRow>
          items={CATEGORY_ROWS}
          columns={categoryColumns}
          itemId="id"
        />
      </EuiPanel>
    </div>
  );
};

// ─── Placeholder tabs ─────────────────────────────────────────────────────────

// ─── CategoryAccordion helper (replaces Kibana's CategoryAccordionTable) ─────

interface CategoryAccordionProps<T extends Record<string, unknown>> {
  id: string;
  category: string;
  items: T[];
  columns: Array<EuiBasicTableColumn<T>>;
  extraAction: React.ReactNode;
}

function CategoryAccordion<T extends Record<string, unknown>>({ id, category, items, columns, extraAction }: CategoryAccordionProps<T>) {
  return (
    <EuiAccordion
      id={id}
      buttonContent={<EuiText size="s"><strong>{category}</strong></EuiText>}
      extraAction={extraAction}
      paddingSize="m"
      borders="all"
    >
      <EuiBasicTable<T> items={items} columns={columns} />
    </EuiAccordion>
  );
}

// ─── Quality tab ──────────────────────────────────────────────────────────────

interface QualityIndex { indexName: string; incompatibleFieldCount: number; checkedAt: string; status: 'incompatible' | 'healthy'; [key: string]: unknown }
interface QualityCategory { category: string; items: QualityIndex[] }

const QUALITY_MOCK: QualityCategory[] = [
  { category: 'Endpoint', items: [
    { indexName: 'logs-endpoint.events.process-default', incompatibleFieldCount: 2, checkedAt: '3 minutes ago', status: 'incompatible' },
    { indexName: 'logs-endpoint.events.network-default', incompatibleFieldCount: 1, checkedAt: '3 minutes ago', status: 'incompatible' },
    { indexName: 'logs-endpoint.alerts-default',         incompatibleFieldCount: 0, checkedAt: '3 minutes ago', status: 'healthy'      },
  ]},
  { category: 'Identity', items: [
    { indexName: 'logs-okta.system-default', incompatibleFieldCount: 0, checkedAt: '5 minutes ago', status: 'healthy' },
  ]},
  { category: 'Network', items: [
    { indexName: 'auditbeat-8.0.0-2024.01.01', incompatibleFieldCount: 3, checkedAt: '4 minutes ago', status: 'incompatible' },
    { indexName: 'filebeat-8.0.0-2024.01.01',  incompatibleFieldCount: 0, checkedAt: '4 minutes ago', status: 'healthy'      },
  ]},
  { category: 'Cloud', items: [
    { indexName: 'filebeat-aws.cloudtrail-default', incompatibleFieldCount: 0, checkedAt: '6 minutes ago', status: 'healthy' },
  ]},
  { category: 'Application/SaaS', items: [
    { indexName: 'logs-google_workspace.admin-default', incompatibleFieldCount: 0, checkedAt: '5 minutes ago', status: 'healthy' },
  ]},
];

const qualityColumns: Array<EuiBasicTableColumn<QualityIndex>> = [
  { field: 'indexName', name: 'Indices', truncateText: true, width: '40%' },
  { field: 'incompatibleFieldCount', name: 'Incompatible fields', width: '15%',
    render: (n: number) => <EuiBadge color={n > 0 ? 'warning' : 'hollow'}>{n}</EuiBadge> },
  { field: 'checkedAt', name: 'Last checked', width: '15%' },
  { field: 'status', name: 'Status', width: '15%',
    render: (s: string) => <EuiBadge color={s === 'incompatible' ? 'warning' : 'success'}>{s === 'incompatible' ? 'Incompatible' : 'Healthy'}</EuiBadge> },
  { name: 'Actions', width: '15%',
    render: () => <EuiButtonEmpty size="xs" color="primary" href="#">View Data quality</EuiButtonEmpty> },
];

const QualityTab: React.FC = () => {
  const totalIncompatible = QUALITY_MOCK.flatMap((c) => c.items).filter((i) => i.status === 'incompatible').length;
  const hasIncompatible = totalIncompatible > 0;
  return (
    <>
      {hasIncompatible && (
        <>
          <EuiCallOut title={`${totalIncompatible} indices have ECS compatibility issues.`} color="warning" iconType="warning">
            <EuiText size="s"><p>Schema errors can stop rules, dashboards, and correlations from working correctly.</p></EuiText>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}
      <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
        See which indices fail ECS checks or have missing fields. Schema errors can stop rules, dashboards, and correlations from working correctly.
      </EuiText>
      <EuiFlexGroup justifyContent="flexEnd" responsive={false} gutterSize="xs" style={{ marginBottom: 12 }}>
        {hasIncompatible && <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty></EuiFlexItem>}
      </EuiFlexGroup>
      <EuiFlexGroup direction="column" gutterSize="m" responsive={false}>
        {QUALITY_MOCK.map((cat) => {
          const incompatFields = cat.items.reduce((s, i) => s + i.incompatibleFieldCount, 0);
          const affected       = cat.items.filter((i) => i.status === 'incompatible').length;
          const hasIssues      = incompatFields > 0;
          return (
            <EuiFlexItem key={cat.category}>
              <CategoryAccordion<QualityIndex>
                id={`quality-${cat.category}`}
                category={cat.category}
                items={cat.items}
                columns={qualityColumns}
                extraAction={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiBadge color={hasIssues ? 'warning' : 'success'}>{hasIssues ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">| Incompatible Fields: <strong>{incompatFields}</strong> | Affected indices: <strong>{affected}/{cat.items.length}</strong></EuiText></EuiFlexItem>
                  </EuiFlexGroup>
                }
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </>
  );
};

// ─── Continuity tab ───────────────────────────────────────────────────────────

interface PipelineRow { name: string; docsCount: number; failedDocsCount: number; failureRate: string; status: 'healthy' | 'critical'; category: string; [key: string]: unknown }

const CONTINUITY_MOCK: Array<{ category: string; items: PipelineRow[] }> = [
  { category: 'Endpoint', items: [
    { name: 'logs-endpoint.events.process@pipeline', docsCount: 1_240_000, failedDocsCount: 0,    failureRate: '0.0', status: 'healthy',  category: 'Endpoint' },
    { name: 'logs-endpoint.alerts@pipeline',         docsCount: 85_000,    failedDocsCount: 0,    failureRate: '0.0', status: 'healthy',  category: 'Endpoint' },
  ]},
  { category: 'Identity', items: [
    { name: 'logs-okta.system@pipeline', docsCount: 10_200, failedDocsCount: 0, failureRate: '0.0', status: 'healthy', category: 'Identity' },
  ]},
  { category: 'Network', items: [
    { name: 'auditbeat@pipeline', docsCount: 50_000, failedDocsCount: 1_250, failureRate: '2.5', status: 'critical', category: 'Network' },
  ]},
  { category: 'Cloud', items: [
    { name: 'filebeat-aws.cloudtrail@pipeline', docsCount: 200_000, failedDocsCount: 0, failureRate: '0.0', status: 'healthy', category: 'Cloud' },
  ]},
];

const continuityColumns: Array<EuiBasicTableColumn<PipelineRow>> = [
  { field: 'name', name: 'Pipeline Name', truncateText: true, width: '35%' },
  { field: 'docsCount', name: 'Docs Ingested', width: '18%', render: (n: number) => n.toLocaleString() },
  { field: 'failedDocsCount', name: 'Failed Docs', width: '15%', render: (n: number) => n.toLocaleString() },
  { field: 'failureRate', name: 'Failure Rate', width: '12%', render: (r: string) => `${r}%` },
  { field: 'status', name: 'Status', width: '12%',
    render: (s: string) => <EuiBadge color={s === 'critical' ? 'danger' : 'success'}>{s === 'critical' ? 'Critical failure rate' : 'Healthy'}</EuiBadge> },
  { name: 'Actions', width: '8%',
    render: (row: PipelineRow) => <EuiButtonEmpty size="xs" color="primary" href="#">{row.status === 'critical' ? 'View Failure' : 'View Pipeline'}</EuiButtonEmpty> },
];

const ContinuityTab: React.FC = () => {
  const hasCritical = CONTINUITY_MOCK.flatMap((c) => c.items).some((p) => p.status === 'critical');
  return (
    <>
      {hasCritical && (
        <>
          <EuiCallOut title="Some ingest pipelines have critical failure rates." color="warning" iconType="warning">
            <EuiText size="s"><p>High failure rates can cause data loss and reduce detection coverage.</p></EuiText>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} gutterSize="s" style={{ marginBottom: 12 }}>
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            The following table summarizes the stability of your data by tracking ingest pipeline failure rates across log categories.
          </EuiText>
        </EuiFlexItem>
        {hasCritical && <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty></EuiFlexItem>}
      </EuiFlexGroup>
      <EuiFlexGroup direction="column" gutterSize="m" responsive={false}>
        {CONTINUITY_MOCK.map((cat) => {
          const totalDocs   = cat.items.reduce((s, p) => s + p.docsCount, 0);
          const totalFailed = cat.items.reduce((s, p) => s + p.failedDocsCount, 0);
          const rate        = totalDocs > 0 ? ((totalFailed / totalDocs) * 100).toFixed(1) : '0.0';
          const isCritical  = cat.items.some((p) => p.status === 'critical');
          return (
            <EuiFlexItem key={cat.category}>
              <CategoryAccordion<PipelineRow>
                id={`continuity-${cat.category}`}
                category={cat.category}
                items={cat.items}
                columns={continuityColumns}
                extraAction={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiBadge color={isCritical ? 'warning' : 'success'}>{isCritical ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">| Pipelines: <strong>{cat.items.length}</strong> | Docs Ingested: <strong>{totalDocs.toLocaleString()}</strong> | Failure Rate: <strong>{rate}%</strong></EuiText></EuiFlexItem>
                  </EuiFlexGroup>
                }
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </>
  );
};

// ─── Retention tab ────────────────────────────────────────────────────────────

interface RetentionRow { indexName: string; retentionType: 'ilm' | 'dsl' | null; retentionPeriod: string | null; retentionDays: number | null; policyName: string | null; status: 'healthy' | 'non-compliant'; category: string; [key: string]: unknown }

const RETENTION_MOCK: Array<{ category: string; items: RetentionRow[] }> = [
  { category: 'Endpoint', items: [
    { indexName: 'logs-endpoint.events.process', retentionType: 'ilm', retentionPeriod: '90 days',  retentionDays: 90,  policyName: 'logs-policy',    status: 'healthy',       category: 'Endpoint' },
    { indexName: 'logs-endpoint.alerts',         retentionType: 'ilm', retentionPeriod: '90 days',  retentionDays: 90,  policyName: 'security-policy', status: 'healthy',       category: 'Endpoint' },
  ]},
  { category: 'Identity', items: [
    { indexName: 'logs-okta.system', retentionType: 'ilm', retentionPeriod: '365 days', retentionDays: 365, policyName: 'logs-policy', status: 'healthy', category: 'Identity' },
  ]},
  { category: 'Network', items: [
    { indexName: 'auditbeat-*', retentionType: 'ilm', retentionPeriod: '30 days', retentionDays: 30, policyName: 'auditbeat-policy', status: 'non-compliant', category: 'Network' },
  ]},
  { category: 'Cloud', items: [
    { indexName: 'filebeat-aws.cloudtrail', retentionType: 'ilm', retentionPeriod: '365 days', retentionDays: 365, policyName: 'logs-policy', status: 'healthy', category: 'Cloud' },
  ]},
];

const retentionColumns: Array<EuiBasicTableColumn<RetentionRow>> = [
  { field: 'indexName', name: 'Data streams/indices', truncateText: true, width: '28%' },
  { field: 'retentionType', name: 'Managed by', width: '10%',
    render: (t: string | null) => t ? <EuiBadge color="hollow">{t.toUpperCase()}</EuiBadge> : <EuiText size="s" color="subdued">None</EuiText> },
  { field: 'retentionPeriod', name: 'Current retention', width: '16%',
    render: (p: string | null) => p ? <EuiText size="s">{p}</EuiText> : <EuiText size="s" color="subdued">Not configured</EuiText> },
  { field: 'indexName' as const, name: 'Baseline retention (FedRAMP)', width: '18%',
    render: () => <EuiText size="s">12 months</EuiText> },
  { field: 'status', name: 'Status', width: '14%',
    render: (s: string) => <EuiBadge color={s === 'non-compliant' ? 'danger' : 'success'}>{s === 'non-compliant' ? 'Non-compliant' : 'Healthy'}</EuiBadge> },
  { name: 'Actions', width: '14%',
    render: (row: RetentionRow) => (
      <EuiButtonEmpty size="xs" color="primary" href="#">
        {row.retentionType === 'ilm' && row.policyName ? 'View ILM policies' : row.retentionType === 'dsl' ? 'View Data Stream' : 'View Index'}
      </EuiButtonEmpty>
    ) },
];

const RetentionTab: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'non-compliant' | 'healthy'>('all');
  const nonCompliantCount = RETENTION_MOCK.flatMap((c) => c.items).filter((i) => i.status === 'non-compliant').length;
  const hasIssues = nonCompliantCount > 0;

  const filteredMock = RETENTION_MOCK.map((cat) => ({
    ...cat,
    items: cat.items.filter((i) => filter === 'all' || i.status === filter),
  })).filter((cat) => cat.items.length > 0);

  return (
    <>
      {hasIssues && (
        <>
          <EuiCallOut title={`${nonCompliantCount} data stream${nonCompliantCount !== 1 ? 's' : ''} do not meet the retention baseline.`} color="warning" iconType="warning">
            <EuiText size="s"><p>Check if your log data meets recommended retention periods across key categories.</p></EuiText>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} gutterSize="s" style={{ marginBottom: 12 }}>
        <EuiFlexItem>
          <EuiText size="s" color="subdued">Check if your log data meets recommended retention periods across key categories.</EuiText>
        </EuiFlexItem>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          {hasIssues && <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty></EuiFlexItem>}
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              {(['all', 'non-compliant', 'healthy'] as const).map((f) => (
                <EuiFilterButton key={f} isSelected={filter === f} onClick={() => setFilter(f)} withNext={f !== 'healthy'}>
                  {f === 'all' ? 'All' : f === 'non-compliant' ? 'Non-compliant' : 'Healthy'}
                </EuiFilterButton>
              ))}
            </EuiFilterGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexGroup>
      <EuiFlexGroup direction="column" gutterSize="m" responsive={false}>
        {filteredMock.map((cat) => {
          const nonCompliant = cat.items.filter((i) => i.status === 'non-compliant').length;
          return (
            <EuiFlexItem key={cat.category}>
              <CategoryAccordion<RetentionRow>
                id={`retention-${cat.category}`}
                category={cat.category}
                items={cat.items}
                columns={retentionColumns}
                extraAction={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiBadge color={nonCompliant > 0 ? 'warning' : 'success'}>{nonCompliant > 0 ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">| Data streams: <strong>{cat.items.length}</strong></EuiText></EuiFlexItem>
                  </EuiFlexGroup>
                }
              />
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </>
  );
};

const PlaceholderTab: React.FC<{ label: string; desc: string }> = ({ label, desc }) => (
  <EuiPanel hasBorder paddingSize="xl">
    <EuiFlexGroup direction="column" alignItems="center" gutterSize="m" responsive={false}>
      <EuiFlexItem grow={false}><EuiIcon type="visLine" size="xl" color="subdued" /></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiTitle size="s"><h3>{label}</h3></EuiTitle></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiText color="subdued" size="s" textAlign="center"><p>{desc}</p></EuiText></EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const SiemReadinessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VisibilityTabId>('coverage');

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ backgroundColor: '#F6F9FC', minHeight: '100vh', marginTop: 48, marginLeft: 80, padding: 8 }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ minHeight: 'calc(100vh - 64px)' }}>

          {/* Sticky secondary nav */}
          <EuiFlexItem grow={false} style={{ position: 'sticky', top: 56, alignSelf: 'flex-start', height: 'calc(100vh - 64px)' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <SiemSecondaryNav />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main content */}
          <EuiFlexItem>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', minHeight: 'calc(100vh - 64px)' }}>

              {/* Page header — no "Add Integrations", only "Configurations" on right */}
              <EuiPageHeader
                pageTitle={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>SIEM Readiness</EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBetaBadge label="Technical Preview" size="s" />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
                responsive={false}
                paddingSize="l"
                bottomBorder
                rightSideItems={[
                  <EuiButtonEmpty size="s" iconType="gear" key="config">Configurations</EuiButtonEmpty>,
                ]}
              />

              <EuiPageSection paddingSize="l">

                {/* Tab bar */}
                <EuiTabs>
                  {BOXES.map((b) => (
                    <EuiTab
                      key={b.id}
                      isSelected={activeTab === b.id}
                      onClick={() => setActiveTab(b.id)}
                      prepend={b.status !== 'healthy'
                        ? <EuiIcon type="warning" color="warning" size="s" />
                        : undefined
                      }
                    >
                      {b.title}
                    </EuiTab>
                  ))}
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* Tab content */}
                {activeTab === 'coverage'   && <CoverageTab />}
                {activeTab === 'quality'    && <QualityTab />}
                {activeTab === 'continuity' && <ContinuityTab />}
                {activeTab === 'retention'  && <RetentionTab />}

              </EuiPageSection>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>
    </>
  );
};

export default SiemReadinessPage;
