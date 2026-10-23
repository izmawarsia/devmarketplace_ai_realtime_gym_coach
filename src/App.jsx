import { useEffect, useState } from 'react';
import { useAuth } from './auth/useAuth.js';
import Auth from './components/Auth.jsx';
import Header from './components/Header.jsx';
import HistoryView from './components/HistoryView.jsx';
import Landing from './components/Landing.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import WorkoutPanel from './components/WorkoutPanel.jsx';
import { EXERCISES } from './data/exercises.js';
import { fetchHistory, saveWorkout } from './data/historyClient.js';
import { fetchExerciseHistory, saveExerciseRecord } from './services/supabase.js';
import { getConfigError } from './lib/supabaseClient.js';

function FullScreenLoader({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base text-gray-400">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}

function ConfigError({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-card p-8 text-center shadow-xl">
        <h1 className="mb-2 text-lg font-bold text-white">Configuration missing</h1>
        <p className="text-sm leading-relaxed text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, error: authError, signOut } = useAuth();
  const [tab, setTab] = useState('home');
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(10);

  const [active, setActive] = useState(false);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history: Supabase `exercises` rows (source of truth) merged with
  // any locally cached sessions.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = user?.name ? fetchHistory(user.name) : [];
      let rows = local;
      if (user?.id) {
        const { data, error } = await fetchExerciseHistory(user.id);
        if (!cancelled && !error && Array.isArray(data)) {
          const remote = data.map((r) => ({
            id: `db-${r.id}`,
            date: (r.created_at || '').slice(0, 10),
            exercise: r.exercise_name,
            sets: r.sets,
            reps: r.reps,
            totalReps: r.reps,
            accuracy: 100,
            calories: 0,
            durationMin: Math.max(1, Math.round((r.time ?? 0) / 60) || 1),
            formIssues: [],
          }));
          rows = [...remote, ...local].slice(0, 100);
        }
      }
      if (!cancelled) setHistory(rows);
    }
    if (user) load();
    return () => { cancelled = true; };
  }, [user]);

  const configError = getConfigError();
  if (configError && !user) return <ConfigError message={configError} />;

  const isResetRoute = window.location.pathname === '/reset-password';
  if (isResetRoute) return <ResetPassword />;

  if (loading) return <FullScreenLoader>Starting up…</FullScreenLoader>;
  if (authError && !user) return <ConfigError message={authError} />;

  if (!user) {
    const goToAuth = () => {
      window.location.hash = 'auth';
    };
    if (hash === '#auth') return <Auth />;
    return <Landing onTryLive={goToAuth} />;
  }

  // Logged-in users can still view the landing page via the HOME link.
  if (hash === '#landing') {
    const backToApp = () => {
      window.location.hash = '';
    };
    return <Landing onTryLive={backToApp} />;
  }

  const startWorkout = () => {
    setSession({
      reps: 0,
      currentSetReps: 0,
      set: 0,
      targetReps,
      targetSets,
      elapsed: 0,
      metrics: {},
      formIssues: [],
    });
    setActive(true);
  };

  const endWorkout = () => {
    setActive(false);
    if (session) {
      saveWorkout(user.name, {
        exercise: exercise.name,
        sets: session.targetSets,
        reps: session.targetReps,
        totalReps: session.reps,
        accuracy: 100,
        calories: 0,
        durationMin: 1,
        formIssues: session.formIssues || [],
      });
      // Persist to Supabase `exercises` with the user's UUID.
      saveExerciseRecord(user.id, {
        exerciseName: exercise.name,
        reps: session.reps,
        sets: session.targetSets,
        time: Math.max(60, Math.round(session.elapsed ?? 60)),
      }).then(({ error }) => {
        if (error) console.warn('[exercises] save failed:', error.message);
      });
      setHistory(fetchHistory(user.name));
    }
    setSession(null);
  };

  const updateSession = (next) => {
    setSession((prev) => (prev ? { ...prev, ...next } : next));
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white">
      <div className="app-grid-bg pointer-events-none fixed inset-0" />
      <Header tab={tab} setTab={setTab} user={user} onSignOut={signOut} />

      {tab === 'history' ? (
        <HistoryView history={history} />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6">
          <WorkoutPanel
            active={active}
            session={session}
            exercise={exercise}
            setExercise={setExercise}
            targetSets={targetSets}
            setTargetSets={setTargetSets}
            targetReps={targetReps}
            setTargetReps={setTargetReps}
            onStartWorkout={startWorkout}
            onEndWorkout={endWorkout}
            onSessionUpdate={updateSession}
            history={history}
            onViewHistoryAll={() => setTab('history')}
          />
        </main>
      )}
    </div>
  );
}
