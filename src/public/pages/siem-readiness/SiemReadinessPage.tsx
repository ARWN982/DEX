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
  EuiToolTip,
  EuiCallOut,
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
  EuiTabbedContent,
  EuiText,
  EuiTitle,
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
interface PipelineStats { name: string; indices: string[]; docsCount: number; failedDocsCount: number; statsAvailable: boolean }
interface RetentionItem { indexName: string; isDataStream: boolean; retentionType: 'ilm' | 'dsl' | null; retentionPeriod: string | null; retentionDays: number | null; policyName: string | null; status: 'healthy' | 'non-compliant' }

interface SiemReadinessData {
  loading: boolean;
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
  qualityResults: QualityResult[];
  pipelines: PipelineStats[];
  retentionItems: RetentionItem[];
}

function useSiemReadinessData(): SiemReadinessData {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<RuleIntegrationCoverage | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [integrations, setIntegrations] = useState<SiemReadinessPackageInfo[]>([]);
  const [qualityResults, setQualityResults] = useState<QualityResult[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStats[]>([]);
  const [retentionItems, setRetentionItems] = useState<RetentionItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/siem_readiness/get_categories').then((r) => r.json() as Promise<CategoriesResponse>),
      fetch('/api/fleet/epm/packages').then((r) => r.json() as Promise<{ items: SiemReadinessPackageInfo[] }>),
      fetch('/api/detection_engine/rules/_find').then((r) => r.json() as Promise<{ data: RelatedIntegrationRuleResponse[] }>),
      fetch('/api/ecs_data_quality_dashboard/results_latest/*').then((r) => r.json() as Promise<QualityResult[]>),
      fetch('/api/siem_readiness/get_pipelines').then((r) => r.json() as Promise<PipelineStats[]>),
      fetch('/api/siem_readiness/get_retention').then((r) => r.json() as Promise<{ items: RetentionItem[] }>),
    ])
      .then(([cats, pkgs, rules, quality, pipes, retention]) => {
        setCategories(cats.mainCategoriesMap);
        setIntegrations(pkgs.items);
        setCoverage(computeCoverage(rules.data, pkgs.items));
        setQualityResults(quality);
        setPipelines(pipes);
        setRetentionItems(retention.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, coverage, categories, integrations, qualityResults, pipelines, retentionItems };
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

// ─── Visibility status badge ──────────────────────────────────────────────────

const STATUS_BADGE: Record<VisibilityStatus, { label: string; color: string; iconType: string }> = {
  healthy:         { label: 'Healthy',          color: 'success', iconType: 'check'      },
  actionsRequired: { label: 'Actions required', color: 'warning', iconType: 'warning'    },
  noData:          { label: 'No data',          color: 'default', iconType: 'plugs'      },
};

// ─── Visibility section boxes (summary cards) ─────────────────────────────────

interface VisibilityBox {
  id: VisibilityTabId;
  title: string;
  status: VisibilityStatus;
  icon: string;
  statusDescriptions: Record<VisibilityStatus, string>;
}

interface VisibilitySectionBoxesProps {
  selectedTabId: VisibilityTabId;
  onTabSelect: (id: VisibilityTabId) => void;
  coverageStatus: VisibilityStatus;
  qualityStatus: VisibilityStatus;
  continuityStatus: VisibilityStatus;
  retentionStatus: VisibilityStatus;
}

const VisibilitySectionBoxes: React.FC<VisibilitySectionBoxesProps> = ({
  selectedTabId,
  onTabSelect,
  coverageStatus,
  qualityStatus,
  continuityStatus,
  retentionStatus,
}) => {
  const { euiTheme } = useEuiTheme();

  const boxes: VisibilityBox[] = [
    {
      id: 'coverage',
      title: 'Coverage',
      status: coverageStatus,
      icon: '/images/siem-coverage.png',
      statusDescriptions: {
        healthy:         'All enabled rules have required integrations.',
        actionsRequired: 'Integrations required for some enabled rules.',
        noData:          'You have not installed and enabled any rules yet.',
      },
    },
    {
      id: 'quality',
      title: 'Quality',
      status: qualityStatus,
      icon: '/images/siem-quality.png',
      statusDescriptions: {
        healthy:         'ECS Compatibility is healthy.',
        actionsRequired: 'ECS Incompatibility Detected.',
        noData:          'No data to check yet.',
      },
    },
    {
      id: 'continuity',
      title: 'Continuity',
      status: continuityStatus,
      icon: '/images/siem-continuity.png',
      statusDescriptions: {
        healthy:         'Ingest pipeline is healthy.',
        actionsRequired: 'Ingest pipeline failures occurred.',
        noData:          'No data currently being ingested.',
      },
    },
    {
      id: 'retention',
      title: 'Retention',
      status: retentionStatus,
      icon: '/images/siem-retention.png',
      statusDescriptions: {
        healthy:         'All Lifecycle Policies meet requirements.',
        actionsRequired: 'Some Lifecycle Policies need increasing.',
        noData:          'No data in Lifecycle management.',
      },
    },
  ];

  return (
    <EuiFlexGroup gutterSize="m" responsive={false}>
      {boxes.map((box) => {
        const isSelected = selectedTabId === box.id;
        const badge = STATUS_BADGE[box.status];
        const description = box.statusDescriptions[box.status];

        return (
          <EuiFlexItem key={box.id}>
            <EuiPanel
              hasBorder
              paddingSize="m"
              onClick={() => onTabSelect(box.id)}
              style={{
                cursor: 'pointer',
                background: isSelected ? euiTheme.colors.highlight : euiTheme.colors.emptyShade,
                outline: isSelected ? `2px solid ${euiTheme.colors.primary}` : 'none',
                outlineOffset: -1,
                transition: 'background 0.15s ease',
                minHeight: 130,
              }}
            >
              <EuiFlexGroup direction="column" gutterSize="s" style={{ height: '100%' }}>
                {/* Row 1: title + badge */}
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup alignItems="flexStart" justifyContent="spaceBetween" responsive={false} gutterSize="s">
                    <EuiFlexItem>
                      <EuiTitle size="xs">
                        <h3 style={{ color: euiTheme.colors.primary }}>{box.title}</h3>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge
                        color={badge.color}
                        iconType={badge.iconType}
                        style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: 10 }}
                      >
                        {badge.label}
                      </EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                {/* Row 2: description + illustration */}
                <EuiFlexItem>
                  <EuiFlexGroup alignItems="flexEnd" justifyContent="spaceBetween" responsive={false} gutterSize="s">
                    <EuiFlexItem>
                      <EuiText size="s" color="subdued">
                        <p style={{ fontSize: 12, lineHeight: 1.4, margin: 0 }}>{description}</p>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <img
                        src={box.icon}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', flexShrink: 0 }}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
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
        extraAction={renderBadge(items)}
        paddingSize="none"
        borders="none"
        forceState={isOpen ? 'open' : 'closed'}
        onToggle={() => setIsOpen((v) => !v)}
      >
        {isOpen && (
          <>
            <EuiSpacer size="s" />
            <EuiInMemoryTable
              items={items}
              columns={columns}
              pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
              sorting={false}
              tableLayout="auto"
            />
          </>
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
  const dataCategoryRows = useMemo(() => {
    // Stable seed per category name so the count doesn't change on re-render
    const seededCount = (name: string) => {
      const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return 17 + (seed % 8); // always 17–24
    };
    return categories.map((cat) => {
      const catPkgs = CATEGORY_INTEGRATIONS[cat.category] ?? [];
      const hasMissing = catPkgs.some((pkg) => missingSet.has(pkg));
      const totalDocs = cat.indices.reduce((sum, idx) => sum + idx.docs, 0);
      const statusLabel = hasMissing ? 'Missing data' : totalDocs > 0 ? 'Good' : 'No data';
      const statusColor = hasMissing ? 'warning' : totalDocs > 0 ? 'success' : 'default';
      const integrationCount = seededCount(cat.category);
      return { id: cat.category, category: cat.category, statusLabel, statusColor, integrationCount };
    });
  }, [categories, missingSet]);

  // Early return AFTER all hooks
  if (loading) {
    return (
      <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}>
        <EuiLoadingSpinner size="xl" />
      </EuiFlexGroup>
    );
  }

  const totalEnabled = (coverage?.coveredRules.length ?? 0) + (coverage?.uncoveredRules.length ?? 0);
  const noRules = totalEnabled === 0;


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
            render: (label: string, row: typeof dataCategoryRows[0]) => (
              <EuiBadge color={row.statusColor}>{label}</EuiBadge>
            ),
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

// ─── Quality tab ──────────────────────────────────────────────────────────────

type QualityIndexItem = {
  id: string; indexName: string;
  incompatibleFieldCount: number; checkedAt?: number;
  status: 'incompatible' | 'healthy';
};

interface QualityTabProps { categories: CategoryGroup[]; qualityResults: QualityResult[]; loading: boolean }

const QualityTab: React.FC<QualityTabProps> = ({ categories, qualityResults, loading }) => {
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
                  <EuiText size="s" style={{ fontWeight: 600, padding: '2px 0' }}>{cat.category}</EuiText>
                }
                extraAction={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ paddingRight: 8 }}>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiBadge color={incompatFields > 0 ? 'warning' : 'success'}>{incompatFields > 0 ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued" style={{ margin: '0 4px' }}>|</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Incompatible Fields:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" style={{ fontWeight: 600 }}>{incompatFields}</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued" style={{ margin: '0 4px' }}>|</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Affected indices:</EuiText></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiText size="xs" style={{ fontWeight: 600 }}>{affected}/{cat.items.length}</EuiText></EuiFlexItem>
                  </EuiFlexGroup>
                }
                paddingSize="m"
                borders="none"
                forceState={isOpen ? 'open' : 'closed'}
                onToggle={() => setOpenAccordions((prev) => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              >
                <EuiInMemoryTable
                  items={cat.items}
                  columns={qualityColumns}
                  pagination={{ pageSize: 10, pageSizeOptions: [5, 10, 20] }}
                  sorting={{ sort: { field: 'indexName', direction: 'asc' } }}
                  tableLayout="auto"
                />
              </EuiAccordion>
              {idx < filteredCategories.length - 1 && <EuiHorizontalRule margin="none" />}
            </div>
          );
        })}
      </EuiPanel>
    </>
  );
};

// ─── Continuity tab ───────────────────────────────────────────────────────────

interface ContinuityTabProps { categories: CategoryGroup[]; pipelines: PipelineStats[]; loading: boolean }

const ContinuityTab: React.FC<ContinuityTabProps> = ({ categories, pipelines, loading }) => {
  const indexToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(({ category, indices }) => indices.forEach(({ indexName }) => map.set(indexName, category)));
    return map;
  }, [categories]);

  const categorizedPipelines = useMemo(() => {
    const catMap = new Map<string, Array<PipelineStats & { failureRate: string; status: 'healthy' | 'critical' }>>();
    pipelines.forEach((p) => {
      const failureRate = p.docsCount > 0 ? ((p.failedDocsCount / p.docsCount) * 100).toFixed(1) : '0.0';
      const status = parseFloat(failureRate) >= 1 ? 'critical' as const : 'healthy' as const;
      const cats = new Set(p.indices.map((i) => indexToCategoryMap.get(i)).filter(Boolean) as string[]);
      cats.forEach((cat) => {
        const existing = catMap.get(cat) ?? [];
        existing.push({ ...p, failureRate, status });
        catMap.set(cat, existing);
      });
    });
    return Array.from(catMap.entries()).map(([category, items]) => ({ category, items }));
  }, [pipelines, indexToCategoryMap]);

  const hasCritical = categorizedPipelines.some((c) => c.items.some((p) => p.status === 'critical'));

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  type PipelineRow = PipelineStats & { failureRate: string; status: 'healthy' | 'critical' };
  const columns: Array<EuiBasicTableColumn<PipelineRow>> = [
    { field: 'name', name: 'Pipeline Name', truncateText: true, width: '30%' },
    { field: 'docsCount', name: 'Docs Ingested', width: '18%', render: (n: number) => n.toLocaleString() },
    { field: 'failedDocsCount', name: 'Failed Docs', width: '15%', render: (n: number) => n.toLocaleString() },
    { field: 'failureRate', name: 'Failure Rate', width: '15%', render: (r: string) => `${r}%` },
    { field: 'status', name: 'Status', width: '15%',
      render: (s: string) => <EuiBadge color={s === 'critical' ? 'danger' : 'success'}>{s === 'critical' ? 'Critical failure rate' : 'Healthy'}</EuiBadge> },
    { name: 'Actions', width: '10%',
      render: (row: PipelineRow) => <EuiButtonEmpty size="xs" color="primary">{row.status === 'critical' ? 'View Failure' : 'View Pipeline'}</EuiButtonEmpty> },
  ];

  const renderExtraAction = (cat: { category: string; items: PipelineRow[] }) => {
    const totalDocs = cat.items.reduce((s, p) => s + p.docsCount, 0);
    const totalFailed = cat.items.reduce((s, p) => s + p.failedDocsCount, 0);
    const rate = totalDocs > 0 ? ((totalFailed / totalDocs) * 100).toFixed(1) : '0.0';
    const isCritical = parseFloat(rate) >= 1;
    return (
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color={isCritical ? 'warning' : 'success'}>{isCritical ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Pipelines:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">{cat.items.length}</EuiBadge></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Docs Ingested:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">{totalDocs.toLocaleString()}</EuiBadge></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Failure Rate:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">{rate}%</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  return (
    <EuiPanel hasBorder paddingSize="m">
      {hasCritical && (
        <>
          <EuiCallOut color="warning" size="s" title="Ingest pipeline failures occurred.">
            <EuiText size="s">Some pipelines have a critical failure rate exceeding 1%.</EuiText>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            The following table summarizes the stability of your data by tracking ingest pipeline failure rates across log categories.
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
      {categorizedPipelines.length === 0 ? (
        <EuiText size="s" color="subdued" textAlign="center" style={{ padding: 40 }}>No pipeline data available.</EuiText>
      ) : (
        categorizedPipelines.map((cat) => (
          <CategoryAccordion
            key={cat.category}
            category={cat.category}
            items={cat.items as Array<CategoryAccordionItem & PipelineStats & { failureRate: string; status: 'healthy' | 'critical' }>}
            renderBadge={() => renderExtraAction(cat)}
            columns={columns as Array<EuiBasicTableColumn<CategoryAccordionItem>>}
          />
        ))
      )}
    </EuiPanel>
  );
};

// ─── Retention tab ────────────────────────────────────────────────────────────

interface RetentionTabProps { categories: CategoryGroup[]; retentionItems: RetentionItem[]; loading: boolean }

const RetentionTab: React.FC<RetentionTabProps> = ({ categories, retentionItems, loading }) => {
  const [filter, setFilter] = useState<'all' | 'non-compliant' | 'healthy'>('all');

  const categorizedRetention = useMemo(() => {
    return categories.map((cat) => {
      const items = retentionItems.filter((r) =>
        cat.indices.some((idx) => idx.indexName.includes(r.indexName))
      ).filter((r) => filter === 'all' || r.status === filter);
      return { category: cat.category, items };
    }).filter((cat) => cat.items.length > 0);
  }, [categories, retentionItems, filter]);

  const nonCompliantCount = useMemo(() =>
    retentionItems.filter((r) => r.status === 'non-compliant').length,
    [retentionItems]
  );

  if (loading) return <EuiFlexGroup justifyContent="center" style={{ padding: 60 }}><EuiLoadingSpinner size="xl" /></EuiFlexGroup>;

  const columns: Array<EuiBasicTableColumn<RetentionItem>> = [
    { field: 'indexName', name: 'Data streams/indices', truncateText: true, width: '30%' },
    { field: 'retentionType', name: 'Managed by', width: '12%',
      render: (t: string | null) => t ? <EuiBadge color="hollow">{t.toUpperCase()}</EuiBadge> : <EuiText size="s" color="subdued">None</EuiText> },
    { field: 'retentionPeriod', name: 'Current retention', width: '18%',
      render: (p: string | null, row: RetentionItem) =>
        p ? <EuiText size="s">{row.retentionDays} days</EuiText> : <EuiText size="s" color="subdued">Not configured</EuiText> },
    { field: 'indexName' as const, name: 'Baseline retention (FedRAMP)', width: '22%',
      render: () => <EuiText size="s">12 months</EuiText> },
    { field: 'status', name: 'Status', width: '12%',
      render: (s: string) => <EuiBadge color={s === 'non-compliant' ? 'danger' : 'success'}>{s === 'non-compliant' ? 'Non-compliant' : 'Healthy'}</EuiBadge> },
    { name: 'Actions', width: '10%',
      render: (row: RetentionItem) => <EuiButtonEmpty size="xs" color="primary">{row.retentionType === 'ilm' ? 'View ILM policies' : 'View Data Stream'}</EuiButtonEmpty> },
  ];

  const renderExtraAction = (cat: { category: string; items: RetentionItem[] }) => {
    const nonCompliant = cat.items.filter((i) => i.status === 'non-compliant').length;
    return (
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Status:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color={nonCompliant > 0 ? 'warning' : 'success'}>{nonCompliant > 0 ? 'Actions required' : 'Healthy'}</EuiBadge></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">|</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiText size="xs" color="subdued">Data streams:</EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">{cat.items.length}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  return (
    <EuiPanel hasBorder paddingSize="m">
      {nonCompliantCount > 0 && (
        <>
          <EuiCallOut color="warning" size="s" title="Some Lifecycle Policies need increasing.">
            <EuiText size="s">{nonCompliantCount} data stream{nonCompliantCount !== 1 ? 's' : ''} do not meet the 12-month FedRAMP baseline retention requirement.</EuiText>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      )}
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem>
          <EuiText size="s" color="subdued">
            Check if your log data meets recommended retention periods across key categories.
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
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false} style={{ marginBottom: 12 }}>
        <EuiFlexItem />
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="Retention filter"
            options={[{ id: 'all', label: 'All' }, { id: 'non-compliant', label: 'Non-compliant' }, { id: 'healthy', label: 'Healthy' }]}
            idSelected={filter}
            onChange={(id) => setFilter(id as typeof filter)}
            buttonSize="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {categorizedRetention.length === 0 ? (
        <EuiText size="s" color="subdued" textAlign="center" style={{ padding: 40 }}>No retention data available.</EuiText>
      ) : (
        categorizedRetention.map((cat) => (
          <CategoryAccordion
            key={cat.category}
            category={cat.category}
            items={cat.items as unknown as CategoryAccordionItem[]}
            renderBadge={() => renderExtraAction(cat)}
            columns={columns as Array<EuiBasicTableColumn<CategoryAccordionItem>>}
          />
        ))
      )}
    </EuiPanel>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SiemReadinessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VisibilityTabId>('coverage');
  const { loading, coverage, categories, integrations, qualityResults, pipelines, retentionItems } = useSiemReadinessData();

  const coverageStatus: VisibilityStatus = useMemo(() => {
    if (loading || !coverage) return 'noData';
    const total = coverage.coveredRules.length + coverage.uncoveredRules.length;
    if (total === 0) return 'noData';
    return coverage.uncoveredRules.length > 0 ? 'actionsRequired' : 'healthy';
  }, [loading, coverage]);

  const qualityStatus: VisibilityStatus = useMemo(() => {
    if (loading || qualityResults.length === 0) return 'noData';
    return qualityResults.some((r) => r.incompatibleFieldCount > 0) ? 'actionsRequired' : 'healthy';
  }, [loading, qualityResults]);

  const continuityStatus: VisibilityStatus = useMemo(() => {
    if (loading || pipelines.length === 0) return 'noData';
    const hasCritical = pipelines.some((p) => p.docsCount > 0 && (p.failedDocsCount / p.docsCount) * 100 >= 1);
    return hasCritical ? 'actionsRequired' : 'healthy';
  }, [loading, pipelines]);

  const retentionStatus: VisibilityStatus = useMemo(() => {
    if (loading || retentionItems.length === 0) return 'noData';
    return retentionItems.some((r) => r.status === 'non-compliant') ? 'actionsRequired' : 'healthy';
  }, [loading, retentionItems]);

  const tabs = [
    {
      id: 'coverage' as const,
      name: 'Coverage',
      content: (
        <>
          <EuiSpacer size="m" />
          <CoverageTab coverage={coverage} categories={categories} integrations={integrations} loading={loading} />
        </>
      ),
    },
    { id: 'quality'    as const, name: 'Quality',     content: <><EuiSpacer size="m" /><QualityTab categories={categories} qualityResults={qualityResults} loading={loading} /></>    },
    { id: 'continuity' as const, name: 'Continuity',  content: <><EuiSpacer size="m" /><ContinuityTab categories={categories} pipelines={pipelines} loading={loading} /></>  },
    { id: 'retention'  as const, name: 'Retention',   content: <><EuiSpacer size="m" /><RetentionTab categories={categories} retentionItems={retentionItems} loading={loading} /></>   },
  ];

  const selectedTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

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

                {/* Visibility section boxes */}
                <VisibilitySectionBoxes
                  selectedTabId={activeTab}
                  onTabSelect={setActiveTab}
                  coverageStatus={coverageStatus}
                  qualityStatus={qualityStatus}
                  continuityStatus={continuityStatus}
                  retentionStatus={retentionStatus}
                />

                <EuiSpacer size="m" />

                {/* Tabbed content — matches real EuiTabbedContent */}
                <EuiTabbedContent
                  tabs={tabs}
                  selectedTab={selectedTab}
                  onTabClick={(tab) => setActiveTab(tab.id as VisibilityTabId)}
                  expand={false}
                />

              </EuiPageSection>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>
    </>
  );
};

export default SiemReadinessPage;
