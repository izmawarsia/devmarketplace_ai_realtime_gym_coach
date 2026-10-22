import { BaseExercise } from '../core/base_exercise.js';

export class SquatDetector extends BaseExercise {
  constructor(options = {}) {
    super('squats', {
      upAngle: 160,
      downAngle: 100,
      visibilityThreshold: 0.3,
      ...options,
    });
  }

  // Enforce rep counting logic: Knee angle < 100 = down, >= 160 = up (rep counted on up)
  updateState(phaseAngle) {
    if (this.isComplete || phaseAngle == null || Number.isNaN(phaseAngle)) return;
    // Rep counted ONLY on standing up after squat (knee angle >= up threshold)
    // Only increment rep when coming from down (squat) to up (stand)
    if (this.state === 'down' && phaseAngle >= this.upAngle) {
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
    // Down phase if knee angle < down threshold
    // Down phase if knee angle < down threshold
    if (this.state === 'up' && phaseAngle < this.downAngle) {
      this.state = 'down';
    }
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

    if (!this.visible(shoulder) || !this.visible(hip) || !this.visible(knee) || !this.visible(ankle)) {
      // Not enough lower-body landmarks; prompt user in UI.
      return null;
    }

    const kneeAngle = this.smooth('kneeAngle', this.calculateAngle(hip, knee, ankle));
    const backAngle = this.smooth('backAngle', this.calculateAngle(shoulder, hip, knee));

    let depth = 'STANDING';
    if (kneeAngle < 90) depth = 'GOOD DEPTH';
    else if (kneeAngle < 160) depth = 'TOO HIGH';

    // Handle missing landmarks gracefully in metrics
    if (Number.isNaN(kneeAngle) || Number.isNaN(backAngle)) {
      return null;
    }

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
