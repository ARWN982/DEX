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
  EuiSpacer,
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

      {/* Right Section: Search + Help + Confetti + AI Assistant + Avatar */}
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
                iconType="starFilled"
                aria-label="Celebrate"
                color="text"
                size="s"
              />
            </EuiFlexItem>
            
            <EuiFlexItem grow={false}>
              <EuiButton
                iconType="sparkles"
                size="s"
                fill
                style={{ 
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%)',
                  border: 'none',
                  fontWeight: 500
                }}
              >
                AI Assistant
              </EuiButton>
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
