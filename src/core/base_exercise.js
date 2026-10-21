/**
 * BaseExercise — abstract class shared by all exercise detectors.
 *
 * Owns:
 *   - 2D joint-angle calculation from MediaPipe landmarks
 *   - simple moving-average smoothing for every numeric metric
 *   - up/down phase state machine
 *   - rep counting and automatic set progression
 *
 * Subclasses only implement extractMetrics(landmarks) and supply their own
 * thresholds via the constructor options.
 */

export class BaseExercise {
  constructor(name, options = {}) {
    this.name = name;
    this.upAngle = options.upAngle ?? 160;
    this.downAngle = options.downAngle ?? 90;
    this.targetReps = options.targetReps ?? 10;
    this.windowSize = options.windowSize ?? 5;
    this.visibilityThreshold = options.visibilityThreshold ?? 0.5;

    this.state = 'up';
    this.repCount = 0;
    this.currentSetReps = 0;
    this.setsCompleted = 0;
    this.metricHistory = {};
  }

  reset() {
    this.state = 'up';
    this.repCount = 0;
    this.currentSetReps = 0;
    this.setsCompleted = 0;
    this.metricHistory = {};
  }

  getPoint(landmarks, idx) {
    const lm = landmarks[idx];
    if (!lm) return { x: 0, y: 0, visibility: 0 };
    return {
      x: lm.x ?? 0,
      y: lm.y ?? 0,
      visibility: lm.visibility ?? 1,
    };
  }

  visible(point, threshold = this.visibilityThreshold) {
    return point.visibility >= threshold;
  }

  calculateAngle(a, b, c) {
    const ba = { x: a.x - b.x, y: a.y - b.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };

    const dot = ba.x * bc.x + ba.y * bc.y;
    const magBA = Math.hypot(ba.x, ba.y);
    const magBC = Math.hypot(bc.x, bc.y);

    if (magBA === 0 || magBC === 0) return 0;

    const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    const radians = Math.acos(cos);
    return radians * (180 / Math.PI);
  }

  /**
   * Pick the more visible side (0 = left, 1 = right).
   * `leftIdxs` and `rightIdxs` are landmark-index arrays of the same length.
   */
  pickSide(landmarks, leftIdxs, rightIdxs) {
    const avg = (idxs) =>
      idxs.reduce((sum, idx) => sum + this.getPoint(landmarks, idx).visibility, 0) /
      idxs.length;
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

  /**
   * Subclasses override this to return { metrics, phaseAngle }.
   * `metrics` is the object shown on the live telemetry cards.
   * `phaseAngle` drives the shared up/down rep state machine.
   */
  extractMetrics(_landmarks) {
    throw new Error(`extractMetrics() must be implemented by ${this.name}`);
  }

  updateState(phaseAngle) {
    if (phaseAngle == null || Number.isNaN(phaseAngle)) return;

    if (this.state === 'up' && phaseAngle < this.downAngle) {
      this.state = 'down';
    } else if (this.state === 'down' && phaseAngle > this.upAngle) {
      this.state = 'up';
      this.repCount += 1;
      this.currentSetReps += 1;

      if (this.currentSetReps >= this.targetReps) {
        this.setsCompleted += 1;
        this.currentSetReps = 0;
      }
    }
  }

  process(landmarks) {
    const extracted = this.extractMetrics(landmarks);
    if (!extracted) return { metrics: null };

    const { metrics, phaseAngle } = extracted;
    this.updateState(phaseAngle);

    return {
      metrics,
      phaseAngle,
      repCount: this.repCount,
      currentSetReps: this.currentSetReps,
      setsCompleted: this.setsCompleted,
    };
  }
}
