import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCodeBlock,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTextArea,
  EuiTitle,
  EuiBadge,
  EuiComboBox,
  EuiHealth,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';

const severityOptions = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

const scanOptions = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'indicator', label: 'Indicator match' },
];

const StepBadge: React.FC<{ number: number; label: string }> = ({ number, label }) => (
  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
    <EuiFlexItem grow={false}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#1976d2',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}>
        {number}
      </div>
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiTitle size="s"><h2>{label}</h2></EuiTitle>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const RuleCreationPage: React.FC = () => {
  const navigate = useNavigate();

  // Section 1 - Rule logic
  const [esqlQuery, setEsqlQuery] = useState('FROM logs-* | WHERE event.action == "login_failed"');
  const [severity, setSeverity] = useState('medium');
  const [suppressionEnabled, setSuppressionEnabled] = useState(false);
  const [scanTab, setScanTab] = useState('schedule');
  const [indexPatterns, setIndexPatterns] = useState<Array<{ label: string }>>([
    { label: 'logs-*' },
    { label: 'filebeat-*' },
  ]);

  // Section 2 - Details
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [language] = useState('ES|QL');
  const [timestampOverride, setTimestampOverride] = useState(false);
  const [applyToAlert, setApplyToAlert] = useState(false);
  const [setTimeForRun, setSetTimeForRun] = useState(false);

  // Section 3 - Alert experience
  const [riskScore, setRiskScore] = useState(47);
  const [alertSuppression, setAlertSuppression] = useState('Per rule run');
  const [author, setAuthor] = useState('Elastic');

  // Section 4 - Schedule
  const [runEvery, setRunEvery] = useState(5);
  const [runEveryUnit, setRunEveryUnit] = useState('m');
  const [lookBack, setLookBack] = useState(1);
  const [lookBackUnit, setLookBackUnit] = useState('m');
  const [maxAlerts, setMaxAlerts] = useState(100);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return 'warning';
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
          {/* Secondary Navigation — sticky, never scrolls */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel
              paddingSize="none"
              hasShadow={true}
              style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}
            >
              <RulesSecondaryNav
                selectedSection="installed"
                onSectionChange={() => {}}
              />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main Content Panel — scrollable */}
          <EuiFlexItem style={{ height: '100%', minWidth: 0 }}>
            <EuiPanel
              paddingSize="none"
              hasShadow={true}
              style={{ borderRadius: 8, height: '100%', overflowY: 'auto' }}
            >
              <div style={{ padding: 24 }}>
                {/* Back button + title */}
                <EuiButtonEmpty
                  iconType="arrowLeft"
                  size="s"
                  onClick={() => navigate('/detection-rules')}
                  style={{ marginBottom: 8 }}
                >
                  Rules
                </EuiButtonEmpty>

                <EuiTitle size="l"><h1>Detection rule creation</h1></EuiTitle>
                <EuiSpacer size="l" />

        <div style={{ maxWidth: '50%' }}>

        {/* ── SECTION 1: Rule logic ── */}
        <EuiPanel hasBorder hasShadow={false} paddingSize="none">
          {/* Panel header bar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #d3dae6',
            background: '#f5f7fa',
            borderRadius: '6px 6px 0 0',
          }}>
            <EuiTitle size="s"><h2>Rule evaluation</h2></EuiTitle>
          </div>

          {/* Panel content */}
          <div style={{ padding: '24px' }}>

          {/* Rule type */}
          <EuiText size="s" style={{ fontWeight: 700, marginBottom: 8 }}>
            Rule type
          </EuiText>

          {/* Outer card — light grey background */}
          <div style={{
            background: '#f5f7fa',
            border: '1px solid #d3dae6',
            borderRadius: 6,
            padding: '12px 16px',
          }}>
            {/* Header row */}
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}>
              <EuiFlexItem>
                <EuiText size="s" style={{ fontWeight: 700 }}>Custom query</EuiText>
                <EuiText size="xs" color="subdued">
                  Use KQL or Lucene to define a text-based query.
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="xs" iconType="cross" iconSide="left" color="primary" flush="right">
                  Change
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="m" />

            {/* Inner card — white background with left accent border */}
            <div style={{
              background: '#fff',
              border: '1px solid #d3dae6',
              borderLeft: '3px solid #d3dae6',
              borderRadius: 4,
              padding: '10px 16px',
            }}>
              <EuiText size="xs" color="subdued" style={{ marginBottom: 6 }}>
                Query Language
              </EuiText>
              <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
                <EuiFlexItem>
                  <EuiText size="s" style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>
                    ES|QL
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="xs" iconType="cross" iconSide="left" color="primary" flush="right">
                    Change
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          </div>

          <EuiSpacer size="l" />

          {/* Base query */}
          <EuiText size="s" style={{ fontWeight: 700, marginBottom: 8 }}>
            Base query
          </EuiText>
          <EuiCodeBlock
            language="sql"
            fontSize="s"
            paddingSize="m"
            lineNumbers
            overflowHeight={140}
          >
{`FROM metrics-us-east-1:traces-apm-default
| STATS cpu = AVG(CPU) BY host.name


`}
          </EuiCodeBlock>

          <EuiSpacer size="l" />

          {/* Time field */}
          <EuiFormRow
            label="Time field"
            fullWidth
          >
            <EuiSelect
              fullWidth
              prepend={
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="iInCircle" size="s" />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">Timestamp</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
              options={[
                { value: 'event.ingested', text: 'Event ingested' },
                { value: '@timestamp', text: '@timestamp' },
              ]}
            />
          </EuiFormRow>
          <EuiText size="xs" color="subdued">
            Select the timestamp field to use for time-based queries
          </EuiText>

          <EuiSpacer size="l" />

          {/* Exceptions */}
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="s" style={{ fontWeight: 700 }}>Exceptions</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued">Optional</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <EuiButtonEmpty size="s" iconType="plusInCircle" iconSide="left" color="primary" flush="left">
            Add exception
          </EuiButtonEmpty>

          </div>
        </EuiPanel>

        <EuiSpacer size="l" />

        {/* ── SECTION 2: Details ── */}
        <EuiPanel hasBorder hasShadow={false} paddingSize="none">
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #d3dae6',
            background: '#f5f7fa',
            borderRadius: '6px 6px 0 0',
          }}>
            <EuiTitle size="s"><h2>Details</h2></EuiTitle>
          </div>
          <div style={{ padding: 24 }}>

          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow label="Rule name" fullWidth>
                <EuiFieldText
                  placeholder="Enter rule name"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  fullWidth
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          <EuiFormRow label="Description" fullWidth>
            <EuiTextArea
              placeholder="Describe the rule..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              rows={3}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Language">
            <EuiFieldText value={language} readOnly />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Mapping champion">
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiBadge color="primary">ECS Compliant</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Additional lookup indices">
            <EuiComboBox
              placeholder="Add index"
              selectedOptions={[]}
              onChange={() => {}}
              onCreateOption={() => {}}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Rule override">
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  options={[
                    { value: 'none', text: 'None' },
                    { value: 'field', text: 'Field value' },
                  ]}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">Vendor</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="">
            <EuiSwitch
              label="Timestamp override"
              checked={timestampOverride}
              onChange={(e) => setTimestampOverride(e.target.checked)}
            />
          </EuiFormRow>

          <EuiSpacer size="s" />

          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButton size="s" iconType="plusInCircle">Add exceptions</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          <EuiFormRow label="">
            <EuiSwitch
              label="Do you want to apply this rule to alert?"
              checked={applyToAlert}
              onChange={(e) => setApplyToAlert(e.target.checked)}
            />
          </EuiFormRow>

          <EuiSpacer size="s" />

          <EuiFormRow label="">
            <EuiSwitch
              label="Set time for run on alert"
              checked={setTimeForRun}
              onChange={(e) => setSetTimeForRun(e.target.checked)}
            />
          </EuiFormRow>
          </div>
        </EuiPanel>

        <EuiSpacer size="l" />

        {/* ── SECTION 3: Alert experience ── */}
        <EuiPanel hasBorder hasShadow={false} paddingSize="none">
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #d3dae6',
            background: '#f5f7fa',
            borderRadius: '6px 6px 0 0',
          }}>
            <EuiTitle size="s"><h2>Alert experience</h2></EuiTitle>
          </div>
          <div style={{ padding: 24 }}>

          <EuiText size="s" color="subdued">
            Set risk score on severity
          </EuiText>
          <EuiSpacer size="m" />

          <EuiFlexGroup gutterSize="xl">
            <EuiFlexItem>
              <EuiFormRow label="Risk score">
                <EuiRange
                  min={0}
                  max={100}
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number((e.target as HTMLInputElement).value))}
                  showValue
                  showRange
                  fullWidth
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow label="Severity">
                <EuiHealth color={getSeverityColor(severity)}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </EuiHealth>
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          <EuiFormRow label="Alert suppression">
            <EuiSelect
              options={[
                { value: 'per_rule_run', text: 'Per rule run' },
                { value: 'per_time_period', text: 'Per time period' },
              ]}
              value={alertSuppression}
              onChange={(e) => setAlertSuppression(e.target.value)}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Alert tag health">
            <EuiSelect
              options={[
                { value: 'none', text: 'None' },
                { value: 'low', text: 'Low' },
                { value: 'medium', text: 'Medium' },
                { value: 'high', text: 'High' },
              ]}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Use case for context messages">
            <EuiText size="s" color="subdued">
              Do not include context messages for this rule
            </EuiText>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Timeline template">
            <EuiSelect
              options={[
                { value: 'none', text: 'None' },
                { value: 'generic', text: 'Generic Threat Investigation' },
              ]}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Investigations">
            <EuiButton size="s" iconType="plusInCircle">Add investigation</EuiButton>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Author">
            <EuiFieldText
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Expiration information">
            <EuiButton size="s" iconType="plusInCircle">Add expiration</EuiButton>
          </EuiFormRow>
          </div>
        </EuiPanel>

        <EuiSpacer size="l" />

        {/* ── SECTION 4: Schedule ── */}
        <EuiPanel hasBorder hasShadow={false} paddingSize="none">
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #d3dae6',
            background: '#f5f7fa',
            borderRadius: '6px 6px 0 0',
          }}>
            <EuiTitle size="s"><h2>Schedule</h2></EuiTitle>
          </div>
          <div style={{ padding: 24 }}>

          <EuiFormRow label="How often do you want to run this rule?">
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiFieldNumber
                  value={runEvery}
                  onChange={(e) => setRunEvery(Number(e.target.value))}
                  min={1}
                  style={{ width: 80 }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  options={[
                    { value: 's', text: 'Seconds' },
                    { value: 'm', text: 'Minutes' },
                    { value: 'h', text: 'Hours' },
                  ]}
                  value={runEveryUnit}
                  onChange={(e) => setRunEveryUnit(e.target.value)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">last</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="How long do you want to look back?">
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiFieldNumber
                  value={lookBack}
                  onChange={(e) => setLookBack(Number(e.target.value))}
                  min={1}
                  style={{ width: 80 }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  options={[
                    { value: 's', text: 'Seconds' },
                    { value: 'm', text: 'Minutes' },
                    { value: 'h', text: 'Hours' },
                  ]}
                  value={lookBackUnit}
                  onChange={(e) => setLookBackUnit(e.target.value)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>

          <EuiSpacer size="m" />

          <EuiFormRow label="Max alerts per execution">
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiFieldNumber
                  value={maxAlerts}
                  onChange={(e) => setMaxAlerts(Number(e.target.value))}
                  min={1}
                  style={{ width: 100 }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
          </div>
        </EuiPanel>

        </div>

        <EuiSpacer size="l" />

        {/* Footer actions */}
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={() => navigate('/detection-rules')}>
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={() => navigate('/detection-rules')}>
              Save
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

                <EuiSpacer size="l" />
              </div>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
};

export default RuleCreationPage;
