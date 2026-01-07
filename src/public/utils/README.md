# Data Source Generator Utility

A reusable utility for generating realistic Elasticsearch data sources for prototyping and design work.

## Overview

The `dataSourceGenerator` utility provides a comprehensive list of 90+ anonymized data sources categorized by type (Integration, Stream, Index) based on real-world Elasticsearch deployment patterns.

## Usage

### Basic Import

```typescript
import {
  getDataSources,
  filterDataSources,
  createLabelToIndexMapping,
  type DataSourceType,
  dataSourceTypes,
} from "../utils/dataSourceGenerator";
```

### Get All Data Sources

```typescript
const allDataSources = getDataSources();
// Returns: Array of { label: string, type: DataSourceType }
```

### Filter Data Sources

```typescript
// Filter by type
const integrations = getDataSourcesByType(["Integration"]);

// Filter by search term
const nginxSources = getDataSourcesBySearch("nginx");

// Filter by both type and search
const streamSources = filterDataSources(["Stream"], "elastic");
```

### Create Mappings

```typescript
// Create label to index mapping (labels to lowercase by default)
const labelToIndex = createLabelToIndexMapping();

// Create reverse mapping
const indexToLabel = createIndexToLabelMapping(labelToIndex);

// Custom mappings
const customMappings = createLabelToIndexMapping({
  "logs-*": "logs-custom-mapping"
});
```

### Get Data Source Statistics

```typescript
// Group by category
const grouped = getDataSourcesByCategory();
// Returns: { Integration: [...], Stream: [...], Index: [...] }

// Get counts
const counts = getDataSourceCounts();
// Returns: { Integration: 18, Stream: 11, Index: 62 }
```

## Data Source Types

- **Integration**: External service integrations (ActiveMQ, Docker, Kubernetes, etc.)
- **Stream**: Internal data streams (alerts, event logs, SLO data, etc.)
- **Index**: Index patterns (logs-*, metrics-*, profiling data, etc.)

## Example: Data Source Selector

```typescript
import React, { useState, useMemo } from "react";
import {
  filterDataSources,
  createLabelToIndexMapping,
  type DataSourceType,
  dataSourceTypes,
} from "../utils/dataSourceGenerator";

export function DataSourceSelector() {
  const [selectedIndex, setSelectedIndex] = useState("logs-*");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilters, setTypeFilters] = useState<DataSourceType[]>([]);

  // Filter data sources based on search and type filters
  const filteredOptions = useMemo(() => {
    return filterDataSources(typeFilters, searchTerm);
  }, [typeFilters, searchTerm]);

  // Create mappings
  const labelToIndex = useMemo(() => createLabelToIndexMapping(), []);

  return (
    <div>
      {/* Search input */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search data sources"
      />

      {/* Type filters */}
      {dataSourceTypes.map((type) => (
        <label key={type}>
          <input
            type="checkbox"
            checked={typeFilters.includes(type)}
            onChange={(e) => {
              if (e.target.checked) {
                setTypeFilters([...typeFilters, type]);
              } else {
                setTypeFilters(typeFilters.filter(t => t !== type));
              }
            }}
          />
          {type}
        </label>
      ))}

      {/* Data source options */}
      {filteredOptions.map((option) => (
        <div
          key={option.label}
          onClick={() => setSelectedIndex(labelToIndex[option.label])}
          style={{
            backgroundColor: labelToIndex[option.label] === selectedIndex ? "#f0f0f0" : "transparent"
          }}
        >
          {option.label} ({option.type})
        </div>
      ))}
    </div>
  );
}
```

## Benefits

- **Consistent Data**: Same realistic data sources across all pages and components
- **Easy Filtering**: Built-in functions for common filtering patterns
- **Type Safety**: Full TypeScript support with proper types
- **Extensible**: Easy to add custom mappings or modify data sources
- **Realistic**: Based on actual Elasticsearch deployment patterns
- **Categorized**: Proper categorization by Integration, Stream, and Index types