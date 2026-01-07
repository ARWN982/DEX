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

/**
 * POST /api/projects
 * Creates a new project with initial version 1.0
 * Body: { name: string, description?: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Project name is required' 
      });
    }

    // Validate project name format (lowercase, alphanumeric, hyphens, underscores)
    const nameRegex = /^[a-z0-9-_]+$/;
    const normalizedName = name.trim().toLowerCase();
    
    if (!nameRegex.test(normalizedName)) {
      return res.status(400).json({ 
        success: false,
        error: 'Project name can only contain lowercase letters, numbers, hyphens, and underscores' 
      });
    }

    // Determine pages directory
    let pagesDir = path.join(__dirname, '../../../src/public/pages');
    try {
      await fs.access(pagesDir);
    } catch {
      pagesDir = path.join(__dirname, '../../public/pages');
    }

    const projectDir = path.join(pagesDir, normalizedName);
    const versionDir = path.join(projectDir, 'v1.0');
    const indexPath = path.join(versionDir, 'index.tsx');
    const aboutPath = path.join(projectDir, 'about.json');

    // Check if project already exists
    try {
      await fs.access(projectDir);
      return res.status(409).json({ 
        success: false,
        error: `Project "${normalizedName}" already exists` 
      });
    } catch {
      // Project doesn't exist, proceed with creation
    }

    // Create project directory structure
    await fs.mkdir(versionDir, { recursive: true });

    // Generate component name from project name (kebab-case to PascalCase)
    const componentName = normalizedName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    // Create initial index.tsx file
    const indexContent = `import React from 'react';
import { EuiPage, EuiPageBody, EuiPageSection, EuiTitle, EuiText } from '@elastic/eui';

const ${componentName}: React.FC = () => {
  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageSection>
          <EuiTitle size="l">
            <h1>${normalizedName.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}</h1>
          </EuiTitle>
          <EuiText>
            <p>${description || 'Welcome to your new project!'}</p>
          </EuiText>
        </EuiPageSection>
      </EuiPageBody>
    </EuiPage>
  );
};

export default ${componentName};
`;

    await fs.writeFile(indexPath, indexContent, 'utf-8');

    // Create about.json metadata file
    const aboutData = {
      projectName: normalizedName,
      designer: '',
      pm: '',
      briefDescription: description || '',
      prdLink: '',
      githubIssueLink: '',
      breadcrumb: '',
    };

    await fs.writeFile(aboutPath, JSON.stringify(aboutData, null, 2), 'utf-8');

    // Create initial comments.json and jobStories.json files
    const commentsPath = path.join(versionDir, 'comments.json');
    const jobStoriesPath = path.join(versionDir, 'jobStories.json');

    const commentsData = {
      comments: [],
      metadata: {
        pageId: normalizedName,
        versionId: '1.0',
        lastUpdated: new Date().toISOString(),
      },
    };

    const jobStoriesData = {
      stories: [],
      metadata: {
        versionId: '1.0',
        lastUpdated: new Date().toISOString(),
      },
    };

    await fs.writeFile(commentsPath, JSON.stringify(commentsData, null, 2), 'utf-8');
    await fs.writeFile(jobStoriesPath, JSON.stringify(jobStoriesData, null, 2), 'utf-8');

    console.log(`Created new project: ${normalizedName}`);

    res.json({ 
      success: true, 
      message: `Project "${normalizedName}" created successfully`,
      project: {
        name: normalizedName,
        path: `/${normalizedName}`,
      }
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create project',
      message: error.message 
    });
  }
});

export default router;

