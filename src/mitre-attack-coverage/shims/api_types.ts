/**
 * STUB: replaces types/enums from @kbn/security-solution-common API.
 * Wire up real API types when integrating with a Kibana backend.
 */

export enum CoverageOverviewRuleActivity {
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export enum CoverageOverviewRuleSource {
  Prebuilt = 'prebuilt',
  Custom = 'custom',
}

export interface CoverageOverviewFilter {
  activity?: CoverageOverviewRuleActivity[];
  source?: CoverageOverviewRuleSource[];
  search_term?: string;
}

export interface CoverageOverviewRuleAttributes {
  name: string;
  activity: CoverageOverviewRuleActivity;
}

export interface CoverageOverviewResponse {
  coverage: Record<string, string[]>; // techniqueId -> ruleIds[]
  rules_data: Record<string, CoverageOverviewRuleAttributes>;
  unmapped_rule_ids: string[];
}

/** STUB: replaces BulkActionTypeEnum */
export enum BulkActionTypeEnum {
  enable = 'enable',
  disable = 'disable',
  delete = 'delete',
  duplicate = 'duplicate',
  export = 'export',
  edit = 'edit',
}

/** STUB: branded string for rule saved-object IDs */
export type RuleObjectId = string;
