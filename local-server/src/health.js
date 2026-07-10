import { existsSync } from 'fs';
import { dbPath } from './db.js';

export function checkHealth() {
  const path = dbPath();
  const dbOk = existsSync(path);
  return {
    status: dbOk ? 'ok' : 'error',
    opencode: dbOk ? 'running' : 'not_detected',
    db: dbOk ? 'accessible' : 'not_found',
    dbPath: path,
  };
}
