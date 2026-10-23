// Per-landmark Exponential Moving Average (EMA) smoother.
// Applied to every raw landmark frame BEFORE it feeds both the canvas
// drawing and the detector process() call, so the skeleton overlay stays
// perfectly steady when the body is still.
//
// alpha = 0.7: 0.7 * new + 0.3 * previous — responsive yet jitter-free.

export const SMOOTHING_ALPHA = 0.7;

export class LandmarkSmoother {
  constructor(alpha = SMOOTHING_ALPHA) {
    this.alpha = alpha;
    this.prev = null; // array of smoothed landmarks
  }

  /**
   * Smooth one frame of landmarks (array of {x, y, z?, visibility?}).
   * Returns a NEW array; never mutates the MediaPipe result objects.
   */
  apply(landmarks) {
    if (!Array.isArray(landmarks) || landmarks.length === 0) {
      this.prev = null;
      return landmarks;
    }
    const a = this.alpha;
    const prev = this.prev;
    const out = landmarks.map((lm, i) => {
      const p = prev?.[i];
      const x = lm.x ?? 0;
      const y = lm.y ?? 0;
      const z = lm.z ?? 0;
      if (!p) return { ...lm, x, y, z };
      return {
        ...lm,
        x: a * x + (1 - a) * p.x,
        y: a * y + (1 - a) * p.y,
        z: a * z + (1 - a) * p.z,
      };
    });
    this.prev = out.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }));
    return out;
  }

  reset() {
    this.prev = null;
  }
}

export function createLandmarkSmoother(alpha = SMOOTHING_ALPHA) {
  return new LandmarkSmoother(alpha);
}
