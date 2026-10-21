import { useEffect, useState } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import WorkoutConfig from './components/WorkoutConfig';
import WorkoutPanel from './components/WorkoutPanel';
import HistoryTable from './components/HistoryTable';
import HistoryView from './components/HistoryView';
import { EXERCISES } from './data/exercises';
import { analyzeForm } from './analysis/formRules';
import { simulateTelemetry } from './analysis/telemetrySim';
import { fetchHistory, saveWorkout } from './data/historyClient';
import { useCoaching } from './coaching/useCoaching';

const AUTH_KEY = 'apna-coach-user';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState('home');

  // Workout plan state
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);

  // Active session state (simulated until MediaPipe wiring in a later phase)
  const [active, setActive] = useState(false);
  const [session, setSession] = useState(null);
  // Live pose telemetry + deterministic form analysis
  const [telemetry, setTelemetry] = useState(null);
  const [formAnalysis, setFormAnalysis] = useState(null);
  const [coachMuted, setCoachMuted] = useState(false);

  // Workout history persisted in SQLite per user (Phase 4)
  const [history, setHistory] = useState([]);
  useEffect(() => {
    if (user) fetchHistory(user.name).then(setHistory);
  }, [user]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setSession((s) => {
        if (!s) return s;
        const elapsed = s.elapsed + 1;
        // Simulated rep progress every 4s; real counting comes from the
        // deterministic rep counter fed by pose angles.
        const tick = elapsed % 4 === 0 ? 1 : 0;
        let repCount = s.reps + tick;
        let set = s.set;
        if (repCount > s.targetReps && set < s.targetSets) {
          repCount = 1;
          set += 1;
        }
        return { ...s, elapsed, reps: Math.min(repCount, s.targetReps), set };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  // Telemetry loop: simulate pose angles, then run rule-based form detection.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setTelemetry((prev) => {
        const phase = session && session.elapsed % 8 < 4 ? 'down' : 'up';
        const next = simulateTelemetry(exerciseId, prev, phase);
        setFormAnalysis(analyzeForm(exerciseId, next));
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, [active, exerciseId, session]);

  // Spoken AI coaching: LLM-worded messages + gTTS speech over session events
  // and flagged form issues.
  const exercise = EXERCISES.find((e) => e.id === exerciseId);
  const { messages: coachMessages } = useCoaching({
    active,
    exercise,
    session,
    formAnalysis,
    muted: coachMuted,
  });

  const login = (u) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  if (!user) return <Login onLogin={login} />;

  const start = () => {
    setSession({ reps: 0, set: 1, targetReps: reps, targetSets: sets, accuracy: 92, elapsed: 0 });
    setActive(true);
  };
  const stop = async () => {
    setActive(false);
    if (session) {
      // Persist the completed session, then refresh history.
      const issues = formAnalysis?.issues?.map((i) => i.label || i) || [];
      await saveWorkout(user.name, {
        exercise: exercise.name,
        sets: session.targetSets,
        reps: session.targetReps,
        totalReps: (session.set - 1) * session.targetReps + session.reps,
        accuracy: session.accuracy,
        calories: Math.round(session.elapsed * 0.12),
        durationMin: Math.max(1, Math.round(session.elapsed / 60)),
        formIssues: issues,
      });
      fetchHistory(user.name).then(setHistory);
    }
    setSession(null);
    setTelemetry(null);
    setFormAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-base">
      <Header tab={tab} setTab={setTab} user={user} />

      {tab === 'history' ? (
        <HistoryView history={history} />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <WorkoutConfig
              exerciseId={exerciseId}
              setExerciseId={setExerciseId}
              sets={sets}
              setSets={setSets}
              reps={reps}
              setReps={setReps}
              active={active}
              onStart={start}
              onStop={stop}
            />
            <WorkoutPanel
              active={active}
              session={session}
              exercise={exercise}
              telemetry={telemetry}
              formAnalysis={formAnalysis}
              coachMessages={coachMessages}
              coachMuted={coachMuted}
              onToggleCoachMute={() => setCoachMuted((m) => !m)}
            />
          </div>

          {!active && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recent Workouts</h2>
              <button
                onClick={() => setTab('history')}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all →
              </button>
            </div>
            <HistoryTable rows={history} compact />
          </section>
          )}
        </main>
      )}
    </div>
  );
}
