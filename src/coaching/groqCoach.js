// Client for Groq-powered coaching cues.
// Calls the local /api/coach route (which holds GROQ_API_KEY server-side and
// talks to Groq's Llama 3.3 70B). If latency exceeds 1s or the call fails,
// falls back to the raw liveIssues[0] text so the user always hears a cue.

const COACH_TIMEOUT_MS = 1000;

function fallbackCue(issues) {
  const raw = Array.isArray(issues) && issues.length ? issues[0] : '';
  return String(raw || 'Keep going, watch your form!').trim();
}

/**
 * Get a short spoken coaching cue for the current form issues.
 * @param {{ exercise?: string, issues: string[] }} input
 * @returns {Promise<{ cue: string, source: 'groq' | 'fallback' }>}
 */
export async function getCoachCue({ exercise, issues } = {}) {
  const fallback = fallbackCue(issues);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise, issues }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`coach api ${res.status}`);

    const data = await res.json();
    const cue = String(data?.cue || '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .split('\n')[0]
      .trim();

    if (!cue) throw new Error('empty cue');
    return { cue, source: 'groq' };
  } catch {
    // Timeout (>1s), offline, missing key, or bad payload — always speak something.
    return { cue: fallback, source: 'fallback' };
  }
}
