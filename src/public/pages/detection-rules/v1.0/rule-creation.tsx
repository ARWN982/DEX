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
  EuiRadioGroup,
  EuiCheckbox,
  EuiButtonIcon,
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
  const [scheduleStart, setScheduleStart] = useState('when_enabled');
  const [customTags, setCustomTags] = useState<Array<{ label: string }>>([]);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const [riskScoreOverride, setRiskScoreOverride] = useState(false);
  const [severityOverride, setSeverityOverride] = useState(false);
  const [suppressionField, setSuppressionField] = useState('');
  const [suppressionDuration, setSuppressionDuration] = useState('per_execution');
  const [missingFieldAction, setMissingFieldAction] = useState('suppress');
  const [alertAdvancedOpen, setAlertAdvancedOpen] = useState(false);
  const [showElasticRequests, setShowElasticRequests] = useState(false);
  const [previewTimeframe, setPreviewTimeframe] = useState('last_1_hour');

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

                {/* Two-column layout: forms left, preview right */}
                <EuiFlexGroup gutterSize="l" alignItems="flexStart" responsive={false}>
                <EuiFlexItem>
                {/* LEFT COLUMN — all form sections */}

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

            {/* Rule Name */}
            <EuiFormRow label={<EuiText size="s"><strong>Rule Name</strong></EuiText>} fullWidth>
              <EuiFieldText
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                fullWidth
              />
            </EuiFormRow>

            <EuiSpacer size="m" />

            {/* Description */}
            <EuiFormRow label={<EuiText size="s"><strong>Description</strong></EuiText>} fullWidth>
              <EuiTextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                rows={3}
                resize="vertical"
              />
            </EuiFormRow>

            <EuiSpacer size="m" />

            {/* Custom tags */}
            <EuiFormRow
              label={<EuiText size="s"><strong>Custom tags</strong></EuiText>}
              helpText="Type one or more custom identifying tags for this rule. Press enter after each tag to begin a new one."
              fullWidth
            >
              <EuiComboBox
                placeholder=""
                selectedOptions={customTags}
                onChange={(opts) => setCustomTags(opts)}
                onCreateOption={(val) => setCustomTags([...customTags, { label: val }])}
                fullWidth
                noSuggestions
              />
            </EuiFormRow>

            <EuiSpacer size="l" />

            {/* Advanced options accordion */}
            <EuiButtonEmpty
              iconType={advancedOptionsOpen ? 'arrowDown' : 'arrowRight'}
              iconSide="left"
              size="s"
              color="primary"
              flush="left"
              onClick={() => setAdvancedOptionsOpen(!advancedOptionsOpen)}
            >
              Advanced options
            </EuiButtonEmpty>

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

            {/* Set the severity and risk score */}
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 700 }}>Set the severity and risk score</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIcon type="iInCircle" size="s" color="subdued" />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="m" />

            <EuiFlexGroup gutterSize="xl" responsive={false}>
              {/* Risk score slider */}
              <EuiFlexItem>
                <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8 }}>Risk score</EuiText>
                <EuiRange
                  min={0}
                  max={100}
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number((e.target as HTMLInputElement).value))}
                  showRange
                  showLabels
                  fullWidth
                />
              </EuiFlexItem>
              {/* Severity level */}
              <EuiFlexItem>
                <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8 }}>Severity level</EuiText>
                <EuiSelect
                  options={[
                    { value: 'low', text: 'Low' },
                    { value: 'medium', text: 'Medium' },
                    { value: 'high', text: 'High' },
                    { value: 'critical', text: 'Critical' },
                  ]}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  prepend={<EuiHealth color={getSeverityColor(severity)} />}
                />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="m" />

            <EuiFlexGroup gutterSize="xl" responsive={false}>
              {/* Risk score override */}
              <EuiFlexItem>
                <EuiCheckbox
                  id="risk-score-override"
                  label={<EuiText size="s" style={{ fontWeight: 600 }}>Risk score override</EuiText>}
                  checked={riskScoreOverride}
                  onChange={(e) => setRiskScoreOverride(e.target.checked)}
                />
                <EuiText size="xs" color="subdued" style={{ marginLeft: 24 }}>
                  Use a source event value to override the default risk score.
                </EuiText>
              </EuiFlexItem>
              {/* Severity override */}
              <EuiFlexItem>
                <EuiCheckbox
                  id="severity-override"
                  label={<EuiText size="s" style={{ fontWeight: 600 }}>Severity override</EuiText>}
                  checked={severityOverride}
                  onChange={(e) => setSeverityOverride(e.target.checked)}
                />
                <EuiText size="xs" color="subdued" style={{ marginLeft: 24 }}>
                  Use source event values to override the default severity.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="l" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />

            {/* Alert suppression */}
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 700 }}>Alert suppression</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiIcon type="iInCircle" size="s" color="subdued" />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="m" />

            <EuiFlexGroup gutterSize="xl" alignItems="flexStart" responsive={false}>
              {/* Left: suppression field + duration */}
              <EuiFlexItem>
                <EuiFormRow label={<EuiText size="xs" style={{ fontWeight: 600 }}>Select field(s) to use for suppressing extra alerts</EuiText>} fullWidth>
                  <EuiSelect
                    options={[
                      { value: '', text: 'Select a field' },
                      { value: 'host.name', text: 'host.name' },
                      { value: 'user.name', text: 'user.name' },
                    ]}
                    value={suppressionField}
                    onChange={(e) => setSuppressionField(e.target.value)}
                    fullWidth
                  />
                </EuiFormRow>
                <EuiSpacer size="s" />
                <EuiRadioGroup
                  options={[
                    { id: 'per_execution', label: 'Per rule execution' },
                    { id: 'per_time_period', label: 'Per time period' },
                  ]}
                  idSelected={suppressionDuration}
                  onChange={(id) => setSuppressionDuration(id)}
                />
                {suppressionDuration === 'per_time_period' && (
                  <>
                    <EuiSpacer size="s" />
                    <EuiFieldNumber
                      append="Minutes"
                      value={5}
                      onChange={() => {}}
                      style={{ maxWidth: 160 }}
                    />
                  </>
                )}
                {suppressionDuration === 'per_execution' && (
                  <>
                    <EuiSpacer size="s" />
                    <EuiFieldNumber
                      append="Minutes"
                      value={5}
                      onChange={() => {}}
                      style={{ maxWidth: 160 }}
                      disabled
                    />
                  </>
                )}
              </EuiFlexItem>

              {/* Right: missing field action */}
              <EuiFlexItem>
                <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8 }}>
                  What should we do if a suppression field is missing
                </EuiText>
                <EuiRadioGroup
                  options={[
                    { id: 'suppress', label: 'Suppress and group alerts for events with missing fields' },
                    { id: 'do_not_suppress', label: 'Do not suppress alerts for events with missing fields' },
                  ]}
                  idSelected={missingFieldAction}
                  onChange={(id) => setMissingFieldAction(id)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="l" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />

            {/* Actions */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 700 }}>Actions</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">Optional</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiButtonEmpty size="s" iconType="plusInCircle" iconSide="left" color="primary" flush="left">
              Add action
            </EuiButtonEmpty>

            <EuiSpacer size="l" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />

            {/* Response actions */}
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s" style={{ fontWeight: 700 }}>Response actions</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s" color="subdued">Optional</EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem>
                <EuiSelect
                  options={[{ value: '', text: 'Select' }]}
                  fullWidth
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon iconType="trash" aria-label="Delete" color="text" />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiButtonEmpty size="s" iconType="plusInCircle" iconSide="left" color="primary" flush="left">
              Add additional response action
            </EuiButtonEmpty>

            <EuiSpacer size="l" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="l" />

            {/* Advanced options */}
            <EuiButtonEmpty
              iconType={alertAdvancedOpen ? 'arrowDown' : 'arrowRight'}
              iconSide="left"
              size="s"
              color="primary"
              flush="left"
              onClick={() => setAlertAdvancedOpen(!alertAdvancedOpen)}
            >
              Advanced options
            </EuiButtonEmpty>

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

            {/* Interval */}
            <EuiFormRow label={<EuiText size="s"><strong>Interval</strong></EuiText>} fullWidth>
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={2}>
                  <EuiFieldNumber
                    prepend="Run every"
                    value={runEvery}
                    onChange={(e) => setRunEvery(Number(e.target.value))}
                    min={1}
                    fullWidth
                    placeholder="Number"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={1}>
                  <EuiSelect
                    options={[
                      { value: 's', text: 'seconds' },
                      { value: 'm', text: 'minutes' },
                      { value: 'h', text: 'hours' },
                    ]}
                    value={runEveryUnit}
                    onChange={(e) => setRunEveryUnit(e.target.value)}
                    fullWidth
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>

            <EuiSpacer size="m" />

            {/* Lookback window */}
            <EuiFormRow label={<EuiText size="s"><strong>Lookback window</strong></EuiText>} fullWidth>
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={2}>
                  <EuiFieldNumber
                    prepend="Last"
                    value={lookBack}
                    onChange={(e) => setLookBack(Number(e.target.value))}
                    min={1}
                    fullWidth
                    placeholder="Number"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={1}>
                  <EuiSelect
                    options={[
                      { value: 's', text: 'seconds' },
                      { value: 'm', text: 'minutes' },
                      { value: 'h', text: 'hours' },
                    ]}
                    value={lookBackUnit}
                    onChange={(e) => setLookBackUnit(e.target.value)}
                    fullWidth
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>

            <EuiSpacer size="l" />

            {/* Would you like to start the schedule? */}
            <EuiText size="s" style={{ fontWeight: 700, marginBottom: 12 }}>
              Would you like to start the schedule?
            </EuiText>

            <EuiRadioGroup
              options={[
                { id: 'when_enabled', label: 'When the rule is enabled' },
                { id: 'specific_time', label: 'On this specific date and time' },
              ]}
              idSelected={scheduleStart}
              onChange={(id) => setScheduleStart(id)}
            />

            {scheduleStart === 'specific_time' && (
              <>
                <EuiSpacer size="s" />
                <EuiFieldText
                  prepend={<EuiIcon type="calendar" />}
                  placeholder="11/07/2024 01:44 AM"
                  style={{ maxWidth: 240 }}
                />
              </>
            )}

          </div>
        </EuiPanel>

                {/* Footer buttons inside left column */}
                <EuiSpacer size="l" />
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

                </EuiFlexItem>

                {/* RIGHT COLUMN — Rule Preview (sticky) */}
                <EuiFlexItem grow={false} style={{ width: 360, flexShrink: 0 }}>
                  <div style={{ position: 'sticky', top: 0 }}>
                    <EuiPanel hasBorder hasShadow={false} paddingSize="none">
                      {/* Preview header */}
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #d3dae6',
                        background: '#f5f7fa',
                        borderRadius: '6px 6px 0 0',
                      }}>
                        <EuiTitle size="s"><h2>Rule Preview</h2></EuiTitle>
                      </div>

                      <div style={{ padding: 16 }}>
                        <EuiText size="s" color="subdued">
                          <p>
                            Rule preview reflects the current configuration of your rule settings and
                            exceptions, click refresh icon to see the updated preview.
                          </p>
                        </EuiText>

                        <EuiSpacer size="m" />

                        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8 }}>
                          Select a preview timeframe
                        </EuiText>
                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                          <EuiFlexItem>
                            <EuiSelect
                              prepend={
                                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                  <EuiFlexItem grow={false}>
                                    <EuiIcon type="calendar" size="s" />
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiIcon type="arrowDown" size="s" />
                                  </EuiFlexItem>
                                </EuiFlexGroup>
                              }
                              options={[
                                { value: 'last_1_hour', text: 'Last 1 hour' },
                                { value: 'last_24_hours', text: 'Last 24 hours' },
                                { value: 'last_7_days', text: 'Last 7 days' },
                              ]}
                              value={previewTimeframe}
                              onChange={(e) => setPreviewTimeframe(e.target.value)}
                              fullWidth
                            />
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiButton fill iconType="refresh" size="s">
                              Refresh
                            </EuiButton>
                          </EuiFlexItem>
                        </EuiFlexGroup>

                        <EuiSpacer size="m" />

                        <EuiCheckbox
                          id="show-elastic-requests"
                          label={
                            <EuiText size="s">
                              Show Elasticsearch requests, ran during rule executions
                            </EuiText>
                          }
                          checked={showElasticRequests}
                          onChange={(e) => setShowElasticRequests(e.target.checked)}
                        />

                        <EuiSpacer size="m" />

                        {/* Inner Rule Preview card */}
                        <EuiPanel hasBorder hasShadow={false} paddingSize="m">
                          <EuiText size="s" style={{ fontWeight: 700, marginBottom: 16 }}>
                            Rule Preview
                          </EuiText>

                          {/* Empty state */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 0',
                          }}>
                            <EuiIcon type="visBarVerticalStacked" size="xl" color="subdued" />
                            <EuiSpacer size="s" />
                            <EuiText size="s" color="subdued">No results found</EuiText>
                          </div>

                          <EuiSpacer size="s" />

                          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                              <EuiBadge color="danger" iconType="cross">2</EuiBadge>
                            </EuiFlexItem>
                          </EuiFlexGroup>

                          <EuiSpacer size="s" />

                          <EuiText size="xs" color="subdued">
                            Note: Alerts with multiple event.category values will be counted more than once.
                          </EuiText>
                        </EuiPanel>
                      </div>
                    </EuiPanel>
                  </div>
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

export default RuleCreationPage;
