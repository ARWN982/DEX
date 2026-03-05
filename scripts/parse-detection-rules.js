const fs = require('fs');
const path = require('path');
const toml = require('toml');

const rulesDir = path.join(__dirname, '../data/detection-rules/rules');
const outputFile = path.join(__dirname, '../src/public/data/parsedDetectionRules.json');

function getAllTomlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTomlFiles(filePath, fileList);
    } else if (file.endsWith('.toml')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractPlatform(tags) {
  const platformTags = tags
    .filter(tag => tag.startsWith('OS: '))
    .map(tag => tag.replace('OS: ', ''));
  return platformTags.length > 0 ? platformTags.join(', ') : 'Cross-platform';
}

function extractMitreTactics(threats) {
  if (!threats || threats.length === 0) return [];
  return threats
    .filter(t => t.tactic && t.tactic.name)
    .map(t => t.tactic.name);
}

function extractMitreTechniques(threats) {
  if (!threats || threats.length === 0) return [];
  const techniques = [];
  threats.forEach(threat => {
    if (threat.technique && Array.isArray(threat.technique)) {
      threat.technique.forEach(tech => {
        if (tech.id && tech.name) {
          techniques.push({ id: tech.id, name: tech.name });
        }
      });
    }
  });
  return techniques;
}

function parseRule(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = toml.parse(content);
    
    if (!parsed.rule) return null;
    
    const rule = parsed.rule;
    const tags = rule.tags || [];
    const threats = rule.threat || [];
    
    return {
      id: rule.rule_id || path.basename(filePath, '.toml'),
      name: rule.name || 'Unnamed Rule',
      severity: rule.severity || 'low',
      description: rule.description ? rule.description.trim() : 'No description available',
      riskScore: rule.risk_score || 0,
      platform: extractPlatform(tags),
      ruleType: rule.type || 'query',
      tags: tags.filter(tag => !tag.startsWith('OS: ')).slice(0, 5), // Limit to 5 tags
      mitreTactics: extractMitreTactics(threats),
      mitreTechniques: extractMitreTechniques(threats),
      enabled: true,
      lastRun: '29 minutes ago',
      lastResponse: Math.random() > 0.3 ? 'Succeeded' : 'Failed',
      lastUpdated: parsed.metadata?.updated_date || parsed.metadata?.creation_date || 'Unknown',
      notify: Math.random() > 0.5,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

console.log('Parsing detection rules...');

const tomlFiles = getAllTomlFiles(rulesDir);
console.log(`Found ${tomlFiles.length} TOML files`);

const parsedRules = tomlFiles
  .map(parseRule)
  .filter(rule => rule !== null)
  .slice(0, 200); // Limit to 200 rules for performance

console.log(`Successfully parsed ${parsedRules.length} rules`);

// Ensure the data directory exists
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(parsedRules, null, 2));

console.log(`✅ Parsed rules saved to ${outputFile}`);
console.log(`Total rules: ${parsedRules.length}`);
