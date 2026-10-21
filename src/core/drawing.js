/**
 * Draw MediaPipe pose landmarks and skeleton on a canvas overlay.
 * Uses the DrawingUtils exported by @mediapipe/tasks-vision.
 *
 * The canvas is mirrored via CSS (-scale-x-100) to match the mirrored video
 * preview, so we draw landmarks in the original coordinate space.
 */

export function drawPose(canvas, landmarks, PoseLandmarker, DrawingUtils) {
  if (!canvas || !landmarks?.length) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Keep canvas clearing in drawing function for fresh frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const utils = new DrawingUtils(ctx);

  // Draw connecting skeleton lines using MediaPipe POSE_CONNECTIONS
  utils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: 'rgba(16, 185, 129, 0.85)',
    lineWidth: 3,
  });

  // Draw landmark points
  utils.drawLandmarks(landmarks, {
    color: 'rgba(245, 158, 11, 0.9)',
    fillColor: 'rgba(245, 158, 11, 0.9)',
    lineWidth: 1,
    radius: 4,
  });
}
