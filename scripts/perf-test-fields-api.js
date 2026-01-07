#!/usr/bin/env node

const http = require('http');
const url = require('url');

/**
 * Performance test script for the Fields API
 * Usage: node scripts/perf-test-fields-api.js [options]
 * 
 * Options:
 *   --runs <number>     Number of test runs (default: 20)
 *   --index <pattern>   Index pattern to test (default: metrics-*)
 *   --host <host>       Server host (default: localhost)
 *   --port <port>       Server port (default: 3000)
 *   --warmup <number>   Number of warmup runs (default: 3)
 */

class PerformanceTester {
  constructor(options = {}) {
    this.runs = options.runs || 20;
    this.indexPattern = options.index || 'metrics-*';
    this.host = options.host || 'localhost';
    this.port = options.port || 3000;
    this.warmupRuns = options.warmup || 3;
    this.outputMode = options.output || 'console'; // 'console' or 'json'
    this.results = [];
  }

  async makeRequest() {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      
      const requestUrl = `http://${this.host}:${this.port}/api/metrics/fields?index=${encodeURIComponent(this.indexPattern)}`;
      
      const req = http.get(requestUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
          
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve({ 
                duration: durationMs, 
                statusCode: res.statusCode,
                fieldsCount: parsed.fields ? parsed.fields.length : 0
              });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout (30s)'));
      });
    });
  }

  calculateStats(durations) {
    const sorted = [...durations].sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.min(...durations),
      max: Math.max(...durations),
      average: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: durations.length
    };
  }

  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  }

  async runTest() {
    // Only display console output in console mode
    if (this.outputMode === 'console') {
      console.log('🚀 Fields API Performance Test');
      console.log('================================');
      console.log(`Target: ${this.host}:${this.port}`);
      console.log(`Index Pattern: ${this.indexPattern}`);
      console.log(`Warmup Runs: ${this.warmupRuns}`);
      console.log(`Test Runs: ${this.runs}`);
      console.log('');
    }

    // Warmup runs
    if (this.warmupRuns > 0) {
      if (this.outputMode === 'console') {
        console.log('🔥 Warmup phase...');
      }
      for (let i = 0; i < this.warmupRuns; i++) {
        try {
          const result = await this.makeRequest();
          if (this.outputMode === 'console') {
            process.stdout.write(`  Warmup ${i + 1}/${this.warmupRuns}: ${this.formatDuration(result.duration)}\r`);
          }
        } catch (error) {
          if (this.outputMode === 'console') {
            console.error(`\n❌ Warmup run ${i + 1} failed: ${error.message}`);
          }
          throw error; // Re-throw for JSON mode to handle
        }
      }
      if (this.outputMode === 'console') {
        console.log(`\n✅ Warmup complete\n`);
      }
    }

    // Test runs
    if (this.outputMode === 'console') {
      console.log('📊 Running performance tests...');
    }
    const durations = [];
    let fieldsCount = 0;

    for (let i = 0; i < this.runs; i++) {
      try {
        const result = await this.makeRequest();
        durations.push(result.duration);
        fieldsCount = result.fieldsCount;
        
        if (this.outputMode === 'console') {
          process.stdout.write(`  Run ${i + 1}/${this.runs}: ${this.formatDuration(result.duration)} (${result.fieldsCount} fields)\r`);
        }
      } catch (error) {
        if (this.outputMode === 'console') {
          console.error(`\n❌ Run ${i + 1} failed: ${error.message}`);
        }
        throw error; // Re-throw for JSON mode to handle
      }
    }

    if (this.outputMode === 'console') {
      console.log('\n');
    }

    // Calculate and display results
    const stats = this.calculateStats(durations);
    
    if (this.outputMode === 'console') {
      console.log('📈 Performance Results');
      console.log('======================');
      console.log(`Fields Returned: ${fieldsCount}`);
      console.log(`Test Runs: ${stats.count}`);
      console.log('');
      console.log('Duration Statistics:');
      console.log(`  Min:     ${this.formatDuration(stats.min)}`);
      console.log(`  Max:     ${this.formatDuration(stats.max)}`);
      console.log(`  Average: ${this.formatDuration(stats.average)}`);
      console.log(`  Median:  ${this.formatDuration(stats.median)}`);
      console.log(`  P95:     ${this.formatDuration(stats.p95)}`);
      console.log(`  P99:     ${this.formatDuration(stats.p99)}`);
      console.log('');
    }

    // Performance grade
    const avgMs = stats.average;
    let grade = '🔴 Poor';
    if (avgMs < 100) grade = '🟢 Excellent';
    else if (avgMs < 250) grade = '🟡 Good';
    else if (avgMs < 500) grade = '🟠 Fair';
    
    if (this.outputMode === 'console') {
      console.log(`Performance Grade: ${grade} (${this.formatDuration(avgMs)} avg)`);
    }
    
    // Export raw data option - enhanced for histogram compatibility
    const rawData = {
      timestamp: new Date().toISOString(),
      config: {
        runs: this.runs,
        indexPattern: this.indexPattern,
        host: this.host,
        port: this.port,
        warmupRuns: this.warmupRuns
      },
      results: {
        fieldsCount,
        durations,
        stats,
        grade: grade.replace(/🟢|🟡|🟠|🔴/, '').trim().toLowerCase()
      },
      // Add histogram-compatible format (values must be sorted, duplicates aggregated)
      histogram: (() => {
        const valueCountMap = new Map();
        durations.forEach(duration => {
          const count = valueCountMap.get(duration) || 0;
          valueCountMap.set(duration, count + 1);
        });
        const sortedValues = Array.from(valueCountMap.keys()).sort((a, b) => a - b);
        const counts = sortedValues.map(value => valueCountMap.get(value));
        return { values: sortedValues, counts: counts };
      })()
    };

    // Output based on mode
    if (this.outputMode === 'json') {
      console.log(JSON.stringify(rawData, null, 2));
    }

    return rawData;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--runs':
        options.runs = parseInt(value);
        break;
      case '--index':
        options.index = value;
        break;
      case '--host':
        options.host = value;
        break;
      case '--port':
        options.port = parseInt(value);
        break;
      case '--warmup':
        options.warmup = parseInt(value);
        break;
      case '--output':
        if (value === 'json' || value === 'console') {
          options.output = value;
        } else {
          console.error(`Invalid output mode: ${value}. Must be 'json' or 'console'`);
          process.exit(1);
        }
        break;
      case '--help':
        console.log('Fields API Performance Test');
        console.log('Usage: node scripts/perf-test-fields-api.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --runs <number>     Number of test runs (default: 20)');
        console.log('  --index <pattern>   Index pattern to test (default: metrics-*)');
        console.log('  --host <host>       Server host (default: localhost)');
        console.log('  --port <port>       Server port (default: 3000)');
        console.log('  --warmup <number>   Number of warmup runs (default: 3)');
        console.log('  --output <mode>     Output mode: console or json (default: console)');
        console.log('  --help              Show this help message');
        process.exit(0);
        break;
      default:
        if (key.startsWith('--')) {
          console.error(`Unknown option: ${key}`);
          process.exit(1);
        }
    }
  }
  
  return options;
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const tester = new PerformanceTester(options);
    await tester.runTest();
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTester;