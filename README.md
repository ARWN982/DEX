# Vibe Kibana

A design system and prototyping environment for Kibana experiences.

## Project Team

**Andrea Del Rio** ([@andreadelrio](https://github.com/andreadelrio)) - Project Lead  

## Features

### 🎨 Project Templates
Quickly spin up new projects using pre-built templates. Each template comes with a foundation of components and layouts, so you can focus on designing rather than setup.

### 🧩 Reusable Component Library
Access a curated set of shared components—charts, panels, controls, grids, and more—all built with Elastic UI. These components are ready to use and customize, helping you maintain consistency across your prototypes.

### 📚 Version History
Create and manage multiple versions of your project. Experiment with different approaches, compare iterations, and keep a history of your design evolution.

### 📋 Job Stories
Track job stories alongside your prototypes. Keep your design decisions grounded in user needs and maintain alignment with product goals.

### 📄 PRD Tracking
Document and reference product requirements directly within your project. Keep specs, context, and design work together in one place.

### ⚡ Auto-reload Development
Hot reloading for both frontend and backend during development. See your changes instantly without manual refreshes.

### 🎨 Modern UI
Built with Elastic UI (EUI) components for consistent design language and a polished look out of the box.

## Architecture

### Frontend
- **React 18** with TypeScript for type-safe component development
- **@elastic/eui** for UI components and design system
- **@elastic/charts** for data visualization
- **Webpack** with hot module replacement for development

### Backend
- **Express.js** server with TypeScript
- **@elastic/elasticsearch** client for database connectivity
- **CORS** enabled for cross-origin requests
- **Nodemon** for automatic server restarts during development

## Prerequisites

- Node.js 18+ and npm
- Elasticsearch 8.x cluster running locally or remotely

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/elastic/vibe-kibana.git
   cd vibe-kibana
   npm install --legacy-peer-deps
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3001 (with auto-reload)
   - Backend API: http://localhost:3000

## Creating New Projects

This repository supports automatic project discovery! Simply create a new folder under `src/public/pages/` with a version folder and component:

```bash
mkdir -p src/public/pages/my-new-project/v1.0
```

Then create `src/public/pages/my-new-project/v1.0/index.tsx` with your React component. Your project will automatically appear on the homepage at http://localhost:3001/

For detailed instructions, see [Creating New Projects Guide](docs/CREATING_NEW_PROJECTS.md).

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
│   ├── public/                    # React frontend application
│   │   ├── components/            # Reusable React components
│   │   │   ├── index.ts          # Barrel exports for components
│   │   │   ├── MetricChart.tsx   # Individual chart component
│   │   │   ├── MetricsGrid.tsx   # Grid layout for charts
│   │   │   ├── SearchAndFilters.tsx  # Search and date picker
│   │   │   ├── MetricsCount.tsx  # Metrics count display
│   │   │   └── Pagination.tsx    # Pagination controls
│   │   ├── App.tsx               # Main application component (refactored)
│   │   ├── index.tsx             # React entry point
│   │   └── index.html            # HTML template
│   └── server/                   # Express backend server
│       └── index.ts              # Server entry point and API routes
├── dist/                         # Built assets (generated)
├── CLAUDE.md                     # Development workflow and project memory
├── PROMPTS.md                    # Development history and prompt tracking
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── webpack.config.js             # Frontend build configuration
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
