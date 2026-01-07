import { promises as fs } from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';

const router = Router();

// Paths to data files
const VERSIONS_PATH = path.join(__dirname, '../../../src/data/versions.json');

interface Version {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  basedOn?: string | null;
  isActive: boolean;
}

interface VersionsData {
  versions: Version[];
  metadata: {
    currentVersion: string;
    lastUpdated: string;
  };
}

// Helper function to scan filesystem for actual version folders for a specific page (local dev only)
async function getVersionsFromFilesystem(pageName: string): Promise<string[]> {
  if (!pageName) {
    return [];
  }
  try {
    console.log(`Scanning filesystem for versions of page: ${pageName}`);
    
    // Scan the src/public/pages directory (development)
    const pageDir = path.join(__dirname, `../../../src/public/pages/${pageName}`);
    const versionFolders = await fs.readdir(pageDir);
    
    // Filter for version folders (v1.0, v1.1, etc.)
    const versionIds = versionFolders
      .filter(folder => folder.startsWith('v') && folder.match(/^v\d+\.\d+$/))
      .map(folder => folder.substring(1)) // Remove 'v' prefix
      .sort((a, b) => {
        // Sort versions numerically
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        return aParts[0] - bParts[0] || aParts[1] - bParts[1];
      });

    console.log(`Found version folders for ${pageName}:`, versionIds);
    return versionIds;
  } catch (error) {
    console.error(`Error scanning filesystem for ${pageName}:`, error);
    return [];
  }
}

// GET /api/versions - Get all versions by scanning filesystem
router.get('/', async (req: Request, res: Response) => {
  try {
    const pageName = req.query.page as string || '';
    const versionIds = await getVersionsFromFilesystem(pageName);

    // Create version objects from discovered folders
    const versions: Version[] = versionIds.map(id => ({
      id,
      name: `Version ${id}`,
      description: '',
      createdAt: new Date().toISOString(),
      basedOn: null,
      isActive: false
    }));

    // Get current version from versions.json if it exists, otherwise default to first version
    let currentVersion = versionIds[0] || '1.0';
    
    try {
      const data = await fs.readFile(VERSIONS_PATH, 'utf8');
      const versionsData: VersionsData = JSON.parse(data);
      if (versionIds.includes(versionsData.metadata.currentVersion)) {
        currentVersion = versionsData.metadata.currentVersion;
      }
    } catch (error) {
      console.log('No versions.json found or invalid, using filesystem-based default');
    }

    // Mark current version as active
    const activeVersions = versions.map(v => ({
      ...v,
      isActive: v.id === currentVersion
    }));

    res.json({
      versions: activeVersions,
      currentVersion
    });
  } catch (error) {
    console.error('Error scanning filesystem for versions:', error);
    
    // Fallback to default version if filesystem scan fails
    const defaultData = {
      versions: [{
        id: '1.0',
        name: 'Version 1.0',
        description: '',
        createdAt: new Date().toISOString(),
        basedOn: null,
        isActive: true
      }],
      currentVersion: '1.0'
    };
    
    res.json(defaultData);
  }
});

// POST /api/versions - Create new version
router.post('/', async (req: Request, res: Response) => {
  try {
    const { versionId, baseVersionId, description, page } = req.body;
    const pageName = page || 'esql-simple-mode';
    
    console.log('Creating version:', versionId, 'based on:', baseVersionId);

    // Load existing versions
    let versionsData: VersionsData;
    try {
      const data = await fs.readFile(VERSIONS_PATH, 'utf8');
      versionsData = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, create with default structure
      versionsData = {
        versions: [],
        metadata: {
          currentVersion: '1.0',
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // Check if version ID already exists in filesystem and auto-increment if needed
    let finalVersionId = versionId;
    const existingVersionIds = await getVersionsFromFilesystem(pageName);
    
    if (existingVersionIds.includes(versionId)) {
      console.log(`Version ${versionId} already exists in filesystem, finding next available version`);
      
      // Find the next available version by incrementing the minor version
      const [major, minor] = versionId.split('.').map(Number);
      let nextMinor = minor + 1;
      
      // Keep incrementing until we find an available version
      while (existingVersionIds.includes(`${major}.${nextMinor}`)) {
        nextMinor++;
      }
      
      finalVersionId = `${major}.${nextMinor}`;
      console.log(`Auto-incremented to version ${finalVersionId}`);
    }

    // Create new version object
    const newVersion: Version = {
      id: finalVersionId,
      name: `Version ${finalVersionId}`,
      description,
      createdAt: new Date().toISOString(),
      basedOn: baseVersionId,
      isActive: true
    };

    // Update existing versions to not be active
    versionsData.versions = versionsData.versions.map(v => ({ ...v, isActive: false }));
    
    // Add new version
    versionsData.versions.push(newVersion);
    versionsData.metadata.currentVersion = finalVersionId;
    versionsData.metadata.lastUpdated = new Date().toISOString();

    // Save updated versions
    await fs.writeFile(VERSIONS_PATH, JSON.stringify(versionsData, null, 2));

    // Create version-specific data files
    await createVersionFiles(finalVersionId, baseVersionId, pageName);

    res.json(newVersion);
  } catch (error) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// POST /api/versions/active - Set active version
router.post('/active', async (req: Request, res: Response) => {
  try {
    const { versionId, page } = req.body;
    const pageName = page || 'esql-simple-mode';
    
    console.log('Setting active version to:', versionId);

    // Load and update versions
    const data = await fs.readFile(VERSIONS_PATH, 'utf8');
    const versionsData: VersionsData = JSON.parse(data);

    // Update active version
    versionsData.versions = versionsData.versions.map(v => ({
      ...v,
      isActive: v.id === versionId
    }));
    
    versionsData.metadata.currentVersion = versionId;
    versionsData.metadata.lastUpdated = new Date().toISOString();

    // Save updated versions
    await fs.writeFile(VERSIONS_PATH, JSON.stringify(versionsData, null, 2));

    res.json({ success: true, currentVersion: versionId });
  } catch (error) {
    console.error('Error setting active version:', error);
    res.status(500).json({ error: 'Failed to set active version' });
  }
});

// Helper function to create version-specific files
async function createVersionFiles(versionId: string, baseVersionId?: string | null, pageName?: string) {
  const targetPage = pageName || '';
  
  // Try dist/public/pages first (production), fall back to src/public/pages (development)
  let pagesDir = path.join(__dirname, '../../public/pages');
  try {
    await fs.access(pagesDir);
  } catch {
    pagesDir = path.join(__dirname, '../../../src/public/pages');
  }
  
  const versionDir = path.join(pagesDir, targetPage, `v${versionId}`);
  
  try {
    // Ensure version directory exists
    await fs.mkdir(versionDir, { recursive: true });
    
    const commentsFile = path.join(versionDir, 'comments.json');
    const jobStoriesFile = path.join(versionDir, 'jobStories.json');
    
    // Create comments data
    let commentsData = {
      comments: [],
      metadata: {
        versionId,
        pageId: targetPage,
        lastUpdated: new Date().toISOString()
      }
    };

    // If based on another version, copy its comments
    if (baseVersionId) {
      try {
        const baseVersionDir = path.join(pagesDir, targetPage, `v${baseVersionId}`);
        const baseCommentsFile = path.join(baseVersionDir, 'comments.json');
        const baseCommentsData = await fs.readFile(baseCommentsFile, 'utf8');
        const baseComments = JSON.parse(baseCommentsData);
        commentsData.comments = baseComments.comments || [];
        console.log(`Copied ${commentsData.comments.length} comments from ${targetPage} v${baseVersionId} to v${versionId}`);
      } catch (error) {
        console.log(`No base comments file found for ${targetPage} v${baseVersionId}, starting with empty comments`);
      }
    }

    await fs.writeFile(commentsFile, JSON.stringify(commentsData, null, 2));
    console.log(`Created comment file for ${targetPage} v${versionId}`);

    // Create job stories data
    let jobStoriesData = {
      stories: [],
      metadata: {
        versionId,
        lastUpdated: new Date().toISOString()
      }
    };

    // If based on another version, copy its job stories
    if (baseVersionId) {
      try {
        const baseVersionDir = path.join(pagesDir, targetPage, `v${baseVersionId}`);
        const baseJobStoriesFile = path.join(baseVersionDir, 'jobStories.json');
        const baseJobStoriesData = await fs.readFile(baseJobStoriesFile, 'utf8');
        const baseJobStories = JSON.parse(baseJobStoriesData);
        jobStoriesData.stories = baseJobStories.stories || [];
        console.log(`Copied ${jobStoriesData.stories.length} job stories from ${targetPage} v${baseVersionId} to v${versionId}`);
      } catch (error) {
        console.log(`No base job stories file found for ${targetPage} v${baseVersionId}, starting with empty stories`);
      }
    }

    await fs.writeFile(jobStoriesFile, JSON.stringify(jobStoriesData, null, 2));

    // Create version-specific page component directories and files
    await createVersionComponentFiles(versionId, baseVersionId, targetPage);

    console.log('Created version files for', versionId);
  } catch (error) {
    console.error('Error creating version files:', error);
    throw error;
  }
}

// Helper function to create empty state template for start-from-scratch versions
async function createEmptyStateTemplate(filePath: string, pageName: string, versionId: string) {
  try {
    // Convert pageName to component name (e.g., "simple-esql" -> "SimpleEsql", "controls" -> "Controls")
    const componentName = pageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    const template = `import React from 'react';
import { EmptyState } from '../../../components/shared/EmptyState';

// Empty component for start-from-scratch version
export const ${componentName}: React.FC = () => {
  return <EmptyState pageName="${pageName}" versionId="${versionId}" />;
};

export default ${componentName};
`;

    await fs.writeFile(filePath, template, 'utf8');
    console.log(`Created empty state template for ${pageName} v${versionId}`);
  } catch (error) {
    console.error(`Could not create empty state template for ${filePath}:`, error);
    throw error;
  }
}

// Helper function to create version-specific component files
async function createVersionComponentFiles(versionId: string, baseVersionId?: string | null, pageName?: string) {
  // Try dist/public/pages first (production), fall back to src/public/pages (development)
  let pagesDir = path.join(__dirname, '../../public/pages');
  try {
    await fs.access(pagesDir);
  } catch {
    pagesDir = path.join(__dirname, '../../../src/public/pages');
  }
  
  const targetPage = pageName || '';
  const pageNames = [targetPage]; // Only create version for the specific page
  
  try {
    for (const pageName of pageNames) {
      const versionDir = path.join(pagesDir, pageName, `v${versionId}`);
      const componentFile = path.join(versionDir, `index.tsx`);
      
      // Create directory if it doesn't exist
      await fs.mkdir(versionDir, { recursive: true });
      
      // Determine source for copying
      let sourceFile: string;
      
      if (baseVersionId) {
        // Copy from base version
        const baseVersionDir = path.join(pagesDir, pageName, `v${baseVersionId}`);
        const baseComponentFile = path.join(baseVersionDir, `index.tsx`);
        
        try {
          await fs.access(baseComponentFile);
          sourceFile = baseComponentFile;
        } catch {
          // Fallback to main component if base version doesn't exist
          sourceFile = path.join(pagesDir, `index.tsx`);
        }
      } else {
        // Starting from scratch - create generic empty state template
        await createEmptyStateTemplate(componentFile, pageName, versionId);
        console.log(`Created empty state ${pageName} component for version ${versionId}`);
        continue; // Skip the copy and update logic
      }
      
      try {
        // Check if source file exists
        await fs.access(sourceFile);
        
        // Copy the file
        await fs.copyFile(sourceFile, componentFile);
        
        // Update import paths in the copied file
        await updateImportPaths(componentFile, pageName);
        
        console.log(`Created ${pageName} component for version ${versionId}`);
      } catch (error) {
        console.warn(`Could not copy ${pageName} component:`, error);
      }
    }
  } catch (error) {
    console.error('Error creating version component files:', error);
    throw error;
  }
}

// Helper function to update import paths in versioned components
async function updateImportPaths(filePath: string, pageName: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Fix import paths by standardizing all relative imports to use exactly 3 levels up
    // Version files are at: src/public/pages/{pageName}/v{version}/index.tsx
    // They need to reach: src/public/* (3 levels up)
    let updatedContent = content;
    
    // Replace any pattern with exactly 4 "../" with 3 "../" - this handles the specific case we saw
    updatedContent = updatedContent.replace(/from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/([^"']+)["']/g, 'from "../../../$1"');
    
    // Also handle import statements (not just from statements)
    updatedContent = updatedContent.replace(/import\s+([^"']+)\s+from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/([^"']+)["']/g, 'import $1 from "../../../$2"');
    
    // Handle any other patterns with 4+ levels
    updatedContent = updatedContent.replace(/\.\.\/(\.\.\/){4,}/g, '../../../');
    
    // Only write if content actually changed
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated import paths in ${filePath}`);
    }
  } catch (error) {
    console.warn(`Could not update import paths in ${filePath}:`, error);
  }
}

export default router;