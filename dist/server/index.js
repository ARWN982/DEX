"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("tsconfig-paths/register");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
// Load environment variables
dotenv_1.default.config({ path: ".env.local" });
// Import route modules
const comments_1 = __importDefault(require("./routes/comments"));
const documents_1 = __importDefault(require("./routes/documents"));
const esqlQuery_1 = __importDefault(require("./routes/esqlQuery"));
const fields_1 = __importDefault(require("./routes/fields"));
const health_1 = __importDefault(require("./routes/health"));
const jobStories_1 = __importDefault(require("./routes/jobStories"));
const projectMetadata_1 = __importDefault(require("./routes/projectMetadata"));
const projects_1 = __importDefault(require("./routes/projects"));
const screenshots_1 = __importDefault(require("./routes/screenshots"));
const versions_1 = __importDefault(require("./routes/versions"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// Register routes
app.use("/api", health_1.default);
app.use("/api", documents_1.default);
app.use("/api", fields_1.default);
app.use("/api", esqlQuery_1.default);
app.use("/api/job-stories", jobStories_1.default);
app.use("/api/project-metadata", projectMetadata_1.default);
app.use("/api/projects", projects_1.default);
app.use("/api", screenshots_1.default);
app.use("/api/versions", versions_1.default);
app.use("/api/comments", comments_1.default);
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map