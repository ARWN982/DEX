import fs from 'fs/promises';
import path from 'path';
import express from 'express';

const router = express.Router();

// Get project metadata
router.get('/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const metadataPath = path.join(process.cwd(), 'src', 'public', 'pages', projectName, 'about.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      res.json(metadata);
    } catch (error) {
      // If file doesn't exist, return default metadata
      const defaultMetadata = {
        projectName: projectName,
        designer: '',
        pm: '',
        briefDescription: '',
        prdLink: '',
        githubIssueLink: '',
        breadcrumb: '',
      };
      res.json(defaultMetadata);
    }
  } catch (error) {
    console.error('Error loading project metadata:', error);
    res.status(500).json({ error: 'Failed to load project metadata' });
  }
});

// Save project metadata
router.post('/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const metadata = req.body;
    
    const projectDir = path.join(process.cwd(), 'src', 'public', 'pages', projectName);
    const metadataPath = path.join(projectDir, 'about.json');
    
    // Ensure the project directory exists
    try {
      await fs.access(projectDir);
    } catch {
      return res.status(404).json({ error: 'Project directory not found' });
    }
    
    // Write the metadata file
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving project metadata:', error);
    res.status(500).json({ error: 'Failed to save project metadata' });
  }
});

export default router;