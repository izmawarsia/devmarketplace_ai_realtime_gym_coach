// History rows come from the SQLite-backed API (see data/historyClient.js and
// server/history.js). This module keeps only the shared summary aggregation.
export function summarize(history) {
  const totalWorkouts = history.length;
  const avgAccuracy = totalWorkouts
    ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / totalWorkouts)
    : 0;
  const calories = history.reduce((s, h) => s + h.calories, 0);
  const minutes = history.reduce((s, h) => s + h.durationMin, 0);
  return { totalWorkouts, avgAccuracy, calories, minutes };
}
