/** Draw a high-contrast connected pose skeleton on the camera canvas. */
const CONNECTIONS = [
  [11,12], [11,13], [13,15], [12,14], [14,16],
  [11,23], [12,24], [23,24],
  [23,25], [25,27], [27,29], [29,31], [27,31],
  [24,26], [26,28], [28,30], [30,32], [28,32],
  [15,17], [15,19], [15,21], [16,18], [16,20], [16,22],
];
const JOINTS = [11,12,13,14,15,16,23,24,25,26,27,28,29,30,31,32];

export function drawPose(canvas, landmarks) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks?.length) return;

  // Scale line thickness with the displayed video resolution; keep it clearly visible.
  const scale = Math.min(canvas.width, canvas.height);
  const lineWidth = Math.max(4, Math.min(7, scale * 0.012));
  const radius = Math.max(3, Math.min(5, scale * 0.009));
  const visible = (p) => p && (p.visibility == null || p.visibility >= 0.4);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#32F5C1';
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = 'rgba(50,245,193,0.8)';
  ctx.shadowBlur = 7;

  for (const [from, to] of CONNECTIONS) {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.stroke();
  }

  // Small high-contrast joint markers, like the reference, without replacing the lines.
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#F7FFFD';
  ctx.strokeStyle = '#32F5C1';
  ctx.lineWidth = Math.max(2, lineWidth * 0.45);
  for (const idx of JOINTS) {
    const p = landmarks[idx];
    if (!visible(p)) continue;
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
