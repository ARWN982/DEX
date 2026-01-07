#!/usr/bin/env node

const { spawn } = require('child_process');
const { Client } = require('@elastic/elasticsearch');
const path = require('path');
const os = require('os');

/**
 * Performance Benchmark Suite
 * Orchestrates data generation, performance testing, and result indexing
 * 
 * Usage: node scripts/perf-benchmark-suite.js [options]
 */

class PerformanceBenchmarkSuite {
  constructor(options = {}) {
    this.metricCounts = options.counts || [100, 500, 1000, 2000];
    this.testRuns = options.runs || 10;
    this.forgePath = options.forgePath || '../simian-forge';
    this.indexName = options.index || 'performance-benchmarks';
    this.waitTime = options.waitTime || 30;
    
    const clientConfig = {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    };

    // Add authentication if provided
    if (options.auth) {
      const [username, password] = options.auth.split(':');
      clientConfig.auth = { username, password };
    }

    this.esClient = new Client(clientConfig);
    
    // Generate unique test run ID
    this.testRunId = `benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🆔 Test Run ID: ${this.testRunId}`);
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Elasticsearch connection
    try {
      const info = await this.esClient.info();
      // Handle both old and new Elasticsearch client response formats
      const version = info.body?.version?.number || info.version?.number || 'unknown';
      console.log(`✅ Elasticsearch connected (v${version})`);
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error.message);
      return false;
    }

    // Check if forge exists  
    // Resolve relative to the project directory, not the scripts directory
    const projectDir = path.dirname(__dirname);
    const forgeScript = path.resolve(projectDir, this.forgePath, 'dist/index.js');
    const fs = require('fs');
    
    // First check if the file exists
    if (!fs.existsSync(forgeScript)) {
      console.error('❌ Simian Forge script not found:', forgeScript);
      console.error('   Make sure simian-forge is built and the path is correct');
      return false;
    }
    
    // Then try to run it (some commands might not have --help)
    try {
      await this.runCommand('node', [forgeScript, '--help'], { timeout: 5000 });
      console.log('✅ Simian Forge found and accessible');
    } catch (error) {
      // If --help fails, just check if we can run the script at all
      console.log('ℹ️  --help not available, checking if script is executable...');
      try {
        await this.runCommand('node', [forgeScript], { timeout: 2000 });
        console.log('✅ Simian Forge script is accessible');
      } catch (runError) {
        console.error('❌ Simian Forge script exists but cannot be executed:', forgeScript);
        console.error('   Error:', runError.message);
        return false;
      }
    }

    // Check if performance tester exists
    const perfTesterPath = path.join(__dirname, 'perf-test-fields-api.js');
    if (!fs.existsSync(perfTesterPath)) {
      console.error('❌ Performance tester not found:', perfTesterPath);
      return false;
    }
    console.log('✅ Performance tester found');

    return true;
  }

  async purgeTestDataStreams() {
    console.log('🧹 Purging existing test data streams...');
    
    const dataStreamPattern = 'metrics-uniquemetrics*.otel-default';
    
    try {
      // Get matching data streams
      console.log(`   Querying data streams matching: ${dataStreamPattern}`);
      const response = await this.esClient.indices.getDataStream({
        name: dataStreamPattern,
        expand_wildcards: 'open,closed'
      });

      // Handle both old and new client response formats
      const dataStreams = response.body?.data_streams || response.data_streams || [];
      
      if (dataStreams.length === 0) {
        console.log('   No test data streams found to purge');
        return;
      }

      console.log(`   Found ${dataStreams.length} data streams to delete:`);
      dataStreams.forEach(stream => {
        console.log(`     - ${stream.name}`);
      });

      // Delete each data stream
      const deletePromises = dataStreams.map(async (stream) => {
        try {
          await this.esClient.indices.deleteDataStream({
            name: stream.name
          });
          console.log(`   ✅ Deleted: ${stream.name}`);
          return { name: stream.name, success: true };
        } catch (error) {
          console.error(`   ❌ Failed to delete ${stream.name}:`, error.message);
          return { name: stream.name, success: false, error: error.message };
        }
      });

      const results = await Promise.all(deletePromises);
      
      // Summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed > 0) {
        console.log(`   ⚠️  Purge completed with issues: ${successful} deleted, ${failed} failed`);
      } else {
        console.log(`   ✅ Purge completed successfully: ${successful} data streams deleted`);
      }

      // Wait a moment for deletions to propagate
      await this.sleep(2000);

      // Verify cleanup
      await this.verifyDataStreamCleanup(dataStreamPattern);

    } catch (error) {
      if (error.statusCode === 404 || error.message.includes('index_not_found')) {
        console.log('   No test data streams found to purge');
      } else {
        console.error('   ⚠️  Error during data stream purge:', error.message);
        console.error('   Continuing with benchmark - this may affect results consistency');
      }
    }
  }

  async verifyDataStreamCleanup(pattern) {
    try {
      const response = await this.esClient.indices.getDataStream({
        name: pattern,
        expand_wildcards: 'open,closed'
      });

      const dataStreams = response.body?.data_streams || response.data_streams || [];
      
      if (dataStreams.length === 0) {
        console.log('   ✅ Cleanup verified: no test data streams remain');
      } else {
        console.log(`   ⚠️  Cleanup incomplete: ${dataStreams.length} data streams still exist`);
        dataStreams.forEach(stream => {
          console.log(`     - ${stream.name} (${stream.status})`);
        });
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.log('   ✅ Cleanup verified: no test data streams remain');
      } else {
        console.log('   ⚠️  Could not verify cleanup:', error.message);
      }
    }
  }

  async captureEnvironment() {
    console.log('📊 Capturing environment information...');
    
    const environment = {
      node_version: process.version,
      hostname: os.hostname(),
      platform: process.platform,
      cpu_arch: process.arch,
      git_branch: null,
      git_commit: null
    };

    // Try to capture git information
    try {
      const gitBranch = await this.runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { timeout: 5000 });
      environment.git_branch = gitBranch.trim();
      
      const gitCommit = await this.runCommand('git', ['rev-parse', 'HEAD'], { timeout: 5000 });
      environment.git_commit = gitCommit.substring(0, 12);
      
      console.log(`   Git: ${environment.git_branch}@${environment.git_commit}`);
    } catch (error) {
      console.log('   Git info not available');
    }

    console.log(`   Node: ${environment.node_version}`);
    console.log(`   Platform: ${environment.platform}/${environment.cpu_arch}`);
    console.log(`   Host: ${environment.hostname}`);

    return environment;
  }

  async generateTestData(metricCount) {
    console.log(`📈 Generating test data for ${metricCount} metrics...`);
    
    // Resolve relative to the project directory, not the scripts directory
    const projectDir = path.dirname(__dirname);
    const forgeScript = path.resolve(projectDir, this.forgePath, 'dist/index.js');
    const forgeArgs = [
      forgeScript,
      '--dataset', 'unique-metrics',
      '--count', metricCount.toString(),
      '--interval', '10s',
      '--backfill', 'now-5m',
      '--purge',
      '--no-realtime'
    ];

    const forgeCommand = `node ${forgeArgs.join(' ')}`;
    
    console.log(`   Command: ${forgeCommand}`);

    try {
      const output = await this.runCommand('node', forgeArgs, { timeout: 1200000 }); // 20 minutes
      console.log('✅ Data generation completed');
      
      // Wait for data to be available
      console.log(`⏳ Waiting ${this.waitTime}s for data to be indexed and available...`);
      await this.sleep(this.waitTime * 1000);
      
      // Verify data availability
      await this.verifyDataAvailability(metricCount);
      
      return forgeCommand;
    } catch (error) {
      console.error('❌ Data generation failed:', error.message);
      throw error;
    }
  }

  async verifyDataAvailability(expectedMetricCount) {
    console.log('🔍 Verifying data availability...');
    
    try {
      // Check if we can query the fields API
      const response = await fetch('http://localhost:3000/api/metrics/fields?index=metrics-*');
      if (!response.ok) {
        throw new Error(`Fields API returned ${response.status}`);
      }
      
      const data = await response.json();
      const actualFieldCount = data.fields ? data.fields.length : 0;
      
      console.log(`   Found ${actualFieldCount} fields (expected ~${expectedMetricCount})`);
      
      if (actualFieldCount === 0) {
        throw new Error('No fields found - data may not be available yet');
      }
      
      console.log('✅ Data verification successful');
      return actualFieldCount;
    } catch (error) {
      console.error('❌ Data verification failed:', error.message);
      throw error;
    }
  }

  async runPerformanceTest(metricCount) {
    console.log(`⚡ Running performance test for ${metricCount} metrics...`);
    
    const perfTesterPath = path.join(__dirname, 'perf-test-fields-api.js');
    const perfArgs = [
      '--runs', this.testRuns.toString(),
      '--index', 'metrics-*',
      '--host', 'localhost',
      '--port', '3000',
      '--warmup', '3',
      '--output', 'json'
    ];

    try {
      const output = await this.runCommand('node', [perfTesterPath, ...perfArgs], { timeout: 180000 });
      
      // Parse JSON output directly instead of console output
      const results = this.parseJsonOutput(output);
      console.log(`✅ Performance test completed: ${results.stats.average.toFixed(1)}ms avg`);
      
      return results;
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      throw error;
    }
  }

  parseJsonOutput(output) {
    try {
      // Parse the JSON output from the performance test
      const data = JSON.parse(output.trim());
      
      if (!data.results || !data.results.durations || !Array.isArray(data.results.durations)) {
        throw new Error('Invalid JSON output: missing durations array');
      }
      
      const durations = data.results.durations;
      const fieldsCount = data.results.fieldsCount || 0;
      
      if (durations.length === 0) {
        throw new Error('No timing data found in JSON output');
      }
      
      // Use the pre-calculated stats from the performance test
      const stats = data.results.stats;
      const grade = data.results.grade;
      
      console.log(`   📊 Parsed ${durations.length} test runs for ${fieldsCount} fields`);
      
      return {
        durations,
        fieldsCount,
        stats,
        grade
      };
      
    } catch (error) {
      console.error('   ❌ Failed to parse JSON output! Raw output for debugging:');
      console.error('--- START OUTPUT ---');
      console.error(output);
      console.error('--- END OUTPUT ---');
      
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }
  
  // Keep the old method as fallback (though it shouldn't be needed)
  parsePerformanceOutput(output) {
    // Extract timing data from the performance test output
    const lines = output.split('\n');
    const durations = [];
    let fieldsCount = 0;
    
    // Look for run results like "Run 1/10: 881.6ms (1000 fields)" - use global regex to find all matches
    lines.forEach(line => {
      const runMatches = [...line.matchAll(/Run \d+\/\d+: ([\d.]+)ms \((\d+) fields\)/g)];
      runMatches.forEach(match => {
        const duration = parseFloat(match[1]);
        durations.push(duration);
        fieldsCount = parseInt(match[2]);
      });
    });

    if (durations.length === 0) {
      console.error('   ❌ No timing data found! Full output for debugging:');
      console.error('--- START OUTPUT ---');
      console.error(output);
      console.error('--- END OUTPUT ---');
      
      // Also try to find lines that contain "Run" to see what format they have
      console.error('   🔍 Lines containing "Run":');
      lines.forEach((line, i) => {
        if (line.includes('Run')) {
          console.error(`   Line ${i}: "${line}"`);
        }
      });
      
      throw new Error('No timing data found in performance test output');
    }

    // Calculate statistics
    const sorted = [...durations].sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const variance = durations.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    const stats = {
      min: Math.min(...durations),
      max: Math.max(...durations),
      average: avg,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      std_deviation: stdDev,
      count: durations.length
    };

    // Determine performance grade
    let grade = 'poor';
    if (avg < 100) grade = 'excellent';
    else if (avg < 250) grade = 'good';
    else if (avg < 500) grade = 'fair';

    return {
      durations,
      fieldsCount,
      stats,
      grade
    };
  }

  createHistogramData(durations) {
    // Convert raw durations to Elasticsearch histogram format
    // Values must be in increasing order for Elasticsearch histogram field
    // Group duplicate values and count occurrences
    const valueCountMap = new Map();
    
    durations.forEach(duration => {
      const count = valueCountMap.get(duration) || 0;
      valueCountMap.set(duration, count + 1);
    });
    
    // Sort values and create parallel arrays
    const sortedValues = Array.from(valueCountMap.keys()).sort((a, b) => a - b);
    const counts = sortedValues.map(value => valueCountMap.get(value));
    
    console.log(`   📊 Histogram: ${durations.length} measurements → ${sortedValues.length} unique values`);
    console.log(`   📈 Values: [${sortedValues.slice(0, 5).map(v => v.toFixed(1)).join(', ')}${sortedValues.length > 5 ? '...' : ''}]`);
    console.log(`   📊 Counts: [${counts.slice(0, 5).join(', ')}${counts.length > 5 ? '...' : ''}]`);
    
    return {
      values: sortedValues,
      counts: counts
    };
  }

  async indexResults(metricCount, performanceResults, environment, forgeCommand) {
    console.log('💾 Indexing performance results...');
    
    const timestamp = new Date().toISOString();
    const indexName = `${this.indexName}-${timestamp.substring(0, 7)}`; // monthly indices
    
    const document = {
      '@timestamp': timestamp,
      test_run_id: this.testRunId,
      metric_count: metricCount,
      fields_returned: performanceResults.fieldsCount,
      response_times_ms: this.createHistogramData(performanceResults.durations),
      test_metadata: {
        runs: this.testRuns,
        warmup_runs: 3,
        index_pattern: 'metrics-*',
        forge_command: forgeCommand,
        api_endpoint: '/api/metrics/fields',
        host: 'localhost',
        port: 3000
      },
      environment: environment,
      performance_summary: {
        avg_duration_ms: performanceResults.stats.average,
        min_duration_ms: performanceResults.stats.min,
        max_duration_ms: performanceResults.stats.max,
        median_duration_ms: performanceResults.stats.median,
        p95_duration_ms: performanceResults.stats.p95,
        p99_duration_ms: performanceResults.stats.p99,
        std_deviation_ms: performanceResults.stats.std_deviation,
        performance_grade: performanceResults.grade
      }
    };

    try {
      await this.esClient.index({
        index: indexName,
        body: document
      });
      
      console.log(`✅ Results indexed to ${indexName}`);
    } catch (error) {
      console.error('❌ Failed to index results:', error.message);
      throw error;
    }
  }

  async runBenchmarkScenario(metricCount, environment) {
    console.log(`\n🎯 Benchmark Scenario: ${metricCount} metrics`);
    console.log('='.repeat(50));
    
    try {
      // Purge existing test data first
      await this.purgeTestDataStreams();
      
      // Generate test data
      const forgeCommand = await this.generateTestData(metricCount);
      
      // Run performance test with JSON output
      const performanceResults = await this.runPerformanceTest(metricCount);
      
      // Index results
      await this.indexResults(metricCount, performanceResults, environment, forgeCommand);
      
      console.log(`✅ Scenario completed successfully`);
      return performanceResults;
      
    } catch (error) {
      console.error(`❌ Scenario failed: ${error.message}`);
      throw error;
    }
  }

  async runBenchmarkSuite() {
    console.log('🚀 Performance Benchmark Suite');
    console.log('================================');
    console.log(`Test Run ID: ${this.testRunId}`);
    console.log(`Metric counts: ${this.metricCounts.join(', ')}`);
    console.log(`Test runs per scenario: ${this.testRuns}`);
    console.log('');

    // Check prerequisites
    const ready = await this.checkPrerequisites();
    if (!ready) {
      process.exit(1);
    }

    // Capture environment
    const environment = await this.captureEnvironment();

    // Run benchmark scenarios
    const results = [];
    for (let i = 0; i < this.metricCounts.length; i++) {
      const metricCount = this.metricCounts[i];
      
      try {
        const result = await this.runBenchmarkScenario(metricCount, environment);
        results.push({ metricCount, ...result });
      } catch (error) {
        console.error(`Skipping remaining scenarios due to error in ${metricCount} metrics scenario`);
        break;
      }
    }

    // Summary
    console.log('\n📊 Benchmark Summary');
    console.log('===================');
    console.log(`Test Run ID: ${this.testRunId}`);
    console.log('');
    
    if (results.length > 0) {
      console.log('Performance Results:');
      console.log('Metrics | Avg Time | Grade    | Fields | Runs');
      console.log('--------|----------|----------|--------|------');
      
      results.forEach(result => {
        const avgMs = result.stats.average.toFixed(1).padStart(7);
        const grade = result.grade.padEnd(8);
        const fields = result.fieldsCount.toString().padStart(6);
        const runs = result.durations.length.toString().padStart(4);
        
        console.log(`${result.metricCount.toString().padStart(7)} | ${avgMs}ms | ${grade} | ${fields} | ${runs}`);
      });
      
      console.log('');
      console.log('🎉 Benchmark suite completed successfully!');
      console.log(`📈 View results in Kibana with test_run_id: ${this.testRunId}`);
      
    } else {
      console.log('❌ No scenarios completed successfully');
      process.exit(1);
    }
  }

  // Utility methods
  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { 
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: options.cwd || __dirname
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timeout = options.timeout ? setTimeout(() => {
        process.kill();
        reject(new Error(`Command timeout after ${options.timeout}ms`));
      }, options.timeout) : null;
      
      process.on('close', (code) => {
        if (timeout) clearTimeout(timeout);
        
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });
      
      process.on('error', (error) => {
        if (timeout) clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    auth: 'elastic:changeme' // default auth
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--counts':
        options.counts = nextArg.split(',').map(n => parseInt(n.trim()));
        i++;
        break;
      case '--runs':
        options.runs = parseInt(nextArg);
        i++;
        break;
      case '--forge-path':
        options.forgePath = nextArg;
        i++;
        break;
      case '--index':
        options.index = nextArg;
        i++;
        break;
      case '--wait-time':
        options.waitTime = parseInt(nextArg);
        i++;
        break;
      case '--elasticsearch-auth':
        options.auth = nextArg;
        i++;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
Usage: npm run perf:benchmark [options]

Options:
  --counts <nums>                    Comma-separated metric counts to test (default: 100,500,1000,2000)
  --runs <number>                    Number of test runs per scenario (default: 10)
  --forge-path <path>                Path to simian-forge directory (default: ../simian-forge)
  --index <name>                     Index name prefix for results (default: performance-benchmarks)
  --wait-time <secs>                 Seconds to wait after data generation (default: 30)
  --elasticsearch-auth <user:pass>   Elasticsearch authentication (default: elastic:changeme)
  --help, -h                         Show this help message

Environment Variables:
  ELASTICSEARCH_URL    Elasticsearch connection URL (default: http://localhost:9200)

Examples:
  npm run perf:benchmark
  npm run perf:benchmark -- --counts 500,1000,2000,4000 --runs 5
  npm run perf:benchmark -- --forge-path /path/to/simian-forge --wait-time 60
  npm run perf:benchmark -- --elasticsearch-auth admin:secret
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const suite = new PerformanceBenchmarkSuite(options);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Benchmark interrupted by user');
    process.exit(1);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Benchmark terminated');
    process.exit(1);
  });

  suite.runBenchmarkSuite().catch(error => {
    console.error('\n❌ Benchmark suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceBenchmarkSuite;