/**
 * STUB: builds a realistic CoverageOverviewDashboard from static MITRE data.
 * Replace with a real API call to GET /api/detection_engine/coverage_overview
 * when integrating with Kibana.
 */
import { techniques, tactics } from './shims/mitre_data';
import type { CoverageOverviewDashboard } from './model/coverage_overview/dashboard';
import type { CoverageOverviewMitreTactic } from './model/coverage_overview/mitre_tactic';
import type { CoverageOverviewMitreTechnique } from './model/coverage_overview/mitre_technique';
import type { CoverageOverviewMitreSubTechnique } from './model/coverage_overview/mitre_subtechnique';
import type { CoverageOverviewRule } from './model/coverage_overview/rule';

let ruleCounter = 0;
function r(name: string): CoverageOverviewRule {
  return { id: `rule-${++ruleCounter}`, name };
}

export function buildMockDashboard(): CoverageOverviewDashboard {
  ruleCounter = 0;

  const techniqueMap = new Map<string, CoverageOverviewMitreTechnique>();

  for (const t of techniques) {
    const enabledCount = Math.floor(Math.random() * 5);
    const disabledCount = Math.floor(Math.random() * 3);

    const subtechniques: CoverageOverviewMitreSubTechnique[] = t.subtechniques.map((st) => ({
      id: st.id,
      name: st.name,
      reference: st.reference,
      enabledRules: Math.random() > 0.5 ? [r(`${st.name} Rule`)] : [],
      disabledRules: Math.random() > 0.7 ? [r(`${st.name} Disabled`)] : [],
      availableRules: [],
    }));

    techniqueMap.set(t.id, {
      id: t.id,
      name: t.name,
      reference: t.reference,
      subtechniques,
      enabledRules:  Array.from({ length: enabledCount },  (_, i) => r(`${t.name} Rule ${i + 1}`)),
      disabledRules: Array.from({ length: disabledCount }, (_, i) => r(`${t.name} Disabled ${i + 1}`)),
      availableRules: [],
    });
  }

  const mitreTactics: CoverageOverviewMitreTactic[] = tactics.map((tac) => {
    const tacticTechniques: CoverageOverviewMitreTechnique[] = techniques
      .filter((t) => t.tactics.includes(tac.id))
      .map((t) => techniqueMap.get(t.id)!)
      .filter(Boolean);

    // Aggregate rules at tactic level
    const enabledRules  = tacticTechniques.flatMap((t) => t.enabledRules);
    const disabledRules = tacticTechniques.flatMap((t) => t.disabledRules);

    return {
      id: tac.id,
      name: tac.name,
      reference: tac.reference,
      techniques: tacticTechniques,
      enabledRules,
      disabledRules,
      availableRules: [],
    };
  });

  return {
    mitreTactics,
    unmappedRules: {
      enabledRules:  [r('Custom DNS Alert')],
      disabledRules: [r('Legacy SIEM Rule')],
      availableRules: [],
    },
    metrics: {
      totalRulesCount: ruleCounter,
      totalEnabledRulesCount: Math.floor(ruleCounter * 0.7),
    },
  };
}
