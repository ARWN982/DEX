import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiModal,
  EuiOverlayMask,
  EuiRange,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

export interface AutoDexConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = 'automation' | 'model' | 'schedule';

const NAV_ITEMS: { id: NavItem; label: string; icon: string }[] = [
  { id: 'automation', label: 'Automation scope', icon: 'gear' },
  { id: 'model', label: 'Model settings', icon: 'compute' },
  { id: 'schedule', label: 'Schedule', icon: 'clock' },
];

interface SettingCardProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

const SettingCard: React.FC<SettingCardProps> = ({ label, description, checked, onChange, children }) => (
  <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, padding: '14px 16px', marginBottom: 10, background: 'white' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#516381', lineHeight: '18px' }}>{description}</div>
      </div>
      <EuiSwitch label="" checked={checked} onChange={e => onChange(e.target.checked)} compressed />
    </div>
    {children && checked && (
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E3E8F2' }}>
        {children}
      </div>
    )}
  </div>
);

const AutoDexConfigureModal: React.FC<AutoDexConfigureModalProps> = ({ isOpen, onClose }) => {
  const [activeNav, setActiveNav] = useState<NavItem>('automation');

  // Automation scope
  const [autoFixFailures, setAutoFixFailures] = useState(true);
  const [autoTuneNoise, setAutoTuneNoise] = useState(true);
  const [autoInstallRules, setAutoInstallRules] = useState(true);
  const [autoUpdateRules, setAutoUpdateRules] = useState(true);
  const [levelFixFailures, setLevelFixFailures] = useState(2);
  const [levelTuneNoise, setLevelTuneNoise] = useState(2);
  const [levelInstallRules, setLevelInstallRules] = useState(3);
  const [levelUpdateRules, setLevelUpdateRules] = useState(2);

  // Model settings
  const [verboseReasoning, setVerboseReasoning] = useState(true);
  const [explainChanges, setExplainChanges] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(2);
  const [maxTokens, setMaxTokens] = useState(2);

  // Schedule
  const [runOnSave, setRunOnSave] = useState(false);
  const [pauseWeekends, setPauseWeekends] = useState(true);
  const [frequency, setFrequency] = useState('daily');
  const [timeWindow, setTimeWindow] = useState('business');

  if (!isOpen) return null;

  const levelDesc = (v: number) =>
    v === 1 ? 'Surfaces recommendations only. No changes without approval.' :
    v === 2 ? 'Low-risk changes applied automatically; high-risk queued for approval.' :
              'All changes applied automatically. Review anytime in logs.';

  const renderAutomation = () => (
    <div>
      <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>
        Choose which actions AutoDEX can perform and how autonomously.
      </EuiText>

      <SettingCard
        label="Fix execution failures"
        description="Resolve index pattern mismatches and query errors automatically."
        checked={autoFixFailures}
        onChange={setAutoFixFailures}
      >
        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8, color: '#343741' }}>Automation level</EuiText>
        <EuiRange min={1} max={3} value={levelFixFailures} onChange={e => setLevelFixFailures(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Suggest', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
        <EuiText size="xs" color="subdued" style={{ marginTop: 6 }}>{levelDesc(levelFixFailures)}</EuiText>
      </SettingCard>

      <SettingCard
        label="Tune high false-positive rules"
        description="Add exceptions and threshold adjustments based on alert patterns."
        checked={autoTuneNoise}
        onChange={setAutoTuneNoise}
      >
        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8, color: '#343741' }}>Automation level</EuiText>
        <EuiRange min={1} max={3} value={levelTuneNoise} onChange={e => setLevelTuneNoise(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Suggest', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
        <EuiText size="xs" color="subdued" style={{ marginTop: 6 }}>{levelDesc(levelTuneNoise)}</EuiText>
      </SettingCard>

      <SettingCard
        label="Install new Elastic prebuilt rules"
        description="Install rules that fill detected MITRE ATT&CK coverage gaps."
        checked={autoInstallRules}
        onChange={setAutoInstallRules}
      >
        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8, color: '#343741' }}>Automation level</EuiText>
        <EuiRange min={1} max={3} value={levelInstallRules} onChange={e => setLevelInstallRules(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Suggest', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
        <EuiText size="xs" color="subdued" style={{ marginTop: 6 }}>{levelDesc(levelInstallRules)}</EuiText>
      </SettingCard>

      <SettingCard
        label="Update existing Elastic rules"
        description="Apply new versions of installed prebuilt rules when available."
        checked={autoUpdateRules}
        onChange={setAutoUpdateRules}
      >
        <EuiText size="xs" style={{ fontWeight: 600, marginBottom: 8, color: '#343741' }}>Automation level</EuiText>
        <EuiRange min={1} max={3} value={levelUpdateRules} onChange={e => setLevelUpdateRules(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Suggest', value: 1 }, { label: 'Semi-auto', value: 2 }, { label: 'Full auto', value: 3 }]} fullWidth />
        <EuiText size="xs" color="subdued" style={{ marginTop: 6 }}>{levelDesc(levelUpdateRules)}</EuiText>
      </SettingCard>
    </div>
  );

  const renderModel = () => (
    <div>
      <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>
        Control how AutoDEX reasons about and explains its actions.
      </EuiText>

      <SettingCard
        label="Verbose reasoning"
        description="Include full diagnosis, decision rationale, and change explanations in logs."
        checked={verboseReasoning}
        onChange={setVerboseReasoning}
      />

      <SettingCard
        label="Explain changes before applying"
        description="Show a plain-language summary of what will change before AutoDEX acts."
        checked={explainChanges}
        onChange={setExplainChanges}
      />

      <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, padding: '14px 16px', marginBottom: 10, background: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Confidence threshold</div>
        <div style={{ fontSize: 13, color: '#516381', lineHeight: '18px', marginBottom: 14 }}>
          Minimum confidence required before AutoDEX acts automatically.
        </div>
        <EuiRange min={1} max={3} value={confidenceThreshold} onChange={e => setConfidenceThreshold(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Low (60%)', value: 1 }, { label: 'Medium (80%)', value: 2 }, { label: 'High (95%)', value: 3 }]} fullWidth />
      </div>

      <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, padding: '14px 16px', marginBottom: 10, background: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Token budget per run</div>
        <div style={{ fontSize: 13, color: '#516381', lineHeight: '18px', marginBottom: 14 }}>
          Controls how deeply AutoDEX analyses each issue per scheduled run.
        </div>
        <EuiRange min={1} max={3} value={maxTokens} onChange={e => setMaxTokens(Number((e.target as HTMLInputElement).value))}
          showTicks tickInterval={1} ticks={[{ label: 'Efficient', value: 1 }, { label: 'Balanced', value: 2 }, { label: 'Thorough', value: 3 }]} fullWidth />
        <EuiText size="xs" color="subdued" style={{ marginTop: 6 }}>
          {maxTokens === 1 ? 'Faster runs, lower cost. Best for high-frequency schedules.' :
           maxTokens === 2 ? 'Good balance of depth and speed for most environments.' :
                            'Deep analysis of every issue. Best for daily or weekly runs.'}
        </EuiText>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div>
      <EuiText size="s" color="subdued" style={{ marginBottom: 16 }}>
        Control when and how often AutoDEX runs its analysis.
      </EuiText>

      <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, padding: '14px 16px', marginBottom: 10, background: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Run frequency</div>
        <div style={{ fontSize: 13, color: '#516381', marginBottom: 12 }}>How often AutoDEX scans and acts.</div>
        <EuiSelect
          options={[
            { value: 'hourly', text: 'Every hour' },
            { value: 'every6h', text: 'Every 6 hours' },
            { value: 'daily', text: 'Once a day' },
            { value: 'weekly', text: 'Once a week' },
          ]}
          value={frequency}
          onChange={e => setFrequency(e.target.value)}
          compressed
        />
      </div>

      <div style={{ border: '1px solid #CAD3E2', borderRadius: 6, padding: '14px 16px', marginBottom: 10, background: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Active time window</div>
        <div style={{ fontSize: 13, color: '#516381', marginBottom: 12 }}>Restrict AutoDEX to run only during certain hours.</div>
        <EuiSelect
          options={[
            { value: 'always', text: 'Always (24/7)' },
            { value: 'business', text: 'Business hours (09:00–18:00)' },
            { value: 'night', text: 'Off-hours only (18:00–09:00)' },
            { value: 'custom', text: 'Custom window…' },
          ]}
          value={timeWindow}
          onChange={e => setTimeWindow(e.target.value)}
          compressed
        />
      </div>

      <SettingCard
        label="Run immediately on rule save"
        description="Trigger an AutoDEX scan whenever a detection rule is modified or created."
        checked={runOnSave}
        onChange={setRunOnSave}
      />

      <SettingCard
        label="Pause on weekends"
        description="Skip scheduled runs on Saturdays and Sundays."
        checked={pauseWeekends}
        onChange={setPauseWeekends}
      />
    </div>
  );

  return (
    <EuiOverlayMask>
      <EuiModal onClose={onClose} style={{ width: 860, maxWidth: '95vw', maxHeight: '85vh' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', gap: 8 }}>
          <EuiIcon type="sparkles" color="#7B61FF" />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111C2C' }}>AutoDEX Configuration</span>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'flex', height: 520, overflow: 'hidden' }}>

          {/* Left nav */}
          <div style={{ width: 200, borderRight: '1px solid #E3E8F2', padding: '16px 0', flexShrink: 0, background: '#F6F9FC' }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', cursor: 'pointer',
                    borderLeft: isActive ? '3px solid #1750BA' : '3px solid transparent',
                    background: isActive ? '#EEF4FF' : 'transparent',
                    color: isActive ? '#1750BA' : '#343741',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  <EuiIcon type={item.icon} size="s" color={isActive ? '#1750BA' : '#69707D'} />
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <EuiTitle size="xs">
                <h3>{NAV_ITEMS.find(n => n.id === activeNav)?.label}</h3>
              </EuiTitle>
            </div>
            {activeNav === 'automation' && renderAutomation()}
            {activeNav === 'model'      && renderModel()}
            {activeNav === 'schedule'   && renderSchedule()}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #E3E8F2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
          <EuiButton fill color="primary" onClick={onClose}>Save configuration</EuiButton>
        </div>
      </EuiModal>
    </EuiOverlayMask>
  );
};

export default AutoDexConfigureModal;
