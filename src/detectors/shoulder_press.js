import { BaseExercise } from '../core/base_exercise.js';

// Python parity:
//   UP_THRESHOLD = 160, DOWN_THRESHOLD = 90, MIN_VISIBILITY = 0.7
//   Inverted state machine (press UP first, rep counted on return DOWN);
//   extension_status FULL/NEARLY/PRESSING/START;
//   back_angle(shoulder,hip,knee): Neutral >=160 / Slight Arch >=140 / Excessive Arch.
export class ShoulderPressDetector extends BaseExercise {
  constructor(options = {}) {
    super('shoulder_press', {
      upAngle: 160,
      downAngle: 90,
      visibilityThreshold: 0.5,
      ...options,
    });
    this.UP_THRESHOLD = 160;
    this.DOWN_THRESHOLD = 90;
    this.MIN_VISIBILITY = 0.5; // relaxed: grace frames handle transient drops
    this.state = 'down'; // inverted: start low, press up first
  }

  reset() {
    super.reset();
    this.state = 'down';
  }

  // Inverted state machine: up when angle > 160; rep when angle < 90 after up.
  updateState(phaseAngle) {
    if (this.isComplete || phaseAngle == null || Number.isNaN(phaseAngle)) return;
    if (this.state === 'down' && phaseAngle > this.UP_THRESHOLD) {
      this.state = 'up';
      return;
    }
    if (this.state === 'up' && phaseAngle < this.DOWN_THRESHOLD) {
      this.state = 'down';
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
    const leftElbowVis = landmarks?.[13]?.visibility ?? 0;
    const rightElbowVis = landmarks?.[14]?.visibility ?? 0;
    const left = leftElbowVis >= rightElbowVis;

    const shoulder = this.getPoint(landmarks, left ? 11 : 12);
    const elbow = this.getPoint(landmarks, left ? 13 : 14);
    const wrist = this.getPoint(landmarks, left ? 15 : 16);
    const hip = this.getPoint(landmarks, left ? 23 : 24);
    const knee = this.getPoint(landmarks, left ? 25 : 26);

    const vis = this.MIN_VISIBILITY;
    if (
      shoulder.visibility < vis ||
      elbow.visibility < vis ||
      wrist.visibility < vis ||
      hip.visibility < this.visibilityThreshold ||
      knee.visibility < this.visibilityThreshold
    ) {
      return null;
    }

    const elbowAngle = this.smooth('elbowAngle', this.calculateAngle(shoulder, elbow, wrist));
    const backAngle = this.smooth('backAngle', this.calculateAngle(shoulder, hip, knee));
    if (Number.isNaN(elbowAngle) || Number.isNaN(backAngle)) return null;

    let extensionStatus;
    if (elbowAngle >= 160) extensionStatus = 'FULL EXTENSION';
    else if (elbowAngle >= 130) extensionStatus = 'NEARLY EXTENDED';
    else if (elbowAngle >= 90) extensionStatus = 'PRESSING';
    else extensionStatus = 'START POSITION';

    let backArchStatus;
    if (backAngle >= 160) backArchStatus = 'Neutral';
    else if (backAngle >= 140) backArchStatus = 'Slight Arch';
    else backArchStatus = 'Excessive Arch';

    // UI keys: numeric back arch lean + arm extension for the metric cards.
    const backArchLean = this.smooth(
      'backArch',
      this.safeAngle(shoulder.x - hip.x, hip.y - shoulder.y)
    );

    return {
      metrics: {
        // Python-parity keys
        elbow_angle: Math.round(elbowAngle),
        extension_status: extensionStatus,
        back_arch_status: backArchStatus,
        // UI keys
        elbowAngle: Math.round(elbowAngle),
        armExtension: Math.round(elbowAngle),
        backArch: Math.round(backArchLean),
      },
      phaseAngle: elbowAngle,
    };
  }
}
