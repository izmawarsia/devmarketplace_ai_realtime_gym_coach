export const EXERCISES = [
  { id: 'squats', name: 'Squats', muscles: 'Quads · Glutes', upAngle: 165, downAngle: 95 },
  { id: 'pushups', name: 'Push-ups', muscles: 'Chest · Triceps', upAngle: 165, downAngle: 90 },
  { id: 'biceps_curls', name: 'Biceps Curls', muscles: 'Biceps · Forearms', upAngle: 160, downAngle: 45 },
  { id: 'shoulder_press', name: 'Shoulder Press', muscles: 'Delts · Triceps', upAngle: 170, downAngle: 80 },
  { id: 'lunges', name: 'Lunges', muscles: 'Quads · Glutes', upAngle: 165, downAngle: 100 },
];

// Deterministic rep counter (angle-threshold state machine), client-side stand-in
// for the MediaPipe pose tracking that lands in a later phase.
export function createRepCounter(exercise) {
  let state = 'up';
  let count = 0;
  return {
    feed(angle) {
      if (state === 'up' && angle < exercise.downAngle) state = 'down';
      else if (state === 'down' && angle > exercise.upAngle) {
        state = 'up';
        count += 1;
      }
      return { count, state };
    },
    get count() {
      return count;
    },
  };
}
