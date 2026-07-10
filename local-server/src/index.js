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
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(...childSessions);

    const dayMap = new Map();
    let totalTokens = 0;
    let activeDays = 0;

    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = new Date(ts).toISOString().split('T')[0];
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
      const date = new Date(ts).toISOString().split('T')[0];
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

app.get('/api/usage/monthly', (_req, res) => {
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

    const monthMap = new Map();

    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const monthKey = new Date(ts).toISOString().slice(0, 7);
      const entry = monthMap.get(monthKey) || 0;
      monthMap.set(monthKey, entry + tokens.total);
    }

    const data = [];
    let cumulative = 0;
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [month, tokens] of sortedMonths) {
      cumulative += tokens;
      data.push({ month, tokens, cumulative });
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/activity-metrics', (_req, res) => {
  try {
    const db = getDb();

    // Total sessions
    const totalSessions = db.prepare(`
      SELECT COUNT(*) as cnt FROM session s
      WHERE s.directory NOT LIKE '%.opencode%'
    `).get().cnt;

    // Agents
    const agents = db.prepare(`
      SELECT agent, COUNT(*) as cnt FROM session s
      WHERE s.directory NOT LIKE '%.opencode%'
      AND agent IS NOT NULL
      GROUP BY agent ORDER BY cnt DESC
    `).all();

    // Models from session table
    const models = db.prepare(`
      SELECT json_extract(model, '$.id') as mid, COUNT(*) as cnt FROM session s
      WHERE s.directory NOT LIKE '%.opencode%'
      AND model IS NOT NULL
      GROUP BY mid ORDER BY cnt DESC
    `).all();

    // Quick mode (explore agent)
    const quickSessions = db.prepare(`
      SELECT COUNT(*) as cnt FROM session s
      WHERE s.agent = 'explore'
      AND s.directory NOT LIKE '%.opencode%'
    `).get().cnt;

    // Tool usage from part table
    const tools = db.prepare(`
      SELECT json_extract(data, '$.tool') as tool_name, COUNT(*) as cnt
      FROM part p
      JOIN session s ON p.session_id = s.id
      WHERE json_extract(data, '$.tool') IS NOT NULL
      AND s.directory NOT LIKE '%.opencode%'
      GROUP BY tool_name ORDER BY cnt DESC
    `).all();

    // MCP tools (tools containing 'mcp')
    const mcpTools = db.prepare(`
      SELECT json_extract(data, '$.tool') as tool_name, COUNT(*) as cnt
      FROM part p
      JOIN session s ON p.session_id = s.id
      WHERE json_extract(data, '$.tool') LIKE '%mcp%'
      AND s.directory NOT LIKE '%.opencode%'
      GROUP BY tool_name ORDER BY cnt DESC
    `).all();

    // Skill calls with names
    const skillCallsData = db.prepare(`
      SELECT data FROM part p
      JOIN session s ON p.session_id = s.id
      WHERE json_extract(data, '$.tool') = 'skill'
      AND json_extract(data, '$.state.status') = 'completed'
      AND s.directory NOT LIKE '%.opencode%'
    `).all();

    const skillCalls = skillCallsData.length;
    const skillCounts = new Map();
    for (const row of skillCallsData) {
      const d = JSON.parse(row.data);
      const name = d.state?.input?.name || d.state?.metadata?.name || 'unknown';
      skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
    }
    const skillNames = Array.from(skillCounts.entries()).map(([name, count]) => ({ name, count }));

    // Distinct tools count
    const distinctTools = db.prepare(`
      SELECT COUNT(DISTINCT json_extract(data, '$.tool')) as cnt
      FROM part p
      JOIN session s ON p.session_id = s.id
      WHERE json_extract(data, '$.tool') IS NOT NULL
      AND s.directory NOT LIKE '%.opencode%'
    `).get().cnt;

    // Total tool calls
    const totalToolCalls = db.prepare(`
      SELECT COUNT(*) as cnt
      FROM part p
      JOIN session s ON p.session_id = s.id
      WHERE json_extract(data, '$.tool') IS NOT NULL
      AND s.directory NOT LIKE '%.opencode%'
    `).get().cnt;

    // Reasoning model: pick model with most sessions that is NOT flash/fast
    // We'll identify reasoning models as non-flash models (big-pickle etc.)
    const reasoningModel = models.find(m => !m.mid.includes('flash')) || null;

    // Group MCP tools by base name
    const mcpGrouped = {};
    for (const t of mcpTools) {
      const match = t.tool_name.match(/^(.*-mcp)_(.*)$/);
      const base = match ? match[1] : t.tool_name;
      const op = match ? match[2] : 'unknown';
      if (!mcpGrouped[base]) mcpGrouped[base] = { name: base, calls: 0, operations: [] };
      mcpGrouped[base].calls += t.cnt;
      mcpGrouped[base].operations.push({ name: op, calls: t.cnt });
    }

    res.json({
      quickModeSessions: quickSessions,
      reasoningModel: reasoningModel ? { name: reasoningModel.mid, sessions: reasoningModel.cnt } : null,
      distinctSkills: distinctTools,
      totalToolCalls,
      totalSessions,
      tools: tools.slice(0, 10),
      mcpTools: Object.values(mcpGrouped),
      skillCalls,
      skillNames,
      agents,
    });
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
      AND s.directory NOT LIKE '%.opencode%'
      ${placeholders}
      ORDER BY m.time_created ASC
    `).all(...childSessions);

    const dayMap = new Map();
    for (const row of rows) {
      const data = JSON.parse(row.data);
      const tokens = extractTokens(data);
      if (!tokens) continue;
      const ts = data.time?.completed || data.time?.created;
      if (!ts) continue;
      const date = new Date(ts).toISOString().split('T')[0];
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
