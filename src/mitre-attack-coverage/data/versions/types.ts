/**
 * Version data model for MITRE ATT&CK framework versioning.
 */

export interface MitreVersionTacticConfig {
  id: string;       // e.g. "TA0005"
  name: string;     // e.g. "Stealth"
  shortName: string;
  /**
   * Ordered list of technique IDs that belong to this tactic in this version.
   * A technique can appear in more than one tactic (e.g. shared in v19 split).
   */
  techniques: string[];
}

export interface MitreVersionConfig {
  id: string;          // e.g. "v19.0"
  label: string;       // e.g. "ATT&CK v19.0"
  releaseDate: string; // e.g. "2026-04"
  isLatest: boolean;
  tactics: MitreVersionTacticConfig[];
}
