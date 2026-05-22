/**
 * Builds the list of tactic columns to render based on the selected ATT&CK version.
 *
 * For v19 this produces 15 columns (Stealth + Defense Impairment instead of Defense Evasion).
 * For v17/v18.1 this produces 14 columns (original structure).
 *
 * TODO: when real rule-count data is available per-version, refetch from the API
 * with the new version parameter instead of redistributing mock counts.
 */
import { useMemo } from 'react';
import type { CoverageOverviewDashboard } from '../model/coverage_overview/dashboard';
import type { CoverageOverviewMitreTactic } from '../model/coverage_overview/mitre_tactic';
import type { CoverageOverviewMitreTechnique } from '../model/coverage_overview/mitre_technique';
import type { MitreVersionConfig } from '../data/versions/types';
import { BOTH_TACTIC_TECHNIQUE_IDS } from '../data/versions/defense_evasion_split_mapping';

export function useVersionedTactics(
  data: CoverageOverviewDashboard | undefined,
  version: MitreVersionConfig
): CoverageOverviewMitreTactic[] {
  return useMemo(() => {
    if (!data) return [];

    // Build a flat map: technique id → technique node (with its rules)
    const techniqueMap = new Map<string, CoverageOverviewMitreTechnique>();
    for (const tactic of data.mitreTactics) {
      for (const tech of tactic.techniques) {
        if (!techniqueMap.has(tech.id)) {
          techniqueMap.set(tech.id, tech);
        }
      }
    }

    // Build the versioned tactic list
    return version.tactics.map((tacticConfig) => {
      const techniques: CoverageOverviewMitreTechnique[] = tacticConfig.techniques
        .map(id => techniqueMap.get(id))
        .filter((t): t is CoverageOverviewMitreTechnique => !!t);

      // Aggregate rules from techniques for this tactic
      const enabledRules  = techniques.flatMap(t => t.enabledRules);
      const disabledRules = techniques.flatMap(t => t.disabledRules);

      return {
        id: tacticConfig.id,
        name: tacticConfig.name,
        reference: `https://attack.mitre.org/tactics/${tacticConfig.id}/`,
        techniques,
        enabledRules,
        disabledRules,
        availableRules: [],
      } satisfies CoverageOverviewMitreTactic;
    });
  }, [data, version]);
}

/**
 * Returns the name of the "other" tactic a technique belongs to in v19 split.
 * Used to show the "(also in X)" note in the technique popover.
 */
export function getOtherTacticForSharedTechnique(
  techniqueId: string,
  currentTacticId: string
): string | null {
  if (!BOTH_TACTIC_TECHNIQUE_IDS.has(techniqueId)) return null;
  return currentTacticId === 'TA0005' ? 'Defense Impairment' : 'Stealth';
}
