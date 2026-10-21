// Simulated pose telemetry stand-in until the MediaPipe wiring lands.
// Produces plausible angle values per exercise and occasionally drifts into
// bad-form territory so the rule engine has something to flag.
const drift = (v, target, amt) => v + (target - v) * amt + (Math.random() - 0.5) * 4;

export function simulateTelemetry(exerciseId, prev, phase) {
  const r = Math.random;
  switch (exerciseId) {
    case 'squats': {
      const kneeAngle = drift(prev?.kneeAngle ?? 160, phase === 'down' ? 80 : 165, 0.35);
      const backAngle = drift(prev?.backAngle ?? 65, r() < 0.12 ? 35 : 62, 0.25);
      return {
        kneeAngle: Math.round(kneeAngle),
        backAngle: Math.round(backAngle),
        depth: kneeAngle < 95 ? 'good' : kneeAngle < 115 ? 'shallow' : 'standing',
        kneeCave: r() < 0.08,
      };
    }
    case 'pushups': {
      const elbowAngle = drift(prev?.elbowAngle ?? 160, phase === 'down' ? 75 : 165, 0.35);
      const bodyAlignment = Math.max(0, Math.round(drift(prev?.bodyAlignment ?? 4, r() < 0.15 ? 16 : 5, 0.3)));
      return {
        elbowAngle: Math.round(elbowAngle),
        bodyAlignment,
        hipPosition: r() < 0.1 ? 'sagging' : r() < 0.06 ? 'piked' : 'neutral',
        elbowFlare: r() < 0.08,
      };
    }
    case 'biceps_curls': {
      const elbowAngle = drift(prev?.elbowAngle ?? 155, phase === 'down' ? 40 : 160, 0.35);
      return {
        elbowAngle: Math.round(elbowAngle),
        shoulderStability: Math.max(0, Math.round(drift(prev?.shoulderStability ?? 6, r() < 0.12 ? 20 : 6, 0.3))),
        swing: r() < 0.1 ? 'detected' : 'none',
        partialRep: r() < 0.07,
      };
    }
    case 'shoulder_press': {
      const elbowAngle = drift(prev?.elbowAngle ?? 90, phase === 'down' ? 80 : 175, 0.35);
      return {
        elbowAngle: Math.round(elbowAngle),
        armExtension: Math.round(drift(prev?.armExtension ?? 170, r() < 0.12 ? 150 : 172, 0.3)),
        backArch: Math.max(0, Math.round(drift(prev?.backArch ?? 8, r() < 0.12 ? 26 : 8, 0.3))),
      };
    }
    case 'lunges': {
      const frontKneeAngle = drift(prev?.frontKneeAngle ?? 160, phase === 'down' ? 90 : 165, 0.35);
      return {
        frontKneeAngle: Math.round(frontKneeAngle),
        torsoAngle: Math.max(0, Math.round(drift(prev?.torsoAngle ?? 5, r() < 0.12 ? 20 : 5, 0.3))),
        balance: r() < 0.09 ? 'unstable' : 'stable',
        kneeOverToe: r() < 0.09,
      };
    }
    default:
      return {};
  }
}
