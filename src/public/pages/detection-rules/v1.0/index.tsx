import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  EuiAccordion,
  EuiHorizontalRule,
  EuiCheckbox,
  EuiFacetButton,
  EuiButtonGroup,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

interface DetectionRule {
  id: string;
  name: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  platform?: string;
  ruleType?: string;
  tags?: string[];
  mitreTactics?: string[];
  mitreTechniques?: Array<{ id: string; name: string }>;
  lastRun: string;
  lastResponse: 'Failed' | 'Succeeded';
  lastUpdated: string;
  notify: boolean;
  enabled: boolean;
  hasWarning?: boolean;
  alertsCount: string;
  tagsCount: number;
}

// Process parsed rules to add alertsCount and tagsCount
const mockRules: DetectionRule[] = (parsedRulesData as any[]).map((rule, index) => ({
  ...rule,
  alertsCount: `0/${Math.floor(Math.random() * 10) + 1}`,
  tagsCount: rule.tags?.length || 0,
  hasWarning: false,
}));

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

// Convert detection rules to monitoring format
const mockMonitoringRules: MonitoringRule[] = mockRules.map((rule) => ({
  id: rule.id,
  name: rule.name,
  method: rule.ruleType === 'eql' ? 'EQL' : rule.ruleType === 'query' ? 'Query' : 'Modified',
  ruleId: `-${Math.floor(Math.random() * 10)}/${Math.floor(Math.random() * 2)}`,
  status: `-${(Math.random() * 10).toFixed(1)}`,
  queryTimeMax: '--',
  gapDuration: '--',
  lastRunFP: '--',
  unifiedPageDuration: '--',
  lastResponse: rule.lastResponse === 'Failed' ? 'Failed' : Math.random() > 0.7 ? 'Warning' : 'Succeeded',
  lastRun: rule.lastRun,
  enabled: rule.enabled,
}));

const DetectionRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<DetectionRule[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTab, setSelectedTab] = useState<'installed' | 'monitoring' | 'updates'>('installed');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [showDeprecatedCallout, setShowDeprecatedCallout] = useState(true);
  const [rulesCardTab, setRulesCardTab] = useState('summary');
  const [aiSectionOpen, setAiSectionOpen] = useState(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});

  const toggleFilterOpen = (filterId: string) => {
    setOpenFilters((prev) => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  const toggleFilterOption = (filterId: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterId] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [filterId]: updated };
    });
    // Reset pagination when filters change
    setPageIndex(0);
  };

  // Map rule type display names to ruleType field values
  const ruleTypeMap: Record<string, string[]> = {
    'ES|QL': ['esql'],
    'Custom query': ['query'],
    'Threshold': ['threshold'],
    'Event correlation': ['eql'],
    'Indicator match': ['threat_match'],
    'New terms': ['new_terms'],
    'Machine learning': ['machine_learning'],
  };

  // Apply all active filters to mockRules
  const filteredRules = mockRules.filter((rule) => {
    const sel = selectedFilters;

    // Rule type
    if (sel['rule-type']?.length) {
      const matchedTypes = sel['rule-type'].flatMap((o) => ruleTypeMap[o] || [o.toLowerCase()]);
      if (!matchedTypes.some((t) => rule.ruleType?.toLowerCase().includes(t))) return false;
    }

    // Severity
    if (sel['severity']?.length) {
      const severityMatch = sel['severity'].map((s) => s.toLowerCase());
      if (!severityMatch.includes(rule.severity?.toLowerCase())) return false;
    }

    // Last response
    if (sel['last-response']?.length) {
      if (!sel['last-response'].includes(rule.lastResponse)) return false;
    }

    // Status
    if (sel['status']?.length) {
      const wantEnabled = sel['status'].includes('Enabled');
      const wantDisabled = sel['status'].includes('Disabled');
      if (wantEnabled && !wantDisabled && !rule.enabled) return false;
      if (wantDisabled && !wantEnabled && rule.enabled) return false;
    }

    // MITRE ATT&CK tactic
    if (sel['mitre-tactic']?.length) {
      const tacticMatches = sel['mitre-tactic'].some((tactic) =>
        rule.mitreTactics?.some((t) => t.toLowerCase().includes(tactic.toLowerCase()))
      );
      if (!tacticMatches) return false;
    }

    // Tags (Domain: X, OS: X etc.)
    if (sel['tags']?.length) {
      const tagMatches = sel['tags'].some((tag) =>
        rule.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!tagMatches) return false;
    }

    // Use cases (tags prefixed with "Use Case:")
    if (sel['use-cases']?.length) {
      const ucMatches = sel['use-cases'].some((uc) =>
        rule.tags?.some((t) => t.toLowerCase().includes(uc.toLowerCase()))
      );
      if (!ucMatches) return false;
    }

    // Data source (tags prefixed with "Data Source:")
    if (sel['data-source']?.length) {
      const dsMatches = sel['data-source'].some((ds) =>
        rule.tags?.some((t) => t.toLowerCase().includes(ds.toLowerCase()))
      );
      if (!dsMatches) return false;
    }

    // Rule category (Elastic / Custom based on tags)
    if (sel['rule-category']?.length) {
      const isElastic = rule.tags?.some((t) => t.toLowerCase().includes('elastic'));
      const isCustom = !isElastic;
      const wantElastic = sel['rule-category'].some((c) => c.toLowerCase().includes('elastic'));
      const wantCustom = sel['rule-category'].includes('Custom');
      if (wantElastic && !isElastic) return false;
      if (wantCustom && !isCustom) return false;
    }

    return true;
  });
  
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
      case 'critical':
        return 'danger';
      default:
        return 'success';
    }
  };
  
  const capitalizeSeverity = (severity: string): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
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
            <EuiLink onClick={() => navigate(`/detection-rules/${item.id}`)}>
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
          {capitalizeSeverity(severity)}
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
    totalItemCount: filteredRules.length,
    pageSizeOptions: [10, 20, 50, 100],
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
      label: 'Installed rules',
      count: mockRules.length,
    },
    {
      id: 'monitoring' as const,
      label: 'Rule monitoring',
      count: mockMonitoringRules.length,
    },
    {
      id: 'updates' as const,
      label: 'Rule updates',
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
        height: 'calc(100vh - 56px)',
        marginTop: 48,
        marginLeft: 80,
        padding: 8,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ flex: 1, minHeight: 0 }}>
          {/* Secondary Navigation Card */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                height: '100%',
              }}
            >
              <RulesSecondaryNav 
                selectedSection="installed"
                onSectionChange={(section) => {
                  // Keep on Detection rules (SIEM) section since all tabs are part of it
                  if (section === 'installed') {
                    setSelectedTab('installed');
                  }
                }}
              />
            </EuiPanel>
          </EuiFlexItem>

          {/* Rules Panel Card */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel 
              paddingSize="none" 
              hasShadow={true}
              style={{ 
                borderRadius: 8, 
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Fixed top section - never scrolls */}
              <div style={{ padding: '24px 24px 0 24px', flexShrink: 0 }}>
        {/* Page Header */}
        <div style={{ marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px' }}>
          <EuiPageHeader
            pageTitle="Detection rules (SIEM)"
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
                  <EuiButton iconType="plusInCircle" fill size="s" onClick={() => navigate('/detection-rules/create')}>
                    Create new rule
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            ]}
          />
        </div>

        <EuiSpacer size="xl" />

        {/* AI-generated priorities */}
        <div style={{
          background: 'linear-gradient(to right, #D9E8FF 17%, #ECE2FE 83%)',
          border: '1px solid #c5cde8',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Header row */}
          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            justifyContent="spaceBetween"
            responsive={false}
            style={{ padding: '10px 16px', cursor: 'pointer', background: 'transparent' }}
            onClick={() => setAiSectionOpen(!aiSectionOpen)}
          >
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type={aiSectionOpen ? 'arrowDown' : 'arrowRight'} size="s" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" style={{ fontWeight: 600 }}>AI-generated personal priorities for today</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiIcon type="sparkles" size="s" style={{ color: '#7B61FF' }} />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <EuiButtonEmpty size="xs" iconType="discuss" color="primary">
                Add to chat
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Cards */}
          {aiSectionOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <EuiFlexGroup gutterSize="m" responsive={false}>
                {/* Card 1 — Alert/Critical */}
                <EuiFlexItem>
                  <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(197,205,232,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginBottom: 8 }}>
                        <EuiFlexItem grow={false}><EuiBadge color="hollow" iconType="alert">Alert</EuiBadge></EuiFlexItem>
                        <EuiFlexItem grow={false}><EuiBadge color="danger">Critical</EuiBadge></EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="s">
                        <p>Critical alert detected on <EuiLink href="#"><strong>srv-core01</strong></EuiLink>.<br />
                        A high-risk executable was detected with 7 related alerts and a high-severity rule match. Indicates a likely compromise requiring immediate investigation.</p>
                        <p><strong>Investigate and isolate the host.</strong></p>
                      </EuiText>
                    </div>
                    <EuiButtonEmpty size="xs" iconType="popout" iconSide="right" color="primary" flush="left" style={{ marginTop: 8 }}>
                      Open flyout
                    </EuiButtonEmpty>
                  </EuiPanel>
                </EuiFlexItem>

                {/* Card 2 — Rule */}
                <EuiFlexItem>
                  <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(197,205,232,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginBottom: 8 }}>
                        <EuiFlexItem grow={false}><EuiBadge color="hollow" iconType="indexSettings">Rule</EuiBadge></EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="s">
                        <p>Noisy rule triggered — <EuiLink href="#"><strong>Suspicious Login Pattern</strong></EuiLink>.<br />
                        Fired 45 times this week with a hi gh false-positive rate. May indicate rule misconfiguration or excess noise affecting triage accuracy.</p>
                        <p><strong>Review and tune rule conditions.</strong></p>
                      </EuiText>
                    </div>
                    <EuiButtonEmpty size="xs" iconType="arrowRight" iconSide="right" color="primary" flush="left" style={{ marginTop: 8 }}>
                      Tune rule
                    </EuiButtonEmpty>
                  </EuiPanel>
                </EuiFlexItem>

                {/* Card 3 — Attack */}
                <EuiFlexItem>
                  <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(197,205,232,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginBottom: 8 }}>
                        <EuiFlexItem grow={false}><EuiBadge color="hollow" iconType="securitySignal">Attack</EuiBadge></EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="s">
                        <p>Potential attack chain detected on <EuiLink href="#"><strong>srv-core01</strong></EuiLink>.<br />
                        Correlated alerts suggest possible lateral movement across hosts. Indicates early signs of coordinated activity.</p>
                        <p><strong>Review user activity and validate privileged actions.</strong></p>
                      </EuiText>
                    </div>
                    <EuiButtonEmpty size="xs" iconType="popout" iconSide="right" color="primary" flush="left" style={{ marginTop: 8 }}>
                      Open flyout
                    </EuiButtonEmpty>
                  </EuiPanel>
                </EuiFlexItem>

                {/* Card 4 — Attack */}
                <EuiFlexItem>
                  <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(197,205,232,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <EuiFlexGroup gutterSize="xs" responsive={false} style={{ marginBottom: 8 }}>
                        <EuiFlexItem grow={false}><EuiBadge color="hollow" iconType="securitySignal">Attack</EuiBadge></EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiText size="s">
                        <p>Potential attack chain detected on <EuiLink href="#"><strong>srv-core01</strong></EuiLink>.<br />
                        Correlated alerts suggest possible lateral movement across hosts. Indicates early signs of coordinated activity.</p>
                        <p><strong>Review user activity and validate privileged actions.</strong></p>
                      </EuiText>
                    </div>
                    <EuiButtonEmpty size="xs" iconType="popout" iconSide="right" color="primary" flush="left" style={{ marginTop: 8 }}>
                      Open flyout
                    </EuiButtonEmpty>
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          )}
        </div>

        {/* Rules Cards Section */}
        <div>
          <EuiButtonGroup
            legend="Rules cards view"
            options={[
              { id: 'summary', label: 'Summary' },
              { id: 'system_health', label: 'System health' },
              { id: 'errors', label: 'Errors' },
              { id: 'performance', label: 'Performance' },
            ]}
            idSelected={rulesCardTab}
            onChange={(id) => setRulesCardTab(id)}
            color="primary"
            buttonSize="s"
          />

          <EuiSpacer size="m" />

          <EuiFlexGroup gutterSize="m" responsive={false}>
            {/* Card 1 — Insights */}
            <EuiFlexItem>
              <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" style={{ fontWeight: 700 }}>XXXXXX</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="xs" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="arrowLeft" aria-label="Previous" size="xs" color="text" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon iconType="arrowRight" aria-label="Next" size="xs" color="text" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="s" />

                <EuiFlexGroup gutterSize="m" responsive={false}>
                  <EuiFlexItem>
                    <EuiPanel color="subdued" hasBorder={false} hasShadow={false} paddingSize="s" style={{ borderRadius: 6, border: '1px solid #d3dae6' }}>
                      <EuiText size="s" style={{ fontWeight: 700 }}>False positive reduction.</EuiText>
                      <EuiText size="xs" color="subdued">3 rules have marked false positive alerts.</EuiText>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiPanel color="plain" hasBorder={false} hasShadow={false} paddingSize="s" style={{ borderRadius: 6, border: '1px solid #d3dae6' }}>
                      <EuiText size="s" style={{ fontWeight: 700 }}>Resolve errors.</EuiText>
                      <EuiText size="xs" color="subdued">You have multiple rule and action errors.</EuiText>
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>

            {/* Card 2 — Updates & Coverage */}
            <EuiFlexItem>
              <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                <EuiText size="s" style={{ fontWeight: 700, marginBottom: 12 }}>XXXXX</EuiText>

                <EuiFlexGroup gutterSize="xl" alignItems="center" justifyContent="center" responsive={false}>
                  {/* 17 available updates */}
                  <EuiFlexItem grow={false} style={{ textAlign: 'center' }}>
                    <EuiIcon type="download" size="xl" color="subdued" />
                    <EuiSpacer size="xs" />
                    <EuiText size="s" style={{ fontWeight: 700 }}>17 available updates</EuiText>
                  </EuiFlexItem>

                  {/* 95% run coverage donut */}
                  <EuiFlexItem grow={false} style={{ textAlign: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="22" fill="none" stroke="#d3dae6" strokeWidth="10" />
                      <circle cx="30" cy="30" r="22" fill="none" stroke="#54b399" strokeWidth="10"
                        strokeDasharray={`${0.95 * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * 0.25}
                        strokeLinecap="round"
                      />
                      <circle cx="30" cy="30" r="22" fill="none" stroke="#e7664c" strokeWidth="10"
                        strokeDasharray={`${0.05 * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * (0.25 - 0.95)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <EuiSpacer size="xs" />
                    <EuiText size="s" style={{ fontWeight: 700 }}>95% run coverage</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>

            {/* Card 3 — Large donut */}
            <EuiFlexItem>
              <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" style={{ fontWeight: 700 }}>XXXX</EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="primary" />
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#d3dae6" strokeWidth="16" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#d3dae6" strokeWidth="16"
                      strokeDasharray={`${0.6 * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                      strokeDashoffset={2 * Math.PI * 38 * 0.25}
                    />
                  </svg>
                </div>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>

        <EuiSpacer size="m" />

        {/* Tabs hidden on DEX-Vision branch */}
        <div style={{ display: 'none' }}>
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
        </div>
              </div>

        {/* Scrollable section — filter + table only */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px', minHeight: 0 }}>
        <EuiSpacer size="m" />

        {/* Main content: Filter panel + Table */}
        <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false} style={{ flex: 1 }}>

          {/* Facet Filter Panel */}
          {isFilterPanelOpen && (
            <EuiFlexItem grow={false} style={{
              width: 236,
              flexShrink: 0,
              borderRight: '1px solid #d3dae6',
              paddingRight: 16,
              paddingTop: 4,
            }}>
              {/* Filters header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <EuiButtonIcon
                  iconType="transitionLeftOut"
                  aria-label="Collapse filters"
                  color="text"
                  size="s"
                  display="base"
                  onClick={() => setIsFilterPanelOpen(false)}
                  style={{ flexShrink: 0 }}
                />
                <EuiText size="s" style={{ fontWeight: 700, flex: 1 }}>Filters</EuiText>
                <EuiButtonEmpty size="xs" flush="right" color="primary">
                  Clear
                </EuiButtonEmpty>
              </div>

              {/* Filter accordions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {[
                  {
                    id: 'rule-category', label: 'Rule category', count: 3,
                    options: ['Elastic', 'Elastic modified', 'Custom'],
                  },
                  {
                    id: 'rule-type', label: 'Rule type', count: 7,
                    options: ['ES|QL', 'Custom query', 'Threshold', 'Event correlation', 'Indicator match', 'New terms', 'Machine learning'],
                  },
                  {
                    id: 'data-source', label: 'Data source', count: 13,
                    options: ['Active Directory', 'Amazon Web Services', 'Auditd Manager', 'AWS', 'AWS IAM', 'Crowdstrike', 'Elastic Defend', 'Elastic Endgame', 'Github', 'Microsoft Defender for Endpoint', 'Okta', 'PowerShell Logs', 'SentinelOne', 'Sysmon', 'System', 'Windows Security Event Logs'],
                  },
                  {
                    id: 'mitre-tactic', label: 'MITRE ATT&CK tactic', count: 14,
                    options: ['Initial Access', 'Persistence', 'Defense Evasion', 'Discovery', 'Collection', 'Impact', 'Reconnaissance', 'Credential Dumping', 'Remote Services', 'Supply Chain Compromise', 'Application Layer Protocol', 'Information Discovery', 'User Execution', 'Phishing', 'Cloud Service Provider', 'Access Token Manipulation'],
                  },
                  {
                    id: 'use-cases', label: 'Use cases', count: 6,
                    options: ['Active Directory Monitoring', 'Identity and Access Audit', 'Lateral Movement Detection', 'Log Auditing', 'Threat Detection', 'Vulnerability'],
                  },
                  {
                    id: 'tags', label: 'Tags', count: 8,
                    options: ['Domain: Cloud', 'Domain: Endpoint', 'OS: Linux', 'OS: Windows', 'Promotion: External Alerts', 'Resources: Investigation Guide', 'Threat: Lightning Framework', 'Threat: Orbit'],
                  },
                  {
                    id: 'status', label: 'Status', count: 2,
                    options: ['Enabled', 'Disabled'],
                  },
                  {
                    id: 'last-response', label: 'Last response', count: 3,
                    options: ['Succeeded', 'Warning', 'Failed'],
                  },
                  {
                    id: 'severity', label: 'Severity', count: 3,
                    options: ['Low', 'Medium', 'High'],
                  },
                ].map((filter) => {
                  const selected = selectedFilters[filter.id] || [];
                  const badgeCount = selected.length > 0 ? selected.length : filter.count;
                  const isOpen = !!openFilters[filter.id];

                  return (
                    <div key={filter.id}>
                      <EuiFacetButton
                        quantity={badgeCount}
                        isSelected={selected.length > 0}
                        onClick={() => toggleFilterOpen(filter.id)}
                        style={{ width: '100%', paddingRight: 0 }}
                        icon={
                          <EuiIcon
                            type={isOpen ? 'arrowDown' : 'arrowRight'}
                            size="s"
                          />
                        }
                      >
                        {filter.label}
                      </EuiFacetButton>

                      {isOpen && (
                        <div style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {filter.options.map((option) => (
                            <EuiCheckbox
                              key={option}
                              id={`${filter.id}-${option}`}
                              label={<EuiText size="xs">{option}</EuiText>}
                              checked={selected.includes(option)}
                              onChange={() => toggleFilterOption(filter.id, option)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </EuiFlexItem>
          )}

          {/* Table + search area */}
          <EuiFlexItem style={{ paddingLeft: isFilterPanelOpen ? 16 : 0, minWidth: 0, alignSelf: 'flex-start', width: '100%' }}>

            {/* Search Bar row — expand button sits inline when panel is collapsed */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              {!isFilterPanelOpen && (
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType="transitionLeftIn"
                    aria-label="Expand filters"
                    color="text"
                    size="s"
                    display="base"
                    onClick={() => setIsFilterPanelOpen(true)}
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={true}>
                <EuiFieldSearch
                  placeholder='Rule name, index pattern (e.g., "filebeat-*"), or MITRE ATT&CK tactic or technique'
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  isClearable={true}
                  fullWidth
                />
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
                  Showing {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, filteredRules.length)} of {filteredRules.length} rules
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
                  onClick={() => setSelectedItems(filteredRules)}
                >
                  Select all {filteredRules.length} rules
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
              items={filteredRules.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
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
                  render: (name: string, item: any) => (
                    <EuiLink onClick={() => navigate(`/detection-rules/${item.id}`)}>
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
                pageSizeOptions: [10, 20, 50, 100],
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

          </EuiFlexItem>
        </EuiFlexGroup>
        </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
};

export default DetectionRulesPage;
