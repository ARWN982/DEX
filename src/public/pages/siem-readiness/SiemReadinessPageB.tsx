import React from 'react';
import {
  EuiEmptyPrompt,
  EuiText,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';

const SiemReadinessPageB: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 48 }}>
      <EuiEmptyPrompt
        iconType="logoSecurity"
        iconColor="default"
        title={<h2>New SIEM Readiness Design</h2>}
        titleSize="m"
        body={
          <EuiText color="subdued" size="s">
            <p>This is Option B — the new SIEM Readiness page design. Add your new layout here.</p>
          </EuiText>
        }
      />
    </div>
  );
};

export default SiemReadinessPageB;
