> [!IMPORTANT]
> **When should I use Vibe Kibana [(elastic/vibe-kibana)](https://github.com/elastic/vibe-kibana) vs Kibana [(elastic/kibana)](https://github.com/elastic/kibana)?**
> 
> - **Quick exploration of multiple directions** - If you haven't defined a direction yet and want to rapidly iterate through different approaches, start here.
> 
>   Once you've settled on a direction in elastic/vibe-kibana, **move to elastic/kibana to build your solution directly in the Kibana codebase.**
> 
> - **Brand new complex features** - If you're designing something that doesn't exist at all in Kibana today, Vibe Kibana lets you build and share it without navigating the full Kibana codebase.
> - **Small, scoped changes** - If you're tweaking an existing page or component, you're encouraged to work directly in the [(elastic/kibana)](https://github.com/elastic/kibana) repo. It's the fastest path to production.


# Vibe Kibana

A prototyping tool to build coded prototypes of Kibana.

## Project Team

**Andrea Del Rio** ([@andreadelrio](https://github.com/andreadelrio)) - Project Lead  

## Features

#### 🎨 Project Templates
Quickly spin up new projects using pre-built templates. Each template comes with a foundation of components and layouts, so you can focus on designing rather than setup.

#### 🧩 Reusable Component Library
Access a curated set of shared components—charts, panels, controls, grids, and more—all built with Elastic UI. These components are ready to use and customize, helping you maintain consistency across your prototypes.

#### 📚 Version History
Create and manage multiple versions of your project. Experiment with different approaches, compare iterations, and keep a history of your design evolution.

#### 📄 PRD Tracking
Document and reference product requirements directly within your project. Keep specs, context, and design work together in one place.

#### ⚡ Auto-reload Development
Hot reloading for both frontend and backend during development. See your changes instantly without manual refreshes.

#### 🎨 Modern UI
Built with Elastic UI (EUI) components for consistent design language and a polished look out of the box.

## Architecture

#### Frontend
- **React 18** with TypeScript for type-safe component development
- **@elastic/eui** for UI components and design system
- **@elastic/charts** for data visualization
- **Webpack** with hot module replacement for development

#### Backend
- **Express.js** server with TypeScript
- **@elastic/elasticsearch** client for database connectivity
- **CORS** enabled for cross-origin requests
- **Nodemon** for automatic server restarts during development

### Prerequisites

- Node.js 18+ and npm
- Elasticsearch 8.x cluster running locally or remotely

### Quick Start

1. **Fork and set up the repository:**
<img width="458" height="77" alt="image" src="https://github.com/user-attachments/assets/615bb506-8d20-4db0-b403-fd1f449f5acc" />

   ```bash
   # Fork the repository on GitHub by clicking the "Fork" button at the top right
   # Then clone your fork:
   git clone https://github.com/YOUR_USERNAME/vibe-kibana.git
   cd vibe-kibana
   
   # Install dependencies:
   npm install --legacy-peer-deps
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3001 (with auto-reload)
   - Backend API: http://localhost:3000
  
  
4. **Optionally, add the upstream repository to sync changes:**
   Note: You'll need to do this if you want to have access to latest updates (new features, latest version of EUI, new shared components, etc).
   ```bash
   git remote add upstream https://github.com/elastic/vibe-kibana.git
   ```

## Creating New Projects

This repository supports automatic project discovery! Simply create a new folder under `src/public/pages/` with a version folder and component:

```bash
mkdir -p src/public/pages/my-new-project/v1.0
```

Then create `src/public/pages/my-new-project/v1.0/index.tsx` with your React component. Your project will automatically appear on the homepage at http://localhost:3001/

Alternatively you can create a project using the UI. Just go to the homepage (http://localhost:3001) and press "Create a project".

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend with auto-reload |
| `npm run build` | Build production assets |
| `npm run start` | Start production server |
| `npm run build:server` | Build server TypeScript only |
| `npm run build:client` | Build client webpack bundle only |
| `npm test` | Run test suite |

## Project Structure

```
vibe-kibana/
├── src/
│   ├── context/                      # Design context files
│   │   └── design-principles.md
│   ├── data/
│   │   └── versions.json
│   ├── public/                       # React frontend application
│   │   ├── components/
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   │   ├── DashboardGrid.tsx
│   │   │   │   ├── DashboardLevaPanel.tsx
│   │   │   │   ├── DashboardPanel.tsx
│   │   │   │   ├── PanelSettingsFlyout.tsx
│   │   │   │   └── plugins/          # Dashboard panel plugins
│   │   │   │       ├── ControlPanel.tsx
│   │   │   │       ├── LinksPanel.tsx
│   │   │   │       ├── MarkdownPanel.tsx
│   │   │   │       ├── MetricPanel.tsx
│   │   │   │       ├── SectionHeader.tsx
│   │   │   │       ├── StackedBarChartPanel.tsx
│   │   │   │       ├── TablePanel.tsx
│   │   │   │       ├── TextPanel.tsx
│   │   │   │       └── TimeSeriesPanel.tsx
│   │   │   ├── designer-tools/       # Designer workflow tools
│   │   │   │   ├── CommentingSystem.tsx
│   │   │   │   ├── CreateProjectModal.tsx
│   │   │   │   ├── CreateVersionModal.tsx
│   │   │   │   ├── DesignerToolbar.tsx
│   │   │   │   ├── ProjectInfoFlyout.tsx
│   │   │   │   └── VersionSwitcher.tsx
│   │   │   └── shared/               # Shared UI components
│   │   │       ├── AppContainer.tsx
│   │   │       ├── AssistantFlyout.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── KibanaHeader.tsx
│   │   │       ├── NavBar.tsx
│   │   │       ├── TabBar.tsx
│   │   │       └── VisorHex.tsx
│   │   ├── data/                     # Data generators and sample data
│   │   │   ├── apiDataGenerator.ts
│   │   │   ├── logsDataGenerator.ts
│   │   │   └── panelLibrary.json
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useChartTheme.ts
│   │   │   ├── useESQLQuery.ts
│   │   │   ├── useLogsData.ts
│   │   │   └── useProjectMetadata.ts
│   │   ├── pages/                    # Project pages (auto-discovered)
│   │   │   ├── Homepage.tsx
│   │   │   └── [project-name]/       # Each project folder
│   │   │       ├── about.json        # Project metadata
│   │   │       └── v1.0/             # Version folders
│   │   │           ├── index.tsx     # Page component
│   │   │           └── comments.json # Comments data
│   │   ├── store/                    # Zustand state stores
│   │   │   ├── useAppStore.ts
│   │   │   ├── useCommentStore.ts
│   │   │   └── useDashboardPanelSettings.ts
│   │   ├── templates/                # Page templates
│   │   │   ├── dashboards/
│   │   │   └── discover/
│   │   ├── App.tsx                   # Main application component
│   │   ├── index.tsx                 # React entry point
│   │   └── index.html                # HTML template
│   └── server/                       # Express backend server
│       ├── index.ts                  # Server entry point
│       ├── lib/
│       │   └── elasticsearch.ts      # ES client
│       └── routes/                   # API routes
│           ├── comments.ts
│           ├── projects.ts
│           └── versions.ts
├── dist/                             # Built assets (generated)
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
└── webpack.config.js                 # Frontend build configuration
```

## Supported Metric Types

- ✅ **Numeric types**: `long`, `integer`, `short`, `byte`, `double`, `float`, `half_float`, `scaled_float`
- ⚠️ **Unsupported**: `unsigned_long`, `histogram` (displays placeholder message)

## Development Workflow

This project follows a structured development approach with comprehensive documentation:

1. Make code changes
2. Update `PROMPTS.md` with development history
3. Build and test changes
4. Commit with detailed messages
5. Push to repository

See `CLAUDE.md` for detailed workflow guidelines and `PROMPTS.md` for complete development history.

## Contributing

1. Follow existing TypeScript and React patterns
2. Maintain EUI design system consistency
3. Update documentation for new features
4. Include comprehensive commit messages
5. Test against live Elasticsearch cluster

## License

ISC
