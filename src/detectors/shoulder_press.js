import { BaseExercise } from '../core/base_exercise.js';

export class ShoulderPressDetector extends BaseExercise {
  constructor(options = {}) {
    super('shoulder_press', {
      upAngle: 160,
      downAngle: 90,
      ...options,
    });
  }

  extractMetrics(landmarks) {
    const left = {
      shoulder: this.getPoint(landmarks, 11),
      elbow: this.getPoint(landmarks, 13),
      wrist: this.getPoint(landmarks, 15),
      hip: this.getPoint(landmarks, 23),
    };
    const right = {
      shoulder: this.getPoint(landmarks, 12),
      elbow: this.getPoint(landmarks, 14),
      wrist: this.getPoint(landmarks, 16),
      hip: this.getPoint(landmarks, 24),
    };

    const sides = [];
    for (const s of [left, right]) {
      if (
        this.visible(s.shoulder) &&
        this.visible(s.elbow) &&
        this.visible(s.wrist) &&
        this.visible(s.hip)
      ) {
        sides.push(s);
      }
    }

    if (sides.length === 0) return null;

    const elbowAngleRaw =
      sides.reduce((sum, s) => sum + this.calculateAngle(s.shoulder, s.elbow, s.wrist), 0) /
      sides.length;

    // Back arch = torso lean away from vertical (hip→shoulder vs straight up).
    const backArchRaw =
      sides.reduce((sum, s) => {
        const dx = s.shoulder.x - s.hip.x;
        const dy = s.hip.y - s.shoulder.y; // positive when shoulder is above hip
        const lean = Math.atan2(Math.abs(dx), dy) * (180 / Math.PI);
        return sum + lean;
      }, 0) / sides.length;

    const elbowAngle = this.smooth('elbowAngle', elbowAngleRaw);
    const backArch = this.smooth('backArch', backArchRaw);

    return {
      metrics: {
        elbowAngle: Math.round(elbowAngle),
        armExtension: Math.round(elbowAngle),
        backArch: Math.round(backArch),
      },
      phaseAngle: elbowAngle,
    };
  }
}
