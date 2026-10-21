// SQLite persistence for workout history (Phase 4).
// One row per completed workout session, scoped per authenticated username.
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'coach.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL,
    exercise    TEXT    NOT NULL,
    sets        INTEGER NOT NULL,
    reps        INTEGER NOT NULL,
    total_reps  INTEGER NOT NULL DEFAULT 0,
    accuracy    REAL    NOT NULL DEFAULT 0,
    calories    REAL    NOT NULL DEFAULT 0,
    duration_min REAL   NOT NULL DEFAULT 0,
    form_issues TEXT    NOT NULL DEFAULT '[]',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON workout_sessions(username, created_at DESC);
`);

const insertStmt = db.prepare(`
  INSERT INTO workout_sessions
    (username, exercise, sets, reps, total_reps, accuracy, calories, duration_min, form_issues)
  VALUES
    (@username, @exercise, @sets, @reps, @totalReps, @accuracy, @calories, @durationMin, @formIssues)
`);

const listStmt = db.prepare(`
  SELECT id, exercise, sets, reps, total_reps AS totalReps, accuracy,
         calories, duration_min AS durationMin, form_issues AS formIssues,
         created_at AS createdAt
  FROM workout_sessions
  WHERE username = ?
  ORDER BY datetime(created_at) DESC, id DESC
  LIMIT 100
`);

export function saveSession(row) {
  const result = insertStmt.run(row);
  return result.lastInsertRowid;
}

export function listSessions(username) {
  return listStmt.all(username).map((r) => ({
    ...r,
    date: (r.createdAt || '').slice(0, 10),
    formIssues: safeParse(r.formIssues),
  }));
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
