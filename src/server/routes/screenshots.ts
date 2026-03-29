import fs from 'fs/promises';
import path from 'path';
import express, { Router } from 'express';
import { chromium } from 'playwright';
import matter from 'gray-matter';

const router: Router = express.Router();

// Screenshot storage directory
const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'thumbnails');

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
router.post('/screenshots/:projectName', async (req, res) => {
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
      // Use backend port for API calls
      const backendPort = process.env.PORT || 3000;
      try {
        const versionsResponse = await fetch(`http://localhost:${backendPort}/api/versions?page=${projectName}`);
        if (versionsResponse.ok) {
          const data = await versionsResponse.json();
          if (data.versions && data.versions.length > 0) {
            // Sort versions and get the highest one
            const sortedVersions = data.versions.sort((a: any, b: any) => {
              const aNum = parseFloat(a.id.replace('v', ''));
              const bNum = parseFloat(b.id.replace('v', ''));
              return bNum - aNum; // Descending order
            });
            targetVersion = sortedVersions[0].id;
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest version:', error);
      }
      if (!targetVersion) {
        targetVersion = '1.0'; // Fallback
      }
    }

    console.log(`Taking screenshot of ${projectName} version ${targetVersion}`);

    // Launch Playwright browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport to match the thumbnail aspect ratio (400x240 -> 5:3 ratio)
      await page.setViewportSize({ 
        width: 1440, 
        height: 864 // 1440 * (3/5) to maintain aspect ratio at desktop size
      });

      // Navigate to the project page
      // Projects are served by the frontend (webpack dev server), not the backend
      const frontendPort = process.env.FRONTEND_PORT || '3002';
      const baseUrl = `http://localhost:${frontendPort}`;
      
      const projectUrl = `${baseUrl}/${projectName}`;
      console.log(`Navigating to ${projectUrl}`);
      
      await page.goto(projectUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit for any animations or dynamic content to load
      await page.waitForTimeout(3000);

      // Define the thumbnail filename
      const thumbnailFilename = `${projectName}-${targetVersion}.png`;
      const thumbnailPath = path.join(SCREENSHOTS_DIR, thumbnailFilename);

      // Take screenshot
      await page.screenshot({
        path: thumbnailPath,
        type: 'png',
        fullPage: false, // Only capture the viewport
        clip: {
          x: 0,
          y: 0,
          width: 1440,
          height: 864
        }
      });

      console.log(`Screenshot saved to ${thumbnailPath}`);

      // Update project metadata to include thumbnail info
      const projectDir = path.join(process.cwd(), 'src', 'public', 'pages', projectName);
      const mdPath = path.join(projectDir, 'about.md');
      const jsonPath = path.join(projectDir, 'about.json');

      let frontmatter: Record<string, any> = {
        projectName,
        designer: '',
        pm: '',
        prdLink: '',
        githubIssueLink: '',
        breadcrumb: '',
      };
      let bodyMarkdown = '';

      // Read existing about.md or about.json
      try {
        const raw = await fs.readFile(mdPath, 'utf-8');
        const parsed = matter(raw);
        frontmatter = { ...frontmatter, ...parsed.data };
        bodyMarkdown = parsed.content.trim();
      } catch {
        try {
          const raw = await fs.readFile(jsonPath, 'utf-8');
          const json = JSON.parse(raw);
          frontmatter = { ...frontmatter, ...json };
          bodyMarkdown = json.briefDescription || '';
          delete frontmatter.briefDescription;
        } catch {
          console.log(`Creating new metadata file for ${projectName}`);
        }
      }

      frontmatter.thumbnail = {
        filename: thumbnailFilename,
        version: targetVersion,
        createdAt: new Date().toISOString(),
        url: `/thumbnails/${thumbnailFilename}`
      };

      // Always write as about.md
      await fs.writeFile(mdPath, matter.stringify(bodyMarkdown, frontmatter), 'utf-8');

      // Clean up legacy about.json
      try { await fs.unlink(jsonPath); } catch {}

      res.json({
        success: true,
        message: `Screenshot taken for ${projectName} version ${targetVersion}`,
        thumbnail: frontmatter.thumbnail
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error taking screenshot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to take screenshot',
      details: errorMessage 
    });
  }
});

/**
 * API endpoint to take screenshots of template pages
 * POST /api/screenshots/templates/:templateName
 * 
 * Takes a screenshot of the template page and saves it as a thumbnail
 */
router.post('/screenshots/templates/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;

    if (!templateName) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    await ensureThumbnailsDirectory();

    console.log(`Taking screenshot of template ${templateName}`);

    // Launch Playwright browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport to match the thumbnail aspect ratio
      await page.setViewportSize({ 
        width: 1440, 
        height: 864
      });

      // Navigate to the template page
      // Use the frontend port (3002) for templates since they're served by webpack dev server
      const frontendPort = process.env.FRONTEND_PORT || '3002';
      const baseUrl = `http://localhost:${frontendPort}`;
      
      // Templates are accessed via /templates/discover, /templates/dashboards, etc.
      const templateRoute = `/templates/${templateName}`;
      const templateUrl = `${baseUrl}${templateRoute}`;
      console.log(`Navigating to ${templateUrl}`);
      
      await page.goto(templateUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit for any animations or dynamic content to load
      await page.waitForTimeout(3000);

      // Define the thumbnail filename
      const thumbnailFilename = `template-${templateName}.png`;
      const thumbnailPath = path.join(SCREENSHOTS_DIR, thumbnailFilename);

      // Take screenshot
      await page.screenshot({
        path: thumbnailPath,
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: 1440,
          height: 864
        }
      });

      console.log(`Screenshot saved to ${thumbnailPath}`);

      // Update template metadata to include thumbnail info
      const metadataPath = path.join(process.cwd(), 'src', 'public', 'templates', templateName, 'metadata.json');
      let metadata: any = {};
      try {
        const existingMetadata = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(existingMetadata);
      } catch (error) {
        // File doesn't exist or is invalid, start with default metadata
        console.log(`Creating new metadata file for template ${templateName}`);
        metadata = {
          templateName: templateName,
        };
      }

      // Update thumbnail info
      metadata.thumbnail = {
        filename: thumbnailFilename,
        createdAt: new Date().toISOString(),
        url: `/thumbnails/${thumbnailFilename}`
      };

      // Ensure template directory exists
      const templateDir = path.dirname(metadataPath);
      await fs.mkdir(templateDir, { recursive: true });

      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      res.json({
        success: true,
        message: `Screenshot taken for template ${templateName}`,
        thumbnail: metadata.thumbnail
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error taking template screenshot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to take template screenshot',
      details: errorMessage 
    });
  }
});

export default router;