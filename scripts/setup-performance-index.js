#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch');

/**
 * Setup script for performance benchmark index template
 * Creates the index template needed for storing performance test results with histogram data
 */

class PerformanceIndexSetup {
  constructor(options = {}) {
    const clientConfig = {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    };

    // Add authentication if provided
    if (options.auth) {
      const [username, password] = options.auth.split(':');
      clientConfig.auth = { username, password };
    }

    this.client = new Client(clientConfig);
    this.templateName = 'performance-benchmarks';
    this.indexPattern = 'performance-benchmarks-*';
  }

  async setupIndexTemplate() {
    console.log('🔧 Setting up performance benchmark index template...');
    
    const template = {
      index_patterns: [this.indexPattern],
      template: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          "index.mapping.total_fields.limit": 2000
        },
        mappings: {
          properties: {
            '@timestamp': { 
              type: 'date' 
            },
            test_run_id: { 
              type: 'keyword',
              fields: {
                text: {
                  type: 'text'
                }
              }
            },
            metric_count: { 
              type: 'long' 
            },
            fields_returned: { 
              type: 'long' 
            },
            response_times_ms: {
              type: 'histogram'
            },
            test_metadata: {
              type: 'object',
              properties: {
                runs: { type: 'long' },
                warmup_runs: { type: 'long' },
                index_pattern: { type: 'keyword' },
                forge_command: { 
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword'
                    }
                  }
                },
                api_endpoint: { type: 'keyword' },
                host: { type: 'keyword' },
                port: { type: 'long' }
              }
            },
            environment: {
              type: 'object',
              properties: {
                node_version: { type: 'keyword' },
                hostname: { type: 'keyword' },
                git_commit: { 
                  type: 'keyword',
                  fields: {
                    text: {
                      type: 'text'
                    }
                  }
                },
                git_branch: { type: 'keyword' },
                platform: { type: 'keyword' },
                cpu_arch: { type: 'keyword' }
              }
            },
            performance_summary: {
              type: 'object',
              properties: {
                avg_duration_ms: { type: 'double' },
                min_duration_ms: { type: 'double' },
                max_duration_ms: { type: 'double' },
                median_duration_ms: { type: 'double' },
                p95_duration_ms: { type: 'double' },
                p99_duration_ms: { type: 'double' },
                std_deviation_ms: { type: 'double' },
                performance_grade: { type: 'keyword' }
              }
            }
          }
        }
      }
    };

    try {
      // Check if template already exists
      const templateExists = await this.client.indices.existsIndexTemplate({
        name: this.templateName
      });

      if (templateExists) {
        console.log(`📋 Index template '${this.templateName}' already exists`);
        
        // Optionally update the template
        const shouldUpdate = process.argv.includes('--force-update');
        if (shouldUpdate) {
          console.log('🔄 Updating existing template...');
          await this.client.indices.putIndexTemplate({
            name: this.templateName,
            body: template
          });
          console.log('✅ Index template updated successfully');
        } else {
          console.log('ℹ️  Use --force-update to update existing template');
        }
      } else {
        // Create new template
        await this.client.indices.putIndexTemplate({
          name: this.templateName,
          body: template
        });
        console.log(`✅ Index template '${this.templateName}' created successfully`);
      }

      // Test template by creating a sample document
      await this.testTemplate();

    } catch (error) {
      console.error('❌ Failed to setup index template:', error.message);
      if (error.meta?.body?.error) {
        console.error('Elasticsearch error:', JSON.stringify(error.meta.body.error, null, 2));
      }
      process.exit(1);
    }
  }

  async testTemplate() {
    console.log('🧪 Testing index template with sample document...');
    
    const testIndex = `${this.indexPattern.replace('*', 'test')}`;
    const sampleDoc = {
      '@timestamp': new Date().toISOString(),
      test_run_id: 'template-test-' + Date.now(),
      metric_count: 1000,
      fields_returned: 1000,
      response_times_ms: {
        values: [450.2, 467.8, 489.1, 501.3, 523.7],
        counts: [1, 1, 1, 1, 1]
      },
      test_metadata: {
        runs: 5,
        warmup_runs: 2,
        index_pattern: 'metrics-*',
        forge_command: './forge --dataset unique-metrics --count 1000 --interval 10s --backfill now-15m --purge',
        api_endpoint: '/api/metrics/fields',
        host: 'localhost',
        port: 3000
      },
      environment: {
        node_version: process.version,
        hostname: require('os').hostname(),
        git_commit: 'test-commit',
        git_branch: 'main',
        platform: process.platform,
        cpu_arch: process.arch
      },
      performance_summary: {
        avg_duration_ms: 478.4,
        min_duration_ms: 450.2,
        max_duration_ms: 523.7,
        median_duration_ms: 489.1,
        p95_duration_ms: 523.7,
        p99_duration_ms: 523.7,
        std_deviation_ms: 28.5,
        performance_grade: 'fair'
      }
    };

    try {
      // Index test document
      await this.client.index({
        index: testIndex,
        body: sampleDoc
      });

      // Wait a moment for indexing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Query back to verify
      const searchResult = await this.client.search({
        index: testIndex,
        body: {
          query: {
            term: {
              test_run_id: sampleDoc.test_run_id
            }
          }
        }
      });

      // Handle both old and new client response formats
      const hits = searchResult.body?.hits || searchResult.hits;
      const totalHits = hits?.total?.value || hits?.total || 0;

      if (totalHits > 0) {
        console.log('✅ Template test successful - sample document indexed and retrieved');
        
        // Clean up test document
        const docId = hits.hits[0]._id;
        await this.client.delete({
          index: testIndex,
          id: docId
        });
        console.log('🧹 Test document cleaned up');
      } else {
        throw new Error('Sample document not found after indexing');
      }

    } catch (error) {
      console.error('❌ Template test failed:', error.message);
      throw error;
    }
  }

  async checkConnection() {
    console.log('🔌 Checking Elasticsearch connection...');
    
    try {
      const info = await this.client.info();
      // Handle both old and new Elasticsearch client response formats
      const version = info.body?.version?.number || info.version?.number || 'unknown';
      console.log(`✅ Connected to Elasticsearch ${version}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Elasticsearch:', error.message);
      console.error('ℹ️  Make sure Elasticsearch is running and credentials are correct');
      return false;
    }
  }

  async run() {
    console.log('🚀 Performance Benchmark Index Setup');
    console.log('=====================================');
    
    const connected = await this.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    await this.setupIndexTemplate();
    
    console.log('');
    console.log('🎉 Setup complete! You can now run performance benchmarks.');
    console.log(`📊 Results will be stored in indices matching: ${this.indexPattern}`);
    console.log('');
    console.log('Next steps:');
    console.log('  npm run perf:benchmark           # Run performance benchmarks');
    console.log('  npm run perf:benchmark --help    # See available options');
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    forceUpdate: args.includes('--force-update'),
    help: args.includes('--help') || args.includes('-h'),
    auth: 'elastic:changeme' // default auth
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    if (arg === '--elasticsearch-auth' && nextArg) {
      options.auth = nextArg;
      i++; // skip next arg since we consumed it
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: npm run perf:setup [options]

Options:
  --elasticsearch-auth <user:pass>   Elasticsearch authentication (default: elastic:changeme)
  --force-update                     Update existing index template
  --help, -h                         Show this help message

Environment Variables:
  ELASTICSEARCH_URL    Elasticsearch connection URL (default: http://localhost:9200)

Examples:
  npm run perf:setup
  npm run perf:setup -- --force-update
  npm run perf:setup -- --elasticsearch-auth admin:secret
  ELASTICSEARCH_URL=http://localhost:9200 npm run perf:setup
`);
}

// Main execution
if (require.main === module) {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const setup = new PerformanceIndexSetup(args);
  setup.run().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceIndexSetup;