// Client-side workout history persistence.
// Phase 5 stores sessions in localStorage so the app runs without a backend.
// Data resets if the browser storage is cleared.

const keyFor = (username) => `apna-coach-history-${username}`;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function fetchHistory(username) {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(keyFor(username));
    const sessions = raw ? JSON.parse(raw) : [];
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
}

export function saveWorkout(username, session) {
  if (!username || !session) return false;
  try {
    const list = fetchHistory(username);
    list.unshift({
      id: Date.now(),
      date: today(),
      ...session,
    });
    localStorage.setItem(keyFor(username), JSON.stringify(list.slice(0, 100)));
    return true;
  } catch {
    return false;
  }
}
