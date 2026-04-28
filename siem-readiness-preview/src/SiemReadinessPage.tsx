import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiAccordion,
  EuiBadge,
  EuiBasicTable,
  EuiBetaBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCallOut,
  EuiCard,
  EuiCode,
  EuiEmptyPrompt,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiListGroup,
  EuiListGroupItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiPageHeader,
  EuiPageSection,
  EuiSpacer,
  EuiStat,
  EuiTabbedContent,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import type { EuiBasicTableColumn } from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';

// ─── Types (mirroring @kbn/siem-readiness) ───────────────────────────────────

type VisibilityStatus = 'healthy' | 'actionsRequired' | 'noData';
type VisibilityTabId = 'coverage' | 'quality' | 'continuity' | 'retention';

interface SiemReadinessPackageInfo {
  id: string; name: string; title: string; version: string; status: string;
  packagePoliciesInfo?: { count: number };
}
interface RelatedIntegration { package: string; version?: string }
interface RelatedIntegrationRuleResponse {
  enabled: boolean;
  related_integrations?: RelatedIntegration[];
}
interface IndexInfo { indexName: string; docs: number }
interface CategoryGroup { category: string; indices: IndexInfo[] }
interface CategoriesResponse {
  rawCategoriesMap: CategoryGroup[];
  mainCategoriesMap: CategoryGroup[];
}
interface RuleIntegrationCoverage {
  coveredRules: RelatedIntegrationRuleResponse[];
  uncoveredRules: RelatedIntegrationRuleResponse[];
  missingIntegrations: string[];
  installedIntegrations: string[];
}

// ─── Coverage logic (ported from use_get_detection_rules_by_integration) ─────

function computeCoverage(
  rules: RelatedIntegrationRuleResponse[],
  integrations: SiemReadinessPackageInfo[]
): RuleIntegrationCoverage {
  const enabledPkgs = new Set(
    integrations
      .filter((p) => p.status === 'installed' && (p.packagePoliciesInfo?.count ?? 0) > 0)
      .map((p) => p.name)
  );
  const installedPkgs = new Set(
    integrations.filter((p) => p.status === 'installed').map((p) => p.name)
  );
  const referenced = new Set<string>();
  const coveredRules: RelatedIntegrationRuleResponse[] = [];
  const uncoveredRules: RelatedIntegrationRuleResponse[] = [];

  rules.forEach((rule) => {
    const required = rule.related_integrations?.map((i) => i.package).filter(Boolean) ?? [];
    required.forEach((pkg) => referenced.add(pkg));
    if (required.length === 0 || required.some((pkg) => enabledPkgs.has(pkg))) {
      coveredRules.push(rule);
    } else {
      uncoveredRules.push(rule);
    }
  });

  return {
    coveredRules,
    uncoveredRules,
    missingIntegrations: Array.from(referenced).filter((pkg) => !enabledPkgs.has(pkg)),
    installedIntegrations: Array.from(installedPkgs),
  };
}

// ─── Data-fetching hook ───────────────────────────────────────────────────────

interface QualityResult { indexName: string; incompatibleFieldCount: number; checkedAt: number; docsCount: number }
interface PipelineStats { name: string; indices: string[]; docsCount: number; failedDocsCount: number; statsAvailable: boolean }
interface RetentionItem { indexName: string; isDataStream: boolean; retentionType: 'ilm' | 'dsl' | null; retentionPeriod: string | null; retentionDays: number | null; policyName: string | null; status: 'healthy' | 'non-compliant' }

interface RuleFieldIssue {
  id: string; ruleName: string; field: string;
  issueType: 'missing' | 'type_mismatch' | 'sparse'; indexPattern: string;
}

interface SiemReadinessData {
  loading: boolean;
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
  qualityResults: QualityResult[];
  pipelines: PipelineStats[];
  retentionItems: RetentionItem[];
  ruleFieldIssues: RuleFieldIssue[];
}

// ─── Static mock data (no API calls needed in standalone preview) ──────────────

const MOCK_INTEGRATIONS: SiemReadinessPackageInfo[] = [
  { id: 'endpoint',        name: 'endpoint',        title: 'Endpoint Security',      version: '8.16.0', status: 'installed',     packagePoliciesInfo: { count: 1 } },
  { id: 'elastic_agent',   name: 'elastic_agent',   title: 'Elastic Agent',          version: '8.16.0', status: 'installed',     packagePoliciesInfo: { count: 1 } },
  { id: 'windows',         name: 'windows',         title: 'Windows',                version: '2.3.3',  status: 'installed',     packagePoliciesInfo: { count: 0 } },
  { id: 'okta',            name: 'okta',            title: 'Okta',                   version: '3.3.2',  status: 'not_installed', packagePoliciesInfo: { count: 0 } },
  { id: 'aws',             name: 'aws',             title: 'AWS',                    version: '2.14.1', status: 'not_installed', packagePoliciesInfo: { count: 0 } },
  { id: 'network_traffic', name: 'network_traffic', title: 'Network Packet Capture', version: '1.33.0', status: 'not_installed', packagePoliciesInfo: { count: 0 } },
  { id: 'google_workspace',name: 'google_workspace',title: 'Google Workspace',       version: '2.19.0', status: 'not_installed', packagePoliciesInfo: { count: 0 } },
];

const MOCK_RULES: RelatedIntegrationRuleResponse[] = [
  { enabled: true, related_integrations: [{ package: 'endpoint',        version: '>=8.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'endpoint',        version: '>=8.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'elastic_agent',   version: '>=8.0.0' }] },
  { enabled: true, related_integrations: [] },
  { enabled: true, related_integrations: [] },
  { enabled: true, related_integrations: [{ package: 'windows',         version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'okta',            version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'okta',            version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'network_traffic', version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'aws',             version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'aws',             version: '>=1.0.0' }] },
  { enabled: true, related_integrations: [{ package: 'network_traffic', version: '>=1.0.0' }] },
];

const now = Date.now();
const min = 60_000;

const MOCK_CATEGORIES: CategoryGroup[] = [
  { category: 'Network',  indices: [
    { indexName: 'ds-auditbeat-9.1.0-2025.11.02-000015', docs: 5000 },
    { indexName: 'ds-auditbeat-9.1.0-2025.10.15-000014', docs: 3200 },
    { indexName: 'ds-auditbeat-8.16.0-2025.06.20-000006', docs: 0 },
  ]},
  { category: 'Endpoint', indices: [
    { indexName: 'logs-endpoint.events.process-9.2.0-default', docs: 12400 },
    { indexName: 'logs-endpoint.alerts-default',                docs: 320   },
    { indexName: 'logs-endpoint.events.network-default',        docs: 180   },
  ]},
  { category: 'Identity',         indices: [{ indexName: 'logs-okta.system-2025.07-default', docs: 1200 }] },
  { category: 'Cloud',            indices: [{ indexName: 'logs-aws.cloudtrail-2025.06-default', docs: 8000 }, { indexName: 'logs-aws.s3access-default', docs: 19500 }] },
  { category: 'Application/SaaS',indices: [{ indexName: 'logs-google_workspace.admin-2025.05-default', docs: 800 }, { indexName: 'logs-salesforce.login-default', docs: 2100 }] },
];

const MOCK_QUALITY: QualityResult[] = [
  { indexName: 'ds-auditbeat-9.1.0-2025.11.02-000015',         incompatibleFieldCount: 2,  checkedAt: now - 21 * min, docsCount: 5000  },
  { indexName: 'ds-auditbeat-8.16.0-2025.06.20-000006',         incompatibleFieldCount: 2,  checkedAt: now - 22 * min, docsCount: 0     },
  { indexName: 'logs-endpoint.events.process-9.2.0-default',    incompatibleFieldCount: 2,  checkedAt: now - 22 * min, docsCount: 12400 },
  { indexName: 'logs-endpoint.events.process-8.15.0-default',   incompatibleFieldCount: 1,  checkedAt: now - 30 * min, docsCount: 5000  },
  { indexName: 'logs-endpoint.alerts-default',                   incompatibleFieldCount: 2,  checkedAt: now - 28 * min, docsCount: 320   },
  { indexName: 'logs-okta.system-2025.07-default',              incompatibleFieldCount: 1,  checkedAt: now - 25 * min, docsCount: 1200  },
  { indexName: 'logs-okta.system-2025.06-default',              incompatibleFieldCount: 0,  checkedAt: now - 25 * min, docsCount: 1100  },
  { indexName: 'logs-aws.cloudtrail-2025.06-default',           incompatibleFieldCount: 1,  checkedAt: now - 30 * min, docsCount: 8000  },
  { indexName: 'logs-aws.cloudtrail-2025.05-default',           incompatibleFieldCount: 0,  checkedAt: now - 35 * min, docsCount: 7500  },
  { indexName: 'logs-google_workspace.admin-2025.05-default',   incompatibleFieldCount: 1,  checkedAt: now - 20 * min, docsCount: 800   },
  { indexName: 'logs-salesforce.login-default',                  incompatibleFieldCount: 0,  checkedAt: now - 32 * min, docsCount: 2100  },
];

const MOCK_PIPELINES: PipelineStats[] = [
  { name: 'logs-endpoint.events.process@pipeline', indices: ['logs-endpoint.events.process-9.2.0-default'], docsCount: 245800, failedDocsCount: 0,    statsAvailable: true },
  { name: 'logs-endpoint.alerts@pipeline',         indices: ['logs-endpoint.alerts-default'],                docsCount: 12400,  failedDocsCount: 0,    statsAvailable: true },
  { name: 'ds-auditbeat@pipeline',                 indices: ['ds-auditbeat-9.1.0-2025.11.02-000015'],        docsCount: 55000,  failedDocsCount: 1320, statsAvailable: true },
  { name: 'logs-okta.system@pipeline',             indices: ['logs-okta.system-2025.07-default'],             docsCount: 8800,   failedDocsCount: 0,    statsAvailable: true },
  { name: 'logs-aws.cloudtrail@pipeline',          indices: ['logs-aws.cloudtrail-2025.06-default'],          docsCount: 62000,  failedDocsCount: 890,  statsAvailable: true },
  { name: 'logs-google_workspace.admin@pipeline',  indices: ['logs-google_workspace.admin-2025.05-default'],  docsCount: 4200,   failedDocsCount: 0,    statsAvailable: true },
];

const MOCK_RETENTION: RetentionItem[] = [
  { indexName: 'logs-endpoint.events.process', isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy'      },
  { indexName: 'logs-endpoint.alerts',         isDataStream: true, retentionType: 'ilm', retentionPeriod: '400d', retentionDays: 400, policyName: 'security-data-policy', status: 'healthy'      },
  { indexName: 'ds-auditbeat',                 isDataStream: true, retentionType: 'ilm', retentionPeriod: '30d',  retentionDays: 30,  policyName: 'logs-default-policy',  status: 'non-compliant'},
  { indexName: 'logs-okta.system',             isDataStream: true, retentionType: 'dsl', retentionPeriod: '90d',  retentionDays: 90,  policyName: null,                   status: 'non-compliant'},
  { indexName: 'logs-aws.cloudtrail',          isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy'      },
  { indexName: 'logs-aws.s3access',            isDataStream: true, retentionType: null,  retentionPeriod: null,   retentionDays: null, policyName: null,                  status: 'non-compliant'},
  { indexName: 'logs-google_workspace.admin',  isDataStream: true, retentionType: 'dsl', retentionPeriod: '365d', retentionDays: 365, policyName: null,                   status: 'healthy'      },
];

const MOCK_RULE_FIELD_ISSUES: RuleFieldIssue[] = [
  { id: '1', ruleName: 'Windows Process Injection via CreateRemoteThread', field: 'process.parent.entity_id',      issueType: 'missing',      indexPattern: 'logs-endpoint.events.process-*' },
  { id: '2', ruleName: 'Okta User Locked Out',                            field: 'okta.actor.alternate_id',        issueType: 'type_mismatch', indexPattern: 'logs-okta.system-*'             },
  { id: '3', ruleName: 'AWS CloudTrail Unauthorized API Call',            field: 'aws.cloudtrail.error_code',      issueType: 'sparse',        indexPattern: 'logs-aws.cloudtrail-*'          },
  { id: '4', ruleName: 'Suspicious Network Connection by Process',        field: 'network.bytes',                  issueType: 'missing',       indexPattern: 'logs-endpoint.events.network-*' },
  { id: '5', ruleName: 'Google Workspace Admin Role Assigned',           field: 'google_workspace.admin.event.name', issueType: 'type_mismatch', indexPattern: 'logs-google_workspace.admin-*' },
  { id: '6', ruleName: 'Auditbeat Unusual Process Execution',            field: 'process.code_signature.valid',   issueType: 'sparse',        indexPattern: 'ds-auditbeat-*'                 },
  { id: '7', ruleName: 'AWS S3 Bucket Policy Changed',                   field: 'aws.s3access.bucket_name',       issueType: 'missing',       indexPattern: 'logs-aws.s3access-*'            },
  { id: '8', ruleName: 'Endpoint Defense Evasion via Timestomping',      field: 'file.mtime',                     issueType: 'type_mismatch', indexPattern: 'logs-endpoint.events.process-*' },
];

function useSiemReadinessData(): SiemReadinessData {
  const coverage = computeCoverage(MOCK_RULES, MOCK_INTEGRATIONS);
  return {
    loading: false,
    coverage,
    categories:   MOCK_CATEGORIES,
    integrations: MOCK_INTEGRATIONS,
    qualityResults: MOCK_QUALITY,
    pipelines:    MOCK_PIPELINES,
    retentionItems: MOCK_RETENTION,
    ruleFieldIssues: MOCK_RULE_FIELD_ISSUES,
  };
}

// ─── Secondary nav ────────────────────────────────────────────────────────────

const SiemSecondaryNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const itemStyle = {
    height: 32,
    padding: '6px 4px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 400,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#1d2a3e',
    paddingLeft: 4,
    marginBottom: 4,
    marginTop: 8,
  };

  return (
    <div style={{ width: 220, padding: '16px 12px', minHeight: 'calc(100vh - 64px)' }}>

      <p style={sectionTitleStyle}>Launchpad</p>

      <EuiListGroup flush gutterSize="none" style={{ marginBottom: 4 }}>
        <EuiListGroupItem label={<span style={{ fontSize: 13, color: '#1d2a3e' }}>Get started</span>} onClick={() => {}} style={itemStyle} />
        <EuiListGroupItem
          label={<span style={{ fontSize: 13, color: isActive('/siem-readiness') ? '#1750BA' : '#1d2a3e', fontWeight: isActive('/siem-readiness') ? 600 : 400 }}>SIEM Readiness</span>}
          onClick={() => navigate('/siem-readiness')}
          isActive={isActive('/siem-readiness')}
          style={itemStyle}
        />
        <EuiListGroupItem label={<span style={{ fontSize: 13, color: '#1d2a3e' }}>Value report</span>} onClick={() => {}} style={itemStyle} />
      </EuiListGroup>

      <EuiSpacer size="s" />

      <p style={{ ...sectionTitleStyle, marginTop: 12 }}>Migrations</p>

      <EuiListGroup flush gutterSize="none">
        <EuiListGroupItem label={<span style={{ fontSize: 13, color: '#1d2a3e' }}>Manage automatic migrations</span>} onClick={() => {}} style={{ ...itemStyle, height: 'auto', paddingTop: 6, paddingBottom: 6 }} />
        <EuiListGroupItem label={<span style={{ fontSize: 13, color: '#1d2a3e' }}>Translated rules</span>} onClick={() => {}} style={itemStyle} />
        <EuiListGroupItem label={<span style={{ fontSize: 13, color: '#1d2a3e' }}>Translated dashboards</span>} onClick={() => {}} style={itemStyle} />
      </EuiListGroup>
    </div>
  );
};

// ─── M2 types ─────────────────────────────────────────────────────────────────

type ReadinessStatus = 'critical' | 'warning' | 'healthy';

interface PillarStatus {
  status: ReadinessStatus;
  metricValue: string | number;
  metricLabel: string;
  hasIssues: boolean;
  statusColor: 'danger' | 'warning' | 'success' | 'subdued';
}

interface ReadinessSummary {
  overall: ReadinessStatus;
  enabledRules: number;
  silentStreams: number;
  volumeDropCount: number;
  highLatencyCount: number;
  categoriesMissingData: number;
  retentionBelowBenchmark: number;
  pillars: {
    coverage: PillarStatus;
    quality: PillarStatus;
    continuity: PillarStatus;
    retention: PillarStatus;
  };
}

// Fix 2 helper — worst continuity signal
function getContinuityCardMetric(
  silentStreams: number, volumeDrops: number, latencyIssues: number
): { value: number; label: string } {
  if (silentStreams > 0) return { value: silentStreams, label: 'Silent data streams' };
  if (volumeDrops > 0)   return { value: volumeDrops,  label: 'Volume drops (>50%)' };
  if (latencyIssues > 0) return { value: latencyIssues, label: 'Streams above latency SLA' };
  return { value: 0, label: 'Data streams flowing normally' };
}

// Fix 3 helper — specific continuity callout
function getContinuityCallout(
  silentStreams: number, volumeDrops: number, latencyIssues: number
): { color: 'danger' | 'warning'; iconType: string; title: string; body: string } | null {
  if (silentStreams > 0) return { color: 'danger', iconType: 'visArea', title: 'Some data streams have stopped sending data.', body: 'Detection rules that depend on these streams may be running but not matching anything. Check your integrations in Fleet.' };
  if (volumeDrops > 0)   return { color: 'warning', iconType: 'visArea', title: 'Some data streams have dropped significantly in volume.', body: 'Data is still flowing but at a fraction of the expected rate. This may affect detection coverage.' };
  if (latencyIssues > 0) return { color: 'warning', iconType: 'clock', title: 'Some data streams are exceeding their ingestion latency SLA.', body: 'Data is arriving later than expected. Real-time detection rules may miss events.' };
  return null;
}

// Fix 5 helper — dynamic overall status message
function getOverallStatusMessage(pillars: Record<string, ReadinessStatus>): { color: 'danger' | 'warning' | 'success'; iconType: string; title: string; body: string } {
  const critical = Object.entries(pillars).filter(([, s]) => s === 'critical').map(([n]) => n.charAt(0).toUpperCase() + n.slice(1));
  const warning  = Object.entries(pillars).filter(([, s]) => s === 'warning').map(([n]) => n.charAt(0).toUpperCase() + n.slice(1));
  if (critical.length === 0 && warning.length === 0) {
    return { color: 'success', iconType: 'checkInCircleFilled', title: 'Everything seems healthy and stable.', body: 'No issues detected across Coverage, Quality, Continuity, or Retention.' };
  }
  if (critical.length > 0) {
    const warningText = warning.length > 0 ? ` ${warning.join(' and ')} ${warning.length === 1 ? 'has' : 'have'} a warning.` : '';
    return { color: 'danger', iconType: 'alert', title: `${critical.join(' and ')} ${critical.length === 1 ? 'has' : 'have'} critical issues.${warningText}`, body: 'Select each affected pillar below for details and next steps.' };
  }
  return { color: 'warning', iconType: 'warning', title: `${warning.join(' and ')} ${warning.length === 1 ? 'has' : 'have'} warnings.`, body: 'Select each affected pillar below for details and next steps.' };
}

// ─── Visibility status badge ──────────────────────────────────────────────────

const STATUS_BADGE: Record<VisibilityStatus, { label: string; color: string; iconType: string }> = {
  healthy:         { label: 'Healthy',          color: 'success', iconType: 'check'      },
  actionsRequired: { label: 'Actions required', color: 'warning', iconType: 'warning'    },
  noData:          { label: 'No data',          color: 'default', iconType: 'plugs'      },
};

const VISIBILITY_TO_HEALTH: Record<VisibilityStatus, 'success' | 'warning' | 'subdued'> = {
  healthy: 'success', actionsRequired: 'warning', noData: 'subdued',
};

// ─── Change 1: Status hero block ─────────────────────────────────────────────

const STATUS_HERO_CONFIG: Record<ReadinessStatus, {
  iconType: string; iconColor: 'danger' | 'warning' | 'success';
  headline: (x: number) => string; subtitle: string;
}> = {
  critical: {
    iconType: 'alert', iconColor: 'danger',
    headline: () => 'Critical issues require your attention.',
    subtitle: 'Some detection rules are not running. Review each pillar.',
  },
  warning: {
    iconType: 'warning', iconColor: 'warning',
    headline: (x) => `${x} data stream${x !== 1 ? 's' : ''} need${x === 1 ? 's' : ''} attention.`,
    subtitle: 'Some detection rules may not be running as expected.',
  },
  healthy: {
    iconType: 'checkInCircleFilled', iconColor: 'success',
    headline: () => 'Everything seems healthy and stable.',
    subtitle: 'No issues detected. Check back regularly.',
  },
};

const StatusHero: React.FC<{ summary: ReadinessSummary }> = ({ summary }) => {
  const msg = getOverallStatusMessage({
    coverage:   summary.pillars.coverage.status,
    quality:    summary.pillars.quality.status,
    continuity: summary.pillars.continuity.status,
    retention:  summary.pillars.retention.status,
  });
  const stripBg = msg.color === 'danger' ? '#FFF3F1' : msg.color === 'warning' ? '#FFF8E6' : '#F0FFF4';
  const titleColor = msg.color === 'danger' ? '#BD271E' : msg.color === 'warning' ? '#CA8500' : '#017D73';
  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiTitle size="s"><h2>Overall status</h2></EuiTitle>
      <EuiSpacer size="s" />
      <div style={{ background: stripBg, borderRadius: 4, padding: '10px 12px' }}>
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="m">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiIcon type={msg.iconType} size="m" color={msg.color} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s"><strong style={{ color: titleColor }}>{msg.title}</strong></EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s" color="subdued">{msg.body}</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" iconType="discuss" color="primary">Add to chat</EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPanel>
  );
};

// ─── Change 2: Summary stats row ─────────────────────────────────────────────

const SummaryStatsRow: React.FC<{ summary: ReadinessSummary }> = ({ summary }) => (
  <EuiPanel hasBorder paddingSize="m">
    <EuiFlexGroup gutterSize="none" responsive={false}>
      <EuiFlexItem>
        <EuiStat
          title={summary.enabledRules}
          description="Enabled rules"
          titleSize="m"
          titleColor="default"
          descriptionElement="span"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiStat
          title={summary.silentStreams}
          description="Silent data streams"
          titleSize="m"
          titleColor={summary.silentStreams > 0 ? 'danger' : 'default'}
          descriptionElement="span"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiStat
          title={summary.categoriesMissingData}
          description="Categories missing data"
          titleSize="m"
          titleColor={summary.categoriesMissingData > 0 ? 'warning' : 'default'}
          descriptionElement="span"
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiStat
          title={summary.retentionBelowBenchmark}
          description="Retention below benchmark"
          titleSize="m"
          titleColor={summary.retentionBelowBenchmark > 0 ? 'warning' : 'default'}
          descriptionElement="span"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
);

// ─── Change 3: Pillar cards ───────────────────────────────────────────────────

interface PillarCardsProps {
  summary: ReadinessSummary;
  selectedTabId: VisibilityTabId;
  onTabSelect: (id: VisibilityTabId) => void;
}

const PILLAR_DESCRIPTIONS: Record<VisibilityTabId, Record<'healthy' | 'warning' | 'critical', string>> = {
  coverage: {
    healthy: 'All enabled rules have required integrations.',
    warning: 'Integrations required for some enabled rules.',
    critical: 'Critical integration gaps detected.',
  },
  quality: {
    healthy: 'ECS compatibility is healthy.',
    warning: 'ECS incompatibility detected.',
    critical: 'Critical field incompatibilities found.',
  },
  continuity: {
    healthy: 'Ingest pipeline is healthy.',
    warning: 'Ingest pipeline failures occurred.',
    critical: 'Critical pipeline failure rate.',
  },
  retention: {
    healthy: 'All lifecycle policies meet requirements.',
    warning: 'Some lifecycle policies need increasing.',
    critical: 'Critical retention policy gaps.',
  },
};

const PillarCards: React.FC<PillarCardsProps> = ({ summary, selectedTabId, onTabSelect }) => {
  const pillars: Array<{ id: VisibilityTabId; title: string; pillar: PillarStatus }> = [
    { id: 'coverage',   title: 'Coverage',   pillar: summary.pillars.coverage },
    { id: 'quality',    title: 'Quality',    pillar: summary.pillars.quality },
    { id: 'continuity', title: 'Continuity', pillar: summary.pillars.continuity },
    { id: 'retention',  title: 'Retention',  pillar: summary.pillars.retention },
  ];

  return (
    <EuiFlexGroup gutterSize="m" responsive={false}>
      {pillars.map(({ id, title, pillar }) => {
        const titleColor = pillar.statusColor === 'subdued' ? 'default' : pillar.statusColor;
        const badge = pillar.status === 'critical'
          ? { color: 'danger' as const, label: 'Critical' }
          : pillar.status === 'warning'
            ? { color: 'warning' as const, label: 'Warning' }
            : { color: 'success' as const, label: 'Healthy' };
        return (
          <EuiFlexItem key={id} grow>
            <EuiCard
              title={
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color={badge.color}>{badge.label}</EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
              titleSize="xs"
              textAlign="left"
              hasBorder
              selectable={{
                onClick: () => onTabSelect(id),
                isSelected: selectedTabId === id,
              }}
              paddingSize="m"
              style={selectedTabId === id ? {
                boxShadow: '0px 0px 2px 0px hsla(216.67,29.51%,23.92%,0.16), 0px 1px 4px 0px hsla(216.67,29.51%,23.92%,0.06), 0px 2px 8px 0px hsla(216.67,29.51%,23.92%,0.04)',
                outline: '2px solid #1D4ED8',
                outlineOffset: -2,
              } : undefined}
            >
              <EuiStat
                title={pillar.metricValue}
                description={pillar.metricLabel}
                titleSize="m"
                titleColor={titleColor}
                descriptionElement="span"
              />
            </EuiCard>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};

// ─── Category accordion table (adapted from CategoryAccordionTable) ───────────

interface CategoryAccordionItem {
  id: string;
  name: string;
  status: 'covered' | 'uncovered' | 'noData' | 'healthy' | 'warning' | 'danger';
  detail?: string;
  count?: number;
}

interface CategoryAccordionProps {
  category: string;
  items: CategoryAccordionItem[];
  renderBadge: (items: CategoryAccordionItem[]) => React.ReactNode;
  columns: Array<EuiBasicTableColumn<CategoryAccordionItem>>;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({ category, items, renderBadge, columns }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <EuiAccordion
        id={`accordion-${category}`}
        buttonContent={
          <EuiText size="s" style={{ fontWeight: 600 }}>{category}</EuiText>
        }
        extraAction={<div style={{ paddingRight: 16 }}>{renderBadge(items)}</div>}
        style={{ padding: '14px 16px' }}
        paddingSize="none"
        borders="none"
        forceState={isOpen ? 'open' : 'closed'}
        onToggle={() => setIsOpen((v) => !v)}
      >
        {isOpen && (
          <div style={{ padding: '0 16px 16px' }}>
            <EuiInMemoryTable
              items={items}
              columns={columns}
              pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
              sorting={false}
              tableLayout="auto"
            />
          </div>
        )}
      </EuiAccordion>
      <EuiHorizontalRule margin="none" />
    </div>
  );
};

// ─── Rule donut chart ─────────────────────────────────────────────────────────

interface RuleDonutChartProps { covered: number; uncovered: number }

const RuleDonutChart: React.FC<RuleDonutChartProps> = ({ covered, uncovered }) => {
  const total = covered + uncovered;
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const strokeWidth = 24;

  // Build arc path for a segment: startAngle → endAngle (radians, 0 = top, clockwise)
  const describeArc = (startDeg: number, endDeg: number): string => {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Angles
  const coveredDeg  = total > 0 ? (covered  / total) * 360 : 0;
  const uncoveredDeg = total > 0 ? (uncovered / total) * 360 : 360;

  // Teal for covered (#00BFB3), orange for uncovered (#FF7E62)
  const teal   = '#00BFB3';
  const orange = '#FF7E62';
  const gray   = '#D3DAE6';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        {total === 0 ? (
          // Full gray circle when no data
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={gray} strokeWidth={strokeWidth} />
        ) : coveredDeg === 360 ? (
          // All covered — full teal circle
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={teal} strokeWidth={strokeWidth} />
        ) : uncoveredDeg === 360 ? (
          // All uncovered — full orange circle
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={orange} strokeWidth={strokeWidth} />
        ) : (
          <>
            {/* Covered arc (teal) — starts at 0° */}
            <path
              d={describeArc(0, coveredDeg - 0.5)}
              fill="none"
              stroke={teal}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Uncovered arc (orange) */}
            <path
              d={describeArc(coveredDeg + 0.5, 360 - 0.5)}
              fill="none"
              stroke={orange}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: '#1d2a3e' }}>
          {total}
        </span>
        <span style={{ fontSize: 11, color: '#69707D', textAlign: 'center', marginTop: 4, maxWidth: 80, lineHeight: 1.3 }}>
          total enabled rules
        </span>
      </div>
    </div>
  );
};

// ─── Coverage tab ─────────────────────────────────────────────────────────────

interface CoverageTabProps {
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
  loading: boolean;
}

const CATEGORY_INTEGRATIONS: Record<string, string[]> = {
  'Endpoint':         ['endpoint', 'elastic_agent', 'windows'],
  'Identity':         ['okta', 'azure_ad'],
  'Network':          ['network_traffic', 'zeek'],
  'Cloud':            ['aws', 'azure', 'gcp'],
  'Application/SaaS': ['google_workspace', 'salesforce'],
};

const CoverageTab: React.FC<CoverageTabProps> = ({ coverage, categories, integrations, loading }) => {
  const [ruleSubTab, setRuleSubTab] = useState<'all' | 'mitre'>('all');

  // All hooks must run unconditionally — derive values lazily inside useMemo
  const missingSet = useMemo(
    () => new Set(coverage?.missingIntegrations ?? []),
    [coverage]
  );
  const integrationMap = useMemo(
    () => new Map(integrations.map((p) => [p.name, p])),
    [integrations]
  );

  const ruleCategoryData = useMemo(() => {
    const cats = Object.entries(CATEGORY_INTEGRATIONS);
    return cats.map(([cat, pkgs]) => {
      const items: CategoryAccordionItem[] = pkgs.map((pkg) => {
        const pkg_info = integrationMap.get(pkg);
        const isInstalled = pkg_info?.status === 'installed';
        const hasPolicies = (pkg_info?.packagePoliciesInfo?.count ?? 0) > 0;
        const status: CategoryAccordionItem['status'] = !isInstalled
          ? 'uncovered'
          : !hasPolicies
            ? 'warning'
            : 'covered';
        return {
          id: pkg,
          name: pkg_info?.title ?? pkg,
          status,
          detail: !isInstalled ? 'Not installed' : !hasPolicies ? 'Installed, no active policy' : 'Active',
          count: undefined,
        };
      });
      return { category: cat, items };
    });
  }, [integrationMap]);

  const ruleCoverageColumns: Array<EuiBasicTableColumn<CategoryAccordionItem>> = [
    { field: 'name', name: 'Integration' },
    {
      field: 'status' as const,
      name: 'Status',
      width: '180px',
      render: (_: CategoryAccordionItem['status'], row: CategoryAccordionItem) => {
        const color = row.status === 'covered' ? 'success' : row.status === 'warning' ? 'warning' : 'danger';
        return <EuiHealth color={color}>{row.detail}</EuiHealth>;
      },
    },
    {
      name: 'Action',
      width: '180px',
      render: (_: CategoryAccordionItem) => (
        <EuiButtonEmpty size="xs" color="primary" iconType="popout">
          View in Fleet
        </EuiButtonEmpty>
      ),
    },
  ];

  const renderRuleBadge = (items: CategoryAccordionItem[]) => {
    const uncovered = items.filter((i) => i.status === 'uncovered' || i.status === 'warning').length;
    return uncovered > 0
      ? <EuiBadge color="warning" iconType="warning">{uncovered} missing</EuiBadge>
      : <EuiBadge color="success" iconType="check">All covered</EuiBadge>;
  };

  // ── Data Coverage section ─────────────────────────────
  // PRD-specified rules affected per category (Change 6 sort order)
  const CATEGORY_RULES_COUNT: Record<string, number> = {
    'Network': 76, 'Cloud': 61, 'Endpoint': 24, 'Identity': 17, 'Application/SaaS': 17,
  };

  const dataCategoryRows = useMemo(() => {
    const rows = categories.map((cat) => {
      const catPkgs = CATEGORY_INTEGRATIONS[cat.category] ?? [];
      const hasMissing = catPkgs.some((pkg) => missingSet.has(pkg));
      const totalDocs = cat.indices.reduce((sum, idx) => sum + idx.docs, 0);
      const statusLabel = hasMissing ? 'Missing data' : totalDocs > 0 ? 'Good' : 'No data';
      const statusColor = hasMissing ? 'warning' : totalDocs > 0 ? 'success' : 'default';
      const rulesCount = CATEGORY_RULES_COUNT[cat.category] ?? 0;
      return { id: cat.category, category: cat.category, statusLabel, statusColor, integrationCount: rulesCount, rulesCount };
    });
    // Default sort: rules affected descending
    return [...rows].sort((a, b) => b.rulesCount - a.rulesCount);
  }, [categories, missingSet]);

  // Early return AFTER all hooks
  if (loading) {
    return (
      <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}>
        <EuiLoadingSpinner size="xl" />
      </EuiFlexGroup>
    );
  }

  const totalEnabled   = (coverage?.coveredRules.length ?? 0) + (coverage?.uncoveredRules.length ?? 0);
  const uncoveredCount = coverage?.uncoveredRules.length ?? 0;
  const noRules        = totalEnabled === 0;
  const allCovered     = totalEnabled > 0 && uncoveredCount === 0;

  // Fix 4: Coverage healthy empty state
  if (allCovered) {
    return (
      <EuiPanel hasBorder paddingSize="m">
        <EuiEmptyPrompt
          iconType="checkInCircleFilled"
          color="success"
          title={<h3>Coverage looks good</h3>}
          titleSize="xs"
          body={<EuiText size="s"><p>All enabled rules have supporting data available.</p></EuiText>}
        />
      </EuiPanel>
    );
  }

  return (
    <div>
      {/* ── Rule Coverage panel ── */}
      <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs"><h3>Data rule coverage</h3></EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Shows the total number of enabled rules, and those with missing or disabled integrations.">
                <EuiBadge iconType="warning" color="warning" aria-label="Data rule coverage info" style={{ padding: '0 4px' }} />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">
                View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      {noRules ? (
        <EuiCallOut color="warning" size="s">
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}><EuiIcon type="warning" color="warning" size="m" /></EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>No rules are currently enabled</strong>
                <br />
                <span style={{ color: '#69707D' }}>Get started by installing and enabling rules in <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>detection rules</EuiButtonEmpty>.</span>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiCallOut>
      ) : (coverage?.uncoveredRules.length ?? 0) > 0 ? (
        <EuiCallOut color="warning" size="s" title={`Integrations required for some enabled rules.`}>
          <EuiText size="s">
            {coverage?.uncoveredRules.length} rule{(coverage?.uncoveredRules.length ?? 0) !== 1 ? 's' : ''} have missing or disabled integrations.{' '}
            <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>Learn more</EuiButtonEmpty>
          </EuiText>
        </EuiCallOut>
      ) : (
        <EuiCallOut color="success" size="s" title="All enabled rules have required integrations." />
      )}

      <EuiSpacer size="m" />

      {/* Rule sub-tabs */}
      <EuiButtonGroup
        legend="Rule coverage view"
        options={[
          { id: 'all',   label: 'All enabled rules' },
          { id: 'mitre', label: 'MITRE ATT&CK enabled rules' },
        ]}
        idSelected={ruleSubTab}
        onChange={(id) => setRuleSubTab(id as 'all' | 'mitre')}
        buttonSize="s"
        color="primary"
        style={{ marginBottom: 8 }}
      />

      <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>
        The following table shows the total number of enabled rules, and those with missing or disabled integrations.
      </EuiText>

      {/* ── Donut chart + table layout ── */}
      <EuiFlexGroup alignItems="center" gutterSize="xl" responsive={false} style={{ marginBottom: 8 }}>

        {/* Donut chart */}
        <EuiFlexItem grow={false}>
          <RuleDonutChart covered={coverage?.coveredRules.length ?? 0} uncovered={coverage?.uncoveredRules.length ?? 0} />
        </EuiFlexItem>

        {/* Integration status table */}
        <EuiFlexItem>
          <EuiBasicTable
            items={[
              { id: 'enabled', statusColor: 'success' as const, label: 'Enabled Integrations',               count: coverage?.coveredRules.length ?? 0 },
              { id: 'missing', statusColor: 'danger'  as const, label: 'Missing or Disabled Integrations',   count: coverage?.uncoveredRules.length ?? 0 },
            ]}
            columns={[
              {
                field: 'label',
                name: 'Data Source status',
                render: (label: string, row: { statusColor: string; label: string; count: number; id: string }) => (
                  <EuiHealth color={row.statusColor}>{label}</EuiHealth>
                ),
              },
              { field: 'count', name: '# of rules associated', width: '200px' },
              {
                name: 'Actions',
                width: '220px',
                render: (row: { statusColor: string; label: string; count: number; id: string }) => (
                  <EuiButtonEmpty size="xs" color="primary">
                    View Integrations&nbsp;<EuiBadge color="hollow">{row.count}</EuiBadge>
                  </EuiButtonEmpty>
                ),
              },
            ] as Array<EuiBasicTableColumn<{ id: string; statusColor: string; label: string; count: number }>>}
            itemId="id"
          />
          <EuiText size="s" style={{ paddingLeft: 8, marginTop: 8 }}>
            <strong>{totalEnabled}</strong>&nbsp;<span style={{ color: '#69707D' }}>Total enabled rules</span>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* ── Data Coverage panel ── */}
      <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}><EuiTitle size="xs"><h3>Data coverage</h3></EuiTitle></EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Shows the coverage status for each log category to ensure you have incoming data.">
                <EuiBadge iconType="warning" color="warning" aria-label="Data coverage info" style={{ padding: '0 4px' }} />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">
                View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <EuiCallOut color="warning" size="s" title="Some log categories are missing required integrations.">
        <EuiText size="s">
          Some log categories are missing integrations, limiting your visibility and detection coverage.
          Create a case to install the missing integrations for {dataCategoryRows.filter((r) => r.statusLabel === 'Missing data').length} categories or view missing integrations to restore full visibility.{' '}
          <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>
            Learn more about installing integrations in our docs
          </EuiButtonEmpty>.
        </EuiText>
      </EuiCallOut>

      <EuiSpacer size="m" />

      <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
        View the coverage status for each log category below to ensure you have incoming data.
      </EuiText>

      {/* Flat category coverage table — no accordions */}
      <EuiBasicTable
        items={dataCategoryRows}
        columns={[
          {
            field: 'category',
            name: 'Log Category',
          },
          {
            field: 'statusLabel',
            name: 'Coverage status',
            width: '200px',
            render: (_: string, row: typeof dataCategoryRows[0]) => {
              if (row.statusLabel === 'Missing data') return <EuiBadge color="warning" iconType="alert">Missing data</EuiBadge>;
              if (row.statusLabel === 'Good') return <EuiBadge color="success" iconType="check">Good</EuiBadge>;
              return <EuiBadge color="default">Unknown</EuiBadge>;
            },
          },
          {
            name: 'Action',
            width: '220px',
            render: (row: typeof dataCategoryRows[0]) => (
              <EuiButtonEmpty size="xs" color="primary">
                View Integrations&nbsp;<EuiBadge color="hollow">{row.integrationCount}</EuiBadge>
              </EuiButtonEmpty>
            ),
          },
        ] as Array<EuiBasicTableColumn<typeof dataCategoryRows[0]>>}
        itemId="id"
      />
      </EuiPanel>
    </div>
  );
};

// ─── Quality tab (Fix 4: rule field issues) ───────────────────────────────────

type QualityIndexItem = {
  id: string; indexName: string;
  incompatibleFieldCount: number; checkedAt?: number;
  status: 'incompatible' | 'healthy';
};

interface QualityTabProps { categories: CategoryGroup[]; qualityResults: QualityResult[]; ruleFieldIssues: RuleFieldIssue[]; loading: boolean }

const QualityTab: React.FC<QualityTabProps> = ({ categories, qualityResults, ruleFieldIssues, loading }) => {
  const [filter, setFilter] = useState<'all' | 'incompatible' | 'healthy'>('all');
  const [search, setSearch] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const qualityMap = useMemo(
    () => new Map(qualityResults.map((r) => [r.indexName, r])),
    [qualityResults]
  );

  const allCategoriesWithStatus = useMemo(() =>
    categories.map((cat) => ({
      category: cat.category,
      items: cat.indices.map((idx) => {
        const q = qualityMap.get(idx.indexName);
        return {
          id: idx.indexName,
          indexName: idx.indexName,
          incompatibleFieldCount: q?.incompatibleFieldCount ?? 0,
          checkedAt: q?.checkedAt,
          status: (q?.incompatibleFieldCount ?? 0) > 0 ? 'incompatible' as const : 'healthy' as const,
        };
      }),
    })),
    [categories, qualityMap]
  );

  const filteredCategories = useMemo(() =>
    allCategoriesWithStatus.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const matchesFilter = filter === 'all' || item.status === filter;
        const matchesSearch = !search || item.indexName.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    })).filter((cat) => cat.items.length > 0),
    [allCategoriesWithStatus, filter, search]
  );

  const totalIndices = allCategoriesWithStatus.reduce((s, c) => s + c.items.length, 0);
  const checkedIndices = qualityResults.length;
  const totalIncompatible = allCategoriesWithStatus.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.status === 'incompatible').length, 0
  );

  const relativeTime = (ts?: number) => {
    if (!ts) return 'Never';
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  };

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  const qualityColumns: Array<EuiBasicTableColumn<QualityIndexItem>> = [
    { field: 'indexName', name: 'Indices', truncateText: true, sortable: true, width: '38%' },
    { field: 'incompatibleFieldCount', name: 'Incompatible fields', sortable: true, width: '16%',
      render: (n: number) => <EuiText size="s">{n}</EuiText> },
    { field: 'checkedAt', name: 'Last checked', sortable: true, width: '18%',
      render: (t?: number) => <EuiText size="s" color={t ? undefined : 'subdued'}>{relativeTime(t)}</EuiText> },
    { field: 'status', name: 'Status', sortable: true, width: '16%',
      render: (s: string) => (
        <EuiBadge color={s === 'incompatible' ? 'warning' : 'success'}>
          {s === 'incompatible' ? 'Incompatible' : 'Healthy'}
        </EuiBadge>
      ) },
    { name: 'Actions', width: '12%',
      render: () => <EuiButtonEmpty size="xs" color="primary" flush="left">View Data quality</EuiButtonEmpty> },
  ];

  // Fix 4: Quality healthy empty state
  if (totalIncompatible === 0 && ruleFieldIssues.length === 0) {
    return (
      <EuiPanel hasBorder paddingSize="m">
        <EuiEmptyPrompt
          iconType="checkInCircleFilled"
          color="success"
          title={<h3>No field issues found</h3>}
          titleSize="xs"
          body={<EuiText size="s"><p>All enabled rules are referencing fields that exist and are correctly typed.</p></EuiText>}
        />
      </EuiPanel>
    );
  }

  return (
    <>
      {totalIncompatible > 0 && (
        <>
          <EuiCallOut color="warning" size="s" title="Some indices have ECS compatibility issues.">
            <EuiText size="s">
              {totalIncompatible} indices have ECS compatibility issues. Click{' '}
              <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>View Data quality</EuiButtonEmpty>
              {' '}to review the affected indices and fix field mapping issues. Or, create a case to generate a task reminder to review them later.{' '}
              <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>View our docs</EuiButtonEmpty>
              {' '}to learn more about data quality.
            </EuiText>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}

      {/* All indices checked progress bar */}
      <div style={{ background: '#E6F9F7', border: '1px solid #00BFB3', borderRadius: 4, padding: '6px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}><EuiIcon type="check" color="success" size="m" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiText size="s" style={{ color: '#017D73', fontWeight: 500 }}>All indices checked</EuiText></EuiFlexItem>
        </EuiFlexGroup>
        <EuiText size="s" style={{ color: '#017D73', fontWeight: 600 }}>{checkedIndices}/{totalIndices}</EuiText>
      </div>

      {/* Description + cases */}
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s" style={{ marginBottom: 8 }}>
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            See which indices fail ECS checks or have missing fields. Schema errors can stop rules, dashboards, and correlations from working correctly.
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">
                View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* Showing count + search + filter */}
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 8 }}>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            Showing {filteredCategories.reduce((s, c) => s + c.items.length, 0)} of {totalIndices} indices | {filteredCategories.length} categories
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search indices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            isClearable
            compressed
            style={{ maxWidth: 280 }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="Quality filter"
            options={[{ id: 'all', label: 'All' }, { id: 'incompatible', label: 'Incompatible' }, { id: 'healthy', label: 'Healthy' }]}
            idSelected={filter}
            onChange={(id) => setFilter(id as typeof filter)}
            buttonSize="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* Accordions in a single bordered panel */}
      <EuiPanel hasBorder paddingSize="none" style={{ overflow: 'hidden' }}>
        {filteredCategories.map((cat, idx) => {
          const incompatFields = cat.items.reduce((s, i) => s + i.incompatibleFieldCount, 0);
          const affected = cat.items.filter((i) => i.status === 'incompatible').length;
          const isOpen = openAccordions[cat.category] ?? false;

          return (
            <div key={cat.category}>
              <EuiAccordion
                id={`quality-accordion-${cat.category}`}
                buttonContent={
                  <EuiText size="s" style={{ fontWeight: 600 }}>{cat.category}</EuiText>
                }
                extraAction={
                  <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false} style={{ paddingRight: 16 }}>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiBadge color={incompatFields > 0 ? 'warning' : 'success'}>{incompatFields > 0 ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Incompatible Fields:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" style={{ fontWeight: 600 }}>{incompatFields}</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Affected indices:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" style={{ fontWeight: 600 }}>{affected}/{cat.items.length}</EuiText></EuiFlexItem>
                  </EuiFlexGroup>
                }
                style={{ padding: '14px 16px' }}
                paddingSize="none"
                borders="none"
                forceState={isOpen ? 'open' : 'closed'}
                onToggle={() => setOpenAccordions((prev) => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  <EuiInMemoryTable
                    items={cat.items}
                    columns={qualityColumns}
                    pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
                    sorting={{ sort: { field: 'indexName', direction: 'asc' } }}
                    tableLayout="auto"
                  />
                </div>
              </EuiAccordion>
              {idx < filteredCategories.length - 1 && <EuiHorizontalRule margin="none" />}
            </div>
          );
        })}
      </EuiPanel>

      {/* Fix 4: Rule field issues table */}
      <EuiSpacer size="l" />
      <EuiPanel hasBorder paddingSize="m">
        <EuiTitle size="xs"><h3>Rule field issues</h3></EuiTitle>
        <EuiSpacer size="s" />
        {ruleFieldIssues.length > 0 ? (
          <>
            <EuiCallOut
              title="Some enabled rules reference fields that are missing or incompatible."
              color="warning"
              iconType="inspect"
              size="s"
            >
              <EuiText size="s"><p>These rules may execute without error but will never match. Review the field issues below and fix the underlying data or rule configuration.</p></EuiText>
            </EuiCallOut>
            <EuiSpacer size="m" />
            <EuiBasicTable
              items={ruleFieldIssues}
              columns={[
                { field: 'ruleName', name: 'Rule', render: (name: string) => <EuiText size="s">{name}</EuiText> },
                { field: 'field', name: 'Field', render: (f: string) => <EuiCode>{f}</EuiCode> },
                {
                  field: 'issueType', name: 'Issue',
                  render: (type: string) => {
                    const colorMap: Record<string, string> = { missing: 'danger', type_mismatch: 'warning', sparse: 'warning' };
                    const labelMap: Record<string, string> = { missing: 'Field missing', type_mismatch: 'Type mismatch', sparse: 'Sparsely populated' };
                    return <EuiBadge color={colorMap[type] ?? 'default'}>{labelMap[type] ?? type}</EuiBadge>;
                  },
                },
                { field: 'indexPattern', name: 'Index pattern', render: (idx: string) => <EuiCode>{idx}</EuiCode> },
                {
                  name: 'Action',
                  render: () => (
                    <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/security/rules">View rule</EuiButtonEmpty>
                  ),
                },
              ] as Array<EuiBasicTableColumn<RuleFieldIssue>>}
              itemId="id"
            />
          </>
        ) : (
          <EuiEmptyPrompt
            iconType="inspect"
            title={<h3>No field issues found</h3>}
            titleSize="xs"
            body={<EuiText size="s"><p>All enabled rules are referencing fields that exist and are correctly typed.</p></EuiText>}
          />
        )}
      </EuiPanel>
    </>
  );
};

// ─── Continuity tab (Fix 5: volume/silence/latency) ──────────────────────────

interface ContinuityFinding {
  id: string; dataset: string;
  issue: 'silent' | 'volume_drop' | 'high_latency';
  detail: string; rulesAffected: number;
}

interface ContinuityTabProps { categories: CategoryGroup[]; pipelines: PipelineStats[]; loading: boolean }

const ContinuityTab: React.FC<ContinuityTabProps> = ({ pipelines, loading }) => {
  const findings: ContinuityFinding[] = useMemo(() => {
    const result: ContinuityFinding[] = [];
    pipelines.forEach((p) => {
      if (p.docsCount === 0) {
        result.push({ id: p.name + '-silent', dataset: p.indices[0] ?? p.name, issue: 'silent', detail: 'No data received in the last 24h', rulesAffected: 3 });
      } else if (p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1) {
        const rate = ((p.failedDocsCount / p.docsCount) * 100).toFixed(1);
        result.push({ id: p.name + '-drop', dataset: p.indices[0] ?? p.name, issue: 'volume_drop', detail: `Failure rate ${rate}% — ${p.failedDocsCount.toLocaleString()} docs failed`, rulesAffected: 12 });
      }
    });
    return result;
  }, [pipelines]);

  const silentStreamCount = findings.filter((f) => f.issue === 'silent').length;
  const volumeDropCount   = findings.filter((f) => f.issue === 'volume_drop').length;
  const highLatencyCount  = findings.filter((f) => f.issue === 'high_latency').length;

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  const callout = getContinuityCallout(silentStreamCount, volumeDropCount, highLatencyCount);

  // Fix 4: healthy empty state
  if (findings.length === 0) {
    return (
      <EuiPanel hasBorder paddingSize="m">
        <EuiEmptyPrompt
          iconType="checkInCircleFilled"
          color="success"
          title={<h3>All data streams are flowing normally</h3>}
          titleSize="xs"
          body={<EuiText size="s"><p>No volume drops, silence, or latency issues detected in the last 24 hours.</p></EuiText>}
        />
      </EuiPanel>
    );
  }

  return (
    <EuiPanel hasBorder paddingSize="m">
      {callout && (
        <>
          <EuiCallOut title={callout.title} color={callout.color} iconType={callout.iconType}>
            <EuiText size="s"><p>{callout.body}</p></EuiText>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      <EuiFlexGroup gutterSize="m" responsive={false}>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={silentStreamCount} description="Silent streams" titleColor={silentStreamCount > 0 ? 'danger' : 'default'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={volumeDropCount} description="Volume drops (>50%)" titleColor={volumeDropCount > 0 ? 'warning' : 'default'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={highLatencyCount} description="Streams above latency SLA" titleColor={highLatencyCount > 0 ? 'warning' : 'default'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiBasicTable
          items={findings}
          columns={[
            { field: 'dataset', name: 'Data stream', render: (ds: string) => <EuiCode>{ds}</EuiCode> },
            {
              field: 'issue', name: 'Issue',
              render: (issue: string) => {
                const color = issue === 'silent' ? 'danger' : 'warning';
                const label = issue === 'silent' ? 'Silent' : issue === 'volume_drop' ? 'Volume drop' : 'High latency';
                return <EuiBadge color={color}>{label}</EuiBadge>;
              },
            },
            { field: 'detail', name: 'Detail', render: (detail: string) => <EuiText size="s" color="subdued">{detail}</EuiText> },
            { field: 'rulesAffected', name: 'Rules affected', render: (count: number) => <EuiText size="s" color={count > 0 ? 'danger' : 'default'}>{count}</EuiText> },
            { name: 'Action', render: () => <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/fleet">View in Fleet</EuiButtonEmpty> },
          ] as Array<EuiBasicTableColumn<ContinuityFinding>>}
          itemId="id"
        />
    </EuiPanel>
  );
};

// ─── Retention tab (Fix 6: benchmark comparison) ──────────────────────────────

interface RetentionFinding { id: string; category: string; actualDays: number; benchmarkDays: number; status: 'below' | 'meets' }

const RETENTION_BENCHMARKS: Record<string, number> = {
  'Endpoint': 90, 'Identity': 180, 'Network': 90, 'Cloud': 180, 'Application/SaaS': 90,
};

interface RetentionTabProps { categories: CategoryGroup[]; retentionItems: RetentionItem[]; loading: boolean }

const RetentionTab: React.FC<RetentionTabProps> = ({ categories, retentionItems, loading }) => {
  const retentionFindings: RetentionFinding[] = useMemo(() => {
    return categories.map((cat) => {
      const benchmark = RETENTION_BENCHMARKS[cat.category] ?? 90;
      const match = retentionItems.find((r) => cat.indices.some((idx) => idx.indexName.includes(r.indexName)));
      const actualDays = match?.retentionDays ?? 0;
      return { id: cat.category, category: cat.category, actualDays, benchmarkDays: benchmark, status: actualDays >= benchmark ? 'meets' as const : 'below' as const };
    });
  }, [categories, retentionItems]);

  const belowCount = retentionFindings.filter((f) => f.status === 'below').length;

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  return (
    <EuiPanel hasBorder paddingSize="m">
      {belowCount > 0 && (
        <>
          <EuiCallOut title="Some log categories are not meeting retention benchmarks." color="warning" iconType="clock">
            <EuiText size="s"><p>Retention policies should meet minimum thresholds for compliance. Review and update your ILM or data lifecycle policies in Stack Management.</p></EuiText>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}
      {belowCount === 0 ? (
        <EuiEmptyPrompt
          iconType="checkInCircleFilled"
          color="success"
          title={<h3>All categories meet retention benchmarks</h3>}
          titleSize="xs"
          body={<EuiText size="s"><p>Your ILM and data lifecycle policies are within compliance thresholds.</p></EuiText>}
        />
      ) : (
        <EuiBasicTable
          items={retentionFindings}
          columns={[
            { field: 'category', name: 'Log category' },
            { field: 'actualDays', name: 'Current retention', render: (days: number) => <EuiText size="s">{days > 0 ? `${days} days` : 'Not configured'}</EuiText> },
            { field: 'benchmarkDays', name: 'Benchmark', render: (days: number) => <EuiText size="s" color="subdued">{days} days</EuiText> },
            { field: 'status', name: 'Status',
              render: (status: string) => (
                <EuiBadge color={status === 'below' ? 'warning' : 'success'}>
                  {status === 'below' ? 'Below benchmark' : 'Meets benchmark'}
                </EuiBadge>
              ),
            },
            { name: 'Action', render: () => <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/management/data/index_lifecycle_management">Manage policy</EuiButtonEmpty> },
          ] as Array<EuiBasicTableColumn<RetentionFinding>>}
          itemId="id"
        />
      )}
    </EuiPanel>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SiemReadinessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VisibilityTabId>('coverage');
  const { loading, coverage, categories, integrations, qualityResults, pipelines, retentionItems, ruleFieldIssues } = useSiemReadinessData();

  // ── Compute ReadinessSummary ──────────────────────────────────────────────
  const summary: ReadinessSummary = useMemo(() => {
    const total = (coverage?.coveredRules.length ?? 0) + (coverage?.uncoveredRules.length ?? 0);
    const coveredPct = total > 0 ? Math.round((coverage!.coveredRules.length / total) * 100) : 0;

    const qualityIssues = qualityResults.filter((r) => r.incompatibleFieldCount > 0).length;
    const criticalPipelines = pipelines.filter((p) => p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1).length;
    const silentStreams  = pipelines.filter((p) => p.docsCount === 0).length;
    const volumeDropCount   = criticalPipelines; // pipelines with >1% failure rate
    const highLatencyCount  = 0;               // no latency data in mock
    const retentionBelowBenchmark = retentionItems.filter((r) => r.status === 'non-compliant').length;
    const categoriesMissingData = categories.filter((cat) =>
      cat.indices.every((idx) => idx.docs === 0)
    ).length;

    const coveragePillar: PillarStatus = {
      status: loading || total === 0 ? 'healthy' : coveredPct < 80 ? 'critical' : coveredPct < 100 ? 'warning' : 'healthy',
      metricValue: total > 0 ? `${coveredPct}%` : '—',
      metricLabel: 'Rules with supporting data',
      hasIssues: coveredPct < 100 && total > 0,
      statusColor: coveredPct < 80 ? 'danger' : coveredPct < 100 ? 'warning' : 'success',
    };
    const qualityPillar: PillarStatus = {
      status: loading ? 'healthy' : qualityIssues > 5 ? 'critical' : qualityIssues > 0 ? 'warning' : 'healthy',
      metricValue: qualityIssues,
      metricLabel: 'Indices with field issues',
      hasIssues: qualityIssues > 0,
      statusColor: qualityIssues > 5 ? 'danger' : qualityIssues > 0 ? 'warning' : 'success',
    };
    const continuityMetric = getContinuityCardMetric(silentStreams, volumeDropCount, highLatencyCount);
    const continuityStatus: ReadinessStatus = loading ? 'healthy' : silentStreams > 0 || volumeDropCount > 0 ? 'critical' : highLatencyCount > 0 ? 'warning' : 'healthy';
    const continuityPillar: PillarStatus = {
      status: continuityStatus,
      metricValue: continuityMetric.value,
      metricLabel: continuityMetric.label,
      hasIssues: continuityMetric.value > 0,
      statusColor: silentStreams > 0 || volumeDropCount > 0 ? 'danger' : highLatencyCount > 0 ? 'warning' : 'success',
    };
    const retentionPillar: PillarStatus = {
      status: loading ? 'healthy' : retentionBelowBenchmark > 0 ? 'warning' : 'healthy',
      metricValue: retentionBelowBenchmark,
      metricLabel: 'Data streams below benchmark',
      hasIssues: retentionBelowBenchmark > 0,
      statusColor: retentionBelowBenchmark > 0 ? 'warning' : 'success',
    };

    const overall: ReadinessStatus = criticalPipelines > 0 ? 'critical'
      : (coveragePillar.hasIssues || qualityPillar.hasIssues || retentionPillar.hasIssues) ? 'warning'
      : 'healthy';

    return {
      overall,
      enabledRules: total,
      silentStreams,
      volumeDropCount,
      highLatencyCount,
      categoriesMissingData,
      retentionBelowBenchmark,
      pillars: { coverage: coveragePillar, quality: qualityPillar, continuity: continuityPillar, retention: retentionPillar },
    };
  }, [loading, coverage, qualityResults, pipelines, retentionItems, categories]);

  // Default to highest-severity pillar on load
  const defaultPillar = useMemo((): VisibilityTabId => {
    const order: VisibilityTabId[] = ['continuity', 'coverage', 'quality', 'retention'];
    for (const id of order) {
      if (summary.pillars[id].status === 'critical') return id;
    }
    for (const id of order) {
      if (summary.pillars[id].hasIssues) return id;
    }
    return 'coverage';
  }, [summary]);

  // Sync activeTab to defaultPillar on first load
  const [hasSetDefault, setHasSetDefault] = useState(false);
  useEffect(() => {
    if (!loading && !hasSetDefault) {
      setActiveTab(defaultPillar);
      setHasSetDefault(true);
    }
  }, [loading, hasSetDefault, defaultPillar]);

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{
        backgroundColor: '#F6F9FC',
        minHeight: '100vh',
        marginTop: 48,
        marginLeft: 80,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8,
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ minHeight: 'calc(100vh - 64px)' }}>

          {/* Secondary nav */}
          <EuiFlexItem grow={false}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', minHeight: 'calc(100vh - 64px)' }}>
              <SiemSecondaryNav />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main content */}
          <EuiFlexItem>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', minHeight: 'calc(100vh - 64px)' }}>

              {/* Page header — matches real Kibana: title + EuiBetaBadge + Configurations */}
              <EuiPageHeader
                pageTitle={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>SIEM Readiness</EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBetaBadge label="Preview" size="s" tooltipContent="This feature is in technical preview and may be changed or removed in a future release." />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
                responsive={false}
                paddingSize="l"
                bottomBorder
                rightSideItems={[
                  <EuiButtonEmpty size="s" iconType="gear" key="config">
                    Configurations
                  </EuiButtonEmpty>,
                ]}
              />

              <EuiPageSection paddingSize="l">

                {/* Change 1: Status hero */}
                <StatusHero summary={summary} />
                <EuiSpacer size="xl" />

                {/* Change 2: Summary stats row */}
                <SummaryStatsRow summary={summary} />
                <EuiSpacer size="l" />

                {/* Change 3: Pillar cards */}
                <PillarCards summary={summary} selectedTabId={activeTab} onTabSelect={setActiveTab} />

                <EuiSpacer size="m" />

                {/* Pillar content — driven by selected card (Fix 1: no tabs) */}
                {activeTab === 'coverage'   && <><EuiSpacer size="s" /><CoverageTab coverage={coverage} categories={categories} integrations={integrations} loading={loading} /></>}
                {activeTab === 'quality'    && <><EuiSpacer size="s" /><QualityTab categories={categories} qualityResults={qualityResults} ruleFieldIssues={ruleFieldIssues} loading={loading} /></>}
                {activeTab === 'continuity' && <><EuiSpacer size="s" /><ContinuityTab categories={categories} pipelines={pipelines} loading={loading} /></>}
                {activeTab === 'retention'  && <><EuiSpacer size="s" /><RetentionTab categories={categories} retentionItems={retentionItems} loading={loading} /></>}

              </EuiPageSection>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>
    </>
  );
};

export default SiemReadinessPage;
