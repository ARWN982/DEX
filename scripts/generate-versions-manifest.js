const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/public/pages');
const distPublicDir = path.join(__dirname, '../dist/public');
const apiDir = path.join(__dirname, '../api');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function discoverPagesAndVersions() {
  const pages = fs.readdirSync(pagesDir).filter(file => {
    return fs.statSync(path.join(pagesDir, file)).isDirectory() && !file.startsWith('.');
  });

  const result = {};
  pages.forEach(page => {
    const pageDir = path.join(pagesDir, page);
    const items = fs.readdirSync(pageDir);

    const versions = items
      .filter(folder => folder.startsWith('v') && folder.match(/^v\d+\.\d+$/))
      .filter(folder => {
        const indexPath = path.join(pageDir, folder, 'index.tsx');
        return fs.existsSync(indexPath);
      })
      .map(folder => folder.substring(1))
      .sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        return aParts[0] - bParts[0] || aParts[1] - bParts[1];
      });

    if (versions.length > 0) {
      result[page] = versions;
    }
  });

  return result;
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateVersionsManifest(pagesWithVersions) {
  ensureDir(distPublicDir);
  ensureDir(apiDir);
  writeJSON(path.join(distPublicDir, 'versions-manifest.json'), pagesWithVersions);
  writeJSON(path.join(apiDir, 'versions-manifest.json'), pagesWithVersions);
  console.log('Generated versions manifest:', pagesWithVersions);
}

function generateProjectsManifest(pagesWithVersions) {
  const projects = Object.entries(pagesWithVersions).map(([name, versions]) => {
    const displayName = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const aboutPath = path.join(pagesDir, name, 'about.json');
    const hasAbout = fs.existsSync(aboutPath);

    return { name, displayName, hasAbout, versions };
  });

  projects.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const manifest = { success: true, projects };

  ensureDir(apiDir);
  writeJSON(path.join(apiDir, 'projects-manifest.json'), manifest);
  console.log('Generated projects manifest:', projects.map(p => p.name));
}

const pagesWithVersions = discoverPagesAndVersions();
generateVersionsManifest(pagesWithVersions);
generateProjectsManifest(pagesWithVersions);

