import { BaseExercise } from '../core/base_exercise.js';

// Python parity:
//   DOWN_THRESHOLD = 100, UP_THRESHOLD = 160, MIN_VISIBILITY = 0.7,
//   BALANCE_TOLERANCE = 0.10
//   Front leg = smaller knee angle; torso_angle(shoulder,front_hip,front_knee);
//   balance_status from shoulder-mid vs hip-mid lateral offset.
export class LungeDetector extends BaseExercise {
  constructor(options = {}) {
    super('lunges', {
      upAngle: 160,
      downAngle: 100,
      visibilityThreshold: 0.5,
      ...options,
    });
    this.DOWN_THRESHOLD = 100;
    this.UP_THRESHOLD = 160;
    this.MIN_VISIBILITY = 0.5; // relaxed: grace frames handle transient drops
    this.BALANCE_TOLERANCE = 0.10;
  }

  extractMetrics(landmarks) {
    const mk = (hipI, kneeI, ankleI, shoulderI) => ({
      hip: this.getPoint(landmarks, hipI),
      knee: this.getPoint(landmarks, kneeI),
      ankle: this.getPoint(landmarks, ankleI),
      shoulder: this.getPoint(landmarks, shoulderI),
    });
    const sides = [mk(23, 25, 27, 11), mk(24, 26, 28, 12)];

    const vis = this.MIN_VISIBILITY;
    const valid = sides.filter(
      (s) => s.hip.visibility >= vis && s.knee.visibility >= vis && s.ankle.visibility >= vis
    );
    if (valid.length === 0) return null;

    const withAngles = valid.map((s) => ({
      ...s,
      kneeAngle: this.calculateAngle(s.hip, s.knee, s.ankle),
    }));

    // Front leg = the one with the smaller (or equal) knee angle.
    const front = withAngles.reduce((a, b) => (b.kneeAngle <= a.kneeAngle ? b : a));

    const frontKneeAngle = this.smooth('frontKneeAngle', front.kneeAngle);
    // torso_angle via calculateAngle(shoulder, front_hip, front_knee).
    const torsoAngle = this.smooth(
      'torsoAngle',
      this.calculateAngle(front.shoulder, front.hip, front.knee)
    );
    if (Number.isNaN(frontKneeAngle) || Number.isNaN(torsoAngle)) return null;

    // balance_status: lateral offset between shoulder midpoint x and hip midpoint x.
    const sL = this.getPoint(landmarks, 11);
    const sR = this.getPoint(landmarks, 12);
    const hL = this.getPoint(landmarks, 23);
    const hR = this.getPoint(landmarks, 24);
    const shoulderMidX = (sL.x + sR.x) / 2;
    const hipMidX = (hL.x + hR.x) / 2;
    const offset = Math.abs(shoulderMidX - hipMidX);
    const balanceStatus = offset <= this.BALANCE_TOLERANCE ? 'BALANCED' : 'OFF BALANCE';

    // UI torso lean (degrees from vertical) for the existing metric card.
    const torsoLean = this.smooth(
      'torsoLean',
      this.safeAngle(front.shoulder.x - front.hip.x, front.hip.y - front.shoulder.y)
    );

    return {
      metrics: {
        // Python-parity keys
        front_knee_angle: Math.round(frontKneeAngle),
        torso_angle: Math.round(torsoAngle),
        balance_status: balanceStatus,
        // UI keys
        frontKneeAngle: Math.round(frontKneeAngle),
        torsoAngle: Math.round(torsoLean),
        balance: balanceStatus,
      },
      phaseAngle: frontKneeAngle,
    };
  }
}
