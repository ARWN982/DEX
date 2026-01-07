import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

interface Project {
  name: string;
  displayName: string;
  hasAbout: boolean;
  versions: string[];
}

/**
 * GET /api/projects
 * Automatically discovers all projects in src/public/pages
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // In production (dist folder), __dirname is dist/server/routes
    // We need to go up to the project root and then to src/public/pages
    // In development, this should work from either location
    let pagesDir = path.join(__dirname, '../../../src/public/pages');
    
    // Fallback: if src folder doesn't exist, we're in dist, so look for pages in dist
    try {
      await fs.access(pagesDir);
    } catch {
      // Try alternative path for when running from dist
      pagesDir = path.join(__dirname, '../../public/pages');
    }
    
    const projects: Project[] = [];

    // Read all directories in pages folder
    const entries = await fs.readdir(pagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const projectName = entry.name;
        const projectPath = path.join(pagesDir, projectName);

        // Check if it has an about.json file
        const aboutPath = path.join(projectPath, 'about.json');
        let hasAbout = false;
        try {
          await fs.access(aboutPath);
          hasAbout = true;
        } catch {
          hasAbout = false;
        }

        // Find all version folders (v1.0, v1.1, etc.)
        const versions: string[] = [];
        const projectEntries = await fs.readdir(projectPath, { withFileTypes: true });
        
        for (const projectEntry of projectEntries) {
          if (projectEntry.isDirectory() && projectEntry.name.startsWith('v')) {
            // Check if it has an index.tsx file
            const indexPath = path.join(projectPath, projectEntry.name, 'index.tsx');
            try {
              await fs.access(indexPath);
              // Extract version number (v1.0 -> 1.0)
              const version = projectEntry.name.substring(1);
              versions.push(version);
            } catch {
              // Skip folders without index.tsx
            }
          }
        }

        // Only include projects that have at least one version
        if (versions.length > 0) {
          // Sort versions
          versions.sort((a, b) => {
            const aNum = parseFloat(a);
            const bNum = parseFloat(b);
            return aNum - bNum;
          });

          // Convert kebab-case to Title Case for display name
          const displayName = projectName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          projects.push({
            name: projectName,
            displayName,
            hasAbout,
            versions
          });
        }
      }
    }

    // Sort projects alphabetically by display name
    projects.sort((a, b) => a.displayName.localeCompare(b.displayName));

    res.json({ success: true, projects });
  } catch (error: any) {
    console.error('Error discovering projects:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to discover projects',
      message: error.message 
    });
  }
});

export default router;

