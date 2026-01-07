"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const router = (0, express_1.Router)();
// Base path to the public pages directory  
const PAGES_DIR = path_1.default.join(__dirname, '../../../src/public/pages');
// Function to get page and version-specific job stories file path
const getJobStoriesPath = (pageId, versionId) => {
    return path_1.default.join(PAGES_DIR, pageId, `v${versionId}`, 'jobStories.json');
};
// GET /api/job-stories?version=1.0 - Read job stories for a specific version
router.get('/', async (req, res) => {
    try {
        const versionId = req.query.version || '1.0';
        const pageId = req.query.page || 'simple-esql';
        const jobStoriesPath = getJobStoriesPath(pageId, versionId);
        console.log('Reading job stories for page', pageId, 'version', versionId, 'from:', jobStoriesPath);
        try {
            const data = await fs_1.promises.readFile(jobStoriesPath, 'utf8');
            const jobStoriesData = JSON.parse(data);
            console.log('Loaded', jobStoriesData.stories.length, 'job stories for version', versionId);
            res.json(jobStoriesData.stories);
        }
        catch (fileError) {
            // If version-specific file doesn't exist, create it with empty stories
            console.log('Creating empty job stories file for version', versionId);
            const emptyData = {
                stories: [],
                metadata: {
                    versionId,
                    lastUpdated: new Date().toISOString()
                }
            };
            await fs_1.promises.writeFile(jobStoriesPath, JSON.stringify(emptyData, null, 2));
            res.json(emptyData.stories);
        }
    }
    catch (error) {
        console.error('Error reading job stories:', error);
        res.status(500).json({ error: 'Failed to read job stories' });
    }
});
// POST /api/job-stories?version=1.0&page=simple-esql - Update job stories for a specific version
router.post('/', async (req, res) => {
    try {
        const versionId = req.query.version || '1.0';
        const pageId = req.query.page || 'simple-esql';
        const stories = req.body;
        const jobStoriesPath = getJobStoriesPath(pageId, versionId);
        console.log('Saving', stories.length, 'job stories for page', pageId, 'version', versionId, 'to:', jobStoriesPath);
        // Validate the input
        if (!Array.isArray(stories)) {
            return res.status(400).json({ error: 'Stories must be an array' });
        }
        // Create updated data
        const updatedData = {
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
        await fs_1.promises.writeFile(jobStoriesPath, JSON.stringify(updatedData, null, 2), 'utf8');
        res.json({ success: true, stories: updatedData.stories });
    }
    catch (error) {
        console.error('Error saving job stories:', error);
        res.status(500).json({ error: 'Failed to save job stories' });
    }
});
exports.default = router;
//# sourceMappingURL=jobStories.js.map