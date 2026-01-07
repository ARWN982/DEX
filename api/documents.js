// Simple mock data generator for serverless function
function generateMockDocuments(size) {
  const docs = [];
  const now = Date.now();
  
  for (let i = 0; i < size; i++) {
    docs.push({
      '@timestamp': new Date(now - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      message: `Log entry ${i}`,
      level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
      service: ['web', 'api', 'db'][Math.floor(Math.random() * 3)],
      user_id: Math.floor(Math.random() * 1000),
      request_id: Math.random().toString(36).substring(7)
    });
  }
  
  return docs;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { index, size = 500, from = 0 } = req.body;
    
    console.log(`Mock: Generating ${size} documents for index: ${index || 'logs-*'}`);

    // Generate mock log data
    const documents = generateMockDocuments(size);
    
    res.status(200).json({
      hits: {
        total: { value: 10000, relation: 'eq' },
        hits: documents.map(doc => ({
          _source: doc,
          _index: index || 'logs-*',
          _id: Math.random().toString(36)
        }))
      }
    });
  } catch (error) {
    console.error('Error in documents API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}