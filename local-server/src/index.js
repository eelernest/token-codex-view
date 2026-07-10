import express from 'express';
import cors from 'cors';
import { getDb, closeDb, dbPath } from './db.js';
import { checkHealth } from './health.js';

const app = express();
const PORT = 8765;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());

function extractTokens(data) {
  if (!data || !data.tokens) return null;
  const t = data.tokens;
  const input = t.input || 0;
  const output = t.output || 0;
  const reasoning = t.reasoning || 0;
  const cacheRead = t.cache?.read || 0;
  const cacheWrite = t.cache?.write || 0;
  const total = (t.total || 0) || (input + output + reasoning + cacheRead + cacheWrite);
  return { total, input, output, reasoning, cacheRead, cacheWrite, active: input + output + reasoning };
}

app.get('/api/health', (_req, res) => {
  res.json(checkHealth());
});

app.get('/api/usage/daily', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const db = getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const childSessions = db.prepare("SELECT id FROM session WHERE parent_id IS NOT NULL").all().map(r => r.id);
    const placeholders = childSessions.length ? `AND m.session_id NOT IN (${childSessions.map(() => '?').join(',')})` : '';

    const rows = db.prepare(`
      SELECT m.data FROM message m
      JOIN session s ON m.session_id = s.id
      WHERE m.data LIKE '%"role":"assistant"%'
      AND json_extract(m.data, '$.time.completed') >= ?
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(cutoffStr, ...childSessions);

    const dayMap = new Map();
    let totalTokens = 0;
    let activeDays = 0;

    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = ts.split('T')[0];
      if (date < cutoffStr) continue;
      const entry = dayMap.get(date) || { total: 0, input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 };
      entry.total += tokens.total;
      entry.input += tokens.input;
      entry.output += tokens.output;
      entry.reasoning += tokens.reasoning;
      entry.cacheRead += tokens.cacheRead;
      entry.cacheWrite += tokens.cacheWrite;
      dayMap.set(date, entry);
    }

    const data = [];
    const current = new Date(cutoffStr);
    const end = new Date();
    const values = Array.from(dayMap.entries());
    const max = values.length ? Math.max(...values.map(([, v]) => v.total)) : 1;

    while (current <= end) {
      const date = current.toISOString().split('T')[0];
      const day = dayMap.get(date) || { total: 0 };
      const level = day.total > 0 ? Math.min(4, Math.floor((day.total / max) * 5)) : 0;
      data.push({ date, tokens: day.total, level });
      if (day.total > 0) activeDays++;
      totalTokens += day.total;
      current.setDate(current.getDate() + 1);
    }

    res.json({ data, total: totalTokens, activeDays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/stats', (_req, res) => {
  try {
    const db = getDb();
    const childSessions = db.prepare("SELECT id FROM session WHERE parent_id IS NOT NULL").all().map(r => r.id);
    const placeholders = childSessions.length ? `AND m.session_id NOT IN (${childSessions.map(() => '?').join(',')})` : '';

    const rows = db.prepare(`
      SELECT m.data FROM message m
      JOIN session s ON m.session_id = s.id
      WHERE m.data LIKE '%"role":"assistant"%'
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(...childSessions);

    let totalTokens = 0;
    let activeDaysSet = new Set();
    const modelTotals = new Map();
    const model30d = new Map();
    const dayTokens = new Map();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = ts.split('T')[0];
      const model = data.modelID || 'unknown';

      totalTokens += tokens.total;
      activeDaysSet.add(date);

      const mTotal = modelTotals.get(model) || 0;
      modelTotals.set(model, mTotal + tokens.total);

      if (date >= thirtyDaysAgoStr) {
        const m30 = model30d.get(model) || 0;
        model30d.set(model, m30 + tokens.total);
      }

      const dTot = dayTokens.get(date) || 0;
      dayTokens.set(date, dTot + tokens.total);
    }

    const sortedDays = Array.from(dayTokens.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      if (sortedDays[i][1] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - (sortedDays.length - 1 - i));
        if (sortedDays[i][0] === expectedDate.toISOString().split('T')[0]) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    const mostUsedModel = Array.from(modelTotals.entries())
      .sort((a, b) => b[1] - a[1])[0] || { name: 'unknown', tokens: 0 };
    const mostUsedModel30d = Array.from(model30d.entries())
      .sort((a, b) => b[1] - a[1])[0] || { name: 'unknown', tokens: 0 };

    res.json({
      totalTokens,
      activeDays: activeDaysSet.size,
      currentStreak,
      longestStreak,
      mostUsedModel: { name: mostUsedModel[0], tokens: mostUsedModel[1] },
      mostUsedModel30d: { name: mostUsedModel30d[0], tokens: mostUsedModel30d[1] },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/weekly', (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks) || 12;
    const db = getDb();
    const childSessions = db.prepare("SELECT id FROM session WHERE parent_id IS NOT NULL").all().map(r => r.id);
    const placeholders = childSessions.length ? `AND m.session_id NOT IN (${childSessions.map(() => '?').join(',')})` : '';

    const rows = db.prepare(`
      SELECT m.data FROM message m
      JOIN session s ON m.session_id = s.id
      WHERE m.data LIKE '%"role":"assistant"%'
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(...childSessions);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (weeks * 7));
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const weekMap = new Map();

    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = new Date(ts);
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      const weekStart = monday.toISOString().split('T')[0];
      if (weekStart < cutoffStr) continue;
      const entry = weekMap.get(weekStart) || 0;
      weekMap.set(weekStart, entry + tokens.total);
    }

    const data = [];
    let prevTotal = null;
    const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [weekStart, tokens] of sortedWeeks) {
      const delta = prevTotal !== null ? ((tokens - prevTotal) / prevTotal) * 100 : 0;
      data.push({ weekStart, tokens, delta: Math.round(delta * 10) / 10 });
      prevTotal = tokens;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/cumulative', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const db = getDb();
    const childSessions = db.prepare("SELECT id FROM session WHERE parent_id IS NOT NULL").all().map(r => r.id);
    const placeholders = childSessions.length ? `AND m.session_id NOT IN (${childSessions.map(() => '?').join(',')})` : '';
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const rows = db.prepare(`
      SELECT m.data FROM message m
      JOIN session s ON m.session_id = s.id
      WHERE m.data LIKE '%"role":"assistant"%'
      AND json_extract(m.data, '$.time.completed') >= ?
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(cutoffStr, ...childSessions);

    const dayMap = new Map();
    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = ts.split('T')[0];
      if (date < cutoffStr) continue;
      dayMap.set(date, (dayMap.get(date) || 0) + tokens.total);
    }

    const data = [];
    let cumulative = 0;
    const current = new Date(cutoffStr);
    const end = new Date();
    while (current <= end) {
      const date = current.toISOString().split('T')[0];
      const tokens = dayMap.get(date) || 0;
      cumulative += tokens;
      data.push({ date, tokens, cumulative });
      current.setDate(current.getDate() + 1);
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[token-codex] Local server running on http://${HOST}:${PORT}`);
  console.log(`[token-codex] DB: ${dbPath()}`);
});

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });
