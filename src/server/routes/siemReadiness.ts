import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

// ── GET /api/siem_readiness/get_categories ────────────────────────────────────
router.get('/siem_readiness/get_categories', (_req: Request, res: Response) => {
  const versions = ['8.15.1-2025.03.17','8.16.0-2025.02.20','8.16.0-2025.03.22','8.16.0-2025.04.21',
    '8.16.0-2025.05.21','8.16.0-2025.06.20','9.1.0-2025.07.92','9.1.0-2025.07.21',
    '9.1.0-2025.08.08','9.1.0-2025.08.27','9.1.0-2025.09.10','9.1.0-2025.09.25',
    '9.1.0-2025.10.01','9.1.0-2025.10.15','9.1.0-2025.11.02'];
  const epVers = ['8.15.0','8.15.1','8.16.0','8.16.1','9.0.0','9.1.0','9.1.1','9.1.2','9.2.0','9.2.1'];
  const months = ['2025.01','2025.02','2025.03','2025.04','2025.05','2025.06','2025.07'];

  const mainCategoriesMap = [
    { category: 'Network', indices: [
        ...versions.map((v, i) => ({ indexName: `ds-auditbeat-${v}-000${String(i+1).padStart(3,'0')}`, docs: i < 5 ? 5000 + i * 200 : 0 })),
    ]},
    { category: 'Endpoint', indices: [
        ...epVers.map((v) => ({ indexName: `logs-endpoint.events.process-${v}-default`, docs: 12400 })),
        { indexName: 'logs-endpoint.alerts-default', docs: 320 },
        { indexName: 'logs-endpoint.events.network-default', docs: 180 },
    ]},
    { category: 'Identity', indices: months.map((v, i) => ({ indexName: `logs-okta.system-${v}-default`, docs: i < 4 ? 1200 + i * 300 : 0 })) },
    { category: 'Cloud', indices: [
        ...['2025.01','2025.02','2025.03','2025.04','2025.05','2025.06'].map((v, i) => ({ indexName: `logs-aws.cloudtrail-${v}-default`, docs: 8000 + i * 500 })),
        { indexName: 'logs-aws.s3access-default', docs: 19500 },
    ]},
    { category: 'Application/SaaS', indices: [
        ...['2025.01','2025.02','2025.03','2025.04','2025.05'].map((v, i) => ({ indexName: `logs-google_workspace.admin-${v}-default`, docs: 800 + i * 200 })),
        { indexName: 'logs-salesforce.login-default', docs: 2100 },
    ]},
  ];

  res.json({ rawCategoriesMap: mainCategoriesMap, mainCategoriesMap });
});

// ── GET /api/fleet/epm/packages ───────────────────────────────────────────────
// Returns { items: SiemReadinessPackageInfo[] }
router.get('/fleet/epm/packages', (_req: Request, res: Response) => {
  res.json({
    items: [
      { id: 'endpoint',          name: 'endpoint',          title: 'Endpoint Security',    version: '8.16.0', status: 'installed',     categories: ['security'],   packagePoliciesInfo: { count: 1 } },
      { id: 'elastic_agent',     name: 'elastic_agent',     title: 'Elastic Agent',        version: '8.16.0', status: 'installed',     categories: ['security'],   packagePoliciesInfo: { count: 1 } },
      { id: 'windows',           name: 'windows',           title: 'Windows',              version: '2.3.3',  status: 'installed',     categories: ['os'],         packagePoliciesInfo: { count: 0 } },
      { id: 'okta',              name: 'okta',              title: 'Okta',                 version: '3.3.2',  status: 'not_installed', categories: ['identity'],   packagePoliciesInfo: { count: 0 } },
      { id: 'aws',               name: 'aws',               title: 'AWS',                  version: '2.14.1', status: 'not_installed', categories: ['cloud'],      packagePoliciesInfo: { count: 0 } },
      { id: 'network_traffic',   name: 'network_traffic',   title: 'Network Packet Capture', version: '1.33.0', status: 'not_installed', categories: ['network'],  packagePoliciesInfo: { count: 0 } },
      { id: 'google_workspace',  name: 'google_workspace',  title: 'Google Workspace',     version: '2.19.0', status: 'not_installed', categories: ['productivity'], packagePoliciesInfo: { count: 0 } },
    ],
  });
});

// ── GET /api/detection_engine/rules/_find ─────────────────────────────────────
// Returns { data: RelatedIntegrationRuleResponse[] }
router.get('/detection_engine/rules/_find', (_req: Request, res: Response) => {
  res.json({
    data: [
      // Covered — endpoint installed with policy
      { enabled: true, related_integrations: [{ package: 'endpoint',        version: '>=8.0.0' }] },
      { enabled: true, related_integrations: [{ package: 'endpoint',        version: '>=8.0.0' }] },
      { enabled: true, related_integrations: [{ package: 'elastic_agent',   version: '>=8.0.0' }] },
      // Covered — no required integrations
      { enabled: true, related_integrations: [] },
      { enabled: true, related_integrations: [] },
      // Uncovered — windows installed but no active policy
      { enabled: true, related_integrations: [{ package: 'windows',         version: '>=1.0.0' }] },
      { enabled: true, related_integrations: [{ package: 'windows',         version: '>=1.0.0' }] },
      // Uncovered — okta not installed
      { enabled: true, related_integrations: [{ package: 'okta',            version: '>=1.0.0' }] },
      { enabled: true, related_integrations: [{ package: 'okta',            version: '>=1.0.0' }] },
      // Uncovered — network_traffic not installed
      { enabled: true, related_integrations: [{ package: 'network_traffic', version: '>=1.0.0' }] },
      { enabled: true, related_integrations: [{ package: 'network_traffic', version: '>=1.0.0' }] },
      // Uncovered — aws not installed
      { enabled: true, related_integrations: [{ package: 'aws',             version: '>=1.0.0' }] },
    ],
    total: 12,
    page: 1,
    perPage: 10000,
  });
});

// ── GET /api/siem_readiness/get_pipelines ─────────────────────────────────────
router.get('/siem_readiness/get_pipelines', (_req: Request, res: Response) => {
  res.json([
    // Endpoint — healthy
    { name: 'logs-endpoint.events.process@pipeline', indices: ['logs-endpoint.events.process-9.2.0-default', 'logs-endpoint.events.process-9.1.0-default'], docsCount: 245800, failedDocsCount: 0,    statsAvailable: true },
    { name: 'logs-endpoint.alerts@pipeline',         indices: ['logs-endpoint.alerts-default'],   docsCount: 12400,  failedDocsCount: 0,    statsAvailable: true },
    { name: 'logs-endpoint.events.network@pipeline', indices: ['logs-endpoint.events.network-default'], docsCount: 98000, failedDocsCount: 0, statsAvailable: true },
    // Network — critical failure rate
    { name: 'ds-auditbeat@pipeline',                 indices: ['ds-auditbeat-9.1.0-2025.11.02-000015'], docsCount: 55000,  failedDocsCount: 1320, statsAvailable: true },
    { name: 'logs-zeek.connection@pipeline',         indices: ['ds-auditbeat-9.1.0-2025.10.15-000014'], docsCount: 31000,  failedDocsCount: 0,    statsAvailable: true },
    // Identity — healthy
    { name: 'logs-okta.system@pipeline',             indices: ['logs-okta.system-2025.07-default', 'logs-okta.system-2025.06-default'], docsCount: 8800, failedDocsCount: 0, statsAvailable: true },
    // Cloud — critical
    { name: 'logs-aws.cloudtrail@pipeline',          indices: ['logs-aws.cloudtrail-2025.06-default', 'logs-aws.cloudtrail-2025.05-default'], docsCount: 62000, failedDocsCount: 890, statsAvailable: true },
    { name: 'logs-aws.s3access@pipeline',            indices: ['logs-aws.s3access-default'],       docsCount: 19500,  failedDocsCount: 0,    statsAvailable: true },
    // Application/SaaS — healthy
    { name: 'logs-google_workspace.admin@pipeline',  indices: ['logs-google_workspace.admin-2025.05-default'], docsCount: 4200, failedDocsCount: 0, statsAvailable: true },
    { name: 'logs-salesforce.login@pipeline',        indices: ['logs-salesforce.login-default'],   docsCount: 2100,   failedDocsCount: 0,    statsAvailable: true },
  ]);
});

// ── GET /api/siem_readiness/get_retention ─────────────────────────────────────
router.get('/siem_readiness/get_retention', (_req: Request, res: Response) => {
  res.json({
    items: [
      // Endpoint — healthy (meets 365-day baseline)
      { indexName: 'logs-endpoint.events.process', isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy' },
      { indexName: 'logs-endpoint.alerts',         isDataStream: true, retentionType: 'ilm', retentionPeriod: '400d', retentionDays: 400, policyName: 'security-data-policy', status: 'healthy' },
      { indexName: 'logs-endpoint.events.network', isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy' },
      // Network — non-compliant (too short)
      { indexName: 'ds-auditbeat',                 isDataStream: true, retentionType: 'ilm', retentionPeriod: '30d',  retentionDays: 30,  policyName: 'logs-default-policy',  status: 'non-compliant' },
      // Identity — non-compliant
      { indexName: 'logs-okta.system',             isDataStream: true, retentionType: 'dsl', retentionPeriod: '90d',  retentionDays: 90,  policyName: null,                   status: 'non-compliant' },
      // Cloud — mixed
      { indexName: 'logs-aws.cloudtrail',          isDataStream: true, retentionType: 'ilm', retentionPeriod: '365d', retentionDays: 365, policyName: 'security-data-policy', status: 'healthy' },
      { indexName: 'logs-aws.s3access',            isDataStream: true, retentionType: null,  retentionPeriod: null,   retentionDays: null, policyName: null,                  status: 'non-compliant' },
      // Application/SaaS — healthy
      { indexName: 'logs-google_workspace.admin',  isDataStream: true, retentionType: 'dsl', retentionPeriod: '365d', retentionDays: 365, policyName: null,                   status: 'healthy' },
      { indexName: 'logs-salesforce.login',        isDataStream: true, retentionType: 'ilm', retentionPeriod: '180d', retentionDays: 180, policyName: 'logs-default-policy',  status: 'non-compliant' },
    ],
  });
});

// ── GET /internal/ecs_data_quality_dashboard/results_latest/* ────────────────
router.get('/ecs_data_quality_dashboard/results_latest/:pattern', (_req: Request, res: Response) => {
  const now = Date.now();
  const min = 60000;

  const mkIndex = (name: string, incompatible: number, minsAgo: number) => ({
    indexName: name,
    incompatibleFieldCount: incompatible,
    checkedAt: now - minsAgo * min,
    docsCount: Math.floor(Math.random() * 50000),
  });

  res.json([
    // Network (auditbeat-like)
    ...['8.15.1-2025.03.17','8.16.0-2025.02.20','8.16.0-2025.03.22','8.16.0-2025.04.21',
        '8.16.0-2025.05.21','8.16.0-2025.06.20','9.1.0-2025.07.92','9.1.0-2025.07.21',
        '9.1.0-2025.08.08','9.1.0-2025.08.27','9.1.0-2025.09.10','9.1.0-2025.09.25',
        '9.1.0-2025.10.01','9.1.0-2025.10.15','9.1.0-2025.11.02'].map((v, i) =>
          mkIndex(`ds-auditbeat-${v}-000${String(i+1).padStart(3,'0')}`, i < 7 ? 2 : i < 11 ? 1 : 0, 21 + i)),
    // Endpoint
    ...['8.15.0','8.15.1','8.16.0','8.16.1','9.0.0','9.1.0','9.1.1','9.1.2','9.2.0','9.2.1'].map((v, i) =>
          mkIndex(`logs-endpoint.events.process-${v}-default`, i < 5 ? 2 : 1, 22 + i * 3)),
    mkIndex('logs-endpoint.alerts-default', 2, 28),
    mkIndex('logs-endpoint.events.network-default', 1, 29),
    // Identity
    ...['2025.01','2025.02','2025.03','2025.04','2025.05','2025.06','2025.07'].map((v, i) =>
          mkIndex(`logs-okta.system-${v}-default`, i < 4 ? 1 : 0, 25 + i * 2)),
    // Cloud
    ...['2025.01','2025.02','2025.03','2025.04','2025.05','2025.06'].map((v, i) =>
          mkIndex(`logs-aws.cloudtrail-${v}-default`, i < 3 ? 1 : 0, 30 + i * 5)),
    mkIndex('logs-aws.s3access-default', 0, 40),
    // Application/SaaS
    ...['2025.01','2025.02','2025.03','2025.04','2025.05'].map((v, i) =>
          mkIndex(`logs-google_workspace.admin-${v}-default`, i < 2 ? 1 : 0, 20 + i * 4)),
    mkIndex('logs-salesforce.login-default', 0, 32),
  ]);
});

// ── GET /api/siem_readiness/get_rule_field_issues ─────────────────────────────
router.get('/siem_readiness/get_rule_field_issues', (_req: Request, res: Response) => {
  res.json([
    { id: '1', ruleName: 'Windows Process Injection via CreateRemoteThread', field: 'process.parent.entity_id', issueType: 'missing',      indexPattern: 'logs-endpoint.events.process-*' },
    { id: '2', ruleName: 'Okta User Locked Out',                            field: 'okta.actor.alternate_id',  issueType: 'type_mismatch', indexPattern: 'logs-okta.system-*' },
    { id: '3', ruleName: 'AWS CloudTrail Unauthorized API Call',             field: 'aws.cloudtrail.error_code', issueType: 'sparse',       indexPattern: 'logs-aws.cloudtrail-*' },
    { id: '4', ruleName: 'Suspicious Network Connection by Process',        field: 'network.bytes',            issueType: 'missing',       indexPattern: 'logs-endpoint.events.network-*' },
    { id: '5', ruleName: 'Google Workspace Admin Role Assigned',            field: 'google_workspace.admin.event.name', issueType: 'type_mismatch', indexPattern: 'logs-google_workspace.admin-*' },
    { id: '6', ruleName: 'Auditbeat Unusual Process Execution',             field: 'process.code_signature.valid', issueType: 'sparse',    indexPattern: 'ds-auditbeat-*' },
    { id: '7', ruleName: 'AWS S3 Bucket Policy Changed',                   field: 'aws.s3access.bucket_name', issueType: 'missing',       indexPattern: 'logs-aws.s3access-*' },
    { id: '8', ruleName: 'Endpoint Defense Evasion via Timestomping',      field: 'file.mtime',               issueType: 'type_mismatch', indexPattern: 'logs-endpoint.events.process-*' },
  ]);
});

export default router;
