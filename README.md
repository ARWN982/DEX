# Vibe Kibana

A design system and prototyping environment for Kibana experiences.

## Project Team

**Andrea Del Rio** ([@andreadelrio](https://github.com/andreadelrio)) - Project Lead & Product Vision  
Provided the initial requirements, technical direction, and iterative feedback throughout development. Guided the implementation of the Elasticsearch integration, UI/UX design decisions, and development workflow optimization.

## Overview

This project provides a modern web interface for exploring and visualizing data from Elasticsearch. It features a responsive grid layout of charts with search functionality, time range selection, and pagination for easy navigation through large datasets.

## Features

- **📊 Interactive Chart Grid**: 3x5 responsive grid displaying metric visualizations (15 charts per page)
- **🔍 Real-time Search**: Filter metrics by name with instant results
- **📅 Time Range Selection**: Configurable date/time pickers for data exploration
- **📄 Pagination**: Navigate through metrics with 15 charts per page
- **⚡ Auto-reload Development**: Hot reloading for both frontend and backend during development
- **🎨 Modern UI**: Built with Elastic UI (EUI) components for consistent design
- **📈 ESQL Integration**: Direct querying of Elasticsearch using ES|QL for efficient data retrieval
- **🔬 Metric Insights**: Enhanced popover with OpenTelemetry semantic conventions, stability indicators, and technical details
- **📏 Smart Unit Formatting**: Automatic formatting for bytes, percentages, and other units based on OpenTelemetry conventions

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
- Metrics data indexed in `metrics-*` pattern

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd vibe-kibana
   npm install --legacy-peer-deps
   ```

2. **Configure Elasticsearch connection (optional):**
   ```bash
   export ELASTICSEARCH_URL="http://localhost:9200"
   export ELASTICSEARCH_USERNAME="elastic"
   export ELASTICSEARCH_PASSWORD="changeme"
   ```

   *Default values are used if environment variables are not set.*

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
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

## API Endpoints

### `GET /api/metrics/fields`
Retrieves available metric fields from Elasticsearch using field capabilities API, enhanced with OpenTelemetry semantic conventions data when available.

**Response:**
```json
{
  "fields": [
    {
      "name": "system.cpu.utilization",
      "index": "metrics-system-default",
      "dimensions": [
        {"name": "cpu", "type": "keyword"},
        {"name": "host.name", "type": "keyword"}
      ],
      "type": "double",
      "time_series_metric": "gauge",
      "unit": "1",
      "brief": "Difference in system CPU time since the last measurement, divided by the elapsed time",
      "stability": "experimental"
    },
    {
      "name": "system.memory.usage",
      "index": "metrics-system-default",
      "dimensions": [
        {"name": "state", "type": "keyword"},
        {"name": "host.name", "type": "keyword"}
      ],
      "type": "long",
      "time_series_metric": "gauge",
      "unit": "By",
      "brief": "Reports memory in use by state",
      "stability": "stable"
    }
  ]
}
```

**Field Description:**
- `name`: Metric field name
- `index`: Data stream containing the metric
- `dimensions`: Array of time series dimension fields
- `type`: Elasticsearch field type
- `time_series_metric`: Type of time series metric (gauge, counter, etc.)
- `unit`: Measurement unit (enhanced with OpenTelemetry conventions)
- `brief`: Description from OpenTelemetry semantic conventions (when available)
- `stability`: Stability level from OpenTelemetry semantic conventions (when available)

**OpenTelemetry Unit Mappings:**
- `"By"` → Bytes (formatted as KB, MB, GB)
- `"1"` → Unitless ratio (formatted as percentage)
- `"s"` → Seconds
- Custom units displayed as-is

### `POST /api/metrics/data`
Fetches time-series data for a specific metric using ES|QL queries.

**Request:**
```json
{
  "metric": "cpu.usage",
  "from": "2023-12-07T10:00:00.000Z",
  "to": "2023-12-07T11:00:00.000Z"
}
```

**Response:**
```json
{
  "metric": "cpu.usage",
  "data": [
    {"x": 1701943200000, "y": 45.2},
    {"x": 1701943260000, "y": 48.1}
  ],
  "esql": "FROM metrics-* | WHERE @timestamp >= \"2023-12-07T10:00:00.000Z\" AND @timestamp <= \"2023-12-07T11:00:00.000Z\" | STATS AVG(cpu.usage) BY BUCKET(@timestamp, 200, \"2023-12-07T10:00:00.000Z\", \"2023-12-07T11:00:00.000Z\")"
}
```

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
