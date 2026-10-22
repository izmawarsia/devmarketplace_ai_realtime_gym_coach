import { SquatDetector } from './squat.js';
import { PushupDetector } from './pushup.js';
import { BicepsCurlDetector } from './biceps_curl.js';
import { ShoulderPressDetector } from './shoulder_press.js';
import { LungeDetector } from './lunges.js';

/**
 * Create an exercise detector for the currently selected exercise.
 * `exercise` must be an item from src/data/exercises.js (id + name).
 */
export function createDetector(exercise, targetReps = 10, targetSets = 3) {
  const opts = { targetReps, targetSets };

  switch (exercise?.id) {
    case 'squats':
      return new SquatDetector(opts);
    case 'pushups':
      return new PushupDetector(opts);
    case 'biceps_curls':
      return new BicepsCurlDetector(opts);
    case 'shoulder_press':
      return new ShoulderPressDetector(opts);
    case 'lunges':
      return new LungeDetector(opts);
    default:
      // Fallback to a squat detector so the UI never crashes on unknown ids.
      return new SquatDetector(opts);
  }
}
