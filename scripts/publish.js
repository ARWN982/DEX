const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const projectFlagIndex = args.indexOf('--project');

if (projectFlagIndex === -1 || !args[projectFlagIndex + 1]) {
  console.error('\nUsage: npm run publish:project -- --project <project-name>\n');
  console.error('Example: npm run publish:project -- --project my-project\n');
  process.exit(1);
}

const projectName = args[projectFlagIndex + 1];
const pagesDir = path.join(__dirname, '../src/public/pages');
const projectDir = path.join(pagesDir, projectName);

if (!fs.existsSync(projectDir)) {
  console.error(`\nProject "${projectName}" not found at ${projectDir}`);
  console.error('\nAvailable projects:');
  const dirs = fs.readdirSync(pagesDir).filter(f => {
    return fs.statSync(path.join(pagesDir, f)).isDirectory() && !f.startsWith('.');
  });
  dirs.forEach(d => console.error(`  - ${d}`));
  process.exit(1);
}

// Scan for version folders (v1.0, v2.0, etc.) that contain an index.tsx
const versions = fs.readdirSync(projectDir)
  .filter(f => {
    if (!f.startsWith('v') || !f.match(/^v\d+\.\d+$/)) return false;
    const indexPath = path.join(projectDir, f, 'index.tsx');
    return fs.existsSync(indexPath);
  })
  .map(f => f.substring(1)) // Remove 'v' prefix
  .sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    return aMaj - bMaj || aMin - bMin;
  });

if (versions.length === 0) {
  console.error(`\nNo versions found for project "${projectName}".`);
  console.error('Version folders should be named like v1.0, v2.0, etc. and contain an index.tsx file.');
  process.exit(1);
}

const displayName = projectName
  .split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

console.log(`\nPublishing "${displayName}" with ${versions.length} version(s): ${versions.join(', ')}\n`);

// Copy chart theme CSS first
try {
  execSync('npm run copy:chart-themes', { stdio: 'inherit' });
} catch {
  console.warn('Warning: Could not copy chart themes. Continuing...');
}

// Run webpack with the publish config
const env = {
  ...process.env,
  PUBLISH_PROJECT: projectName,
  PUBLISH_VERSIONS: JSON.stringify(versions),
  PUBLISH_DISPLAY_NAME: displayName,
};

try {
  execSync(
    `npx webpack --config webpack.publish.js`,
    { stdio: 'inherit', env }
  );
} catch (err) {
  console.error('\nBuild failed.');
  process.exit(1);
}

const outputDir = path.join(__dirname, '..', 'publish', projectName);
console.log(`\nPublished successfully to: publish/${projectName}/`);
console.log(`Open publish/${projectName}/index.html in a browser to preview.`);
console.log('Or deploy the folder to any static hosting (GitHub Pages, Netlify Drop, etc.).\n');
