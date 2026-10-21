// Deterministic, rule-based form issue detection.
// The LLM (added in a later phase) NEVER judges form — it only words the
// feedback. All judgments come from these threshold rules over pose telemetry.

export const SEVERITY = { GOOD: 'good', WARN: 'warn', BAD: 'bad' };

// Per-exercise rules. Each rule reads a telemetry value and returns an issue
// (or null). Thresholds mirror the deterministic MediaPipe angle checks.
export const FORM_RULES = {
  squats: {
    metrics: [
      { key: 'kneeAngle', label: 'Knee Angle', unit: '°' },
      { key: 'backAngle', label: 'Back Angle', unit: '°' },
      { key: 'depth', label: 'Depth Status', unit: '' },
    ],
    rules: [
      { check: (t) => t.backAngle < 45, issue: 'Excessive forward lean — keep chest up', metric: 'backAngle' },
      { check: (t) => t.depth === 'shallow', issue: 'Squat too shallow — hips below knees', metric: 'depth' },
      { check: (t) => t.kneeCave, issue: 'Knees caving inward — push them out', metric: 'kneeAngle' },
    ],
  },
  pushups: {
    metrics: [
      { key: 'elbowAngle', label: 'Elbow Angle', unit: '°' },
      { key: 'bodyAlignment', label: 'Body Alignment', unit: '°' },
      { key: 'hipPosition', label: 'Hip Position', unit: '' },
    ],
    rules: [
      { check: (t) => t.hipPosition === 'sagging', issue: 'Hips sagging — brace your core', metric: 'hipPosition' },
      { check: (t) => t.hipPosition === 'piked', issue: 'Hips too high — lower into a plank line', metric: 'hipPosition' },
      { check: (t) => t.bodyAlignment > 12, issue: 'Body not in a straight line', metric: 'bodyAlignment' },
      { check: (t) => t.elbowFlare, issue: 'Elbows flaring too wide — tuck to ~45°', metric: 'elbowAngle' },
    ],
  },
  biceps_curls: {
    metrics: [
      { key: 'elbowAngle', label: 'Elbow Angle', unit: '°' },
      { key: 'shoulderStability', label: 'Shoulder Stability', unit: '°' },
      { key: 'swing', label: 'Swing Detection', unit: '' },
    ],
    rules: [
      { check: (t) => t.swing === 'detected', issue: 'Momentum swing detected — slow down', metric: 'swing' },
      { check: (t) => t.shoulderStability > 15, issue: 'Shoulder drifting forward — pin elbows at sides', metric: 'shoulderStability' },
      { check: (t) => t.partialRep, issue: 'Partial range of motion — fully extend at bottom', metric: 'elbowAngle' },
    ],
  },
  shoulder_press: {
    metrics: [
      { key: 'elbowAngle', label: 'Elbow Angle', unit: '°' },
      { key: 'armExtension', label: 'Arm Extension', unit: '°' },
      { key: 'backArch', label: 'Back Arch', unit: '°' },
    ],
    rules: [
      { check: (t) => t.backArch > 20, issue: 'Lower back over-arched — engage core', metric: 'backArch' },
      { check: (t) => t.armExtension < 165, issue: 'Incomplete lockout — press fully overhead', metric: 'armExtension' },
    ],
  },
  lunges: {
    metrics: [
      { key: 'frontKneeAngle', label: 'Front Knee Angle', unit: '°' },
      { key: 'torsoAngle', label: 'Torso Angle', unit: '°' },
      { key: 'balance', label: 'Balance Status', unit: '' },
    ],
    rules: [
      { check: (t) => t.kneeOverToe, issue: 'Front knee past toes — step wider', metric: 'frontKneeAngle' },
      { check: (t) => t.torsoAngle > 15, issue: 'Torso leaning — stay upright', metric: 'torsoAngle' },
      { check: (t) => t.balance === 'unstable', issue: 'Balance unstable — slow the descent', metric: 'balance' },
    ],
  },
};

// Evaluate telemetry for an exercise; returns { issues, metricStatus }.
// metricStatus maps metric key → severity for coloring the telemetry cards.
export function analyzeForm(exerciseId, telemetry) {
  const spec = FORM_RULES[exerciseId];
  if (!spec || !telemetry) return { issues: [], metricStatus: {} };
  const issues = [];
  const metricStatus = {};
  for (const rule of spec.rules) {
    if (rule.check(telemetry)) {
      issues.push(rule.issue);
      metricStatus[rule.metric] = SEVERITY.BAD;
    }
  }
  for (const m of spec.metrics) {
    if (!metricStatus[m.key]) metricStatus[m.key] = SEVERITY.GOOD;
  }
  return { issues, metricStatus };
}
