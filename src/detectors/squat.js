import { BaseExercise } from '../core/base_exercise.js';

export class SquatDetector extends BaseExercise {
  constructor(options = {}) {
    super('squats', {
      upAngle: 160,
      downAngle: 100,
      ...options,
    });
  }

  extractMetrics(landmarks) {
    const side = this.pickSide(
      landmarks,
      [11, 23, 25, 27],
      [12, 24, 26, 28]
    );

    const shoulder = this.getPoint(landmarks, side === 0 ? 11 : 12);
    const hip = this.getPoint(landmarks, side === 0 ? 23 : 24);
    const knee = this.getPoint(landmarks, side === 0 ? 25 : 26);
    const ankle = this.getPoint(landmarks, side === 0 ? 27 : 28);

    if (
      !this.visible(shoulder) ||
      !this.visible(hip) ||
      !this.visible(knee) ||
      !this.visible(ankle)
    ) {
      return null;
    }

    const kneeAngle = this.smooth('kneeAngle', this.calculateAngle(hip, knee, ankle));
    const backAngle = this.smooth('backAngle', this.calculateAngle(shoulder, hip, knee));

    let depth = 'STANDING';
    if (kneeAngle < 90) depth = 'GOOD DEPTH';
    else if (kneeAngle < 160) depth = 'shallow';

    return {
      metrics: {
        kneeAngle: Math.round(kneeAngle),
        backAngle: Math.round(backAngle),
        depth,
      },
      phaseAngle: kneeAngle,
    };
  }
}
