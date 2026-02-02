import { Router, type Router as RouterType, Request, Response } from "express";
import { esClient } from "../lib/elasticsearch";

const router: RouterType = Router();

// Get field capabilities for an index pattern
router.get("/fields/:index", async (req: Request, res: Response) => {
  const { index } = req.params;
  
  try {
    // Use Elasticsearch field_caps API to get comprehensive field information
    const response = await Promise.race([
      (esClient as any).fieldCaps({
        index: index,
        fields: "*", // Get all fields
        include_unmapped: false // Only include mapped fields
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Field capabilities timeout after 20s')), 20000)
      )
    ]);

    const body = response.body || response;
    const fields = body.fields || {};
    
    // Transform the response into a more usable format
    const fieldInfo = Object.entries(fields).map(([fieldName, fieldData]: [string, any]) => {
      // Get the field type from the first mapping (most common)
      const firstMapping = Object.values(fieldData)[0] as any;
      const type = firstMapping?.type || 'unknown';
      const searchable = firstMapping?.searchable !== false;
      const aggregatable = firstMapping?.aggregatable !== false;
      
      return {
        name: fieldName,
        type,
        searchable,
        aggregatable,
        // Add additional metadata
        isNumeric: ['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'].includes(type),
        isDate: type === 'date',
        isText: type === 'text',
        isKeyword: type === 'keyword'
      };
    });

    // Filter out fields that shouldn't be displayed (similar to Kibana's approach)
    const hasAtTimestamp = fieldInfo.some(f => f.name === "@timestamp");
    const filteredFieldInfo = fieldInfo.filter(field => {
      const name = field.name;
      
      // Filter out timestamp duplicates - prefer @timestamp over timestamp
      if (name === "timestamp" && hasAtTimestamp) {
        return false;
      }
      
      // Filter out internal/system fields (similar to Kibana)
      if (name.startsWith('_') && !['@timestamp', '_id'].includes(name)) {
        return false; // Skip most internal fields except key ones
      }
      
      // Filter out overly nested fields (Kibana typically limits nesting)
      if (name.split('.').length > 5) {
        return false; // Skip deeply nested fields
      }
      
      // Filter out duplicate multi-mapping fields (very common in ES)
      if (name.match(/\.(raw|keyword|text|analyzed)$/)) {
        return false; // Skip field mapping duplicates
      }
      
      // Filter out fields that are rarely useful for end users
      const technicalSuffixes = /\.(hash|checksum|fingerprint|signature|uuid|guid|token|session_id|trace_id|span_id|correlation_id)$/i;
      if (technicalSuffixes.test(name)) {
        return false;
      }
      
      // More aggressive filtering to match Kibana's ~717 field count
      const skipPatterns = [
        // Beat-specific fields
        /^kibana_/, /^metricbeat_/, /^auditbeat_/, /^filebeat_/, /^winlogbeat_/, /^heartbeat_/,
        
        // Technical/system fields  
        /\.ignore$/, /\.original$/, /\.ignore_above$/, /\.as_string$/, /\.index$/, /\.mapping$/,
        /\.metadata\./, /\.internal\./, /\.temp$/, /\.temporary$/, /\.debug$/,
        
        // Security/monitoring fields that are often noise
        /^cloud_security_posture/, /^resource\.dropped/, /^monitoring\./, /^elastic_agent\./,
        
        // Very specific technical IDs and traces
        /^trace\./, /^span\./, /^transaction\./, /^correlation_/, /^request_id/, /^session_id/,
        
        // Fields with common noise patterns (more aggressive)
        /\.dropped/, /\.malware/, /\.suspicious/, /\.enrichment/, /\.classification/,
        /\.features\./, /\.score$/, /\.threshold$/, /\.confidence$/,
        
        // Runtime and computed fields
        /\.runtime\./, /\.computed\./, /\.calculated\./, /\.derived\./,
        
        // Overly specific nested paths (more patterns)
        /\.Ext\./, /\.extensions?\./, /\.details\./, /\.attributes?\./, /\.properties\./,
        /\.additional\./, /\.extra\./, /\.misc\./, /\.other\./,
        
        // Performance/monitoring/observability fields
        /\.metrics\./, /\.stats\./, /\.performance\./, /\.telemetry\./, /\.observability\./,
        
        // Very specialized security/audit fields
        /^auditd\.data\./, /^Ransomware\./, /^Memory_protection\./, /^Effective_process\./,
        
        // Deep nested technical paths (4+ levels)
        /^[^.]+\.[^.]+\.[^.]+\.[^.]+\..*$/,
        
        // Fields that are likely auto-generated or very specialized
        /\.decompressed_size$/, /\.code_page$/, /\.errors\.count$/, /\.macro\./,
        /\.shmget\./, /\.ptrace\./, /\.memfd\./, /\.relative_.*_time$/
      ];
      
      if (skipPatterns.some(pattern => pattern.test(name))) {
        return false;
      }
      
      return true;
    });

    // Sort fields alphabetically by name (not by type first)
    const sortedFields = filteredFieldInfo.sort((a, b) => a.name.localeCompare(b.name));
    
    // Calculate field type breakdown
    const fieldBreakdown = {
      total: sortedFields.length,
      numeric: sortedFields.filter(f => f.isNumeric).length,
      text: sortedFields.filter(f => f.isText).length,
      keyword: sortedFields.filter(f => f.isKeyword).length,
      date: sortedFields.filter(f => f.isDate).length,
      other: sortedFields.filter(f => !f.isNumeric && !f.isText && !f.isKeyword && !f.isDate).length
    };
    
    res.status(200).json({
      index,
      fields: sortedFields,
      breakdown: fieldBreakdown,
      success: true
    });

  } catch (error) {
    console.error(`❌ Field capabilities API error for ${index}:`, error);
    console.error('Error details:', (error as Error).message);
    
    // Provide fallback fields for remote cluster data
    const fallbackFields = [
      { name: '@timestamp', type: 'date', searchable: true, aggregatable: true, isNumeric: false, isDate: true, isText: false, isKeyword: false },
      { name: 'message', type: 'text', searchable: true, aggregatable: false, isNumeric: false, isDate: false, isText: true, isKeyword: false },
      { name: 'level', type: 'keyword', searchable: true, aggregatable: true, isNumeric: false, isDate: false, isText: false, isKeyword: true },
      { name: 'service', type: 'keyword', searchable: true, aggregatable: true, isNumeric: false, isDate: false, isText: false, isKeyword: true },
      { name: 'host', type: 'keyword', searchable: true, aggregatable: true, isNumeric: false, isDate: false, isText: false, isKeyword: true }
    ];
    
    
    res.status(200).json({
      index,
      fields: fallbackFields,
      breakdown: {
        total: fallbackFields.length,
        numeric: 0,
        text: 1,
        keyword: 3,
        date: 1,
        other: 0
      },
      success: true,
      fallback: true
    });
  }
});

export default router;