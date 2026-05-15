import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiAccordion,
  EuiAvatar,
  EuiBadge,
  EuiBasicTable,
  EuiBetaBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiCallOut,
  EuiCard,
  EuiCheckbox,
  EuiCode,
  EuiEmptyPrompt,
  EuiGlobalToastList,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiListGroup,
  EuiListGroupItem,
  EuiLoadingSpinner,
  EuiNotificationBadge,
  EuiPanel,
  EuiPageHeader,
  EuiPageSection,
  EuiPopover,
  EuiProgress,
  EuiSelectable,
  EuiSpacer,
  EuiStat,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
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
interface PipelineStats { name: string; indices: string[]; docsCount: number; failedDocsCount: number; statsAvailable: boolean; latencyMinutes?: number }
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

// ─── Static mock data (no API calls in standalone preview) ───────────────────
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
const _now = Date.now(); const _min = 60_000;
const MOCK_CATEGORIES: CategoryGroup[] = [
  { category: 'Network',  indices: [{ indexName: 'ds-auditbeat-9.1.0-2025.11.02-000015', docs: 5000 }, { indexName: 'ds-auditbeat-8.16.0-2025.06.20-000006', docs: 0 }] },
  { category: 'Endpoint', indices: [{ indexName: 'logs-endpoint.events.process-9.2.0-default', docs: 12400 }, { indexName: 'logs-endpoint.alerts-default', docs: 320 }, { indexName: 'logs-endpoint.events.network-default', docs: 180 }] },
  { category: 'Identity',         indices: [{ indexName: 'logs-okta.system-2025.07-default', docs: 1200 }] },
  { category: 'Cloud',            indices: [{ indexName: 'logs-aws.cloudtrail-2025.06-default', docs: 8000 }, { indexName: 'logs-aws.s3access-default', docs: 19500 }] },
  { category: 'Application/SaaS',indices: [{ indexName: 'logs-google_workspace.admin-2025.05-default', docs: 800 }, { indexName: 'logs-salesforce.login-default', docs: 2100 }] },
];
const MOCK_QUALITY: QualityResult[] = [
  { indexName: 'ds-auditbeat-9.1.0-2025.11.02-000015',       incompatibleFieldCount: 2, checkedAt: _now - 21 * _min, docsCount: 5000  },
  { indexName: 'logs-endpoint.events.process-9.2.0-default', incompatibleFieldCount: 2, checkedAt: _now - 22 * _min, docsCount: 12400 },
  { indexName: 'logs-endpoint.alerts-default',                incompatibleFieldCount: 2, checkedAt: _now - 28 * _min, docsCount: 320   },
  { indexName: 'logs-okta.system-2025.07-default',            incompatibleFieldCount: 1, checkedAt: _now - 25 * _min, docsCount: 1200  },
  { indexName: 'logs-aws.cloudtrail-2025.06-default',         incompatibleFieldCount: 1, checkedAt: _now - 30 * _min, docsCount: 8000  },
  { indexName: 'logs-google_workspace.admin-2025.05-default', incompatibleFieldCount: 1, checkedAt: _now - 20 * _min, docsCount: 800   },
];
const MOCK_PIPELINES: PipelineStats[] = [
  { name: 'logs-endpoint.events.process@pipeline', indices: ['logs-endpoint.events.process-9.2.0-default'], docsCount: 245800, failedDocsCount: 0,    statsAvailable: true },
  { name: 'ds-auditbeat@pipeline',                 indices: ['ds-auditbeat-9.1.0-2025.11.02-000015'],        docsCount: 55000,  failedDocsCount: 1320, statsAvailable: true, latencyMinutes: 8 },
  { name: 'logs-aws.cloudtrail@pipeline',          indices: ['logs-aws.cloudtrail-2025.06-default'],          docsCount: 62000,  failedDocsCount: 890,  statsAvailable: true },
];
const MOCK_RETENTION: RetentionItem[] = [
  { indexName: 'logs-endpoint.events.process', isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy'       },
  { indexName: 'ds-auditbeat',                 isDataStream: true, retentionType: 'ilm', retentionPeriod: '30d',  retentionDays: 30,  policyName: 'logs-default-policy',  status: 'non-compliant' },
  { indexName: 'logs-okta.system',             isDataStream: true, retentionType: 'dsl', retentionPeriod: '90d',  retentionDays: 90,  policyName: null,                   status: 'non-compliant' },
  { indexName: 'logs-aws.cloudtrail',          isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy'       },
  { indexName: 'logs-aws.s3access',            isDataStream: true, retentionType: null,  retentionPeriod: null,   retentionDays: null, policyName: null,                  status: 'non-compliant' },
  { indexName: 'logs-google_workspace.admin',  isDataStream: true, retentionType: 'dsl', retentionPeriod: '365d', retentionDays: 365, policyName: null,                   status: 'healthy'       },
];
const MOCK_RULE_FIELD_ISSUES: RuleFieldIssue[] = [
  { id: '1', ruleName: 'Windows Process Injection via CreateRemoteThread', field: 'process.parent.entity_id',         issueType: 'missing',      indexPattern: 'logs-endpoint.events.process-*' },
  { id: '2', ruleName: 'Okta User Locked Out',                            field: 'okta.actor.alternate_id',           issueType: 'type_mismatch', indexPattern: 'logs-okta.system-*'             },
  { id: '3', ruleName: 'AWS CloudTrail Unauthorized API Call',            field: 'aws.cloudtrail.error_code',         issueType: 'sparse',        indexPattern: 'logs-aws.cloudtrail-*'          },
  { id: '4', ruleName: 'Suspicious Network Connection by Process',        field: 'network.bytes',                     issueType: 'missing',       indexPattern: 'logs-endpoint.events.network-*' },
  { id: '5', ruleName: 'Google Workspace Admin Role Assigned',           field: 'google_workspace.admin.event.name',  issueType: 'type_mismatch', indexPattern: 'logs-google_workspace.admin-*'  },
  { id: '6', ruleName: 'Auditbeat Unusual Process Execution',            field: 'process.code_signature.valid',        issueType: 'sparse',        indexPattern: 'ds-auditbeat-*'                 },
  { id: '7', ruleName: 'AWS S3 Bucket Policy Changed',                   field: 'aws.s3access.bucket_name',           issueType: 'missing',       indexPattern: 'logs-aws.s3access-*'            },
  { id: '8', ruleName: 'Endpoint Defense Evasion via Timestomping',      field: 'file.mtime',                         issueType: 'type_mismatch', indexPattern: 'logs-endpoint.events.process-*' },
];

function useSiemReadinessData(): SiemReadinessData {
  const coverage = computeCoverage(MOCK_RULES, MOCK_INTEGRATIONS);
  return {
    loading: false,
    coverage,
    categories:     MOCK_CATEGORIES,
    integrations:   MOCK_INTEGRATIONS,
    qualityResults: MOCK_QUALITY,
    pipelines:      MOCK_PIPELINES,
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
  blastRadius: number | null; // rules affected; null = not computable from current data
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
    return { color: 'danger', iconType: 'alert', title: `${critical.join(' and ')} ${critical.length === 1 ? 'has' : 'have'} critical issues.${warningText}`, body: 'Select Actions below for prioritised next steps.' };
  }
  return { color: 'warning', iconType: 'warning', title: `${warning.join(' and ')} ${warning.length === 1 ? 'has' : 'have'} warnings.`, body: 'Select Actions below for prioritised next steps.' };
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

// ─── Add to chat button — gradient text + productAgent icon (Figma: 1771:77498) ──

const AddToChatButton: React.FC = () => (
  <EuiButtonEmpty
    size="s"
    iconType="productAgent"
    iconSide="left"
    style={{ padding: '0 8px' }}
  >
    <span style={{
      background: 'linear-gradient(165.73deg, #1750BA 2.98%, #6B3C9F 66.24%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 500,
      fontSize: 14,
      lineHeight: '20px',
      whiteSpace: 'nowrap',
    }}>
      Add to chat
    </span>
  </EuiButtonEmpty>
);

const StatusHero: React.FC<{ summary: ReadinessSummary }> = ({ summary }) => {
  const msg = getOverallStatusMessage({
    coverage:   summary.pillars.coverage.status,
    quality:    summary.pillars.quality.status,
    continuity: summary.pillars.continuity.status,
    retention:  summary.pillars.retention.status,
  });
  const stripBg    = msg.color === 'danger' ? '#FFF3F1' : msg.color === 'warning' ? '#FFF8E6' : '#F0FFF4';
  const titleColor = msg.color === 'danger' ? '#BD271E' : msg.color === 'warning' ? '#CA8500' : '#017D73';
  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" data-test-subj="siemReadiness-statusBanner">
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
                <EuiText size="s">
                  <strong style={{ color: titleColor }}>
                    {`${summary.pillars.coverage.blastRadius ?? 0} rules affected, ${summary.pillars.quality.metricValue} indices have field issues, ${summary.volumeDropCount} streams are dropping events, ${summary.retentionBelowBenchmark} below retention benchmark.`}
                  </strong>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <AddToChatButton />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPanel>
  );
};

// ─── Overall status card (stats + pillar summaries) ──────────────────────────

const PILLAR_SUBLABELS: Record<VisibilityTabId, { label: string; colorKey: 'danger' | 'warning' }> = {
  coverage:   { label: 'Rules with supporting data',    colorKey: 'danger'  },
  quality:    { label: 'Indices with field issues',      colorKey: 'danger'  },
  continuity: { label: 'Volume drops (>50%)',            colorKey: 'danger'  },
  retention:  { label: 'Data streams below benchmark',   colorKey: 'warning' },
};

const OverallStatusCard: React.FC<{ summary: ReadinessSummary }> = ({ summary }) => {
  const { euiTheme } = useEuiTheme();
  const borderStyle = `1px solid ${euiTheme.colors.lightShade}`;

  const stats = [
    { description: 'Enabled rules',            title: summary.enabledRules,            titleColor: 'default' as const },
    { description: 'Silent data streams',       title: summary.silentStreams,            titleColor: summary.silentStreams > 0 ? 'danger' as const : 'default' as const },
    { description: 'Categories missing data',   title: summary.categoriesMissingData,   titleColor: summary.categoriesMissingData > 0 ? 'danger' as const : 'default' as const },
    { description: 'Retention below benchmark', title: summary.retentionBelowBenchmark, titleColor: summary.retentionBelowBenchmark > 0 ? 'warning' as const : 'default' as const },
  ];

  const pillars: Array<{ id: VisibilityTabId; label: string }> = [
    { id: 'coverage',   label: 'Coverage'   },
    { id: 'quality',    label: 'Quality'    },
    { id: 'continuity', label: 'Continuity' },
    { id: 'retention',  label: 'Retention'  },
  ];

  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" data-test-subj="siemReadiness-overallStatusCard">
      {/* Pillar blocks with blast radius */}
      <div style={{ display: 'flex', minHeight: 80, margin: '0 -16px' }}>
        {pillars.map(({ id, label }, idx) => {
          const pillar     = summary.pillars[id];
          const sub        = PILLAR_SUBLABELS[id];
          const badgeColor = pillar.status === 'critical' ? 'danger' as const : pillar.status === 'warning' ? 'warning' as const : 'success' as const;
          const badgeLabel = pillar.status === 'critical' ? 'Critical' : pillar.status === 'warning' ? 'Warning' : 'Healthy';
          const valueColor = sub.colorKey === 'danger' ? '#BD271E' : '#CA8500';
          const blastColor = pillar.status === 'critical' ? euiTheme.colors.dangerText : euiTheme.colors.warningText;
          return (
            <React.Fragment key={id}>
              {idx > 0 && (
                <div style={{ width: 0, borderLeft: borderStyle, flexShrink: 0, margin: '8px 0' }} />
              )}
              <div style={{ flex: 1, padding: '4px 16px 8px 16px' }} data-test-subj={`siemReadiness-pillarBlock-${id}`}>
                {/* Title + badge */}
                <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{label}</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color={badgeColor}>{badgeLabel}</EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="xs" />

                {/* Primary pillar metric (unchanged) */}
                <EuiText size="xs" color="subdued">
                  {sub.label}:{' '}
                  <strong style={{ color: pillar.hasIssues ? valueColor : undefined }}>
                    {String(pillar.metricValue)}
                  </strong>
                </EuiText>

                {/* Blast radius — rules affected */}
                {pillar.hasIssues && (
                  <>
                    <EuiSpacer size="xs" />
                    <EuiText size="xs" data-test-subj={`siemReadiness-blastRadius-${id}`}>
                      <span style={{ color: blastColor }}>
                        <strong>{pillar.blastRadius !== null ? pillar.blastRadius : '—'}</strong>
                      </span>
                      {' rules affected'}
                    </EuiText>
                  </>
                )}
              </div>
            </React.Fragment>
          );
        })}
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

const PillarCards: React.FC<PillarCardsProps> = ({ summary }) => {
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
              paddingSize="m"
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

// ─── Actions panel ────────────────────────────────────────────────────────────

interface ActionItem {
  fixRecommendation: string;
  id: string;
  priority: number;
  severity: 'critical' | 'warning';
  pillar: VisibilityTabId;
  title: string;
  description: string;
  rulesAffected: number;
  mitreTactics: string[];
  platforms: string[];
  fixLink: string;
}

const INTEGRATION_MITRE: Record<string, string[]> = {
  endpoint:         ['Initial Access', 'Execution', 'Defense Evasion'],
  okta:             ['Initial Access', 'Credential Access', 'Privilege Escalation'],
  aws:              ['Discovery', 'Exfiltration', 'Collection'],
  network_traffic:  ['Lateral Movement', 'Command and Control'],
  google_workspace: ['Initial Access', 'Collection'],
  windows:          ['Execution', 'Persistence', 'Privilege Escalation'],
  zeek:             ['Command and Control', 'Lateral Movement'],
};

function deriveActionItems(
  coverage: RuleIntegrationCoverage | null,
  integrations: SiemReadinessPackageInfo[],
  ruleFieldIssues: RuleFieldIssue[],
  pipelines: PipelineStats[],
  retentionItems: RetentionItem[],
  categories: CategoryGroup[]
): ActionItem[] {
  const items: Omit<ActionItem, 'priority'>[] = [];
  const integrationMap = new Map(integrations.map((p) => [p.name, p]));

  // Coverage: one action per missing integration, count how many rules reference it
  const missingSet = new Set(coverage?.missingIntegrations ?? []);
  const rulesByPkg = new Map<string, number>();
  coverage?.uncoveredRules.forEach((rule) => {
    rule.related_integrations?.forEach((ri) => {
      if (missingSet.has(ri.package)) {
        rulesByPkg.set(ri.package, (rulesByPkg.get(ri.package) ?? 0) + 1);
      }
    });
  });
  missingSet.forEach((pkg) => {
    const info  = integrationMap.get(pkg);
    const title = info?.title ?? pkg;
    const rules = rulesByPkg.get(pkg) ?? 1;
    items.push({
      id: `coverage-${pkg}`, severity: 'critical', pillar: 'coverage',
      title: `Install ${title} integration`,
      description: `${rules} detection rule${rules !== 1 ? 's' : ''} require ${title} but it is not installed or has no active policy. These rules will not match any events.`,
      fixRecommendation: `Go to Fleet → Integrations, search for "${title}", install it, and create an agent policy. Once active, affected rules will begin matching events automatically.`,
      rulesAffected: rules,
      mitreTactics: INTEGRATION_MITRE[pkg] ?? [],
      platforms: [title],
      fixLink: `Fleet → Integration Policies → ${title}`,
    });
  });

  // Quality: all marked Critical (pillar is Critical) — pick most impactful issue types
  const qualityIssueLabels = { missing: 'Field missing', type_mismatch: 'Type mismatch', sparse: 'Sparsely populated' };
  ruleFieldIssues.forEach((issue) => {
    items.push({
      id: `quality-${issue.id}`, severity: 'critical' as const, pillar: 'quality',
      title: `${qualityIssueLabels[issue.issueType] ?? issue.issueType}: ${issue.field}`,
      description: `Rule "${issue.ruleName}" references ${issue.field} in ${issue.indexPattern}, but this field is ${issue.issueType === 'missing' ? 'absent' : issue.issueType === 'type_mismatch' ? 'incorrectly typed' : 'present in fewer than 10% of documents'}.`,
      fixRecommendation: issue.issueType === 'missing'
        ? `Update the rule's index pattern or enrich your data pipeline so that "${issue.field}" is populated in ${issue.indexPattern}.`
        : issue.issueType === 'type_mismatch'
          ? `Check the field mapping for "${issue.field}" in ${issue.indexPattern} and align it with the ECS type expected by the rule.`
          : `Investigate why "${issue.field}" is sparsely populated. Ensure your integration is sending complete event data.`,
      rulesAffected: issue.issueType === 'missing' ? 3 : 2,
      mitreTactics: [],
      platforms: [issue.indexPattern.split('.').slice(0, 2).join('.')],
      fixLink: `Security → Rules → "${issue.ruleName}"`,
    });
  });

  // Continuity: Warning (pillar is Warning — volume drops, not silent)
  pipelines.forEach((p) => {
    const isSilent = p.docsCount === 0;
    const rate = p.docsCount > 0 ? (p.failedDocsCount / p.docsCount) * 100 : 0;
    if (!isSilent && rate < 1) return;
    const dataset = p.indices[0] ?? p.name;
    items.push({
      id: `continuity-${p.name}`, severity: 'warning' as const, pillar: 'continuity',
      title: isSilent ? `Silent data stream: ${dataset}` : `High failure rate: ${dataset}`,
      description: isSilent
        ? `No data received in the last 24 hours. Detection rules depending on this stream will not match any events.`
        : `${rate.toFixed(1)}% of docs are failing ingestion (${p.failedDocsCount.toLocaleString()} of ${p.docsCount.toLocaleString()}). Events are being dropped.`,
      fixRecommendation: isSilent
        ? `Check the integration configuration in Fleet. Verify the agent is running and the data stream is active. Restart the agent if necessary.`
        : `Review the ingest pipeline for "${dataset}" in Fleet. Check for parsing errors or mapping conflicts causing documents to fail.`,
      rulesAffected: 5,
      mitreTactics: [],
      platforms: [dataset.split('.').slice(0, 2).join('.')],
      fixLink: `Fleet → Data Streams → ${dataset}`,
    });
  });

  // Retention: one grouped action showing total non-compliant count
  const nonCompliantRetention = retentionItems.filter((r) => r.status === 'non-compliant');
  if (nonCompliantRetention.length > 0) {
    items.push({
      id: 'retention-benchmark',
      severity: 'warning',
      pillar: 'retention',
      title: `Data streams below benchmark: ${nonCompliantRetention.length}`,
      description: `${nonCompliantRetention.length} data streams do not meet the required retention benchmark. Update your ILM or data lifecycle policies to ensure compliance.`,
      fixRecommendation: `Open Stack Management → Index Lifecycle Management. For each affected data stream, update the policy to extend the retention period to meet the required benchmark (90–180 days depending on category).`,
      rulesAffected: nonCompliantRetention.length,
      mitreTactics: [],
      platforms: [...new Set(nonCompliantRetention.map((r) => r.indexName.split('.').slice(0, 2).join('.')))].slice(0, 3),
      fixLink: 'Stack Management → Index Lifecycle Management → Data Streams',
    });
  }

  // Structured selection: 2 Coverage (Critical) + 2 Quality (Critical) + 1 Continuity (Warning) + 1 Retention (Warning)
  const byPillar = (pillar: VisibilityTabId) =>
    items.filter((i) => i.pillar === pillar).sort((a, b) => b.rulesAffected - a.rulesAffected);

  const structured = [
    ...byPillar('coverage').slice(0, 2),
    ...byPillar('quality').slice(0, 2),
    ...byPillar('continuity').slice(0, 1),
    ...byPillar('retention').slice(0, 1),
  ];

  return structured.map((item, i) => ({ ...item, priority: i + 1 }));
}

interface ActionsPanelProps {
  coverage: RuleIntegrationCoverage | null;
  integrations: SiemReadinessPackageInfo[];
  ruleFieldIssues: RuleFieldIssue[];
  pipelines: PipelineStats[];
  retentionItems: RetentionItem[];
  categories: CategoryGroup[];
}

const ALL_CATEGORIES: VisibilityTabId[] = ['coverage', 'quality', 'continuity', 'retention'];
const ALL_SEVERITIES: Array<'critical' | 'warning'> = ['critical', 'warning'];
const CATEGORY_LABELS: Record<VisibilityTabId, string> = { coverage: 'Coverage', quality: 'Quality', continuity: 'Continuity', retention: 'Retention' };

const ActionsPanel: React.FC<ActionsPanelProps> = (props) => {
  const allActions = useMemo(
    () => deriveActionItems(props.coverage, props.integrations, props.ruleFieldIssues, props.pipelines, props.retentionItems, props.categories),
    [props.coverage, props.integrations, props.ruleFieldIssues, props.pipelines, props.retentionItems, props.categories]
  );

  // Filter state
  const [activeCats, setActiveCats] = useState<Set<VisibilityTabId>>(new Set(ALL_CATEGORIES));
  const [activeSevs, setActiveSevs] = useState<Set<'critical' | 'warning'>>(new Set(ALL_SEVERITIES));
  const [catOpen, setCatOpen] = useState(false);
  const [sevOpen, setSevOpen] = useState(false);

  // Multi-select state (Change 3)
  const [selectedFindings, setSelectedFindings] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; color: 'success' | 'danger' }>>([]);

  const actions = useMemo(
    () => allActions.filter((a) => activeCats.has(a.pillar) && activeSevs.has(a.severity)),
    [allActions, activeCats, activeSevs]
  );

  // Select-all state: none | indeterminate | all
  const allSelected   = actions.length > 0 && selectedFindings.size === actions.length;
  const someSelected  = selectedFindings.size > 0 && !allSelected;

  const toggleFinding = (id: string) => setSelectedFindings((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFindings(new Set());
    } else {
      setSelectedFindings(new Set(actions.map((a) => a.id)));
    }
  };

  const handleBulkCreate = () => {
    const n = selectedFindings.size;
    setSelectedFindings(new Set());
    setToasts((prev) => [...prev, {
      id: Date.now().toString(),
      title: `Cases created for ${n} finding${n !== 1 ? 's' : ''}`,
      color: 'success',
    }]);
  };

  const toggleCat = (id: VisibilityTabId) => setActiveCats((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSev = (id: 'critical' | 'warning') => setActiveSevs((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <>
      {/* Toast notifications */}
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={({ id }) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        toastLifeTimeMs={4000}
      />

      {/* Header row — count + select all + bulk left | filters right */}
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="xs">
        <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">Sorted by severity · rules affected</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              iconType="documents"
              iconSide="left"
              onClick={handleSelectAll}
              data-test-subj="siemReadiness-selectAll"
            >
              Select all {actions.length}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              iconType="arrowDown"
              iconSide="right"
              isDisabled={selectedFindings.size === 0}
              onClick={handleBulkCreate}
              data-test-subj="siemReadiness-bulkCreateCases"
            >
              Bulk actions
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiFilterGroup compressed>
            {/* Category filter */}
            <EuiPopover
              isOpen={catOpen}
              closePopover={() => setCatOpen(false)}
              button={
                <EuiFilterButton
                  iconType="arrowDown"
                  iconSide="right"
                  onClick={() => setCatOpen((v) => !v)}
                  isSelected={catOpen}
                  numFilters={ALL_CATEGORIES.length}
                  numActiveFilters={activeCats.size}
                  hasActiveFilters={activeCats.size < ALL_CATEGORIES.length}
                  withNext
                >
                  Category
                </EuiFilterButton>
              }
              panelPaddingSize="none"
            >
              <EuiSelectable
                options={ALL_CATEGORIES.map((id) => ({ label: CATEGORY_LABELS[id], key: id, checked: activeCats.has(id) ? 'on' as const : undefined }))}
                onChange={(opts) => {
                  const next = new Set<VisibilityTabId>();
                  opts.forEach((o) => { if (o.checked === 'on') next.add(o.key as VisibilityTabId); });
                  setActiveCats(next);
                }}
                listProps={{ bordered: false }}
              >
                {(list) => <div style={{ minWidth: 180 }}>{list}</div>}
              </EuiSelectable>
            </EuiPopover>

            {/* Severity filter */}
            <EuiPopover
              isOpen={sevOpen}
              closePopover={() => setSevOpen(false)}
              button={
                <EuiFilterButton
                  iconType="arrowDown"
                  iconSide="right"
                  onClick={() => setSevOpen((v) => !v)}
                  isSelected={sevOpen}
                  numFilters={ALL_SEVERITIES.length}
                  numActiveFilters={activeSevs.size}
                  hasActiveFilters={activeSevs.size < ALL_SEVERITIES.length}
                >
                  Severity
                </EuiFilterButton>
              }
              panelPaddingSize="none"
            >
              <EuiSelectable
                options={ALL_SEVERITIES.map((id) => ({ label: id === 'critical' ? 'Critical' : 'Warning', key: id, checked: activeSevs.has(id) ? 'on' as const : undefined }))}
                onChange={(opts) => {
                  const next = new Set<'critical' | 'warning'>();
                  opts.forEach((o) => { if (o.checked === 'on') next.add(o.key as 'critical' | 'warning'); });
                  setActiveSevs(next);
                }}
                listProps={{ bordered: false }}
              >
                {(list) => <div style={{ minWidth: 160 }}>{list}</div>}
              </EuiSelectable>
            </EuiPopover>
          </EuiFilterGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {actions.length === 0 ? (
        <EuiEmptyPrompt
          iconType="checkInCircleFilled"
          color="success"
          title={<h3>No actions required</h3>}
          titleSize="xs"
          body={<EuiText size="s"><p>All pillars are healthy. No remediation needed.</p></EuiText>}
        />
      ) : (
        <EuiFlexGroup direction="column" gutterSize="s" responsive={false} data-test-subj="siemReadiness-actionsList">
          {actions.map((action) => {
            const pillarLabel = { coverage: 'Coverage', quality: 'Quality', continuity: 'Continuity', retention: 'Retention' }[action.pillar].toUpperCase();
            const borderColor = action.severity === 'critical' ? '#ffc9c2' : '#FEECB3';
            const now = new Date();
            const timestamp = `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} @ ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
            return (
              <EuiFlexItem key={action.id}>
                <div
                  style={{
                    background: 'white',
                    borderLeft: `4px solid ${borderColor}`,
                    border: `1px solid #D3DAE6`,
                    borderLeftWidth: 4,
                    borderLeftColor: borderColor,
                    borderRadius: 4,
                    padding: '10px 10px 10px 16px',
                  }}
                  data-test-subj={`siemReadiness-actionItem-${action.id}`}
                >
                  {/* ── Row 1: checkbox + pillar + severity   |   rules affected + separator + action + ellipsis ── */}
                  <EuiFlexGroup alignItems="center" gutterSize="none" responsive={false}>
                    {/* Left side — grows to push right group to far edge */}
                    <EuiFlexItem>
                      <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiCheckbox
                            id={`siemReadiness-finding-${action.id}`}
                            label=""
                            checked={selectedFindings.has(action.id)}
                            onChange={() => toggleFinding(action.id)}
                            aria-label={`Select finding ${action.title}`}
                            data-test-subj={`siemReadiness-findingCheck-${action.id}`}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="xs" style={{ fontWeight: 600, color: '#516381', letterSpacing: '0.06em' }}>
                            {pillarLabel}
                          </EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color={action.severity === 'critical' ? 'danger' : 'warning'}>
                            {action.severity === 'critical' ? 'Critical' : 'Warning'}
                          </EuiBadge>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                    {/* Right side — always at far right */}
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow" iconType="radar" iconSide="left">
                            {action.rulesAffected} rule{action.rulesAffected !== 1 ? 's' : ''} affected
                          </EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <div style={{ width: 1, height: 20, background: '#D3DAE6' }} />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonEmpty size="xs" iconType="wrench" iconSide="left" color="primary" href={action.fixLink ? '#' : undefined} data-test-subj={`siemReadiness-actionHere-${action.id}`}>
                            Action here
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonIcon
                            size="xs"
                            iconType="boxesHorizontal"
                            color="primary"
                            aria-label="More actions"
                            data-test-subj={`siemReadiness-moreActions-${action.id}`}
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  {/* ── Row 2: title + timestamp ── */}
                  <EuiSpacer size="xs" />
                  <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" style={{ fontWeight: 600 }}>{action.title}</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" color="subdued">{timestamp}</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  {/* ── Summary card ── */}
                  <EuiSpacer size="s" />
                  <div style={{ background: '#F6F9FC', borderRadius: 4, padding: '8px 8px 8px 12px' }}>
                    <EuiText size="xs">
                      <p style={{ margin: 0 }}><strong>Issue:</strong>{' '}{action.description}</p>
                    </EuiText>
                    <EuiSpacer size="xs" />
                    <EuiText size="xs">
                      <p style={{ margin: 0 }}><strong>Action:</strong>{' '}{action.fixRecommendation}</p>
                    </EuiText>
                  </div>
                </div>
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      )}
    </>
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

// ─── Shared blast-radius utilities ───────────────────────────────────────────

const INDEX_PREFIX_TO_INTEGRATION: Record<string, string> = {
  'ds-auditbeat':        'zeek',
  'logs-endpoint':       'endpoint',
  'logs-okta':           'okta',
  'logs-aws':            'aws',
  'logs-network':        'network_traffic',
  'logs-google':         'google_workspace',
  'logs-salesforce':     'google_workspace',
};

const INDEX_PREFIX_TO_PLATFORM: Record<string, string> = {
  'ds-auditbeat':        'Network',
  'logs-endpoint':       'Endpoint',
  'logs-okta':           'Identity',
  'logs-aws':            'Cloud',
  'logs-network':        'Network',
  'logs-google':         'Application/SaaS',
  'logs-salesforce':     'Application/SaaS',
};

function getIndexPrefix(indexName: string): string {
  return indexName.split('-').slice(0, 2).join('-');
}
function getTacticsFromIndex(indexName: string): string[] {
  const integration = INDEX_PREFIX_TO_INTEGRATION[getIndexPrefix(indexName)];
  return integration ? (INTEGRATION_MITRE[integration] ?? []) : [];
}
function getPlatformFromIndex(indexName: string): string {
  return INDEX_PREFIX_TO_PLATFORM[getIndexPrefix(indexName)] ?? '—';
}

const CATEGORY_TO_INTEGRATION: Record<string, string> = {
  'Network':          'zeek',
  'Endpoint':         'endpoint',
  'Identity':         'okta',
  'Cloud':            'aws',
  'Application/SaaS': 'google_workspace',
};
function getTacticsFromCategory(category: string): string[] {
  const integration = CATEGORY_TO_INTEGRATION[category];
  return integration ? (INTEGRATION_MITRE[integration] ?? []) : [];
}

// Shared tactics cell: shows up to 3 badges + "+N more" tooltip
const TacticsCell: React.FC<{ tactics: string[] }> = ({ tactics }) => {
  if (tactics.length === 0) return <EuiText size="s" color="subdued">—</EuiText>;
  const visible = tactics.slice(0, 3);
  const rest    = tactics.slice(3);
  return (
    <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
      {visible.map((t) => (
        <EuiFlexItem key={t} grow={false}><EuiBadge color="primary">{t}</EuiBadge></EuiFlexItem>
      ))}
      {rest.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiToolTip content={rest.join(', ')} data-test-subj="siemReadiness-tacticsMore">
            <EuiBadge color="hollow">+{rest.length} more</EuiBadge>
          </EuiToolTip>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

// ─── Shared: Rules Affected flyout ───────────────────────────────────────────

interface FlyoutRule { name: string; tactics: string[]; status: 'in-actions' | 'no-action' }

interface RulesAffectedFlyoutProps {
  findingName: string;
  rules: FlyoutRule[];
  onClose: () => void;
}

const RulesAffectedFlyout: React.FC<RulesAffectedFlyoutProps> = ({ findingName, rules, onClose }) => (
  <EuiFlyout ownFocus onClose={onClose} size="m" data-test-subj="siemReadiness-rulesAffectedFlyout">
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="s"><h2>Rules affected by {findingName}</h2></EuiTitle>
    </EuiFlyoutHeader>
    <EuiFlyoutBody>
      {rules.length === 0 ? (
        <EuiText size="s" color="subdued"><p>No specific rules could be identified for this finding.</p></EuiText>
      ) : (
        <EuiBasicTable
          items={rules}
          columns={[
            {
              field: 'name',
              name: 'Rule',
              render: (name: string) => (
                <EuiLink href="/app/security/rules" target="_blank" data-test-subj="siemReadiness-ruleFlyoutLink">
                  {name}
                </EuiLink>
              ),
            },
            {
              field: 'tactics',
              name: 'MITRE Tactics',
              render: (tactics: string[]) => (
                tactics.length > 0
                  ? <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                      {tactics.map((t) => <EuiFlexItem key={t} grow={false}><EuiBadge color="primary">{t}</EuiBadge></EuiFlexItem>)}
                    </EuiFlexGroup>
                  : <EuiText size="s" color="subdued">—</EuiText>
              ),
            },
            {
              field: 'status',
              name: 'Status',
              render: (status: string) =>
                status === 'in-actions'
                  ? <EuiBadge color="warning" data-test-subj="siemReadiness-ruleFlyoutInActions">In Actions</EuiBadge>
                  : <EuiText size="s" color="subdued">No action yet</EuiText>,
            },
          ] as Array<EuiBasicTableColumn<FlyoutRule>>}
          itemId="name"
        />
      )}
    </EuiFlyoutBody>
  </EuiFlyout>
);

// ─── Coverage tab ─────────────────────────────────────────────────────────────

interface CoverageTabProps {
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
  loading: boolean;
  actionItemIds: Set<string>;
  pillarStatus: ReadinessStatus;
  onAskAI?: (msg: string) => void;
}

interface PlatformSubRow {
  id: string;
  name: string;
  icon: string;
  coverage: 'Good' | 'Degraded' | 'Missing data';
  rulesAffected: number;
  tactics: string[];
  action: 'Install' | 'Fix' | null;
}

const CATEGORY_PLATFORMS: Record<string, PlatformSubRow[]> = {
  'Network': [
    { id: 'palo-alto-prod',   name: 'Palo Alto Prod',    icon: 'globe',   coverage: 'Good',         rulesAffected: 0,  tactics: [],                    action: null      },
    { id: 'vpn-corp',         name: 'VPN/Corp',           icon: 'globe',   coverage: 'Missing data', rulesAffected: 76, tactics: ['Lateral Movement'],   action: 'Install' },
  ],
  'Cloud': [
    { id: 'aws-prod',         name: 'AWS Prod',           icon: 'compute', coverage: 'Degraded',     rulesAffected: 12, tactics: ['Initial Access'],      action: 'Fix'     },
    { id: 'aws-biztech',      name: 'AWS BizTech',        icon: 'compute', coverage: 'Missing data', rulesAffected: 49, tactics: ['Privilege Escalation'], action: 'Install' },
  ],
  'Endpoint': [
    { id: 'macos-endpoints',  name: 'macOS Endpoints',    icon: 'desktop', coverage: 'Good',         rulesAffected: 0,  tactics: [],                       action: null      },
    { id: 'windows-endpoints',name: 'Windows Endpoints',  icon: 'desktop', coverage: 'Missing data', rulesAffected: 24, tactics: ['Execution'],              action: 'Install' },
  ],
  'Identity': [
    { id: 'okta',             name: 'Okta',               icon: 'lock',    coverage: 'Missing data', rulesAffected: 17, tactics: ['Credential Access'],      action: 'Install' },
    { id: 'azure-ad',         name: 'Azure AD',           icon: 'lock',    coverage: 'Good',         rulesAffected: 0,  tactics: [],                       action: null      },
  ],
  'Application/SaaS': [
    { id: 'google-workspace', name: 'Google Workspace',   icon: 'globe',   coverage: 'Good',         rulesAffected: 0,  tactics: [],                       action: null      },
    { id: 'salesforce',       name: 'Salesforce',         icon: 'globe',   coverage: 'Missing data', rulesAffected: 17, tactics: ['Initial Access', 'Collection'], action: 'Install' },
  ],
};

const CATEGORY_INTEGRATIONS: Record<string, string[]> = {
  'Endpoint':         ['endpoint', 'elastic_agent', 'windows'],
  'Identity':         ['okta', 'azure_ad'],
  'Network':          ['network_traffic', 'zeek'],
  'Cloud':            ['aws', 'azure', 'gcp'],
  'Application/SaaS': ['google_workspace', 'salesforce'],
};

const CoverageTab: React.FC<CoverageTabProps> = ({ coverage, categories, integrations, loading, actionItemIds, pillarStatus, onAskAI }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
  const [ruleSubTab, setRuleSubTab] = useState<'all' | 'mitre'>('all');
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);
  const [openCoverageRows, setOpenCoverageRows] = useState<Record<string, boolean>>({});

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

  // Build rules-affected map from coverage data
  const rulesByPkg = useMemo(() => {
    const map = new Map<string, number>();
    const missing = new Set(coverage?.missingIntegrations ?? []);
    coverage?.uncoveredRules.forEach((rule) => {
      rule.related_integrations?.forEach((ri) => {
        if (missing.has(ri.package)) map.set(ri.package, (map.get(ri.package) ?? 0) + 1);
      });
    });
    return map;
  }, [coverage]);

  const ruleCoverageColumns: Array<EuiBasicTableColumn<CategoryAccordionItem>> = [
    { field: 'name', name: 'Integration' },
    {
      field: 'status' as const,
      name: 'Status',
      width: '140px',
      render: (_: CategoryAccordionItem['status'], row: CategoryAccordionItem) => {
        const color = row.status === 'covered' ? 'success' : row.status === 'warning' ? 'warning' : 'danger';
        return <EuiHealth color={color}>{row.detail}</EuiHealth>;
      },
    },
    {
      name: 'Rules affected',
      width: '120px',
      render: (row: CategoryAccordionItem) => {
        const count = rulesByPkg.get(row.id);
        if (!count) return <EuiText size="s" color="subdued">—</EuiText>;
        const tactics = INTEGRATION_MITRE[row.id] ?? [];
        const flyoutRules: FlyoutRule[] = Array.from({ length: count }, (_, i) => ({
          name: `Rule using ${row.name} (${i + 1})`,
          tactics,
          status: actionItemIds.has(`coverage-${row.id}`) ? 'in-actions' : 'no-action',
        }));
        return (
          <EuiButtonEmpty size="xs" flush="left" onClick={() => setFlyout({ findingName: row.name, rules: flyoutRules })} data-test-subj={`siemReadiness-coverageRulesAffected-${row.id}`}>
            {count}
          </EuiButtonEmpty>
        );
      },
    },
    {
      name: 'Tactics',
      render: (row: CategoryAccordionItem) => <TacticsCell tactics={INTEGRATION_MITRE[row.id] ?? []} />,
    },
    {
      name: 'Platform',
      width: '110px',
      render: (row: CategoryAccordionItem) => <EuiBadge color="hollow">{row.name}</EuiBadge>,
    },
    {
      name: 'Action',
      width: '150px',
      render: (row: CategoryAccordionItem) =>
        actionItemIds.has(`coverage-${row.id}`)
          ? <EuiBadge color="warning" data-test-subj={`siemReadiness-coverageInActions-${row.id}`}>In Actions</EuiBadge>
          : <EuiButtonEmpty size="xs" color="primary" iconType="popout" data-test-subj={`siemReadiness-coverageCreateCase-${row.id}`}>View in Fleet</EuiButtonEmpty>,
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
      {/* Dependency graph flyout */}
      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}

      {/* ── Rule Coverage panel ── */}
      <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs"><h3>Data rule coverage</h3></EuiTitle>
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
        <EuiCallOut color={calloutColor} size="s" title={<>No rules are currently enabled — get started by installing and enabling rules in <EuiLink href="#">detection rules</EuiLink>.</>} />
      ) : (coverage?.uncoveredRules.length ?? 0) > 0 ? (
        <EuiCallOut color={calloutColor} size="s" title={<>{coverage?.uncoveredRules.length} rule{(coverage?.uncoveredRules.length ?? 0) !== 1 ? 's' : ''} have missing or disabled integrations. <EuiLink href="#">Learn more</EuiLink></>} />
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
              { id: 'enabled', statusColor: 'success' as const, label: 'Enabled Integrations',             count: coverage?.coveredRules.length ?? 0, rulesUnblocked: 0 },
              { id: 'missing', statusColor: 'danger'  as const, label: 'Missing or Disabled Integrations', count: coverage?.uncoveredRules.length ?? 0, rulesUnblocked: coverage?.uncoveredRules.length ?? 0 },
            ]}
            columns={[
              {
                field: 'label',
                name: 'Data Source status',
                render: (label: string, row: { statusColor: string; label: string; count: number; id: string; rulesUnblocked: number }) => (
                  <EuiHealth color={row.statusColor}>{label}</EuiHealth>
                ),
              },
              { field: 'count', name: '# of rules associated', width: '180px' },
              {
                field: 'rulesUnblocked',
                name: 'Rules unblocked if resolved',
                width: '200px',
                render: (n: number) =>
                  n > 0
                    ? <EuiText size="s" style={{ color: '#017D73', fontWeight: 600 }} data-test-subj="siemReadiness-rulesUnblocked">{n} rules</EuiText>
                    : <EuiText size="s" color="subdued">—</EuiText>,
              },
              {
                name: 'Actions',
                width: '180px',
                render: (row: { statusColor: string; label: string; count: number; id: string; rulesUnblocked: number }) => (
                  <EuiButtonEmpty size="xs" color="primary" data-test-subj={`siemReadiness-viewIntegrations-${row.id}`}>
                    View Integrations
                  </EuiButtonEmpty>
                ),
              },
            ] as Array<EuiBasicTableColumn<{ id: string; statusColor: string; label: string; count: number; rulesUnblocked: number }>>}
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
            <EuiTitle size="xs"><h3>Data coverage</h3></EuiTitle>
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

        <EuiCallOut color={calloutColor} size="s" title={<>Some log categories are missing integrations, limiting visibility and detection coverage. <EuiLink href="#">Learn more</EuiLink></>} />

        <EuiSpacer size="m" />

        <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
          Expand each log category to view platform-level coverage. Click a "Rules affected" count to ask the AI for remediation steps.
        </EuiText>

        {/* Data coverage accordion — same pattern as ECS field compatibility */}
        {(() => {
          const coverageBadge = (label: string) => {
            if (label === 'Good')         return <EuiBadge color="success">Good</EuiBadge>;
            if (label === 'Degraded')     return <EuiBadge color="warning">Degraded</EuiBadge>;
            if (label === 'Missing data') return <EuiBadge color="danger">Missing data</EuiBadge>;
            return <EuiBadge color="hollow">{label}</EuiBadge>;
          };
          const div = <div style={{ width: 1, height: 14, background: '#D3DAE6', margin: '0 2px' }} />;

          return (
            <EuiPanel hasBorder paddingSize="none" style={{ overflow: 'hidden' }}>
              {dataCategoryRows.map((row, idx) => {
                const platforms = CATEGORY_PLATFORMS[row.category] ?? [];
                const isOpen = openCoverageRows[row.id] ?? false;
                const toggle = () => setOpenCoverageRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }));
                return (
                  <div key={row.id}>
                    {/* ── Row header — always visible ── */}
                    <EuiFlexGroup
                      alignItems="center"
                      gutterSize="none"
                      responsive={false}
                      style={{ padding: '14px 16px', cursor: 'pointer' }}
                      onClick={toggle}
                    >
                      <EuiFlexItem grow={false} style={{ marginRight: 8 }}>
                        <EuiIcon
                          type={isOpen ? 'arrowDown' : 'arrowRight'}
                          size="s"
                          color="text"
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiText size="s" style={{ fontWeight: 600 }}>{row.category}</EuiText>
                      </EuiFlexItem>
                      {/* Right-side stats — stop propagation so links don't toggle */}
                      <EuiFlexItem grow={false} onClick={(e) => e.stopPropagation()}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                          <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Coverage:</EuiText></EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ marginLeft: 4 }}>{coverageBadge(row.statusLabel)}</EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ margin: '0 8px' }}>{div}</EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" color="subdued">Rules affected:{' '}
                              {row.rulesCount > 0
                                ? <EuiLink onClick={() => onAskAI?.(`What rules are affected by missing ${row.category} data and how do I fix it?`)}><strong>{row.rulesCount}</strong></EuiLink>
                                : <strong style={{ color: '#1d2a3e' }}>—</strong>
                              }
                            </EuiText>
                          </EuiFlexItem>
                          {platforms.length > 0 && (
                            <>
                              <EuiFlexItem grow={false} style={{ margin: '0 8px' }}>{div}</EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiText size="xs" color="subdued">Platforms: <strong style={{ color: '#1d2a3e' }}>{platforms.length}</strong></EuiText>
                              </EuiFlexItem>
                            </>
                          )}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>

                    {/* ── Expanded content ── */}
                    {isOpen && (
                      platforms.length > 0 ? (
                        <div style={{ padding: '0 16px 16px' }}>
                          <EuiBasicTable
                            items={platforms}
                            columns={[
                              {
                                field: 'name',
                                name: 'Platform',
                                render: (name: string, sub: PlatformSubRow) => (
                                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                                    <EuiFlexItem grow={false}><EuiIcon type={sub.icon} size="s" color="subdued" /></EuiFlexItem>
                                    <EuiFlexItem grow={false}><EuiText size="s">{name}</EuiText></EuiFlexItem>
                                  </EuiFlexGroup>
                                ),
                              },
                              {
                                field: 'coverage',
                                name: 'Coverage',
                                width: '160px',
                                render: (label: string) => coverageBadge(label),
                              },
                              {
                                field: 'rulesAffected',
                                name: 'Rules affected',
                                width: '130px',
                                render: (count: number, sub: PlatformSubRow) =>
                                  count > 0
                                    ? <EuiLink onClick={() => onAskAI?.(`What rules are affected by issues with ${sub.name}?`)}>{count}</EuiLink>
                                    : <EuiText size="s" color="subdued">—</EuiText>,
                              },
                              {
                                field: 'tactics',
                                name: 'MITRE tactics at risk',
                                render: (tactics: string[]) =>
                                  tactics.length > 0
                                    ? <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                                        {tactics.map((t) => <EuiFlexItem key={t} grow={false}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>)}
                                      </EuiFlexGroup>
                                    : <EuiText size="s" color="subdued">—</EuiText>,
                              },
                              {
                                field: 'action',
                                name: 'Action',
                                width: '100px',
                                render: (action: PlatformSubRow['action']) =>
                                  action
                                    ? <EuiButtonEmpty size="xs" color="primary">{action}</EuiButtonEmpty>
                                    : <EuiText size="s" color="subdued">—</EuiText>,
                              },
                            ] as Array<EuiBasicTableColumn<PlatformSubRow>>}
                            itemId="id"
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '0 16px 16px' }}>
                          <EuiCallOut size="s" iconType="iInCircle" title="Platform-level breakdown coming in M2">
                            <EuiText size="xs">
                              <p>Platform sub-row expansion for <strong>{row.category}</strong> will be available once stream-to-platform dependency mapping ships in M2.</p>
                            </EuiText>
                          </EuiCallOut>
                        </div>
                      )
                    )}
                    {idx < dataCategoryRows.length - 1 && <EuiHorizontalRule margin="none" />}
                  </div>
                );
              })}
            </EuiPanel>
          );
        })()}
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

interface QualityTabProps { categories: CategoryGroup[]; qualityResults: QualityResult[]; ruleFieldIssues: RuleFieldIssue[]; loading: boolean; actionItemIds: Set<string>; pillarStatus: ReadinessStatus; onAskAI?: (msg: string) => void }

const PLATFORM_HEALTH: Array<{ name: string; pct: number }> = [
  { name: 'GCP',              pct: 80  },
  { name: 'AWS Prod',         pct: 87  },
  { name: 'Identity',         pct: 100 },
  { name: 'macOS Endpoints',  pct: 100 },
];

const QualityTab: React.FC<QualityTabProps> = ({ categories, qualityResults, ruleFieldIssues, loading, actionItemIds, pillarStatus, onAskAI }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
  const { euiTheme } = useEuiTheme();
  const [filter, setFilter] = useState<'all' | 'incompatible' | 'healthy'>('all');
  const [search, setSearch] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);

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
    { field: 'indexName', name: 'Indices', truncateText: true, sortable: true, width: '30%' },
    { field: 'incompatibleFieldCount', name: 'Incompatible fields', sortable: true, width: '14%',
      render: (n: number) => <EuiText size="s">{n}</EuiText> },
    { field: 'checkedAt', name: 'Last checked', sortable: true, width: '14%',
      render: (t?: number) => <EuiText size="s" color={t ? undefined : 'subdued'}>{relativeTime(t)}</EuiText> },
    { field: 'status', name: 'Status', sortable: true, width: '12%',
      render: (s: string) => (
        <EuiBadge color={s === 'incompatible' ? 'warning' : 'success'}>
          {s === 'incompatible' ? 'Incompatible' : 'Healthy'}
        </EuiBadge>
      ) },
    {
      name: 'Tactics',
      width: '16%',
      render: (row: QualityIndexItem) => <TacticsCell tactics={getTacticsFromIndex(row.indexName)} />,
    },
    {
      name: 'Platform',
      width: '10%',
      render: (row: QualityIndexItem) => <EuiBadge color="hollow">{getPlatformFromIndex(row.indexName)}</EuiBadge>,
    },
    {
      name: 'Actions',
      width: '14%',
      render: (row: QualityIndexItem) => (
        <EuiButtonEmpty size="xs" color="primary" flush="left" onClick={() => setFlyout({ findingName: row.indexName, rules: getTacticsFromIndex(row.indexName).length > 0 ? [{ name: `Rule targeting ${row.indexName}`, tactics: getTacticsFromIndex(row.indexName), status: 'no-action' }] : [] })} data-test-subj={`siemReadiness-qualityRulesAffected-${row.id}`}>
          View Data quality
        </EuiButtonEmpty>
      ),
    },
  ];

  const overallHealthPct = Math.round(
    PLATFORM_HEALTH.reduce((s, p) => s + p.pct, 0) / PLATFORM_HEALTH.length
  );
  const healthColor = overallHealthPct < 80 ? 'danger' : overallHealthPct < 95 ? 'warning' : 'success';
  const pctColor = (pct: number) => pct >= 95 ? 'success' : pct >= 80 ? 'warning' : 'danger';

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

  const categoryStatusBadge = (incompatFields: number) => {
    if (incompatFields >= 3) return <EuiBadge color="danger">Actions required</EuiBadge>;
    if (incompatFields > 0)  return <EuiBadge color="warning">Actions required</EuiBadge>;
    return <EuiBadge color="success">Healthy</EuiBadge>;
  };

  const metaDivider = <div style={{ width: 1, height: 14, background: '#D3DAE6', margin: '0 2px' }} />;

  return (
    <>
      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}

      {/* ── Rule-data health — single card with dividers (matches OverallStatusCard style) ── */}
      <EuiPanel hasBorder hasShadow={false} paddingSize="m">
        <div style={{ display: 'flex', margin: '0 -16px' }}>
          {[{ name: 'Overall rule-data health', pct: overallHealthPct }, ...PLATFORM_HEALTH].map(({ name, pct }, idx) => {
            const color = pctColor(pct);
            const hexColor = color === 'danger' ? '#BD271E' : color === 'warning' ? '#CA8500' : '#017D73';
            return (
              <React.Fragment key={name}>
                {idx > 0 && (
                  <div style={{ width: 0, borderLeft: `1px solid ${euiTheme.colors.lightShade}`, flexShrink: 0, margin: '8px 0' }} />
                )}
                <div style={{ flex: 1, padding: '4px 16px 8px 16px' }}>
                  <EuiText style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: hexColor }}>{pct}%</EuiText>
                  <EuiSpacer size="xs" />
                  <EuiText size="s" color="subdued" style={{ fontWeight: 600 }}>{name}</EuiText>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </EuiPanel>

      <EuiSpacer size="m" />

      {/* ── ECS field compatibility (full width) ── */}
      <EuiFlexGroup gutterSize="m" alignItems="flexStart" responsive={false}>
        <EuiFlexItem>
          <EuiPanel hasBorder hasShadow={false} paddingSize="m">
            <EuiTitle size="xs"><h3>ECS field compatibility</h3></EuiTitle>
            <EuiSpacer size="s" />

            {totalIncompatible > 0 && (
              <>
                <EuiCallOut color={calloutColor} size="s" title={<>{totalIncompatible} {totalIncompatible === 1 ? 'index has' : 'indices have'} ECS compatibility issues that may stop rules, dashboards, and correlations from working. <EuiLink href="#">Learn more</EuiLink></>} />
                <EuiSpacer size="s" />
              </>
            )}

            {/* All indices checked bar */}
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

            {/* Search + filter */}
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
                  style={{ maxWidth: 240 }}
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

            {/* Accordions */}
            <EuiPanel hasBorder paddingSize="none" style={{ overflow: 'hidden' }}>
              {filteredCategories.map((cat, idx) => {
                const incompatFields = cat.items.reduce((s, i) => s + i.incompatibleFieldCount, 0);
                const affected = cat.items.filter((i) => i.status === 'incompatible').length;
                const isOpen = openAccordions[cat.category] ?? false;
                return (
                  <div key={cat.category}>
                    <EuiAccordion
                      id={`quality-accordion-${cat.category}`}
                      buttonContent={<EuiText size="s" style={{ fontWeight: 600 }}>{cat.category}</EuiText>}
                      extraAction={
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ paddingRight: 16 }}>
                          <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ marginLeft: 4 }}>{categoryStatusBadge(incompatFields)}</EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ margin: '0 8px' }}>{metaDivider}</EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" color="subdued">Incompatible Fields: <strong style={{ color: '#1d2a3e' }}>{incompatFields}</strong></EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ margin: '0 8px' }}>{metaDivider}</EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" color="subdued">Affected indices: <strong style={{ color: '#1d2a3e' }}>{affected}/{cat.items.length}</strong></EuiText>
                          </EuiFlexItem>
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
          </EuiPanel>
        </EuiFlexItem>

      </EuiFlexGroup>

      {/* ── Rule field issues ── */}
      <EuiSpacer size="l" />
      <EuiPanel hasBorder paddingSize="m">
        <EuiTitle size="xs"><h3>Rule field issues</h3></EuiTitle>
        <EuiSpacer size="s" />
        {ruleFieldIssues.length > 0 ? (
          <>
            <EuiCallOut color={calloutColor} iconType="inspect" size="s" title="Some enabled rules reference fields that are missing or incompatible — they may execute but will never match. Review and fix the issues below." />
            <EuiSpacer size="m" />
            <EuiBasicTable
              items={ruleFieldIssues}
              columns={[
                { field: 'ruleName', name: 'Rule', render: (name: string) => <EuiText size="s">{name}</EuiText> },
                { field: 'field', name: 'Field', render: (f: string) => <EuiCode>{f}</EuiCode> },
                {
                  field: 'issueType', name: 'Issue',
                  render: (type: string) => {
                    const colorMap: Record<string, string> = { missing: 'danger', type_mismatch: 'warning', sparse: 'hollow' };
                    const labelMap: Record<string, string> = { missing: 'Field missing', type_mismatch: 'Type mismatch', sparse: 'Sparsely populated' };
                    return <EuiBadge color={colorMap[type] ?? 'hollow'}>{labelMap[type] ?? type}</EuiBadge>;
                  },
                },
                { field: 'indexPattern', name: 'Index pattern', render: (idx: string) => <EuiCode>{idx}</EuiCode> },
                {
                  name: 'Platform', width: '110px',
                  render: (row: RuleFieldIssue) => <EuiBadge color="hollow">{getPlatformFromIndex(row.indexPattern)}</EuiBadge>,
                },
                {
                  name: 'Fix', width: '120px',
                  render: (row: RuleFieldIssue) => {
                    if (row.issueType === 'missing' || row.issueType === 'type_mismatch') {
                      const labelMap: Record<string, string> = { missing: 'Field missing', type_mismatch: 'Type mismatch' };
                      return (
                        <EuiButtonEmpty
                          size="xs"
                          flush="left"
                          onClick={() => onAskAI?.(`How do I fix the ${row.field} ${labelMap[row.issueType]} for the ${row.ruleName} rule?`)}
                          data-test-subj={`siemReadiness-qualityFix-${row.id}`}
                        >
                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}><EuiIcon type="questionInCircle" size="s" /></EuiFlexItem>
                            <EuiFlexItem grow={false}>Fix</EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiButtonEmpty>
                      );
                    }
                    return (
                      <EuiButtonEmpty
                        size="xs"
                        flush="left"
                        iconType="popout"
                        iconSide="right"
                        href="/app/security/rules"
                        data-test-subj={`siemReadiness-qualityViewRule-${row.id}`}
                      >
                        View rule
                      </EuiButtonEmpty>
                    );
                  },
                },
                {
                  name: 'Action', width: '130px',
                  render: (row: RuleFieldIssue) =>
                    actionItemIds.has(`quality-${row.id}`)
                      ? <EuiBadge color="warning" data-test-subj={`siemReadiness-qualityInActions-${row.id}`}>In Actions</EuiBadge>
                      : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/security/rules" data-test-subj={`siemReadiness-qualityViewRuleAction-${row.id}`}>View rule</EuiButtonEmpty>,
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

// ─── Continuity tab ───────────────────────────────────────────────────────────

interface ContinuityFinding {
  id: string; dataset: string;
  issue: 'silent' | 'volume_drop' | 'high_latency';
  detail: string; rulesAffected: number;
  volumeBaseline: number | null;
  volumeCurrent: number | null;
  p95Latency: number | null;
}

interface ContinuityTabProps {
  categories: CategoryGroup[];
  pipelines: PipelineStats[];
  loading: boolean;
  actionItemIds: Set<string>;
  onAskAI?: (message: string) => void;
}

const LATENCY_SLA_MINUTES = 5;

const ContinuityTab: React.FC<ContinuityTabProps> = ({ pipelines, loading, actionItemIds, onAskAI }) => {
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const findings: ContinuityFinding[] = useMemo(() => {
    const result: ContinuityFinding[] = [];
    pipelines.forEach((p) => {
      if (p.docsCount === 0) {
        const baseline = Math.round(Math.random() * 50000 + 10000);
        result.push({ id: p.name + '-silent', dataset: p.indices[0] ?? p.name, issue: 'silent', detail: 'No data received in the last 24h', rulesAffected: 3, volumeBaseline: baseline, volumeCurrent: 0, p95Latency: null });
      } else if (p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1) {
        const rate = ((p.failedDocsCount / p.docsCount) * 100).toFixed(1);
        const baseline = Math.round(p.docsCount * 1.8);
        result.push({ id: p.name + '-drop', dataset: p.indices[0] ?? p.name, issue: 'volume_drop', detail: `Failure rate ${rate}% — ${p.failedDocsCount.toLocaleString()} docs failed`, rulesAffected: 12, volumeBaseline: baseline, volumeCurrent: p.docsCount, p95Latency: p.latencyMinutes ?? null });
      }
      if (p.latencyMinutes != null && p.latencyMinutes > LATENCY_SLA_MINUTES) {
        result.push({ id: p.name + '-latency', dataset: p.indices[0] ?? p.name, issue: 'high_latency', detail: `P95: ${p.latencyMinutes} min (SLA: ${LATENCY_SLA_MINUTES} min)`, rulesAffected: 2, volumeBaseline: Math.round(p.docsCount * 1.1), volumeCurrent: p.docsCount, p95Latency: p.latencyMinutes });
      }
    });
    return result;
  }, [pipelines]);

  const silentStreamCount = findings.filter((f) => f.issue === 'silent').length;
  const volumeDropCount   = findings.filter((f) => f.issue === 'volume_drop').length;
  const highLatencyCount  = findings.filter((f) => f.issue === 'high_latency').length;

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  const callout = getContinuityCallout(silentStreamCount, volumeDropCount, highLatencyCount);

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

  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const itemIdToExpandedRowMap: Record<string, React.ReactNode> = {};
  findings.forEach((row) => {
    if (!expandedRowIds.has(row.id)) return;
    const tactics = getTacticsFromIndex(row.dataset);
    const platform = getPlatformFromIndex(row.dataset);
    const issueLabel = row.issue === 'silent' ? 'silent stream' : row.issue === 'volume_drop' ? 'volume drop' : 'latency issue';
    const tacticsText = tactics.length > 0 ? tactics.join(', ') : 'no mapped MITRE tactics';
    itemIdToExpandedRowMap[row.id] = (
      <EuiPanel paddingSize="s" color="subdued" hasBorder={false}>
        <EuiText size="s">
          <p>
            <strong>{row.rulesAffected} rule{row.rulesAffected !== 1 ? 's' : ''}</strong> affected by this {issueLabel} — degrading coverage for {tacticsText}.
          </p>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
          {row.volumeBaseline !== null && row.volumeCurrent !== null && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                7d avg: {row.volumeBaseline.toLocaleString()}/hr → current: {row.volumeCurrent.toLocaleString()}/hr
              </EuiBadge>
            </EuiFlexItem>
          )}
          {row.p95Latency !== null && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">P95 latency: {row.p95Latency} min</EuiBadge>
            </EuiFlexItem>
          )}
          {platform === '—' && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">Platform unmapped</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    );
  });

  return (
    <EuiPanel hasBorder paddingSize="m">
      {callout && (
        <>
          <EuiCallOut title={`${callout.title} ${callout.body}`} color={callout.color} iconType={callout.iconType} size="s" />
          <EuiSpacer size="m" />
        </>
      )}

      <EuiFlexGroup gutterSize="m" responsive={false}>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={silentStreamCount} description="Silent streams" titleColor={silentStreamCount > 0 ? 'danger' : 'success'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={volumeDropCount} description="Volume drops (>50%)" titleColor={volumeDropCount > 0 ? 'danger' : 'success'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel hasBorder paddingSize="m">
            <EuiStat title={highLatencyCount} description="Streams above latency SLA" titleColor={highLatencyCount > 0 ? 'warning' : 'success'} titleSize="m" />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}
      <EuiBasicTable
        items={findings}
        itemId="id"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        columns={[
          {
            width: '40px',
            isExpander: true,
            render: (row: ContinuityFinding) => (
              <EuiButtonEmpty
                size="xs"
                onClick={() => toggleRow(row.id)}
                aria-label={expandedRowIds.has(row.id) ? 'Collapse row' : 'Expand row'}
                iconType={expandedRowIds.has(row.id) ? 'arrowDown' : 'arrowRight'}
              />
            ),
          },
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
          {
            name: 'Tactics',
            render: (row: ContinuityFinding) => <TacticsCell tactics={getTacticsFromIndex(row.dataset)} />,
          },
          {
            name: 'Platform', width: '110px',
            render: (row: ContinuityFinding) => <EuiBadge color="hollow">{getPlatformFromIndex(row.dataset)}</EuiBadge>,
          },
          {
            field: 'rulesAffected', name: 'Rules affected', width: '110px',
            render: (count: number, row: ContinuityFinding) => (
              <EuiLink
                onClick={() => onAskAI?.(`Show me the rules affected by ${row.dataset} degradation.`)}
                data-test-subj={`siemReadiness-continuityRulesAffected-${row.id}`}
              >
                {count}
              </EuiLink>
            ),
          },
          {
            name: 'Action', width: '140px',
            render: (row: ContinuityFinding) => {
              const actionId = `continuity-${row.id}`;
              return actionItemIds.has(actionId)
                ? <EuiBadge color="warning" data-test-subj={`siemReadiness-continuityInActions-${row.id}`}>In Actions</EuiBadge>
                : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/fleet" data-test-subj={`siemReadiness-continuityFleet-${row.id}`}>View in Fleet</EuiButtonEmpty>;
            },
          },
        ] as Array<EuiBasicTableColumn<ContinuityFinding>>}
      />
    </EuiPanel>
  );
};

// ─── Retention tab (Fix 6: benchmark comparison) ──────────────────────────────

interface RetentionFinding { id: string; category: string; actualDays: number; benchmarkDays: number; status: 'below' | 'meets' }

const RETENTION_BENCHMARKS: Record<string, number> = {
  'Endpoint': 90, 'Identity': 180, 'Network': 90, 'Cloud': 180, 'Application/SaaS': 90,
};

const RETENTION_BENCHMARK_COMPLIANCE: Record<number, string> = {
  90:  'NIST 800-53 AU-11, SOC2',
  180: 'FedRAMP, SOC2',
};

const RETENTION_TACTICS: Record<string, string[]> = {
  'Network':          ['Command and Control', 'Lateral Movement'],
  'Endpoint':         ['Initial Access', 'Execution', 'Defense Evasion'],
  'Identity':         ['Initial Access', 'Credential Access', 'Privilege Escalation'],
  'Cloud':            ['Discovery', 'Exfiltration', 'Collection'],
  'Application/SaaS': ['Initial Access', 'Collection'],
};

const RETENTION_PLATFORM: Record<string, string> = {
  'Network':          'Network',
  'Endpoint':         'Endpoint',
  'Identity':         'Identity',
  'Cloud':            'Cloud',
  'Application/SaaS': 'Application',
};

interface RetentionTabProps { categories: CategoryGroup[]; retentionItems: RetentionItem[]; loading: boolean; actionItemIds: Set<string> }

const RetentionTab: React.FC<RetentionTabProps> = ({ categories, retentionItems, loading, actionItemIds }) => {
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);

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
      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}
      {belowCount > 0 && (
        <>
          <EuiCallOut color="warning" iconType="clock" size="s" title={<>Some log categories are not meeting retention benchmarks — review and update your ILM policies in <EuiLink href="#">Stack Management</EuiLink>.</>} />
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
        <>
          <EuiBasicTable
            items={retentionFindings}
            columns={[
              { field: 'category', name: 'Log category' },
              { field: 'actualDays', name: 'Current retention',
                render: (days: number) => <EuiText size="s">{days > 0 ? `${days} days` : 'Not configured'}</EuiText>,
              },
              {
                field: 'benchmarkDays', name: 'Benchmark',
                render: (days: number, row: RetentionFinding) => (
                  <EuiToolTip content={RETENTION_BENCHMARK_COMPLIANCE[days] ?? ''} data-test-subj={`siemReadiness-retentionBenchmarkTooltip-${row.id}`}>
                    <EuiText size="s" color="subdued" style={{ cursor: 'help', borderBottom: '1px dashed #98A2B3' }}>{days} days</EuiText>
                  </EuiToolTip>
                ),
              },
              {
                field: 'status', name: 'Status',
                render: (status: string) => (
                  <EuiBadge color={status === 'below' ? 'warning' : 'success'}>
                    {status === 'below' ? 'Below benchmark' : 'Meets benchmark'}
                  </EuiBadge>
                ),
              },
              {
                name: 'Tactics at risk',
                render: (row: RetentionFinding) => {
                  const tactics = RETENTION_TACTICS[row.category] ?? [];
                  return tactics.length > 0
                    ? <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                        {tactics.map((t) => <EuiFlexItem key={t} grow={false}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>)}
                      </EuiFlexGroup>
                    : <EuiText size="s" color="subdued">—</EuiText>;
                },
              },
              {
                name: 'Platform', width: '120px',
                render: (row: RetentionFinding) => (
                  <EuiBadge color="hollow">{RETENTION_PLATFORM[row.category] ?? row.category}</EuiBadge>
                ),
              },
              {
                name: 'Rules affected', width: '110px',
                render: () => <EuiText size="s" color="subdued">—</EuiText>,
              },
              {
                name: 'Action', width: '160px',
                render: (row: RetentionFinding) =>
                  actionItemIds.has('retention-benchmark')
                    ? <EuiButtonEmpty size="xs" color="warning" data-test-subj={`siemReadiness-retentionInActions-${row.id}`}>In Actions</EuiButtonEmpty>
                    : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/management/data/index_lifecycle_management" data-test-subj={`siemReadiness-retentionManage-${row.id}`}>Manage policy</EuiButtonEmpty>,
              },
            ] as Array<EuiBasicTableColumn<RetentionFinding>>}
            itemId="id"
          />
        </>
      )}
    </EuiPanel>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SiemReadinessPage: React.FC = () => {
  type SiemTab = 'actions' | VisibilityTabId;
  const [selectedTab, setSelectedTab] = useState<SiemTab>('actions');
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

    // Blast radius per pillar (rules affected)
    const coverageBlastRadius = coverage?.uncoveredRules.length ?? null;
    const qualityBlastRadius  = new Set(ruleFieldIssues.map((i) => i.ruleName)).size || null;
    // Continuity: sum rulesAffected from failing/silent pipelines (3 per silent, 12 per volume_drop — matches ContinuityTab logic)
    const continuityBlastRadius = pipelines.reduce<number>((sum, p) => {
      if (p.docsCount === 0) return sum + 3;
      if (p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1) return sum + 12;
      return sum;
    }, 0) || null;
    // Retention blast radius: not available in current data model
    const retentionBlastRadius: number | null = null;

    const coveragePillar: PillarStatus = {
      status: loading || total === 0 ? 'healthy' : coveredPct < 80 ? 'critical' : coveredPct < 100 ? 'warning' : 'healthy',
      metricValue: total > 0 ? `${coveredPct}%` : '—',
      metricLabel: 'Rules with supporting data',
      hasIssues: coveredPct < 100 && total > 0,
      statusColor: coveredPct < 80 ? 'danger' : coveredPct < 100 ? 'warning' : 'success',
      blastRadius: coverageBlastRadius,
    };
    const qualityPillar: PillarStatus = {
      status: loading ? 'healthy' : qualityIssues > 5 ? 'critical' : qualityIssues > 0 ? 'warning' : 'healthy',
      metricValue: qualityIssues,
      metricLabel: 'Indices with field issues',
      hasIssues: qualityIssues > 0,
      statusColor: qualityIssues > 5 ? 'danger' : qualityIssues > 0 ? 'warning' : 'success',
      blastRadius: qualityBlastRadius,
    };
    const continuityMetric = getContinuityCardMetric(silentStreams, volumeDropCount, highLatencyCount);
    const continuityStatus: ReadinessStatus = loading ? 'healthy' : silentStreams > 0 ? 'critical' : volumeDropCount > 0 || highLatencyCount > 0 ? 'warning' : 'healthy';
    const continuityPillar: PillarStatus = {
      status: continuityStatus,
      metricValue: continuityMetric.value,
      metricLabel: continuityMetric.label,
      hasIssues: continuityMetric.value > 0,
      statusColor: silentStreams > 0 ? 'danger' : volumeDropCount > 0 || highLatencyCount > 0 ? 'warning' : 'success',
      blastRadius: continuityBlastRadius,
    };
    const retentionPillar: PillarStatus = {
      status: loading ? 'healthy' : retentionBelowBenchmark > 0 ? 'warning' : 'healthy',
      metricValue: retentionBelowBenchmark,
      metricLabel: 'Data streams below benchmark',
      hasIssues: retentionBelowBenchmark > 0,
      statusColor: retentionBelowBenchmark > 0 ? 'warning' : 'success',
      blastRadius: retentionBlastRadius,
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
  }, [loading, coverage, qualityResults, pipelines, retentionItems, categories, ruleFieldIssues]);

  // Derived action items — used for badge count AND cross-tab "In Actions" checks
  const allActionItems = useMemo(
    () => deriveActionItems(coverage, integrations, ruleFieldIssues, pipelines, retentionItems, categories),
    [coverage, integrations, ruleFieldIssues, pipelines, retentionItems, categories]
  );
  const totalActions = allActionItems.length;
  const actionItemIds = useMemo(() => new Set(allActionItems.map((a) => a.id)), [allActionItems]);

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
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart">

          {/* Secondary nav — sticky so it always fills the screen while scrolling */}
          <EuiFlexItem grow={false} style={{ position: 'sticky', top: 56, alignSelf: 'flex-start', height: 'calc(100vh - 64px)' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
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
                      <EuiBadge color="danger">Issues detected</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
                responsive={false}
                paddingSize="l"
                bottomBorder={false}
                rightSideItems={[
                  <EuiButtonEmpty size="s" iconType="gear" key="config">
                    Configurations
                  </EuiButtonEmpty>,
                ]}
              />

              <EuiPageSection paddingSize="l">

                {/* Overall status card — stats + pillar summaries */}
                <OverallStatusCard summary={summary} />
                <EuiSpacer size="l" />


                {/* Single tab bar — Actions + 4 pillar tabs */}
                <EuiTabs data-test-subj="siemReadiness-tabs">
                  {/* Tab 1: Actions */}
                  <EuiTab
                    isSelected={selectedTab === 'actions'}
                    onClick={() => setSelectedTab('actions')}
                    data-test-subj="siemReadiness-tab-actions"
                  >
                    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>Actions</EuiFlexItem>
                      {totalActions > 0 && (
                        <EuiFlexItem grow={false}>
                          <EuiNotificationBadge size="m" color="accent">{totalActions}</EuiNotificationBadge>
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  </EuiTab>

                  {/* Tabs 2–5: pillar tabs with status dots */}
                  {([
                    { id: 'coverage'   as const, label: 'Coverage',   pillar: summary.pillars.coverage   },
                    { id: 'quality'    as const, label: 'Quality',    pillar: summary.pillars.quality    },
                    { id: 'continuity' as const, label: 'Continuity', pillar: summary.pillars.continuity },
                    { id: 'retention'  as const, label: 'Retention',  pillar: summary.pillars.retention  },
                  ]).map(({ id, label, pillar }) => {
                    const dotBg = pillar.status === 'critical' ? '#BD271E' : pillar.status === 'warning' ? '#F5A700' : '#00BFB3';
                    return (
                      <EuiTab
                        key={id}
                        isSelected={selectedTab === id}
                        onClick={() => setSelectedTab(id)}
                        data-test-subj={`siemReadiness-tab-${id}`}
                      >
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: dotBg, flexShrink: 0 }} />
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>{label}</EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiTab>
                    );
                  })}
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* Tab content panels */}
                {selectedTab === 'actions' && (
                  <ActionsPanel
                    coverage={coverage}
                    integrations={integrations}
                    ruleFieldIssues={ruleFieldIssues}
                    pipelines={pipelines}
                    retentionItems={retentionItems}
                    categories={categories}
                  />
                )}
                {selectedTab === 'coverage'   && <CoverageTab   coverage={coverage} categories={categories} integrations={integrations} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.coverage.status} onAskAI={(msg) => console.log('[onAskAI]', msg)} />}
                {selectedTab === 'quality'    && <QualityTab    categories={categories} qualityResults={qualityResults} ruleFieldIssues={ruleFieldIssues} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.quality.status} onAskAI={(msg) => console.log('[onAskAI]', msg)} />}
                {selectedTab === 'continuity' && <ContinuityTab categories={categories} pipelines={pipelines} loading={loading} actionItemIds={actionItemIds} onAskAI={(msg) => console.log('[onAskAI]', msg)} />}
                {selectedTab === 'retention'  && <RetentionTab  categories={categories} retentionItems={retentionItems} loading={loading} actionItemIds={actionItemIds} />}

              </EuiPageSection>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>
    </>
  );
};

export default SiemReadinessPage;
