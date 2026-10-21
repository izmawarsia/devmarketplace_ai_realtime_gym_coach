# Apna AI Coach — Phase 5

AI Real-Time Gym Coach. Phase 5 wires the browser-side MediaPipe WASM pose
pipeline to the React UI, implements the shared `BaseExercise` detector class,
and adds deterministic exercise detectors for all five supported movements.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What's in Phase 5

- **Browser-only MediaPipe pipeline** in `src/components/WorkoutPanel.jsx`:
  - `navigator.mediaDevices.getUserMedia` camera access.
  - `@mediapipe/tasks-vision` `PoseLandmarker` running locally via WebAssembly.
  - Canvas skeleton/landmark overlay drawn at camera frame rate.
  - Live telemetry fed to the active exercise detector on every `requestAnimationFrame` tick.
- **Base exercise detector** in `src/core/base_exercise.js`:
  - 2D joint-angle calculation, landmark visibility helpers, smoothing, and a
    shared up/down state machine that drives rep counting and set progression.
- **Per-exercise detectors** in `src/detectors/`:
  - `squat.js` — knee/back angle, depth status.
  - `pushup.js` — elbow angle, body alignment, hip sag/pike.
  - `biceps_curl.js` — elbow angle, shoulder stability, swing detection.
  - `shoulder_press.js` — elbow/arm-extension angle, back-arch angle.
  - `lunges.js` — front-knee angle, torso angle, balance status.
- **Live UI** updates:
  - Header tab is now **Workout** and shows the logged-in user's initials with an
    active-status dot.
  - Active session shows the real webcam feed + skeleton overlay, progress
    tracking cards, and exercise-specific telemetry cards.
  - Telemetry initializes to safe defaults (`0°` / `N/A`) until MediaPipe
    returns real values.
- **History persistence** is client-side only (`localStorage`) for this phase.
  Workouts reset if browser storage is cleared.

## Stack

React 18 + Vite, Tailwind CSS (dark theme `#0b0d12` / `#12151e` / `#181c28`,
accent `#f59e0b`), lucide-react icons, `@mediapipe/tasks-vision`.

## Notes

- No backend or LLM dependencies are included in this phase. The app runs
  entirely in the browser and needs only camera permission.
- Workout history is stored in `localStorage` per logged-in username.
