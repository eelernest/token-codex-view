const Database = require('better-sqlite3');
const { homedir } = require('os');
const { join } = require('path');

const dir = join(homedir(), '.local', 'share', 'opencode');
const dbPath = join(dir, 'opencode.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

// Explore part table for tool data
console.log('=== Part types ===');
const partTypes = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.type') as ptype, COUNT(*) as cnt
  FROM part GROUP BY ptype ORDER BY cnt DESC
`).all();
partTypes.forEach(p => console.log('  ' + p.ptype + ': ' + p.cnt));

// Parts where tool is not null
console.log('\n=== Parts with tool data ===');
const toolParts = db.prepare("SELECT COUNT(*) as cnt FROM part WHERE json_extract(data, '$.tool') IS NOT NULL").get();
console.log('  Total: ' + toolParts.cnt);

// Unique tools
console.log('\n=== Unique tools ===');
const tools = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.tool') as tool_name FROM part WHERE json_extract(data, '$.tool') IS NOT NULL
`).all();
tools.forEach(t => console.log('  ' + t.tool_name));

// Most used tools
console.log('\n=== Most used tools ===');
const toolCount = db.prepare(`
  SELECT json_extract(data, '$.tool') as tool_name, COUNT(*) as cnt
  FROM part WHERE json_extract(data, '$.tool') IS NOT NULL
  GROUP BY tool_name ORDER BY cnt DESC
`).all();
toolCount.forEach(t => console.log('  ' + t.tool_name + ': ' + t.cnt));

// Check tools in message data
console.log('\n=== Tools from message data ===');
const msgWithTools = db.prepare("SELECT COUNT(*) as cnt FROM message WHERE json_extract(data, '$.tools') IS NOT NULL").get();
console.log('  Messages with tools: ' + msgWithTools.cnt);

const toolArray = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.tools') as tools_arr FROM message WHERE json_extract(data, '$.tools') IS NOT NULL LIMIT 10
`).all();
toolArray.forEach(t => console.log('  ' + t.tools_arr));

// Check event data for tool/skill/mcp
console.log('\n=== Event data with tool/skill/mcp (samples) ===');
const toolEvents = db.prepare("SELECT type, SUBSTR(data, 1, 300) as d FROM event WHERE data LIKE '%tool%' OR data LIKE '%mcp%' OR data LIKE '%skill%' LIMIT 10").all();
toolEvents.forEach(e => console.log('  ' + e.type + ': ' + e.d));

// Distinct MCP/skill from events
console.log('\n=== Event types with tool/mcp ===');
const mcpEvents = db.prepare("SELECT type, COUNT(*) as cnt FROM event WHERE data LIKE '%mcp%' GROUP BY type").all();
mcpEvents.forEach(e => console.log('  ' + e.type + ': ' + e.cnt));

const skillEvents = db.prepare("SELECT type, COUNT(*) as cnt FROM event WHERE data LIKE '%skill%' GROUP BY type").all();
skillEvents.forEach(e => console.log('  ' + e.type + ': ' + e.cnt));

db.close();
