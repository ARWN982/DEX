/** STUB: replaces @kbn/security-solution-common MITRE types */
export interface MitreSubTechnique {
  id: string;
  /** Parent technique id e.g. "T1078" */
  techniqueId: string;
  name: string;
  reference: string;
  tactics: string[];
}

export interface MitreTechnique {
  id: string;
  name: string;
  reference: string;
  tactics: string[];
  subtechniques: MitreSubTechnique[];
}

export interface MitreTactic {
  id: string;
  name: string;
  reference: string;
}
