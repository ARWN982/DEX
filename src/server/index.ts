import "tsconfig-paths/register";
import path from "path";
import basicAuth from "express-basic-auth";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Load environment variables
dotenv.config({ path: ".env.local" });
// Import route modules
import commentsRoutes from "./routes/comments";
import esqlQueryRoutes from "./routes/esqlQuery";
import healthRoutes from "./routes/health";
import projectMetadataRoutes from "./routes/projectMetadata";
import projectsRoutes from "./routes/projects";
import screenshotsRoutes from "./routes/screenshots";
import templateMetadataRoutes from "./routes/templateMetadata";
import versionsRoutes from "./routes/versions";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (process.env.DEPLOY_PASSWORD) {
  app.use(basicAuth({
    users: { admin: process.env.DEPLOY_PASSWORD },
    challenge: true,
    realm: "Vibe Kibana",
  }));
}

app.use(express.static(path.join(__dirname, "../public")));

// Register routes
app.use("/api", healthRoutes);
app.use("/api", esqlQueryRoutes);
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
