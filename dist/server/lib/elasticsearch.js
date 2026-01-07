"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
// Initialize and export a shared Elasticsearch client
exports.esClient = new elasticsearch_1.Client({
    node: process.env.ELASTICSEARCH_URL || "https://localhost:9200",
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME || "elastic",
        password: process.env.ELASTICSEARCH_PASSWORD || "changeme",
    },
    tls: {
        rejectUnauthorized: false,
    },
});
//# sourceMappingURL=elasticsearch.js.map