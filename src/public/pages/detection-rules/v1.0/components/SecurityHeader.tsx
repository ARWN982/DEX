import React from 'react';
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiAvatar,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBreadcrumbs,
  EuiIcon,
} from '@elastic/eui';

interface SecurityHeaderProps {
  onMenuClick: () => void;
}

const SecurityHeader: React.FC<SecurityHeaderProps> = ({ onMenuClick }) => {
  const breadcrumbs = [
    {
      text: 'AN test',
      href: '#',
    },
    {
      text: 'Rules',
      href: '#',
    },
    {
      text: 'Detection rules (SIEM)',
      href: '#',
    },
  ];

  return (
    <EuiHeader position="fixed" style={{ zIndex: 1000, backgroundColor: '#F6F9FC', border: 'none', boxShadow: 'none' }}>
      {/* Left Section: Elastic Logo + Space Avatar + Breadcrumbs */}
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem>
          <EuiHeaderLogo iconType="logoElastic" href="#" aria-label="Elastic" />
        </EuiHeaderSectionItem>
        
        <EuiHeaderSectionItem>
          <EuiAvatar 
            name="D" 
            size="s" 
            color="#00BFB3"
            style={{ marginLeft: '8px', marginRight: '8px' }}
          />
        </EuiHeaderSectionItem>

        <EuiHeaderSectionItem>
          <EuiBreadcrumbs 
            breadcrumbs={breadcrumbs} 
            truncate={false}
            max={3}
          />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      {/* Right Section: Search + Help + Sparkles + Comment + AI Agent + Avatar */}
      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="search"
                aria-label="Search"
                color="text"
                size="s"
              />
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="help"
                aria-label="Help"
                color="text"
                size="s"
              />
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="popper"
                aria-label="What's new"
                color="text"
                size="s"
              />
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="discuss"
                aria-label="Feedback"
                color="text"
                size="s"
              />
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              {/* AI Agent button — Figma: 1771:77507 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 32,
                minWidth: 96,
                padding: '0 8px',
                borderRadius: 4,
                backgroundImage: 'linear-gradient(124.93deg, #D9E8FF 3.97%, #ECE2FE 65.60%)',
                cursor: 'pointer',
              }}>
                <EuiIcon type="productAgent" size="s" />
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
                  AI Agent
                </span>
              </div>
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              <EuiAvatar 
                name="AN" 
                size="s"
                color="#0077CC"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};

export default SecurityHeader;
