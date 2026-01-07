const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

// Screenshot storage directory
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'thumbnails');

// Ensure thumbnails directory exists
async function ensureThumbnailsDirectory() {
  try {
    await fs.access(SCREENSHOTS_DIR);
  } catch {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * API endpoint to take screenshots of project pages
 * POST /api/screenshots/:projectName
 * Body: { version?: string }
 * 
 * Takes a screenshot of the project's latest (or specified) version
 * and saves it as a thumbnail for the homepage
 */
module.exports = async (req, res) => {
  try {
    const { projectName } = req.params;
    const { version } = req.body || {};

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    await ensureThumbnailsDirectory();

    // Determine which version to screenshot
    let targetVersion = version;
    if (!targetVersion) {
      // Get latest version if not specified
      const versionsResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/versions?page=${projectName}`);
      if (versionsResponse.ok) {
        const data = await versionsResponse.json();
        if (data.versions && data.versions.length > 0) {
          // Sort versions and get the highest one
          const sortedVersions = data.versions.sort((a, b) => {
            const aNum = parseFloat(a.id.replace('v', ''));
            const bNum = parseFloat(b.id.replace('v', ''));
            return bNum - aNum; // Descending order
          });
          targetVersion = sortedVersions[0].id;
        }
      }
      if (!targetVersion) {
        targetVersion = 'v1.0'; // Fallback
      }
    }

    console.log(`Taking screenshot of ${projectName} version ${targetVersion}`);

    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport to match the thumbnail aspect ratio (400x240 -> 5:3 ratio)
      await page.setViewport({ 
        width: 1440, 
        height: 864 // 1440 * (3/5) to maintain aspect ratio at desktop size
      });

      // Navigate to the project page
      const projectUrl = `http://localhost:${process.env.PORT || 3001}/${projectName}`;
      console.log(`Navigating to ${projectUrl}`);
      
      await page.goto(projectUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a bit for any animations or dynamic content to load
      await page.waitForTimeout(2000);

      // Define the thumbnail filename
      const thumbnailFilename = `${projectName}-${targetVersion}.png`;
      const thumbnailPath = path.join(SCREENSHOTS_DIR, thumbnailFilename);

      // Take screenshot
      await page.screenshot({
        path: thumbnailPath,
        type: 'png',
        fullPage: false // Only capture the viewport
      });

      console.log(`Screenshot saved to ${thumbnailPath}`);

      // Update project metadata to include thumbnail info
      const metadataPath = path.join(__dirname, '..', 'data', 'project-metadata', `${projectName}.json`);
      let metadata = {};
      try {
        const existingMetadata = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(existingMetadata);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty metadata
        console.log(`Creating new metadata file for ${projectName}`);
      }

      // Update thumbnail info
      metadata.thumbnail = {
        filename: thumbnailFilename,
        version: targetVersion,
        createdAt: new Date().toISOString(),
        url: `/thumbnails/${thumbnailFilename}`
      };

      // Ensure metadata directory exists
      const metadataDir = path.dirname(metadataPath);
      await fs.mkdir(metadataDir, { recursive: true });
      
      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      res.json({
        success: true,
        message: `Screenshot taken for ${projectName} version ${targetVersion}`,
        thumbnail: metadata.thumbnail
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({ 
      error: 'Failed to take screenshot',
      details: error.message 
    });
  }
};