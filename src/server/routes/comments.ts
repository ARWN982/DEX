import { promises as fs } from 'fs';
import path from 'path';
import { Router, type Router as RouterType, Request, Response } from 'express';

const router: RouterType = Router();

// Base path to the public pages directory
const PAGES_DIR = path.join(__dirname, '../../../src/public/pages');

// Function to get page and version-specific comments file path
const getCommentsPath = (pageId: string, versionId: string) => {
  return path.join(PAGES_DIR, pageId, `v${versionId}`, 'comments.json');
};

interface CommentAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color?: string;
}

interface Comment {
  id: string;
  threadId: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
}

interface CommentPosition {
  x: number;
  y: number;
  elementId?: string;
  scrollX?: number;
  scrollY?: number;
}

interface CommentThread {
  id: string;
  position: CommentPosition;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  versionId?: string;
  comments: Comment[];
}

interface CommentsData {
  comments: CommentThread[];
  metadata: {
    versionId: string;
    pageId: string;
    lastUpdated: string;
  };
}

// GET /api/comments?page=<project>&version=1.0 - Read comments for a specific page and version
router.get('/', async (req: Request, res: Response) => {
  try {
    const pageId = req.query.page as string || '';
    const versionId = req.query.version as string || '1.0';
    const commentsPath = getCommentsPath(pageId, versionId);
    
    console.log('Reading comments for page', pageId, 'version', versionId, 'from:', commentsPath);
    
    try {
      const data = await fs.readFile(commentsPath, 'utf8');
      const commentsData: CommentsData = JSON.parse(data);
      console.log('Loaded', commentsData.comments.length, 'comment threads for', pageId, 'v' + versionId);
      res.json(commentsData.comments);
    } catch (fileError) {
      // If page-version-specific file doesn't exist, create it with empty comments
      console.log('Creating empty comments file for', pageId, 'v' + versionId);
      const emptyData: CommentsData = {
        comments: [],
        metadata: {
          versionId,
          pageId,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(commentsPath, JSON.stringify(emptyData, null, 2));
      res.json(emptyData.comments);
    }
  } catch (error) {
    console.error('Error reading comments:', error);
    res.status(500).json({ error: 'Failed to read comments' });
  }
});

// POST /api/comments?version=1.0 - Update comments for a specific version
router.post('/', async (req: Request, res: Response) => {
  try {
    const pageId = req.query.page as string || '';
    const versionId = req.query.version as string || '1.0';
    const comments: CommentThread[] = req.body;
    const commentsPath = getCommentsPath(pageId, versionId);
    
    console.log('Saving', comments.length, 'comment threads for', pageId, 'v' + versionId, 'to:', commentsPath);
    
    // Validate the input
    if (!Array.isArray(comments)) {
      return res.status(400).json({ error: 'Comments must be an array' });
    }

    // Deduplicate comments within each thread and set correct metadata
    const commentsWithVersionAndPage = comments.map(thread => {
      const seen = new Set<string>();
      const dedupedComments = (thread.comments || []).filter((c: Comment) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      return {
        ...thread,
        comments: dedupedComments,
        versionId,
        pageId,
        updatedAt: new Date().toISOString(),
      };
    });

    // Create updated data
    const updatedData: CommentsData = {
      comments: commentsWithVersionAndPage,
      metadata: {
        versionId,
        pageId,
        lastUpdated: new Date().toISOString()
      }
    };

    // Write to version-specific file
    await fs.writeFile(
      commentsPath, 
      JSON.stringify(updatedData, null, 2),
      'utf8'
    );

    res.json({ success: true, comments: updatedData.comments });
  } catch (error) {
    console.error('Error saving comments:', error);
    res.status(500).json({ error: 'Failed to save comments' });
  }
});

export default router;