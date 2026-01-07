"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Get project metadata
router.get('/:projectName', async (req, res) => {
    try {
        const { projectName } = req.params;
        const metadataPath = path_1.default.join(process.cwd(), 'src', 'public', 'pages', projectName, 'about.json');
        try {
            const data = await promises_1.default.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(data);
            res.json(metadata);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Error loading project metadata:', error);
        res.status(500).json({ error: 'Failed to load project metadata' });
    }
});
// Save project metadata
router.post('/:projectName', async (req, res) => {
    try {
        const { projectName } = req.params;
        const metadata = req.body;
        const projectDir = path_1.default.join(process.cwd(), 'src', 'public', 'pages', projectName);
        const metadataPath = path_1.default.join(projectDir, 'about.json');
        // Ensure the project directory exists
        try {
            await promises_1.default.access(projectDir);
        }
        catch {
            return res.status(404).json({ error: 'Project directory not found' });
        }
        // Write the metadata file
        await promises_1.default.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving project metadata:', error);
        res.status(500).json({ error: 'Failed to save project metadata' });
    }
});
exports.default = router;
//# sourceMappingURL=projectMetadata.js.map