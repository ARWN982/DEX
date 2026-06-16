import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiIcon } from '@elastic/eui';

interface NavItemProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  customIcon?: React.ReactNode;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, customIcon, onClick }) => (
  <EuiFlexGroup
    direction="column"
    gutterSize="none"
    alignItems="center"
    style={{ gap: 3, padding: 0, cursor: onClick ? 'pointer' : 'default' }}
    responsive={false}
    onClick={onClick}
  >
    <EuiFlexItem grow={false}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 4,
                  backgroundColor: isActive ? 'var(--euiColorBackgroundBasePrimary)' : 'transparent',
        }}
      >
        {customIcon || <EuiIcon type={icon!} size="m" color={isActive ? 'primary' : 'text'} />}
      </div>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size="xs" textAlign="center" style={{ fontSize: 11, fontWeight: 500, lineHeight: '16px', color: 'var(--euiTextColor)' }}>
        {label}
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, backgroundColor: '#e3e8f2', width: 32, margin: '0 auto' }} />
);

const SecuritySideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{
      width: 80, position: 'fixed', top: 48, left: 0, bottom: 0,
      paddingTop: 8, paddingBottom: 16,
      backgroundColor: '#F6F9FC', zIndex: 999,
    }}>
      <EuiFlexGroup
        direction="column" gutterSize="none" responsive={false}
        style={{ height: '100%', paddingBottom: 16, gap: 12 }}
      >
        {/* Security logo */}
        <EuiFlexItem grow={false} style={{ paddingTop: 8, paddingLeft: 12, paddingRight: 12 }}>
          <NavItem customIcon={<EuiIcon type="logoSecurity" size="m" />} label="Security" />
        </EuiFlexItem>

        <EuiFlexItem grow={false} style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Divider />
        </EuiFlexItem>

        {/* Main nav items */}
        <EuiFlexItem grow style={{ paddingLeft: 8, paddingRight: 8 }}>
          <EuiFlexGroup direction="column" gutterSize="none" alignItems="center" responsive={false} style={{ gap: 16 }}>
            <EuiFlexItem grow={false}>
              <NavItem icon="discoverApp" label="Discover" />
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

        <EuiFlexItem grow={false} style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Divider />
        </EuiFlexItem>

        {/* Bottom icons */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" gutterSize="none" alignItems="center" responsive={false} style={{ gap: 4 }}>
            {[
              { icon: 'launch',   active: true  },
              { icon: 'console',  active: false },
              { icon: 'document', active: false },
              { icon: 'gear',     active: false },
            ].map(({ icon, active }) => (
              <EuiFlexItem key={icon} grow={false}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 4, cursor: 'pointer',
                  backgroundColor: active ? '#e6f1fa' : 'transparent',
                }}>
                  <EuiIcon type={icon} size="m" color={active ? 'primary' : 'text'} />
                </div>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export default SecuritySideNav;
