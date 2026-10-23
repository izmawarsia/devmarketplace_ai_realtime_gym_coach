/**
 * Shared rep state machine for all exercise detectors.
 * Enhanced with landmark smoothing and OpenCV-parity math stability.
 */
export class BaseExercise {
  constructor(name, options = {}) {
    this.name = name;
    this.upAngle = options.upAngle ?? 160;
    this.downAngle = options.downAngle ?? 90;
    this.targetReps = Math.max(1, Number(options.targetReps ?? 10));
    this.targetSets = Math.max(1, Number(options.targetSets ?? 3));
    this.windowSize = options.windowSize ?? 7; // Increased window size for smoother reading
    this.visibilityThreshold = options.visibilityThreshold ?? 0.5; // OpenCV aligned
    // Grace frames: how many consecutive low-visibility frames the state
    // machine tolerates WITHOUT resetting. Transient occlusion (e.g. a hand
    // crossing the camera) must never wipe rep progress or stage state.
    this.graceFrames = options.graceFrames ?? 6;
    this.missedFrames = 0;
    this.lastHeldOutput = null;
    this.state = 'up';
    this.repCount = 0;
    this.currentSetReps = 0;
    this.setsCompleted = 0;
    this.metricHistory = {};
    this.smoothedPoints = {};
  }

  get isComplete() {
    return this.setsCompleted >= this.targetSets;
  }

  reset() {
    this.state = 'up';
    this.repCount = 0;
    this.currentSetReps = 0;
    this.setsCompleted = 0;
    this.metricHistory = {};
    this.smoothedPoints = {};
    this.missedFrames = 0;
    this.lastHeldOutput = null;
  }

  getPoint(landmarks, idx) {
    const lm = landmarks?.[idx];
    if (!lm) return { x: 0, y: 0, visibility: 0 };
    
    const rawVis = lm.visibility ?? 1;
    if (rawVis < this.visibilityThreshold) {
      return { x: lm.x ?? 0, y: lm.y ?? 0, visibility: rawVis };
    }

    // Exponential Moving Average (EMA), alpha = 0.7 per project spec.
    // 0.7 * new + 0.3 * previous — responsive yet jitter-free.
    const alpha = 0.7;
    const prev = this.smoothedPoints[idx];

    let x = lm.x ?? 0;
    let y = lm.y ?? 0;

    if (prev) {
      x = alpha * x + (1 - alpha) * prev.x;
      y = alpha * y + (1 - alpha) * prev.y;
    }

    this.smoothedPoints[idx] = { x, y, visibility: rawVis };
    return this.smoothedPoints[idx];
  }

  visible(point, threshold = this.visibilityThreshold) {
    return point && point.visibility >= threshold;
  }

  // Python `_safe_angle` parity: angle of a vector from vertical, in degrees.
  // Guards against zero-length vectors (returns 90° when dy is ~0).
  safeAngle(dx, dy) {
    if (!dy || Math.abs(dy) < 1e-9) return 90.0;
    return Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
  }

  calculateAngle(a, b, c) {
    if (!a || !b || !c) return 0;
    const ba = { x: a.x - b.x, y: a.y - b.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };
    
    const dot = ba.x * bc.x + ba.y * bc.y;
    const magBA = Math.hypot(ba.x, ba.y);
    const magBC = Math.hypot(bc.x, bc.y);
    
    if (!magBA || !magBC) return 0.0;
    
    const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    return Math.acos(cos) * (180 / Math.PI);
  }

  pickSide(landmarks, leftIdxs, rightIdxs) {
    const avg = (idxs) => idxs.reduce(
      (sum, idx) => sum + this.getPoint(landmarks, idx).visibility, 0
    ) / idxs.length;
    return avg(leftIdxs) >= avg(rightIdxs) ? 0 : 1;
  }

  smooth(key, value) {
    if (value == null || Number.isNaN(value)) return value;
    const buf = this.metricHistory[key] || [];
    buf.push(value);
    if (buf.length > this.windowSize) buf.shift();
    this.metricHistory[key] = buf;
    return buf.reduce((a, b) => a + b, 0) / buf.length;
  }

  extractMetrics() {
    throw new Error(`extractMetrics() must be implemented by ${this.name}`);
  }

  updateState(phaseAngle) {
    if (this.isComplete || phaseAngle == null || Number.isNaN(phaseAngle)) return;
    if (this.state === 'up' && phaseAngle <= this.downAngle) {
      this.state = 'down';
      return;
    }
    if (this.state === 'down' && phaseAngle >= this.upAngle) {
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

  process(landmarks) {
    const extracted = this.extractMetrics(landmarks);
    if (!extracted) {
      this.missedFrames += 1;
      // Grace period: keypoints dropped only momentarily. HOLD the state
      // machine (no reset, no updateState) and keep returning the last
      // valid output so the UI metrics don't freeze at 0 / N/A.
      if (this.missedFrames <= this.graceFrames && this.lastHeldOutput) {
        return { ...this.lastHeldOutput, held: true };
      }
      return {
        metrics: null,
        repCount: this.repCount,
        currentSetReps: this.currentSetReps,
        setsCompleted: this.setsCompleted,
        isComplete: this.isComplete,
      };
    }
    this.missedFrames = 0;
    this.updateState(extracted.phaseAngle);
    const out = {
      metrics: extracted.metrics,
      phaseAngle: extracted.phaseAngle,
      repCount: this.repCount,
      currentSetReps: this.currentSetReps,
      setsCompleted: this.setsCompleted,
      isComplete: this.isComplete,
    };
    this.lastHeldOutput = out;
    return out;
  }
}