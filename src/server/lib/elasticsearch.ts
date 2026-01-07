import { Client } from "@elastic/elasticsearch";

// Initialize and export a shared Elasticsearch client
export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "https://localhost:9200",
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || "elastic",
    password: process.env.ELASTICSEARCH_PASSWORD || "changeme",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
