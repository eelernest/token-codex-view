const Database = require('better-sqlite3');
const { homedir } = require('os');
const { join } = require('path');

const dir = join(homedir(), '.local', 'share', 'opencode');
const dbPath = join(dir, 'opencode.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

// Check event data for any tool/plugin/extension info
console.log('=== Event data samples ===');
const events = db.prepare("SELECT type, SUBSTR(data, 1, 200) as data_preview FROM event WHERE type NOT LIKE 'message.%' AND type NOT LIKE 'session.%' LIMIT 20").all();
events.forEach(e => console.log('  ' + e.type + ': ' + e.data_preview));

// Check if part table has skill/mcp info buried in JSON
console.log('\n=== Part table - all distinct keys in data JSON ===');
const partSample = db.prepare("SELECT data FROM part LIMIT 100").all();
const allKeys = new Set();
partSample.forEach(p => {
  try { Object.keys(JSON.parse(p.data)).forEach(k => allKeys.add(k)); } catch {}
});
console.log('  Keys found: ' + Array.from(allKeys).join(', '));

// Count parts 
console.log('\n=== Part count ===');
const partCnt = db.prepare("SELECT COUNT(*) as cnt FROM part").get();
console.log('  Total parts: ' + partCnt.cnt);

// Check message data for tool_use or tool results
console.log('\n=== Message data - all distinct top-level keys ===');
const msgSample = db.prepare("SELECT data FROM message LIMIT 200").all();
const msgKeys = new Set();
msgSample.forEach(p => {
  try { Object.keys(JSON.parse(p.data)).forEach(k => msgKeys.add(k)); } catch {}
});
console.log('  Keys found: ' + Array.from(msgKeys).join(', '));

// Check role types
console.log('\n=== Roles in message ===');
const roles = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.role') as role FROM message
`).all();
roles.forEach(r => console.log('  ' + r.role));

// Total assistant messages
const assistantCnt = db.prepare("SELECT COUNT(*) as cnt FROM message WHERE data LIKE '%\"role\":\"assistant\"%'").get();
console.log('\nTotal assistant messages: ' + assistantCnt.cnt);

// Check for tool-related data in any column
console.log('\n=== Any column with tool/mcp/skill ===');
const toolInSession = db.prepare("SELECT COUNT(*) as cnt FROM session WHERE metadata LIKE '%tool%' OR metadata LIKE '%mcp%' OR metadata LIKE '%skill%'").get();
console.log('  session metadata: ' + toolInSession.cnt);
const toolInEvent = db.prepare("SELECT COUNT(*) as cnt FROM event WHERE data LIKE '%tool%' OR data LIKE '%mcp%' OR data LIKE '%skill%'").get();
console.log('  event data: ' + toolInEvent.cnt);

db.close();
