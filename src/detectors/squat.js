import { BaseExercise } from '../core/base_exercise.js';

// Python parity:
//   DOWN_THRESHOLD = 100, UP_THRESHOLD = 160, MIN_VISIBILITY = 0.7
//   Dynamic side selection by knee visibility; knee_angle(hip,knee,ankle);
//   back_angle(shoulder,hip,knee).
export class SquatDetector extends BaseExercise {
  constructor(options = {}) {
    super('squats', {
      upAngle: 160,
      downAngle: 100,
      visibilityThreshold: 0.5,
      ...options,
    });
    this.DOWN_THRESHOLD = 100;
    this.UP_THRESHOLD = 160;
    this.MIN_VISIBILITY = 0.5; // relaxed: grace frames handle transient drops
  }

  extractMetrics(landmarks) {
    // Dynamic side selection: compare knee visibility (25 vs 26).
    const leftKneeVis = landmarks?.[25]?.visibility ?? 0;
    const rightKneeVis = landmarks?.[26]?.visibility ?? 0;
    const left = leftKneeVis >= rightKneeVis;

    const shoulder = this.getPoint(landmarks, left ? 11 : 12);
    const hip = this.getPoint(landmarks, left ? 23 : 24);
    const knee = this.getPoint(landmarks, left ? 25 : 26);
    const ankle = this.getPoint(landmarks, left ? 27 : 28);

    const vis = this.MIN_VISIBILITY;
    if (
      hip.visibility < vis ||
      knee.visibility < vis ||
      ankle.visibility < vis ||
      shoulder.visibility < this.visibilityThreshold
    ) {
      return null; // key landmarks not confidently visible
    }

    const kneeAngle = this.smooth('kneeAngle', this.calculateAngle(hip, knee, ankle));
    const backAngle = this.smooth('backAngle', this.calculateAngle(shoulder, hip, knee));
    if (Number.isNaN(kneeAngle) || Number.isNaN(backAngle)) return null;

    // depth_status parity: stage down -> GOOD DEPTH / TOO HIGH; up -> STANDING.
    let depthStatus;
    if (this.state === 'down') {
      depthStatus = kneeAngle <= this.DOWN_THRESHOLD ? 'GOOD DEPTH' : 'TOO HIGH';
    } else if (this.state === 'up' || this.state === 'complete') {
      depthStatus = 'STANDING';
    } else {
      depthStatus = 'N/A';
    }

    return {
      metrics: {
        // Python-parity keys
        knee_angle: Math.round(kneeAngle),
        back_angle: Math.round(backAngle),
        depth_status: depthStatus,
        // UI keys (strict preservation of existing metric panel)
        kneeAngle: Math.round(kneeAngle),
        backAngle: Math.round(backAngle),
        depth: depthStatus,
      },
      phaseAngle: kneeAngle,
    };
  }
}
