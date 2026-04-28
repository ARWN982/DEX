import React from 'react';
import { EuiIcon } from '@elastic/eui';

const NAV_ITEMS = [
  { icon: 'logoSecurity', label: 'Security' },
  { icon: 'home',         label: 'Home' },
  { icon: 'visArea',      label: 'Discover' },
  { icon: 'dashboardApp', label: 'Dashboards' },
  { icon: 'inspect',      label: 'Rules' },
  { icon: 'watchesApp',   label: 'Alerts' },
];

const SecuritySideNav: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      top: 48,
      left: 0,
      width: 80,
      height: 'calc(100vh - 48px)',
      background: '#1a1c21',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 12,
      gap: 8,
      zIndex: 1000,
    }}
  >
    {NAV_ITEMS.map(({ icon, label }) => (
      <div
        key={label}
        title={label}
        style={{ width: 56, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}
      >
        <EuiIcon type={icon} size="m" color="ghost" />
      </div>
    ))}
  </div>
);

export default SecuritySideNav;
