const Database = require('better-sqlite3');
const { homedir } = require('os');
const { join } = require('path');

const dir = join(homedir(), '.local', 'share', 'opencode');
const dbPath = join(dir, 'opencode.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

// Check session metadata and model info
console.log('=== Session model data (parsed) ===');
const sessions = db.prepare("SELECT agent, model, tokens_input, tokens_output, tokens_reasoning, cost FROM session ORDER BY time_created DESC LIMIT 10").all();
sessions.forEach(s => {
  let modelStr = s.model;
  try { const m = JSON.parse(modelStr); modelStr = m.id + ' (' + (m.variant||'default') + ')'; } catch {}
  console.log('  agent=' + s.agent + ' model=' + modelStr + ' in=' + s.tokens_input + ' out=' + s.tokens_output + ' reason=' + s.tokens_reasoning);
});

// Count sessions by model
console.log('\n=== Model counts (from session table) ===');
const modelCnt = db.prepare(`
  SELECT json_extract(model, '$.id') as mid, json_extract(model, '$.variant') as variant, COUNT(*) as cnt
  FROM session WHERE model IS NOT NULL
  GROUP BY mid, variant ORDER BY cnt DESC
`).all();
modelCnt.forEach(m => console.log('  ' + m.mid + ' (' + m.variant + '): ' + m.cnt));

// Count quick vs reasoning: "explore" agent = quick mode, others = reasoning
console.log('\n=== Quick vs Reasoning (by agent) ===');
const quick = db.prepare("SELECT COUNT(*) as cnt FROM session WHERE agent = 'explore'").get();
const reasoning = db.prepare("SELECT COUNT(*) as cnt FROM session WHERE agent IS NOT NULL AND agent != 'explore'").get();
console.log('  Quick (explore): ' + quick.cnt);
console.log('  Reasoning: ' + reasoning.cnt);

// Distinct project directories
console.log('\n=== Projects ===');
const projects = db.prepare("SELECT name, worktree FROM project").all();
projects.forEach(p => console.log('  name=' + p.name + ' worktree=' + (p.worktree || 'N/A')));

// Check part table for tool/skill data
console.log('\n=== Part data sample (tool/skill/mcp) ===');
const parts = db.prepare(`
  SELECT data FROM part
  WHERE data LIKE '%tool%' OR data LIKE '%skill%' OR data LIKE '%mcp%'
  LIMIT 5
`).all();
if (parts.length === 0) {
  console.log('  No tool/skill/mcp data found in parts');
  // Check any part data structure
  const sample = db.prepare("SELECT data FROM part LIMIT 1").get();
  if (sample) {
    const d = JSON.parse(sample.data);
    console.log('  Part keys: ' + Object.keys(d).join(', '));
  }
}

// Look for tool usage in message data
console.log('\n=== Messages with tool calls ===');
const toolMsgs = db.prepare(`
  SELECT data FROM message WHERE data LIKE '%"type":"tool"%' OR data LIKE '%tool_use%' LIMIT 5
`).all();
console.log('  Found: ' + toolMsgs.length);

// Most used models from message data
console.log('\n=== Most used models (from message data) ===');
const modelUsage = db.prepare(`
  SELECT json_extract(data, '$.model.modelID') as mid, COUNT(*) as cnt
  FROM message
  WHERE json_extract(data, '$.model.modelID') IS NOT NULL
  AND json_extract(data, '$.role') = 'assistant'
  GROUP BY mid ORDER BY cnt DESC
`).all();
modelUsage.forEach(m => console.log('  ' + m.mid + ': ' + m.cnt));

db.close();
