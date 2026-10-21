# AI Real-Time Gym Coach — AI Agent Execution Guide

## Overview & Architecture Context
You are tasked with building and executing the **AI Real-Time Gym Coach** application within the DevMarketplace platform using a modern web-native stack. 
To ensure full compatibility with DevMarketplace's supported runtimes (Vite / React):
- **Frontend Stack**: Vite + React + Tailwind CSS (or custom CSS matching the dark luxury theme).


## Project Folder Structure (Root)
Ensure the repository follows this layout:
```text
apna-ai-coach/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.jsx              # Navigation header with "Workout" tab & dynamic user initials badge
│   │   ├── standby/
│   │   │   ├── WorkoutPlanPanel.jsx    # Left side exercise selector, target steppers & "Start Workout" button
│   │   │   └── VideoStandbyPanel.jsx   # Right side standby video container & instructions ("👉 Set your workout plan")
│   │   ├── active/
│   │   │   ├── ActiveWorkoutPanel.jsx  # Morphing left panel ("End Workout" button & routine summary)
│   │   │   ├── VideoActivePanel.jsx    # Active camera video stream container
│   │   │   └── LiveTelemetryPanel.jsx  # Real-time metrics display (initialized safely at 0° / N/A)
│   │   ├── history/
│   │   │   └── HistoryTable.jsx        # "Recent Workouts" table (Visible in Standby, hidden in Active state)
│   │   └── auth/
│   │       └── Login.jsx               # Username session login gate
│   ├── data/
│   │   ├── exercises.js                # List of exercises & target parameter configs
│   │   └── history.js                  # Initial history log mocks
│   ├── context/
│   │   └── WorkoutContext.jsx          # Global context managing workout_started, selections & user state
│   ├── styles/
│   │   └── scrollbars.css              # Custom amber thin scrollbars & utility classes
│   ├── App.jsx                         # Root orchestrator (conditional rendering & layout views)
│   ├── index.css                       # Tailwind directives & global resets
│   └── main.jsx                        # React DOM root entry point
├── .env                                # Supabase URL & Anon Key credentials
├── index.html                          # Root HTML document
├── package.json                        # Dependencies & scripts
├── postcss.config.js                   # PostCSS configuration
├── tailwind.config.js                  # Tailwind theme customizations
└── vite.config.js                      # Vite build configurations

## Phase Breakdown & Execution Roadmap
## PHASE 1 : 
# Apna AI Coach - Frontend UI & State Implementation Specs
## 1. Top Header Navigation
- **Logo / Title:** Left side par "APNA AI COACH" with brand icon.
- **Tabs:** Navigation tab mein sirf **"Workout"** hona chahiye (Purana "Home" tab mukammal taur par remove kar diya jaye).
- **User Profile Badge:** Far-right par logged-in user ke initials (e.g., "IZ") ek circular badge mein hon, sath mein glowing amber active status dot ho.

## 2. Left Panel / Sidebar Layout & States
The left panel must dynamically switch between two states based on the global state `workout_started`:

### A. State A: Standby Mode (`workout_started === false`)
- **Header:** "WORKOUT PLAN" heading with a custom thin amber scrollbar (`overflow-y-auto`).
- **Exercise Selector Cards:** List of exercises (`Squats`, `Push-ups`, `Biceps Curls (Dumbbell)`, `Shoulder Press`, `Lunges`). Selected exercise card must have a distinct amber border highlight and dot indicator.
- **Target Controls:** 
  - **Sets Target:** Number stepper with `-` and `+` buttons (default: 3).
  - **Reps / Set:** Number stepper with `-` and `+` buttons (default: 10).
- **Action Button:** A prominent amber/orange button labeled **"Start Workout"**. Clicking this sets `workout_started = true`.

### B. State B: Active Session Mode (`workout_started === true`)
When active, morph the left panel content completely:
- **Active Routine Box:** Dark card showing active exercise name and target summary (e.g., `Squats -- 3 Sets Target · 10 Reps / Set`).
- **End Workout Button:** A styled red button labeled **"END WORKOUT"**. Clicking this sets `workout_started = false` and returns to Standby mode.
- **Progress Tracking Section:** 
  - Total Reps (e.g., `0`)
  - Current Set Reps (e.g., `0 / 10`)
  - Sets Completed (e.g., `0 / 3`)
- **Dynamic Exercise Metrics (Conditional based on selected exercise):**
  - *If Squats:* Knee Angle (`0°`), Back Angle (`0°`), Depth Status (`N/A`)
  - *If Push-ups:* Elbow Angle (`0°`), Body Alignment (`N/A`), Hip Position (`N/A`)
  - *If Biceps Curls:* Elbow Angle (`0°`), Shoulder Stability (`N/A`), Swing Detection (`N/A`)
  - *If Shoulder Press:* Elbow Angle (`0°`), Arm Extension (`N/A`), Back Arch (`N/A`)
  - *If Lunges:* Front Knee Angle (`0°`), Torso Angle (`0°`), Balance Status (`N/A`)

## 3. Right Panel & Video Section
- **Header:** Title **"AI Real-time GYM Coach"** with subtitle *"Real-time pose detection with proactive AI voice coaching"*.
- **State A (Standby Mode - `workout_started === false`):**
  - Render a professional dashed border box with a centered activity icon and prompt: **"👉 Set your workout plan"** followed by *"Choose your exercise, sets and reps in the left panel, then click Start Workout to activate camera and AI pose tracking."*
- **State B (Active Session Mode - `workout_started === true`):**
  - Render the active video stream container (Webcam Feed / MediaPipe Live) with a "MediaPipe Live" badge, a "START" button, and camera device selector dropdown.

## 4. Bottom History Table (CRITICAL RULE)
- **Standby Mode (`workout_started === false`):** The **"RECENT WORKOUT HISTORY"** table must be fully visible at the bottom of the page, showing past exercise logs (Exercise, Reps, Sets, Time, Logged At).
- **Active Session Mode (`workout_started === true`):** The **"RECENT WORKOUT HISTORY" table must be completely hidden and removed from the DOM** to prevent UI clutter and layout shifting during active workouts.




