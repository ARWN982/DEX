import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiRange,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

export interface AutoDexConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AutoDexConfigureModal: React.FC<AutoDexConfigureModalProps> = ({ isOpen, onClose }) => {
  const [autoFixFailures, setAutoFixFailures] = useState(true);
  const [autoTuneNoise, setAutoTuneNoise] = useState(true);
  const [autoInstallRules, setAutoInstallRules] = useState(true);
  const [autoUpdateRules, setAutoUpdateRules] = useState(true);
  const [levelFixFailures, setLevelFixFailures] = useState(2);
  const [levelTuneNoise, setLevelTuneNoise] = useState(2);
  const [levelInstallRules, setLevelInstallRules] = useState(3);
  const [levelUpdateRules, setLevelUpdateRules] = useState(2);

  if (!isOpen) return null;

  return (
    <EuiModal onClose={onClose} style={{ width: 672 }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon type="sparkles" color="#7B61FF" />
            </EuiFlexItem>
            <EuiFlexItem>AutoDEX Configuration</EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiHorizontalRule margin="none" />

      <EuiModalBody>
        <EuiSpacer size="xl" />
        <EuiTitle size="s">
          <h3>Automation scope</h3>
        </EuiTitle>
        <EuiSpacer size="xs" />
        <EuiText size="s" color="subdued">
          Choose which actions AutoDEX can perform automatically.
        </EuiText>
        <EuiSpacer size="l" />

        {[
          {
            label: 'Fix execution failures',
            desc: 'Automatically resolve index pattern mismatches and query errors.',
            value: autoFixFailures,
            set: setAutoFixFailures,
            level: levelFixFailures,
            setLevel: setLevelFixFailures,
          },
          {
            label: 'Tune high false positive rules',
            desc: 'Add exceptions and threshold adjustments based on alert patterns.',
            value: autoTuneNoise,
            set: setAutoTuneNoise,
            level: levelTuneNoise,
            setLevel: setLevelTuneNoise,
          },
          {
            label: 'Install new Elastic prebuilt rules',
            desc: 'Install rules that fill detected MITRE coverage gaps.',
            value: autoInstallRules,
            set: setAutoInstallRules,
            level: levelInstallRules,
            setLevel: setLevelInstallRules,
          },
          {
            label: 'Update existing Elastic rules',
            desc: 'Apply new versions of installed prebuilt rules automatically.',
            value: autoUpdateRules,
            set: setAutoUpdateRules,
            level: levelUpdateRules,
            setLevel: setLevelUpdateRules,
          },
        ].map(({ label, desc, value, set, level, setLevel }, i, arr) => (
          <div key={label} style={{ marginBottom: i < arr.length - 1 ? 28 : 8 }}>
            <EuiSwitch label={<strong>{label}</strong>} checked={value} onChange={(e) => set(e.target.checked)} />
            <EuiText size="s" color="subdued" style={{ marginTop: 4, marginLeft: 44, marginBottom: 16 }}>
              {desc}
            </EuiText>
            <div style={{ marginLeft: 44 }}>
              <EuiText size="s" style={{ fontWeight: 700, marginBottom: 8 }}>
                Automation level
              </EuiText>
              <EuiRange
                min={1}
                max={3}
                value={level}
                onChange={(e) => setLevel(Number((e.target as HTMLInputElement).value))}
                showTicks
                tickInterval={1}
                ticks={[
                  { label: 'Suggest only', value: 1 },
                  { label: 'Semi-auto', value: 2 },
                  { label: 'Full auto', value: 3 },
                ]}
                fullWidth
                disabled={!value}
              />
              <EuiSpacer size="s" />
              <EuiText size="xs" color="subdued">
                {level === 1 &&
                  'AutoDEX will only surface recommendations. No changes are made without your approval.'}
                {level === 2 &&
                  'AutoDEX applies low-risk changes automatically and queues high-risk actions for your approval.'}
                {level === 3 &&
                  'AutoDEX applies all changes automatically. You can review them in the logs at any time.'}
              </EuiText>
            </div>
          </div>
        ))}
        <EuiSpacer size="xl" />
      </EuiModalBody>

      <EuiHorizontalRule margin="none" />
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton fill color="primary" onClick={onClose}>
          Save configuration
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

export default AutoDexConfigureModal;
