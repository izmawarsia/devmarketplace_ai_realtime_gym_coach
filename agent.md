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



## Code Gig Deliverables (DevMarketplace Requirement)

The agent must produce two modular, reusable code modules:

1. **`reusable-auth-module`**: Standalone React hook/component for user sign-in and session state management.
2. **`ai-workout-coaching-service`**: Modular JS library connecting MediaPipe Pose events to Groq LLM API and Web Speech TTS.

