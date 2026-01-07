"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsDataGenerator = void 0;
const datemath_1 = __importDefault(require("@elastic/datemath"));
class LogsDataGenerator {
    // In-memory cache for generated logs
    static cachedLogs = null;
    // Field type mapping - based on real Elasticsearch log structure (378+ fields)
    fieldTypeMap = {
        _id: 'keyword',
        _index: 'keyword',
        _version: 'number',
        _score: 'number',
        '@timestamp': 'time',
        'observed_timestamp': 'time',
        'body.text': 'string',
        level: 'keyword',
        message: 'string',
        // Service fields
        'service.name': 'keyword',
        'service.environment': 'keyword',
        'service.version': 'keyword',
        'service.node.name': 'keyword',
        // Kubernetes fields
        'k8s.container.name': 'keyword',
        'k8s.container.restart_count': 'number',
        'k8s.namespace.name': 'keyword',
        'k8s.pod.name': 'keyword',
        'k8s.pod.uid': 'keyword',
        'k8s.pod.start_time': 'time',
        'k8s.cluster.name': 'keyword',
        'k8s.daemonset.name': 'keyword',
        'k8s.node.name': 'keyword',
        'k8s.pod.ip': 'ip',
        'kubernetes.container.name': 'keyword',
        'kubernetes.namespace': 'keyword',
        'kubernetes.pod.name': 'keyword',
        'kubernetes.pod.uid': 'keyword',
        'kubernetes.node.name': 'keyword',
        'kubernetes.daemonset.name': 'keyword',
        // Cloud fields
        'cloud.provider': 'keyword',
        'cloud.platform': 'keyword',
        'cloud.availability_zone': 'keyword',
        'cloud.instance.id': 'keyword',
        'cloud.account.id': 'keyword',
        'cloud.service.name': 'keyword',
        'cloud.region': 'keyword',
        'cloud.machine.type': 'keyword',
        // Host fields (with multiple IPs and MACs like real data)
        'host.name': 'keyword',
        'host.hostname': 'keyword',
        'host.ip': 'ip',
        'host.id': 'keyword',
        'host.architecture': 'keyword',
        'host.arch': 'keyword',
        'host.cpu.family': 'keyword',
        'host.cpu.model.name': 'keyword',
        'host.cpu.model.id': 'keyword',
        'host.cpu.cache.l2.size': 'number',
        'host.cpu.cache.l3.size': 'number',
        'host.cpu.cores': 'number',
        'host.cpu.threads': 'number',
        'host.cpu.vendor.id': 'keyword',
        'host.cpu.stepping': 'keyword',
        'host.mac': 'keyword',
        'host.os.full': 'string',
        'host.os.name': 'keyword',
        'host.os.version': 'keyword',
        'host.os.platform': 'keyword',
        'host.os.family': 'keyword',
        'host.uptime': 'number',
        'host.boot.time': 'time',
        // OS fields
        'os.type': 'keyword',
        'os.name': 'keyword',
        'os.version': 'keyword',
        'os.description': 'string',
        'os.platform': 'keyword',
        'os.family': 'keyword',
        // Data stream fields
        'data_stream.type': 'keyword',
        'data_stream.dataset': 'keyword',
        'data_stream.namespace': 'keyword',
        // Orchestrator fields
        'orchestrator.cluster.name': 'keyword',
        'orchestrator.cluster.url': 'keyword',
        'orchestrator.type': 'keyword',
        'orchestrator.namespace': 'keyword',
        // Resource attributes (OpenTelemetry) - many more fields
        'resource.attributes.service.name': 'keyword',
        'resource.attributes.service.name.text': 'string',
        'resource.attributes.service.version': 'keyword',
        'resource.attributes.k8s.container.name': 'keyword',
        'resource.attributes.k8s.container.restart_count': 'keyword',
        'resource.attributes.k8s.namespace.name': 'keyword',
        'resource.attributes.k8s.pod.name': 'keyword',
        'resource.attributes.k8s.pod.uid': 'keyword',
        'resource.attributes.k8s.pod.start_time': 'time',
        'resource.attributes.k8s.daemonset.name': 'keyword',
        'resource.attributes.host.name': 'keyword',
        'resource.attributes.host.ip': 'ip',
        'resource.attributes.host.id': 'keyword',
        'resource.attributes.host.arch': 'keyword',
        'resource.attributes.host.cpu.family': 'keyword',
        'resource.attributes.host.cpu.model.name': 'keyword',
        'resource.attributes.host.cpu.model.id': 'keyword',
        'resource.attributes.host.cpu.cache.l2.size': 'number',
        'resource.attributes.host.mac': 'keyword',
        'resource.attributes.os.type': 'keyword',
        'resource.attributes.os.description': 'string',
        'resource.attributes.cloud.provider': 'keyword',
        'resource.attributes.cloud.platform': 'keyword',
        'resource.attributes.cloud.availability_zone': 'keyword',
        'resource.attributes.cloud.instance.id': 'keyword',
        'resource.attributes.cloud.account.id': 'keyword',
        'resource.attributes.k8s.cluster.name': 'keyword',
        'resource.attributes.k8s.node.name': 'keyword',
        'resource.attributes.k8s.pod.ip': 'ip',
        'resource.attributes.host.cpu.vendor.id': 'keyword',
        'resource.attributes.host.cpu.stepping': 'keyword',
        'resource.attributes.host.cpu.model.name.text': 'string',
        'resource.schema_url': 'keyword',
        // Attributes fields
        'attributes.log.file.path': 'string',
        'attributes.log.file.path.text': 'string',
        'attributes.log.iostream': 'keyword',
        'attributes.logtag': 'keyword',
        // ECS fields
        'ecs.version': 'keyword',
        // Agent fields
        'agent.id': 'keyword',
        'agent.name': 'keyword',
        'agent.type': 'keyword',
        'agent.version': 'keyword',
        'agent.ephemeral_id': 'keyword',
        // Event fields
        'event.dataset': 'keyword',
        'event.module': 'keyword',
        'event.category': 'keyword',
        'event.type': 'keyword',
        'event.action': 'keyword',
        'event.outcome': 'keyword',
        'event.duration': 'number',
        'event.ingested': 'time',
        'event.created': 'time',
        'event.original': 'string',
        // Log fields (from structured JSON)
        'log.level': 'keyword',
        'log.logger': 'keyword',
        'log.file.path': 'string',
        'log.iostream': 'keyword',
        'log.offset': 'number',
        'logtag': 'keyword',
        // Error fields
        'error.type': 'keyword',
        'error.message': 'string',
        'error.stack_trace': 'string',
        'error.code': 'keyword',
        // HTTP fields
        'http.request.method': 'keyword',
        'http.request.headers': 'keyword',
        'http.response.status_code': 'number',
        'http.response.headers': 'keyword',
        'http.request.body.bytes': 'number',
        'http.response.body.bytes': 'number',
        // URL fields
        'url.scheme': 'keyword',
        'url.domain': 'keyword',
        'url.port': 'number',
        'url.path': 'keyword',
        'url.query': 'string',
        'url.full': 'string',
        'url.original': 'string',
        // User agent fields
        'user_agent.original': 'string',
        'user_agent.name': 'keyword',
        'user_agent.version': 'keyword',
        'user_agent.device.name': 'keyword',
        'user_agent.os.name': 'keyword',
        'user_agent.os.version': 'keyword',
        // Network fields
        'network.protocol': 'keyword',
        'network.type': 'keyword',
        'network.transport': 'keyword',
        'network.bytes': 'number',
        'network.packets': 'number',
        // Source/Destination fields
        'source.ip': 'ip',
        'source.port': 'number',
        'source.address': 'keyword',
        'destination.ip': 'ip',
        'destination.port': 'number',
        'destination.address': 'keyword',
        // Tracing fields
        'trace.id': 'keyword',
        'span.id': 'keyword',
        'parent.id': 'keyword',
        'transaction.id': 'keyword',
        'transaction.name': 'keyword',
        'transaction.type': 'keyword',
        // Process fields
        'process.pid': 'number',
        'process.ppid': 'number',
        'process.name': 'keyword',
        'process.args': 'keyword',
        'process.executable': 'keyword',
        'process.title': 'keyword',
        'process.working_directory': 'keyword',
        'process.start': 'time',
        'process.thread.id': 'number',
        'process.thread.name': 'keyword',
        // File fields
        'file.path': 'keyword',
        'file.name': 'keyword',
        'file.extension': 'keyword',
        'file.size': 'number',
        'file.mtime': 'time',
        'file.ctime': 'time',
        'file.type': 'keyword',
        'file.hash.md5': 'keyword',
        'file.hash.sha1': 'keyword',
        'file.hash.sha256': 'keyword',
        // User fields
        'user.id': 'keyword',
        'user.name': 'keyword',
        'user.email': 'keyword',
        'user.domain': 'keyword',
        'user.group.id': 'keyword',
        'user.group.name': 'keyword',
        // Geo fields
        'geo.city_name': 'keyword',
        'geo.continent_code': 'keyword',
        'geo.continent_name': 'keyword',
        'geo.country_iso_code': 'keyword',
        'geo.country_name': 'keyword',
        'geo.location.lat': 'number',
        'geo.location.lon': 'number',
        'geo.region_iso_code': 'keyword',
        'geo.region_name': 'keyword',
        'geo.timezone': 'keyword',
        // Legacy fields for backward compatibility
        host: 'keyword',
        service: 'keyword',
        container_id: 'keyword',
        trace_id: 'keyword',
        latency_ms: 'number',
        status_code: 'number',
        user_id: 'keyword',
        method: 'keyword',
        path: 'keyword',
        bytes: 'number',
        memory: 'number',
        'machine.ram': 'number',
    };
    async generateData(params) {
        // Check cache first - only generate once
        if (!LogsDataGenerator.cachedLogs) {
            LogsDataGenerator.cachedLogs = this.generateSampleLogData();
        }
        // Refresh timestamps dynamically to match current time
        const logs = LogsDataGenerator.cachedLogs.map((log, index) => {
            // Recalculate timestamp offset based on the same distribution as original generation
            const fifteenMinutesInMs = 15 * 60 * 1000;
            const oneHourInMs = 60 * 60 * 1000;
            const oneDayInMs = 24 * 60 * 60 * 1000;
            // Use index-based deterministic random for consistent distribution
            const seed = 12345 + index;
            const rand = Math.abs(Math.sin(seed) * 10000) % 1;
            let randomTimeOffset;
            if (rand < 0.4) {
                // 40% in last 15 minutes
                const minuteRand = Math.abs(Math.sin(seed + 1) * 10000) % 1;
                const selectedMinute = Math.floor(minuteRand * 15);
                const randomSecond = Math.floor((Math.abs(Math.sin(seed + 2) * 10000) % 1) * 60);
                const millisecondVariation = Math.floor((Math.abs(Math.sin(seed + 3) * 10000) % 1) * 1000);
                randomTimeOffset = (selectedMinute * 60 * 1000) + (randomSecond * 1000) + millisecondVariation;
            }
            else if (rand < 0.65) {
                // 25% in last hour
                randomTimeOffset = Math.floor((Math.abs(Math.sin(seed + 4) * 10000) % 1) * oneHourInMs);
            }
            else {
                // 35% across full 24 hours
                randomTimeOffset = Math.floor((Math.abs(Math.sin(seed + 5) * 10000) % 1) * oneDayInMs);
            }
            const newTimestamp = new Date(Date.now() - randomTimeOffset).toISOString();
            return {
                ...log,
                '@timestamp': newTimestamp,
                'observed_timestamp': newTimestamp,
            };
        });
        // Apply search query if provided
        let filteredLogs = logs;
        if (params.searchQuery) {
            const searchLower = params.searchQuery.toLowerCase();
            filteredLogs = logs.filter((log) => {
                // Search across all string values in the log document
                return Object.values(log).some((value) => {
                    if (value === null || value === undefined)
                        return false;
                    return String(value).toLowerCase().includes(searchLower);
                });
            });
        }
        // Apply time range filtering if provided
        if (params.from && params.to) {
            // Use dateMath to parse date expressions (like "now-1m", "now-15m", etc.)
            const fromMoment = datemath_1.default.parse(params.from);
            const toMoment = datemath_1.default.parse(params.to, { roundUp: true });
            if (fromMoment && toMoment) {
                const fromTime = fromMoment.valueOf();
                const toTime = toMoment.valueOf();
                filteredLogs = filteredLogs.filter((log) => {
                    const logTimestamp = log['@timestamp'];
                    if (!logTimestamp)
                        return false;
                    const logTime = new Date(logTimestamp).getTime();
                    const isInRange = logTime >= fromTime && logTime <= toTime;
                    return isInRange;
                });
            }
        }
        // Apply filters if provided
        if (params.filters && params.filters.length > 0) {
            for (const filter of params.filters) {
                const { field, operator, values } = filter;
                filteredLogs = filteredLogs.filter((log) => {
                    // Handle wildcard field - search across all fields
                    if (field === '*') {
                        // For wildcard, check if ANY field contains the value
                        const logStr = JSON.stringify(log).toLowerCase();
                        switch (operator) {
                            case 'contains':
                                return values.some(value => logStr.includes(value.toLowerCase()));
                            case 'not_contains':
                                return !values.some(value => logStr.includes(value.toLowerCase()));
                            default:
                                return true;
                        }
                    }
                    // Handle specific field
                    const fieldValue = log[field];
                    if (fieldValue === undefined || fieldValue === null) {
                        return false;
                    }
                    const fieldValueStr = String(fieldValue).toLowerCase();
                    switch (operator) {
                        case 'equals':
                            return values.some(value => fieldValueStr === value.toLowerCase());
                        case 'not_equals':
                            return !values.some(value => fieldValueStr === value.toLowerCase());
                        case 'contains':
                            return values.some(value => fieldValueStr.includes(value.toLowerCase()));
                        case 'not_contains':
                            return !values.some(value => fieldValueStr.includes(value.toLowerCase()));
                        case 'greater_than':
                            if (typeof fieldValue === 'number') {
                                return values.some(value => fieldValue > parseFloat(value));
                            }
                            return false;
                        case 'greater_equal':
                            if (typeof fieldValue === 'number') {
                                return values.some(value => fieldValue >= parseFloat(value));
                            }
                            return false;
                        case 'less_than':
                            if (typeof fieldValue === 'number') {
                                return values.some(value => fieldValue < parseFloat(value));
                            }
                            return false;
                        default:
                            return true;
                    }
                });
            }
        }
        // Note: Aggregations are now handled at the UI layer, not in the data generator
        return filteredLogs;
    }
    getAvailableFields(data) {
        // Helper function to flatten nested objects and get all field paths
        const flattenObject = (obj, prefix = '') => {
            const fields = [];
            for (const [key, value] of Object.entries(obj)) {
                if (key === '@timestamp' || key === 'timestamp')
                    continue;
                const fullKey = prefix ? `${prefix}.${key}` : key;
                // Skip type metadata - these are field type definitions, not actual data
                if (key === 'type' || fullKey.includes('.type')) {
                    continue;
                }
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // Recursively flatten nested objects
                    fields.push(...flattenObject(value, fullKey));
                }
                else {
                    // Add the field path
                    fields.push(fullKey);
                }
            }
            return fields;
        };
        // Check if this is aggregated data (has very few fields and no typical log fields)
        if (data.length > 0) {
            const firstDoc = data[0];
            const docKeys = Object.keys(firstDoc);
            // If document has no @timestamp, message, or log fields, it's likely aggregated
            const hasTypicalLogFields = docKeys.some(key => key === '@timestamp' ||
                key === 'message' ||
                key.startsWith('log.') ||
                key.startsWith('host.') ||
                key.startsWith('service.'));
            // If no typical log fields and very few fields (<=5), return only document fields
            if (!hasTypicalLogFields && docKeys.length <= 5) {
                const documentFields = new Set();
                data.forEach((log) => {
                    const flattenedFields = flattenObject(log);
                    flattenedFields.forEach(field => documentFields.add(field));
                });
                return Array.from(documentFields).sort();
            }
        }
        // Return all fields from our comprehensive field mapping
        // This ensures we show all possible fields, not just those in the current document set
        const allFields = Object.keys(this.fieldTypeMap);
        // Also add any additional fields found in the actual documents
        // (in case there are fields generated but not in the mapping)
        if (data.length > 0) {
            const documentFields = new Set();
            data.forEach((log) => {
                const flattenedFields = flattenObject(log);
                flattenedFields.forEach(field => documentFields.add(field));
            });
            // Merge document fields with mapped fields
            documentFields.forEach(field => {
                if (!allFields.includes(field)) {
                    allFields.push(field);
                }
            });
        }
        return allFields.sort();
    }
    formatForDisplay(data) {
        // For logs, we don't need any special formatting
        return data;
    }
    // Cache the generated data to ensure consistency
    static cachedData = null;
    // Method to clear cache (for debugging)
    static clearCache() {
        LogsDataGenerator.cachedData = null;
    }
    generateSampleLogData() {
        // Return cached data if it exists
        if (LogsDataGenerator.cachedData) {
            return LogsDataGenerator.cachedData;
        }
        // Realistic service configurations based on observed data
        const services = [
            { name: "auditbeat", container: "auditbeat", environment: "production" },
            { name: "opbeans-python", container: "opbeans-python", environment: "opbeans" },
            { name: "opbeans-java", container: "opbeans-java", environment: "opbeans" },
            { name: "metricbeat", container: "metricbeat", environment: "production" },
            { name: "filebeat", container: "filebeat", environment: "production" },
            { name: "heartbeat", container: "heartbeat", environment: "production" },
            { name: "elasticsearch", container: "elasticsearch", environment: "production" },
            { name: "kibana", container: "kibana", environment: "production" },
            { name: "logstash", container: "logstash", environment: "production" },
            { name: "apm-server", container: "apm-server", environment: "production" },
        ];
        const clusters = ["edge-oblt", "prod-cluster", "staging-cluster", "dev-cluster"];
        const namespaces = ["default", "kube-system", "elastic-system", "monitoring"];
        const cloudProviders = ["gcp", "aws", "azure"];
        const cloudPlatforms = ["gcp_kubernetes_engine", "aws_eks", "azure_aks"];
        const availabilityZones = {
            gcp: ["us-central1-c", "us-west1-a", "europe-west1-b"],
            aws: ["us-east-1a", "us-west-2b", "eu-west-1c"],
            azure: ["eastus-1", "westus-2", "westeurope-1"]
        };
        const nodeNames = [
            "gke-edge-oblt-edge-oblt-pool-2d608c26-mbwx",
            "gke-prod-cluster-default-pool-7f9a8b2c-xyz",
            "ip-10-0-1-100.ec2.internal",
            "aks-nodepool1-12345678-vmss000000"
        ];
        const hostArchitectures = ["amd64", "arm64"];
        const cpuModels = ["AMD EPYC 7B12", "Intel Xeon E5-2670", "AMD EPYC 7763", "Intel Xeon Gold 6154"];
        const osTypes = ["linux", "windows"];
        const levels = ["info", "warn", "error", "debug"];
        const paths = [
            "/api/users",
            "/api/auth/login",
            "/api/products",
            "/api/orders",
            "/health",
            "/metrics",
            "/intake/v2/events",
            "/_cluster/health",
            "/api/status"
        ];
        const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
        // Create seeded random function for consistent results
        let seed = 12345; // Fixed seed for consistent data
        const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        // Generate more data with timestamps from now to 24h ago (10000 entries total)
        const data = Array(10000)
            .fill(null)
            .map((_, index) => {
            const level = levels[Math.floor(seededRandom() * levels.length)];
            const service = services[Math.floor(seededRandom() * services.length)];
            const cluster = clusters[Math.floor(seededRandom() * clusters.length)];
            const namespace = namespaces[Math.floor(seededRandom() * namespaces.length)];
            const cloudProvider = cloudProviders[Math.floor(seededRandom() * cloudProviders.length)];
            const cloudPlatform = cloudPlatforms[Math.floor(seededRandom() * cloudPlatforms.length)];
            const availabilityZone = availabilityZones[cloudProvider][Math.floor(seededRandom() * availabilityZones[cloudProvider].length)];
            const nodeName = nodeNames[Math.floor(seededRandom() * nodeNames.length)];
            const hostArch = hostArchitectures[Math.floor(seededRandom() * hostArchitectures.length)];
            const cpuModel = cpuModels[Math.floor(seededRandom() * cpuModels.length)];
            const osType = osTypes[Math.floor(seededRandom() * osTypes.length)];
            const method = methods[Math.floor(seededRandom() * methods.length)];
            const path = paths[Math.floor(seededRandom() * paths.length)];
            const latency = Math.round(seededRandom() * 1000);
            const statusCode = seededRandom() > 0.9 ? 500 : seededRandom() > 0.8 ? 404 : 200;
            // Generate pod and container IDs
            const podUid = `${Math.floor(seededRandom() * 999999999)}-${Math.floor(seededRandom() * 999999999)}-${Math.floor(seededRandom() * 999999999)}-${Math.floor(seededRandom() * 999999999)}`;
            const podName = `${service.name}-${Math.random().toString(36).substring(2, 7)}`;
            const hostId = Math.floor(seededRandom() * 9999999999999999999).toString();
            const instanceId = Math.floor(seededRandom() * 9999999999999999999).toString();
            // Generate timestamps with heavy weighting towards last 15 minutes
            const fifteenMinutesInMs = 15 * 60 * 1000; // 15 minutes in milliseconds
            const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
            const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            // Distribute timestamps with higher density in recent periods
            let randomTimeOffset;
            const rand = seededRandom();
            if (rand < 0.4) {
                // 40% of documents in last 15 minutes with realistic variability
                const minuteRand = seededRandom();
                let selectedMinute;
                // Create realistic "burst" patterns - some minutes get more activity
                if (minuteRand < 0.15) {
                    // 15% chance: High activity minutes (recent activity spikes)
                    const highActivityMinutes = [0, 1, 2, 7, 8, 12]; // Mix of recent and scattered
                    selectedMinute = highActivityMinutes[Math.floor(seededRandom() * highActivityMinutes.length)];
                }
                else if (minuteRand < 0.35) {
                    // 20% chance: Medium activity minutes  
                    const mediumActivityMinutes = [3, 4, 5, 9, 10, 11, 13];
                    selectedMinute = mediumActivityMinutes[Math.floor(seededRandom() * mediumActivityMinutes.length)];
                }
                else {
                    // 65% chance: Any minute (background activity)
                    selectedMinute = Math.floor(seededRandom() * 15);
                }
                // Add random seconds within the selected minute
                const randomSecond = Math.floor(seededRandom() * 60);
                const millisecondVariation = Math.floor(seededRandom() * 1000);
                randomTimeOffset = (selectedMinute * 60 * 1000) + (randomSecond * 1000) + millisecondVariation;
            }
            else if (rand < 0.65) {
                // 25% of documents in last hour 
                randomTimeOffset = Math.floor(seededRandom() * oneHourInMs);
            }
            else {
                // 35% of documents distributed across the full 24 hours
                randomTimeOffset = Math.floor(seededRandom() * oneDayInMs);
            }
            const timestamp = new Date(Date.now() - randomTimeOffset).toISOString();
            const observedTimestamp = new Date(Date.now() - randomTimeOffset + Math.floor(seededRandom() * 1000)).toISOString();
            // Generate realistic messages based on service type and log level (with various formats)
            let message;
            const messageType = Math.floor(seededRandom() * 6); // Different message formats
            if (messageType === 0) {
                // Structured JSON string format (like real ES data)
                const structuredMessage = {
                    "log.level": level,
                    "@timestamp": timestamp,
                    "log.logger": `${service.name}.${Math.random().toString(36).substring(2, 8)}`,
                    "log.origin": {
                        "function": `github.com/elastic/${service.name}/module/system.(*Handler).process`,
                        "file.name": `${service.name}/handler.go`,
                        "file.line": Math.floor(seededRandom() * 500) + 50
                    },
                    "message": service.name.includes('beat')
                        ? `failed to load process information for PID ${Math.floor(seededRandom() * 999999)}: error fetching process stats: open /proc/${Math.floor(seededRandom() * 999999)}/stat: no such file or directory`
                        : `${method} ${path} completed with status ${statusCode} in ${latency}ms`,
                    "service.name": service.name,
                    "ecs.version": "1.6.0"
                };
                message = JSON.stringify(structuredMessage);
            }
            else if (messageType === 1) {
                // Key-value format (like containerized logs)
                const kvPairs = [
                    `time="${timestamp}"`,
                    `level=${level}`,
                    `msg="Failed to load ${path} (0x${Math.floor(seededRandom() * 999999999999999).toString(16)}): failed to create point resolver for '/proc/${Math.floor(seededRandom() * 999999)}/root//${path.replace('/', '')}': ${Math.floor(seededRandom() * 5) + 1}"`,
                    `service="${service.name}"`
                ];
                message = kvPairs.join(' ');
            }
            else if (messageType === 2) {
                // Access log format (nginx/envoy style)
                const userAgent = ["python-requests/2.32.3", "curl/7.68.0", "Mozilla/5.0", "elastic-agent/9.2.0"][Math.floor(seededRandom() * 4)];
                const requestId = Math.random().toString(36).substring(2, 10) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 12);
                message = `[${timestamp.replace('T', 'T').replace('.000Z', 'Z')}] "${method} ${path} HTTP/1.1" ${statusCode} - via_upstream - "-" 0 ${Math.floor(seededRandom() * 10000)} ${latency} ${Math.floor(latency * 0.8)} "-" "${userAgent}" "${requestId}" "frontend-proxy:8080" "10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}:8080" frontend 10.1.27.152:44564 10.1.27.152:8080 10.1.62.145:42054 - -`;
            }
            else if (messageType === 3) {
                // Kubernetes pod log format
                const logLevel = level === 'error' ? 'E' : level === 'warn' ? 'W' : 'I';
                const date = new Date(timestamp);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                const microseconds = String(date.getMilliseconds() * 1000).padStart(6, '0');
                const backgroundId = Math.random().toString(36).substring(2, 18);
                message = `${logLevel}${month}${day} ${hours}:${minutes}:${seconds}.${microseconds} ${Math.floor(seededRandom() * 999) + 1} podfinder.go:${Math.floor(seededRandom() * 300) + 100}] [background-id:${backgroundId} pod:${namespace}/${podName}] Pod found in snapshot ip=10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)} poduid=${podUid} sandboxuid=${Math.random().toString(36).substring(2, 64)}`;
            }
            else if (messageType === 4) {
                // Simple application error/warning messages
                const simpleMessages = level === 'error'
                    ? [
                        `Unhandled promise rejection: Failed to identify user: Failed to identify user - Identify user request returned a non-ok response [${statusCode}] - `,
                        `Database connection timeout: Connection to postgresql://postgres:5432/${service.name} timed out after 30s`,
                        `Failed to execute 'json' on 'Response': Unexpected end of JSON input`,
                        `Authentication failed: JWT token expired at ${timestamp}`,
                        `Rate limit exceeded: Too many requests from IP 10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}`
                    ]
                    : [
                        `${method} ${path} completed successfully in ${latency}ms`,
                        `Cache hit for key: ${service.name}:user:${Math.floor(seededRandom() * 10000)}`,
                        `Starting background task: cleanup-${Math.random().toString(36).substring(2, 8)}`,
                        `Configuration reloaded from /etc/${service.name}/${service.name}.yml`,
                        `Health check passed: all systems operational`
                    ];
                message = simpleMessages[Math.floor(seededRandom() * simpleMessages.length)];
            }
            else {
                // Kafka/messaging system logs
                const kafkaDate = timestamp.replace('T', ' ').replace('Z', '').replace(/\.\d{3}/, ',');
                const logLevelKafka = level.toUpperCase();
                const partition = Math.floor(seededRandom() * 10);
                const offset = Math.floor(seededRandom() * 999999) + 100000;
                const kafkaMessages = [
                    `[${kafkaDate}] ${logLevelKafka} [ProducerStateManager partition=__cluster_metadata-${partition}] Wrote producer snapshot at offset ${offset} with ${Math.floor(seededRandom() * 10)} producer ids in ${Math.floor(seededRandom() * 50)} ms. (org.apache.kafka.storage.internals.log.ProducerStateManager)`,
                    `[${kafkaDate}] ${logLevelKafka} [LocalLog partition=__cluster_metadata-${partition}, dir=/tmp/kafka-logs] Rolled new log segment at offset ${offset} in ${Math.floor(seededRandom() * 10) + 1} ms. (kafka.log.LocalLog)`,
                    `[${kafkaDate}] ${logLevelKafka} [Consumer clientId=${service.name}-consumer, groupId=${service.name}-group] Committed offset ${offset} for partition ${service.name}-${partition}`,
                    `[${kafkaDate}] ${logLevelKafka} [ReplicaManager broker=${Math.floor(seededRandom() * 10)}] High watermark of partition ${service.name}-${partition} is ${offset}`,
                    `[${kafkaDate}] ${logLevelKafka} [NetworkClient clientId=${service.name}] Node ${Math.floor(seededRandom() * 10)} disconnected.`
                ];
                message = kafkaMessages[Math.floor(seededRandom() * kafkaMessages.length)];
            }
            // Generate realistic body.text with structured JSON (like real ES logs)
            const structuredLog = {
                "log.level": level,
                "@timestamp": timestamp,
                "log.logger": `${service.name}.${Math.random().toString(36).substring(2, 8)}`,
                message: message,
                "service.name": service.name,
                "service.environment": service.environment,
                ...(level === "error" && { "error.type": "RuntimeException", "error.stack_trace": "at com.example.Service.method(Service.java:123)" }),
                ...(Math.random() > 0.7 && { "trace.id": `${Math.floor(seededRandom() * 999999999).toString(16)}`, "span.id": `${Math.floor(seededRandom() * 999999999).toString(16)}` }),
                "ecs.version": "1.6.0"
            };
            // Generate multiple IPs and MACs (like real ES data)
            const hostIps = Array.from({ length: Math.floor(seededRandom() * 6) + 1 }, () => `10.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}`);
            const hostMacs = Array.from({ length: Math.floor(seededRandom() * 6) + 1 }, () => `${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}-${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}-${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}-${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}-${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}-${Math.floor(seededRandom() * 256).toString(16).padStart(2, '0')}`);
            const logDocument = {
                _id: `log-${index + 1}`,
                _index: `.ds-logs-generic.otel-default-${new Date().toISOString().split('T')[0]}-000165`,
                _version: 1,
                _score: null,
                '@timestamp': timestamp,
                'observed_timestamp': observedTimestamp,
                'body.text': JSON.stringify(structuredLog),
                level,
                message,
                // Service fields
                'service.name': service.name,
                'service.environment': service.environment,
                'service.version': `${Math.floor(seededRandom() * 10)}.${Math.floor(seededRandom() * 10)}.${Math.floor(seededRandom() * 10)}`,
                'service.node.name': `${service.name}-${Math.random().toString(36).substring(2, 7)}`,
                // Kubernetes fields (both k8s.* and kubernetes.*)
                'k8s.container.name': service.container,
                'k8s.container.restart_count': Math.floor(seededRandom() * 5),
                'k8s.namespace.name': namespace,
                'k8s.pod.name': podName,
                'k8s.pod.uid': podUid,
                'k8s.pod.start_time': new Date(Date.now() - Math.floor(seededRandom() * 86400000 * 7)).toISOString(),
                'k8s.cluster.name': cluster,
                'k8s.node.name': nodeName,
                ...(service.name.includes('beat') && { 'k8s.daemonset.name': service.name }),
                // Duplicate kubernetes fields (as seen in real data)
                'kubernetes.container.name': service.container,
                'kubernetes.namespace': namespace,
                'kubernetes.pod.name': podName,
                'kubernetes.pod.uid': podUid,
                'kubernetes.node.name': nodeName,
                ...(service.name.includes('beat') && { 'kubernetes.daemonset.name': service.name }),
                // Cloud fields
                'cloud.provider': cloudProvider,
                'cloud.platform': cloudPlatform,
                'cloud.availability_zone': availabilityZone,
                'cloud.instance.id': instanceId,
                'cloud.account.id': cloudProvider === 'gcp' ? 'elastic-observability' : `account-${Math.floor(seededRandom() * 999999)}`,
                'cloud.service.name': cloudPlatform,
                'cloud.region': availabilityZone.split('-').slice(0, -1).join('-'),
                'cloud.machine.type': `n1-standard-${Math.floor(seededRandom() * 8) + 1}`,
                // Host fields (with multiple IPs and MACs)
                'host.name': nodeName,
                'host.hostname': nodeName.split('.')[0],
                'host.ip': hostIps,
                'host.id': hostId,
                'host.architecture': hostArch,
                'host.arch': hostArch,
                'host.cpu.family': Math.floor(seededRandom() * 50 + 10).toString(),
                'host.cpu.model.name': cpuModel,
                'host.cpu.model.id': Math.floor(seededRandom() * 100).toString(),
                'host.cpu.cache.l2.size': 512 + Math.floor(seededRandom() * 1024),
                'host.cpu.cache.l3.size': 1024 + Math.floor(seededRandom() * 8192),
                'host.cpu.cores': Math.floor(seededRandom() * 16) + 1,
                'host.cpu.threads': Math.floor(seededRandom() * 32) + 1,
                'host.mac': hostMacs,
                'host.os.full': osType === 'linux' ? `Red Hat Enterprise Linux 9.5 (Plow) (Linux ${nodeName} 6.6.87+ #1 SMP x86_64)` : `Windows Server 2022 Datacenter`,
                'host.os.name': osType === 'linux' ? 'Red Hat Enterprise Linux' : 'Windows Server',
                'host.os.version': osType === 'linux' ? '9.5' : '2022',
                'host.os.platform': osType,
                'host.os.family': osType,
                'host.uptime': Math.floor(seededRandom() * 1000000),
                'host.boot.time': new Date(Date.now() - Math.floor(seededRandom() * 86400000 * 30)).toISOString(),
                // OS fields
                'os.type': osType,
                'os.name': osType === 'linux' ? 'Red Hat Enterprise Linux' : 'Windows Server',
                'os.version': osType === 'linux' ? '9.5' : '2022',
                'os.description': osType === 'linux' ? `Red Hat Enterprise Linux 9.5 (Plow)` : `Windows Server 2022 Datacenter`,
                'os.platform': osType,
                'os.family': osType,
                // Data stream fields
                'data_stream.type': 'logs',
                'data_stream.dataset': 'generic.otel',
                'data_stream.namespace': 'default',
                // Orchestrator fields
                'orchestrator.cluster.name': cluster,
                'orchestrator.cluster.url': `https://${cluster}.k8s.local`,
                'orchestrator.type': 'kubernetes',
                'orchestrator.namespace': namespace,
                // Resource attributes (OpenTelemetry) - extensive list
                'resource.attributes.service.name': service.name,
                'resource.attributes.service.name.text': service.name,
                'resource.attributes.service.version': `${Math.floor(seededRandom() * 10)}.${Math.floor(seededRandom() * 10)}.${Math.floor(seededRandom() * 10)}`,
                'resource.attributes.k8s.container.name': service.container,
                'resource.attributes.k8s.container.restart_count': Math.floor(seededRandom() * 5).toString(),
                'resource.attributes.k8s.namespace.name': namespace,
                'resource.attributes.k8s.pod.name': podName,
                'resource.attributes.k8s.pod.uid': podUid,
                'resource.attributes.k8s.pod.start_time': new Date(Date.now() - Math.floor(seededRandom() * 86400000 * 7)).toISOString(),
                ...(service.name.includes('beat') && { 'resource.attributes.k8s.daemonset.name': service.name }),
                'resource.attributes.host.name': nodeName,
                'resource.attributes.host.ip': hostIps,
                'resource.attributes.host.id': hostId,
                'resource.attributes.host.arch': hostArch,
                'resource.attributes.host.cpu.family': Math.floor(seededRandom() * 50 + 10).toString(),
                'resource.attributes.host.cpu.model.name': cpuModel,
                'resource.attributes.host.cpu.model.id': Math.floor(seededRandom() * 100).toString(),
                'resource.attributes.host.cpu.cache.l2.size': 512 + Math.floor(seededRandom() * 1024),
                'resource.attributes.host.mac': hostMacs,
                'resource.attributes.os.type': osType,
                'resource.attributes.os.description': osType === 'linux' ? `Red Hat Enterprise Linux 9.5 (Plow)` : `Windows Server 2022 Datacenter`,
                'resource.attributes.cloud.provider': cloudProvider,
                'resource.attributes.cloud.platform': cloudPlatform,
                'resource.attributes.cloud.availability_zone': availabilityZone,
                'resource.attributes.cloud.instance.id': instanceId,
                'resource.attributes.cloud.account.id': cloudProvider === 'gcp' ? 'elastic-observability' : `account-${Math.floor(seededRandom() * 999999)}`,
                'resource.schema_url': 'https://opentelemetry.io/schemas/1.6.1',
                // Attributes fields
                'attributes.log.file.path': `/var/log/pods/${namespace}_${podName}_${podUid}/${service.container}/0.log`,
                'attributes.log.file.path.text': `/var/log/pods/${namespace}_${podName}_${podUid}/${service.container}/0.log`,
                'attributes.log.iostream': Math.random() > 0.5 ? 'stderr' : 'stdout',
                'attributes.logtag': 'F',
                logtag: 'F',
                // ECS fields
                'ecs.version': '1.6.0',
                // Agent fields (for beats)
                ...(service.name.includes('beat') && {
                    'agent.id': `agent-${Math.random().toString(36).substring(2, 10)}`,
                    'agent.name': service.name,
                    'agent.type': service.name,
                    'agent.version': '9.2.0',
                    'agent.ephemeral_id': `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 12)}`,
                }),
                // Event fields
                'event.dataset': `${service.name}.logs`,
                'event.module': service.name,
                'event.category': ['process'],
                'event.type': ['info'],
                'event.action': level === 'error' ? 'error' : 'log',
                'event.outcome': level === 'error' ? 'failure' : 'success',
                'event.duration': latency * 1000000, // nanoseconds
                'event.ingested': new Date(Date.now() + Math.floor(seededRandom() * 1000)).toISOString(),
                'event.created': timestamp,
                'event.original': message,
                // Log fields
                'log.level': level,
                'log.logger': `${service.name}.${Math.random().toString(36).substring(2, 8)}`,
                'log.file.path': `/var/log/pods/${namespace}_${podName}_${podUid}/${service.container}/0.log`,
                'log.offset': Math.floor(seededRandom() * 1000000),
                // Error fields (for error logs)
                ...(level === 'error' && {
                    'error.type': 'RuntimeException',
                    'error.message': message,
                    'error.stack_trace': `at com.example.${service.name}.Service.method(Service.java:${Math.floor(seededRandom() * 500) + 100})`,
                    'error.code': `E${Math.floor(seededRandom() * 9999).toString().padStart(4, '0')}`,
                }),
                // HTTP fields (for some services)
                ...(seededRandom() > 0.7 && {
                    'http.request.method': method,
                    'http.request.headers': '{"user-agent": "elastic-agent/9.2.0", "content-type": "application/json"}',
                    'http.response.status_code': statusCode,
                    'http.response.headers': '{"content-type": "application/json", "content-length": "' + Math.floor(seededRandom() * 10000) + '"}',
                    'http.request.body.bytes': Math.floor(seededRandom() * 5000),
                    'http.response.body.bytes': Math.floor(seededRandom() * 10000),
                }),
                // URL fields
                ...(seededRandom() > 0.6 && {
                    'url.scheme': 'https',
                    'url.domain': `${cluster}.${availabilityZone}.gcp.elastic-cloud.com`,
                    'url.port': 443,
                    'url.path': path,
                    'url.query': seededRandom() > 0.5 ? `t=${Date.now()}` : undefined,
                    'url.full': `https://${cluster}.${availabilityZone}.gcp.elastic-cloud.com:443${path}`,
                    'url.original': `https://${cluster}.${availabilityZone}.gcp.elastic-cloud.com:443${path}`,
                }),
                // Tracing fields (sometimes)
                ...(seededRandom() > 0.7 && {
                    'trace.id': Math.floor(seededRandom() * 999999999999999).toString(16),
                    'span.id': Math.floor(seededRandom() * 999999999999999).toString(16),
                    'parent.id': Math.floor(seededRandom() * 999999999999999).toString(16),
                    'transaction.id': Math.floor(seededRandom() * 999999999999999).toString(16),
                    'transaction.name': `${method} ${path}`,
                    'transaction.type': 'request',
                }),
                // Process fields (for some logs)
                ...(seededRandom() > 0.8 && {
                    'process.pid': Math.floor(seededRandom() * 65535) + 1,
                    'process.ppid': Math.floor(seededRandom() * 65535) + 1,
                    'process.name': service.name,
                    'process.args': [`/usr/bin/${service.name}`, '--config', `/etc/${service.name}/${service.name}.yml`],
                    'process.executable': `/usr/bin/${service.name}`,
                    'process.title': service.name,
                    'process.working_directory': `/usr/share/${service.name}`,
                    'process.start': new Date(Date.now() - Math.floor(seededRandom() * 86400000)).toISOString(),
                    'process.thread.id': Math.floor(seededRandom() * 1000) + 1,
                    'process.thread.name': `${service.name}-worker`,
                }),
                // Network fields (sometimes)
                ...(seededRandom() > 0.9 && {
                    'network.protocol': 'tcp',
                    'network.type': 'ipv4',
                    'network.transport': 'tcp',
                    'network.bytes': Math.floor(seededRandom() * 10000),
                    'network.packets': Math.floor(seededRandom() * 100),
                    'source.ip': hostIps[0],
                    'source.port': Math.floor(seededRandom() * 65535) + 1024,
                    'destination.ip': `${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}.${Math.floor(seededRandom() * 255)}`,
                    'destination.port': [80, 443, 8080, 9200, 5601][Math.floor(seededRandom() * 5)],
                }),
                // User fields (sometimes)
                ...(seededRandom() > 0.6 && {
                    'user.id': `user-${Math.floor(seededRandom() * 10000)}`,
                    'user.name': `user${Math.floor(seededRandom() * 1000)}`,
                    'user.email': `user${Math.floor(seededRandom() * 1000)}@example.com`,
                    'user.domain': 'example.com',
                }),
                // Legacy fields for backward compatibility
                host: nodeName,
                service: service.name,
                container_id: `container-${Math.floor(seededRandom() * 10)}`,
                trace_id: `trace-${Math.floor(seededRandom() * 1000)}-${Math.floor(seededRandom() * 1000)}`,
                latency_ms: latency,
                status_code: statusCode,
                user_id: seededRandom() > 0.3 ? `user-${Math.floor(seededRandom() * 100)}` : undefined,
                method,
                path,
                bytes: Math.floor(seededRandom() * 10000),
                memory: Math.floor(seededRandom() * 8192) + 1024,
                "machine.ram": Math.floor(seededRandom() * 16384) + 8192,
                // Add type information for each field
                type: { ...this.fieldTypeMap },
            };
            return logDocument;
        });
        // Cache the generated data
        LogsDataGenerator.cachedData = data;
        return data;
    }
    // Method to get field type information for UI components
    getFieldTypes() {
        return { ...this.fieldTypeMap };
    }
}
exports.LogsDataGenerator = LogsDataGenerator;
//# sourceMappingURL=logsDataGenerator.js.map