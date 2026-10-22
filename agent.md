# AI Real-Time Gym Coach — AI Agent Execution Guide

## Overview & Architecture Context
You are tasked with building and executing the **AI Real-Time Gym Coach** application within the DevMarketplace platform using a modern web-native stack. 
To ensure full compatibility with DevMarketplace's supported runtimes (Vite / React):
- **Frontend Stack**: Vite + React + Tailwind CSS (or custom CSS matching the dark luxury theme).
- **Computer Vision**: `@mediapipe/tasks-vision` (JavaScript SDK) running client-side in the browser via WebAssembly/WebGL.
- **AI Coaching Engine**: Groq API (Llama 3.3 70B) for generating concise coaching cues.
- **Voice Output**: Browser-native `SpeechSynthesis` API (Web Speech API).
- **Data Persistence**: DevMarketplace Built-in Database or LocalStorage for user profiles and session history.


## Project Folder Structure (Root)
Ensure the repository follows this layout:
```text
ai-realtime-gym-coach/
├── package.json          # NPM dependencies (React, MediaPipe, Vite)
├── vite.config.js       # Vite configuration
├── index.html           # HTML Entry point
├── src/
│   ├── assets/          # Fonts (AdobeClean.otf) & styles
│   ├── components/      # UI Components (Sidebar, Dashboard, Metrics, History)
│   ├── core/            # BaseExercise.js, stateManager.js
│   ├── detectors/       # Exercise logic files (Squats, Push-ups, Biceps Curls, etc.)
│   ├── services/        # Database, Auth, and API integrations
│   ├── App.jsx          # Main React App layout
│   └── main.jsx         # React Entry Point


## Phase Breakdown & Execution Roadmap

### Phase 1: Project Setup, Boilerplate & Sidebar UI

* **Goal**: Initialize Vite + React project, install mandatory dependencies, configure styles, and build the interactive sidebar/dashboard layout.
* **Tasks**:
1. Create `package.json` with required dependencies (`@mediapipe/tasks-vision`, `react`, `react-dom`, `lucide-react`, `vite`).
2. Implement global styling (`style.css`) supporting `#0A0D14` background and `AdobeClean` typography.
3. Build `Sidebar.jsx` component for managing exercise options, target sets, reps configuration, and session start/end states.
4. Setup core state management (`stateManager.js`) to track reps, current set progress, and exercise metrics.



### Phase 2: Client-Side Pose Detection & Angle Engine (`BaseExercise.js`)

* **Goal**: Implement MediaPipe Pose Landmarker in JavaScript and establish deterministic angle calculations.
* **Tasks**:
1. Initialize `PoseLandmarker` from `@mediapipe/tasks-vision` using WebGL delegate.
2. Access browser webcam using `navigator.mediaDevices.getUserMedia()` and stream to an HTML5 `<video>` / `<canvas>` overlay.
3. Implement `BaseExercise.js` containing the 2D joint-angle calculation method:

$$\theta = \arccos\left(\max\left(-1.0, \min\left(1.0, \frac{\mathbf{a} \cdot \mathbf{c}}{\vert{}\mathbf{a}\vert{}\vert{}\mathbf{c}\vert{}}\right)\right)\right) \times \frac{180}{\pi}$$



### Phase 3: Exercise Detectors & Real-Time Metrics

* **Goal**: Implement deterministic state machines and angle thresholds for the 5 target exercises.
* **Tasks**:
1. **Squats**: Track knee and back angles; monitor depth status.
2. **Push-ups**: Track elbow angles and body/hip alignment.
3. **Biceps Curls**: Track elbow movement and torso swing.
4. **Shoulder Press**: Track elbow extension and back arch.
5. **Lunges**: Track front knee angle and balance status.
6. Update sidebar progress metrics dynamically in real time as the user performs reps.


### Phase 4: Groq LLM Coaching, Speech Synthesis & Persistence

* **Goal**: Integrate context-aware AI feedback, voice output, and session history logging.
* **Tasks**:
1. Connect Groq API (`Llama 3.3 70B`) to trigger concise cues on supported workout events.
2. Implement text-to-speech using `window.speechSynthesis`.
3. Configure the DevMarketplace Built-in Database to save workout sessions (`user_id`, `exercise_name`, `reps`, `sets`, `time`, `timestamp`).
4. Render persistent workout history in a clean data table component.

# Phase 5: Client-Side MediaPipe WASM, Canvas Skeleton Drawing & Exercise Detectors Migration

## 1. Architecture Workflow (Browser-Side Processing)
This phase shifts the application from Streamlit WebRTC to pure client-side browser processing to achieve zero latency and high performance:
- **User Webcam**: The browser accesses the webcam stream directly using `navigator.mediaDevices.getUserMedia`.
- **HTML5 Video Element**: The stream is played within a hidden or visible video element.
- **MediaPipe WASM (In-Browser)**: The MediaPipe Pose model runs locally within the browser in the background (no visible loading screen on video feed).
- **33 Pose Landmarks Object**: 33 keypoints (joint coordinates and visibility) are extracted from the model.
- **HTML5 Canvas**: Skeleton overlays and joint angles are drawn directly onto the canvas.

## 2. Skeleton Overlay & Canvas Drawing (`src/core/drawing.js`)
- **Connected Skeleton Lines**: Do NOT draw only isolated joint dots. Use MediaPipe's `POSE_CONNECTIONS` to draw thick, bright, connected skeleton lines between keypoints (shoulders, elbows, wrists, hips, knees, ankles) using `ctx.stroke()`.
- Synchronize canvas clearing and drawing smoothly with the live camera frames using `requestAnimationFrame`.

## 3. Core Base Exercise Class (`src/core/base_exercise.js`)
- Implement `calculate_angle(a, b, c)` using vector dot products and `Math.acos`.
- Create `get_point(landmarks, idx)` to extract `(x, y)` coordinates.
- Abstract methods: `process(landmarks)` and `reset()`.

## 4. Exercise Detectors Implementation (`src/detectors/`)
All 5 exercises must feature strict state machines, proper thresholds, and dynamic form accuracy:

### A. Squat Detector (`src/detectors/squat.js`)
- Knee angle: `< 100` = `"down"`, `>= 160` = `"up"` (Increments rep count).
- Track depth status (`GOOD DEPTH`, `TOO HIGH`, `STANDING`).

### B. Biceps Curl Detector (`src/detectors/biceps_curl.js`)
- Elbow angle: `< 50` = `"up"`, `> 160` = `"down"`.
- Track torso swing and elbow drift.

### C. Lunges Detector (`src/detectors/lunges.js`)
- Front knee angle: `DOWN = 100`, `UP = 160`. Track balance status.

### D. Push-up Detector (`src/detectors/pushup.js`)
- Elbow angle: `DOWN = 90`, `UP = 160`. Track hip sag alignment.

### E. Shoulder Press Detector (`src/detectors/shoulder_press.js`)
- Elbow angle: `UP = 160`, `DOWN = 90`. Track back arch.

## 5. UI Integration, Set Progression & Metrics (`src/components/WorkoutPanel.jsx`)

### A. Set Progression & Rest Timer
- Initial State: `Sets Completed` starts at `0 / Target Sets` (e.g., `0/3`).
- When `Current Set Reps` reaches the target (e.g., `10/10`):
  1. Trigger a **10-second rest timer** countdown on screen.
  2. After 10 seconds complete, increment `Sets Completed` by 1 (e.g., `1/3`) and reset `Current Set Reps` to `0`.
- **Target Completed Popup**: When `Sets Completed` reaches the final target (e.g., `3/3`), show a prominent **"Target Completed! Great Job!"** popup modal directly in the center of the UI and stop accepting new reps.

### B. Live Metrics & Analytics
- **Calories Burned**: Dynamically compute calories burned based on exercise MET value, user duration, and completed reps.
- **Exercise Duration**: Display live workout duration timer (e.g., how long the user has been performing squats/biceps curls).
- **Dynamic Accuracy (No Hardcoding)**: Do NOT hardcode accuracy to 100%. Calculate dynamic accuracy percentage based on rep form quality, smooth angle ranges, and form warning deductions.

## 6. Code Deliverables
1. `reusable-auth-module`: Standalone React hook/component for sign-in and session state.
2. `ai-workout-coaching-service`: JS library connecting MediaPipe Pose events to Groq LLM API and Web Speech TTS.

## 5. Runtime Stability & Performance Directives (Active Execution Notes)
- **Single Model Initialization:** Initialize the MediaPipe `PoseLandmarker` strictly once using a persistent reference (`poseLandmarkerRef`) to prevent continuous re-loading loops or "Loading MediaPipe Pipeline" UI flickers on frames/movement.
- **Canvas-Video Synchronization:** Dynamically align HTML5 canvas width and height with the video element's natural dimensions for precise skeleton joint overlays.
- **State Persistence:** Ensure exercise detector state machines (`stage: 'up'` / `'down'`) persist correctly across frames so that rep counts increment accurately.
