import Database from 'better-sqlite3';
import { homedir, platform } from 'os';
import { join } from 'path';

function opencodeDataDir() {
  const home = homedir();
  if (platform() === 'win32') {
    return join(home, '.local', 'share', 'opencode');
  }
  const xdg = process.env.XDG_DATA_HOME;
  if (xdg) return join(xdg, 'opencode');
  return join(home, '.local', 'share', 'opencode');
}

let db = null;

export function getDb() {
  if (db) return db;
  const dir = opencodeDataDir();
  const dbPath = join(dir, 'opencode.db');
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
  db.pragma('journal_mode = WAL');
  return db;
}

export function closeDb() {
  if (db) { db.close(); db = null; }
}

export function dbPath() {
  const dir = opencodeDataDir();
  return join(dir, 'opencode.db');
}
