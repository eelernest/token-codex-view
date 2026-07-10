const Database = require('better-sqlite3');
const { homedir } = require('os');
const { join } = require('path');
const dir = join(homedir(), '.local', 'share', 'opencode');
const db = new Database(join(dir, 'opencode.db'), { readonly: true });

console.log('=== Explore sessions ===');
const explores = db.prepare("SELECT agent, directory, parent_id FROM session WHERE agent = 'explore' LIMIT 10").all();
explores.forEach(e => console.log('  agent=' + e.agent + ' dir=' + e.directory + ' parent=' + e.parent_id));

console.log('\n=== All agents and their count ===');
const agents = db.prepare("SELECT agent, COUNT(*) as cnt FROM session GROUP BY agent").all();
agents.forEach(a => console.log('  ' + a.agent + ': ' + a.cnt));

console.log('\n=== Agents filtered by non-.opencode ===');
const filtered = db.prepare("SELECT agent, COUNT(*) as cnt FROM session WHERE directory NOT LIKE '%.opencode%' GROUP BY agent").all();
filtered.forEach(a => console.log('  ' + a.agent + ': ' + a.cnt));

console.log('\n=== Session directories sample ===');
const dirs = db.prepare("SELECT DISTINCT directory FROM session WHERE directory IS NOT NULL LIMIT 20").all();
dirs.forEach(d => console.log('  ' + d.directory));

db.close();
