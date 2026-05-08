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
import SecurityHeader from '../detection-rules/v1.0/components/SecurityHeader';
import SecuritySideNav from '../detection-rules/v1.0/components/SecuritySideNav';

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

function useSiemReadinessData(): SiemReadinessData {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<RuleIntegrationCoverage | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [integrations, setIntegrations] = useState<SiemReadinessPackageInfo[]>([]);
  const [qualityResults, setQualityResults] = useState<QualityResult[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStats[]>([]);
  const [retentionItems, setRetentionItems] = useState<RetentionItem[]>([]);
  const [ruleFieldIssues, setRuleFieldIssues] = useState<RuleFieldIssue[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/siem_readiness/get_categories').then((r) => r.json() as Promise<CategoriesResponse>),
      fetch('/api/fleet/epm/packages').then((r) => r.json() as Promise<{ items: SiemReadinessPackageInfo[] }>),
      fetch('/api/detection_engine/rules/_find').then((r) => r.json() as Promise<{ data: RelatedIntegrationRuleResponse[] }>),
      fetch('/api/ecs_data_quality_dashboard/results_latest/*').then((r) => r.json() as Promise<QualityResult[]>),
      fetch('/api/siem_readiness/get_pipelines').then((r) => r.json() as Promise<PipelineStats[]>),
      fetch('/api/siem_readiness/get_retention').then((r) => r.json() as Promise<{ items: RetentionItem[] }>),
      fetch('/api/siem_readiness/get_rule_field_issues').then((r) => r.json() as Promise<RuleFieldIssue[]>),
    ])
      .then(([cats, pkgs, rules, quality, pipes, retention, fieldIssues]) => {
        setCategories(cats.mainCategoriesMap);
        setIntegrations(pkgs.items);
        setCoverage(computeCoverage(rules.data, pkgs.items));
        setQualityResults(quality);
        setPipelines(pipes);
        setRetentionItems(retention.items);
        setRuleFieldIssues(fieldIssues);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, coverage, categories, integrations, qualityResults, pipelines, retentionItems, ruleFieldIssues };
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
  const pillarStatuses = {
    coverage:   summary.pillars.coverage.status,
    quality:    summary.pillars.quality.status,
    continuity: summary.pillars.continuity.status,
    retention:  summary.pillars.retention.status,
  };

  const criticalCount = Object.values(pillarStatuses).filter(s => s === 'critical').length;
  const warningCount  = Object.values(pillarStatuses).filter(s => s === 'warning').length;
  const totalIssues   = criticalCount + warningCount;

  const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';
  const titleColor    = overallStatus === 'critical' ? '#BD271E' : overallStatus === 'warning' ? '#CA8500' : '#017D73';
  const iconType      = overallStatus === 'critical' ? 'alert' : overallStatus === 'warning' ? 'warning' : 'checkInCircleFilled';
  const iconColor     = overallStatus === 'critical' ? 'danger' as const : overallStatus === 'warning' ? 'warning' as const : 'success' as const;
  const headline      = overallStatus === 'critical' ? 'Critical issues detected' : overallStatus === 'warning' ? 'Warnings detected' : 'All systems healthy';
  const actionsCount  = criticalCount * 2 + warningCount;

  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="m" style={{ background: '#F6F9FC' }} data-test-subj="siemReadiness-statusBanner">
      <EuiText size="s" style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Overall status</EuiText>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <EuiIcon type={iconType} size="l" color={iconColor} />
        <span style={{ color: titleColor, fontSize: 20, lineHeight: '24px', fontWeight: 700 }}>
          {headline}
        </span>
      </div>
      {totalIssues > 0 ? (
        <EuiText size="s" color="subdued">
          {'your SIEM readiness has '}
          {criticalCount > 0 && <EuiBadge color="danger">{criticalCount} Critical</EuiBadge>}
          {criticalCount > 0 && warningCount > 0 && ' and '}
          {warningCount > 0 && <EuiBadge color="warning">{warningCount} Warning</EuiBadge>}
          {` severity impacted issues. This has created ${actionsCount} actions to resolve.`}
        </EuiText>
      ) : (
        <EuiText size="s" color="subdued">No issues detected across all pillars.</EuiText>
      )}
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
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiText size="s">
              <strong>{actions.length}</strong>{' '}
              <span style={{ color: '#69707D' }}>Sorted by Severity - rules affected</span>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="documents"
              iconSide="left"
              onClick={handleSelectAll}
              data-test-subj="siemReadiness-selectAll"
            >
              Select all {actions.length} actions
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
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
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiFilterGroup>
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
            const pillarLabel = { coverage: 'Coverage', quality: 'Quality', continuity: 'Continuity', retention: 'Retention' }[action.pillar];
            return (
              <EuiFlexItem key={action.id}>
                <EuiPanel hasBorder hasShadow={false} paddingSize="m" data-test-subj={`siemReadiness-actionItem-${action.id}`}>
                  <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m" responsive={false}>

                    {/* Checkbox (3a) */}
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

                    {/* Left: pillar label → severity + title → description → badges */}
                    <EuiFlexItem>
                      {/* Pillar label */}
                      <EuiText size="xs">
                        <strong style={{ color: '#69707D', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
                          {pillarLabel}
                        </strong>
                      </EuiText>
                      <EuiSpacer size="xs" />

                      {/* Severity badge + action title inline */}
                      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color={action.severity === 'critical' ? 'danger' : 'warning'}>
                            {action.severity === 'critical' ? 'Critical' : 'Warning'}
                          </EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="s"><strong>{action.title}</strong></EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiSpacer size="xs" />

                      {/* Issue + Action */}
                      <EuiText size="xs" color="subdued">
                        <strong>Issue</strong>&nbsp;{action.description}
                      </EuiText>
                      <EuiSpacer size="xs" />
                      <EuiText size="xs" color="subdued">
                        <strong>Action</strong>&nbsp;{action.fixRecommendation}
                      </EuiText>
                      <EuiSpacer size="s" />

                      {/* Badges — all hollow except the severity badge above */}
                      <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow">
                            {action.rulesAffected} rule{action.rulesAffected !== 1 ? 's' : ''} affected
                          </EuiBadge>
                        </EuiFlexItem>
                        {action.platforms.map((p) => (
                          <EuiFlexItem key={p} grow={false}>
                            <EuiBadge color="hollow">{p}</EuiBadge>
                          </EuiFlexItem>
                        ))}
                        {action.mitreTactics.map((t) => (
                          <EuiFlexItem key={t} grow={false}>
                            <EuiBadge color="hollow">{t}</EuiBadge>
                          </EuiFlexItem>
                        ))}
                      </EuiFlexGroup>
                    </EuiFlexItem>

                    {/* Right: three action buttons */}
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <AddToChatButton />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonEmpty size="s" iconType="folderClosed" iconSide="left" color="primary">
                            Create case
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonEmpty size="s" iconType="wrench" iconSide="left" color="primary" href="#">
                            Action to fix here
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                  </EuiFlexGroup>
                </EuiPanel>
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
}

const CATEGORY_INTEGRATIONS: Record<string, string[]> = {
  'Endpoint':         ['endpoint', 'elastic_agent', 'windows'],
  'Identity':         ['okta', 'azure_ad'],
  'Network':          ['network_traffic', 'zeek'],
  'Cloud':            ['aws', 'azure', 'gcp'],
  'Application/SaaS': ['google_workspace', 'salesforce'],
};

const CoverageTab: React.FC<CoverageTabProps> = ({ coverage, categories, integrations, loading, actionItemIds, pillarStatus }) => {
  const calloutColor = pillarStatus === 'critical' ? 'danger' as const : 'warning' as const;
  const [ruleSubTab, setRuleSubTab] = useState<'all' | 'mitre'>('all');
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);

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
        <EuiCallOut color={calloutColor} size="s">
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}><EuiIcon type="warning" color={calloutColor} size="m" /></EuiFlexItem>
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
        <EuiCallOut color={calloutColor} size="s" title={`Integrations required for some enabled rules.`}>
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

      <EuiCallOut color={calloutColor} size="s" title="Some log categories are missing required integrations.">
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
            name: 'Rules blind',
            width: '130px',
            render: (row: typeof dataCategoryRows[0]) =>
              row.statusLabel === 'Missing data'
                ? <EuiText size="s" style={{ color: '#BD271E', fontWeight: 600 }} data-test-subj={`siemReadiness-rulesBlind-${row.id}`}>{row.rulesCount}</EuiText>
                : <EuiText size="s" color="subdued">—</EuiText>,
          },
          {
            name: 'Action',
            width: '100px',
            render: (row: typeof dataCategoryRows[0]) => (
              <EuiButtonEmpty size="xs" color="primary" data-test-subj={`siemReadiness-installIntegration-${row.id}`}>
                Install
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

interface QualityTabProps { categories: CategoryGroup[]; qualityResults: QualityResult[]; ruleFieldIssues: RuleFieldIssue[]; loading: boolean; actionItemIds: Set<string>; pillarStatus: ReadinessStatus }

const QualityTab: React.FC<QualityTabProps> = ({ categories, qualityResults, ruleFieldIssues, loading, actionItemIds, pillarStatus }) => {
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
      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}
      {totalIncompatible > 0 && (
        <>
          <EuiCallOut color={calloutColor} size="s" title="Some indices have ECS compatibility issues.">
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
              color={calloutColor}
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
                  name: 'Rules affected',
                  width: '110px',
                  render: (row: RuleFieldIssue) => (
                    <EuiButtonEmpty size="xs" flush="left" onClick={() => setFlyout({ findingName: row.ruleName, rules: [{ name: row.ruleName, tactics: getTacticsFromIndex(row.indexPattern), status: actionItemIds.has(`quality-${row.id}`) ? 'in-actions' : 'no-action' }] })} data-test-subj={`siemReadiness-qualityFieldRulesAffected-${row.id}`}>
                      1
                    </EuiButtonEmpty>
                  ),
                },
                {
                  name: 'Action',
                  width: '130px',
                  render: (row: RuleFieldIssue) =>
                    actionItemIds.has(`quality-${row.id}`)
                      ? <EuiBadge color="warning" data-test-subj={`siemReadiness-qualityInActions-${row.id}`}>In Actions</EuiBadge>
                      : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/security/rules" data-test-subj={`siemReadiness-qualityViewRule-${row.id}`}>View rule</EuiButtonEmpty>,
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

interface ContinuityTabProps { categories: CategoryGroup[]; pipelines: PipelineStats[]; loading: boolean; actionItemIds: Set<string> }

const LATENCY_SLA_MINUTES = 5; // realtime SLA threshold

const ContinuityTab: React.FC<ContinuityTabProps> = ({ pipelines, loading, actionItemIds }) => {
  const [flyout, setFlyout] = useState<{ findingName: string; rules: FlyoutRule[] } | null>(null);

  const findings: ContinuityFinding[] = useMemo(() => {
    const result: ContinuityFinding[] = [];
    pipelines.forEach((p) => {
      if (p.docsCount === 0) {
        result.push({ id: p.name + '-silent', dataset: p.indices[0] ?? p.name, issue: 'silent', detail: 'No data received in the last 24h', rulesAffected: 3 });
      } else if (p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1) {
        const rate = ((p.failedDocsCount / p.docsCount) * 100).toFixed(1);
        result.push({ id: p.name + '-drop', dataset: p.indices[0] ?? p.name, issue: 'volume_drop', detail: `Failure rate ${rate}% — ${p.failedDocsCount.toLocaleString()} docs failed`, rulesAffected: 12 });
      }
      // Change 4: wire latency from server data
      if (p.latencyMinutes != null && p.latencyMinutes > LATENCY_SLA_MINUTES) {
        result.push({ id: p.name + '-latency', dataset: p.indices[0] ?? p.name, issue: 'high_latency', detail: p.latencyMinutes != null ? `P95: ${p.latencyMinutes} min (SLA: ${LATENCY_SLA_MINUTES} min)` : 'Latency data unavailable', rulesAffected: 2 });
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

      {flyout && <RulesAffectedFlyout findingName={flyout.findingName} rules={flyout.rules} onClose={() => setFlyout(null)} />}
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
            {
              field: 'rulesAffected', name: 'Rules affected', width: '110px',
              render: (count: number, row: ContinuityFinding) => (
                <EuiButtonEmpty size="xs" flush="left" onClick={() => setFlyout({ findingName: row.dataset, rules: Array.from({ length: count }, (_, i) => ({ name: `Rule querying ${row.dataset} (${i + 1})`, tactics: [], status: actionItemIds.has(`continuity-${row.id.split('-').slice(0, -1).join('-')}`) ? 'in-actions' : 'no-action' } as FlyoutRule)) })} data-test-subj={`siemReadiness-continuityRulesAffected-${row.id}`}>
                  {count}
                </EuiButtonEmpty>
              ),
            },
            {
              name: 'Tactics',
              render: (row: ContinuityFinding) => <TacticsCell tactics={getTacticsFromIndex(row.dataset)} />,
            },
            {
              name: 'Platform', width: '110px',
              render: (row: ContinuityFinding) => <EuiBadge color="hollow">{getPlatformFromIndex(row.dataset)}</EuiBadge>,
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

interface RetentionTabProps { categories: CategoryGroup[]; retentionItems: RetentionItem[]; loading: boolean; actionItemIds: Set<string> }

// Change 5: compliance citations per category
const RETENTION_COMPLIANCE: Record<string, string> = {
  'Network':          'NIST 800-53 AU-11, ISO 27001',
  'Endpoint':         'NIST 800-53 AU-11, SOC2',
  'Identity':         'FedRAMP, SOC2',
  'Cloud':            'FedRAMP, SOC2',
  'Application/SaaS': 'SOC2, ISO 27001',
};

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
            {
              field: 'benchmarkDays', name: 'Benchmark',
              render: (days: number, row: RetentionFinding) => (
                <EuiToolTip content={RETENTION_COMPLIANCE[row.category] ?? ''} data-test-subj={`siemReadiness-retentionBenchmarkTooltip-${row.id}`}>
                  <EuiText size="s" color="subdued" style={{ cursor: 'help', borderBottom: '1px dashed #98A2B3' }}>{days} days</EuiText>
                </EuiToolTip>
              ),
            },
            { field: 'status', name: 'Status',
              render: (status: string) => (
                <EuiBadge color={status === 'below' ? 'warning' : 'success'}>
                  {status === 'below' ? 'Below benchmark' : 'Meets benchmark'}
                </EuiBadge>
              ),
            },
            {
              name: 'Rules affected', width: '110px',
              render: () => <EuiText size="s" color="subdued">—</EuiText>,
            },
            {
              name: 'Tactics',
              render: (row: RetentionFinding) => <TacticsCell tactics={getTacticsFromCategory(row.category)} />,
            },
            {
              name: 'Platform', width: '110px',
              render: (row: RetentionFinding) => <EuiBadge color="hollow">{row.category}</EuiBadge>,
            },
            {
              name: 'Action', width: '140px',
              render: (row: RetentionFinding) =>
                actionItemIds.has('retention-benchmark')
                  ? <EuiBadge color="warning" data-test-subj={`siemReadiness-retentionInActions-${row.id}`}>In Actions</EuiBadge>
                  : <EuiButtonEmpty size="s" iconType="popout" iconSide="right" href="/app/management/data/index_lifecycle_management" data-test-subj={`siemReadiness-retentionManage-${row.id}`}>Manage policy</EuiButtonEmpty>,
            },
          ] as Array<EuiBasicTableColumn<RetentionFinding>>}
          itemId="id"
        />
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

                {/* Banner */}
                <StatusHero summary={summary} />
                <EuiSpacer size="m" />

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
                {selectedTab === 'coverage'   && <CoverageTab   coverage={coverage} categories={categories} integrations={integrations} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.coverage.status} />}
                {selectedTab === 'quality'    && <QualityTab    categories={categories} qualityResults={qualityResults} ruleFieldIssues={ruleFieldIssues} loading={loading} actionItemIds={actionItemIds} pillarStatus={summary.pillars.quality.status} />}
                {selectedTab === 'continuity' && <ContinuityTab categories={categories} pipelines={pipelines} loading={loading} actionItemIds={actionItemIds} />}
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
