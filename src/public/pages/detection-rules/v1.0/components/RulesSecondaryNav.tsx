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
    <div style={{ width: 240, padding: '8px 12px', borderRight: 'none', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '4px', marginBottom: '12px' }}>
        <EuiTitle size="s">
          <h4 style={{ fontWeight: 600, fontSize: 16, color: '#111c2c', margin: 0 }}>
            Rules
          </h4>
        </EuiTitle>
      </div>

      {/* Management section */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ padding: '6px 4px', height: 32 }}>
          <EuiText size="xs" style={{ fontSize: 12, color: '#516381', fontWeight: 500 }}>
            Management
          </EuiText>
        </div>

        <EuiListGroup flush gutterSize="none">

          {/* AutoDEX — above Detection rules */}
          <EuiListGroupItem
            label={
              <span style={{ color: isActive('/autodex') ? '#1750BA' : '#1d2a3e' }}>
                AutoDEX
              </span>
            }
            onClick={() => navigate('/autodex')}
            isActive={isActive('/autodex')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13, fontWeight: 400 }}
          />

          {/* Detection rules (SIEM) */}
          <EuiListGroupItem
            label={
              <span style={{ color: isActive('/detection-rules') ? '#1750BA' : '#1d2a3e' }}>
                Detection rules (SIEM)
              </span>
            }
            onClick={() => navigate('/detection-rules')}
            isActive={isActive('/detection-rules')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13, fontWeight: 400 }}
          />

          <EuiListGroupItem
            label={
              <span style={{ color: '#1d2a3e' }}>
                Benchmarks
              </span>
            }
            onClick={() => {}}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13, fontWeight: 400 }}
          />

          <EuiListGroupItem
            label={
              <span style={{ color: '#1d2a3e' }}>
                Shared exception lists
              </span>
            }
            onClick={() => {}}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13, fontWeight: 400 }}
          />
        </EuiListGroup>
      </div>

      <EuiHorizontalRule margin="m" style={{ backgroundColor: '#e3e8f2' }} />

      {/* Discover section */}
      <div style={{ marginBottom: 2 }}>
        <div style={{ padding: '6px 4px', height: 32 }}>
          <EuiText size="xs" style={{ fontSize: 12, color: '#516381', fontWeight: 500 }}>
            Discover
          </EuiText>
        </div>

        <EuiListGroup flush gutterSize="none">
          <EuiListGroupItem
            label={
              <span style={{ color: isActive('/mitre-coverage') ? '#1750BA' : '#1d2a3e' }}>
                MITRE ATT&amp;CK® Coverage
              </span>
            }
            onClick={() => navigate('/mitre-coverage')}
            isActive={isActive('/mitre-coverage')}
            style={{ height: 32, padding: '6px 4px', borderRadius: 4, fontSize: 13, fontWeight: 400 }}
          />
        </EuiListGroup>
      </div>
    </div>
  );
};

export default RulesSecondaryNav;
