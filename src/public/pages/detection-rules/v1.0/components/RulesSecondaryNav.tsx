import React from 'react';
import {
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
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
      padding: '24px 16px',
      borderRight: '1px solid #D3DAE6',
      height: '100%',
    }}>
      {/* Rules Section */}
      <EuiTitle size="xxs">
        <h3 style={{ fontWeight: 600, fontSize: 12, color: '#69707D', textTransform: 'uppercase', marginBottom: 8 }}>
          Rules
        </h3>
      </EuiTitle>
      
      <EuiListGroup flush gutterSize="none">
        <EuiListGroupItem
          label={
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={true}>
                <span>Installed Rules</span>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">130</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          onClick={() => onSectionChange('installed')}
          isActive={selectedSection === 'installed'}
          style={{ marginBottom: 4 }}
        />
        
        <EuiListGroupItem
          label={
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={true}>
                <span>Rule Monitoring</span>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">38</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          onClick={() => onSectionChange('monitoring')}
          isActive={selectedSection === 'monitoring'}
          style={{ marginBottom: 4 }}
        />
        
        <EuiListGroupItem
          label={
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={true}>
                <span>Rule Updates</span>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="hollow">107</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          onClick={() => onSectionChange('updates')}
          isActive={selectedSection === 'updates'}
          style={{ marginBottom: 4 }}
        />
      </EuiListGroup>

      <EuiSpacer size="l" />

      {/* Other Sections */}
      <EuiTitle size="xxs">
        <h3 style={{ fontWeight: 600, fontSize: 12, color: '#69707D', textTransform: 'uppercase', marginBottom: 8 }}>
          Alerts
        </h3>
      </EuiTitle>
      
      <EuiListGroup flush gutterSize="none">
        <EuiListGroupItem
          label="SIEM ALERTS Coverage"
          onClick={() => onSectionChange('alerts-coverage')}
          style={{ marginBottom: 4 }}
        />
      </EuiListGroup>

      <EuiSpacer size="l" />

      <EuiTitle size="xxs">
        <h3 style={{ fontWeight: 600, fontSize: 12, color: '#69707D', textTransform: 'uppercase', marginBottom: 8 }}>
          Coverage
        </h3>
      </EuiTitle>
      
      <EuiListGroup flush gutterSize="none">
        <EuiListGroupItem
          label="Overview"
          onClick={() => onSectionChange('coverage-overview')}
          style={{ marginBottom: 4 }}
        />
      </EuiListGroup>
    </div>
  );
};

export default RulesSecondaryNav;
