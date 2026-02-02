import fs from 'fs/promises';
import path from 'path';
import express, { Router } from 'express';

const router: Router = express.Router();

// Get template metadata
router.get('/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    const metadataPath = path.join(process.cwd(), 'src', 'public', 'templates', templateName, 'metadata.json');
    
    try {
      const data = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(data);
      res.json(metadata);
    } catch (error) {
      // If file doesn't exist, return default metadata
      const defaultMetadata = {
        templateName: templateName,
      };
      res.json(defaultMetadata);
    }
  } catch (error) {
    console.error('Error loading template metadata:', error);
    res.status(500).json({ error: 'Failed to load template metadata' });
  }
});

// Save template metadata
router.post('/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    const metadata = req.body;
    
    const templateDir = path.join(process.cwd(), 'src', 'public', 'templates', templateName);
    const metadataPath = path.join(templateDir, 'metadata.json');
    
    // Ensure the template directory exists
    await fs.mkdir(templateDir, { recursive: true });
    
    // Write the metadata file
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving template metadata:', error);
    res.status(500).json({ error: 'Failed to save template metadata' });
  }
});

export default router;

