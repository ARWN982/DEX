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

interface SiemReadinessData {
  loading: boolean;
  coverage: RuleIntegrationCoverage | null;
  categories: CategoryGroup[];
  integrations: SiemReadinessPackageInfo[];
}

function useSiemReadinessData(): SiemReadinessData {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<RuleIntegrationCoverage | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [integrations, setIntegrations] = useState<SiemReadinessPackageInfo[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/siem_readiness/get_categories').then((r) => r.json() as Promise<CategoriesResponse>),
      fetch('/api/fleet/epm/packages').then((r) => r.json() as Promise<{ items: SiemReadinessPackageInfo[] }>),
      fetch('/api/detection_engine/rules/_find').then((r) => r.json() as Promise<{ data: RelatedIntegrationRuleResponse[] }>),
    ])
      .then(([cats, pkgs, rules]) => {
        setCategories(cats.mainCategoriesMap);
        setIntegrations(pkgs.items);
        setCoverage(computeCoverage(rules.data, pkgs.items));
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, coverage, categories, integrations };
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
}

const VisibilitySectionBoxes: React.FC<VisibilitySectionBoxesProps> = ({
  selectedTabId,
  onTabSelect,
  coverageStatus,
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
      status: 'noData',
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
      status: 'noData',
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
      status: 'noData',
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
  const [dataSearch, setDataSearch] = useState('');

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
  const dataCategoryData = useMemo(() => {
    return categories.map((cat) => {
      const catPkgs = CATEGORY_INTEGRATIONS[cat.category] ?? [];
      const items: CategoryAccordionItem[] = cat.indices
        .filter((idx) => !dataSearch || idx.indexName.toLowerCase().includes(dataSearch.toLowerCase()))
        .map((idx) => ({
          id: idx.indexName,
          name: idx.indexName,
          status: idx.docs > 0 ? 'covered' : 'noData',
          detail: idx.docs > 0 ? `${idx.docs.toLocaleString()} docs` : 'No data',
          count: idx.docs,
        }));
      return { category: cat.category, items };
    });
  }, [categories, dataSearch]);

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

  const dataCoverageColumns: Array<EuiBasicTableColumn<CategoryAccordionItem>> = [
    { field: 'name', name: 'Index' },
    {
      field: 'count' as const,
      name: 'Documents',
      width: '160px',
      render: (_: CategoryAccordionItem['count'], row: CategoryAccordionItem) => (
        <EuiText size="s" color={row.count === 0 ? 'danger' : undefined}>
          {row.detail}
        </EuiText>
      ),
    },
    {
      name: 'Action',
      width: '180px',
      render: (_: CategoryAccordionItem) => (
        <EuiButtonEmpty size="xs" color="primary" iconType="popout">
          View in Discover
        </EuiButtonEmpty>
      ),
    },
  ];

  const renderDataBadge = (items: CategoryAccordionItem[]) => {
    const noData = items.filter((i) => i.status === 'noData').length;
    const total = items.length;
    return noData > 0
      ? <EuiBadge color="danger">{noData}/{total} missing data</EuiBadge>
      : <EuiBadge color="success" iconType="check">Data present</EuiBadge>;
  };

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
          Install missing integrations to ensure full detection coverage.{' '}
          <EuiButtonEmpty size="xs" color="primary" flush="left" style={{ display: 'inline', padding: 0 }}>Learn more from docs.</EuiButtonEmpty>
        </EuiText>
      </EuiCallOut>

      <EuiSpacer size="m" />

      {/* Search bar */}
      <EuiFieldSearch
        placeholder="Search indices..."
        value={dataSearch}
        onChange={(e) => setDataSearch(e.target.value)}
        isClearable
        style={{ maxWidth: 320, marginBottom: 12 }}
      />

      {/* Data coverage accordions by category */}
      {dataCategoryData.map((cat) => (
        <CategoryAccordion
          key={cat.category}
          category={cat.category}
          items={cat.items}
          renderBadge={renderDataBadge}
          columns={dataCoverageColumns}
        />
      ))}
      </EuiPanel>
    </div>
  );
};

// ─── Placeholder tabs ─────────────────────────────────────────────────────────

const PlaceholderTab: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ textAlign: 'center', padding: '60px 24px' }}>
    <EuiIcon type="visLine" size="xl" color="subdued" />
    <EuiSpacer size="m" />
    <EuiTitle size="s"><h3>{label}</h3></EuiTitle>
    <EuiSpacer size="s" />
    <EuiText color="subdued" size="s"><p>No data available yet.</p></EuiText>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const SiemReadinessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VisibilityTabId>('coverage');
  const { loading, coverage, categories, integrations } = useSiemReadinessData();

  const coverageStatus: VisibilityStatus = useMemo(() => {
    if (loading || !coverage) return 'noData';
    const total = coverage.coveredRules.length + coverage.uncoveredRules.length;
    if (total === 0) return 'noData';
    return coverage.uncoveredRules.length > 0 ? 'actionsRequired' : 'healthy';
  }, [loading, coverage]);

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
    { id: 'quality'    as const, name: 'Quality',     content: <><EuiSpacer size="m" /><PlaceholderTab label="Quality" /></>    },
    { id: 'continuity' as const, name: 'Continuity',  content: <><EuiSpacer size="m" /><PlaceholderTab label="Continuity" /></>  },
    { id: 'retention'  as const, name: 'Retention',   content: <><EuiSpacer size="m" /><PlaceholderTab label="Retention" /></>   },
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
