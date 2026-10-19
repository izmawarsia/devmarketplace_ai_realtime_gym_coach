# AGENTS.md — AI Real-Time Gym Coach

> Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot, etc.) working in this repository.
> Humans: this is also the project's engineering runbook. Read it top to bottom once, then use the phase sections as your task list.

---

## 1. Project Overview

**AI Real-Time Gym Coach** is a camera-based fitness companion. It tracks body landmarks from a webcam (MediaPipe), counts reps with deterministic exercise logic, flags basic form issues, generates short coaching messages with an LLM (Groq / Llama 3.3 70B), speaks them (gTTS), and saves workout history per authenticated user (SQLite).

- **Team:** Team Kaizen — NED University of Engineering & Technology (DevMarketplace Hackathon)
- **Build window:** 19–22 October
- **Full spec:** `spec.md` (source of truth for scope — if this file and the spec disagree, the spec wins, then update this file)

**Core design rule:**
> Computer vision estimates position → deterministic rules interpret movement → the LLM only *phrases* feedback about events the rules already detected.
> The LLM never judges form, counts reps, or invents events.

**Authority order:** `spec.md` defines product requirements; this file defines the implementation workflow. If the existing repository differs, inspect it first, preserve working features, and reconcile changes with `spec.md` before coding.

---

## 2. Tech Stack

| Area | Technology |
|---|---|
| Language | Python 3.10–3.11 |
| UI / streaming | Streamlit, streamlit-webrtc, PyAV |
| Vision | MediaPipe Tasks (Pose Landmarker), OpenCV (headless), NumPy |
| LLM | Groq API; model selected through `GROQ_MODEL` |
| TTS | gTTS |
| Database | SQLite (stdlib `sqlite3`) |
| Auth | Authentication provider integration with real 2FA/MFA — see Phase 2 |
| Styling | HTML/CSS injected via Streamlit |
| Config | python-dotenv |

### Dependency notes
Inspect the existing `requirements.txt` before editing it. Keep compatible versions already in use; add only missing dependencies and pin versions after testing. Add only the dependencies required by the chosen provider and tested implementation. A self-hosted fallback may require `bcrypt`, `pyotp`, `qrcode[pil]`, and `cryptography`; these are not mandatory if the selected provider manages credentials and MFA. `pytest` is required for tests.

`av` (PyAV) is installed as a dependency of `streamlit-webrtc`; do not pin it separately unless a conflict appears.

---

## 3. Repository Layout (target)

```
.
├── AGENTS.md
├── spec.md
├── README.md
├── requirements.txt
├── .env.example              # never commit .env
├── .gitignore
├── app.py                    # Streamlit entrypoint + page routing
├── assets/
│   ├── styles.css
│   └── pose_landmarker_lite.task   # downloaded by scripts/download_model.py
├── scripts/
│   └── download_model.py
├── core/
│   ├── config.py             # env loading, constants
│   ├── pose.py               # MediaPipe wrapper, landmark helpers
│   ├── geometry.py           # angle(), distance(), smoothing
│   ├── exercises/
│   │   ├── base.py           # ExerciseDetector interface
│   │   ├── squat.py
│   │   ├── pushup.py
│   │   ├── bicep_curl.py
│   │   ├── shoulder_press.py
│   │   └── lunge.py
│   ├── session.py            # WorkoutSession state: reps, sets, timing
│   ├── events.py             # CoachingEvent dataclass + queue
│   ├── coach.py              # Groq client, prompts, fallbacks
│   └── tts.py                # gTTS wrapper + audio cache
├── auth/
│   ├── service.py            # register, login, verify email, 2FA
│   ├── security.py           # hashing, TOTP, encryption, rate limiting
│   └── session.py            # Streamlit session handling
├── db/
│   ├── schema.sql
│   ├── database.py           # connection + migrations
│   └── repository.py         # user + workout queries (always user-scoped)
├── ui/
│   ├── landing.py
│   ├── auth_pages.py
│   ├── dashboard.py
│   ├── workout.py
│   └── history.py
├── tests/
│   ├── test_geometry.py
│   ├── test_exercises.py     # replayed landmark fixtures
│   ├── test_auth.py
│   ├── test_repository.py
│   └── fixtures/
└── docs/
    ├── EVALUATION.md
    └── gigs/                 # packaging for the two DevMarketplace Code Gigs
```

Agents should follow this layout. If you deviate, update this section in the same change.

---

## 4. Setup & Commands

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then fill in values
python scripts/download_model.py                    # fetch Pose Landmarker .task file
streamlit run app.py                                # run the app
pytest -q                                           # run tests
```

### Environment variables (`.env.example`)

The pitch names Llama 3.3 70B, but Groq model IDs/availability can change. Verify the configured model against the current Groq account/API; keep `GROQ_MODEL` configurable and never assume a model ID works just because it appears here.



```
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile  # verify availability; override if unavailable
APP_SECRET_KEY=            # only needed if using the documented self-hosted 2FA-secret encryption fallback
DB_PATH=data/gymcoach.db
SMTP_HOST=                 # optional: email verification
SMTP_USER=
SMTP_PASSWORD=
TURN_SERVER_URL=           # needed for deployed WebRTC
TURN_USERNAME=
TURN_CREDENTIAL=
```

---

## 5. Global Rules for Agents

### Work autonomously and conserve platform credits
- Read `spec.md`, this file, and the existing repository before making changes. Do not spend a response merely repeating the plan.
- Start implementing the earliest incomplete phase immediately after the initial inspection.
- Work in small, complete batches. Do not regenerate all files or rewrite working modules when a targeted change is enough.
- Do not ask the user to choose between routine technical options. Make a sensible, compatible decision, document it, and continue.
- Ask for human input only if a required credential, account permission, irreversible action, or genuinely blocking product decision cannot be resolved from the repository/specification.
- Do not repeatedly re-read or reprint large files. Inspect the relevant sections, implement, test, and report concise results.
- If a phase cannot be fully completed because a secret, provider account, hardware, or deployment access is missing, finish all code and tests possible, clearly identify the exact external blocker, and continue with independent tasks where phase dependencies allow.
- Do not claim deployment, real API access, authentication, 2FA, or tests succeeded unless actually verified.
- Do not mention private reference material in the product UI, public README, pitch, or deliverables. Implement the requirements independently. Do not copy code/assets wholesale; if any third-party code or asset is reused, comply with its license and attribution requirements.

### Always
- Work **one phase at a time**, in order. Do not start a phase until the previous phase's exit criteria pass.
- Keep changes small and reviewable; run `pytest -q` before declaring a task done.
- Add type hints and short docstrings to public functions.
- Read secrets only through `core/config.py`.
- Treat `spec.md` as the scope authority; keep the app's five named exercises and all required deliverables in scope.
- Keep public documentation focused on this team's own implementation, architecture, setup, testing, and limitations.
- Scope **every** workout query by `user_id` (see Phase 2/6).
- Handle failure explicitly: camera denied, no pose detected, Groq timeout, gTTS offline, DB locked.
- Describe form indicators as **approximate, pose-based** — never as validated or medical.

### Never
- Commit `.env`, API keys, the SQLite DB, or generated audio.
- Store plaintext passwords or plaintext 2FA secrets.
- Call any `st.*` function from inside the WebRTC video callback (it runs in a separate thread — use a thread-safe queue / shared state object instead).
- Let the LLM decide rep counts, form correctness, or medical advice.
- Add medical, rehabilitation, or injury-prevention claims to UI copy or prompts.
- Block the video callback with network calls (Groq, gTTS). Do those in a worker thread.
- Silently swallow exceptions; log them and degrade gracefully.

### Ask a human before
- Changing the database schema after Phase 6 begins.
- Adding a new third-party service or dependency not listed here.
- Deleting or rewriting files outside the current phase's scope.

---

## 6. Phases

**Do not stop after creating a plan.** Once the repo is inspected, start the first incomplete phase and carry it through its exit criteria. At the end of each phase, record a short checklist in the agent response or `docs/phase-status.md` (phase, implemented items, tests run, failures/blockers). Keep `docs/phase-status.md` factual and current; do not create repetitive status files for each small task.

If the platform has limited credits/context, prioritize: (1) inspect files once, (2) implement the highest-priority incomplete phase, (3) run targeted tests and `pytest -q`, (4) fix failures, (5) proceed to the next phase. Avoid lengthy analysis-only messages and duplicate code output.

Timeline mapping from the pitch: **Phases 0–1 → 19 Oct**, **Phases 2–5 → 20 Oct**, **Phase 6 → 21 Oct**, **Phase 7 → 22 Oct**. Treat dates as milestones, not a reason to skip tests.

**Execution order:** The default is sequential phases with explicit exit criteria. If multiple teammates/agents are working concurrently, Phase 2 (auth/database) and Phases 3–4 (vision/session logic) may be developed in parallel only after Phase 0 establishes shared interfaces. Phase 5 requires the detector/session event contract. Phase 6 integrates all tracks. Never mark a phase complete just because its files exist; its exit criteria must pass.

---

### Phase 0 — Project Setup & Architecture
**Goal:** A runnable skeleton that every teammate can clone and start in minutes.

**Tasks**
1. Create the repository layout from §3 with empty modules and `__init__.py` files.
2. Add `.gitignore` (`.env`, `*.db`, `.venv/`, `__pycache__/`, `data/`, `*.mp3`, `*.task`).
3. Add `.env.example` and `core/config.py` (loads and validates env vars; missing optional ones don't crash).
4. Write `scripts/download_model.py` to fetch the MediaPipe Pose Landmarker `.task` file into `assets/`.
5. Create `app.py` that renders a placeholder landing page and routes between pages via `st.session_state`.
6. Draft `README.md` with setup steps; assign roles (frontend, CV, backend/DB, testing/deploy).

**Exit criteria**
- [ ] Fresh clone → install → `streamlit run app.py` shows the placeholder page.
- [ ] `pytest` runs (even if only one trivial test).
- [ ] No secrets in git history.

---

### Phase 1 — Real-Time Pose Pipeline
**Goal:** Live webcam feed with skeleton overlay, running reliably.

**Tasks**
1. `core/pose.py`: wrap MediaPipe Pose Landmarker (create once, reuse; use `VIDEO`/`LIVE_STREAM` mode with monotonically increasing timestamps).
2. `core/geometry.py`: `calculate_angle(a, b, c)`, landmark-visibility filtering (ignore landmarks below a visibility threshold), and an exponential/moving-average smoother for angles.
3. Integrate `streamlit-webrtc` with a `VideoProcessor` / frame callback: convert frame → RGB → landmarks → draw skeleton with OpenCV → return frame.
4. Configure STUN (and TURN via env) in `RTCConfiguration`.
5. Show camera-position instructions (full body visible, side/front view per exercise, lighting).
6. Handle: camera permission denied, no person detected, low visibility.

**Exit criteria**
- [ ] Skeleton overlays the live feed at an acceptable frame rate on a normal laptop.
- [ ] Angle helper has unit tests with known geometry (e.g., 90°, 180°, 0°).
- [ ] The app shows a clear message instead of crashing when no pose is detected.
- [ ] No `st.*` calls inside the callback.

---

### Phase 2 — Authentication & Database
**Goal:** Secure accounts with working 2FA and private, persistent data.

> **Architecture decision:** The pitch requires an authentication provider to manage credentials and 2FA secrets. Inspect the repository first: if a compatible provider is already configured, integrate it behind `auth/service.py`. If none exists, choose the simplest maintained provider that supports password sign-in and real TOTP/MFA for the deployment target, then document the choice and required setup. Do not silently build a fake provider or claim 2FA works without an end-to-end test. Keep workout data in SQLite for the MVP if the chosen hosting environment provides persistent storage; enforce user ownership in every repository method because SQLite has no row-level security. If credentials/provider configuration are unavailable, implement the integration boundary and tests possible, then report the exact setup blocker instead of storing credentials contrary to the spec.

**Tasks**
1. `db/schema.sql` and `db/database.py` (create tables on startup, enable `PRAGMA foreign_keys = ON`):
   - Keep local user profile data minimal: `users(user_id PK, email, created_at)` only if needed by the chosen provider integration. Do not duplicate provider-managed password credentials or 2FA secrets in local profile rows.
   - `workouts(record_id PK, user_id FK, exercise_name, reps, sets, duration_seconds, timestamp)`
   - index on `workouts(user_id, timestamp)`.
2. `auth/security.py` or a provider adapter:
   - Delegate password verification and 2FA secret lifecycle to the selected authentication provider.
   - If a self-hosted fallback is genuinely required and documented, use a maintained password-hashing library and TOTP library, encrypt TOTP secrets at rest, and rate-limit attempts.
   - Never log or store plaintext passwords or plaintext 2FA secrets.
3. `auth/service.py`: stable provider-neutral interface for `register()`, `login()` (must complete MFA before authenticated state), `enable_2fa()`, `verify_2fa()`, `logout()`, and optional `send_verification_email()` / `verify_email()` where configured.
4. `auth/session.py`: store only `user_id` and auth-state flags in `st.session_state`; a user is "authenticated" only after the 2FA step succeeds; provide a `require_auth()` guard used by every protected page.
5. `db/repository.py`: all workout functions take `user_id` as a required argument and always filter by it (`save_workout`, `list_workouts`, `get_stats`).
6. `ui/auth_pages.py`: sign-up, 2FA setup (QR + manual key), sign-in, 2FA code entry, sign-out.

**Exit criteria**
- [ ] Register → set up 2FA → sign out → sign in with password + code works.
- [ ] Wrong password or wrong code is rejected with a generic error message.
- [ ] Confirm authentication credentials and 2FA secrets are handled by the selected provider; if a documented self-hosted fallback is used, verify password hashes and encrypted TOTP secrets only.
- [ ] Test proves user A cannot read or modify user B's workouts.
- [ ] Unauthenticated access to dashboard/workout pages is blocked.

---

### Phase 3 — Exercise Detection Engine
**Goal:** Accurate rep counting and approximate form indicators for all five exercises.

**Common interface (`core/exercises/base.py`)**
```python
class ExerciseDetector:
    name: str
    def update(self, landmarks) -> DetectionResult: ...
    # DetectionResult: phase, rep_completed (bool), form_flags (list[str]), angles (dict), confidence_ok (bool)
    def reset(self) -> None: ...
```
Each detector is a **state machine** (e.g., `UP → DOWN → UP` = 1 rep) with hysteresis thresholds so jitter doesn't double-count, plus a minimum time between reps.

**Per-exercise logic (starting points — tune on real footage)**

| Exercise | Rep signal | Form indicators (approximate) |
|---|---|---|
| Squat | Knee angle: standing → below depth threshold → standing | Depth reached; knee angle at bottom |
| Push-up | Elbow angle: extended → flexed → extended | Elbow angle; shoulder–hip–ankle alignment (sagging/piking hips) |
| Biceps curl | Elbow angle: extended → flexed → extended | Elbow drift; torso swing (shoulder/hip x-movement) |
| Shoulder press | Elbow extension overhead: bottom → full extension | Incomplete extension; back-arch indicator (torso lean) |
| Lunge | Front-knee angle: standing → bent → standing | Front-knee angle; torso lean; balance (hip/shoulder sway) |

**Tasks**
1. Implement the base class and all five detectors; keep thresholds as named constants in one place per file.
2. Ignore frames where required landmarks fall below the visibility threshold (don't count reps on guessed positions).
3. Emit form flags **once per rep** (not every frame) to prevent feedback spam.
4. Record test clips / landmark sequences into `tests/fixtures/` and write replay tests that feed landmarks to each detector.

**Exit criteria**
- [ ] Each detector counts correctly on its fixture sequences (including at least one noisy/partial-visibility case).
- [ ] No double counting from jitter.
- [ ] Form flags are limited to the predefined list in `spec.md §6.6`.
- [ ] Thresholds documented in code comments with the reasoning.

---

### Phase 4 — Session, Sets & Workout Flow
**Goal:** Turn detectors into a full workout: targets, sets, progress, and summary.

**Tasks**
1. `core/session.py` — `WorkoutSession`: exercise, target reps/sets, current rep, completed sets, rest state, start time, elapsed duration, cumulative form-flag counts.
2. Set logic: when `current_rep == target_reps` → complete the set, reset the rep counter, start a rest interval; when `completed_sets == target_sets` → finish the workout.
3. `ui/workout.py`: exercise picker, set/rep inputs (validated ranges), start/stop/reset buttons, live rep/set/progress display, current form indicator.
4. Use a thread-safe shared state object between the video callback (writer) and the Streamlit UI (reader); refresh via a controlled polling loop or `st.fragment` — avoid full-script reruns every frame.
5. Emit `CoachingEvent`s (see Phase 5) at defined moments: workout start, rep milestones, set complete, form flag, workout complete.
6. End-of-session summary screen: exercise, reps, sets, duration.

**Exit criteria**
- [ ] A full multi-set workout completes with correct rep/set totals.
- [ ] Stop/reset mid-workout works without stale state.
- [ ] UI stays responsive while the camera runs.
- [ ] Summary values match the session state exactly.

---

### Phase 5 — AI Coaching & Voice
**Goal:** Short, safe, event-driven spoken coaching that never breaks the workout.

**Tasks**
1. `core/events.py`: `CoachingEvent(type, exercise, rep, set, flag, timestamp)`; types are an enum (`START`, `MILESTONE`, `SET_COMPLETE`, `FORM_FLAG`, `WORKOUT_COMPLETE`).
2. `core/coach.py`:
   - Groq client with a request **timeout** and limited retries.
   - System prompt: concise (max ~20 words), encouraging, one cue per message, **no medical advice**, **only reference the event provided**, no invented facts.
   - Structured user prompt built from the event fields.
   - **Fallback messages** (static, per event type) used when Groq fails, times out, or key is missing.
   - Cooldown / dedupe: at most one coaching message every N seconds; never repeat the same form cue back-to-back.
3. `core/tts.py`: gTTS → MP3 bytes in memory (cache common phrases); on failure, fall back to on-screen text only.
4. Run LLM + TTS in a **background worker thread** consuming an event queue; the UI polls for ready messages and plays audio (`st.audio`, autoplay where the browser allows) and shows the text.
5. UI: coaching message panel + mute toggle + clear "coach unavailable, using basic cues" notice on fallback.
6. Optional: log latency per message for evaluation.

**Exit criteria**
- [ ] Real Groq calls produce messages tied to real events.
- [ ] Unplugging the network or removing the key → fallback text appears, workout keeps running.
- [ ] Video frame rate is unaffected by coaching calls.
- [ ] Prompt tests confirm no medical claims on sample outputs.

---

### Phase 6 — Persistence, History & Integration Testing
**Goal:** Everything connected end to end, with data saved and tested.

**Tasks**
1. On workout completion (or manual stop with ≥1 rep), call `repository.save_workout(user_id, ...)`.
2. `ui/history.py`: table of past sessions (date, exercise, reps, sets, duration), plus a simple chart (e.g., reps per day / per exercise) using pandas + Streamlit charts.
3. `ui/dashboard.py`: welcome, recent workouts, "Start workout" entry point.
4. Run and record the evaluation from `spec.md §13` in `docs/EVALUATION.md`:
   - Rep-count accuracy vs. manual counts (per exercise, several runs, varied lighting/angle).
   - Correct detection of predefined form errors (deliberately performed).
   - Feedback latency (event → text, event → audio).
   - Auth + 2FA + history persistence checks.
5. Fix bugs found; tune thresholds based on measured results.
6. Add `pytest` coverage for repository isolation, auth flows, and detector fixtures.

**Exit criteria**
- [ ] Sign out → sign in → previous sessions appear.
- [ ] Two test accounts see only their own history.
- [ ] `docs/EVALUATION.md` contains real measured numbers (not guesses).
- [ ] All tests pass.

---

### Phase 7 — Polish, Deployment & Demo
**Goal:** A deployed, documented, demo-ready MVP plus the two Code Gigs.

**Tasks**
1. **UI polish:** consistent theme via `assets/styles.css`, landing page, clear error/empty states, camera setup instructions.
2. **Deployment:**
   - Choose a host that supports WebRTC and a persistent disk (e.g., a small VM / container host). **Streamlit Community Cloud's filesystem is ephemeral**, so SQLite data may be lost on restart — if using it, move the DB to persistent storage or an external DB, and document this.
   - Configure a TURN server; WebRTC often fails on restrictive networks without one.
   - Set secrets via the host's secret manager, not the repo.
   - Serve over HTTPS (browsers require it for camera access).
3. **Smoke test on the deployed URL** following the full user journey in `spec.md §7`.
4. **Code Gigs** (publish with setup instructions, usage examples, contributor credits, and license):
   - **Gig 1 — Reusable Authentication Module:** `auth/` + `db` user tables, with README and a minimal example app. Mark 2FA as supported only if tested.
   - **Gig 2 — AI Workout Coaching Service:** `core/events.py`, `core/coach.py`, `core/tts.py`, with README, fallback behavior, and example usage.
5. **Docs:** finalize `README.md` (setup, env vars, limitations, architecture diagram) and add a LICENSE.
6. **Demo prep:** scripted 3–5 minute walkthrough, a backup screen recording, and a pre-created demo account.

**Exit criteria**
- [ ] Public deployed URL completes the full journey.
- [ ] Public repo with README, license, and no secrets.
- [ ] Two Code Gigs published.
- [ ] Demo rehearsed with a fallback plan (recording) if the camera/network fails.

---

## 7. Coding Conventions

- **Style:** PEP 8, `black` formatting, type hints, f-strings.
- **Modules:** pure logic (`geometry`, `exercises`, `session`) must not import Streamlit — keeps it unit-testable and reusable for the Code Gigs.
- **Constants:** thresholds, timeouts, and cooldowns live in named constants, not magic numbers.
- **Errors:** raise specific exceptions in services; catch and convert them to user-friendly messages at the UI layer.
- **Logging:** use `logging`; never log passwords, TOTP codes, secrets, or full API keys.
- **Commits:** small, imperative messages (`Add squat detector state machine`); reference the phase (`[P3]`).
- **Branches:** `main` stays deployable; feature branches per phase/task; PR + one review before merge when time allows.

---

## 8. Testing Strategy

| Layer | How |
|---|---|
| Geometry | Unit tests with known angles |
| Exercise detectors | Replay recorded landmark sequences; assert rep counts and flags |
| Session logic | Unit tests for rep→set→finish transitions |
| Auth | Register/login/2FA happy and failure paths; lockout |
| Repository | Cross-user isolation tests |
| Coach | Mock Groq: success, timeout, error, empty response → fallback |
| End-to-end | Manual checklist from `spec.md §7` on the deployed app |

Run `pytest -q` before every commit that touches `core/`, `auth/`, or `db/`.

---

## 9. Security & Safety Checklist

- [ ] Authentication provider handles credentials securely; no plaintext passwords anywhere.
- [ ] Provider manages 2FA secrets, or a documented self-hosted fallback encrypts them at rest; secret keys are never committed.
- [ ] All DB queries parameterized (no string-formatted SQL).
- [ ] Every workout query filtered by authenticated `user_id`.
- [ ] Generic login errors (don't reveal whether an email exists).
- [ ] Rate limiting on login and 2FA attempts.
- [ ] HTTPS in deployment.
- [ ] Camera frames are processed in-session and **not stored or uploaded**.
- [ ] UI states that form indicators are approximate and not medical advice.
- [ ] LLM prompt forbids medical/diagnostic statements.

---

## 10. Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Lighting / camera angle / occlusion degrade pose quality | Visibility gating, setup instructions, smoothing |
| Rule-based checks fail for some bodies/variations | Conservative thresholds, document limitations, test several people |
| Groq/gTTS latency or outage | Background worker, timeouts, static fallback messages |
| WebRTC fails on deployment network | TURN server, test early (Phase 1) and again in Phase 7 |
| Streamlit thread/rerun issues | Shared thread-safe state; no `st.*` in callbacks |
| SQLite persistence on ephemeral hosting | Persistent disk or external DB; verify before demo |
| 2FA/auth scope creep | Keep the `auth/service.py` interface stable; mark 2FA "supported" only after testing |

---

## 11. Definition of Done (MVP)

The MVP is done when all of the following are true, matching `spec.md §15`:

1. Users can register, sign in, and complete 2FA.
2. All five exercises run with live pose tracking and rep counting.
3. Basic form feedback and AI voice coaching work end to end, with graceful fallback.
4. Workout history persists and is private per user.
5. The app is deployed, the repo is public and documented, and two Code Gigs are published.
6. `docs/EVALUATION.md` reports measured results and honest limitations.
