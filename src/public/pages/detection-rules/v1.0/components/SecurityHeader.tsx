import React, { useState } from 'react';
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
import AIAgentPanel from './AIAgentPanel';

interface SecurityHeaderProps {
  onMenuClick: () => void;
}

const SecurityHeader: React.FC<SecurityHeaderProps> = ({ onMenuClick }) => {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
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
    <>
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
              <EuiButton
                iconType="productAgent"
                size="s"
                onClick={() => setIsAgentOpen(!isAgentOpen)}
                style={{
                  background: 'linear-gradient(to right, #D9E8FF, #ECE2FE)',
                  borderColor: 'transparent',
                  color: '#3D4AB8',
                  fontWeight: 600,
                }}
              >
                AI Agent
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

      {/* AI Agent Panel */}
      {isAgentOpen && <AIAgentPanel onClose={() => setIsAgentOpen(false)} />}
    </>
  );
};

export default SecurityHeader;
