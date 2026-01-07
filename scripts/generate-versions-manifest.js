const fs = require('fs');
const path = require('path');

// Generate a versions manifest for production deployment
function generateVersionsManifest() {
  const pagesDir = path.join(__dirname, '../src/public/pages');
  const manifest = {};

  // Read all page directories
  const pages = fs.readdirSync(pagesDir).filter(file => {
    const stat = fs.statSync(path.join(pagesDir, file));
    return stat.isDirectory();
  });

  // For each page, find version folders
  pages.forEach(page => {
    const pageDir = path.join(pagesDir, page);
    const items = fs.readdirSync(pageDir);
    
    const versions = items
      .filter(folder => folder.startsWith('v') && folder.match(/^v\d+\.\d+$/))
      .map(folder => folder.substring(1)) // Remove 'v' prefix
      .sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        return aParts[0] - bParts[0] || aParts[1] - bParts[1];
      });
    
    if (versions.length > 0) {
      manifest[page] = versions;
    }
  });

  // Write manifest to multiple locations
  
  // 1. Write to dist/public (for static serving)
  const distPublicDir = path.join(__dirname, '../dist/public');
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(distPublicDir, 'versions-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // 2. Write to api directory (for Vercel serverless functions)
  const apiDir = path.join(__dirname, '../api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(apiDir, 'versions-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('Generated versions manifest:', manifest);
}

generateVersionsManifest();

