import { BaseExercise } from '../core/base_exercise.js';

export class LungeDetector extends BaseExercise {
  constructor(options = {}) {
    super('lunges', {
      upAngle: 160,
      downAngle: 100,
      ...options,
    });
  }

  extractMetrics(landmarks) {
    const left = {
      hip: this.getPoint(landmarks, 23),
      knee: this.getPoint(landmarks, 25),
      ankle: this.getPoint(landmarks, 27),
      shoulder: this.getPoint(landmarks, 11),
    };
    const right = {
      hip: this.getPoint(landmarks, 24),
      knee: this.getPoint(landmarks, 26),
      ankle: this.getPoint(landmarks, 28),
      shoulder: this.getPoint(landmarks, 12),
    };

    const sides = [];
    for (const s of [left, right]) {
      if (
        this.visible(s.hip) &&
        this.visible(s.knee) &&
        this.visible(s.ankle) &&
        this.visible(s.shoulder)
      ) {
        sides.push(s);
      }
    }

    if (sides.length === 0) return null;

    const kneeAngles = sides.map((s) => this.calculateAngle(s.hip, s.knee, s.ankle));
    const frontKneeAngleRaw = Math.min(...kneeAngles);

    // Torso angle = forward lean from vertical, averaged across both sides.
    const torsoLeanRaw =
      sides.reduce((sum, s) => {
        const dx = s.shoulder.x - s.hip.x;
        const dy = s.hip.y - s.shoulder.y;
        return sum + Math.atan2(Math.abs(dx), dy) * (180 / Math.PI);
      }, 0) / sides.length;

    const frontKneeAngle = this.smooth('frontKneeAngle', frontKneeAngleRaw);
    const torsoAngle = this.smooth('torsoAngle', torsoLeanRaw);

    const balance = torsoAngle <= 15 ? 'BALANCED' : 'OFF BALANCE';

    return {
      metrics: {
        frontKneeAngle: Math.round(frontKneeAngle),
        torsoAngle: Math.round(torsoAngle),
        balance,
      },
      phaseAngle: frontKneeAngle,
    };
  }
}
