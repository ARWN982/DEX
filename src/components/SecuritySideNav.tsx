import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiIcon } from '@elastic/eui';

interface NavItemProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  customIcon?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, customIcon }) => (
  <EuiFlexGroup
    direction="column"
    gutterSize="none"
    alignItems="center"
    style={{ gap: 3, padding: 0, cursor: 'default' }}
    responsive={false}
  >
    <EuiFlexItem grow={false}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 4,
          backgroundColor: isActive ? '#e6f1fa' : 'transparent',
        }}
      >
        {customIcon || <EuiIcon type={icon!} size="m" color={isActive ? 'primary' : 'text'} />}
      </div>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size="xs" textAlign="center" style={{ fontSize: 11, fontWeight: 500, lineHeight: '16px', color: '#1d2a3e' }}>
        {label}
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, backgroundColor: '#e3e8f2', width: 32, margin: '0 auto' }} />
);

const SecuritySideNav: React.FC = () => (
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
          {[
            { icon: 'discoverApp',          label: 'Discover'         },
            { icon: 'dashboardApp',          label: 'Dashboards'       },
            { icon: 'radar',                 label: 'Rules'            },
            { icon: 'alert',                 label: 'Alerts'           },
            { icon: 'bolt',                  label: 'Attack discovery' },
            { icon: 'bullseye',              label: 'Findings'         },
            { icon: 'folderClosed',          label: 'Cases'            },
            { icon: 'visBarVerticalStacked', label: 'Entity analytics' },
            { icon: 'boxesVertical',         label: 'More'             },
          ].map(({ icon, label }) => (
            <EuiFlexItem key={label} grow={false}>
              <NavItem icon={icon} label={label} />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiFlexItem>

      <EuiFlexItem grow={false} style={{ paddingLeft: 20, paddingRight: 20 }}>
        <Divider />
      </EuiFlexItem>

      {/* Bottom icons — SIEM Readiness is active */}
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

export default SecuritySideNav;
