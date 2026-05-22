import type { MitreVersionConfig } from './types';
import { SHARED_TACTICS_V17_V18 } from './shared_tactics';

export const V18_1: MitreVersionConfig = {
  id: 'v18.1',
  label: 'ATT\u0026CK v18.1',
  releaseDate: '2025-10',
  isLatest: false,
  tactics: SHARED_TACTICS_V17_V18,
};
