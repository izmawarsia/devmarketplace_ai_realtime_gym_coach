# Apna AI Coach — Phase 7

AI Real-Time Gym Coach. Phase 7 adds a dark-themed marketing landing page
(`#0a0a0a` + `#111` surfaces, amber `#f5a623` / cyan `#00d4ff` accents,
Ubuntu + Instrument Serif fonts, radial-masked grid overlay) that serves as
the primary entry point, with hash-based routing into the existing
Supabase Auth flow and dashboard.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Configuration

Copy `.env.example` to `.env` and add your Supabase project credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Optional: VITE_APP_URL=https://your-deployed-domain.com
```

The preview VM already injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
from workspace Secrets, so the app runs there without a local `.env` file.
`VITE_APP_URL` is optional and falls back to `window.location.origin`.

## What's in Phase 6

- **Supabase Auth client** (`src/lib/supabaseClient.js`) reading the Vite
  environment variables and failing gracefully with a configuration screen when
  values are missing.
- **Reusable auth hook** (`src/auth/useAuth.js`) that listens to auth state
  changes, fetches the public profile row, and auto-creates one from Auth
  metadata when needed.
- **Polished auth UI** (`src/components/Auth.jsx`):
  - Tab switching between Sign In and Sign Up.
  - Email/password sign in and sign up with username metadata.
  - 6-digit email OTP verification screen with code resend
    (`supabase.auth.resend`). If email confirmation is disabled in the
    Supabase project, sign-up signs the user in immediately.
  - Forgot password flow with reset link redirect to `/reset-password`.
  - Google OAuth button.
  - Inline validation, loading spinners, and error/success banners.
- **Reset password view** (`src/components/ResetPassword.jsx`) that handles the
  recovery magic link and updates the password via `supabase.auth.updateUser`.
- **Header integration** with a sign-out button wired through `useAuth`.

## Notes

- Workout history is still stored client-side in `localStorage` per username so
  the app remains fully runnable without backend API changes in this phase.
- MediaPipe browser pipeline, exercise detectors, and UI from Phases 1–5 remain
  unchanged.

## What's in Phase 7

- **Landing page** (`src/components/Landing.jsx` + `src/components/landing/`):
  - Sticky blurred navbar with gradient **APNA AI COACH** brand text and
    smooth-scroll anchors (`#visuals`, `#demo`, `#contact`).
  - Hero with glowing `AI-POWERED · REAL-TIME · GYM COACH` badge, `REAL-TIME`
    / gradient `AI GYM COACH` heading (white → amber → cyan), sub-headline,
    **Try It Live** CTA and **Watch Demo** ghost button, plus a metrics strip
    (`100ms`, `5+`, `95%`).
  - Gallery section with 6 floating/tilting cards, scan-line animations and
    corner brackets.
  - Demo section with corner-framed video container, pulsing live-status
    badge, and 4 feature callouts.
  - Contact section with LinkedIn / GitHub / Twitter-X / Gmail buttons and a
    copyright footer.
- **Hash-based routing** (no router dependency) in `src/App.jsx`:
  - `/` (no hash) → Landing page for signed-out visitors.
  - `#auth` → existing `Auth.jsx` sign-in/sign-up screen.
  - After successful authentication the existing dashboard renders as before.
  - `#landing` → signed-in users can revisit the landing page via the new
    **HOME** link in the dashboard header; Try It Live returns to the app.
  - `/reset-password` path keeps working unchanged.
- **UI consistency refinements**:
  - `Auth.jsx` title uses the hero gradient text and has a top-left
    **← Back** button returning to the landing page.
  - Dashboard `Header.jsx` matches the landing navbar (dark blurred bar,
    gradient brand, mono uppercase nav links) with a **HOME** link, while the
    user avatar/profile block stays untouched. Mobile gets a second nav row.
- **Landing theme CSS** appended to `src/index.css` (grid overlay with radial
  mask, gradient text, glow/pulse/float/scan-line keyframes) and Google Fonts
  (Ubuntu, Instrument Serif) preloaded in `index.html`.

### Phase 7 refinement pass

- Gallery and Demo section headings are center-aligned (matching Contact).
- Universal dark grid overlay (`.app-grid-bg`) now applied on the Auth,
  Reset Password, and dashboard pages too.
- Shared amber primary button style (`.btn-amber`) with the golden hover
  glow is used by every primary CTA (Try It Live, Sign In/Up, Start/End
  Workout). **END WORKOUT** is now amber instead of red.
- Gallery cards load images from `public/images/exercise-1..6.svg`
  (bundled placeholders — drop real files in with the same names, or
  `.png`/`.jpg` and update `CARDS` in `Gallery.jsx`).
- Demo section embeds `public/videos/video.mp4` (click-to-play, falls back
  to a "coming soon" overlay if the file is absent — add the video there).

### Strict auth flow (Sign Up OTP + login 2FA)

- **Sign Up:** `signUp({ email, password, options: { data: { username } } })`
  → 6-digit OTP screen (auto-focused, centered code input) →
  `verifyOtp({ type: 'signup' })` → upsert `(id, username, email)` into
  `public.users` → `signOut()` → back to Sign In with
  "Email confirmed successfully! Please sign in with your credentials."
- **Sign In:** `signInWithPassword` → immediately `signInWithOtp({ email })`
  → 2FA code screen → `verifyOtp({ type: 'email' })` → dashboard.
- **Route safety:** `useAuth` marks a `apna_2fa_pending` flag in
  `sessionStorage` between password success and OTP verification; while the
  flag is set the session is treated as unauthenticated so the dashboard and
  other protected views stay blocked until the code is verified. Cancelling
  the 2FA screen signs the user out and clears the flag.

## Phase 8 — Backend logic & voice coach parity

- **Detectors** (`src/detectors/*`): exact Python-parity thresholds and metrics.
  All detectors use `MIN_VISIBILITY = 0.7` for key joints and return both
  Python-parity metric keys (`knee_angle`, `depth_status`, `shoulder_status`,
  `swing_status`, `front_knee_angle`, `torso_angle`, `balance_status`,
  `body_alignment`, `hip_status`, `extension_status`, `back_arch_status`) and
  the legacy UI metric keys so the existing panels render unchanged.
  - Squat: DOWN=100 / UP=160, dynamic side by knee visibility.
  - Biceps curl: UP=50 / DOWN=160, `ELBOW_DRIFT_TOLERANCE=0.06`, `SWING_THRESHOLD=15`.
  - Lunges: DOWN=100 / UP=160, `BALANCE_TOLERANCE=0.10`, front leg = smaller knee angle.
  - Push-up: DOWN=90 / UP=160, `HIP_SAG_TOLERANCE=0.08`.
  - Shoulder press: UP=160 / DOWN=90, inverted state machine (press up first).
- **MediaPipe**: `pose_landmarker_full.task`, `runningMode: 'VIDEO'`,
  `detectForVideo`, 0.7 detection/presence/tracking confidences.
- **Supabase**: completed workouts insert into `exercises`
  (`exercise_name, reps, sets, time`) with the user's UUID; history is fetched
  per `user_id`, newest first (`src/services/supabase.js`).
- **AI voice coach**: `src/config/coachPrompt.js` (strict 12-word, second-person
  trainer prompt), `src/services/aiCoach.js` (Groq `llama-3.3-70b-versatile`,
  temperature 0.4, last-10-message history, `VITE_GROQ_API_KEY`,
  `dangerouslyAllowBrowser: true`, deterministic local fallback when the key is
  missing), `src/services/tts.js` (Web Speech API), and
  `src/services/voicePipeline.js` (per-exercise `_find_form_issue` mapping,
  5-second cooldown on minor issues, auto-trigger on `workout_started`,
  `set_completed`, `workout_completed`, `no_pose_detected`,
  `ongoing_form_check`).

### Secrets

Add `VITE_GROQ_API_KEY` in the workspace Secrets panel to enable LLM-generated
spoken coaching. Without it the app still speaks deterministic rule-based lines.

### Phase 8 updates (camera toggle, language, coach banner)

- **Manual camera control**: the workout session no longer starts the webcam
  automatically. A **Start Camera / Stop Camera** toggle in the video footer
  (left of the device dropdown) requests `getUserMedia` only on click and
  stops all tracks when turned off. An "Camera is off" overlay shows in the
  video frame until started.
- **Guidance language dropdown** (`English` / `Roman Urdu`) next to the device
  selector. Roman Urdu switches the Groq system prompt to Roman-Urdu cues
  (e.g. "Peeth seedhi rakho"), uses `ur-PK` Web Speech synthesis, and provides
  Roman Urdu deterministic fallback lines when no Groq key is set.
- **Live AI coach text banner** (`.coach-feedback-banner`) below the video
  shows the latest coach line in real time, alongside the spoken audio, with
  a "Coach: Ready to guide your workout!" placeholder when idle.
- Skeleton overlay now draws joints/connections only when landmark
  visibility > 0.7.


## Phase 3 — Stability fixes
- **EMA landmark smoothing (alpha = 0.7)**: `src/core/smoothing.js` smooths every raw landmark frame before it feeds BOTH the canvas skeleton drawing and the detector `process()` call — no more jitter.
- **Robust rep state machines**: all 5 detectors tolerate transient visibility drops via 6 grace frames (`BaseExercise.graceFrames`) — state, stage and rep progress are HELD (never reset) during momentary occlusion; per-detector `MIN_VISIBILITY` relaxed 0.7 → 0.5.
- **Fixed TTS pipeline**: `src/coaching/speechService.js` handles Chrome's stuck-paused / dropped-utterance quirks (`resume()`, `voiceschanged` listener) and enforces a strict 3-second cooldown. Instant voice advice fires whenever `liveIssues` contains a BAD/WARN severity issue.
- **Metrics panel**: Calories removed entirely from WorkoutPanel. It now shows exactly: Duration (MM:SS), Total Reps, Set Progress, and Form Accuracy (% of frames without form issues).
