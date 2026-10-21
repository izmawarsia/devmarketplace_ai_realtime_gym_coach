// Client for the coaching API: fetch a coached message, then speak it.
export async function fetchCoachingMessage(payload) {
  const r = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`coach ${r.status}`);
  return r.json(); // { message, source }
}
