import { useEffect, useState } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import WorkoutPanel from './components/WorkoutPanel';
import HistoryView from './components/HistoryView';
import { EXERCISES } from './data/exercises';
import { fetchHistory, saveWorkout } from './data/historyClient';

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

  // Workout plan defaults matching Streamlit config
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(10);

  // Active session state
  const [active, setActive] = useState(false);
  const [session, setSession] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  useEffect(() => {
    if (user) fetchHistory(user.name).then(setHistory);
  }, [user]);

  const login = (u) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  if (!user) return <Login onLogin={login} />;

  const startWorkout = () => {
    // Initializing static session defaults (reps: 0, set: 1)
    setSession({ 
      reps: 0, 
      currentSetReps: 0,
      set: 0, 
      targetReps, 
      targetSets, 
      elapsed: 0 
    });
    setActive(true);
  };

  const endWorkout = async () => {
    setActive(false);
    if (session) {
      await saveWorkout(user.name, {
        exercise: exercise.name,
        sets: session.targetSets,
        reps: session.targetReps,
        totalReps: session.reps,
        accuracy: 100,
        calories: 0,
        durationMin: 1,
        formIssues: [],
      });
      fetchHistory(user.name).then(setHistory);
    }
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-[#090c10] text-white">
      <Header tab={tab} setTab={setTab} user={user} />

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
            history={history}
            onViewHistoryAll={() => setTab('history')}
          />
        </main>
      )}
    </div>
  );
}