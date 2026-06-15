import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  EuiSwitch,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
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
  EuiListGroupItem,  EuiLoadingSpinner,
  EuiNotificationBadge,
  EuiPanel,
  EuiPageHeader,
  EuiPopover,
  EuiProgress,
  EuiFieldText,
  EuiFormControlLayout,
  EuiSelect,
  EuiSelectable,
  EuiSpacer,
  EuiStat,
  EuiTab,
  EuiTablePagination,
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
import SecurityHeader from '../../../components/SecurityHeader';
import SecuritySideNav from '../../../components/SecuritySideNav';
import { AssistantFlyout } from '../../components/shared/AssistantFlyout';
import type { SiemReadinessAgentContext } from './SiemReadinessAgentCard';

// ─── Types (mirroring @kbn/siem-readiness) ───────────────────────────────────

type VisibilityStatus = 'healthy' | 'actionsRequired' | 'noData';
type VisibilityTabId = 'coverage' | 'quality' | 'detections' | 'continuity' | 'retention';
type HealthGroupId = 'data-health' | 'detection-health';
type SiemTab = HealthGroupId;
type ActionFilter = VisibilityTabId | HealthGroupId | undefined;

const DATA_HEALTH_PILLARS: VisibilityTabId[] = ['continuity', 'retention', 'quality'];
const DETECTION_HEALTH_PILLARS: VisibilityTabId[] = ['coverage', 'detections'];

const GROUP_PILLARS: Record<HealthGroupId, VisibilityTabId[]> = {
  'data-health': DATA_HEALTH_PILLARS,
  'detection-health': DETECTION_HEALTH_PILLARS,
};

function getHealthGroupLabelForPillar(pillar: VisibilityTabId): string {
  if (DATA_HEALTH_PILLARS.includes(pillar)) return 'Visibility health';
  return 'Detection health';
}

function mapTabParam(tabParam: string | null): SiemTab {
  if (tabParam === 'detection-health') return 'detection-health';
  return 'data-health';
}

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

interface ExecutionHealthRow { id: string; rule: string; indexPattern: string; lastRun: string; status: string; execTime: string; alertTrend: string }

const EXECUTION_HEALTH_ROWS: ExecutionHealthRow[] = [
  { id: '2', rule: 'AWS CloudTrail Unauthorized API Call',      indexPattern: 'logs-aws.cloudtrail-*',          lastRun: '18 min ago', status: 'Gap detected', execTime: '2.4s',  alertTrend: 'Silent — data issue'      },
  { id: '3', rule: 'Okta User Locked Out',                     indexPattern: 'logs-okta.system-*',             lastRun: '5 min ago',  status: 'Timed out',    execTime: '34.8s', alertTrend: 'Silent — no alerts in 7d' },
  { id: '4', rule: 'Endpoint Defense Evasion via Timestomping', indexPattern: 'logs-endpoint.events.process-*', lastRun: '3 min ago',  status: 'Failed',       execTime: '0.8s',  alertTrend: 'Silent — no alerts in 7d' },
];

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
  { name: 'logs-okta.system@pipeline',             indices: ['logs-okta.system-default'],                     docsCount: 0,      failedDocsCount: 0,    statsAvailable: true },
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

function buildRulesList(count: number, contextLabel: string, tactics: string[] = [], ruleNames?: string[]): FlyoutRule[] {
  const names = ruleNames ?? MOCK_RULE_FIELD_ISSUES.map((r) => r.ruleName);
  return Array.from({ length: count }, (_, i) => ({
    name: names[i % names.length] ?? `Rule affected by ${contextLabel}`,
    tactics,
    status: 'no-action' as const,
  }));
}

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

function worstReadinessStatus(statuses: ReadinessStatus[]): ReadinessStatus {
  if (statuses.some((s) => s === 'critical')) return 'critical';
  if (statuses.some((s) => s === 'warning')) return 'warning';
  return 'healthy';
}

function readinessToHealthColor(status: ReadinessStatus): 'danger' | 'warning' | 'success' {
  if (status === 'critical') return 'danger';
  if (status === 'warning') return 'warning';
  return 'success';
}

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
    detections: PillarStatus;
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
    return { color: 'success', iconType: 'checkInCircleFilled', title: 'Everything seems healthy and stable.', body: 'No issues detected across Coverage, Quality, Detections, Continuity, or Retention.' };
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

const PAGE_CONTENT_PADDING = 24;

const HEADER_ACTION_BUTTON_STYLE: React.CSSProperties = {
  color: '#111C2C',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  minWidth: 'max-content',
  padding: '4px 8px',
  margin: 0,
};

const AddToChatButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <EuiButtonEmpty
    size="s"
    iconType="productAgent"
    iconSide="left"
    color="text"
    style={HEADER_ACTION_BUTTON_STYLE}
    onClick={onClick}
  >
    Add to chat
  </EuiButtonEmpty>
);

const ALL_CATEGORY_NAMES = ['Endpoint', 'Identity', 'Network', 'Cloud', 'Application/SaaS'] as const;


const StatusHero: React.FC<{ summary: ReadinessSummary; onAddToChat?: () => void }> = ({ summary, onAddToChat }) => {
  const msg = getOverallStatusMessage({
    coverage:   summary.pillars.coverage.status,
    quality:    summary.pillars.quality.status,
    detections: summary.pillars.detections.status,
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
            <AddToChatButton onClick={onAddToChat} />
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
  detections: { label: 'Rules with detection issues',  colorKey: 'danger'  },
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
    { id: 'detections', label: 'Detections' },
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
  detections: {
    healthy: 'All detection rules are executing correctly.',
    warning: 'Some rules have execution warnings.',
    critical: 'Critical rule field or execution issues found.',
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
    { id: 'detections', title: 'Detections', pillar: summary.pillars.detections },
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
  actionLabel: string;
  actionIcon?: string;
  casesCount?: number;
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
  categories: CategoryGroup[],
  qualityResults: QualityResult[]
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
      actionLabel: 'Install integration',
      actionIcon: 'popout',
    });
  });

  // Detections: rule field issues and execution health failures
  const qualityIssueLabels = { missing: 'Field missing', type_mismatch: 'Type mismatch', sparse: 'Sparsely populated' };
  ruleFieldIssues.forEach((issue) => {
    if (issue.id === '1') {
      items.push({
        id: `detections-${issue.id}`,
        severity: 'critical' as const,
        pillar: 'detections',
        title: '3 rules are failing executions',
        description: 'Three enabled detection rules failed or timed out during their most recent runs. These rules may be running but not detecting.',
        fixRecommendation: 'Open the rules in Security → Rules and review their query, schedule, and index patterns. Check for data gaps or timeout settings.',
        rulesAffected: 3,
        mitreTactics: [],
        platforms: [],
        fixLink: 'Security → Rules',
        actionLabel: 'View rule',
        actionIcon: 'popout',
      });
      return;
    }

    const actionLabel = issue.issueType === 'missing'
      ? 'View rule'
      : issue.issueType === 'type_mismatch'
        ? 'Fix mapping'
        : 'Investigate data';
    const actionIcon = issue.issueType === 'missing' ? 'popout' : issue.issueType === 'type_mismatch' ? 'indexMapping' : 'search';
    items.push({
      id: `detections-${issue.id}`, severity: 'critical' as const, pillar: 'detections',
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
      actionLabel,
      actionIcon,
      casesCount: issue.id === '4' ? 1 : undefined,
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
      actionLabel: isSilent ? 'View data stream' : 'View pipeline',
      actionIcon: 'popout',
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
      rulesAffected: nonCompliantRetention.length * 50,
      mitreTactics: [],
      platforms: [...new Set(nonCompliantRetention.map((r) => r.indexName.split('.').slice(0, 2).join('.')))].slice(0, 3),
      fixLink: 'Stack Management → Index Lifecycle Management → Data Streams',
      actionLabel: 'Update ILM policy',
      actionIcon: 'popout',
    });
  }

  // Quality: ECS field compatibility issues
  qualityResults
    .filter((r) => r.incompatibleFieldCount > 0)
    .forEach((result) => {
      items.push({
        id: `quality-${result.indexName}`,
        severity: 'warning',
        pillar: 'quality',
        title: `ECS incompatibility: ${result.indexName}`,
        description: `Index "${result.indexName}" has ${result.incompatibleFieldCount} incompatible field${result.incompatibleFieldCount !== 1 ? 's' : ''}. Detection rules relying on these fields may produce incomplete results.`,
        fixRecommendation: `Open Stack Management → Index Management, select "${result.indexName}", and review field mappings. Update ingest pipelines or integration configurations to populate ECS-compatible field names.`,
        rulesAffected: result.incompatibleFieldCount * 3,
        mitreTactics: [],
        platforms: [result.indexName.split('.').slice(0, 2).join('.')],
        fixLink: `Stack Management → Index Management → ${result.indexName}`,
        actionLabel: 'Review mappings',
        actionIcon: 'popout',
      });
    });

  // Structured selection: 2 Coverage + 2 Detections + 1 Quality + 1 Continuity + 1 Retention
  const byPillar = (pillar: VisibilityTabId) =>
    items.filter((i) => i.pillar === pillar).sort((a, b) => b.rulesAffected - a.rulesAffected);

  const structured = [
    ...byPillar('coverage').slice(0, 2),
    ...byPillar('detections').slice(0, 4),
    ...byPillar('quality').slice(0, 1),
    ...byPillar('continuity').slice(0, 1),
    ...byPillar('retention').slice(0, 1),
  ];

  return structured.map((item, i) => ({ ...item, priority: i + 1 }));
}

// ─── Actions required panel (Figma: 1861:24427) ───────────────────────────────

const CATEGORY_LABELS: Record<VisibilityTabId, string> = {
  coverage: 'Coverage',
  quality: 'Quality',
  detections: 'Detections',
  continuity: 'Continuity',
  retention: 'Retention',
};

const ACTION_FILTER_LABELS: Record<VisibilityTabId | HealthGroupId, string> = {
  ...CATEGORY_LABELS,
  'data-health': 'Visibility health',
  'detection-health': 'Detection health',
};

function getActionChatPrompt(action: ActionItem): string {
  return `Help me resolve this SIEM Readiness ${getHealthGroupLabelForPillar(action.pillar)} issue: "${action.title}". ${action.description} Recommended fix: ${action.fixRecommendation}`;
}

const ACTION_PANEL_BUTTON_MIN_WIDTH = 176;

function renderRightAlignedTableAction(content: React.ReactNode) {
  return (
    <EuiFlexGroup justifyContent="flexEnd" responsive={false} gutterSize="none">
      <EuiFlexItem grow={false}>{content}</EuiFlexItem>
    </EuiFlexGroup>
  );
}

// ─── Actions filter group (two popover dropdowns) ─────────────────────────────

interface ActionsFilterGroupProps {
  allActions: ActionItem[];
  typeFilter?: VisibilityTabId;
  severityFilter?: 'critical' | 'warning';
  onTypeFilterChange?: (f: VisibilityTabId | undefined) => void;
  onSeverityFilterChange?: (f: 'critical' | 'warning' | undefined) => void;
  allowedPillars?: VisibilityTabId[];
}

const ActionsFilterGroup: React.FC<ActionsFilterGroupProps> = ({
  allActions,
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange,
  allowedPillars,
}) => {
  const [typeOpen, setTypeOpen] = useState(false);
  const [severityOpen, setSeverityOpen] = useState(false);

  const availablePillars = allowedPillars ?? (['continuity', 'retention', 'quality', 'coverage', 'detections'] as VisibilityTabId[]);
  const typeOptions = availablePillars.map(
    (pillar) => ({
      label: CATEGORY_LABELS[pillar],
      pillar,
      checked: typeFilter === pillar ? ('on' as const) : undefined,
    })
  );

  const severityOptions = [
    { label: 'Critical', value: 'critical' as const, checked: severityFilter === 'critical' ? ('on' as const) : undefined },
    { label: 'Warning',  value: 'warning'  as const, checked: severityFilter === 'warning'  ? ('on' as const) : undefined },
  ];

  const activeTypeCount  = typeFilter     ? 1 : 0;
  const activeSevCount   = severityFilter ? 1 : 0;

  return (
    <EuiFilterGroup>
      {/* Type dropdown */}
      <EuiPopover
        button={
          <EuiFilterButton
            iconType="chevronSingleDown"
            onClick={() => { setTypeOpen((o) => !o); setSeverityOpen(false); }}
            isSelected={typeOpen}
            numFilters={allActions.length}
            hasActiveFilters={!!typeFilter}
            numActiveFilters={activeTypeCount}
          >
            Type
          </EuiFilterButton>
        }
        isOpen={typeOpen}
        closePopover={() => setTypeOpen(false)}
        panelPaddingSize="none"
      >
        <EuiSelectable
          aria-label="Filter by type"
          options={typeOptions}
          onChange={(newOptions) => {
            const selected = newOptions.find((o) => o.checked === 'on');
            onTypeFilterChange?.(selected ? (selected as typeof typeOptions[0]).pillar : undefined);
          }}
          singleSelection
        >
          {(list) => <div style={{ width: 200 }}>{list}</div>}
        </EuiSelectable>
      </EuiPopover>

      {/* Severity dropdown */}
      <EuiPopover
        button={
          <EuiFilterButton
            iconType="chevronSingleDown"
            onClick={() => { setSeverityOpen((o) => !o); setTypeOpen(false); }}
            isSelected={severityOpen}
            numFilters={2}
            hasActiveFilters={!!severityFilter}
            numActiveFilters={activeSevCount}
          >
            Severity
          </EuiFilterButton>
        }
        isOpen={severityOpen}
        closePopover={() => setSeverityOpen(false)}
        panelPaddingSize="none"
      >
        <EuiSelectable
          aria-label="Filter by severity"
          options={severityOptions}
          onChange={(newOptions) => {
            const selected = newOptions.find((o) => o.checked === 'on');
            onSeverityFilterChange?.(selected ? (selected as typeof severityOptions[0]).value : undefined);
          }}
          singleSelection
        >
          {(list) => <div style={{ width: 160 }}>{list}</div>}
        </EuiSelectable>
      </EuiPopover>
    </EuiFilterGroup>
  );
};

// ─── Expandable health card ───────────────────────────────────────────────────

interface ExpandableHealthCardProps {
  id: string;
  label: string;
  severity: 'Critical' | 'Warning';
  numColor: string;
  metrics: HealthMetric[];
  totalRulesAffected: number | null;
  activeTypeFilter?: VisibilityTabId;
  onMetricClick?: (pillar: VisibilityTabId) => void;
  healthStatus: ReadinessStatus;
  children: React.ReactNode;
}

const ExpandableHealthCard: React.FC<ExpandableHealthCardProps> = ({
  id, label, severity, numColor, metrics, totalRulesAffected,
  activeTypeFilter, onMetricClick, healthStatus, children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCritical = severity === 'Critical';
  const healthColor = healthStatus === 'critical' ? '#BD271E' : healthStatus === 'warning' ? '#CA8500' : '#017D73';

  return (
    <div
      style={{
        border: '1px solid #E3E8F2',
        borderRadius: 6,
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
      data-test-subj={`siemReadiness-expandableCard-${id}`}
    >
      {/* Card header */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EuiText style={{ fontSize: 16, fontWeight: 600, color: '#000000' }}>{label}</EuiText>
            <span style={{
              display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
              borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: isCritical ? '#FDDDD8' : '#FDE9B5',
              color: isCritical ? '#A71627' : '#825803',
            }}>
              {severity}
            </span>
          </div>
          {totalRulesAffected !== null && totalRulesAffected > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px',
              borderRadius: 20, border: '1px solid #CAD3E2', fontSize: 12, fontWeight: 500, color: '#1D2A3E',
            }}>
              <EuiIcon type="crosshairs" size="s" />
              {totalRulesAffected} total rules affected
            </span>
          )}
        </div>
        {/* Metrics row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
          {metrics.map((metric) => {
            const isActive = activeTypeFilter === metric.pillar;
            return (
              <div
                key={metric.label}
                onClick={() => onMetricClick?.(metric.pillar)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0,
                  cursor: 'pointer', padding: '6px 8px', borderRadius: 4,
                  background: isActive ? '#E6F1FA' : 'transparent', transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: '24px', color: numColor }}>
                  {metric.value}
                </span>
                <EuiText size="s" style={{ color: isActive ? '#1750BA' : '#516381', lineHeight: '20px', fontWeight: isActive ? 600 : 400 }}>
                  {metric.label}
                </EuiText>
                <EuiText size="s" style={{ color: '#1d2a3e', lineHeight: '20px', fontWeight: 600 }}>
                  {metric.sectionLabel ?? CATEGORY_LABELS[metric.pillar]}
                </EuiText>
              </div>
            );
          })}
        </div>
      </div>

      {/* View data footer — only shown when there are children */}
      {children && (
        <div
          style={{
            background: '#F6F9FC', padding: '8px 20px', borderTop: '1px solid #E3E8F2',
            display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6,
            userSelect: 'none',
          }}
          onClick={() => setExpanded((e) => !e)}
        >
          <EuiIcon type={expanded ? 'arrowDown' : 'arrowRight'} size="s" color="primary" />
          <EuiText size="s" style={{ color: '#1750BA', fontWeight: 500 }}>View data</EuiText>
        </div>
      )}

      {/* Expanded content */}
      {children && expanded && (
        <div style={{ padding: '24px 20px', borderTop: '1px solid #E3E8F2' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Actions required panel ───────────────────────────────────────────────────

interface ActionsRequiredPanelProps {
  coverage: RuleIntegrationCoverage | null;
  integrations: SiemReadinessPackageInfo[];
  ruleFieldIssues: RuleFieldIssue[];
  pipelines: PipelineStats[];
  retentionItems: RetentionItem[];
  categories: CategoryGroup[];
  qualityResults: QualityResult[];
  summary: ReadinessSummary;
  allowedPillars: VisibilityTabId[];
  typeFilter?: VisibilityTabId;
  severityFilter?: 'critical' | 'warning';
  onTypeFilterChange?: (f: VisibilityTabId | undefined) => void;
  onSeverityFilterChange?: (f: 'critical' | 'warning' | undefined) => void;
  onAddToChat?: (prompt: string) => void;
}

const ActionsRequiredPanel: React.FC<ActionsRequiredPanelProps> = ({
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange,
  onAddToChat,
  allowedPillars,
  ...props
}) => {
  const allActions = useMemo(
    () => deriveActionItems(props.coverage, props.integrations, props.ruleFieldIssues, props.pipelines, props.retentionItems, props.categories, props.qualityResults)
      .filter((a: ActionItem) => allowedPillars.includes(a.pillar)),
    [props.coverage, props.integrations, props.ruleFieldIssues, props.pipelines, props.retentionItems, props.categories, props.qualityResults, allowedPillars]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPageIndex(0);
  }, [typeFilter, severityFilter, searchQuery]);

  const actions = useMemo(() => {
    let filtered = allActions;
    if (typeFilter) filtered = filtered.filter((a) => a.pillar === typeFilter);
    if (severityFilter) filtered = filtered.filter((a) => a.severity === severityFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return filtered;
  }, [allActions, typeFilter, severityFilter, searchQuery]);

  const pagedActions = actions.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const toggleExpanded = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const timestamp = 'Apr 15 @ 14:22:07';

  return (
    <div
      data-test-subj="siemReadiness-actionsRequiredPanel"
      style={{
        background: '#F6F9FC',
        border: '1px solid #E3E8F2',
        borderRadius: 6,
        padding: '16px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Take action heading + search + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EuiText style={{ fontSize: 15, fontWeight: 600, color: '#111C2C', margin: 0 }}>Take action</EuiText>
          <EuiNotificationBadge size="m" color="accent">{actions.length}</EuiNotificationBadge>
        </div>
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <EuiFieldSearch
            placeholder="Type text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            aria-label="Search actions"
          />
        </div>
        <ActionsFilterGroup
          allActions={allActions}
          typeFilter={typeFilter}
          severityFilter={severityFilter}
          onTypeFilterChange={onTypeFilterChange}
          onSeverityFilterChange={onSeverityFilterChange}
          allowedPillars={allowedPillars}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      
      {actions.length === 0 ? (
        <div style={{ padding: 24, width: '100%' }}>
          <EuiEmptyPrompt
            iconType="checkInCircleFilled"
            color="success"
            title={<h3>No actions required</h3>}
            titleSize="xs"
            body={<EuiText size="s"><p>All pillars are healthy. No remediation needed.</p></EuiText>}
          />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {pagedActions.map((action: ActionItem, index: number) => {
              const pillarLabel = getHealthGroupLabelForPillar(action.pillar).toUpperCase();
              const isExpanded = expandedIds.has(action.id);
              const isFirstRow = index === 0;
              const isLastRow = index === pagedActions.length - 1;
              return (
                <div
                  key={action.id}
                  style={{
                    background: 'white',
                    border: '1px solid #CAD3E2',
                    padding: 12,
                    marginBottom: index < pagedActions.length - 1 ? -1 : 0,
                    borderRadius: isFirstRow && isLastRow ? 6 : isFirstRow ? '6px 6px 0 0' : isLastRow ? '0 0 6px 6px' : undefined,
                  }}
                  data-test-subj={`siemReadiness-actionItem-${action.id}`}
                >
                  {/* Collapsed row — Figma 1938:31465 / 31485 / 31505 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {/* Left: expand + health badge + severity + title + timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <EuiButtonIcon
                        iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        size="xs"
                        color="text"
                        onClick={() => toggleExpanded(action.id)}
                      />
                      {/* Severity badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
                        borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: action.severity === 'critical' ? '#FDDDD8' : '#FFF3D0',
                        color: action.severity === 'critical' ? '#A71627' : '#836500',
                        flexShrink: 0,
                      }}>
                        {action.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                      </span>
                      {/* Title: bold category + regular detail */}
                      <EuiText size="s" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => {
                          const colonIdx = action.title.indexOf(':');
                          if (colonIdx > -1) {
                            return (
                              <>
                                <strong>{action.title.slice(0, colonIdx)}:</strong>
                                {' '}{action.title.slice(colonIdx + 1).trim()}
                              </>
                            );
                          }
                          return <strong>{action.title}</strong>;
                        })()}
                      </EuiText>
                      <EuiText size="s" color="subdued" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{timestamp}</EuiText>
                    </div>

                    {/* Right: rules affected + divider + action button + dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <EuiBadge color="hollow" iconType="crosshairs">
                        {action.rulesAffected} rules affected
                      </EuiBadge>
                      <div style={{ width: 1, height: 23, background: '#CAD3E2', flexShrink: 0 }} />
                      <EuiButtonEmpty
                        size="xs"
                        iconType={action.actionIcon ?? 'popout'}
                        iconSide="left"
                        color="primary"
                        href={action.fixLink ? '#' : undefined}
                        data-test-subj={`siemReadiness-actionHere-${action.id}`}
                      >
                        Action here
                      </EuiButtonEmpty>
                      <EuiPopover
                        isOpen={openPopoverId === action.id}
                        closePopover={() => setOpenPopoverId(null)}
                        panelPaddingSize="s"
                        anchorPosition="downRight"
                        button={
                          <EuiButtonIcon
                            size="xs"
                            iconType="boxesVertical"
                            color="primary"
                            aria-label="More actions"
                            onClick={() => setOpenPopoverId(openPopoverId === action.id ? null : action.id)}
                          />
                        }
                      >
                        <EuiListGroup flush gutterSize="none" style={{ minWidth: 160 }}>
                          <EuiListGroupItem iconType="productAgent" label="Add to chat" size="s" onClick={() => { setOpenPopoverId(null); onAddToChat?.(getActionChatPrompt(action)); }} />
                          <EuiListGroupItem iconType="folderClosed" label="Create a case" size="s" onClick={() => setOpenPopoverId(null)} />
                        </EuiListGroup>
                      </EuiPopover>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <EuiSpacer size="s" />
                      <div style={{ background: '#FFFFFF', border: '1px solid #D3DAE6', borderRadius: 4, padding: '8px 12px', marginLeft: 28 }}>
                        <EuiText size="xs"><p style={{ margin: 0 }}><strong>Issue:</strong> {action.description}</p></EuiText>
                        <EuiSpacer size="xs" />
                        <EuiText size="xs"><p style={{ margin: 0 }}><strong>Action:</strong> {action.fixRecommendation}</p></EuiText>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: 4, width: '100%' }}>
            <EuiTablePagination
              pageCount={Math.ceil(actions.length / pageSize)}
              activePage={pageIndex}
              onChangePage={setPageIndex}
              itemsPerPage={pageSize}
              itemsPerPageOptions={[5, 10]}
              onChangeItemsPerPage={(size) => { setPageSize(size); setPageIndex(0); }}
              data-test-subj="siemReadiness-actionsPagination"
            />
          </div>
        </>
      )}
      </div>
    </div>
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

// ─── Rule coverage bar ────────────────────────────────────────────────────────

interface RuleCoverageBarProps { covered: number; uncovered: number }

const RuleCoverageBar: React.FC<RuleCoverageBarProps> = ({ covered, uncovered }) => {
  const total   = covered + uncovered;
  const red     = '#BD271E';
  const green   = '#017D73';

  return (
    <div style={{ paddingLeft: 24, minWidth: 200 }}>
      {/* Stat */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, lineHeight: 1 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#1d2a3e', lineHeight: 1 }}>
          {uncovered}
        </span>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#1d2a3e', lineHeight: 1 }}>
          /{total}
        </span>
      </div>
      <EuiSpacer size="xs" />
      <EuiText size="s" color="subdued" style={{ fontWeight: 400 }}>
        rules are missing or have disabled integrations
      </EuiText>

      {/* Bar */}
      <EuiSpacer size="s" />
      <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: '#D3DAE6' }}>
        {uncovered > 0 && (
          <div style={{ width: `${(uncovered / total) * 100}%`, background: red }} />
        )}
        {covered > 0 && (
          <div style={{ flex: 1, background: green }} />
        )}
      </div>
    </div>
  );
};

// ─── MITRE ATT&CK tactics coverage graphic ────────────────────────────────────

type MitreTacticStatus = 'warning' | 'inactive' | 'healthy';

interface MitreTacticCoverage {
  name: string;
  status: MitreTacticStatus;
  missingIntegrations?: number;
  rulesMissingData?: number;
  totalRules?: number;
}

const MITRE_MAPPED_RULES_COUNT = 76;
const MITRE_TOTAL_ENABLED_RULES = 79;

const MITRE_COVERAGE_COLORS: Record<MitreTacticStatus, string> = {
  warning:  '#FAD4D4',
  inactive: '#E8EDF3',
  healthy:  '#C5EBEA',
};

const MITRE_LEGEND_COLORS = {
  healthy:  '#54B399',
  warning:  '#F5A3A3',
  inactive: '#D3DAE6',
};

const MITRE_TACTIC_COVERAGE: MitreTacticCoverage[] = [
  { name: 'Initial Access',        status: 'warning',  missingIntegrations: 4, rulesMissingData: 4,  totalRules: 5  },
  { name: 'Defense Evasion',       status: 'warning',  missingIntegrations: 7, rulesMissingData: 19, totalRules: 24 },
  { name: 'Privilege Escalation',  status: 'warning',  missingIntegrations: 2, rulesMissingData: 3,  totalRules: 4  },
  { name: 'Persistence',           status: 'warning',  missingIntegrations: 9, rulesMissingData: 13, totalRules: 17 },
  { name: 'Lateral Movement',      status: 'warning',  missingIntegrations: 2, rulesMissingData: 3,  totalRules: 3  },
  { name: 'Execution',             status: 'warning',  missingIntegrations: 4, rulesMissingData: 10, totalRules: 18 },
  { name: 'Discovery',             status: 'warning',  missingIntegrations: 3, rulesMissingData: 2,  totalRules: 3  },
  { name: 'Collection',            status: 'warning',  missingIntegrations: 2, rulesMissingData: 2,  totalRules: 2  },
  { name: 'Exfiltration',          status: 'warning',  missingIntegrations: 2, rulesMissingData: 2,  totalRules: 3  },
  { name: 'Impact',                status: 'warning',  missingIntegrations: 2, rulesMissingData: 4,  totalRules: 5  },
  { name: 'Resource Development',  status: 'warning',  missingIntegrations: 1, rulesMissingData: 1,  totalRules: 1  },
  { name: 'Credential Access',     status: 'warning',  missingIntegrations: 3, rulesMissingData: 8,  totalRules: 9  },
  { name: 'Command and Control',   status: 'warning',  missingIntegrations: 3, rulesMissingData: 1,  totalRules: 5  },
  { name: 'Reconnaissance',        status: 'inactive', totalRules: 0 },
];

const MitreCoverageLegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <EuiHealth color={color}>
    <EuiText size="xs">{label}</EuiText>
  </EuiHealth>
);

const MitreAttackCoveragePanel: React.FC = () => (
  <div data-test-subj="siemReadiness-mitreAttackCoverage">
    <EuiText size="s" color="subdued" style={{ marginBottom: 12 }}>
      This diagram shows which MITRE ATT&CK tactics have enabled rules mapped to them and whether any of those rules have missing or disabled integrations
    </EuiText>
    <EuiText size="s" style={{ marginBottom: 16 }}>
      <strong>{MITRE_MAPPED_RULES_COUNT}</strong> out of <strong>{MITRE_TOTAL_ENABLED_RULES}</strong> enabled rules are mapped to a MITRE ATT&CK tactic.
    </EuiText>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        height: 300,
      }}
    >
      {MITRE_TACTIC_COVERAGE.map((tactic) => (
        <div
          key={tactic.name}
          data-test-subj={`siemReadiness-mitreTactic-${tactic.name.replace(/\s+/g, '-')}`}
          style={{
            backgroundColor: MITRE_COVERAGE_COLORS[tactic.status],
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 0,
          }}
        >
          <EuiText size="xs"><strong>{tactic.name}</strong></EuiText>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
            {tactic.status === 'inactive' || tactic.totalRules === 0 ? (
              <div><strong>0</strong> rule</div>
            ) : (
              <>
                {(tactic.missingIntegrations ?? 0) > 0 && (
                  <div><strong>{tactic.missingIntegrations}</strong> missing or disabled integrations</div>
                )}
                <div>
                  <strong>{tactic.rulesMissingData} / {tactic.totalRules}</strong> rules missing data
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>

    <EuiSpacer size="m" />
    <EuiFlexGroup direction="column" gutterSize="xs">
      <MitreCoverageLegendItem color={MITRE_LEGEND_COLORS.healthy} label="Healthy: All rules have integrations & data" />
      <MitreCoverageLegendItem color={MITRE_LEGEND_COLORS.warning} label="Warning: Missing or disabled integrations, or rule data" />
      <MitreCoverageLegendItem color={MITRE_LEGEND_COLORS.inactive} label="No enabled rules for this tactic" />
    </EuiFlexGroup>
  </div>
);

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
  'ds-auditbeat':                    'Network',
  'logs-endpoint':                   'Endpoint',
  'logs-okta':                       'Identity',
  'logs-aws':                        'Cloud',
  'logs-network':                    'Network',
  'logs-google':                     'Application/SaaS',
  'logs-google_workspace':           'Application/SaaS',
  'logs-salesforce':                 'Application/SaaS',
};

const INTEGRATION_TO_PLATFORM: Record<string, string> = {
  endpoint:         'Endpoint',
  elastic_agent:    'Endpoint',
  windows:          'Endpoint',
  okta:             'Identity',
  azure_ad:         'Identity',
  aws:              'Cloud',
  azure:            'Cloud',
  gcp:              'Cloud',
  network_traffic:  'Network',
  zeek:             'Network',
  google_workspace: 'Application/SaaS',
  salesforce:       'Application/SaaS',
};

function getIndexPrefix(indexName: string): string {
  const parts = indexName.split(/[.-]/);
  if (parts[0] === 'logs' && parts[1]) return `logs-${parts[1]}`;
  if (parts[0] === 'ds' && parts[1]) return `ds-${parts[1]}`;
  return indexName.split('-').slice(0, 2).join('-');
}

function getPlatformFromIndex(indexName: string): string {
  const prefix = getIndexPrefix(indexName);
  if (INDEX_PREFIX_TO_PLATFORM[prefix]) return INDEX_PREFIX_TO_PLATFORM[prefix];

  const name = indexName.toLowerCase();
  if (name.includes('endpoint')) return 'Endpoint';
  if (name.includes('okta') || name.includes('azure')) return 'Identity';
  if (name.includes('aws') || name.includes('cloudtrail') || name.includes('s3access') || name.includes('gcp')) return 'Cloud';
  if (name.includes('auditbeat') || name.includes('network') || name.includes('zeek')) return 'Network';
  if (name.includes('google') || name.includes('salesforce') || name.includes('workspace')) return 'Application/SaaS';

  return 'Unknown';
}

function getTacticsFromIndex(indexName: string): string[] {
  const integration = INDEX_PREFIX_TO_INTEGRATION[getIndexPrefix(indexName)];
  return integration ? (INTEGRATION_MITRE[integration] ?? []) : [];
}

const PlatformBadge: React.FC<{ platform: string }> = ({ platform }) => (
  <EuiBadge color="hollow">{platform}</EuiBadge>
);

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
  if (tactics.length === 0) return null;
  const visible = tactics.slice(0, 3);
  const rest    = tactics.slice(3);
  return (
    <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
      {visible.map((t) => (
        <EuiFlexItem key={t} grow={false}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>
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
                  : null
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

interface RulesAffectedPopoverProps {
  title: string;
  rules: FlyoutRule[];
  count: number;
  testSubj?: string;
  variant?: 'button' | 'link' | 'strong' | 'badge' | 'plain';
  linkLabel?: string;
}

const RulesAffectedPopover: React.FC<RulesAffectedPopoverProps> = ({
  title,
  rules,
  count,
  testSubj,
  variant = 'button',
  linkLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  if (count <= 0) return null;

  const toggle = () => setIsOpen((open) => !open);

  const trigger =
    variant === 'link' ? (
      <EuiLink onClick={toggle} data-test-subj={testSubj}>{linkLabel ?? count}</EuiLink>
    ) : variant === 'strong' ? (
      <EuiLink onClick={toggle} data-test-subj={testSubj}><strong>{count}</strong></EuiLink>
    ) : variant === 'plain' ? (
      <span
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', display: 'inline-block' }}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
        data-test-subj={testSubj}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 20,
            padding: '0 8px',
            borderRadius: 24,
            background: '#FFFFFF',
            fontSize: 12,
            lineHeight: '18px',
            color: '#07101F',
          }}
        >
          <EuiIcon type="radar" size="s" />
          {linkLabel ?? `${count} rules affected`}
        </span>
      </span>
    ) : variant === 'badge' ? (
      <span
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', display: 'inline-block' }}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
        data-test-subj={testSubj}
      >
        <EuiBadge color="hollow" iconType="radar" iconSide="left">
          {linkLabel ?? `${count} rules affected`}
        </EuiBadge>
      </span>
    ) : (
      <EuiButtonEmpty size="xs" flush="left" color="primary" onClick={toggle} data-test-subj={testSubj}>
        {count}
      </EuiButtonEmpty>
    );

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downLeft"
      panelPaddingSize="m"
      button={trigger}
    >
      <div style={{ minWidth: 300, maxWidth: 380 }}>
        <EuiTitle size="xxs"><h4>{title}</h4></EuiTitle>
        <EuiSpacer size="s" />
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          <EuiListGroup flush gutterSize="s">
            {rules.map((rule) => (
              <EuiListGroupItem key={rule.name} label={rule.name} size="s" />
            ))}
          </EuiListGroup>
        </div>
        <EuiSpacer size="m" />
        <EuiButtonEmpty
          size="s"
          iconType="popout"
          iconSide="right"
          href="/detection-rules"
          flush="left"
          data-test-subj={testSubj ? `${testSubj}-viewAll` : 'siemReadiness-rulesPopover-viewAll'}
        >
          View All Rules
        </EuiButtonEmpty>
      </div>
    </EuiPopover>
  );
};

// ─── Pillar summary card (Figma: 1863:26917) ──────────────────────────────────

interface HealthMetric {
  value: string | number;
  label: string;
  pillar: VisibilityTabId;
  sectionLabel?: string;
}

interface PillarSummaryCardProps {
  id: VisibilityTabId | HealthGroupId;
  label: string;
  severity: 'Critical' | 'Warning';
  numColor: string;
  metrics: HealthMetric[];
  totalRulesAffected: number | null;
  activeTypeFilter?: VisibilityTabId;
  onMetricClick?: (pillar: VisibilityTabId) => void;
}

const PillarSummaryCard: React.FC<PillarSummaryCardProps> = ({
  id,
  label,
  severity,
  numColor,
  metrics,
  totalRulesAffected,
  activeTypeFilter,
  onMetricClick,
}) => {
  const isCritical = severity === 'Critical';

  return (
    <div
      style={{
        border: '1px solid #E3E8F2',
        borderRadius: 6,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
      }}
      data-test-subj={`siemReadiness-healthCard-${id}`}
    >
      <div style={{ padding: '16px 16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 23, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <EuiText style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: '#000000' }}>{label}</EuiText>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 20,
                padding: '0 8px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                lineHeight: '16px',
                background: isCritical ? '#FDDDD8' : '#FDE9B5',
                color: isCritical ? '#A71627' : '#825803',
                whiteSpace: 'nowrap',
              }}
            >
              {severity}
            </span>
          </div>
          {totalRulesAffected !== null && totalRulesAffected > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                height: 20,
                padding: '0 8px',
                borderRadius: 20,
                border: '1px solid #CAD3E2',
                background: '#FFFFFF',
                fontSize: 12,
                fontWeight: 500,
                lineHeight: '16px',
                color: '#1D2A3E',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              data-test-subj={`siemReadiness-pillarTotalRules-${id}`}
            >
              <EuiIcon type="radar" size="s" />
              {totalRulesAffected} total rules affected
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
            gap: 8,
          }}
        >
          {metrics.map((metric) => {
            const isActive = activeTypeFilter === metric.pillar;
            return (
              <div
                key={metric.label}
                onClick={() => onMetricClick?.(metric.pillar)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  flex: 1,
                  minWidth: 0,
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: isActive ? '#E6F1FA' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: '24px', color: numColor }}>
                  {metric.value}
                </span>
                <EuiText size="s" style={{ color: isActive ? '#1750BA' : '#516381', lineHeight: '24px', fontWeight: isActive ? 600 : 400 }}>
                  {metric.label}
                </EuiText>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Data Coverage Panel (standalone — used in Visibility Health tab) ─────────

interface DataCoveragePanelProps {
  categories: CategoryGroup[];
  coverage: RuleIntegrationCoverage | null;
  pillarStatus: ReadinessStatus;
}

const DataCoveragePanel: React.FC<DataCoveragePanelProps> = ({ categories, coverage, pillarStatus }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
  const [openCoverageRows, setOpenCoverageRows] = useState<Record<string, boolean>>({});

  const missingSet = useMemo(
    () => new Set(coverage?.missingIntegrations ?? []),
    [coverage]
  );

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
    return [...rows].sort((a, b) => b.rulesCount - a.rulesCount);
  }, [categories, missingSet]);

  const coverageBadge = (label: string) => {
    if (label === 'Good')         return <EuiBadge color="success">Good</EuiBadge>;
    if (label === 'Degraded')     return <EuiBadge color="warning">Degraded</EuiBadge>;
    if (label === 'Missing data') return <EuiBadge color="danger">Missing data</EuiBadge>;
    return <EuiBadge color="hollow">{label}</EuiBadge>;
  };
  const div = <div style={{ width: 1, height: 14, background: '#D3DAE6', margin: '0 2px' }} />;

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s"><h3>Data coverage</h3></EuiTitle>
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
        Expand each log category to view platform-level coverage. Click a rules count to see affected rules.
      </EuiText>

      <EuiPanel hasBorder paddingSize="none" style={{ overflow: 'hidden' }}>
        {dataCategoryRows.map((row, idx) => {
          const platforms = getPlatformsWithRules(row.category);
          const isOpen = openCoverageRows[row.id] ?? false;
          const toggle = () => setOpenCoverageRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }));
          return (
            <div key={row.id}>
              <EuiFlexGroup alignItems="center" gutterSize="none" responsive={false}
                style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={toggle}>
                <EuiFlexItem grow={false} style={{ marginRight: 8 }}>
                  <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="text" />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s" style={{ fontWeight: 600 }}>{row.category}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Coverage:</EuiText></EuiFlexItem>
                        <EuiFlexItem grow={false}>{coverageBadge(row.statusLabel)}</EuiFlexItem>
                        <EuiFlexItem grow={false} style={{ margin: '0 6px' }}>{div}</EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="xs" color="subdued">Rules affected:{' '}
                            {row.rulesCount > 0
                              ? <RulesAffectedPopover title={`${row.rulesCount} rules affected`} rules={buildRulesList(row.rulesCount, row.category)} count={row.rulesCount} variant="strong" testSubj={`siemReadiness-dataCoverageRules-${row.id}`} />
                              : null}
                          </EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                    {platforms.length > 0 && (
                      <>
                        <EuiFlexItem grow={false} style={{ margin: '0 6px' }}>{div}</EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="xs" color="subdued">Platforms: <strong style={{ color: '#1d2a3e' }}>{platforms.length}</strong></EuiText>
                        </EuiFlexItem>
                      </>
                    )}
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
              {isOpen && (
                platforms.length > 0 ? (
                  <div style={{ padding: '0 16px 16px' }}>
                    <EuiBasicTable
                      items={platforms}
                      tableLayout="fixed"
                      columns={[
                        { field: 'name', name: 'Platform', render: (name: string, sub: PlatformSubRow) => (
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}><EuiIcon type={sub.icon} size="s" color="subdued" /></EuiFlexItem>
                            <EuiFlexItem grow={false}><EuiText size="s">{name}</EuiText></EuiFlexItem>
                          </EuiFlexGroup>
                        )},
                        { field: 'coverage', name: 'Coverage', width: '210px', render: (label: string) => coverageBadge(label) },
                        { field: 'rulesAffected', name: 'Rules affected', width: '228px', render: (count: number, sub: PlatformSubRow) =>
                          count > 0 ? <RulesAffectedPopover title={`${count} rules affected`} rules={buildRulesList(count, sub.name, sub.tactics)} count={count} variant="link" testSubj={`siemReadiness-platformRules-${sub.id}`} /> : null
                        },
                        { field: 'tactics', name: 'Tactics at risk', width: '315px', render: (tactics: string[]) =>
                          tactics.length > 0
                            ? <EuiFlexGroup gutterSize="xs" wrap responsive={false} justifyContent="flexStart">{tactics.map((t) => <EuiFlexItem key={t} grow={false}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>)}</EuiFlexGroup>
                            : null
                        },
                        { field: 'action', name: 'Actions', width: '202px', align: 'right', render: (action: PlatformSubRow['action']) =>
                          action ? renderRightAlignedTableAction(
                            <EuiButtonEmpty size="s" color="primary" iconType="popout" iconSide="right" flush="right" href="/app/fleet">
                              {action === 'Install' ? 'Install integration' : 'Fix integration'}
                            </EuiButtonEmpty>
                          ) : null
                        },
                      ] as Array<EuiBasicTableColumn<PlatformSubRow>>}
                      itemId="id"
                    />
                  </div>
                ) : (
                  <div style={{ padding: '0 16px 16px' }}>
                    <EuiCallOut size="s" iconType="iInCircle" title="Platform-level breakdown coming in M2">
                      <EuiText size="xs"><p>Platform sub-row expansion for <strong>{row.category}</strong> will be available once stream-to-platform dependency mapping ships in M2.</p></EuiText>
                    </EuiCallOut>
                  </div>
                )
              )}
              {idx < dataCategoryRows.length - 1 && <EuiHorizontalRule margin="none" />}
            </div>
          );
        })}
      </EuiPanel>
    </EuiPanel>
  );
};

// ─── Coverage tab ─────────────────────────────────────────────────────────────

interface CoverageTabProps {
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
  loading: boolean;
  actionItemIds: Set<string>;
  pillarStatus: ReadinessStatus;
  ruleSubTab: 'all' | 'mitre';
  onRuleSubTabChange: (tab: 'all' | 'mitre') => void;
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

const CATEGORY_PLATFORMS: Record<string, Omit<PlatformSubRow, 'rulesAffected'>[]> = {
  'Network': [
    { id: 'palo-alto-prod',   name: 'Palo Alto Prod',    icon: 'globe',   coverage: 'Good',         tactics: [],                    action: null      },
    { id: 'vpn-corp',         name: 'VPN/Corp',           icon: 'globe',   coverage: 'Missing data', tactics: ['Lateral Movement'],   action: 'Install' },
  ],
  'Cloud': [
    { id: 'aws-prod',         name: 'AWS Prod',           icon: 'compute', coverage: 'Degraded',     tactics: ['Initial Access'],      action: 'Fix'     },
    { id: 'aws-biztech',      name: 'AWS BizTech',        icon: 'compute', coverage: 'Missing data', tactics: ['Privilege Escalation'], action: 'Install' },
  ],
  'Endpoint': [
    { id: 'macos-endpoints',  name: 'macOS Endpoints',    icon: 'desktop', coverage: 'Good',         tactics: [],                       action: null      },
    { id: 'windows-endpoints',name: 'Windows Endpoints',  icon: 'desktop', coverage: 'Missing data', tactics: ['Execution'],              action: 'Install' },
  ],
  'Identity': [
    { id: 'okta',             name: 'Okta',               icon: 'lock',    coverage: 'Missing data', tactics: ['Credential Access'],      action: 'Install' },
    { id: 'azure-ad',         name: 'Azure AD',           icon: 'lock',    coverage: 'Good',         tactics: [],                       action: null      },
  ],
  'Application/SaaS': [
    { id: 'google-workspace', name: 'Google Workspace',   icon: 'globe',   coverage: 'Good',         tactics: [],                       action: null      },
    { id: 'salesforce',       name: 'Salesforce',         icon: 'globe',   coverage: 'Good',         tactics: [],                       action: null      },
  ],
};

const CATEGORY_RULES_COUNT: Record<string, number> = {
  'Network': 24, 'Cloud': 19, 'Endpoint': 15, 'Identity': 11, 'Application/SaaS': 7,
};

function getPlatformsWithRules(category: string): PlatformSubRow[] {
  const platforms = CATEGORY_PLATFORMS[category] ?? [];
  const total = CATEGORY_RULES_COUNT[category] ?? 0;
  const issueIndices = platforms
    .map((p, i) => (p.coverage !== 'Good' ? i : -1))
    .filter((i) => i >= 0);

  if (issueIndices.length === 0) {
    return platforms.map((p) => ({ ...p, rulesAffected: 0 }));
  }

  const base = Math.floor(total / issueIndices.length);
  const remainder = total % issueIndices.length;

  return platforms.map((p, i) => {
    const issueIdx = issueIndices.indexOf(i);
    if (issueIdx === -1) return { ...p, rulesAffected: 0 };
    return { ...p, rulesAffected: base + (issueIdx < remainder ? 1 : 0) };
  });
}

const CATEGORY_INTEGRATIONS: Record<string, string[]> = {
  'Endpoint':         ['endpoint', 'elastic_agent', 'windows'],
  'Identity':         ['okta', 'azure_ad'],
  'Network':          ['network_traffic', 'zeek'],
  'Cloud':            ['aws', 'azure', 'gcp'],
  'Application/SaaS': ['google_workspace', 'salesforce'],
};

interface IntegrationRulesGapRow {
  id: string;
  integration: string;
  category: string;
  enabled: number;
  total: number;
}

const INTEGRATION_RULES_GAP_ROWS: IntegrationRulesGapRow[] = [
  { id: 'okta', integration: 'Okta', category: 'Identity', enabled: 0, total: 8 },
  { id: 'google-workspace', integration: 'Google Workspace', category: 'Application/SaaS', enabled: 3, total: 11 },
  { id: 'crowdstrike-edr', integration: 'CrowdStrike EDR', category: 'Endpoint', enabled: 0, total: 6 },
  { id: 'cisco-umbrella', integration: 'Cisco Umbrella', category: 'Network', enabled: 2, total: 9 },
];

const CoverageTab: React.FC<CoverageTabProps> = ({
  coverage,
  categories,
  integrations,
  loading,
  actionItemIds,
  pillarStatus,
  ruleSubTab,
  onRuleSubTabChange,
  onAskAI,
}) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
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

  const integrationRulesGapRows = useMemo(
    () => INTEGRATION_RULES_GAP_ROWS.filter((row) => row.enabled < row.total),
    []
  );

  const integrationRulesMissingCount = useMemo(
    () => integrationRulesGapRows.reduce((sum, row) => sum + (row.total - row.enabled), 0),
    [integrationRulesGapRows]
  );

  const integrationRulesGapColumns: Array<EuiBasicTableColumn<IntegrationRulesGapRow>> = [
    {
      field: 'integration',
      name: 'Integration',
      render: (name: string) => <EuiText size="s" style={{ fontWeight: 500 }}>{name}</EuiText>,
    },
    {
      field: 'category',
      name: 'Category',
      width: '180px',
      render: (category: string) => <EuiBadge color="hollow">{category}</EuiBadge>,
    },
    {
      name: 'Rules enabled',
      width: '220px',
      render: (row: IntegrationRulesGapRow) => (
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem>
            <EuiProgress
              value={(row.enabled / row.total) * 100}
              max={100}
              size="xs"
              color="danger"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">{row.enabled} / {row.total}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      name: 'Gap',
      width: '160px',
      render: (row: IntegrationRulesGapRow) => (
        <EuiText size="s">
          {row.total - row.enabled} rules missing
        </EuiText>
      ),
    },
    {
      name: 'Action',
      width: '150px',
      align: 'right',
      render: (row: IntegrationRulesGapRow) => renderRightAlignedTableAction(
        <EuiButtonEmpty
          size="s"
          iconType="plusInCircle"
          color="primary"
          flush="right"
          data-test-subj={`siemReadiness-installRules-${row.id}`}
          onClick={() => onAskAI?.(`Which rules should I install for ${row.integration} and how do I set them up?`)}
        >
          Install rules
        </EuiButtonEmpty>
      ),
    },
  ];

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
        if (!count) return null;
        const tactics = INTEGRATION_MITRE[row.id] ?? [];
        return (
          <RulesAffectedPopover
            title={`${count} rules affected`}
            rules={buildRulesList(count, row.name, tactics)}
            count={count}
            testSubj={`siemReadiness-coverageRulesAffected-${row.id}`}
          />
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
      render: (row: CategoryAccordionItem) => (
        <PlatformBadge platform={INTEGRATION_TO_PLATFORM[row.id] ?? 'Unknown'} />
      ),
    },
    {
      name: 'Action',
      width: '150px',
      align: 'right',
      render: (row: CategoryAccordionItem) => {
        const button = actionItemIds.has(`coverage-${row.id}`) ? (
          <EuiButtonEmpty size="s" color="primary" flush="right" data-test-subj={`siemReadiness-coverageInActions-${row.id}`}>In Actions</EuiButtonEmpty>
        ) : row.status === 'uncovered' ? (
          <EuiButtonEmpty size="s" color="primary" iconType="popout" iconSide="right" flush="right" href="/app/fleet" data-test-subj={`siemReadiness-coverageInstall-${row.id}`}>Install integration</EuiButtonEmpty>
        ) : row.status === 'warning' ? (
          <EuiButtonEmpty size="s" color="primary" iconType="popout" iconSide="right" flush="right" href="/app/fleet" data-test-subj={`siemReadiness-coverageConfigure-${row.id}`}>Configure policy</EuiButtonEmpty>
        ) : (
          <EuiButtonEmpty size="s" color="primary" iconType="popout" iconSide="right" flush="right" href="/app/fleet" data-test-subj={`siemReadiness-coverageCreateCase-${row.id}`}>View in Fleet</EuiButtonEmpty>
        );
        return renderRightAlignedTableAction(button);
      },
    },
  ];

  const renderRuleBadge = (items: CategoryAccordionItem[]) => {
    const uncovered = items.filter((i) => i.status === 'uncovered' || i.status === 'warning').length;
    return uncovered > 0
      ? <EuiBadge color="warning" iconType="warning">{uncovered} missing</EuiBadge>
      : <EuiBadge color="success" iconType="check">All covered</EuiBadge>;
  };

  // ── Data Coverage section ─────────────────────────────
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
      <EuiPanel hasBorder paddingSize="m">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s"><h3>Integrations missing rules</h3></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge></EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          Installed integrations with missing or partial detection rules.
        </EuiText>
        {integrationRulesGapRows.length > 0 && (
          <>
            <EuiSpacer size="m" />
            <EuiCallOut
              color="warning"
              iconType="warning"
              size="s"
              title={`${integrationRulesMissingCount} detection rules are missing from ${integrationRulesGapRows.length} installed integrations.`}
            />
          </>
        )}
        <EuiSpacer size="m" />
        <EuiBasicTable
          items={integrationRulesGapRows}
          tableLayout="fixed"
          columns={integrationRulesGapColumns}
          itemId="id"
        />
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* ── Rule Coverage panel ── */}
      <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s"><h3>Enabled rule data coverage</h3></EuiTitle>
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
        <EuiCallOut color={calloutColor} size="s" title={<>76 rules have missing or disabled integrations. <EuiLink href="#">Learn more</EuiLink></>} />
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
        onChange={(id) => onRuleSubTabChange(id as 'all' | 'mitre')}
        buttonSize="s"
        color="primary"
        style={{ marginBottom: 8 }}
      />

      {ruleSubTab === 'all' ? (
        <>
          <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>
            The following table shows the total number of enabled rules, and those with missing or disabled integrations.
          </EuiText>

          {/* ── Coverage bar + table layout ── */}
          <EuiFlexGroup alignItems="center" gutterSize="xl" responsive={false} style={{ marginBottom: 8 }}>

            {/* Coverage bar */}
            <EuiFlexItem grow={false} style={{ minWidth: 418 }}>
              <RuleCoverageBar covered={48} uncovered={76} />
            </EuiFlexItem>

            {/* Integration status table */}
            <EuiFlexItem>
              <EuiBasicTable
                items={[
                  { id: 'enabled', statusColor: 'success' as const, label: 'Enabled Integrations',             count: 48  },
                  { id: 'missing', statusColor: 'danger'  as const, label: 'Missing or Disabled Integrations', count: 76  },
                ]}
                columns={[
                  {
                    field: 'label',
                    name: 'Data Source status',
                    render: (label: string, row: { statusColor: string; label: string; count: number; id: string }) => (
                      <EuiHealth color={row.statusColor}>{label}</EuiHealth>
                    ),
                  },
                  { field: 'count', name: '# of rules associated', width: '240px',
                    render: (count: number, row: { id: string; label: string }) => (
                      <RulesAffectedPopover
                        title={`${count} rules associated`}
                        rules={buildRulesList(count, row.label)}
                        count={count}
                        testSubj={`siemReadiness-associatedRules-${row.id}`}
                      />
                    ),
                  },
                  {
                    name: 'Actions',
                    width: '168px',
                    align: 'right',
                    render: (row: { statusColor: string; label: string; count: number; id: string }) => renderRightAlignedTableAction(
                      <EuiButtonEmpty size="s" color="primary" flush="right" data-test-subj={`siemReadiness-viewIntegrations-${row.id}`}>
                        {row.id === 'missing' ? 'Install integrations' : 'View integrations'}
                      </EuiButtonEmpty>
                    ),
                  },
                ] as Array<EuiBasicTableColumn<{ id: string; statusColor: string; label: string; count: number }>>}
                itemId="id"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ) : (
        <MitreAttackCoveragePanel />
      )}
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

interface QualityTabProps { categories: CategoryGroup[]; qualityResults: QualityResult[]; loading: boolean; actionItemIds: Set<string>; pillarStatus: ReadinessStatus }

interface DetectionsTabProps { ruleFieldIssues: RuleFieldIssue[]; loading: boolean; pillarStatus: ReadinessStatus }

const QualityTab: React.FC<QualityTabProps> = ({ categories, qualityResults, loading, actionItemIds, pillarStatus }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
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
    { field: 'incompatibleFieldCount', name: 'Incompatible fields', sortable: true, width: '9%',
      render: (n: number) => <EuiText size="s">{n}</EuiText> },
    { field: 'checkedAt', name: 'Last checked', sortable: true, width: '10%',
      render: (t?: number) => <EuiText size="s" color={t ? undefined : 'subdued'}>{relativeTime(t)}</EuiText> },
    { field: 'status', name: 'Status', sortable: true, width: '9%',
      render: (s: string) => (
        <EuiBadge color={s === 'incompatible' ? 'warning' : 'success'}>
          {s === 'incompatible' ? 'Incompatible' : 'Healthy'}
        </EuiBadge>
      ) },
    {
      name: 'Tactics',
      width: '26%',
      render: (row: QualityIndexItem) => <TacticsCell tactics={getTacticsFromIndex(row.indexName)} />,
    },
    {
      name: 'Actions',
      width: '10%',
      align: 'right',
      render: (row: QualityIndexItem) => renderRightAlignedTableAction(
        <EuiButtonEmpty size="s" color="primary" flush="right" onClick={() => setFlyout({ findingName: row.indexName, rules: getTacticsFromIndex(row.indexName).length > 0 ? [{ name: `Rule targeting ${row.indexName}`, tactics: getTacticsFromIndex(row.indexName), status: 'no-action' }] : [] })} data-test-subj={`siemReadiness-qualityRulesAffected-${row.id}`}>
          View Data quality
        </EuiButtonEmpty>
      ),
    },
  ];

  const categoryStatusBadge = (incompatFields: number) => {
    if (incompatFields > 0) return <EuiBadge color="warning">Actions required</EuiBadge>;
    return <EuiBadge color="success">Healthy</EuiBadge>;
  };

  const metaDivider = <div style={{ width: 1, height: 14, background: '#D3DAE6', margin: '0 2px' }} />;

  return (
    <>
      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}

      {/* ── ECS field compatibility (full width) ── */}
      <EuiFlexGroup gutterSize="m" alignItems="flexStart" responsive={false}>
        <EuiFlexItem>
          <EuiPanel hasBorder hasShadow={false} paddingSize="m">
            <EuiTitle size="s"><h3>Quality</h3></EuiTitle>
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

            <EuiSpacer size="m" />

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
                  fullWidth
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

            {/* Accordions — custom expandable rows (EuiAccordion forceState is unreliable) */}
            <EuiPanel hasBorder paddingSize="none" style={{ overflow: 'hidden' }}>
              {filteredCategories.map((cat, idx) => {
                const incompatFields = cat.items.reduce((s, i) => s + i.incompatibleFieldCount, 0);
                const affected = cat.items.filter((i) => i.status === 'incompatible').length;
                const isOpen = openAccordions[cat.category] ?? false;
                const toggle = () => setOpenAccordions((prev) => ({ ...prev, [cat.category]: !prev[cat.category] }));
                return (
                  <div key={cat.category}>
                    {/* Row header */}
                    <EuiFlexGroup
                      alignItems="center"
                      gutterSize="none"
                      responsive={false}
                      style={{ padding: '14px 16px', cursor: 'pointer' }}
                      onClick={toggle}
                    >
                      <EuiFlexItem grow={false} style={{ marginRight: 8 }}>
                        <EuiIcon type={isOpen ? 'arrowDown' : 'arrowRight'} size="s" color="text" />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiText size="s" style={{ fontWeight: 600 }}>{cat.category}</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ paddingRight: 0 }}>
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
                      </EuiFlexItem>
                    </EuiFlexGroup>

                    {/* Expanded content */}
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <EuiInMemoryTable
                          items={cat.items}
                          columns={qualityColumns}
                          pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
                          sorting={{ sort: { field: 'indexName', direction: 'asc' } }}
                          tableLayout="auto"
                        />
                      </div>
                    )}
                    {idx < filteredCategories.length - 1 && <EuiHorizontalRule margin="none" />}
                  </div>
                );
              })}
            </EuiPanel>
          </EuiPanel>
        </EuiFlexItem>

      </EuiFlexGroup>
    </>
  );
};

// ─── Detections tab ───────────────────────────────────────────────────────────

const DetectionsTab: React.FC<DetectionsTabProps> = ({ ruleFieldIssues, loading, pillarStatus }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  return (
    <>
      {/* ── Rule field issues ── */}
      <EuiPanel hasBorder paddingSize="m">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s"><h3>Rule field issues</h3></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge></EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        {ruleFieldIssues.length > 0 ? (
          <>
            <EuiCallOut color={calloutColor} iconType="inspect" size="s" title="Some enabled rules reference fields that are missing or incompatible — they may execute but will never match. Review and fix the issues below." />
            <EuiSpacer size="m" />
            <EuiBasicTable
              items={ruleFieldIssues}
              tableLayout="fixed"
              columns={[
                { field: 'ruleName', name: 'Rule', render: (name: string) => <EuiLink href="/app/security/rules">{name}</EuiLink> },
                {
                  field: 'field', name: 'Field', width: '280px',
                  render: (f: string) => <EuiCode>{f}</EuiCode>,
                },
                {
                  field: 'issueType', name: 'Issue', width: '130px',
                  render: (type: string) => {
                    const labelMap: Record<string, string> = { missing: 'Field missing', type_mismatch: 'Type mismatch', sparse: 'Sparsely populated' };
                    return <EuiBadge color="hollow">{labelMap[type] ?? type}</EuiBadge>;
                  },
                },
                {
                  field: 'indexPattern', name: 'Index pattern', width: '385px',
                  render: (idx: string) => <EuiCode>{idx}</EuiCode>,
                },
                {
                  name: 'Platform', width: '240px',
                  render: (row: RuleFieldIssue) => <PlatformBadge platform={getPlatformFromIndex(row.indexPattern)} />,
                },
                {
                  name: 'Action',
                  width: '150px',
                  align: 'right',
                  render: (row: RuleFieldIssue) => renderRightAlignedTableAction(
                    <EuiButtonEmpty size="s" color="primary" flush="right" data-test-subj={`siemReadiness-detectionsViewDataQuality-${row.id}`}>View Data quality</EuiButtonEmpty>
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
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s"><h3>Continuity</h3></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge></EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          See which data streams have stopped sending data, dropped in volume, or exceeded latency SLAs. Detection rules that depend on these streams may be running but not matching anything.
        </EuiText>
        <EuiSpacer size="m" />
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
        <EuiText size="s">
          {row.volumeBaseline !== null && row.volumeCurrent !== null && (
            <p style={{ margin: '2px 0' }}>
              <strong>7d avg:</strong> {row.volumeBaseline.toLocaleString()}/hr → <strong>Current:</strong> {row.volumeCurrent.toLocaleString()}/hr
            </p>
          )}
          {row.p95Latency !== null && (
            <p style={{ margin: '2px 0' }}>
              <strong>P95 latency:</strong> {row.p95Latency} min
            </p>
          )}
          {platform === '' && (
            <p style={{ margin: '2px 0' }}>
              <strong>Platform:</strong> unmapped
            </p>
          )}
        </EuiText>
      </EuiPanel>
    );
  });

  return (
    <>
      {/* ── Findings panel ── */}
      <EuiPanel hasBorder paddingSize="m">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s"><h3>Continuity</h3></EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge></EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          See which data streams have stopped sending data, dropped in volume, or exceeded latency SLAs. Detection rules that depend on these streams may be running but not matching anything.
        </EuiText>
        <EuiSpacer size="m" />
        {callout && (
          <>
            <EuiCallOut title={`${callout.title} ${callout.body}`} color={callout.color} iconType={callout.iconType} size="s" />
            <EuiSpacer size="m" />
          </>
        )}

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
            field: 'issue', name: 'Issue', width: '127px',
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
            render: (row: ContinuityFinding) => <PlatformBadge platform={getPlatformFromIndex(row.dataset)} />,
          },
          {
            field: 'rulesAffected', name: 'Rules affected', width: '110px',
            render: (count: number, row: ContinuityFinding) => (
              <RulesAffectedPopover
                title={`${count} rules affected`}
                rules={buildRulesList(count, row.dataset, getTacticsFromIndex(row.dataset))}
                count={count}
                variant="link"
                testSubj={`siemReadiness-continuityRulesAffected-${row.id}`}
              />
            ),
          },
          {
            name: 'Action',
            width: '204px',
            align: 'right',
            render: (row: ContinuityFinding) => {
              const actionId = `continuity-${row.id}`;
              const button = actionItemIds.has(actionId) ? (
                <EuiButtonEmpty size="s" color="primary" flush="right" data-test-subj={`siemReadiness-continuityInActions-${row.id}`}>
                  In Actions
                </EuiButtonEmpty>
              ) : (
                <EuiButtonEmpty
                  size="s"
                  iconType="popout"
                  iconSide="right"
                  color="primary"
                  flush="right"
                  href="/app/fleet"
                  data-test-subj={`siemReadiness-continuityFleet-${row.id}`}
                >
                  {row.issue === 'silent' ? 'View data stream' : row.issue === 'volume_drop' ? 'View pipeline' : 'View stream'}
                </EuiButtonEmpty>
              );
              return renderRightAlignedTableAction(button);
            },
          },
        ] as Array<EuiBasicTableColumn<ContinuityFinding>>}
      />
      </EuiPanel>
    </>
  );
};

// ─── Retention tab (Fix 6: benchmark comparison) ──────────────────────────────

interface RetentionFinding { id: string; category: string; actualDays: number; benchmarkDays: number; status: 'below' | 'meets'; rulesAffected: number }

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
  const retentionFindings: RetentionFinding[] = useMemo(() => {
    return categories.map((cat) => {
      const benchmark = RETENTION_BENCHMARKS[cat.category] ?? 90;
      const match = retentionItems.find((r) => cat.indices.some((idx) => idx.indexName.includes(r.indexName)));
      const actualDays = match?.retentionDays ?? 0;
      return { id: cat.category, category: cat.category, actualDays, benchmarkDays: benchmark, status: actualDays >= benchmark ? 'meets' as const : 'below' as const, rulesAffected: actualDays >= benchmark ? 0 : 50 };
    });
  }, [categories, retentionItems]);

  const belowCount = retentionFindings.filter((f) => f.status === 'below').length;

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s"><h3>Retention</h3></EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="folderClosed" color="primary">View Cases&nbsp;<EuiBadge color="hollow">0</EuiBadge></EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" iconType="plusInCircle" color="primary">Create new case</EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Compare log category retention against compliance benchmarks. Categories below benchmark may lack the historical data your rules and investigations need.
      </EuiText>
      <EuiSpacer size="m" />
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
              {
                field: 'status', name: 'Status', width: '140px',
                render: (status: string) => (
                  <EuiBadge color={status === 'below' ? 'warning' : 'success'}>
                    {status === 'below' ? 'Below benchmark' : 'Meets benchmark'}
                  </EuiBadge>
                ),
              },
              { field: 'actualDays', name: 'Current retention', width: '120px',
                render: (days: number) => <EuiText size="s">{days > 0 ? `${days} days` : 'Not configured'}</EuiText>,
              },
              {
                field: 'benchmarkDays', name: 'Benchmark', width: '92px',
                render: (days: number, row: RetentionFinding) => (
                  <EuiToolTip content={RETENTION_BENCHMARK_COMPLIANCE[days] ?? ''} data-test-subj={`siemReadiness-retentionBenchmarkTooltip-${row.id}`}>
                    <EuiText size="s" color="subdued" style={{ cursor: 'help', borderBottom: '1px dashed #98A2B3' }}>{days} days</EuiText>
                  </EuiToolTip>
                ),
              },
              {
                name: 'Benchmark source',
                width: '221px',
                render: (row: RetentionFinding) => {
                  const sourceMap: Record<string, string> = {
                    'Network':          'NIST 800-53, ISO 27001',
                    'Endpoint':         'NIST 800-53 AU-11, SOC2',
                    'Identity':         'FedRAMP, SOC2',
                    'Cloud':            'FedRAMP, SOC2',
                    'Application/SaaS': 'SOC2, ISO 27001',
                  };
                  return <EuiText size="s" color="subdued">{sourceMap[row.category] ?? ''}</EuiText>;
                },
              },
              {
                name: 'Tactics at risk',
                render: (row: RetentionFinding) => {
                  const tactics = RETENTION_TACTICS[row.category] ?? [];
                  return tactics.length > 0
                    ? <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                        {tactics.map((t) => <EuiFlexItem key={t} grow={false}><EuiBadge color="hollow">{t}</EuiBadge></EuiFlexItem>)}
                      </EuiFlexGroup>
                    : null;
                },
              },
              {
                name: 'Platform', width: '120px',
                render: (row: RetentionFinding) => (
                  <PlatformBadge platform={RETENTION_PLATFORM[row.category] ?? row.category} />
                ),
              },
              {
                field: 'rulesAffected', name: 'Rules affected', width: '127px',
                render: (count: number, row: RetentionFinding) => count > 0 ? (
                  <RulesAffectedPopover
                    title={`${count} rules affected`}
                    rules={buildRulesList(count, row.category, RETENTION_TACTICS[row.category] ?? [])}
                    count={count}
                    variant="link"
                    testSubj={`siemReadiness-retentionRulesAffected-${row.id}`}
                  />
                ) : null,
              },
              {
                name: 'Action',
                width: '188px',
                align: 'right',
                render: (row: RetentionFinding) => renderRightAlignedTableAction(
                  actionItemIds.has('retention-benchmark')
                    ? <EuiButtonEmpty size="s" iconType="popout" iconSide="right" flush="right" href="/app/management/data/index_lifecycle_management" data-test-subj={`siemReadiness-retentionInActions-${row.id}`}>View ILM policy</EuiButtonEmpty>
                    : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" flush="right" href="/app/management/data/index_lifecycle_management" data-test-subj={`siemReadiness-retentionManage-${row.id}`}>Manage policy</EuiButtonEmpty>
                ),
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

interface PlatformConfig { id: string; name: string; category: string; derivedFrom: string; enabled: boolean }

interface CategoryRetentionConfig {
  customRetention: boolean;
  days: number;
}

const createDefaultRetentionConfig = (): Record<string, CategoryRetentionConfig> =>
  Object.fromEntries(
    ALL_CATEGORY_NAMES.map((cat) => [cat, { customRetention: false, days: 30 }])
  );

const DEFAULT_PLATFORMS: PlatformConfig[] = [
  { id: 'palo-alto-prod',    name: 'Palo Alto Prod',    category: 'Network',          enabled: true,  derivedFrom: 'Detected from network.type: paloalto + observer.name: fw-prod-01' },
  { id: 'vpn-corp',          name: 'VPN/Corp',           category: 'Network',          enabled: true,  derivedFrom: 'Detected from observer.type: vpn + host.name: corp-vpn-01' },
  { id: 'aws-prod',          name: 'AWS Prod',           category: 'Cloud',            enabled: true,  derivedFrom: 'Detected from cloud.provider: aws + cloud.account.id: 123456' },
  { id: 'aws-biztech',       name: 'AWS BizTech',        category: 'Cloud',            enabled: true,  derivedFrom: 'Detected from cloud.provider: aws + cloud.account.id: 789012' },
  { id: 'macos-endpoints',   name: 'macOS Endpoints',    category: 'Endpoint',         enabled: true,  derivedFrom: 'Detected from host.os.type: macos + host.domain: corp.local' },
  { id: 'windows-endpoints', name: 'Windows Endpoints',  category: 'Endpoint',         enabled: true,  derivedFrom: 'Detected from host.os.type: windows + host.domain: corp.local' },
  { id: 'okta',              name: 'Okta',               category: 'Identity',         enabled: true,  derivedFrom: 'Detected from event.dataset: okta.system' },
  { id: 'azure-ad',          name: 'Azure AD',           category: 'Identity',         enabled: true,  derivedFrom: 'Detected from event.dataset: azure.auditlogs' },
  { id: 'google-workspace',  name: 'Google Workspace',   category: 'Application/SaaS', enabled: true,  derivedFrom: 'Detected from event.dataset: google_workspace.admin' },
  { id: 'salesforce',        name: 'Salesforce',         category: 'Application/SaaS', enabled: true,  derivedFrom: 'Detected from event.dataset: salesforce.apex' },
];

const SiemReadinessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = mapTabParam(searchParams.get('tab'));
  const [selectedTab, setSelectedTab] = useState<SiemTab>(initialTab);
  const [ruleSubTab, setRuleSubTab] = useState<'all' | 'mitre'>('all');
  const [typeFilter, setTypeFilter] = useState<VisibilityTabId | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<'critical' | 'warning' | undefined>(undefined);
  const actionsPanelRef = useRef<HTMLDivElement>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [siemView, setSiemView] = useState<'a' | 'b'>('a');
  const [assistantSession, setAssistantSession] = useState(0);

  const openAssistant = (prompt = '') => {
    setAssistantPrompt(prompt);
    setAssistantSession((s) => s + 1);
    setAssistantOpen(true);
  };

  const handleAddToChat = (prompt: string) => {
    openAssistant(prompt);
  };

  const SIEM_READINESS_SUMMARY_PROMPT =
    'Summarize my SIEM Readiness status across Visibility health and Detection health. Highlight critical issues and recommend the top actions I should take.';

  const handleMetricClick = (pillar: VisibilityTabId) => {
    setTypeFilter((current) => (current === pillar ? undefined : pillar));
    actionsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const { loading, coverage, categories, integrations, qualityResults, pipelines, retentionItems, ruleFieldIssues } = useSiemReadinessData();

  // ── Configuration modal ───────────────────────────────────────────────────
  const [configOpen, setConfigOpen] = useState(false);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set(ALL_CATEGORY_NAMES));
  const [tempCategories, setTempCategories] = useState<Set<string>>(new Set(ALL_CATEGORY_NAMES));
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(DEFAULT_PLATFORMS);
  const [tempPlatforms, setTempPlatforms] = useState<PlatformConfig[]>(DEFAULT_PLATFORMS);
  const [retentionConfig, setRetentionConfig] = useState<Record<string, CategoryRetentionConfig>>(createDefaultRetentionConfig);
  const [tempRetentionConfig, setTempRetentionConfig] = useState<Record<string, CategoryRetentionConfig>>(createDefaultRetentionConfig);

  const openConfig = () => {
    setTempCategories(new Set(enabledCategories));
    setTempPlatforms(platforms.map(p => ({ ...p })));
    setTempRetentionConfig(Object.fromEntries(
      ALL_CATEGORY_NAMES.map((cat) => [cat, { ...retentionConfig[cat] }])
    ));
    setConfigOpen(true);
  };
  const saveConfig = () => {
    setEnabledCategories(new Set(tempCategories));
    setPlatforms(tempPlatforms);
    setRetentionConfig(Object.fromEntries(
      ALL_CATEGORY_NAMES.map((cat) => [cat, { ...tempRetentionConfig[cat] }])
    ));
    setConfigOpen(false);
  };
  const toggleTemp = (cat: string) => setTempCategories(prev => {
    const next = new Set(prev);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    return next;
  });
  const updateTempPlatform = (id: string, patch: Partial<PlatformConfig>) =>
    setTempPlatforms(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  const updateTempRetention = (cat: string, patch: Partial<CategoryRetentionConfig>) =>
    setTempRetentionConfig(prev => ({
      ...prev,
      [cat]: { ...prev[cat], ...patch },
    }));
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);

  const filteredCategories = categories.filter(
    (c) => enabledCategories.has(c.category)
  );

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
    const executionIssueCount = EXECUTION_HEALTH_ROWS.filter((r) => r.status !== 'Succeeded').length;
    const detectionsBlastRadius = (new Set(ruleFieldIssues.map((i) => i.ruleName)).size + executionIssueCount) || null;
    // Continuity: sum rulesAffected from failing/silent pipelines (3 per silent, 12 per volume_drop — matches ContinuityTab logic)
    const continuityBlastRadius = pipelines.reduce<number>((sum, p) => {
      if (p.docsCount === 0) return sum + 3;
      if (p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1) return sum + 12;
      return sum;
    }, 0) || null;
    const retentionBlastRadius: number | null = retentionBelowBenchmark > 0 ? retentionBelowBenchmark * 50 : null;

    const coveragePillar: PillarStatus = {
      status: loading || total === 0 ? 'healthy' : coveredPct < 80 ? 'critical' : coveredPct < 100 ? 'warning' : 'healthy',
      metricValue: total > 0 ? `${coveredPct}%` : '—',
      metricLabel: 'Rules with supporting data',
      hasIssues: coveredPct < 100 && total > 0,
      statusColor: coveredPct < 80 ? 'danger' : coveredPct < 100 ? 'warning' : 'success',
      blastRadius: coverageBlastRadius,
    };
    const qualityPillar: PillarStatus = {
      status: loading ? 'healthy' : qualityIssues > 6 ? 'critical' : qualityIssues > 0 ? 'warning' : 'healthy',
      metricValue: qualityIssues,
      metricLabel: 'Indices with field issues',
      hasIssues: qualityIssues > 0,
      statusColor: qualityIssues > 6 ? 'danger' : qualityIssues > 0 ? 'warning' : 'success',
      blastRadius: qualityIssues > 0 ? qualityIssues : null,
    };
    const detectionIssueCount = ruleFieldIssues.length + executionIssueCount;
    const detectionsPillar: PillarStatus = {
      status: loading ? 'healthy' : ruleFieldIssues.length > 0 ? 'critical' : executionIssueCount > 0 ? 'warning' : 'healthy',
      metricValue: detectionIssueCount,
      metricLabel: 'Rules with detection issues',
      hasIssues: detectionIssueCount > 0,
      statusColor: ruleFieldIssues.length > 0 ? 'danger' : executionIssueCount > 0 ? 'warning' : 'success',
      blastRadius: detectionsBlastRadius,
    };
    const continuityMetric = getContinuityCardMetric(silentStreams, volumeDropCount, highLatencyCount);
    const continuityStatus: ReadinessStatus = loading ? 'healthy' : silentStreams > 0 || volumeDropCount > 0 || highLatencyCount > 0 ? 'warning' : 'healthy';
    const continuityPillar: PillarStatus = {
      status: continuityStatus,
      metricValue: continuityMetric.value,
      metricLabel: continuityMetric.label,
      hasIssues: continuityMetric.value > 0,
      statusColor: silentStreams > 0 || volumeDropCount > 0 || highLatencyCount > 0 ? 'warning' : 'success',
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
      : (coveragePillar.hasIssues || qualityPillar.hasIssues || detectionsPillar.hasIssues || retentionPillar.hasIssues) ? 'warning'
      : 'healthy';

    return {
      overall,
      enabledRules: total,
      silentStreams,
      volumeDropCount,
      highLatencyCount,
      categoriesMissingData,
      retentionBelowBenchmark,
      pillars: { coverage: coveragePillar, quality: qualityPillar, detections: detectionsPillar, continuity: continuityPillar, retention: retentionPillar },
    };
  }, [loading, coverage, qualityResults, pipelines, retentionItems, categories, ruleFieldIssues]);

  // Derived action items — used for badge count AND cross-tab "In Actions" checks
  const allActionItems = useMemo(
    () => deriveActionItems(coverage, integrations, ruleFieldIssues, pipelines, retentionItems, categories, qualityResults),
    [coverage, integrations, ruleFieldIssues, pipelines, retentionItems, categories, qualityResults]
  );
  const handleViewPillarFromAgent = (pillarId: string) => {
    if (pillarId === 'data-health' || pillarId === 'detection-health') {
      setSelectedTab(pillarId);
      if (pillarId === 'detection-health') setRuleSubTab('all');
      setTypeFilter(undefined);
      return;
    }
    const pillar = pillarId as VisibilityTabId;
    if (DATA_HEALTH_PILLARS.includes(pillar)) setSelectedTab('data-health');
    else if (DETECTION_HEALTH_PILLARS.includes(pillar)) {
      setSelectedTab('detection-health');
      if (pillar === 'coverage') setRuleSubTab('all');
    }
    setTypeFilter(undefined);
  };

  const dataHealthStatus = useMemo(
    () => worstReadinessStatus([
      summary.pillars.continuity.status,
      summary.pillars.retention.status,
      summary.pillars.quality.status,
    ]),
    [summary.pillars.continuity.status, summary.pillars.retention.status, summary.pillars.quality.status]
  );
  const detectionHealthStatus = useMemo(
    () => worstReadinessStatus([
      summary.pillars.coverage.status,
      summary.pillars.detections.status,
    ]),
    [summary.pillars.coverage.status, summary.pillars.detections.status]
  );

  const healthGroupCards = useMemo(() => {
    const countActions = (pillars: VisibilityTabId[]) =>
      allActionItems.filter((a) => pillars.includes(a.pillar)).length;
    const sumBlast = (pillars: VisibilityTabId[]) => {
      const values = pillars
        .map((p) => summary.pillars[p].blastRadius)
        .filter((value): value is number => value != null);
      return values.length ? values.reduce((total, value) => total + value, 0) : null;
    };
    const toSeverity = (status: ReadinessStatus): 'Critical' | 'Warning' =>
      status === 'critical' ? 'Critical' : 'Warning';
    const toNumColor = (status: ReadinessStatus) =>
      status === 'critical' ? '#BD271E' : status === 'warning' ? '#CA8500' : '#017D73';

    const coverageMissing = coverage?.missingIntegrations.length ?? 0;
    const qualityIssues = qualityResults.filter((r) => r.incompatibleFieldCount > 0).length;
    const executionIssueCount = EXECUTION_HEALTH_ROWS.filter((r) => r.status !== 'Succeeded').length;
    const integrationsMissingRules = INTEGRATION_RULES_GAP_ROWS.filter((row) => row.enabled < row.total).length;

    return {
      dataHealth: {
        id: 'data-health' as const,
        label: 'Visibility health',
        severity: toSeverity(dataHealthStatus),
        numColor: toNumColor(dataHealthStatus),
        metrics: [
          { value: summary.silentStreams, label: 'silent streams', pillar: 'continuity' as const },
          { value: summary.volumeDropCount, label: 'volume drops', pillar: 'continuity' as const },
          { value: summary.retentionBelowBenchmark, label: 'categories below benchmark', pillar: 'retention' as const },
          { value: qualityIssues, label: 'ECS issues', pillar: 'quality' as const },
        ],
        totalRulesAffected: sumBlast(DATA_HEALTH_PILLARS),
        scoreLabel: '80% Data trust score',
        actions: countActions(DATA_HEALTH_PILLARS),
      },
      detectionHealth: {
        id: 'detection-health' as const,
        label: 'Detection health',
        severity: toSeverity(detectionHealthStatus),
        numColor: toNumColor(detectionHealthStatus),
        metrics: [
          { value: integrationsMissingRules, label: 'integrations missing rules', pillar: 'coverage' as const, sectionLabel: 'Integrations missing rules' },
          { value: coverageMissing, label: 'required integrations', pillar: 'coverage' as const, sectionLabel: 'Enabled rule data coverage' },
          { value: ruleFieldIssues.length, label: 'rule field issues', pillar: 'detections' as const, sectionLabel: 'Rule field issues' },
          { value: executionIssueCount, label: 'execution failures', pillar: 'detections' as const, sectionLabel: 'Rule field issues' },
        ],
        totalRulesAffected: 76,
        scoreLabel: '73% Detection confidence score',
        actions: countActions(DETECTION_HEALTH_PILLARS),
      },
    };
  }, [
    allActionItems,
    coverage,
    dataHealthStatus,
    detectionHealthStatus,
    qualityResults,
    ruleFieldIssues.length,
    summary,
  ]);

  const siemAgentContext = useMemo((): SiemReadinessAgentContext => {
    const critical = allActionItems.filter((a) => a.severity === 'critical');
    const warning = allActionItems.filter((a) => a.severity === 'warning');
    const sortedActions = [...critical, ...warning];
    const toAgentSeverity = (status: ReadinessStatus): 'Critical' | 'Warning' | 'Healthy' => {
      if (status === 'critical') return 'Critical';
      if (status === 'warning') return 'Warning';
      return 'Healthy';
    };
    const formatMetricsSummary = (metrics: HealthMetric[]) =>
      metrics.map((metric) => `${metric.value} ${metric.label}`).join(' · ');

    return {
      criticalCount: critical.length,
      warningCount: warning.length,
      actions: sortedActions.map((action) => ({
        id: action.id,
        pillar: getHealthGroupLabelForPillar(action.pillar),
        severity: action.severity,
        title: action.title,
        rulesAffected: action.rulesAffected,
        timestamp: 'Apr 15 @ 14:22:07',
      })),
      pillars: [
        {
          id: 'data-health',
          label: 'Visibility health',
          severity: toAgentSeverity(dataHealthStatus),
          summary: formatMetricsSummary(healthGroupCards.dataHealth.metrics),
        },
        {
          id: 'detection-health',
          label: 'Detection health',
          severity: toAgentSeverity(detectionHealthStatus),
          summary: formatMetricsSummary(healthGroupCards.detectionHealth.metrics),
        },
      ],
    };
  }, [allActionItems, dataHealthStatus, detectionHealthStatus, healthGroupCards]);

  const actionItemIds = useMemo(() => new Set(allActionItems.map((a) => a.id)), [allActionItems]);

  return (
    <>
      <SecurityHeader
        onMenuClick={() => {}}
        onAgentClick={() => openAssistant()}
        viewOptions={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
        currentView={siemView}
        onViewChange={(v) => setSiemView(v as 'a' | 'b')}
      />
      <SecuritySideNav />

      {siemView === 'b' ? (
        /* ── Option B layout ─────────────────────────────────────── */
        <div style={{ marginTop: 48, marginLeft: 80, minHeight: 'calc(100vh - 48px)', background: '#F6F9FC', padding: '32px 24px 48px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* Page title + status */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <EuiTitle size="l"><h1 style={{ marginBottom: 8 }}>SIEM readiness</h1></EuiTitle>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <EuiAvatar name="warning" iconType="warning" color="#ffc9c2" size="s" />
                <EuiText size="s" style={{ color: '#111C2C' }}>
                  You have <strong>{allActionItems.filter(a => a.severity === 'critical').length}</strong> critical issues and{' '}
                  <strong>{allActionItems.filter(a => a.severity === 'warning').length}</strong> in warning state
                </EuiText>
              </div>
            </div>

            {/* Tab bar — filled segmented style */}
            <EuiButtonGroup
              legend="Health group"
              idSelected={selectedTab}
              options={[
                { id: 'data-health', label: 'Visibility health' },
                { id: 'detection-health', label: 'Detection health' },
              ]}
              onChange={(id) => { setSelectedTab(id as SiemTab); setTypeFilter(undefined); setSeverityFilter(undefined); }}
              isFullWidth
              buttonSize="m"
              color="primary"
              style={{ marginBottom: 24 }}
            />

            {/* Health metrics card */}
            {(() => {
              const card = selectedTab === 'data-health' ? healthGroupCards.dataHealth : healthGroupCards.detectionHealth;
              const healthStatus = selectedTab === 'data-health' ? dataHealthStatus : detectionHealthStatus;
              const isCritical = card.severity === 'Critical';
              return (
                <div style={{ background: 'white', border: '1px solid #E3E8F2', borderRadius: 6, padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EuiText style={{ fontSize: 16, fontWeight: 600 }}>{card.label}</EuiText>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: isCritical ? '#FDDDD8' : '#FDE9B5', color: isCritical ? '#A71627' : '#825803' }}>{card.severity}</span>
                    </div>
                    {card.totalRulesAffected != null && card.totalRulesAffected > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px', borderRadius: 20, border: '1px solid #CAD3E2', fontSize: 12, fontWeight: 500, color: '#1D2A3E' }}>
                        <EuiIcon type="crosshairs" size="s" />{card.totalRulesAffected} total rules affected
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {card.metrics.map(metric => {
                      const isActive = typeFilter === metric.pillar;
                      return (
                        <div key={metric.label} onClick={() => handleMetricClick(metric.pillar)} style={{ flex: 1, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', background: isActive ? '#E6F1FA' : 'transparent' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: card.numColor, lineHeight: '24px' }}>{metric.value}</div>
                          <EuiText size="s" style={{ color: isActive ? '#1750BA' : '#516381', fontWeight: isActive ? 600 : 400 }}>{metric.label}</EuiText>
                          <EuiText size="s" style={{ color: '#1d2a3e', fontWeight: 600 }}>{(metric as any).sectionLabel ?? CATEGORY_LABELS[metric.pillar]}</EuiText>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Actions section */}
            <div style={{ background: 'white', border: '1px solid #E3E8F2', borderRadius: 6, padding: '16px 20px', marginBottom: 24 }}>
              <EuiTitle size="s"><h2 style={{ marginBottom: 16 }}>Actions</h2></EuiTitle>
              {(() => {
                const allowedPillars = selectedTab === 'data-health' ? DATA_HEALTH_PILLARS : DETECTION_HEALTH_PILLARS;
                const tabActions = allActionItems
                  .filter(a => allowedPillars.includes(a.pillar))
                  .filter(a => !typeFilter || a.pillar === typeFilter)
                  .filter(a => !severityFilter || a.severity === severityFilter);
                const pageSize = 5;
                const [bPageIdx, setBPageIdx] = React.useState(0);
                const paged = tabActions.slice(bPageIdx * pageSize, (bPageIdx + 1) * pageSize);
                const PILLAR_COLORS: Record<string, { bg: string; color: string }> = {
                  coverage:    { bg: '#FFF3E0', color: '#A6570F' },
                  detections:  { bg: '#EEF2FF', color: '#3D4AB8' },
                  continuity:  { bg: '#E6F9F7', color: '#017D73' },
                  retention:   { bg: '#E8F5E9', color: '#017D73' },
                  quality:     { bg: '#EEF2FF', color: '#3D4AB8' },
                };
                return (
                  <>
                    {paged.length === 0 ? (
                      <EuiText size="s" color="subdued" style={{ textAlign: 'center', padding: 24 }}>No actions for this tab.</EuiText>
                    ) : (
                      <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, overflow: 'hidden' }}>
                        {paged.map((action: ActionItem, idx: number) => {
                          const colonIdx = action.title.indexOf(':');
                          const pc = PILLAR_COLORS[action.pillar] ?? { bg: '#F6F9FC', color: '#516381' };
                          return (
                            <div key={action.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'white', borderBottom: idx < paged.length - 1 ? '1px solid #E3E8F2' : 'none' }}>
                              <EuiIcon type="arrowRight" size="s" color="subdued" />
                              <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 7px', borderRadius: 10, background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {CATEGORY_LABELS[action.pillar].toUpperCase()}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: action.severity === 'critical' ? '#FDDDD8' : '#FFF3D0', color: action.severity === 'critical' ? '#A71627' : '#836500', flexShrink: 0 }}>
                                {action.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                              </span>
                              <EuiText size="s" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {colonIdx > -1 ? <><strong>{action.title.slice(0, colonIdx)}:</strong>{' '}{action.title.slice(colonIdx + 1).trim()}</> : <strong>{action.title}</strong>}
                              </EuiText>
                              <EuiText size="s" color="subdued" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Apr 15 @ 14:22:07</EuiText>
                              <EuiBadge color="hollow" iconType="crosshairs" style={{ flexShrink: 0 }}>{action.rulesAffected} rules affected</EuiBadge>
                              <div style={{ width: 1, height: 20, background: '#CAD3E2', flexShrink: 0 }} />
                              <EuiButtonEmpty size="xs" iconType="popout" iconSide="left" color="primary" style={{ flexShrink: 0 }}>Action here</EuiButtonEmpty>
                              <EuiButtonIcon size="xs" iconType="boxesVertical" color="primary" aria-label="More" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {tabActions.length > pageSize && (
                      <EuiTablePagination
                        pageCount={Math.ceil(tabActions.length / pageSize)}
                        activePage={bPageIdx}
                        onChangePage={setBPageIdx}
                        itemsPerPage={pageSize}
                        itemsPerPageOptions={[5, 10]}
                        onChangeItemsPerPage={() => {}}
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* Data section */}
            <div style={{ background: 'white', border: '1px solid #E3E8F2', borderRadius: 6, padding: '16px 20px' }}>
              <EuiTitle size="s"><h2 style={{ marginBottom: 20 }}>Data</h2></EuiTitle>
              {selectedTab === 'data-health' ? (
                <>
                  <DataCoveragePanel categories={filteredCategories} coverage={coverage} pillarStatus={summary.pillars.coverage.status} />
                  <EuiSpacer size="xl" />
                  <ContinuityTab categories={filteredCategories} pipelines={pipelines} loading={loading} actionItemIds={actionItemIds} onAskAI={handleAddToChat} />
                  <EuiSpacer size="xl" />
                  <QualityTab categories={filteredCategories} qualityResults={qualityResults} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.quality.status} />
                  <EuiSpacer size="xl" />
                  <RetentionTab categories={filteredCategories} retentionItems={retentionItems} loading={loading} actionItemIds={actionItemIds} />
                </>
              ) : (
                <>
                  <CoverageTab coverage={coverage} categories={filteredCategories} integrations={integrations} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.coverage.status} ruleSubTab={ruleSubTab} onRuleSubTabChange={setRuleSubTab} onAskAI={handleAddToChat} />
                  <EuiSpacer size="xl" />
                  <DetectionsTab ruleFieldIssues={ruleFieldIssues} loading={loading} pillarStatus={summary.pillars.detections.status} />
                </>
              )}
            </div>

          </div>
        </div>
      ) : (
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
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', minHeight: 'calc(100vh - 64px)' }}>

              <div style={{
                paddingTop: 32,
                paddingRight: PAGE_CONTENT_PADDING,
                paddingBottom: PAGE_CONTENT_PADDING,
                paddingLeft: PAGE_CONTENT_PADDING,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0,
              }}>
                {/* Page header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                  marginBottom: 24,
                  paddingTop: 8,
                  paddingBottom: 8,
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, margin: 0 }}>
                    <EuiTitle size="m">
                      <h1 style={{ fontSize: '2.025rem', margin: 0 }}>SIEM Readiness</h1>
                    </EuiTitle>
                    {(dataHealthStatus === 'critical' || detectionHealthStatus === 'critical') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 16, background: '#FFC9C2', color: '#BD271E', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        <EuiIcon type="warning" color="danger" size="s" />
                        Critical issues detected
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    flexShrink: 0,
                    marginLeft: 'auto',
                    paddingLeft: 24,
                  }}>
                    <AddToChatButton onClick={() => handleAddToChat(SIEM_READINESS_SUMMARY_PROMPT)} />
                    <EuiButtonEmpty
                      size="s"
                      iconType="gear"
                      color="text"
                      style={HEADER_ACTION_BUTTON_STYLE}
                      onClick={openConfig}
                    >
                      Configurations
                    </EuiButtonEmpty>
                  </div>
                </div>

                {/* ── Health tabs ── */}
                <EuiTabs data-test-subj="siemReadiness-tabs">
                  <EuiTab
                    isSelected={selectedTab === 'data-health'}
                    onClick={() => { setSelectedTab('data-health'); setTypeFilter(undefined); setSeverityFilter(undefined); }}
                    data-test-subj="siemReadiness-tab-data-health"
                  >
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>Visibility health</EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiNotificationBadge size="s" color="accent">
                          {allActionItems.filter(a => DATA_HEALTH_PILLARS.includes(a.pillar)).length}
                        </EuiNotificationBadge>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiTab>
                  <EuiTab
                    isSelected={selectedTab === 'detection-health'}
                    onClick={() => { setSelectedTab('detection-health'); setTypeFilter(undefined); setSeverityFilter(undefined); }}
                    data-test-subj="siemReadiness-tab-detection-health"
                  >
                    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                      <EuiFlexItem grow={false}>Detection health</EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiNotificationBadge size="s" color="accent">
                          {allActionItems.filter(a => DETECTION_HEALTH_PILLARS.includes(a.pillar)).length}
                        </EuiNotificationBadge>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiTab>
                </EuiTabs>

                <EuiSpacer size="m" />

                {/* ── Visibility health tab ── */}
                {selectedTab === 'data-health' && (
                  <>
                    {/* Metrics card */}
                    <ExpandableHealthCard
                      id="data-health"
                      label="Visibility health"
                      severity={healthGroupCards.dataHealth.severity}
                      numColor={healthGroupCards.dataHealth.numColor}
                      metrics={healthGroupCards.dataHealth.metrics}
                      totalRulesAffected={healthGroupCards.dataHealth.totalRulesAffected}
                      activeTypeFilter={typeFilter}
                      onMetricClick={handleMetricClick}
                      healthStatus={dataHealthStatus}
                    >
                      {null}
                    </ExpandableHealthCard>
                    <EuiSpacer size="m" />
                    {/* Actions */}
                    <div ref={actionsPanelRef}>
                      <ActionsRequiredPanel
                        coverage={coverage}
                        integrations={integrations}
                        ruleFieldIssues={ruleFieldIssues}
                        pipelines={pipelines}
                        retentionItems={retentionItems}
                        categories={filteredCategories}
                        qualityResults={qualityResults}
                        summary={summary}
                        allowedPillars={DATA_HEALTH_PILLARS}
                        typeFilter={typeFilter}
                        severityFilter={severityFilter}
                        onTypeFilterChange={setTypeFilter}
                        onSeverityFilterChange={setSeverityFilter}
                        onAddToChat={handleAddToChat}
                      />
                    </div>
                    <EuiSpacer size="xl" />
                    {/* Data sections */}
                    <DataCoveragePanel categories={filteredCategories} coverage={coverage} pillarStatus={summary.pillars.coverage.status} />
                    <EuiSpacer size="xl" />
                    <ContinuityTab categories={filteredCategories} pipelines={pipelines} loading={loading} actionItemIds={actionItemIds} onAskAI={handleAddToChat} />
                    <EuiSpacer size="xl" />
                    <QualityTab categories={filteredCategories} qualityResults={qualityResults} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.quality.status} />
                    <EuiSpacer size="xl" />
                    <RetentionTab categories={filteredCategories} retentionItems={retentionItems} loading={loading} actionItemIds={actionItemIds} />
                  </>
                )}

                {/* ── Detection health tab ── */}
                {selectedTab === 'detection-health' && (
                  <>
                    {/* Metrics card */}
                    <ExpandableHealthCard
                      id="detection-health"
                      label="Detection health"
                      severity={healthGroupCards.detectionHealth.severity}
                      numColor={healthGroupCards.detectionHealth.numColor}
                      metrics={healthGroupCards.detectionHealth.metrics}
                      totalRulesAffected={healthGroupCards.detectionHealth.totalRulesAffected}
                      activeTypeFilter={typeFilter}
                      onMetricClick={handleMetricClick}
                      healthStatus={detectionHealthStatus}
                    >
                      {null}
                    </ExpandableHealthCard>
                    <EuiSpacer size="m" />
                    {/* Actions */}
                    <ActionsRequiredPanel
                      coverage={coverage}
                      integrations={integrations}
                      ruleFieldIssues={ruleFieldIssues}
                      pipelines={pipelines}
                      retentionItems={retentionItems}
                      categories={filteredCategories}
                      qualityResults={qualityResults}
                      summary={summary}
                      allowedPillars={DETECTION_HEALTH_PILLARS}
                      typeFilter={typeFilter}
                      severityFilter={severityFilter}
                      onTypeFilterChange={setTypeFilter}
                      onSeverityFilterChange={setSeverityFilter}
                      onAddToChat={handleAddToChat}
                    />
                    <EuiSpacer size="xl" />
                    {/* Data sections */}
                    <CoverageTab coverage={coverage} categories={filteredCategories} integrations={integrations} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.coverage.status} ruleSubTab={ruleSubTab} onRuleSubTabChange={setRuleSubTab} onAskAI={handleAddToChat} />
                    <EuiSpacer size="xl" />
                    <DetectionsTab ruleFieldIssues={ruleFieldIssues} loading={loading} pillarStatus={summary.pillars.detections.status} />
                  </>
                )}

              </div>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>
      )}

      {/* ── Configuration modal ── */}
      {configOpen && (
        <EuiOverlayMask>
          <EuiModal onClose={() => setConfigOpen(false)} style={{ minWidth: 600, maxHeight: '85vh' }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Configuration</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody style={{ overflowY: 'auto' }}>

              {/* ── Section 1: Category applicability ── */}
              <EuiTitle size="xs"><h4>Category applicability</h4></EuiTitle>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">Select which data source categories apply to your environment.</EuiText>
              <EuiSpacer size="m" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
                {ALL_CATEGORY_NAMES.map((cat) => (
                  <EuiCheckbox
                    key={cat}
                    id={`config-cat-${cat}`}
                    label={cat}
                    checked={tempCategories.has(cat)}
                    onChange={() => toggleTemp(cat)}
                  />
                ))}
              </div>

              <EuiHorizontalRule margin="l" />

              {/* ── Section 2: Platform configuration ── */}
              <EuiTitle size="xs"><h4>Platform configuration</h4></EuiTitle>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">
                Review auto-discovered platforms and confirm which apply to your environment.
              </EuiText>
              <EuiSpacer size="m" />

              {/* Auto-discovered rows */}
              {tempPlatforms.filter(p => p.derivedFrom !== 'Added manually').map((p, idx) => (
                <React.Fragment key={p.id}>
                  {idx > 0 && <EuiSpacer size="s" />}
                  <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>

                    {/* LEFT: switch */}
                    <EuiFlexItem grow={false}>
                      <EuiSwitch
                        label=""
                        showLabel={false}
                        checked={p.enabled}
                        onChange={() => updateTempPlatform(p.id, { enabled: !p.enabled })}
                        aria-label={`Include ${p.name} in readiness reporting`} style={{ transform: "scale(0.8)", transformOrigin: "left center" }}
                      />
                    </EuiFlexItem>

                    {/* MIDDLE: name + source stacked */}
                    <EuiFlexItem>
                      <EuiFlexGroup direction="column" gutterSize="none" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" style={{ fontWeight: 500 }}>{p.name}</EuiText>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="xs" color="subdued">{p.derivedFrom}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                  </EuiFlexGroup>
                </React.Fragment>
              ))}

              {/* Manually added rows (if any) */}
              {tempPlatforms.some(p => p.derivedFrom === 'Added manually') && (
                <>
                  <EuiHorizontalRule margin="m" />
                  <EuiText size="xs" color="subdued" style={{ marginBottom: 8 }}>Manually added</EuiText>
                  {tempPlatforms.filter(p => p.derivedFrom === 'Added manually').map((p, idx) => (
                    <React.Fragment key={p.id}>
                      {idx > 0 && <EuiSpacer size="s" />}
                      <EuiPanel paddingSize="s" hasBorder>
                        <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiSwitch
                              label="" showLabel={false}
                              checked={p.enabled}
                              onChange={() => updateTempPlatform(p.id, { enabled: !p.enabled })}
                              aria-label={`Include ${p.name} in readiness reporting`} style={{ transform: "scale(0.8)", transformOrigin: "left center" }}
                            />
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiFlexGroup direction="column" gutterSize="none" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiText size="s" style={{ fontWeight: 500 }}>{p.name || 'Unnamed platform'}</EuiText>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiText size="xs" color="subdued">Added manually</EuiText>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiSelect
                              compressed value={p.category}
                              options={ALL_CATEGORY_NAMES.map(c => ({ value: c, text: c }))}
                              onChange={(e) => updateTempPlatform(p.id, { category: e.target.value })}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiPanel>
                    </React.Fragment>
                  ))}
                </>
              )}

              <EuiHorizontalRule margin="l" />

              {/* ── Section 3: Retention configuration ── */}
              <EuiTitle size="xs"><h4>Retention configuration</h4></EuiTitle>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">
                Set custom retention targets per category. When custom retention is off, the default policy applies.
              </EuiText>
              <EuiSpacer size="m" />

              {ALL_CATEGORY_NAMES.map((cat, idx) => {
                const config = tempRetentionConfig[cat];
                return (
                  <React.Fragment key={cat}>
                    {idx > 0 && <EuiSpacer size="m" />}
                    <EuiFlexGroup alignItems="flexEnd" gutterSize="l" responsive={false}>
                      <EuiFlexItem grow={false} style={{ minWidth: 150, paddingBottom: 10 }}>
                        <EuiText size="s" style={{ fontWeight: 600 }}>{cat}:</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ minWidth: 130 }}>
                        <EuiFlexGroup direction="column" gutterSize="xs" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" style={{ fontWeight: 500 }}>Custom retention</EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiSwitch
                              label=""
                              showLabel={false}
                              checked={config.customRetention}
                              onChange={() => updateTempRetention(cat, { customRetention: !config.customRetention })}
                              aria-label={`Enable custom retention for ${cat}`}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ minWidth: 120 }}>
                        <EuiFlexGroup direction="column" gutterSize="xs" responsive={false}>
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs" style={{ fontWeight: 500 }}>Amount of days</EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiFieldText
                              compressed
                              type="number"
                              min={1}
                              placeholder="30"
                              value={config.days > 0 ? String(config.days) : ''}
                              disabled={!config.customRetention}
                              onChange={(e) => {
                                const days = parseInt(e.target.value, 10);
                                updateTempRetention(cat, { days: Number.isFinite(days) && days > 0 ? days : 30 });
                              }}
                              aria-label={`Retention days for ${cat}`}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </React.Fragment>
                );
              })}

              <EuiHorizontalRule margin="l" />
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={() => setConfigOpen(false)}>Cancel</EuiButtonEmpty>
              <EuiButton fill onClick={saveConfig}>Save</EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      )}

      <AssistantFlyout
        key={assistantSession}
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        initialMessage={assistantPrompt}
        autoSubmit={Boolean(assistantPrompt)}
        siemContext={siemAgentContext}
        onViewPillarData={handleViewPillarFromAgent}
      />
    </>
  );
};

export default SiemReadinessPage;
