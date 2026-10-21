
/**
 * Draw connected body skeleton lines.
 * Joint dots are intentionally disabled.
 */

const SKELETON_CONNECTIONS = [
  [11, 12], // Shoulders

  [11, 13], // Left upper arm
  [13, 15], // Left forearm

  [12, 14], // Right upper arm
  [14, 16], // Right forearm

  [11, 23], // Left torso
  [12, 24], // Right torso
  [23, 24], // Hips

  [23, 25], // Left thigh
  [25, 27], // Left shin
  [27, 29], // Left ankle/heel
  [29, 31], // Left foot

  [24, 26], // Right thigh
  [26, 28], // Right shin
  [28, 30], // Right ankle/heel
  [30, 32], // Right foot

  [15, 17], // Left hand
  [15, 19],
  [15, 21],

  [16, 18], // Right hand
  [16, 20],
  [16, 22],
];

export function drawPose(canvas, landmarks) {
  if (!canvas || !landmarks?.length) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(16, 220, 170, 0.96)";
  ctx.lineWidth = Math.max(3, canvas.width / 300);
  ctx.shadowColor = "rgba(16, 220, 170, 0.35)";
  ctx.shadowBlur = 5;

  for (const [from, to] of SKELETON_CONNECTIONS) {
    const a = landmarks[from];
    const b = landmarks[to];

    if (!a || !b) continue;

    if (
      (a.visibility ?? 1) < 0.35 ||
      (b.visibility ?? 1) < 0.35
    ) {
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.stroke();
  }

  ctx.restore();
}
