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
  EuiIcon,
  EuiPopover,
  EuiSelectable,
  EuiText,
} from '@elastic/eui';

interface ViewOption {
  value: string;
  label: string;
}

const SecurityHeader: React.FC<{
  onMenuClick?: () => void;
  onAgentClick?: () => void;
  viewOptions?: ViewOption[];
  currentView?: string;
  onViewChange?: (view: string) => void;
}> = ({ onAgentClick, viewOptions, currentView, onViewChange }) => {
  const [viewPopoverOpen, setViewPopoverOpen] = useState(false);

  const breadcrumbs = [
    { text: 'My Security project', href: '#' },
    { text: 'Launchpad',           href: '#' },
    { text: 'SIEM Readiness',      href: '#' },
  ];

  const selectedLabel = viewOptions?.find(o => o.value === currentView)?.label ?? viewOptions?.[0]?.label;

  const selectableOptions = (viewOptions ?? []).map(o => ({
    label: o.label,
    data: { value: o.value },
    checked: o.value === currentView ? ('on' as const) : undefined,
  }));

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

            {/* View selector — shown only when viewOptions are provided */}
            {viewOptions && viewOptions.length > 0 && (
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <button
                      onClick={() => setViewPopoverOpen(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        height: 28, padding: '0 8px', borderRadius: 4,
                        border: '1px solid var(--euiBorderColor)', background: '#fff',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        color: 'var(--euiTextColor)', whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedLabel}
                      <EuiIcon type="chevronSingleDown" size="s" color="subdued" />
                    </button>
                  }
                  isOpen={viewPopoverOpen}
                  closePopover={() => setViewPopoverOpen(false)}
                  panelPaddingSize="none"
                  anchorPosition="downRight"
                >
                  <EuiSelectable
                    aria-label="Select view"
                    options={selectableOptions}
                    singleSelection
                    onChange={(newOptions) => {
                      const picked = newOptions.find(o => o.checked === 'on');
                      if (picked && onViewChange) {
                        onViewChange((picked as typeof selectableOptions[0]).data.value);
                        setViewPopoverOpen(false);
                      }
                    }}
                  >
                    {(list) => <div style={{ width: 180 }}>{list}</div>}
                  </EuiSelectable>
                </EuiPopover>
              </EuiFlexItem>
            )}

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
