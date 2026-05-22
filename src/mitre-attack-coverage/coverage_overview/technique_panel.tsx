/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiText } from '@elastic/eui';
import React, { memo, useCallback, useMemo } from 'react';
import type { CoverageOverviewMitreTechnique } from '../model/coverage_overview/mitre_technique';
import { getTotalRuleCount } from '../model/coverage_overview/mitre_technique';
import { coverageOverviewPanelWidth } from './constants';
import { useCoverageOverviewDashboardContext } from './coverage_overview_dashboard_context';
import { CoverageOverviewPanelRuleStats } from './shared_components/panel_rule_stats';
import { useCoverageColors } from './use_coverage_colors';
import * as i18n from './translations';

export interface CoverageOverviewMitreTechniquePanelProps {
  technique: CoverageOverviewMitreTechnique;
  coveredSubtechniques: number;
  setIsPopoverOpen: (isOpen: boolean) => void;
  isPopoverOpen: boolean;
  isExpanded: boolean;
}

const CoverageOverviewMitreTechniquePanelComponent = ({
  technique,
  coveredSubtechniques,
  setIsPopoverOpen,
  isPopoverOpen,
  isExpanded,
}: CoverageOverviewMitreTechniquePanelProps) => {
  const {
    state: { filter },
  } = useCoverageOverviewDashboardContext();

  const { getColorsForValue } = useCoverageColors();

  const totalRuleCount = getTotalRuleCount(technique, filter.activity);
  const techniqueColors = getColorsForValue(totalRuleCount);

  const handlePanelOnClick = useCallback(
    () => setIsPopoverOpen(!isPopoverOpen),
    [isPopoverOpen, setIsPopoverOpen]
  );

  const SubtechniqueInfo = useMemo(
    () => (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem style={{ whiteSpace: 'nowrap' }} grow={false}>
          <EuiText size="xs">{i18n.SUBTECHNIQUES}</EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs">{`${coveredSubtechniques}/${technique.subtechniques.length}`}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    [technique.subtechniques, coveredSubtechniques]
  );

  return (
    <EuiPanel
      data-test-subj="coverageOverviewTechniquePanel"
      style={{
        background: techniqueColors?.backgroundColor ?? '#ffffff',
        color: techniqueColors?.textColor ?? '#343741',
        width: coverageOverviewPanelWidth,
        borderRadius: 4,
        cursor: 'pointer',
      }}
      hasShadow={false}
      hasBorder={!techniqueColors}
      paddingSize="s"
      onClick={handlePanelOnClick}
      element="div"
    >
      <EuiFlexGroup style={{ height: '100%' }} direction="column" justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiText
            data-test-subj={`coverageOverviewTechniqueTitle-${technique.id}`}
            size="xs"
            style={{ color: techniqueColors?.textColor ?? undefined }}
          >
            <h4 style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, color: 'inherit' }}>
              {technique.name}
            </h4>
          </EuiText>
          {technique.subtechniques.length > 0 && SubtechniqueInfo}
        </EuiFlexItem>
        {isExpanded && (
          <EuiFlexItem grow={false}>
            <CoverageOverviewPanelRuleStats
              enabledRules={technique.enabledRules.length}
              disabledRules={technique.disabledRules.length}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export const CoverageOverviewMitreTechniquePanel = memo(
  CoverageOverviewMitreTechniquePanelComponent
);
