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
// Function to get page and version-specific comments file path
const getCommentsPath = (pageId, versionId) => {
    return path_1.default.join(PAGES_DIR, pageId, `v${versionId}`, 'comments.json');
};
// GET /api/comments?page=discover&version=1.0 - Read comments for a specific page and version
router.get('/', async (req, res) => {
    try {
        const pageId = req.query.page || 'discover';
        const versionId = req.query.version || '1.0';
        const commentsPath = getCommentsPath(pageId, versionId);
        console.log('Reading comments for page', pageId, 'version', versionId, 'from:', commentsPath);
        try {
            const data = await fs_1.promises.readFile(commentsPath, 'utf8');
            const commentsData = JSON.parse(data);
            console.log('Loaded', commentsData.comments.length, 'comment threads for', pageId, 'v' + versionId);
            res.json(commentsData.comments);
        }
        catch (fileError) {
            // If page-version-specific file doesn't exist, create it with empty comments
            console.log('Creating empty comments file for', pageId, 'v' + versionId);
            const emptyData = {
                comments: [],
                metadata: {
                    versionId,
                    pageId,
                    lastUpdated: new Date().toISOString()
                }
            };
            await fs_1.promises.writeFile(commentsPath, JSON.stringify(emptyData, null, 2));
            res.json(emptyData.comments);
        }
    }
    catch (error) {
        console.error('Error reading comments:', error);
        res.status(500).json({ error: 'Failed to read comments' });
    }
});
// POST /api/comments?version=1.0 - Update comments for a specific version
router.post('/', async (req, res) => {
    try {
        const pageId = req.query.page || 'discover';
        const versionId = req.query.version || '1.0';
        const comments = req.body;
        const commentsPath = getCommentsPath(pageId, versionId);
        console.log('Saving', comments.length, 'comment threads for', pageId, 'v' + versionId, 'to:', commentsPath);
        // Validate the input
        if (!Array.isArray(comments)) {
            return res.status(400).json({ error: 'Comments must be an array' });
        }
        // Ensure all comments have the correct versionId and pageId
        const commentsWithVersionAndPage = comments.map(thread => ({
            ...thread,
            versionId,
            pageId,
            updatedAt: new Date().toISOString()
        }));
        // Create updated data
        const updatedData = {
            comments: commentsWithVersionAndPage,
            metadata: {
                versionId,
                pageId,
                lastUpdated: new Date().toISOString()
            }
        };
        // Write to version-specific file
        await fs_1.promises.writeFile(commentsPath, JSON.stringify(updatedData, null, 2), 'utf8');
        res.json({ success: true, comments: updatedData.comments });
    }
    catch (error) {
        console.error('Error saving comments:', error);
        res.status(500).json({ error: 'Failed to save comments' });
    }
});
exports.default = router;
//# sourceMappingURL=comments.js.map