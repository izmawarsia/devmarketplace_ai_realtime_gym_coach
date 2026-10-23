// Backwards-compatible wrapper around the Groq coaching client.
import { getCoachCue } from './groqCoach';

export async function fetchCoachingMessage({ exercise, issues } = {}) {
  const { cue, source } = await getCoachCue({ exercise, issues });
  return { message: cue, source };
}
