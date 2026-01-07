import "tsconfig-paths/register";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Load environment variables
dotenv.config({ path: ".env.local" });
// Import route modules
import commentsRoutes from "./routes/comments";
import documentsRoutes from "./routes/documents";
import esqlQueryRoutes from "./routes/esqlQuery";
import fieldsRoutes from "./routes/fields";
import healthRoutes from "./routes/health";
import jobStoriesRoutes from "./routes/jobStories";
import projectMetadataRoutes from "./routes/projectMetadata";
import projectsRoutes from "./routes/projects";
import screenshotsRoutes from "./routes/screenshots";
import templateMetadataRoutes from "./routes/templateMetadata";
import versionsRoutes from "./routes/versions";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Register routes
app.use("/api", healthRoutes);
app.use("/api", documentsRoutes);
app.use("/api", fieldsRoutes);
app.use("/api", esqlQueryRoutes);
app.use("/api/job-stories", jobStoriesRoutes);
app.use("/api/project-metadata", projectMetadataRoutes);
app.use("/api/template-metadata", templateMetadataRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api", screenshotsRoutes);
app.use("/api/versions", versionsRoutes);
app.use("/api/comments", commentsRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
