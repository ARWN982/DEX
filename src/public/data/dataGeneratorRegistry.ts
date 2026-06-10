import { LogsDataGenerator } from './logsDataGenerator';
import { DataGenerator, DataGeneratorRegistry } from './types';

// Create registry of data generators
const registry: DataGeneratorRegistry = {
  'logs-*': new LogsDataGenerator(),
};

// Function to get the appropriate data generator for an index pattern
export function getDataGenerator(indexPattern: string): DataGenerator<any> {
  console.log(`🔍 getDataGenerator called for: ${indexPattern}`);
  console.log('🔍 Available registry keys:', Object.keys(registry));
  
  // First try for an exact match
  if (registry[indexPattern]) {
    console.log(`✅ Found exact match for ${indexPattern}, using:`, registry[indexPattern].constructor.name);
    return registry[indexPattern];
  }
  
  // If no exact match, try to find a pattern that matches
  // This allows for future index patterns like 'errors-*' to be handled
  // by matching to the most appropriate existing generator
  const keys = Object.keys(registry);
  
  // Try to match by prefix (e.g., 'logs-', 'metrics-')
  const prefix = indexPattern.split('-')[0];
  const prefixMatch = keys.find(key => key.startsWith(`${prefix}-`));
  if (prefixMatch) {
    return registry[prefixMatch];
  }
  
  // Default to logs generator if no match found
  console.log(`⚠️ No match found for ${indexPattern}, defaulting to LogsDataGenerator`);
  return registry['logs-*'];
}

// Function to register a new data generator
export function registerDataGenerator(indexPattern: string, generator: DataGenerator<any>): void {
  registry[indexPattern] = generator;
}

export default registry;
