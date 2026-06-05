import type { MitreVersionConfig } from './types';
import { V18_1 } from './v18_1';
import { V19 } from './v19';

/** All supported ATT&CK versions, newest first */
export const MITRE_VERSION_REGISTRY: MitreVersionConfig[] = [V19, V18_1];

export const DEFAULT_MITRE_VERSION_ID = 'v19.0';

export function getMitreVersion(id: string): MitreVersionConfig {
  return MITRE_VERSION_REGISTRY.find(v => v.id === id) ?? V18_1;
}
