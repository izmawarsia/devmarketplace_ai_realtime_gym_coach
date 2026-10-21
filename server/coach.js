// Coaching-message route. Groq (Llama 3.3) words deterministic form events
// into short spoken coaching lines. Falls back to a local template phraser
// when GROQ_API_KEY is missing or the call fails — the app never crashes.
import { Router } from 'express';

export const coachRouter = Router();

const SYSTEM = [
  'You are a friendly, motivating gym coach speaking live to someone mid-workout.',
  'You are given deterministic form-checker events — never invent new form judgments.',
  'Reply with ONE short spoken sentence (max 18 words), second person, no emojis, no markdown.',
].join(' ');

coachRouter.post('/', async (req, res) => {
  const { exercise = 'exercise', issues = [], event, stats = {} } = req.body || {};
  const prompt = buildPrompt(exercise, issues, event, stats);

  const key = process.env.GROQ_API_KEY;
  if (key) {
    try {
      const message = await groqPhrase(prompt, key);
      return res.json({ message, source: 'groq' });
    } catch (err) {
      console.warn('[coach] Groq failed, using fallback:', err.message);
    }
  }
  res.json({ message: fallbackPhrase(exercise, issues, event, stats), source: 'fallback' });
});

function buildPrompt(exercise, issues, event, stats) {
  const parts = [`Exercise: ${exercise}.`];
  if (stats.set) parts.push(`Set ${stats.set} of ${stats.targetSets}, rep ${stats.reps} of ${stats.targetReps}.`);
  if (event?.type === 'set_complete') parts.push('Event: the user just completed a set — congratulate and encourage.');
  else if (event?.type === 'workout_complete') parts.push('Event: the user finished the whole workout — celebrate briefly.');
  else if (event?.type === 'start') parts.push('Event: the workout just started — give a quick motivating opener.');
  if (issues.length) parts.push(`Form issues detected: ${issues.join('; ')}. Address the first one.`);
  else parts.push('Form is clean right now.');
  return parts.join(' ');
}

async function groqPhrase(prompt, key) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 60,
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('empty Groq response');
  return text.replace(/^["']|["']$/g, '');
}

// Deterministic fallback phrasing (used when Groq is unavailable).
function fallbackPhrase(exercise, issues, event, stats) {
  const name = exercise.replace(/_/g, ' ');
  if (event?.type === 'workout_complete') return `Workout complete! Awesome effort on those ${name} — you've earned a rest.`;
  if (event?.type === 'set_complete') return `Set ${stats.set} done! Strong work — catch your breath and go again.`;
  if (issues.length) return `Watch your form: ${issues[0].toLowerCase()}. You've got this.`;
  if (event?.type === 'start') return `Let's go! Starting ${name} — nice clean reps, I'm watching your form.`;
  return `Good ${name} form — keep the tempo steady, rep ${stats.reps ?? ''}.`;
}
