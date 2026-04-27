import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

// ── GET /api/siem_readiness/get_categories ────────────────────────────────────
// Returns CategoriesResponse (matching @kbn/siem-readiness types)
router.get('/siem_readiness/get_categories', (_req: Request, res: Response) => {
  res.json({
    rawCategoriesMap: [
      { category: 'Endpoint',         indices: [{ indexName: 'logs-endpoint.events.process-default', docs: 12400 }, { indexName: 'logs-endpoint.alerts-default', docs: 320 }] },
      { category: 'Identity',         indices: [{ indexName: 'logs-okta.system-default', docs: 0 }] },
      { category: 'Network',          indices: [{ indexName: 'logs-network_traffic.flow-default', docs: 0 }, { indexName: 'logs-zeek.connection-default', docs: 0 }] },
      { category: 'Cloud',            indices: [{ indexName: 'logs-aws.cloudtrail-default', docs: 0 }] },
      { category: 'Application/SaaS', indices: [{ indexName: 'logs-google_workspace.admin-default', docs: 0 }] },
    ],
    mainCategoriesMap: [
      { category: 'Endpoint',         indices: [{ indexName: 'logs-endpoint.events.process-default', docs: 12400 }, { indexName: 'logs-endpoint.alerts-default', docs: 320 }] },
      { category: 'Identity',         indices: [{ indexName: 'logs-okta.system-default', docs: 0 }] },
      { category: 'Network',          indices: [{ indexName: 'logs-network_traffic.flow-default', docs: 0 }, { indexName: 'logs-zeek.connection-default', docs: 0 }] },
      { category: 'Cloud',            indices: [{ indexName: 'logs-aws.cloudtrail-default', docs: 0 }] },
      { category: 'Application/SaaS', indices: [{ indexName: 'logs-google_workspace.admin-default', docs: 0 }] },
    ],
  });
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
    { name: 'logs-endpoint.events.process@pipeline', indices: ['logs-endpoint.events.process-default'], docsCount: 12400, failedDocsCount: 0, statsAvailable: true },
    { name: 'logs-endpoint.alerts@pipeline',         indices: ['logs-endpoint.alerts-default'],         docsCount: 320,   failedDocsCount: 0, statsAvailable: true },
  ]);
});

// ── GET /api/siem_readiness/get_retention ─────────────────────────────────────
router.get('/siem_readiness/get_retention', (_req: Request, res: Response) => {
  res.json({
    items: [
      { indexName: 'logs-endpoint.events.process-default', isDataStream: true, retentionType: 'ilm', retentionPeriod: '30d', retentionDays: 30, policyName: 'logs-default-policy', status: 'healthy' },
      { indexName: 'logs-endpoint.alerts-default',         isDataStream: true, retentionType: 'ilm', retentionPeriod: '90d', retentionDays: 90, policyName: 'logs-default-policy', status: 'healthy' },
    ],
  });
});

export default router;
