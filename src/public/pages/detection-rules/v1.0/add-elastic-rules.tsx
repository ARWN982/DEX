import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiBadge,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiHorizontalRule,
  EuiText,
  EuiTitle,
  EuiBasicTable,
  EuiFacetButton,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import parsedRulesData from '../../../data/parsedDetectionRules.json';

const suggestionCards = [
  {
    icon: 'sparkles',
    iconColor: '#7B61FF',
    title: 'AI suggest discovery',
    desc: "Let our AI discovery find the right rules for your environment, our agent will ask a few questions and present the rules you require.",
    action: 'Begin discovery',
  },
  {
    icon: 'integrationGeneral',
    iconColor: '#0077cc',
    title: 'Newly added integrations',
    desc: 'Locate all the rules for your newly added integrations.',
    action: 'Show rules',
  },
  {
    icon: 'users',
    iconColor: '#017d73',
    title: 'Rules Like Mine',
    desc: 'Show which rules are most commonly used by orgs with similar stack profiles.',
    action: 'Begin discovery',
  },
  {
    icon: 'machineLearningApp',
    iconColor: '#F5A700',
    title: 'Machine Learning',
    desc: 'Reference existing detection rules using Elastic ML jobs.',
    action: 'Show rules',
  },
];

const filterSections = [
  { id: 'use-cases',   label: 'Use cases',          count: 6  },
  { id: 'data-source', label: 'Data source',         count: 13 },
  { id: 'mitre',       label: 'MITRE ATT&CK tactic', count: 14 },
  { id: 'tags',        label: 'Tags',                count: 8  },
  { id: 'rule-type',   label: 'Rule type',           count: 7  },
  { id: 'severity',    label: 'Severity',            count: 3  },
  { id: 'data-status', label: 'Data status',         count: 3  },
];

const AddElasticRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [activeView, setActiveView] = useState('suggestions');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});

  const toggleFilter = (id: string) =>
    setOpenFilters(prev => ({ ...prev, [id]: !prev[id] }));

  const rules = (parsedRulesData as any[]).slice(0, 40);
  const pageRules = rules.slice(0, 10);

  const getSeverityColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': case 'critical': return 'danger';
      default: return 'subdued';
    }
  };

  return (
    <>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

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

          {/* Secondary Nav */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <RulesSecondaryNav selectedSection="installed" onSectionChange={() => {}} />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Panel */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Fixed header section */}
              <div style={{ padding: '20px 24px 0 24px', flexShrink: 0 }}>
                {/* Back button */}
                <EuiButtonEmpty
                  iconType="arrowLeft"
                  size="s"
                  onClick={() => navigate('/detection-rules')}
                  style={{ marginBottom: 12 }}
                >
                  Detection rules (SIEM)
                </EuiButtonEmpty>

                {/* Title + Install all */}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false} style={{ marginBottom: 20 }}>
                  <EuiFlexItem>
                    <EuiTitle size="l"><h1>Add Elastic rules</h1></EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton fill iconType="plusInCircle" size="s">
                      Install all
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Full-width horizontal divider */}
                <EuiHorizontalRule margin="none" />
              </div>

              {/* Scrollable content below divider */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <EuiFlexGroup gutterSize="none" alignItems="stretch" responsive={false} style={{ flex: 1 }}>

                  {/* Filter sidebar — full height */}
                  {isFilterOpen && (
                    <EuiFlexItem grow={false} style={{
                      width: 236,
                      flexShrink: 0,
                      borderRight: '1px solid #d3dae6',
                      padding: '16px 16px 16px 24px',
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <EuiButtonIcon
                          iconType="transitionLeftOut"
                          aria-label="Collapse filters"
                          color="text"
                          size="s"
                          display="base"
                          onClick={() => setIsFilterOpen(false)}
                          style={{ height: 40, width: 40, borderRadius: 6, flexShrink: 0 }}
                        />
                        <EuiText size="s" style={{ fontWeight: 700, flex: 1 }}>Filters</EuiText>
                        <EuiButtonEmpty size="xs" color="primary" flush="right">Clear</EuiButtonEmpty>
                      </div>

                      {/* Filter sections */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filterSections.map((f) => (
                          <EuiFacetButton
                            key={f.id}
                            quantity={f.count}
                            onClick={() => toggleFilter(f.id)}
                            style={{ width: '100%', paddingRight: 0 }}
                            icon={<EuiIcon type={openFilters[f.id] ? 'arrowDown' : 'arrowRight'} size="s" />}
                          >
                            {f.label}
                          </EuiFacetButton>
                        ))}
                      </div>
                    </EuiFlexItem>
                  )}

                  {/* Main content */}
                  <EuiFlexItem style={{ minWidth: 0, padding: '16px 24px' }}>

                    {/* Search + button group + cards all in one bordered container */}
                    <div style={{ border: '1px solid #d3dae6', borderRadius: 6, padding: '12px', marginBottom: 16 }}>

                      {/* Search row */}
                      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginBottom: 10 }}>
                        {!isFilterOpen && (
                          <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                              iconType="transitionLeftIn"
                              aria-label="Expand filters"
                              color="text"
                              size="s"
                              display="base"
                              onClick={() => setIsFilterOpen(true)}
                              style={{ height: 40, width: 40, borderRadius: 6 }}
                            />
                          </EuiFlexItem>
                        )}
                        <EuiFlexItem>
                          <EuiFieldSearch
                            placeholder="What do you want to detect?"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            fullWidth
                            isClearable
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      {/* EuiButtonGroup for Suggestions / Threats / Data sources */}
                      <EuiButtonGroup
                        legend="View selector"
                        options={[
                          { id: 'suggestions', label: 'Suggestions' },
                          { id: 'threats',     label: 'Threats' },
                          { id: 'data_sources',label: 'Data sources' },
                        ]}
                        idSelected={activeView}
                        onChange={(id) => setActiveView(id)}
                        buttonSize="s"
                        style={{ marginBottom: 12 }}
                      />

                      {/* Suggestion cards */}
                      <EuiFlexGroup gutterSize="m" responsive={false}>
                        {suggestionCards.map((card) => (
                          <EuiFlexItem key={card.title}>
                            <EuiPanel
                              hasBorder
                              hasShadow={false}
                              paddingSize="m"
                              style={{ borderRadius: 8, display: 'flex', flexDirection: 'column', height: '100%' }}
                            >
                              <EuiIcon type={card.icon} size="l" style={{ color: card.iconColor, marginBottom: 10 }} />
                              <EuiText size="s" style={{ fontWeight: 700, marginBottom: 6 }}>{card.title}</EuiText>
                              <EuiText size="xs" color="subdued" style={{ flex: 1, marginBottom: 12 }}>{card.desc}</EuiText>
                              <div>
                                <EuiButtonEmpty size="xs" color="primary" flush="left">
                                  {card.action}
                                </EuiButtonEmpty>
                              </div>
                            </EuiPanel>
                          </EuiFlexItem>
                        ))}
                      </EuiFlexGroup>
                    </div>{/* end bordered container */}

                    {/* Rules table */}
                    <EuiBasicTable
                      items={pageRules}
                      columns={[
                        {
                          field: 'name',
                          name: 'Rule name',
                          render: (name: string) => (
                            <EuiLink href="#">
                              <EuiText size="s" style={{ fontWeight: 600 }}>{name}</EuiText>
                            </EuiLink>
                          ),
                        },
                        {
                          name: '',
                          width: '110px',
                          render: () => (
                            <EuiFlexGroup gutterSize="xs" responsive={false}>
                              <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow" iconType="visGauge" iconSide="left">0/2</EuiBadge>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow" iconType="tag" iconSide="left">4</EuiBadge>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          ),
                        },
                        {
                          field: 'riskScore',
                          name: 'Risk score',
                          width: '100px',
                          render: (score: number) => <EuiText size="s">{score || 123}</EuiText>,
                        },
                        {
                          field: 'severity',
                          name: 'Severity',
                          width: '110px',
                          render: (severity: string) => (
                            <EuiHealth color={getSeverityColor(severity)}>
                              {severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'High'}
                            </EuiHealth>
                          ),
                        },
                        {
                          name: '',
                          width: '80px',
                          render: () => (
                            <EuiButtonEmpty size="xs" color="primary" flush="right">Install</EuiButtonEmpty>
                          ),
                        },
                        {
                          name: '',
                          width: '40px',
                          render: () => (
                            <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" size="xs" color="text" />
                          ),
                        },
                      ]}
                      itemId="id"
                      selection={{
                        selectable: () => true,
                        onSelectionChange: () => {},
                      }}
                      pagination={{
                        pageIndex: 0,
                        pageSize: 10,
                        totalItemCount: rules.length,
                        pageSizeOptions: [10, 25, 50],
                        showPerPageOptions: true,
                      }}
                      onChange={() => {}}
                    />
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

export default AddElasticRulesPage;
