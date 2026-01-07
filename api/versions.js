// Simple Vercel serverless function for versions
const versionsManifest = require('./versions-manifest.json');

// In-memory storage for active versions per page (resets on cold start)
const activeVersions = {};

module.exports = (req, res) => {
  // Handle POST to /api/versions/active
  if ((req.url.includes('/active') || req.url === '/active') && req.method === 'POST') {
    const { versionId, page = 'esql-simple-mode' } = req.body || {};
    
    if (!versionId) {
      return res.status(400).json({ error: 'versionId is required' });
    }
    
    // Store active version for this page
    activeVersions[page] = versionId;
    
    return res.json({ success: true, versionId, page });
  }
  
  // Handle GET to /api/versions
  const { page = 'esql-simple-mode' } = req.query;
  
  const versionIds = versionsManifest[page] || [];
  
  // Get active version for this page (or default to latest)
  const activeVersion = activeVersions[page] || versionIds[versionIds.length - 1] || '1.0';
  
  const versions = versionIds.map(id => ({
    id,
    name: `Version ${id}`,
    description: '',
    createdAt: new Date().toISOString(),
    basedOn: null,
    isActive: id === activeVersion
  }));

  res.json({
    versions,
    currentVersion: activeVersion
  });
};

