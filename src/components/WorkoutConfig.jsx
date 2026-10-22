import { Minus, Plus, Play, Square, Dumbbell } from 'lucide-react';
import { EXERCISES } from '../data/exercises';

function Stepper({ label, value, onChange, min = 1, max = 30 }) {
  return (
    <div className="rounded-xl bg-subcard p-3">
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="rounded-md bg-base p-1.5 text-gray-300 transition hover:text-accent"
        >
          <Minus size={14} />
        </button>
        <span className="text-lg font-bold tabular-nums text-white">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
          className="rounded-md bg-base p-1.5 text-gray-300 transition hover:text-accent"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function WorkoutConfig({
  exerciseId,
  setExerciseId,
  sets,
  setSets,
  reps,
  setReps,
  active,
  onStart,
  onStop,
}) {
  return (
    <aside className="rounded-2xl border border-white/5 bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Dumbbell size={16} className="text-accent" /> Exercise
      </h2>

      <div className="space-y-2">
        {EXERCISES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => !active && setExerciseId(ex.id)}
            disabled={active}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
              exerciseId === ex.id
                ? 'border-accent bg-accent/10'
                : 'border-white/5 bg-subcard hover:border-white/15'
            } ${active ? 'opacity-60' : ''}`}
          >
            <p className="text-sm font-semibold text-white">{ex.name}</p>
            <p className="text-xs text-gray-500">{ex.muscles}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stepper label="Target Sets" value={sets} onChange={setSets} min={1} max={10} />
        <Stepper label="Target Reps" value={reps} onChange={setReps} />
      </div>

      {active ? (
        <button
          onClick={onStop}
          className="btn-amber mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
        >
          <Square size={16} /> End Workout
        </button>
      ) : (
        <button
          onClick={onStart}
          className="btn-amber mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
        >
          <Play size={16} /> Start Workout
        </button>
      )}
    </aside>
  );
}
