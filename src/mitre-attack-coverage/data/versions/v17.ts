import type { MitreVersionConfig } from './types';
import { SHARED_TACTICS_V17_V18 } from './shared_tactics';

export const V17: MitreVersionConfig = {
  id: 'v17.0',
  label: 'ATT\u0026CK v17.0',
  releaseDate: '2024-10',
  isLatest: false,
  tactics: SHARED_TACTICS_V17_V18,
};
