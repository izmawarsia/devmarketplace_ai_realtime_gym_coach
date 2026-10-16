# AI Real-Time Gym Coach — Project Specification

## 1. Project Title

**AI Real-Time Gym Coach: Your Personal AI Fitness Companion**

## 2. Problem Statement

People who exercise at home, particularly beginners and students with limited budgets, often lack access to a personal fitness trainer. They may struggle to count repetitions accurately, maintain consistent exercise technique, and receive timely feedback while working out.

Existing workout videos demonstrate exercises but generally do not analyze users' live movements, automatically count repetitions, or respond to exercise-specific events.

Hiring a personal trainer can be expensive, while exercising without feedback may leave users uncertain about their technique and progress.

**Problem:** How can we make basic, interactive workout guidance more accessible to people who cannot regularly access a personal trainer?


## 3. Target Users

- Students and budget-conscious individuals.
- Beginners who need basic workout guidance.
- Home-workout users who want real-time feedback.
- Fitness enthusiasts who want automated repetition counting and workout tracking.

## 4. Proposed Solution

AI Real-Time Gym Coach is a camera-based fitness companion that uses computer vision to track body movements, count exercise repetitions, identify selected form indicators, and deliver AI-generated spoken coaching.

The application combines real-time pose estimation, exercise-specific detection logic, an LLM coaching service, text-to-speech, secure user authentication, and persistent workout-history storage.

Users can create an account, sign in securely, configure their workouts, receive feedback while exercising, and review their previous sessions.

## 5. Why This Project Matters

- **Computer Vision:** Tracks body landmarks using MediaPipe.
- **Rule-Based AI:** Interprets joint angles and exercise-specific movement patterns.
- **Real-Time Processing:** Processes webcam frames and updates workout metrics.
- **Voice Generation:** Converts coaching messages into spoken feedback.
- **LLM-Based Coaching:** Generates contextual messages for supported workout events.
- **Secure User Access:** Provides account registration, sign-in, and two-factor authentication.
- **Persistent Progress Tracking:** Stores workout history so users can review their activity across sessions.

The goal is to combine movement tracking and interactive coaching in one accessible workout experience.

## 6. Features

### 6.1 User Authentication and Accounts

- User sign-up and sign-in.
- Email verification where supported by the selected authentication provider.
- Two-factor authentication (2FA).
- Secure session management and sign-out.
- Individual user profiles.
- Private workout history associated with the authenticated user.

### 6.2 Workout Planning

- Select an available exercise.
- Configure target sets and repetitions.
- Start and monitor a workout session.

### 6.3 Real-Time Pose Detection

- Capture live webcam frames.
- Estimate body landmarks using MediaPipe Pose Landmarker.
- Display the detected skeleton over the camera feed.
- Use landmark visibility and joint geometry to support exercise analysis.

### 6.4 Exercise Tracking

The planned MVP supports five exercises:

1. Squats
2. Push-ups
3. Dumbbell biceps curls
4. Shoulder presses
5. Lunges
Each exercise uses exercise-specific movement logic.

### 6.5 Repetition and Set Counting

- Detect transitions between exercise movement phases.
- Count repetitions using exercise-specific conditions.
- Track repetitions completed in the current set.
- Display completed sets and overall workout progress.

### 6.6 Form Indicators and Feedback

- **Squats:** Knee angle and a basic depth indicator.
- **Push-ups:** Elbow angle and body/hip alignment.
- **Biceps curls:** Elbow movement and torso swing.
- **Shoulder presses:** Elbow extension and a basic back-arch indicator.
- **Lunges:** Front-knee angle, torso position, and a basic balance indicator.
These are approximate, pose-based indicators rather than clinically validated assessments.

### 6.7 AI-Generated Coaching

- Generate concise messages for supported workout events.
- Provide encouragement at selected milestones.
- Generate selected corrective cues based on detector output.
- Convert coaching messages into speech.
- Handle unavailable AI services gracefully.

### 6.8 Workout History

- Save exercise-session statistics in a persistent database.
- Record exercise name, repetitions, sets, duration, and timestamp.
- Associate workout records with the authenticated user.
- Retrieve previous sessions after the user signs in again.

## 7. User Journey

1. **Create an account:** The user signs up using the application's registration form.
2. **Secure the account:** The user verifies their identity and completes the configured 2FA setup.
3. **Sign in:** The user authenticates and accesses their personal dashboard.
4. **Configure a workout:** The user selects an exercise and sets a repetition and set target.
5. **Start the camera:** The application estimates body landmarks from the webcam.
6. **Exercise in real time:** The system counts repetitions and displays supported movement indicators.
7. **Receive AI coaching:** Relevant workout events trigger generated coaching messages and spoken feedback.
8. **Complete the session:** The user reviews their workout statistics.
9. **Track progress:** The application saves the session and displays the user's previous workout history on subsequent visits.

## 8. AI Feature and Technical Approach

### Processing Pipeline

1. Capture webcam frames.
2. Estimate body landmarks using MediaPipe Pose Landmarker.
3. Calculate relevant joint angles and body-position indicators.
4. Apply exercise-specific rules to identify movement phases and count repetitions.
5. Update workout metrics and identify supported coaching events.
6. Send relevant event information to the LLM coaching service.
7. Generate concise coaching messages using the configured LLM API.
8. Convert the messages into speech using text-to-speech.
9. Save workout statistics in the persistent database.

**AI design:** Computer vision estimates body position, deterministic exercise logic interprets movement, and the LLM generates natural-language coaching messages.

The LLM does not independently validate exercise form; its feedback depends on the accuracy of the information provided by the movement-detection system.

## 9. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Language & Processing | Python, NumPy | Application logic and numerical calculations |
| UI & Streaming | Streamlit, Streamlit-WebRTC | Dashboard and live webcam feed |
| Computer Vision | MediaPipe Tasks, OpenCV | Pose estimation, landmark tracking, and frame processing |
| AI Coaching | Groq API, Llama 3.3 70B | Context-aware coaching messages |
| Voice Output | gTTS | Text-to-speech coaching |
| Database | SQLite | User profiles and workout history |
| Video Handling | PyAV | Video-frame processing |
| Styling | HTML, CSS | UI styling and landing page |
The final authentication and database implementation must be tested together with the selected application architecture.

## 10. Data Model

### User Profile

- `user_id`: Unique authenticated user identifier.
- `email`: Account email, where applicable.
- `created_at`: Account creation timestamp.
Authentication credentials and 2FA secrets should be managed by the authentication provider, not stored as ordinary application profile fields.

### Workout Record

- `record_id`: Unique workout-record identifier.
- `user_id`: Associated authenticated user.
- `exercise_name`: Exercise performed.
- `reps`: Recorded repetitions.
- `sets`: Recorded sets.
- `duration`: Workout duration.
- `timestamp`: Date and time of the record.

### Relationship and Access Control

One authenticated user can have multiple workout records. Each record belongs to one user.

Database access policies must prevent users from viewing or modifying other users' private workout histories.

## 11. MVP Scope and Buildability

### Must-Have Features

- Sign-up and sign-in.
- Working 2FA.
- Persistent database.
- Live webcam pose visualization.
- Exercise selection and repetition counting.
- Set and workout-progress tracking.
- Selected form indicators.
- Real LLM API calls for coaching.
- Spoken coaching output.
- Persistent workout history.
- A polished, consistent interface.

### Should-Have Features

- Email verification.
- Camera-position instructions.
- Graceful API and camera error handling.
- Fallback coaching messages.
- Workout summaries and progress visualizations.

### Out of Scope for the Initial MVP

- Medical diagnosis or rehabilitation advice.
- Guaranteed injury prevention.
- Advanced personalized training programs.
- A dedicated native mobile application.
- Claims of validated form accuracy without testing.

### Proposed Build Timeline: 19–22 October

### Build Plan: 19–22 October

| Date | Key Milestones |
|---|---|
| **19 Oct** | Finalize architecture, team roles, and project setup. |
| **20 Oct** | Integrate authentication, pose detection, AI coaching, and database. |
| **21 Oct** | Test rep-count accuracy, user access, voice feedback, and fix bugs. |
| **22 Oct** | Deploy, verify the complete workflow, and prepare the final demo. |

## 12. Team Readiness & DevMarketplace Reuse

The team will divide work across frontend, AI/computer vision, backend/database, and testing/deployment according to members' skills.

**Existing Components to Evaluate for Reuse:**

- Streamlit and Streamlit-WebRTC for the interface and webcam streaming.
- MediaPipe and OpenCV for pose estimation and frame processing.
- A suitable authentication service and persistent database.
- Compatible DevMarketplace Code Gigs for authentication, UI, database integration, or API utilities, subject to verification, licensing, and integration testing.

**Planned Team-Created Code Gigs:**

1. **Reusable Authentication Module:** Secure authentication integration and session handling; include 2FA if implemented and tested.
2. **AI Workout Coaching Service:** Converts exercise events into LLM-generated feedback and voice output.

The team will publish at least two reusable Code Gigs created during the hackathon, with setup instructions, usage examples, contributor credits, and appropriate licensing.

## 13. Impact & Evaluation

We will evaluate the MVP through:

- Repetition-counting accuracy against manually counted repetitions.
- Correct detection of selected, predefined form errors.
- Feedback latency during live exercise.
- Successful account creation, sign-in, 2FA, and workout-history persistence.
- End-to-end tests across supported exercises and webcam conditions.

## 14. Risks & Limitations

- Lighting, camera angle, clothing, and occlusion can affect pose detection.
- Rule-based form checks may not work reliably for every body type or exercise variation.
- LLM responses can be inaccurate; coaching will be constrained to detected events.
- Webcam processing and external API availability may affect latency.
- Authentication, database persistence, and deployment must be tested before claiming full support.

## 15. Success Criteria

- Users can securely register and sign in, with 2FA where implemented.
- Supported exercises run with live pose tracking and repetition counting.
- Basic form feedback and AI voice coaching work end to end.
- Workout history persists and can be retrieved.
- The deployed MVP, public repository, documentation, and two team-created Code Gigs are available for evaluation.

## 16. Project Differentiation

Unlike prerecorded workout videos, the application observes the user's live movement, tracks repetitions, identifies predefined form issues, and responds with contextual AI coaching. Its focus is accessible, interactive workout guidance without requiring a personal trainer.

## 17. Future Scope

- More exercises and personalized workout plans.
- Improved movement analysis and progress visualizations.
- Multilingual coaching and accessibility improvements.
- Mobile-friendly experience and integration with wearable devices.

## 18. Final Pitch

**AI Real-Time Gym Coach is an AI-powered fitness companion designed to make interactive workout guidance more accessible to students, beginners, and people exercising at home.**

Using computer vision, the application tracks body landmarks through a webcam, counts repetitions, and identifies selected form indicators across five exercises. Its LLM-based coaching service generates concise messages for supported workout events and delivers them through voice output.

Users can create secure accounts, complete two-factor authentication, configure workouts, and access their personal workout history through a persistent database.

Built with Python, MediaPipe, Streamlit, an LLM API, text-to-speech, and a secure authentication and database service, the project combines real-time movement analysis with interactive spoken coaching.

Alongside the working application, our team will develop and publish at least two reusable DevMarketplace Code Gigs: an authentication module and an AI workout coaching service. This allows us to demonstrate not only a practical AI product but also reusable software components that other developers can integrate into their own projects.

Our immediate goal is to deliver a reliable MVP within the hackathon timeline, evaluate its core functionality, and make basic interactive workout assistance more accessible.

## 19. AI and Reuse Disclosure

The final public repository will document:

- AI development tools used by the team.
- The AI model and API used for coaching.
- Open-source libraries and third-party services integrated into the project.
- Reused DevMarketplace Code Gigs or other components.
- Relevant licenses and attribution.
- Original code and reusable components created by the team during the hackathon.

Only components actually used in the submitted project will be listed as integrated dependencies, and only work genuinely created by the team during the event will be presented as original Code Gigs.
----

**Specification status:** Proposed hackathon MVP. Authentication, 2FA, persistent storage, deployment, and Code Gig publication must be implemented and tested before being claimed as completed.
