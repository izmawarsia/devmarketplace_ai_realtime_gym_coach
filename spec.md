# AI Real-Time Gym Coach — Project Specification

## 1. Project Title

**AI Real-Time Gym Coach: Your Personal AI Fitness Companion**

## 2. Problem Statement

People who exercise at home, particularly students, beginners, and budget-conscious individuals, often lack access to personal fitness trainers. They may struggle to count repetitions, maintain proper exercise technique, and receive timely feedback during workouts.

Traditional workout videos demonstrate exercises but do not respond to a user's live movements, automatically count repetitions, or provide feedback based on their current exercise performance.

**Problem:** How can we make interactive, real-time workout guidance more accessible to people who cannot regularly access a personal trainer?

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

Authentication must be implemented using a real authentication service or a properly secured backend, rather than a username-only entry field.

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
| Main language | Python | Application and exercise logic |
| User interface | Streamlit | Workout dashboard and controls |
| Camera streaming | Streamlit-WebRTC | Live webcam input |
| Pose estimation | MediaPipe Tasks | Body-landmark detection |
| Image processing | OpenCV | Frame processing and skeleton overlays |
| Numerical processing | NumPy | Landmark and angle calculations |
| AI coaching | Groq API and Llama 3.3 70B, or the selected supported LLM | Coaching-message generation |
| Voice generation | gTTS | Text-to-speech |
| Authentication | Supabase Auth or another verified authentication provider | Sign-up, sign-in, and 2FA |
| Persistent database | Supabase PostgreSQL or another suitable persistent database | User-linked workout history |
| Video processing | PyAV | Video-frame handling |
| Styling | CSS and HTML | Application styling |

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

**19 October — Kickoff**
- Create the project workspace after the official kickoff.
- Finalize the architecture and assign team responsibilities.
- Set up authentication, database, and application dependencies.
- Establish the initial working application.

**20 October — Core Integration**
- Implement the authenticated user journey.
- Integrate pose detection and exercise tracking.
- Connect the LLM coaching and voice services.
- Save workout records to the persistent database.

**21 October — Testing and Refinement**
- Test registration, sign-in, 2FA, and user-specific data access.
- Compare repetition counts with manual counts.
- Test coaching and speech integration.
- Improve the interface and handle common errors.

**22 October — Deployment and Verification**
- Deploy the application to the selected environment.
- Verify authentication, secrets, webcam access, and database persistence.
- Test the complete user journey.
- Resolve critical issues before submission.

The authentication, database, and webcam integrations should be tested early because deployment constraints can affect their behavior.

## 12. Team Readiness and Reusable DevMarketplace Code Gigs

### 12.1 Reusing Existing Components

The team will prioritize established libraries and reusable components instead of building every technical capability from scratch.

Potential resources include:

- MediaPipe for pose estimation.
- Streamlit-WebRTC for webcam streaming.
- OpenCV and NumPy for video and numerical processing.
- Streamlit components for the application interface.
- An established authentication provider supporting the required 2FA flow.
- Existing DevMarketplace Code Gigs, where a suitable, documented, compatible component is available.

The team will review component documentation, dependencies, security implications, and licenses before integrating any third-party code.

### 12.2 Planned DevMarketplace Code Gigs

The team plans to extract and publish at least two reusable components developed during the hackathon.

**Code Gig 1: Secure Authentication and User Access Module**

**Purpose:** A reusable authentication integration for applications requiring account registration, sign-in, 2FA, and authenticated sessions.

**Planned functionality:**
- Sign-up and sign-in integration.
- 2FA setup and verification through the selected provider.
- Session management and sign-out.
- Authenticated user identification.
- Documentation for configuration and integration.

**Code Gig 2: AI Workout Coaching Service**

**Purpose:** A reusable service that transforms structured exercise events into concise AI-generated coaching messages and connects those messages to speech output.

**Planned functionality:**
- Accept structured exercise events and detected indicators.
- Construct controlled prompts for the LLM.
- Call the configured AI model.
- Return concise coaching messages.
- Integrate text-to-speech output.
- Handle API errors and provide safe fallback messages.

These are proposed deliverables to be implemented and extracted from the team's own hackathon work. They are not claims that these exact Code Gigs already exist on DevMarketplace.

### 12.3 Code Gig Publication Requirements

For each Code Gig, the team will provide:

- A clear, descriptive title.
- A short explanation of the problem it solves.
- Setup instructions and dependencies.
- Usage examples and integration instructions.
- Relevant license information.
- Team-member contributor credits.

The team will publish the components during development rather than waiting until the end of the hackathon.

### 12.4 Team Responsibilities

- **AI/Computer Vision:** Pose detection, movement logic, and repetition-count validation.
- **Backend/Integration:** Authentication, database operations, and API integration.
- **Frontend/UI:** Registration, sign-in, dashboard, and workout interface.
- **Testing/Deployment:** End-to-end validation and deployment reliability.
- **Reusable Components/Documentation:** Extraction, packaging, and publication of Code Gigs.

Responsibilities will be assigned according to the actual team members' skills and availability.

## 13. Impact and Evaluation

| Metric | Evaluation Method |
|---|---|
| Repetition-count agreement | Compare automated counts with manual counts. |
| Form-indicator reliability | Compare detector flags with human-labelled examples. |
| Coaching latency | Measure time from a detected event to spoken feedback. |
| Authentication reliability | Test sign-up, sign-in, 2FA, and session handling. |
| Data privacy | Verify users cannot access other users' workout records. |
| History reliability | Confirm workout data persists across application restarts. |
| Session completion | Measure successful end-to-end workout sessions. |
| User experience | Collect feedback on clarity and usefulness. |

Performance results will be reported only after testing.

## 14. Risks and Limitations

- Camera angle, lighting, and occlusion can affect pose estimation.
- Fixed movement thresholds may not work equally well for every user.
- LLM-generated advice may be inaccurate.
- External AI and speech services may require internet access.
- Authentication and 2FA must be configured correctly to protect accounts.
- Database access policies must enforce user-level data isolation.
- Hosted environments may require deployment-specific configuration.
- The system is not a medical device and cannot guarantee injury prevention.

## 15. Success Criteria

The MVP will be considered ready for submission when:

- Users can register, sign in, and complete 2FA.
- Authenticated users can access their own workout dashboard.
- Pose landmarks are displayed from a live camera feed.
- Repetitions and sets update for supported exercises.
- Supported events can trigger real AI-generated coaching.
- Spoken feedback works under the configured environment.
- Workout statistics persist and can be retrieved after signing in again.
- Users cannot access other users' private workout records.
- The application has a consistent, functional interface.
- At least two reusable Code Gigs have been published with documentation and contributor credits.
- The public repository includes setup instructions and an AI/reuse disclosure.

## 16. Project Differentiation

AI Real-Time Gym Coach combines live body tracking, exercise-specific repetition logic, selected form indicators, AI-generated coaching, spoken feedback, account management, and workout history.

Unlike a static workout video, the system responds to the user's current camera feed and supported workout events.

The project's value lies in integrating these capabilities into an accessible fitness experience and validating their reliability. It does not claim that the individual technologies are unique in the fitness market.

## 17. Future Scope

- Improve exercise-detector accuracy through labelled testing.
- Add confidence-aware pose and form assessment.
- Introduce workout summaries and progress visualizations.
- Explore multilingual coaching.
- Add more exercises after validating the current detectors.
- Improve personalization based on workout history.
- Expand the authentication and security features as the product grows.

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

---

**Specification status:** Proposed hackathon MVP. Authentication, 2FA, persistent storage, deployment, and Code Gig publication must be implemented and tested before being claimed as completed.
