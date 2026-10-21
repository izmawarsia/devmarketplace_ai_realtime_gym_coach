// Workout history API — per-user workout sessions in SQLite.
//   GET  /api/history?user=<username>          -> { sessions }
//   POST /api/history { username, exercise, ... } -> { id }
import { Router } from 'express';
import { saveSession, listSessions } from './db.js';

export const historyRouter = Router();

historyRouter.get('/', (req, res) => {
  const user = String(req.query.user || '').trim().toLowerCase();
  if (!user) return res.status(400).json({ error: 'user query param required' });
  res.json({ sessions: listSessions(user) });
});

historyRouter.post('/', (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim().toLowerCase();
  const exercise = String(b.exercise || '').trim();
  if (!username || !exercise) {
    return res.status(400).json({ error: 'username and exercise are required' });
  }
  const row = {
    username,
    exercise,
    sets: clampInt(b.sets, 0, 100),
    reps: clampInt(b.reps, 0, 100),
    totalReps: clampInt(b.totalReps, 0, 100000),
    accuracy: clampNum(b.accuracy, 0, 100),
    calories: clampNum(b.calories, 0, 100000),
    durationMin: clampNum(b.durationMin, 0, 10000),
    formIssues: JSON.stringify(Array.isArray(b.formIssues) ? b.formIssues.slice(0, 20) : []),
  };
  const id = saveSession(row);
  res.status(201).json({ id });
});

function clampInt(v, min, max) {
  return Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
}
function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, Number(v) || 0));
}
