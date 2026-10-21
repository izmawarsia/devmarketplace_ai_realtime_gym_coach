import { Video, Target, Repeat, Layers, Play, Square, Dumbbell } from 'lucide-react';
import HistoryTable from './HistoryTable';

const EXERCISE_OPTIONS = [
  { id: 'Squats', name: 'Squats', subtitle: 'Quads · Glutes' },
  { id: 'Push-ups', name: 'Push-ups', subtitle: 'Chest · Triceps' },
  { id: 'Biceps Curls (Dumbbell)', name: 'Biceps Curls (Dumbbell)', subtitle: 'Biceps · Forearms' },
  { id: 'Shoulder Press', name: 'Shoulder Press', subtitle: 'Delts · Triceps' },
  { id: 'Lunges', name: 'Lunges', subtitle: 'Quads · Glutes' }
];

function MetricCard({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#121620] px-4 py-3 border border-white/5">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="text-base font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

export default function WorkoutPanel({ 
  active, 
  session, 
  exercise, 
  setExercise, 
  targetSets = 3, 
  setTargetSets, 
  targetReps = 10, 
  setTargetReps, 
  onStartWorkout, 
  onEndWorkout,
  history = [],
  onViewHistoryAll
}) {
  // Render Dynamic Metrics based on selected exercise
  const renderExerciseMetrics = () => {
    const exName = exercise?.name || 'Squats';

    if (exName.includes('Squats')) {
      return (
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">SQUAT METRICS</span>
          <MetricCard label="Knee Angle" value="0°" />
          <MetricCard label="Back Angle" value="0°" />
          <MetricCard label="Depth Status" value="N/A" />
        </div>
      );
    } else if (exName.includes('Push-ups')) {
      return (
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">PUSH-UP METRICS</span>
          <MetricCard label="Elbow Angle" value="0°" />
          <MetricCard label="Body Alignment" value="N/A" />
          <MetricCard label="Hip Position" value="N/A" />
        </div>
      );
    } else if (exName.includes('Biceps Curls')) {
      return (
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">CURL METRICS</span>
          <MetricCard label="Elbow Angle" value="0°" />
          <MetricCard label="Shoulder Stability" value="N/A" />
          <MetricCard label="Swing Detection" value="N/A" />
        </div>
      );
    } else if (exName.includes('Shoulder Press')) {
      return (
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">SHOULDER PRESS METRICS</span>
          <MetricCard label="Elbow Angle" value="0°" />
          <MetricCard label="Arm Extension" value="N/A" />
          <MetricCard label="Back Arch" value="N/A" />
        </div>
      );
    } else if (exName.includes('Lunges')) {
      return (
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">LUNGE METRICS</span>
          <MetricCard label="Front Knee Angle" value="0°" />
          <MetricCard label="Torso Angle" value="0°" />
          <MetricCard label="Balance Status" value="N/A" />
        </div>
      );
    }
  };

  // --- STATE A: STANDBY MODE (Before Clicking Start Workout - Matches Image 2) ---
  if (!active) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Standby Selection Panel */}
        <div className="flex h-[560px] flex-col gap-3 overflow-y-auto pr-2 rounded-2xl bg-[#0e1117] p-4 border border-white/10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/40">
          <div className="flex items-center gap-2 py-1 text-amber-400">
            <Dumbbell size={16} />
            <h2 className="text-xs font-black tracking-widest text-amber-400 uppercase">WORKOUT PLAN</h2>
          </div>

          <div className="flex flex-col gap-2">
            {EXERCISE_OPTIONS.map((ex) => {
              const isSelected = exercise?.name === ex.name;
              return (
                <button
                  key={ex.id}
                  onClick={() => setExercise(ex)}
                  className={`flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-all ${
                    isSelected 
                      ? 'bg-[#181d28] border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'bg-[#121620] border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {ex.name}
                    </span>
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{ex.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* Steppers */}
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-2 rounded-xl bg-[#121620] p-3.5 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">TARGET SETS</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTargetSets && setTargetSets(Math.max(1, targetSets - 1))}
                  className="flex h-8 w-9 items-center justify-center rounded-lg bg-[#1c2230] text-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  −
                </button>
                <span className="text-lg font-extrabold text-amber-400 tabular-nums">{targetSets}</span>
                <button
                  onClick={() => setTargetSets && setTargetSets(Math.min(20, targetSets + 1))}
                  className="flex h-8 w-9 items-center justify-center rounded-lg bg-[#1c2230] text-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-[#121620] p-3.5 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">REPS / SET</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTargetReps && setTargetReps(Math.max(1, targetReps - 1))}
                  className="flex h-8 w-9 items-center justify-center rounded-lg bg-[#1c2230] text-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  −
                </button>
                <span className="text-lg font-extrabold text-amber-400 tabular-nums">{targetReps}</span>
                <button
                  onClick={() => setTargetReps && setTargetReps(Math.min(100, targetReps + 1))}
                  className="flex h-8 w-9 items-center justify-center rounded-lg bg-[#1c2230] text-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onStartWorkout}
            className="mt-4 flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 py-3.5 text-sm font-black tracking-widest text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98]"
          >
            <Play size={16} className="fill-black" /> START WORKOUT
          </button>
        </div>

        {/* Right Standby Box (Image 2 - Dashed Border Set Workout Plan Placeholder) */}
        <div className="space-y-6">
          <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e1117] p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">AI Real-time GYM Coach</h3>
              <p className="text-xs text-gray-400">Real-time pose detection with proactive AI voice coaching</p>
            </div>

            <div className="relative flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center my-2">
              <span className="mb-4 rounded-2xl bg-[#181d28] p-4 text-amber-400 border border-amber-500/20 shadow-md">
                <Dumbbell size={28} />
              </span>
              <h4 className="text-base font-bold text-white flex items-center gap-2 justify-center">
                <span>👈</span> Set your workout plan
              </h4>
              <p className="mt-2 max-w-md text-xs text-gray-400 leading-relaxed">
                Choose your exercise, sets and reps in the left panel,<br />
                then click <span className="text-amber-400 font-semibold">Start Workout</span> to activate camera and AI pose tracking.
              </p>
            </div>
          </div>

          {/* Recent Workout History */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">RECENT WORKOUT HISTORY</h2>
              <button onClick={onViewHistoryAll} className="text-xs font-medium text-amber-400 hover:underline">
                View Full Log →
              </button>
            </div>
            <HistoryTable rows={history} compact />
          </section>
        </div>
      </div>
    );
  }

  // --- STATE B: ACTIVE SESSION MODE (After Clicking Start Workout - Matches Image 1) ---
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Active Left Sidebar */}
      <div className="flex h-[580px] flex-col gap-3 overflow-y-auto pr-2 rounded-2xl bg-[#0e1117] p-4 border border-white/10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/40">
        <div className="flex items-center gap-2 py-1 text-amber-400">
          <Dumbbell size={16} />
          <h2 className="text-xs font-black tracking-widest text-amber-400 uppercase">WORKOUT PLAN</h2>
        </div>

        {/* Active Routine Box */}
        <div className="rounded-xl bg-[#181d28] p-4 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">ACTIVE ROUTINE</span>
          <p className="text-lg font-black text-white mt-1">{exercise?.name || 'Squats'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{targetSets} Sets Target • {targetReps} Reps / Set</p>
        </div>

        {/* End Workout Button */}
        <button
          onClick={onEndWorkout}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-xs font-black tracking-widest text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98] uppercase"
        >
          <Square size={14} className="fill-black" /> END WORKOUT
        </button>

        {/* Progress Tracking Section */}
        <div className="space-y-2 mt-2">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">PROGRESS TRACKING</span>
          <MetricCard label="Total Reps" value={session?.reps || 0} />
          <MetricCard label="Current Set Reps" value={`${session?.currentSetReps || 0} / ${targetReps}`} />
          <MetricCard label="Sets Completed" value={`${session?.set || 0} / ${targetSets}`} />
        </div>

        {/* Exercise Specific Metrics */}
        {renderExerciseMetrics()}
      </div>

      {/* Active Right Panel (Image 1 - Video Stream Feed & Controls) */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e1117] p-6 justify-between h-[580px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">AI Real-time GYM Coach</h3>
            <p className="text-xs text-gray-400">Real-time pose detection with proactive AI voice coaching</p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            MediaPipe Live
          </span>
        </div>

        <div className="relative flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black py-20 px-4 text-center my-2 flex-1">
          <span className="mb-3 text-gray-500">
            <Video size={44} />
          </span>
          <p className="text-sm font-semibold text-white">Webcam Stream Standby</p>
          <p className="text-xs text-gray-500 mt-1">Click START to enable video feed & pose tracking</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
          <button
            className="rounded-xl bg-[#1c2230] px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            START
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>SELECT DEVICE:</span>
            <select className="rounded-lg bg-[#161b22] px-3 py-1.5 text-white border border-white/10 focus:outline-none">
              <option>Default Camera</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}