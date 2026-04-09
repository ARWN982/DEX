import { Router, type Router as RouterType, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const router: RouterType = Router();

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

        // Check if it has an about file (about.md or legacy about.json)
        let hasAbout = false;
        try {
          await fs.access(path.join(projectPath, 'about.md'));
          hasAbout = true;
        } catch {
          try {
            await fs.access(path.join(projectPath, 'about.json'));
            hasAbout = true;
          } catch {
            hasAbout = false;
          }
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
    const { name, description, templateName } = req.body;

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
    const aboutPath = path.join(projectDir, 'about.md');

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

    // If creating from a template, copy template files
    if (templateName) {
      const templateDir = path.join(__dirname, '../../../src/public/templates', templateName);
      const templateIndexPath = path.join(templateDir, 'index.tsx');
      
      try {
        // Check if template exists
        await fs.access(templateIndexPath);
        
        // Read template index.tsx
        let templateContent = await fs.readFile(templateIndexPath, 'utf-8');
        
        // Replace the component name with the new project's component name
        // Find the component name in the template (usually the first export)
        const templateComponentMatch = templateContent.match(/export\s+(?:const|default)\s+(\w+)/);
        if (templateComponentMatch) {
          const templateComponentName = templateComponentMatch[1];
          templateContent = templateContent.replace(
            new RegExp(`\\b${templateComponentName}\\b`, 'g'),
            componentName
          );
        }
        
        // Update import paths - templates are at templates/discover/, projects are at pages/project/v1.0/
        // Templates: import from '../../components' (2 levels up from templates/discover/)
        // Projects: import from '../../../components' (3 levels up from pages/project/v1.0/)
        // Replace relative imports that go up 2 levels with 3 levels
        templateContent = templateContent.replace(
          /from\s+(['"])\.\.\/\.\.\/([^'"]+)\1/g,
          (match, quote, importPath) => {
            if (importPath.startsWith('../')) {
              return match;
            }
            return `from ${quote}../../../${importPath}${quote}`;
          }
        );
        
        // Write the template content as the project's index.tsx
        await fs.writeFile(indexPath, templateContent, 'utf-8');
        
        // Copy template components directory if it exists
        const templateComponentsDir = path.join(templateDir, 'components');
        const projectComponentsDir = path.join(versionDir, 'components');
        try {
          await fs.access(templateComponentsDir);
          // Copy entire components directory
          await fs.cp(templateComponentsDir, projectComponentsDir, { recursive: true });
          
          // Fix import paths in copied component files
          // Components in templates use ../../../utils, but in projects need ../../../../utils
          const componentFiles = await fs.readdir(projectComponentsDir, { recursive: true });
          for (const file of componentFiles) {
            if (typeof file === 'string' && file.endsWith('.tsx')) {
              const filePath = path.join(projectComponentsDir, file);
              let fileContent = await fs.readFile(filePath, 'utf-8');
              
              // Fix relative imports that go up 3 levels (need 4 in the new location)
              fileContent = fileContent.replace(
                /from\s+(['"])\.\.\/\.\.\/\.\.\/([^'"]+)\1/g,
                (match, quote, importPath) => {
                  if (importPath.startsWith('../')) {
                    return match;
                  }
                  return `from ${quote}../../../../${importPath}${quote}`;
                }
              );
              
              await fs.writeFile(filePath, fileContent, 'utf-8');
            }
          }
        } catch {
          // No components directory, that's fine
        }
        
        console.log(`Created project "${normalizedName}" from template "${templateName}"`);
      } catch (templateError) {
        console.error(`Failed to load template "${templateName}":`, templateError);
        return res.status(404).json({
          success: false,
          error: `Template "${templateName}" not found`
        });
      }
    } else {
      // Create initial index.tsx file with EmptyState
      const indexContent = `import React from 'react';
import { EmptyState } from '../../../components/shared/EmptyState';

const ${componentName}: React.FC = () => {
  return <EmptyState pageName="${normalizedName}" versionId="1.0" />;
};

export default ${componentName};
`;

      await fs.writeFile(indexPath, indexContent, 'utf-8');
    }

    // Create about.md metadata file with YAML frontmatter
    const frontmatter = {
      projectName: normalizedName,
      designer: '',
      pm: '',
      prdLink: '',
      githubIssueLink: '',
      breadcrumb: '',
    };
    const aboutContent = matter.stringify(description || '', frontmatter);
    await fs.writeFile(aboutPath, aboutContent, 'utf-8');

    // Create initial comments.json file
    const commentsPath = path.join(versionDir, 'comments.json');

    const commentsData = {
      comments: [],
      metadata: {
        pageId: normalizedName,
        versionId: '1.0',
        lastUpdated: new Date().toISOString(),
      },
    };

    await fs.writeFile(commentsPath, JSON.stringify(commentsData, null, 2), 'utf-8');

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

