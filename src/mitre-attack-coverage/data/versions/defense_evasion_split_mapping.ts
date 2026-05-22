/**
 * TODO: replace with the real MITRE ATT&CK v19 mapping once published.
 * https://attack.mitre.org/resources/updates/updates-april-2026/
 *
 * Placeholder split of Defense Evasion (TA0005) into:
 *   Stealth          (TA0005) — techniques about hiding/obscuring presence
 *   Defense Impairment (TA0112) — techniques about disabling/impairing controls
 *
 * Techniques marked `both: true` appear in BOTH tactic columns.
 * Their rule counts are shown independently per column but reference the same
 * underlying rule set — see useCoverageOverviewDashboardContext for the merge logic.
 */

export interface SplitEntry {
  /** technique ID */
  id: string;
  /** which tactic(s) this belongs to in v19 */
  tactic: 'stealth' | 'defense-impairment' | 'both';
}

// TODO: replace with real mapping
export const DEFENSE_EVASION_V19_SPLIT: SplitEntry[] = [
  // ── Stealth ──────────────────────────────────────────────────────────────────
  { id: 'T1134', tactic: 'stealth' },   // Access Token Manipulation — hide identity
  { id: 'T1197', tactic: 'stealth' },   // BITS Jobs — background persistence hiding
  { id: 'T1622', tactic: 'stealth' },   // Debugger Evasion
  { id: 'T1140', tactic: 'stealth' },   // Deobfuscate/Decode Files
  { id: 'T1006', tactic: 'stealth' },   // Direct Volume Access — bypass FS monitoring
  { id: 'T1480', tactic: 'stealth' },   // Execution Guardrails — evasion by environment
  { id: 'T1564', tactic: 'stealth' },   // Hide Artifacts
  { id: 'T1574', tactic: 'stealth' },   // Hijack Execution Flow
  { id: 'T1070', tactic: 'stealth' },   // Indicator Removal
  { id: 'T1202', tactic: 'stealth' },   // Indirect Command Execution
  { id: 'T1036', tactic: 'stealth' },   // Masquerading
  { id: 'T1112', tactic: 'stealth' },   // Modify Registry
  { id: 'T1027', tactic: 'stealth' },   // Obfuscated Files or Information
  { id: 'T1647', tactic: 'stealth' },   // Plist File Modification
  { id: 'T1055', tactic: 'stealth' },   // Process Injection
  { id: 'T1207', tactic: 'stealth' },   // Rogue Domain Controller
  { id: 'T1014', tactic: 'stealth' },   // Rootkit
  { id: 'T1218', tactic: 'stealth' },   // System Binary Proxy Execution
  { id: 'T1216', tactic: 'stealth' },   // System Script Proxy Execution
  { id: 'T1221', tactic: 'stealth' },   // Template Injection
  { id: 'T1127', tactic: 'stealth' },   // Trusted Developer Utilities Proxy Execution
  { id: 'T1220', tactic: 'stealth' },   // XSL Script Processing

  // ── Defense Impairment ────────────────────────────────────────────────────
  { id: 'T1548', tactic: 'defense-impairment' }, // Abuse Elevation Control Mechanism
  { id: 'T1610', tactic: 'defense-impairment' }, // Deploy Container
  { id: 'T1484', tactic: 'defense-impairment' }, // Domain Policy Modification
  { id: 'T1211', tactic: 'defense-impairment' }, // Exploitation for Defense Evasion
  { id: 'T1222', tactic: 'defense-impairment' }, // File and Directory Permissions Modification
  { id: 'T1562', tactic: 'defense-impairment' }, // Impair Defenses
  { id: 'T1601', tactic: 'defense-impairment' }, // Modify System Image
  { id: 'T1599', tactic: 'defense-impairment' }, // Network Boundary Bridging
  { id: 'T1542', tactic: 'defense-impairment' }, // Pre-OS Boot
  { id: 'T1535', tactic: 'defense-impairment' }, // Unused/Unsupported Cloud Regions
  { id: 'T1600', tactic: 'defense-impairment' }, // Weaken Encryption

  // ── Both tactics ─────────────────────────────────────────────────────────
  { id: 'T1078', tactic: 'both' },   // Valid Accounts — stealth (blending in) + impairs auth controls
  { id: 'T1205', tactic: 'both' },   // Traffic Signaling — stealth (hiding C2) + impairs network monitoring
  { id: 'T1550', tactic: 'both' },   // Use Alternate Authentication Material
  { id: 'T1497', tactic: 'both' },   // Virtualization/Sandbox Evasion
];

// Derived lookup maps for fast access
export const STEALTH_TECHNIQUE_IDS = new Set(
  DEFENSE_EVASION_V19_SPLIT
    .filter(e => e.tactic === 'stealth' || e.tactic === 'both')
    .map(e => e.id)
);

export const DEFENSE_IMPAIRMENT_TECHNIQUE_IDS = new Set(
  DEFENSE_EVASION_V19_SPLIT
    .filter(e => e.tactic === 'defense-impairment' || e.tactic === 'both')
    .map(e => e.id)
);

export const BOTH_TACTIC_TECHNIQUE_IDS = new Set(
  DEFENSE_EVASION_V19_SPLIT
    .filter(e => e.tactic === 'both')
    .map(e => e.id)
);
