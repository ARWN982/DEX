import React from 'react';
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiAvatar,
  EuiButtonIcon,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBreadcrumbs,
} from '@elastic/eui';

const SecurityHeader: React.FC<{ onMenuClick?: () => void }> = () => {
  const breadcrumbs = [
    { text: 'My Security project', href: '#' },
    { text: 'Launchpad',           href: '#' },
    { text: 'SIEM Readiness',      href: '#' },
  ];

  return (
    <EuiHeader position="fixed" style={{ zIndex: 1000, backgroundColor: '#F6F9FC', border: 'none', boxShadow: 'none' }}>
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem>
          <EuiHeaderLogo iconType="logoElastic" href="#" aria-label="Elastic" />
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiAvatar name="D" size="s" color="#00BFB3" style={{ marginLeft: 8, marginRight: 8 }} />
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem>
          <EuiBreadcrumbs breadcrumbs={breadcrumbs} truncate={false} max={3} />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="search"  aria-label="Search"      color="text" size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="help"    aria-label="Help"        color="text" size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="popper"  aria-label="What's new"  color="text" size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="discuss" aria-label="Feedback"    color="text" size="s" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                iconType="productAgent"
                size="s"
                style={{ backgroundColor: '#d9e8ff', color: '#1750ba', border: 'none', fontWeight: 500 }}
              >
                AI Agent
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiAvatar name="AN" size="s" color="#0077CC" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};

export default SecurityHeader;
