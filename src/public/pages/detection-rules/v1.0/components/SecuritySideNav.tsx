import React from 'react';
import {
  EuiCollapsibleNav,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiIcon,
  EuiFlexGroup,
  EuiHorizontalRule,
} from '@elastic/eui';

interface SecuritySideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  customIcon?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, customIcon }) => {
  return (
    <EuiFlexGroup 
      direction="column" 
      gutterSize="none" 
      alignItems="center"
      style={{
        gap: '3px',
        padding: '0',
        cursor: 'pointer',
      }}
      responsive={false}
    >
      <EuiFlexItem grow={false}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: isActive ? '#e6f1fa' : 'transparent',
          }}
        >
          {customIcon || <EuiIcon type={icon!} size="m" color={isActive ? 'primary' : 'text'} />}
        </div>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText 
          size="xs" 
          textAlign="center"
          style={{ 
            fontSize: '11px',
            fontWeight: 500,
            lineHeight: '16px',
            color: '#1d2a3e'
          }}
        >
          {label}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

// Colored Security Logo from Figma
const SecurityLogo: React.FC = () => {
  return (
    <img 
      src="https://www.figma.com/api/mcp/asset/4388f75b-98c7-4899-95cf-e8fda0f74391"
      alt="Security"
      style={{
        width: '20px',
        height: '20px',
        objectFit: 'contain'
      }}
    />
  );
};

const SecuritySideNav: React.FC<SecuritySideNavProps> = ({ isOpen, onClose }) => {
  return (
    <EuiCollapsibleNav
      isOpen={isOpen}
      onClose={onClose}
      isDocked
      size={72}
      style={{ 
        paddingTop: 0,  // Remove padding to align Security icon to top
        backgroundColor: '#F6F9FC',
        borderRight: '1px solid #e3e8f2'
      }}
    >
      {/* Content Container - Top aligned */}
      <EuiFlexGroup 
        direction="column" 
        gutterSize="none"
        style={{ 
          height: '100%',
          paddingTop: '0',        // Remove top padding to align Security to top
          paddingBottom: '16px',  // EUI "base" spacing
          paddingLeft: '0',
          paddingRight: '0',
          gap: '12px'             // EUI "m" spacing between sections
        }}
        responsive={false}
      >
        {/* Security Header with colored logo - top aligned with minimal padding */}
        <EuiFlexItem grow={false} style={{ paddingTop: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
          <NavItem customIcon={<SecurityLogo />} label="Security" />
        </EuiFlexItem>

        {/* Divider - 32px width */}
        <EuiFlexItem grow={false} style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <div style={{ 
            height: '1px', 
            backgroundColor: '#e3e8f2',
            width: '32px',
            margin: '0 auto'
          }} />
        </EuiFlexItem>

        {/* Main Navigation Items - 16px gaps */}
        <EuiFlexItem grow={true} style={{ paddingLeft: '8px', paddingRight: '8px' }}>
          <EuiFlexGroup 
            direction="column" 
            gutterSize="none"
            alignItems="center" 
            responsive={false}
            style={{ gap: '16px' }}  // EUI "base" spacing = 16px
          >
            <EuiFlexItem grow={false}>
              <NavItem icon="discoverApp" label="Discover" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="dashboardApp" label="Dashboards" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="indexEdit" label="Rules" isActive />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="alert" label="Alerts" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="bolt" label="Attack discovery" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="folderClosed" label="Assets" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="calendar" label="Cases" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="visBarVerticalStacked" label="Entity analytics" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="list" label="Explore" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="boxesVertical" label="More" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Divider - 32px width */}
        <EuiFlexItem grow={false} style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <div style={{ 
            height: '1px', 
            backgroundColor: '#e3e8f2',
            width: '32px',
            margin: '0 auto'
          }} />
        </EuiFlexItem>

        {/* Bottom Section - 4px gaps, no labels */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup 
            direction="column" 
            gutterSize="none"
            alignItems="center" 
            responsive={false}
            style={{ gap: '4px' }}  // EUI "xs" spacing = 4px
          >
            <EuiFlexItem grow={false}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <EuiIcon type="launch" size="m" color="text" />
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <EuiIcon type="console" size="m" color="text" />
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <EuiIcon type="menu" size="m" color="text" />
              </div>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <EuiIcon type="gear" size="m" color="text" />
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCollapsibleNav>
  );
};

export default SecuritySideNav;
