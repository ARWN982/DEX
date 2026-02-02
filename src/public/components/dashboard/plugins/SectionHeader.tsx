import React from 'react';
import { EuiText, EuiIcon, useEuiTheme } from '@elastic/eui';
import { useDashboardPanelSettings } from '../../../store/useDashboardPanelSettings';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { euiTheme } = useEuiTheme();
  const { titleFontWeight } = useDashboardPanelSettings();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: euiTheme.size.s,
        height: '24px',
        paddingTop: 0,
        userSelect: 'none',
        flexWrap: 'nowrap',
      }}
    >
      <EuiIcon type="arrowDown" size="m" color={euiTheme.colors.textSubdued} style={{ flexShrink: 0 }} />
      <EuiText size="m" style={{ fontWeight: titleFontWeight, color: euiTheme.colors.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {title}
      </EuiText>
    </div>
  );
};
