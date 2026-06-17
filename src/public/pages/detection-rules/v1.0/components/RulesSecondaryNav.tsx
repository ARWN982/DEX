import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiHorizontalRule,
} from '@elastic/eui';

const RulesSecondaryNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{ width: 240, padding: '8px 12px', borderRight: '1px solid var(--euiBorderColor)', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '4px', marginBottom: '12px' }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#111c2c' }}>Rules</span>
      </div>

      {/* Management section */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ padding: '6px 4px', height: 32 }}>
          <EuiText size="xs" style={{ fontSize: 12, color: 'var(--euiColorDarkShade)', fontWeight: 500 }}>
            Management
          </EuiText>
        </div>

        <EuiListGroup flush gutterSize="none">

          {/* AutoDEX — above Detection rules */}
          <EuiListGroupItem
            label={
              <span style={{ fontSize: 13, color: isActive('/autodex') ? '#1750BA' : '#1d2a3e' }}>
                AutoDEX
              </span>
            }
            onClick={() => navigate('/autodex')}
            isActive={isActive('/autodex')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4 }}
          />

          {/* Detection rules (SIEM) */}
          <EuiListGroupItem
            label={
              <span style={{ fontSize: 13, color: isActive('/detection-rules') ? '#1750BA' : '#1d2a3e' }}>
                Detection rules (SIEM)
              </span>
            }
            onClick={() => navigate('/detection-rules')}
            isActive={isActive('/detection-rules')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4 }}
          />

          <EuiListGroupItem
            label={
              <span style={{ fontSize: 13, color: 'var(--euiTextColor)' }}>
                Benchmarks
              </span>
            }
            onClick={() => {}}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4 }}
          />

          <EuiListGroupItem
            label={
              <span style={{ fontSize: 13, color: 'var(--euiTextColor)' }}>
                Shared exception lists
              </span>
            }
            onClick={() => {}}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4 }}
          />
        </EuiListGroup>
      </div>

      <EuiHorizontalRule margin="m" style={{ backgroundColor: '#e3e8f2' }} />

      {/* Discover section */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ padding: '6px 4px', height: 32 }}>
          <EuiText size="xs" style={{ fontSize: 12, color: 'var(--euiColorDarkShade)', fontWeight: 500 }}>
            Discover
          </EuiText>
        </div>

        <EuiListGroup flush gutterSize="none">
          <EuiListGroupItem
            label={
              <span style={{ fontSize: 13, color: isActive('/mitre-coverage') ? '#1750BA' : '#1d2a3e' }}>
                MITRE ATT&amp;CK® Coverage
              </span>
            }
            onClick={() => navigate('/mitre-coverage')}
            isActive={isActive('/mitre-coverage')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4 }}
          />
        </EuiListGroup>
      </div>
    </div>
  );
};

export default RulesSecondaryNav;
