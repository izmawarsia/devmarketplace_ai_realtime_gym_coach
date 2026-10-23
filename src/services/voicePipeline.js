// Voice pipeline: maps detector metrics to form issues, throttles minor
// feedback with a 5-second cooldown, and auto-triggers coaching on major
// events (workout_started, set_completed, workout_completed,
// no_pose_detected, ongoing_form_check).
import { createCoach } from './aiCoach.js';
import { speak, cancelSpeech } from './tts.js';

const MINOR_ISSUE_COOLDOWN_MS = 5000;
const NO_POSE_COOLDOWN_MS = 5000;

// Python `_find_form_issue` parity: per-exercise metric → issue mapping.
export function findFormIssue(exerciseId, metrics) {
  if (!metrics) return null;
  switch (exerciseId) {
    case 'squats':
      if (metrics.depth_status === 'TOO HIGH')
        return { code: 'TOO HIGH', text: 'Squat deeper. Get your hips below your knees.' };
      if (metrics.back_angle != null && metrics.back_angle < 45)
        return { code: 'CHEST UP', text: 'Keep your chest up. You are leaning too far forward.' };
      return null;
    case 'biceps_curls':
      if (metrics.shoulder_status === 'ELBOW DRIFTING')
        return { code: 'ELBOW DRIFTING', text: 'Pin your elbows at your sides. Stop the drift.' };
      if (metrics.swing_status === 'SWINGING')
        return { code: 'SWINGING', text: 'Stop swinging. Slow down and control the weight.' };
      return null;
    case 'lunges':
      if (metrics.balance_status === 'OFF BALANCE')
        return { code: 'OFF BALANCE', text: 'You are off balance. Slow the descent.' };
      if (metrics.torso_angle != null && metrics.torso_angle < 150)
        return { code: 'TORSO UPRIGHT', text: 'Keep your torso upright through the lunge.' };
      return null;
    case 'pushups':
      if (metrics.hip_status === 'SAGGING')
        return { code: 'SAGGING', text: 'Your hips are sagging. Brace your core.' };
      if (metrics.hip_status === 'PIKED UP')
        return { code: 'PIKED UP', text: 'Lower your hips into a straight plank line.' };
      if (metrics.body_alignment === 'Poor Form')
        return { code: 'Poor Form', text: 'Keep your body in one straight line.' };
      return null;
    case 'shoulder_press':
      if (metrics.back_arch_status === 'Excessive Arch')
        return { code: 'Excessive Arch', text: 'Your back is over-arching. Engage your core.' };
      return null;
    default:
      return null;
  }
}

export class VoicePipeline {
  constructor({ exerciseId, exerciseName, language = 'English', onFeedback } = {}) {
    this.coach = createCoach();
    this.language = language;
    this.onFeedback = onFeedback; // live coach text banner callback
    this.exerciseId = exerciseId;
    this.exerciseName = exerciseName;
    this.lastMinorIssueAt = 0;
    this.lastNoPoseAt = 0;
    this.lastIssue = null;
    this.started = false;
    this.setsCompleted = 0;
    this.completed = false;
    this.busy = false;
  }

  async _emit(event, context = {}, { bypassCooldown = false } = {}) {
    const now = Date.now();
    const isMinor = event === 'ongoing_form_check' || event === 'no_pose_detected';
    if (isMinor && !bypassCooldown) {
      const last = event === 'no_pose_detected' ? this.lastNoPoseAt : this.lastMinorIssueAt;
      if (now - last < MINOR_ISSUE_COOLDOWN_MS) return;
      if (event === 'no_pose_detected') this.lastNoPoseAt = now;
      else this.lastMinorIssueAt = now;
    }
    if (this.busy) return; // avoid overlapping Groq calls
    this.busy = true;
    try {
      const line = await this.coach.getCoaching(event, {
        exercise: this.exerciseName,
        language: this.language,
        ...context,
      });
      if (line) {
        this.onFeedback?.(line);
        speak(line, { lang: this.language === 'Roman Urdu' ? 'ur-PK' : 'en-US' });
      }
    } finally {
      this.busy = false;
    }
  }

  // Major event: workout started.
  workoutStarted() {
    this.started = true;
    this.completed = false;
    this.setsCompleted = 0;
    this.coach.reset();
    this._emit('workout_started');
  }

  // Called on frames where no landmarks are visible.
  noPoseDetected() {
    this._emit('no_pose_detected');
  }

  // Called every processed frame with detector output.
  frame(out, targetSets, targetReps) {
    if (!out) return;

    // Major: set completed.
    if (out.setsCompleted > this.setsCompleted && !out.isComplete) {
      this.setsCompleted = out.setsCompleted;
      this._emit('set_completed', {
        reps: out.repCount,
        setsCompleted: out.setsCompleted,
        targetSets,
        targetReps,
      });
    }

    // Major: workout completed.
    if (out.isComplete && !this.completed) {
      this.completed = true;
      this._emit('workout_completed', {
        reps: out.repCount,
        setsCompleted: out.setsCompleted,
        targetSets,
      });
      return;
    }

    // Minor: ongoing form check with 5s cooldown.
    const issue = findFormIssue(this.exerciseId, out.metrics);
    if (issue) {
      const now = Date.now();
      if (issue.code !== this.lastIssue || now - this.lastMinorIssueAt >= MINOR_ISSUE_COOLDOWN_MS) {
        this.lastIssue = issue.code;
        this._emit('ongoing_form_check', { issue: issue.text, issueCode: issue.code, metrics: out.metrics });
      }
    }
  }

  dispose() {
    cancelSpeech();
  }
}

export function createVoicePipeline(opts) {
  return new VoicePipeline(opts);
}
