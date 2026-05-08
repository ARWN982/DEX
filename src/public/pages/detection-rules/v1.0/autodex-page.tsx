import React, { useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import SecurityHeader from './components/SecurityHeader';
import SecuritySideNav from './components/SecuritySideNav';
import RulesSecondaryNav from './components/RulesSecondaryNav';
import AutoDexTabView from './components/AutoDexTabView';
import AutoDexConfigureModal from './components/AutoDexConfigureModal';

const AutoDexPage: React.FC = () => {
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <SecurityHeader onMenuClick={() => {}} />
      <SecuritySideNav />

      {/* Gray background container */}
      <div
        style={{
          backgroundColor: '#F6F9FC',
          height: 'calc(100vh - 56px)',
          marginTop: 48,
          marginLeft: 80,
          padding: 8,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart" style={{ flex: 1, minHeight: 0 }}>

          {/* Secondary navigation panel */}
          <EuiFlexItem grow={false} style={{ height: '100%' }}>
            <EuiPanel paddingSize="none" hasShadow={true} style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}>
              <RulesSecondaryNav />
            </EuiPanel>
          </EuiFlexItem>

          {/* Main content panel */}
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
              {/* Fixed header */}
              <div style={{ padding: '24px 24px 0 24px', flexShrink: 0 }}>

                {/* Title row */}
                <EuiFlexGroup alignItems="center" responsive={false} gutterSize="s" style={{ marginBottom: 12 }}>
                  {/* Title + Running badge */}
                  <EuiFlexItem grow={true}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <EuiText>
                        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1d2a3e' }}>
                          AutoDEX
                        </h1>
                      </EuiText>
                      <EuiBadge color="success" style={{ fontSize: 13, padding: '4px 10px' }}>
                        Running
                      </EuiBadge>
                    </div>
                  </EuiFlexItem>

                  {/* Configuration button */}
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconType="controlsHorizontal"
                      size="s"
                      onClick={() => setConfigureModalOpen(true)}
                    >
                      Configuration
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>

              </div>

              {/* Scrollable AutoDEX content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px 24px', minHeight: 0 }}>
                <AutoDexTabView onOpenAIAssistant={(prompt) => console.log('AI assistant:', prompt)} />
              </div>
            </EuiPanel>
          </EuiFlexItem>

        </EuiFlexGroup>
      </div>

      <AutoDexConfigureModal isOpen={configureModalOpen} onClose={() => setConfigureModalOpen(false)} />
    </div>
  );
};

export default AutoDexPage;
