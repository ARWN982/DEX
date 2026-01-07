import { promises as fs } from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';

const router = Router();

// Base path to the public pages directory  
const PAGES_DIR = path.join(__dirname, '../../../src/public/pages');

// Function to get page and version-specific job stories file path
const getJobStoriesPath = (pageId: string, versionId: string) => {
  return path.join(PAGES_DIR, pageId, `v${versionId}`, 'jobStories.json');
};

// Interface matching the component
export interface JobStory {
  id: string;
  jobStory: string;
  acceptanceCriteria: string;
  implementation: "Pending" | "Done";
  createdAt?: string;
}

interface JobStoriesData {
  stories: JobStory[];
  metadata: {
    versionId: string;
    lastUpdated: string;
  };
}

// GET /api/job-stories?version=1.0 - Read job stories for a specific version
router.get('/', async (req: Request, res: Response) => {
  try {
    const versionId = req.query.version as string || '1.0';
    const pageId = req.query.page as string || '';
    const jobStoriesPath = getJobStoriesPath(pageId, versionId);
    
    console.log('Reading job stories for page', pageId, 'version', versionId, 'from:', jobStoriesPath);
    
    try {
      const data = await fs.readFile(jobStoriesPath, 'utf8');
      const jobStoriesData: JobStoriesData = JSON.parse(data);
      console.log('Loaded', jobStoriesData.stories.length, 'job stories for version', versionId);
      res.json(jobStoriesData.stories);
    } catch (fileError) {
      // If version-specific file doesn't exist, create it with empty stories
      console.log('Creating empty job stories file for version', versionId);
      const emptyData: JobStoriesData = {
        stories: [],
        metadata: {
          versionId,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(jobStoriesPath, JSON.stringify(emptyData, null, 2));
      res.json(emptyData.stories);
    }
  } catch (error) {
    console.error('Error reading job stories:', error);
    res.status(500).json({ error: 'Failed to read job stories' });
  }
});

// POST /api/job-stories?version=1.0&page=simple-esql - Update job stories for a specific version
router.post('/', async (req: Request, res: Response) => {
  try {
    const versionId = req.query.version as string || '1.0';
    const pageId = req.query.page as string || '';
    const stories: JobStory[] = req.body;
    const jobStoriesPath = getJobStoriesPath(pageId, versionId);
    
    console.log('Saving', stories.length, 'job stories for page', pageId, 'version', versionId, 'to:', jobStoriesPath);
    
    // Validate the input
    if (!Array.isArray(stories)) {
      return res.status(400).json({ error: 'Stories must be an array' });
    }

    // Create updated data
    const updatedData: JobStoriesData = {
      stories: stories.map(story => ({
        ...story,
        createdAt: story.createdAt || new Date().toISOString()
      })),
      metadata: {
        versionId,
        lastUpdated: new Date().toISOString()
      }
    };

    // Write to version-specific file
    await fs.writeFile(
      jobStoriesPath, 
      JSON.stringify(updatedData, null, 2),
      'utf8'
    );

    res.json({ success: true, stories: updatedData.stories });
  } catch (error) {
    console.error('Error saving job stories:', error);
    res.status(500).json({ error: 'Failed to save job stories' });
  }
});

export default router;