/**
 * ATT&CK v19.0 (April 2026)
 * Key change: Defense Evasion (TA0005) is split into two tactics:
 *   Stealth            (TA0005)  — techniques about hiding/obscuring presence
 *   Defense Impairment (TA0112)  — techniques about disabling/impairing controls
 *
 * TODO: replace technique lists with the official MITRE v19 data once published.
 * https://attack.mitre.org/resources/updates/updates-april-2026/
 */
import type { MitreVersionConfig } from './types';
import { SHARED_TACTICS_V17_V18 } from './shared_tactics';
import {
  STEALTH_TECHNIQUE_IDS,
  DEFENSE_IMPAIRMENT_TECHNIQUE_IDS,
} from './defense_evasion_split_mapping';

// Defense Evasion technique pool (same as v18.1)
const DEFENSE_EVASION_TECHNIQUES = SHARED_TACTICS_V17_V18
  .find(t => t.id === 'TA0005')!
  .techniques;

// All non-Defense-Evasion tactics carry over unchanged
const nonDeTeactics = SHARED_TACTICS_V17_V18.filter(t => t.id !== 'TA0005');

// Build the v19 tactic list — 15 columns
const V19_TACTICS = [
  // Reconnaissance → Resource Development → Initial Access → Execution → Persistence → Privilege Escalation
  ...nonDeTeactics.slice(0, 6),

  // Stealth (TA0005 — new role)
  {
    id: 'TA0005',
    name: 'Stealth',
    shortName: 'stealth',
    techniques: DEFENSE_EVASION_TECHNIQUES.filter(id => STEALTH_TECHNIQUE_IDS.has(id)),
  },

  // Defense Impairment (TA0112 — new tactic)
  {
    id: 'TA0112',
    name: 'Defense Impairment',
    shortName: 'defense-impairment',
    techniques: DEFENSE_EVASION_TECHNIQUES.filter(id => DEFENSE_IMPAIRMENT_TECHNIQUE_IDS.has(id)),
  },

  // Credential Access → Discovery → ... → Impact (unchanged)
  ...nonDeTeactics.slice(6),
];

export const V19: MitreVersionConfig = {
  id: 'v19.0',
  label: 'ATT\u0026CK v19.0',
  releaseDate: '2026-04',
  isLatest: true,
  tactics: V19_TACTICS,
};
