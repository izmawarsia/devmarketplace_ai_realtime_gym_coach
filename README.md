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
