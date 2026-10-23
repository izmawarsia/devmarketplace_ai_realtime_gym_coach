// Groq LLM coach service (browser-side, mirrors the Python backend coach).
import Groq from 'groq-sdk';
import {
  getCoachPrompt,
  COACH_MODEL,
  COACH_TEMPERATURE,
  COACH_HISTORY_LIMIT,
} from '../config/coachPrompt.js';

let groqClient = null;
let warned = false;

function getClient() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    if (!warned) {
      warned = true;
      console.warn(
        '[aiCoach] VITE_GROQ_API_KEY is not set. Add it in the workspace Secrets panel; ' +
          'falling back to local rule-based coaching lines.'
      );
    }
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqClient;
}

export class AICoach {
  constructor() {
    this.history = []; // last 10 messages
  }

  reset() {
    this.history = [];
  }

  // Returns a short spoken coaching line for an event + context.
  async getCoaching(event, context = {}) {
    const client = getClient();
    if (!client) return fallbackLine(event, context);

    const userMsg = buildUserMessage(event, context);
    const messages = [
      { role: 'system', content: getCoachPrompt(context.language) },
      ...this.history,
      { role: 'user', content: userMsg },
    ];

    try {
      const completion = await client.chat.completions.create({
        model: COACH_MODEL,
        temperature: COACH_TEMPERATURE,
        max_tokens: 48,
        messages,
      });
      const text = completion.choices?.[0]?.message?.content?.trim();
      if (!text) return fallbackLine(event, context);

      // Track last 10 messages (user + assistant pairs).
      this.history.push({ role: 'user', content: userMsg });
      this.history.push({ role: 'assistant', content: text });
      if (this.history.length > COACH_HISTORY_LIMIT) {
        this.history = this.history.slice(-COACH_HISTORY_LIMIT);
      }
      return text;
    } catch (err) {
      console.warn('[aiCoach] Groq call failed, using fallback:', err?.message);
      return fallbackLine(event, context);
    }
  }
}

function buildUserMessage(event, context) {
  const { exercise, reps, setsCompleted, targetSets, targetReps, issue, metrics } = context;
  const parts = [`event=${event}`, `exercise=${exercise || 'unknown'}`];
  if (reps != null) parts.push(`reps=${reps}`);
  if (setsCompleted != null) parts.push(`sets_completed=${setsCompleted}`);
  if (targetSets != null) parts.push(`target_sets=${targetSets}`);
  if (targetReps != null) parts.push(`target_reps=${targetReps}`);
  if (issue) parts.push(`form_issue=${issue}`);
  if (metrics) {
    const m = Object.entries(metrics)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    if (m) parts.push(`metrics=${m}`);
  }
  return parts.join('; ');
}

// Deterministic local fallback when no API key is configured or Groq fails.
function fallbackLine(event, { issue, issueCode, exercise, language } = {}) {
  if (language === 'Roman Urdu') {
    switch (event) {
      case 'workout_started': return 'Workout shuru. Form tight rakho, har rep control se karo.';
      case 'set_completed': return 'Shabash, set poora hua. Saans lo aur dobara shuru karo.';
      case 'workout_completed': return 'Workout mukammal. Bohat aala khela.';
      case 'no_pose_detected': return 'Camera ke samne aao, poora jism nazar aana chahiye.';
      case 'ongoing_form_check':
        return (issueCode && ROMAN_URDU_ISSUES[issueCode]) || 'Form par dhyan do, har rep control se karo.';
      default: return 'Lagay raho, form par dhyan do.';
    }
  }
  switch (event) {
    case 'workout_started':
      return `Workout started. Keep your form tight and control every rep.`;
    case 'set_completed':
      return 'Set complete. Breathe, reset, and go again.';
    case 'workout_completed':
      return 'Workout complete. Great effort, you finished strong.';
    case 'no_pose_detected':
      return 'Step back so your full body is visible to the camera.';
    case 'ongoing_form_check':
      if (issue) return issue;
      return `Stay controlled through each ${exercise || 'exercise'} rep.`;
    default:
      return 'Keep going, stay focused on your form.';
  }
}

// Roman Urdu fallback issue lines keyed by exercise issue code.
const ROMAN_URDU_ISSUES = {
  'TOO HIGH': 'Aur neeche jao, hips ghutnon se neeche hone chahiye.',
  'CHEST UP': 'Chaati upar rakho, zyada aagay jhuk rahe ho.',
  'ELBOW DRIFTING': 'Kohniyon ko jism ke saath chipkao, drift band karo.',
  SWINGING: 'Jhatka mat do, weight ko control se uthao.',
  'OFF BALANCE': 'Balance bigad raha hai, dheere utro.',
  'TORSO UPRIGHT': 'Peeth seedhi rakho lunge mein.',
  SAGGING: 'Hips latak rahe hain, core tight karo.',
  'PIKED UP': 'Hips neeche lao, seedhi plank line banao.',
  'Poor Form': 'Jism ko ek seedhi line mein rakho.',
  'Excessive Arch': 'Peeth zyada arch ho rahi hai, core tight karo.',
};

function toRomanUrduIssue(issue) {
  const key = Object.keys(ROMAN_URDU_ISSUES).find((k) => issue.includes(k));
  return key ? ROMAN_URDU_ISSUES[key] : 'Form par dhyan do, har rep control se karo.';
}

export function createCoach() {
  return new AICoach();
}
