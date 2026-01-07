"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const playwright_1 = require("playwright");
const router = express_1.default.Router();
// Screenshot storage directory
const SCREENSHOTS_DIR = path_1.default.join(process.cwd(), 'public', 'thumbnails');
// Ensure thumbnails directory exists
async function ensureThumbnailsDirectory() {
    try {
        await promises_1.default.access(SCREENSHOTS_DIR);
    }
    catch {
        await promises_1.default.mkdir(SCREENSHOTS_DIR, { recursive: true });
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
            try {
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
            }
            catch (error) {
                console.error('Failed to fetch latest version:', error);
            }
            if (!targetVersion) {
                targetVersion = '1.0'; // Fallback
            }
        }
        console.log(`Taking screenshot of ${projectName} version ${targetVersion}`);
        // Launch Playwright browser
        const browser = await playwright_1.chromium.launch({
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
            const baseUrl = process.env.NODE_ENV === 'development'
                ? `http://localhost:${process.env.PORT || 3001}`
                : 'http://localhost:3001'; // Fallback for production
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
            const thumbnailPath = path_1.default.join(SCREENSHOTS_DIR, thumbnailFilename);
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
            const metadataPath = path_1.default.join(process.cwd(), 'src', 'public', 'pages', projectName, 'about.json');
            let metadata = {};
            try {
                const existingMetadata = await promises_1.default.readFile(metadataPath, 'utf-8');
                metadata = JSON.parse(existingMetadata);
            }
            catch (error) {
                // File doesn't exist or is invalid, start with default metadata
                console.log(`Creating new metadata file for ${projectName}`);
                metadata = {
                    projectName: projectName,
                    designer: '',
                    pm: '',
                    briefDescription: '',
                    prdLink: '',
                    githubIssueLink: '',
                    breadcrumb: '',
                };
            }
            // Update thumbnail info
            metadata.thumbnail = {
                filename: thumbnailFilename,
                version: targetVersion,
                createdAt: new Date().toISOString(),
                url: `/thumbnails/${thumbnailFilename}`
            };
            // Save updated metadata
            await promises_1.default.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            res.json({
                success: true,
                message: `Screenshot taken for ${projectName} version ${targetVersion}`,
                thumbnail: metadata.thumbnail
            });
        }
        finally {
            await browser.close();
        }
    }
    catch (error) {
        console.error('Error taking screenshot:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Failed to take screenshot',
            details: errorMessage
        });
    }
});
exports.default = router;
//# sourceMappingURL=screenshots.js.map