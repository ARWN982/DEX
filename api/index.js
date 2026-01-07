// Vercel serverless function that wraps our Express app
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route modules
const healthRoutes = require('../dist/server/routes/health.js');
const documentsRoutes = require('../dist/server/routes/documents.js');
const fieldsRoutes = require('../dist/server/routes/fields.js');
const esqlQueryRoutes = require('../dist/server/routes/esqlQuery.js');
const commentsRoutes = require('../dist/server/routes/comments.js');
const jobStoriesRoutes = require('../dist/server/routes/jobStories.js');
const projectMetadataRoutes = require('../dist/server/routes/projectMetadata.js');
const screenshotsRoutes = require('../dist/server/routes/screenshots.js');

const app = express();

app.use(cors());
app.use(express.json());

// Register routes (versions handled by dedicated api/versions.js)
app.use("/api", healthRoutes.default || healthRoutes);
app.use("/api", documentsRoutes.default || documentsRoutes);
app.use("/api", fieldsRoutes.default || fieldsRoutes);
app.use("/api", esqlQueryRoutes.default || esqlQueryRoutes);
app.use("/api/comments", commentsRoutes.default || commentsRoutes);
app.use("/api/job-stories", jobStoriesRoutes.default || jobStoriesRoutes);
app.use("/api/project-metadata", projectMetadataRoutes.default || projectMetadataRoutes);
app.use("/api/screenshots", screenshotsRoutes.default || screenshotsRoutes);

// Handle all other routes
app.get("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;