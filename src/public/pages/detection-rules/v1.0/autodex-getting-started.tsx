import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EuiButton,
  EuiIcon,
  EuiPanel,
  EuiRange,
  EuiSelect,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';

// ── Reusable toggle ──────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: checked ? '#1750BA' : '#CAD3E2', position: 'relative', transition: 'background 0.2s',
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: checked ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
    }} />
  </div>
);

const levelDesc = (v: number) =>
  v === 1 ? 'Surfaces recommendations only. No changes without your approval.' :
  v === 2 ? 'Low risk changes applied automatically; high risk queued for approval.' :
            'All changes applied automatically. Review anytime in logs.';

// ── Scope items ──────────────────────────────────────────────────────────────
const SCOPE_ITEMS = [
  { id: 'failures', icon: 'alert',          iconColor: '#BD271E', title: 'Fix execution failures',             defaultLevel: 2, defaultOn: true,  desc: 'Automatically diagnose and repair rules that are failing silently.' },
  { id: 'tuning',   icon: 'stats',           iconColor: '#7B61FF', title: 'Tune high false positive rules',     defaultLevel: 2, defaultOn: true,  desc: 'Identify rules generating noise and apply targeted exceptions or threshold adjustments.' },
  { id: 'install',  icon: 'plusInCircle',    iconColor: '#0B64DD', title: 'Install new Elastic prebuilt rules', defaultLevel: 3, defaultOn: true,  desc: 'Discover and install Elastic prebuilt rules that fill gaps in your MITRE coverage.' },
  { id: 'update',   icon: 'refresh',         iconColor: '#017D73', title: 'Update existing Elastic rules',      defaultLevel: 2, defaultOn: true,  desc: 'Apply new versions of installed prebuilt rules released by Elastic Security Labs.' },
];

// ── Page ─────────────────────────────────────────────────────────────────────
const AutoDexGettingStartedPage: React.FC = () => {
  const navigate = useNavigate();

  // Scope: per-item toggle + automation level
  const [scope, setScope]   = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SCOPE_ITEMS.map(i => [i.id, i.defaultOn]))
  );
  const [levels, setLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCOPE_ITEMS.map(i => [i.id, i.defaultLevel]))
  );
  const toggleScope = (id: string) => setScope(prev => ({ ...prev, [id]: !prev[id] }));
  const setLevel    = (id: string, v: number) => setLevels(prev => ({ ...prev, [id]: v }));

  // Schedule
  const [frequency,      setFrequency]      = useState('daily');
  const [timeWindow,     setTimeWindow]      = useState('business');
  const [runOnSave,      setRunOnSave]       = useState(false);
  const [pauseWeekends,  setPauseWeekends]   = useState(true);

  return (
    <>
      <style>{`
        .adx-gs input[type=range]::-webkit-slider-thumb { background: #1750BA !important; }
        .adx-gs input[type=range]::-moz-range-thumb    { background: #1750BA !important; border-color: #1750BA !important; }
        .adx-gs .euiRangeTick { font-size: 11px; }
      `}</style>

      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      <div style={{ backgroundColor: '#F6F9FC', position: 'absolute', top: 48, left: 80, right: 0, bottom: 0, padding: 8, overflow: 'hidden', display: 'flex', gap: 8 }}>

        {/* Secondary nav */}
        <div style={{ flexShrink: 0, height: '100%' }}>
          <EuiPanel paddingSize="none" hasShadow style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
            <RulesSecondaryNav />
          </EuiPanel>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
          <EuiPanel paddingSize="none" hasShadow className="adx-gs" style={{ borderRadius: 8, minHeight: '100%', background: 'white' }}>
            <div style={{ maxWidth: 920, margin: '0 auto', padding: '56px 40px 80px' }}>

              {/* ── Hero ── */}
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <img src="/images/autodex-illustration.png" alt="" style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto 20px' }} />
                <EuiTitle size="l">
                  <h1 style={{ margin: '0 0 16px', color: '#111C2C', fontWeight: 700 }}>Getting started with AutoDEX</h1>
                </EuiTitle>
                <EuiText color="subdued" style={{ fontSize: 14, lineHeight: '22px', margin: '0 auto' }}>
                  AutoDEX is your AI powered detection engineer. It monitors your ruleset around the clock, diagnoses failures, reduces false positive noise, and keeps your Elastic rules up to date so your team can focus on real threats.
                </EuiText>
              </div>

              {/* ── Step 1: Define the scope ── */}
              <section style={{ marginBottom: 52 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#1750BA', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                  <EuiTitle size="m"><h2 style={{ margin: 0, color: '#111C2C' }}>Define the scope</h2></EuiTitle>
                </div>
                <p style={{ fontSize: 14, color: '#69707D', marginBottom: 24, paddingLeft: 40 }}>
                  Choose which actions AutoDEX can take and set the automation level for each one individually.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {SCOPE_ITEMS.map(item => {
                    const isOn = scope[item.id];
                    const lvl  = levels[item.id];
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid #CAD3E2',
                          borderRadius: 8,
                          background: 'white',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${item.iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <EuiIcon type={item.icon} size="s" color={item.iconColor} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C' }}>{item.title}</div>
                            </div>
                          </div>
                          <Toggle checked={isOn} onChange={() => toggleScope(item.id)} />
                        </div>

                        {/* Automation level — always visible when enabled */}
                        {isOn && (
                          <div style={{ padding: '0 16px 14px', borderTop: '1px solid #E3E8F2' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#69707D', margin: '12px 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Automation level</div>
                            <EuiRange
                              min={1} max={3} value={lvl}
                              onChange={e => setLevel(item.id, Number((e.target as HTMLInputElement).value))}
                              showTicks tickInterval={1}
                              ticks={[{ label: 'Suggest', value: 1 }, { label: 'Semi auto', value: 2 }, { label: 'Full auto', value: 3 }]}
                              fullWidth
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Step 2: Schedule ── */}
              <section style={{ marginBottom: 56 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#1750BA', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                  <EuiTitle size="m"><h2 style={{ margin: 0, color: '#111C2C' }}>Schedule</h2></EuiTitle>
                </div>
                <p style={{ fontSize: 14, color: '#69707D', marginBottom: 24, paddingLeft: 40 }}>Control when and how often AutoDEX runs.</p>

                <div style={{ border: '1px solid #CAD3E2', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Run frequency */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Run frequency</div>
                      <div style={{ fontSize: 13, color: '#69707D' }}>How often AutoDEX scans and acts on your ruleset.</div>
                    </div>
                    <EuiSelect
                      compressed
                      style={{ minWidth: 220 }}
                      options={[
                        { value: 'hourly',   text: 'Every hour' },
                        { value: 'every6h', text: 'Every 6 hours' },
                        { value: 'daily',    text: 'Once a day' },
                        { value: 'weekly',   text: 'Once a week' },
                      ]}
                      value={frequency}
                      onChange={e => setFrequency(e.target.value)}
                    />
                  </div>

                  {/* Active time window */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Active time window</div>
                      <div style={{ fontSize: 13, color: '#69707D' }}>Restrict AutoDEX to run only during certain hours.</div>
                    </div>
                    <EuiSelect
                      compressed
                      style={{ minWidth: 220 }}
                      options={[
                        { value: 'always',   text: 'Always (24/7)' },
                        { value: 'business', text: 'Business hours (09:00 to 18:00)' },
                        { value: 'night',    text: 'Off hours only (18:00 to 09:00)' },
                      ]}
                      value={timeWindow}
                      onChange={e => setTimeWindow(e.target.value)}
                    />
                  </div>

                  {/* Run on save */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #E3E8F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Run immediately on rule save</div>
                      <div style={{ fontSize: 13, color: '#69707D' }}>Trigger a scan whenever a detection rule is modified or created.</div>
                    </div>
                    <Toggle checked={runOnSave} onChange={setRunOnSave} />
                  </div>

                  {/* Pause weekends */}
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111C2C', marginBottom: 3 }}>Pause on weekends</div>
                      <div style={{ fontSize: 13, color: '#69707D' }}>Skip scheduled runs on Saturdays and Sundays.</div>
                    </div>
                    <Toggle checked={pauseWeekends} onChange={setPauseWeekends} />
                  </div>
                </div>
              </section>

              {/* ── Enable button ── */}
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <p style={{ fontSize: 14, color: '#69707D', margin: '0 0 20px' }}>
                  AutoDEX will start on your next scheduled run. You can pause or reconfigure it at any time from the AutoDEX dashboard.
                </p>
                <EuiButton
                  fill
                  size="m"
                  onClick={() => {
                    localStorage.setItem('autodex-enabled', 'true');
                    navigate('/autodex');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0B64DD, #7B61FF)',
                    border: 'none',
                    padding: '0 40px',
                    fontSize: 16,
                    fontWeight: 700,
                    height: 48,
                    borderRadius: 10,
                    minWidth: 220,
                  }}
                >
                  Enable AutoDEX
                </EuiButton>
              </div>

            </div>
          </EuiPanel>
        </div>
      </div>
    </>
  );
};

export default AutoDexGettingStartedPage;
