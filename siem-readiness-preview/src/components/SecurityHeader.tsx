import React from 'react';
import { EuiHeader, EuiHeaderLogo, EuiHeaderLinks, EuiHeaderLink } from '@elastic/eui';

const SecurityHeader: React.FC<{ onMenuClick?: () => void }> = () => (
  <EuiHeader position="fixed">
    <EuiHeaderLogo iconType="logoSecurity">Elastic Security</EuiHeaderLogo>
    <EuiHeaderLinks gutterSize="xs">
      <EuiHeaderLink isActive>Security</EuiHeaderLink>
    </EuiHeaderLinks>
  </EuiHeader>
);

export default SecurityHeader;
