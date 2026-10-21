// Client for the workout history API (SQLite-backed on the server).
// Falls back to an empty list if the API is unreachable so the UI never breaks.
export async function fetchHistory(username) {
  try {
    const res = await fetch(`/api/history?user=${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`history fetch failed: ${res.status}`);
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.warn('[history] fetch failed:', err.message);
    return [];
  }
}

export async function saveWorkout(username, session) {
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, ...session }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[history] save failed:', err.message);
    return false;
  }
}
