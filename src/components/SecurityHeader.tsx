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
  EuiIcon,
} from '@elastic/eui';

const SecurityHeader: React.FC<{ onMenuClick?: () => void; onAgentClick?: () => void }> = ({ onAgentClick }) => {
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
              <button
                type="button"
                onClick={onAgentClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  height: 32,
                  minWidth: 96,
                  padding: '0 8px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(124.93deg, rgb(217,232,255) 3.97%, rgb(236,226,254) 65.60%)',
                }}
              >
                <EuiIcon type="productAgent" size="s" color="#1750BA" />
                <span style={{
                  background: 'linear-gradient(165.73deg, #1750BA 2.98%, #6B3C9F 66.24%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '20px',
                  whiteSpace: 'nowrap',
                }}>
                  AI agent
                </span>
              </button>
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
