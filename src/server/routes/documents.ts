import { Router, Request, Response } from "express";
import { esClient } from "../lib/elasticsearch";

const router = Router();

// Fallback mock data in case ES is unavailable
function generateFallbackData(index: string) {
  const now = new Date().getTime();
  const docs = [];
  
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now - Math.random() * 15 * 60 * 1000);
    docs.push({
      _id: `fallback_${i}`,
      '@timestamp': timestamp.toISOString(),
      timestamp: timestamp.toISOString(),
      level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
      message: `Sample log message ${i}`,
      service: `service-${Math.floor(Math.random() * 3) + 1}`,
      host: `host-${Math.floor(Math.random() * 3) + 1}`
    });
  }
  
  return docs.sort((a, b) => new Date(b['@timestamp']).getTime() - new Date(a['@timestamp']).getTime());
}

// Shared handler for both GET and POST requests
const documentsHandler = async (req: Request, res: Response) => {
  // Support both GET (query parameters) and POST (request body) requests
  const params = req.method === 'GET' ? req.query : req.body;
  
  const { 
    index = 'remote_cluster:logs*', 
    search = '', 
    from = 'now-15h', // Changed from 'now-15m' to 'now-15h' to match frontend default
    to = 'now', 
    size = '1000',
    filters = []
  } = params;
  
  
  try {
    // Build Elasticsearch query
    const query: any = {
      bool: {
        must: [] as any[],
        filter: [
          {
            range: {
              '@timestamp': {
                gte: from,
                lte: to,
                format: 'strict_date_optional_time'
              }
            }
          }
        ]
      }
    };

    // Add search query if provided
    if (search && (search as string).trim()) {
      query.bool.must.push({
        query_string: {
          query: search,
          default_field: 'message'
        }
      });
    }

    // Add filters if provided
    if (filters && Array.isArray(filters) && filters.length > 0) {
      console.log("Documents API - Processing filters:", filters);
      
      for (const filter of filters) {
        const { field, operator, values } = filter;
          
        if ((operator === 'is' || operator === 'equals') && values && values.length > 0) {
          // Handle "is" operator with multiple values (OR condition)
          if (values.length === 1) {
            // For text fields like message, use match_phrase; for others use term
            if (field === 'message') {
              query.bool.filter.push({
                match_phrase: {
                  [field]: values[0]
                }
              });
            } else {
              // Single value - try both keyword and regular field for non-text fields
              query.bool.filter.push({
                bool: {
                  should: [
                    { term: { [`${field}.keyword`]: values[0] } },
                    { term: { [field]: values[0] } }
                  ],
                  minimum_should_match: 1
                }
              });
            }
          } else {
            // Multiple values
            if (field === 'message') {
              // For message field with multiple values, use match_phrase for each
              query.bool.filter.push({
                bool: {
                  should: values.map((value: string) => ({
                    match_phrase: { [field]: value }
                  })),
                  minimum_should_match: 1
                }
              });
            } else {
              // Multiple values - try both keyword and regular field for non-text fields
              query.bool.filter.push({
                bool: {
                  should: [
                    { terms: { [`${field}.keyword`]: values } },
                    { terms: { [field]: values } }
                  ],
                  minimum_should_match: 1
                }
              });
            }
          }
        } else if ((operator === 'is not' || operator === 'not equals') && values && values.length > 0) {
          // Handle "is not" operator (NOT condition)
          query.bool.must_not = query.bool.must_not || [];
          if (values.length === 1) {
            // Single value - exclude both keyword and regular field
            query.bool.must_not.push({
              bool: {
                should: [
                  { term: { [`${field}.keyword`]: values[0] } },
                  { term: { [field]: values[0] } }
                ]
              }
            });
          } else {
            // Multiple values - exclude both keyword and regular field
            query.bool.must_not.push({
              bool: {
                should: [
                  { terms: { [`${field}.keyword`]: values } },
                  { terms: { [field]: values } }
                ]
              }
            });
          }
        }
      }
    }

    // Execute search with timeout configuration
    
    // Use a sampling approach to get data from across the full time range
    const requestedSize = parseInt(size as string);
    const searchBody: any = {
      query: {
        function_score: {
          query: query,
          random_score: {
            seed: 42, // Fixed seed for consistent results during a session
            field: '_seq_no' // Use sequence number for better distribution
          },
          boost_mode: 'replace'
        }
      },
      size: requestedSize
    };


    const response = await Promise.race([
      (esClient as any).search({
        index: index as string,
        body: searchBody
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout after 25s')), 25000) // 25 second timeout
      )
    ]);

    // Format documents for the frontend
    const responseBody = (response as any).body || response;
    const hits = responseBody.hits;
    const documents = hits.hits.map((hit: any) => ({
      _id: hit._id,
      _index: hit._index,
      ...hit._source
    }));

    // Analyze timestamp distribution of returned documents
    const timestamps = documents.map((doc: any) => doc['@timestamp']).filter((ts: any) => ts).sort();
    const oldestDoc = timestamps[0];
    const newestDoc = timestamps[timestamps.length - 1];
    
    // Count documents per day
    const dailyCounts: Record<string, number> = {};
    timestamps.forEach((ts: any) => {
      const date = new Date(ts).toISOString().split('T')[0]; // Get YYYY-MM-DD
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Get the correct total from the main search response
    const totalHits = hits.total?.value || hits.total || documents.length;

    res.status(200).json({
      documents,
      total: totalHits,
      index,
      search,
      from,
      to
    });

  } catch (error) {
    console.error('Elasticsearch query error:', error);
    console.error('Error details:', (error as Error).message);
    
    // Fallback to mock data if ES fails
    const mockDocuments = generateFallbackData(index as string);
    
    res.status(200).json({
      documents: mockDocuments,
      total: mockDocuments.length,
      index,
      search,
      from,
      to,
      fallback: true
    });
  }
};

// Register both GET and POST routes
router.get("/documents", documentsHandler);
router.post("/documents", documentsHandler);

export default router;