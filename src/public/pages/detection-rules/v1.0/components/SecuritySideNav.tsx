import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiFlexGroup,
} from '@elastic/eui';

interface SecuritySideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  customIcon?: React.ReactNode;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, customIcon, onClick }) => {
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
      onClick={onClick}
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

// Security Logo using EUI icon
const SecurityLogo: React.FC = () => {
  return (
    <EuiIcon type="logoSecurity" size="m" />
  );
};

const SecuritySideNav: React.FC<SecuritySideNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      style={{ 
        width: '80px',
        position: 'fixed',
        top: '48px',
        left: 0,
        bottom: 0,
        paddingTop: '8px',
        paddingBottom: '16px',
        backgroundColor: '#F6F9FC',
        borderRight: 'none',
        zIndex: 999,
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
              <NavItem
                icon="mail"
                label="AI Briefing"
                isActive={isActive('/inbox')}
                onClick={() => navigate('/inbox')}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="dashboardApp" label="Dashboards" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem
                icon="radar"
                label="Rules"
                isActive={isActive('/detection-rules')}
                onClick={() => navigate('/detection-rules')}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="alert" label="Alerts" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="bolt" label="Attack discovery" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="bullseye" label="Findings" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="folderClosed" label="Cases" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <NavItem icon="visBarVerticalStacked" label="Entity analytics" />
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
                <EuiIcon type="document" size="m" color="text" />
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
    </div>
  );
};

export default SecuritySideNav;
