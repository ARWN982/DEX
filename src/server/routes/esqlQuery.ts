import { Router, Request, Response } from 'express';

const router = Router();

interface ESQLQueryRequest {
  query: string;
  from?: string;
  to?: string;
}

router.post('/esql/query', async (req: Request<Record<string, never>, unknown, ESQLQueryRequest>, res: Response) => {
  try {
    const { query, from, to } = req.body;

    if (!query) {
      return res.status(400).json({
        values: [],
        error: 'Query is required'
      });
    }

    console.log(`Mock: executing ES|QL query: ${query}`);
    console.log(`Mock: time range from ${from} to ${to}`);

    // Generate mock histogram data that looks realistic for logs-*
    const now = Date.now();
    const hours = 24; // Last 24 hours
    const bucketIntervalMs = 6 * 60 * 60 * 1000; // 6-hour buckets
    const values: any[] = [];

    for (let i = 0; i < hours / 6; i++) {
      const timestamp = new Date(now - (hours - i * 6) * 60 * 60 * 1000).toISOString();
      // Generate realistic log counts (higher during business hours)
      const hour = new Date(timestamp).getHours();
      const baseCount = hour >= 9 && hour <= 17 ? 150 : 50; // More logs during business hours
      const randomVariation = Math.floor(Math.random() * 100);
      const count = baseCount + randomVariation;
      
      values.push([count, timestamp]);
    }

    // Return mock ES|QL response structure
    res.json({
      values,
      columns: [
        { name: "count(*)", type: "long" },
        { name: "BUCKET(@timestamp, ...)", type: "date" }
      ]
    });

  } catch (error: unknown) {
    console.error('ES|QL query error:', error);

    const errorMessage = (error as any)?.meta?.body?.error?.reason ||
                        (error as any)?.message ||
                        'Unknown error occurred';

    res.status(500).json({
      values: [],
      error: errorMessage
    });
  }
});

export default router;