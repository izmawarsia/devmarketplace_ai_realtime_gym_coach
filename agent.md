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

### Phase 6: Production-Ready Authentication System (`Auth.jsx` / `Login.jsx`)

Please create or update the full authentication module (`src/components/Auth.jsx` or `Login.jsx`) with a highly polished, modern UI matching the application's existing design theme and color palette. Ensure smooth transitions between forms and robust backend handling with Supabase Auth.
using our connected supabase database. 
#### 1. Visual & UI Requirements:
- Match the existing app's design system (Tailwind classes, color tokens, dark/light theme accents, rounded corners, glassmorphism, or modern dark cards).
- Include interactive tab/toggle switching between "Sign In", "Sign Up", and "Forgot Password".
- Form fields must have crisp input styling, clear placeholder text, focus rings, field validation messages, and loading spinners during asynchronous operations.

#### 2. Sign In (Login) Flow:
- Input fields: **Email** (or Username) and **Password**.
- Authenticate credentials directly using Supabase Auth (`supabase.auth.signInWithPassword`).
- If credentials are valid, route the user to the main Exercise Tracker Dashboard.
- Provide clear error toasts/alerts for incorrect passwords or non-existent accounts.
- Include a **"Forgot Password?"** link below the password field.

#### 3. Forgot & Reset Password Flow:
- When "Forgot Password?" is clicked, prompt for the user's **Email**.
- Trigger Supabase password reset email:
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://your-app-url/reset-password' })`
- When the user clicks the magic link in their email, redirect them back to the app on the Reset Password view.
- Allow the user to input their new password, verify it, and save via `supabase.auth.updateUser({ password: newPassword })`.
- Show a success confirmation banner and trigger an email notification (or UI toast confirmation) stating: *"Your password has been successfully changed."*
- Auto-redirect the user back to the Sign In screen upon completion.

#### 4. Sign Up (Create Account) Flow:
- Input fields: **Username**, **Email**, **Password**, and **Confirm Password**.
- Validate that `Password === Confirm Password` and that password criteria (e.g., length >= 6) are met.
- Trigger sign-up with OTP email verification enabled in Supabase (`supabase.auth.signUp({ email, password, options: { data: { username } } })`).
- Show an **OTP / Verification Code Screen** where the user enters the code sent to their email.
- Verify the code using `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
- Upon successful verification, auto-populate the custom user profile into `public.users` table (`id`, `username`, `email`) and redirect to the dashboard.

#### 5. Social Authentication (OAuth):
- Include a prominent **"Sign up / Sign in with Google"** button using Supabase OAuth provider (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
- Handle OAuth callback seamlessly without breaking the UI session.

# Phase 7: React Landing Page & Auth Navigation Integration

## Objective
Implement a sleek, modern, dark-themed Landing Page in React matching the provided HTML/CSS design (inspired by "Real-time AI GYM Trainer")[cite: 3, 4, 5, 6, 7]. Ensure seamless integration with the existing `Auth.jsx` component and application workflow.

---

## Technical & Design Requirements

### 1. Theme & Design System
* **Theme:** Premium Dark Mode (`#0a0a0a` background, `#111111` surface card backgrounds)[cite: 3, 4, 5, 6, 7].
* **Accents:** Amber/Gold (`#f5a623`) and Cyan (`#00d4ff`) highlights and glows[cite: 3, 4, 5, 6, 7].
* **Fonts:** Use Google Fonts (`Ubuntu` and `Instrument Serif`) along with standard monospace for metrics[cite: 3, 4].
* **Overlay:** Grid overlay background pattern with smooth radial gradient masking[cite: 3].

---

## Key Page Sections & Components

### A. Navigation Bar (`Nav`)
* **Logo:** `(AI GYM COACH)` with amber brackets[cite: 3].
* **Links:** `Gallery` (`#visuals`), `Demo` (`#demo`), `Contact` (`#contact`)[cite: 3].
* **Styling:** Sticky top bar with smooth blur effect (`backdrop-filter: blur`)[cite: 3].

### B. Hero Section
* **Badge:** `AI-POWERED · REAL-TIME · GYM COACH` tag with an animated glowing dot[cite: 3].
* **Main Heading:**
  * Line 1: `REAL-TIME`[cite: 3]
  * Line 2: `AI GYM COACH` with gradient text fill (`#ffffff` -> `#f5a623` -> `#00d4ff`)[cite: 3].
* **Sub-headline:** *"Your form. Analyzed. Corrected. In milliseconds. Computer vision that watches every rep and tells you exactly what to fix."*[cite: 3]
* **Call to Action Buttons:**
  1. **"Try It Live" (Primary Button):** Clicking this MUST navigate or trigger the display of `Auth.jsx` (Sign In / Sign Up modal or route)[cite: 3, 4].
  2. **"Watch Demo" (Ghost Button):** Smoothly scrolls down to the `#demo-video` section[cite: 3].
* **Metrics Strip:** Display live statistics cards:
  * `100ms` Avg Latency[cite: 3, 4]
  * `5+` Exercises[cite: 3, 4]
  * `95%` Form Accuracy[cite: 3, 4]

### C. Gallery Section (`#visuals`)
* **Header:** `// GALLERY` tag with *"Built for real athletes"* heading[cite: 3, 5].
* **Grid Cards:** Render 6 image preview cards featuring scan line animations, corner brackets, and slight floating tilt effects[cite: 3].

### D. Demo Video Section (`#demo`)
* **Header:** `// DEMO` tag with *"See it in action"* heading[cite: 3, 6].
* **Video Frame:** Embedded video container with corner frame accents and a pulsing status indicator[cite: 3].
* **Feature Badges:** 4 feature callouts (`Pose Detection`, `Audio Feedback`, `Rep Counter`, `Works in Real-time`)[cite: 3].

### E. Contact & Footer Section (`#contact`)
* **Header:** `// LET'S CONNECT` tag with *"Built by a human. Backed by data."* heading[cite: 3, 7].
* **Social Links:** Interactive buttons for LinkedIn, GitHub, Twitter/X, and Gmail[cite: 3, 7].
* **Footer:** Copyright notice for AI GYM Trainer[cite: 3].

---

## Application Navigation Logic

## Code Gig Deliverables (DevMarketplace Requirement)

The agent must produce two modular, reusable code modules:

1. **`reusable-auth-module`**: Standalone React hook/component for user sign-in and session state management.
2. **`ai-workout-coaching-service`**: Modular JS library connecting MediaPipe Pose events to Groq LLM API and Web Speech TTS.

