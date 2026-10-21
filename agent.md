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

# Phase 5: Client-Side MediaPipe WASM & Exercise Detectors Migration

## 1. Architecture Workflow (Browser-Side Processing)
This phase shifts the application from Streamlit WebRTC to pure client-side browser processing to achieve zero latency and high performance[cite: 22]:
- **User Webcam**: The browser accesses the webcam stream directly using `navigator.mediaDevices.getUserMedia`.
- **HTML5 Video Element**: The stream is played within a hidden or visible video element.
- **MediaPipe WASM (In-Browser)**: The MediaPipe Pose model runs locally within the browser to analyze each frame.
- **33 Pose Landmarks Object**: 33 keypoints (joint coordinates and visibility) are extracted from the model[cite: 22].
- **HTML5 Canvas**: Skeleton overlays and joint angles are drawn directly onto the canvas[cite: 22].

## 2. Core Base Exercise Class
**File Path:** `src/core/base_exercise.js`

- **Instructions:**
  - Port the Python `BaseExercise` abstract class into JavaScript (ES6 class).
  - Implement the `calculate_angle(a, b, c)` method using vector dot products and `Math.acos` to compute the angle between three points (A, B, C) in degrees.
  - Create the `get_point(landmarks, idx)` method to return `(x, y)` coordinates from a landmark index.
  - Keep `process(landmarks)` and `reset()` methods as abstract/placeholders to be overridden by child classes.

## 3. Exercise Detectors Implementation
All detectors must be built as JavaScript classes inside the `src/detectors/` folder:

### A. Squat Detector
**File Path:** `src/detectors/squat.js`
- **Logic:** Calculate left/right hip, knee, and ankle angles. If the knee angle is `< 100`, the stage becomes `"down"`. When the angle goes `>= 160` while the stage is `"down"`, increment the rep count by `+1`. Return the depth status (`GOOD DEPTH`, `TOO HIGH`, `STANDING`).

### B. Biceps Curl Detector
**File Path:** `src/detectors/biceps_curl.js`
- **Logic:** Calculate the elbow angle between the shoulder, elbow, and wrist. Thresholds: UP `< 50`, DOWN `> 160`. Also port the logic to check elbow drift and torso swing status (`NO SWING` / `SWINGING`).

### C. Lunges Detector
**File Path:** `src/detectors/lunges.js`
- **Logic:** Calculate the front knee angle (`DOWN_THRESHOLD = 100`, `UP_THRESHOLD = 160`). Calculate the torso angle and return the balance status (`BALANCED` / `OFF BALANCE`).

### D. Push-up Detector
**File Path:** `src/detectors/pushup.js`
- **Logic:** Calculate the elbow angle (`DOWN = 90`, `UP = 160`) and body alignment angle. Track the hip sag status (`LEVEL`, `SAGGING`, `PIKED UP`).

### E. Shoulder Press Detector
**File Path:** `src/detectors/shoulder_press.js`
- **Logic:** Calculate the elbow angle (`UP = 160`, `DOWN = 90`) and back arch status (`Neutral`, `Slight Arch`, `Excessive Arch`).


## 4. UI & Video Integration Component
**File Path:** `src/components/WorkoutPanel.jsx`

- **Instructions:**
  - When the user clicks the **START WORKOUT** button, render the HTML5 `<video>` and `<canvas>` elements in the right panel.
  - Initialize the live camera feed by calling the browser's `navigator.mediaDevices.getUserMedia`.
  - Initialize the MediaPipe Pose model and run the active exercise detector class's `process(landmarks)` method on every frame via a `requestAnimationFrame` loop.
  - Update real-time values returned by the detectors (such as total reps, current set reps, knee angle, depth status) in the state and render them dynamically onto the left panel's metric cards.

## Code Gig Deliverables (DevMarketplace Requirement)

The agent must produce two modular, reusable code modules:

1. **`reusable-auth-module`**: Standalone React hook/component for user sign-in and session state management.
2. **`ai-workout-coaching-service`**: Modular JS library connecting MediaPipe Pose events to Groq LLM API and Web Speech TTS.

## 5. Runtime Stability & Performance Directives (Active Execution Notes)
- **Single Model Initialization:** Initialize the MediaPipe `PoseLandmarker` strictly once using a persistent reference (`poseLandmarkerRef`) to prevent continuous re-loading loops or "Loading MediaPipe Pipeline" UI flickers on frames/movement.
- **Canvas-Video Synchronization:** Dynamically align HTML5 canvas width and height with the video element's natural dimensions for precise skeleton joint overlays.
- **State Persistence:** Ensure exercise detector state machines (`stage: 'up'` / `'down'`) persist correctly across frames so that rep counts increment accurately.
