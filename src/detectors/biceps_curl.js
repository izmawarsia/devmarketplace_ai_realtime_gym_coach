import { BaseExercise } from '../core/base_exercise.js';

// Python parity:
//   UP_THRESHOLD = 50, DOWN_THRESHOLD = 160, MIN_VISIBILITY = 0.7,
//   ELBOW_DRIFT_TOLERANCE = 0.06, SWING_THRESHOLD = 15
//   Visible-arm selection by elbow visibility; elbow_angle(shoulder,elbow,wrist);
//   shoulder_status ELBOW DRIFTING via |elbow.x - shoulder.x|;
//   swing_status via torso angle from vertical (_safe_angle on midpoints).
export class BicepsCurlDetector extends BaseExercise {
  constructor(options = {}) {
    super('biceps_curls', {
      upAngle: 50,
      downAngle: 160,
      visibilityThreshold: 0.5,
      ...options,
    });
    this.UP_THRESHOLD = 50;
    this.DOWN_THRESHOLD = 160;
    this.MIN_VISIBILITY = 0.5; // relaxed: grace frames handle transient drops
    this.ELBOW_DRIFT_TOLERANCE = 0.06;
    this.SWING_THRESHOLD = 15;
    this._flexed = false;
  }

  reset() {
    super.reset();
    this._flexed = false;
  }

  // Python state machine: stage becomes "up" when angle < 50; a rep is
  // counted when the angle rises above 160 after a flexed rep.
  updateState(phaseAngle) {
    if (this.isComplete || phaseAngle == null || Number.isNaN(phaseAngle)) return;
    if (this.state === 'up' && phaseAngle < this.UP_THRESHOLD) {
      this.state = 'up'; // flexed
      this._flexed = true;
      return;
    }
    if (this._flexed && phaseAngle > this.DOWN_THRESHOLD) {
      this._flexed = false;
      this.state = 'up';
      this.repCount += 1;
      this.currentSetReps += 1;
      if (this.currentSetReps >= this.targetReps) {
        this.setsCompleted += 1;
        this.currentSetReps = 0;
      }
      if (this.isComplete) this.state = 'complete';
    }
  }

  extractMetrics(landmarks) {
    // Visible-arm selection by elbow visibility (13 vs 14).
    const leftElbowVis = landmarks?.[13]?.visibility ?? 0;
    const rightElbowVis = landmarks?.[14]?.visibility ?? 0;
    const left = leftElbowVis >= rightElbowVis;

    const shoulder = this.getPoint(landmarks, left ? 11 : 12);
    const elbow = this.getPoint(landmarks, left ? 13 : 14);
    const wrist = this.getPoint(landmarks, left ? 15 : 16);
    const hip = this.getPoint(landmarks, left ? 23 : 24);

    const vis = this.MIN_VISIBILITY;
    if (shoulder.visibility < vis || elbow.visibility < vis || wrist.visibility < vis) {
      return null;
    }

    const elbowAngle = this.smooth('elbowAngle', this.calculateAngle(shoulder, elbow, wrist));
    if (Number.isNaN(elbowAngle)) return null;

    // shoulder_status: elbow drifting relative to shoulder (x axis).
    const shoulderStatus =
      Math.abs(elbow.x - shoulder.x) > this.ELBOW_DRIFT_TOLERANCE
        ? 'ELBOW DRIFTING'
        : 'STABLE';

    // swing_status: torso angle from vertical via shoulder/hip midpoints.
    const sL = this.getPoint(landmarks, 11);
    const sR = this.getPoint(landmarks, 12);
    const hL = this.getPoint(landmarks, 23);
    const hR = this.getPoint(landmarks, 24);
    const midShoulder = { x: (sL.x + sR.x) / 2, y: (sL.y + sR.y) / 2 };
    const midHip = { x: (hL.x + hR.x) / 2, y: (hL.y + hR.y) / 2 };
    const torsoAngle = this.safeAngle(midShoulder.x - midHip.x, midHip.y - midShoulder.y);
    const swingStatus = torsoAngle > this.SWING_THRESHOLD ? 'SWINGING' : 'NO SWING';

    // UI key: numeric shoulder stability for the metric card.
    const upperArmAngle = this.calculateAngle(hip, shoulder, elbow);
    const shoulderStability = this.smooth('shoulderStability', Math.abs(180 - upperArmAngle));

    return {
      metrics: {
        // Python-parity keys
        elbow_angle: Math.round(elbowAngle),
        shoulder_status: shoulderStatus,
        swing_status: swingStatus,
        // UI keys
        elbowAngle: Math.round(elbowAngle),
        shoulderStability: Math.round(shoulderStability),
        swing: swingStatus,
      },
      phaseAngle: elbowAngle,
    };
  }
}
