const Database = require('better-sqlite3');
const { homedir, platform } = require('os');
const { join } = require('path');

const dir = join(homedir(), '.local', 'share', 'opencode');
const dbPath = join(dir, 'opencode.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

console.log('=== TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(t.name));

tables.forEach(t => {
  console.log('\n=== ' + t.name + ' ===');
  const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
  cols.forEach(c => console.log('  ' + c.name + ' (' + c.type + ')'));
  const count = db.prepare('SELECT COUNT(*) as cnt FROM ' + t.name).get();
  console.log('  rows: ' + count.cnt);
});

// Sample data from message table
console.log('\n=== Message sample (1 row) ===');
const sample = db.prepare("SELECT data FROM message LIMIT 1").get();
if (sample) {
  const parsed = JSON.parse(sample.data);
  console.log(JSON.stringify(parsed, null, 2));
}

// Check session table
console.log('\n=== Session sample (1 row) ===');
const sessionSample = db.prepare("SELECT * FROM session LIMIT 1").get();
console.log(JSON.stringify(sessionSample, null, 2));

// Check tool/agent usage
console.log('\n=== Checking data fields ===');
const allData = db.prepare("SELECT data FROM message WHERE data LIKE '%tool%' OR data LIKE '%agent%' OR data LIKE '%skill%' OR data LIKE '%mcp%' LIMIT 5").all();
if (allData.length > 0) {
  allData.forEach((r, i) => {
    const d = JSON.parse(r.data);
    console.log('Row ' + i + ': ' + Object.keys(d).join(', '));
  });
} else {
  console.log('No data with tool/agent/skill/mcp found');
}

db.close();
