import { BaseExercise } from '../core/base_exercise.js';

export class PushupDetector extends BaseExercise {
  constructor(options = {}) {
    super('pushups', {
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
      ankle: this.getPoint(landmarks, 27),
    };
    const right = {
      shoulder: this.getPoint(landmarks, 12),
      elbow: this.getPoint(landmarks, 14),
      wrist: this.getPoint(landmarks, 16),
      hip: this.getPoint(landmarks, 24),
      ankle: this.getPoint(landmarks, 28),
    };

    const sides = [];
    for (const s of [left, right]) {
      if (
        this.visible(s.shoulder) &&
        this.visible(s.elbow) &&
        this.visible(s.wrist) &&
        this.visible(s.hip) &&
        this.visible(s.ankle)
      ) {
        sides.push(s);
      }
    }

    if (sides.length === 0) return null;

    const elbowAngleRaw =
      sides.reduce((sum, s) => sum + this.calculateAngle(s.shoulder, s.elbow, s.wrist), 0) /
      sides.length;
    const alignmentRaw =
      sides.reduce((sum, s) => sum + this.calculateAngle(s.shoulder, s.hip, s.ankle), 0) /
      sides.length;

    const elbowAngle = this.smooth('elbowAngle', elbowAngleRaw);
    const bodyAlignment = this.smooth('bodyAlignment', Math.abs(180 - alignmentRaw));

    // Hip sag / pike check against the shoulder→ankle line.
    const avg = (idxs) => {
      const pts = idxs.map((i) => this.getPoint(landmarks, i)).filter((p) => this.visible(p));
      if (pts.length === 0) return { x: 0, y: 0 };
      return {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      };
    };

    const shoulder = avg([11, 12]);
    const hip = avg([23, 24]);
    const ankle = avg([27, 28]);

    const denom = ankle.x - shoulder.x;
    const ratio = denom === 0 ? 0 : (hip.x - shoulder.x) / denom;
    const expectedHipY = shoulder.y + ratio * (ankle.y - shoulder.y);
    const diff = hip.y - expectedHipY;

    let hipPosition = 'LEVEL';
    if (diff > 0.05) hipPosition = 'sagging';
    else if (diff < -0.05) hipPosition = 'piked';

    return {
      metrics: {
        elbowAngle: Math.round(elbowAngle),
        bodyAlignment: Math.round(bodyAlignment),
        hipPosition,
      },
      phaseAngle: elbowAngle,
    };
  }
}
