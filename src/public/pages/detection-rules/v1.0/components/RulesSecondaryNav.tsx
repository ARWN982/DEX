import React from 'react';
import {
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiHorizontalRule,
} from '@elastic/eui';

interface RulesSecondaryNavProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
}

const RulesSecondaryNav: React.FC<RulesSecondaryNavProps> = ({ 
  selectedSection, 
  onSectionChange 
}) => {
  return (
    <div style={{ 
      width: 240, 
      padding: '8px 12px',
      borderRight: 'none',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '4px', marginBottom: '12px' }}>
        <EuiTitle size="s">
          <h4 style={{ fontWeight: 600, fontSize: 16, color: '#111c2c', margin: 0 }}>
            Rules
          </h4>
        </EuiTitle>
      </div>
        {/* Management Section */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ padding: '6px 4px', height: 32 }}>
            <EuiText size="xs" style={{ fontSize: 12, color: '#516381', fontWeight: 500 }}>
              Management
            </EuiText>
          </div>
          
          <EuiListGroup flush gutterSize="none">
            <EuiListGroupItem
              label={
                <span style={{ color: selectedSection === 'installed' ? '#1750BA' : '#1d2a3e' }}>
                  Detection rules (SIEM)
                </span>
              }
              onClick={() => onSectionChange('installed')}
              isActive={selectedSection === 'installed'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 400,
              }}
            />
            <EuiListGroupItem
              label={
                <span style={{ color: selectedSection === 'benchmarks' ? '#1750BA' : '#1d2a3e' }}>
                  Benchmarks
                </span>
              }
              onClick={() => onSectionChange('benchmarks')}
              isActive={selectedSection === 'benchmarks'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 400,
              }}
            />
            <EuiListGroupItem
              label={
                <span style={{ color: selectedSection === 'exceptions' ? '#1750BA' : '#1d2a3e' }}>
                  Shared exception lists
                </span>
              }
              onClick={() => onSectionChange('exceptions')}
              isActive={selectedSection === 'exceptions'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 400,
              }}
            />
          </EuiListGroup>
        </div>

        <EuiHorizontalRule margin="m" style={{ backgroundColor: '#e3e8f2' }} />

        {/* Discover Section */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ padding: '6px 4px', height: 32 }}>
            <EuiText size="xs" style={{ fontSize: 12, color: '#516381', fontWeight: 500 }}>
              Discover
            </EuiText>
          </div>
          
          <EuiListGroup flush gutterSize="none">
            <EuiListGroupItem
              label={
                <span style={{ color: selectedSection === 'mitre-coverage' ? '#1750BA' : '#1d2a3e' }}>
                  MITRE ATT&CK® Coverage
                </span>
              }
              onClick={() => onSectionChange('mitre-coverage')}
              isActive={selectedSection === 'mitre-coverage'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 400,
              }}
            />
          </EuiListGroup>
        </div>
    </div>
  );
};

export default RulesSecondaryNav;
