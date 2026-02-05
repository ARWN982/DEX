import React from 'react';
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiFieldSearch,
  EuiHeaderLinks,
  EuiHeaderLink,
  EuiAvatar,
  EuiIcon,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

interface SecurityHeaderProps {
  onMenuClick: () => void;
}

const SecurityHeader: React.FC<SecurityHeaderProps> = ({ onMenuClick }) => {
  return (
    <EuiHeader position="fixed" style={{ zIndex: 1000 }}>
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem>
          <EuiButtonIcon
            iconType="menu"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
            size="m"
          />
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiHeaderLogo iconType="logoElastic" href="#" aria-label="Elastic">
            Elastic
          </EuiHeaderLogo>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection>
        <EuiHeaderSectionItem>
          <EuiFieldSearch
            placeholder="Search Elastic"
            compressed
            style={{ width: 400 }}
          />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="help"
                aria-label="Help"
                color="text"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="bell"
                aria-label="Notifications"
                color="text"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="gear"
                aria-label="Settings"
                color="text"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiAvatar name="User" size="s" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};

export default SecurityHeader;
