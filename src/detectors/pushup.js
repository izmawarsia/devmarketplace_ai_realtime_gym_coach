import { BaseExercise } from '../core/base_exercise.js';

// Python parity:
//   DOWN_THRESHOLD = 90, UP_THRESHOLD = 160, MIN_VISIBILITY = 0.7,
//   HIP_SAG_TOLERANCE = 0.08
//   Active side by elbow visibility; elbow_angle(shoulder,elbow,wrist);
//   body_angle(shoulder,hip,ankle): Straight >160 / Slight Bend >140 / Poor Form;
//   hip_status LEVEL/SAGGING/PIKED UP from hip_y vs (shoulder_y+ankle_y)/2.
export class PushupDetector extends BaseExercise {
  constructor(options = {}) {
    super('pushups', {
      upAngle: 160,
      downAngle: 90,
      visibilityThreshold: 0.5,
      ...options,
    });
    this.DOWN_THRESHOLD = 90;
    this.UP_THRESHOLD = 160;
    this.MIN_VISIBILITY = 0.7;
    this.HIP_SAG_TOLERANCE = 0.08;
  }

  extractMetrics(landmarks) {
    const leftElbowVis = landmarks?.[13]?.visibility ?? 0;
    const rightElbowVis = landmarks?.[14]?.visibility ?? 0;
    const left = leftElbowVis >= rightElbowVis;

    const shoulder = this.getPoint(landmarks, left ? 11 : 12);
    const elbow = this.getPoint(landmarks, left ? 13 : 14);
    const wrist = this.getPoint(landmarks, left ? 15 : 16);
    const hip = this.getPoint(landmarks, left ? 23 : 24);
    const ankle = this.getPoint(landmarks, left ? 27 : 28);

    const vis = this.MIN_VISIBILITY;
    if (
      shoulder.visibility < vis ||
      elbow.visibility < vis ||
      wrist.visibility < vis ||
      hip.visibility < this.visibilityThreshold ||
      ankle.visibility < this.visibilityThreshold
    ) {
      return null;
    }

    const elbowAngle = this.smooth('elbowAngle', this.calculateAngle(shoulder, elbow, wrist));
    const bodyAngle = this.smooth('bodyAngle', this.calculateAngle(shoulder, hip, ankle));
    if (Number.isNaN(elbowAngle) || Number.isNaN(bodyAngle)) return null;

    // body_alignment from body_angle.
    let bodyAlignment;
    if (bodyAngle > 160) bodyAlignment = 'Straight';
    else if (bodyAngle > 140) bodyAlignment = 'Slight Bend';
    else bodyAlignment = 'Poor Form';

    // hip_status: hip_y deviation from expected midpoint (shoulder_y+ankle_y)/2.
    const expectedHipY = (shoulder.y + ankle.y) / 2;
    const deviation = hip.y - expectedHipY;
    let hipStatus;
    if (Math.abs(deviation) <= this.HIP_SAG_TOLERANCE) hipStatus = 'LEVEL';
    else if (deviation > 0) hipStatus = 'SAGGING';
    else hipStatus = 'PIKED UP';

    // UI keys: numeric alignment error + lowercase hip position for form rules.
    const alignmentError = this.smooth('bodyAlignment', Math.abs(180 - bodyAngle));
    const uiHipPosition =
      hipStatus === 'LEVEL' ? 'LEVEL' : hipStatus === 'SAGGING' ? 'sagging' : 'piked';

    return {
      metrics: {
        // Python-parity keys
        elbow_angle: Math.round(elbowAngle),
        body_alignment: bodyAlignment,
        hip_status: hipStatus,
        // UI keys
        elbowAngle: Math.round(elbowAngle),
        bodyAlignment: Math.round(alignmentError),
        hipPosition: uiHipPosition,
      },
      phaseAngle: elbowAngle,
    };
  }
}
