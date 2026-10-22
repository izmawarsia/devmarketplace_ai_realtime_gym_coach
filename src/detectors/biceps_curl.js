import { BaseExercise } from '../core/base_exercise.js';

export class BicepsCurlDetector extends BaseExercise {
  constructor(options = {}) {
    // Use classic curl thresholds: >160° = arm extended ("down"), <50° = flexed ("up").
    // Slightly relaxed visibility so minor occlusions don't kill tracking.
    super('biceps_curls', {
      upAngle: 160,
      downAngle: 50,
      visibilityThreshold: 0.3,
      ...options,
    });

    this.downThreshold = options.downThreshold ?? 160; // extended
    this.upThreshold = options.upThreshold ?? 50; // fully curled
  }

  // Custom state machine so reps are counted when curling *up* from extended.
  // Spec: Angle > 160° → stage "down"; Angle < 50° increments rep when coming from "down".
  updateState(phaseAngle) {
    if (this.isComplete || phaseAngle == null || Number.isNaN(phaseAngle)) return;

    // Coming up into a strong curl from the extended position → count rep.
    // Rep counted ONLY on up (curl) after extension (down)
    // Only increment rep when coming from down to up (curl)
    if (this.state === 'down' && phaseAngle < this.upThreshold) {
      this.state = 'up';
      this.repCount += 1;
      this.currentSetReps += 1;
      if (this.currentSetReps >= this.targetReps) {
        this.setsCompleted += 1;
        this.currentSetReps = 0;
      }
      if (this.isComplete) this.state = 'complete';
      return;
    }

    // Fully extended again → ready for next rep.
    // Reset to down when arm is extended again
    if (this.state === 'up' && phaseAngle > this.downThreshold) {
      this.state = 'down';
    }
  }

  extractMetrics(landmarks) {
    const side = this.pickSide(
      landmarks,
      [11, 13, 15],
      [12, 14, 16]
    );

    const shoulder = this.getPoint(landmarks, side === 0 ? 11 : 12);
    const elbow = this.getPoint(landmarks, side === 0 ? 13 : 14);
    const wrist = this.getPoint(landmarks, side === 0 ? 15 : 16);
    const hip = this.getPoint(landmarks, side === 0 ? 23 : 24);

    if (!this.visible(shoulder) || !this.visible(elbow) || !this.visible(wrist) || !this.visible(hip)) {
      // Landmarks we need are not confidently visible; prompt user in UI.
      return null;
    }

    const elbowAngle = this.smooth('elbowAngle', this.calculateAngle(shoulder, elbow, wrist));

    // Shoulder stability = deviation of upper arm from vertical.
    const upperArmAngle = this.calculateAngle(hip, shoulder, elbow);
    const shoulderStability = this.smooth('shoulderStability', Math.abs(180 - upperArmAngle));

    const swing = shoulderStability > 15 ? 'SWINGING' : 'NO SWING';

    return {
      metrics: {
        elbowAngle: Math.round(elbowAngle),
        shoulderStability: Math.round(shoulderStability),
        swing,
      },
      phaseAngle: elbowAngle,
    };
  }
}
