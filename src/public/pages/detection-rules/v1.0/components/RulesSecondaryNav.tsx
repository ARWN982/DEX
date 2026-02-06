import React from 'react';
import {
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiHorizontalRule,
  EuiLink,
  EuiIcon,
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
      borderRight: '1px solid #D3DAE6',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '4px', marginBottom: '12px' }}>
        <EuiTitle size="s">
          <h4 style={{ fontWeight: 600, fontSize: 16, color: '#111c2c', margin: 0 }}>
            Rules
          </h4>
        </EuiTitle>
      </div>

      {/* Content - flex grow to push feedback to bottom */}
      <div style={{ flex: 1 }}>
        {/* Management Section */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ padding: '6px 4px', height: 32 }}>
            <EuiText size="xs" style={{ fontSize: 12, color: '#516381', fontWeight: 500 }}>
              Management
            </EuiText>
          </div>
          
          <EuiListGroup flush gutterSize="none">
            <EuiListGroupItem
              label="Detection rules (SIEM)"
              onClick={() => onSectionChange('installed')}
              isActive={selectedSection === 'installed'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            <EuiListGroupItem
              label="Benchmarks"
              onClick={() => onSectionChange('benchmarks')}
              isActive={selectedSection === 'benchmarks'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            <EuiListGroupItem
              label="Shared exception lists"
              onClick={() => onSectionChange('exceptions')}
              isActive={selectedSection === 'exceptions'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
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
              label="MITRE ATT&CK® Coverage"
              onClick={() => onSectionChange('mitre-coverage')}
              isActive={selectedSection === 'mitre-coverage'}
              style={{ 
                height: 32,
                padding: '6px 4px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
          </EuiListGroup>
        </div>
      </div>

      {/* Feedback snippet at bottom */}
      <div style={{ paddingTop: 16 }}>
        <EuiLink 
          href="#" 
          style={{ 
            fontSize: 14, 
            fontWeight: 500,
            color: '#1d2a3e',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Navigation feedback <EuiIcon type="popout" size="s" />
        </EuiLink>
      </div>
    </div>
  );
};

export default RulesSecondaryNav;
