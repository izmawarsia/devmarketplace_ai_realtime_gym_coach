# Apna AI Coach — Phase 1

AI Real-Time Gym Coach. Phase 1 delivers the runnable UI skeleton with core
flows: user sign-in, workout plan configuration, standby vs. active workout
states, and workout history views.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What's in Phase 1

- **Auth** — lightweight client-side login (name → localStorage); the header
  shows the logged-in user badge.
- **Home** — exercise selector cards (Squats, Push-ups, Biceps Curls, Shoulder
  Press, Lunges), target sets/reps steppers, Start/End Workout. The main panel
  toggles between a standby placeholder and a live workout view (video/canvas
  container placeholder + live metrics: reps, set, accuracy, elapsed time).
- **Workout History** — analytics cards (total workouts, avg accuracy, calories,
  total time) and a detailed logs table; a compact recent-workouts table also
  appears on Home.
- **Deterministic rep counting** — angle-threshold state machine in
  `src/data/exercises.js` (`createRepCounter`), ready to be fed by MediaPipe
  pose angles. Until webcam tracking is wired up, an active session simulates
  rep progress on a timer.

## Stack

React 18 + Vite, Tailwind CSS (dark theme `#0b0d12` / `#12151e` / `#181c28`,
accent `#f59e0b`), lucide-react icons.

## Notes / next phases

- All data is in-memory / localStorage and resets on refresh (except the login
  name). SQLite persistence per user arrives in the history phase — a database
  can be enabled from the workspace Database button.
- Phase 2+: MediaPipe webcam pose tracking, form-issue detection, Groq + gTTS
  spoken coaching, SQLite history.

## Structure

```
src/
  App.jsx                  # root: auth gate, tab routing, session state
  components/
    Header.jsx             # logo, tabs, user badge
    Login.jsx              # sign-in screen
    WorkoutConfig.jsx      # exercise cards, steppers, start/stop
    WorkoutPanel.jsx       # standby placeholder / live video + metrics
    HistoryTable.jsx       # shared logs table
    HistoryView.jsx        # analytics cards + full table
  data/
    exercises.js           # exercise catalog + rep counter state machine
    history.js             # mock history + summary helpers
```

## Phase 2 — Form issue detection

- `src/analysis/formRules.js` — deterministic, threshold-based form rules per
  exercise (squats, push-ups, biceps curls, shoulder press, lunges). All form
  judgments come from these rules; the LLM (later phase) never judges form.
- `src/analysis/telemetrySim.js` — simulated pose telemetry stand-in until
  MediaPipe wiring lands; occasionally drifts into bad-form territory so rules
  fire during a session.
- `src/components/FormFeedback.jsx` — live telemetry cards colored by rule
  severity plus a flagged-issues list in the active workout panel.
- The "Recent Workouts" table is hidden during an active session to keep the
  workspace focused.

## Phase 3 — Spoken coaching feedback

- `server/coach.js` — `POST /api/coach` words deterministic form events
  (start / set complete / workout complete / flagged issues) into a short
  spoken coaching line via **Groq (Llama 3.3)**. The LLM never judges form —
  it only phrases what the rules detected. Without `GROQ_API_KEY` it falls
  back to local template phrasing (never crashes).
- `server/tts.js` — `GET /api/tts?text=...` streams MP3 speech from the same
  Google TTS endpoint **gTTS** wraps; the client falls back to browser
  `speechSynthesis` if the stream is unavailable.
- `src/coaching/useCoaching.js` — watches session events and form issues,
  dedupes repeated issues with a 12s cooldown, and speaks each message.
- `src/components/CoachingPanel.jsx` — live "AI Voice Coach" panel in the
  active workout view with the latest spoken line, a scrolling message log,
  and a mute toggle.

### Secrets

Copy `.env.example` values into the workspace **Secrets** panel (never commit
them). `GROQ_API_KEY` is optional — the app works with fallback phrasing
without it. `npm run dev` now also starts the API on port 3001 via
`concurrently`; Vite proxies `/api` to it.

## Phase 4 — Workout history persistence

Completed workout sessions are saved to a local SQLite database
(`server/coach.db`, created automatically via `better-sqlite3`), scoped per
logged-in username:

- `POST /api/history` — save a session (exercise, sets/reps, total reps,
  accuracy, calories, duration, flagged form issues).
- `GET /api/history?user=<name>` — list that user's sessions (newest first).

The React app saves a session when you click **End Workout** and refreshes the
Recent Workouts table and the Workout History analytics from the database.
