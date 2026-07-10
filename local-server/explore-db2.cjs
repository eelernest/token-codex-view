const Database = require('better-sqlite3');
const { homedir } = require('os');
const { join } = require('path');

const dir = join(homedir(), '.local', 'share', 'opencode');
const dbPath = join(dir, 'opencode.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

console.log('=== Agents in session ===');
const agents = db.prepare("SELECT agent, COUNT(*) as cnt FROM session WHERE agent IS NOT NULL GROUP BY agent ORDER BY cnt DESC").all();
agents.forEach(a => console.log('  ' + a.agent + ': ' + a.cnt));

console.log('\n=== Models in session ===');
const models = db.prepare("SELECT model, COUNT(*) as cnt FROM session WHERE model IS NOT NULL GROUP BY model ORDER BY cnt DESC").all();
models.forEach(m => console.log('  ' + m.model + ': ' + m.cnt));

console.log('\n=== Unique modelIDs from message data ===');
const msgModels = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.model.modelID') as model_id
  FROM message
  WHERE json_extract(data, '$.model.modelID') IS NOT NULL
`).all();
msgModels.forEach(m => console.log('  ' + m.model_id));

console.log('\n=== Unique agents from message data ===');
const msgAgents = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.agent') as agent
  FROM message
  WHERE json_extract(data, '$.agent') IS NOT NULL
`).all();
msgAgents.forEach(a => console.log('  ' + a.agent));

console.log('\n=== Session modes from message data ===');
const modes = db.prepare(`
  SELECT DISTINCT json_extract(data, '$.mode') as mode
  FROM message
  WHERE json_extract(data, '$.mode') IS NOT NULL
`).all();
modes.forEach(m => console.log('  ' + m.mode));

console.log('\n=== Event types ===');
const eventTypes = db.prepare("SELECT type, COUNT(*) as cnt FROM event GROUP BY type ORDER BY cnt DESC").all();
eventTypes.forEach(e => console.log('  ' + e.type + ': ' + e.cnt));

console.log('\n=== Skill-related events ===');
const skillEvents = db.prepare("SELECT type, data FROM event WHERE type LIKE '%skill%' OR type LIKE '%tool%' OR type LIKE '%mcp%' LIMIT 10").all();
skillEvents.forEach(e => console.log('  ' + e.type + ': ' + e.data));

console.log('\n=== Skills from metadata ===');
const metaSkills = db.prepare(`
  SELECT DISTINCT json_extract(metadata, '$') as meta FROM session WHERE metadata IS NOT NULL LIMIT 5
`).all();
metaSkills.forEach(m => {
  try {
    const parsed = JSON.parse(m.meta);
    console.log('  Keys: ' + Object.keys(parsed).join(', '));
  } catch { console.log('  raw: ' + m.meta); }
});

console.log('\n=== Todo statuses ===');
const todoStatuses = db.prepare("SELECT status, COUNT(*) as cnt FROM todo GROUP BY status").all();
todoStatuses.forEach(t => console.log('  ' + t.status + ': ' + t.cnt));

console.log('\n=== Most used agents (session table) ===');
const topAgents = db.prepare("SELECT agent, COUNT(*) as cnt FROM session GROUP BY agent ORDER BY cnt DESC").all();
topAgents.forEach(a => console.log('  ' + a.agent + ': ' + a.cnt));

console.log('\n=== Total sessions ===');
const totalSessions = db.prepare("SELECT COUNT(*) as cnt FROM session").get();
console.log('  ' + totalSessions.cnt);

console.log('\n=== Skills/config usage from event ===');
const toolEvents = db.prepare("SELECT data FROM event WHERE type = 'tool_used' OR type LIKE '%tool%' LIMIT 5").all();
toolEvents.forEach(e => console.log('  ' + e.data));

db.close();
