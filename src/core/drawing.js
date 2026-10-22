// Local pose connections to avoid bundling @mediapipe/pose directly.
// Index pairs follow the MediaPipe pose landmark indices.
const POSE_CONNECTIONS = [
  // Shoulders
  [11, 12],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Torso
  [11, 23],
  [12, 24],
  [23, 24],
  // Hips to knees
  [23, 25],
  [24, 26],
  // Knees to ankles
  [25, 27],
  [26, 28],
];

/** Draw a high-contrast connected pose skeleton on the camera canvas. */
export function drawPose(canvas, landmarks) {
  if (!canvas || !landmarks?.length) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear old frame.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(canvas.width, canvas.height) || 1;
  const lineWidth = Math.max(3, Math.min(6, scale * 0.012));
  const radius = Math.max(3, Math.min(5, scale * 0.009));

  // OpenCV style strict visibility threshold (0.5 minimum)
  const visible = (p) => p && (p.visibility == null || p.visibility >= 0.5);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Skeleton lines
  ctx.strokeStyle = '#32F5C1';
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = 'rgba(50,245,193,0.8)';
  ctx.shadowBlur = 7;

  for (const [from, to] of POSE_CONNECTIONS) {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b) continue;
    if (!visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.stroke();
  }

  // Joint circles on top
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#F7FFFD';
  ctx.strokeStyle = '#32F5C1';
  ctx.lineWidth = Math.max(2, lineWidth * 0.45);

  const drawn = new Set();
  for (const [from, to] of POSE_CONNECTIONS) {
    for (const idx of [from, to]) {
      if (drawn.has(idx)) continue;
      drawn.add(idx);
      const p = landmarks[idx];
      if (!p) continue;
      if (!visible(p)) continue;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Export POSE_CONNECTIONS for testing/diagnostics
export { POSE_CONNECTIONS };