import { BaseExercise } from '../core/base_exercise.js';

export class BicepsCurlDetector extends BaseExercise {
  constructor(options = {}) {
    super('biceps_curls', {
      upAngle: 160,
      downAngle: 50,
      ...options,
    });
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

    if (
      !this.visible(shoulder) ||
      !this.visible(elbow) ||
      !this.visible(wrist) ||
      !this.visible(hip)
    ) {
      return null;
    }

    const elbowAngle = this.smooth('elbowAngle', this.calculateAngle(shoulder, elbow, wrist));

    // Shoulder stability = deviation of the upper arm from vertical.
    // A stable curl keeps the upper arm straight up/down (hip→shoulder→elbow ~180°).
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
