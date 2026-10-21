import { Video, Target, Repeat, Layers, Timer, CheckCircle2 } from 'lucide-react';
import FormFeedback from './FormFeedback';
import CoachingPanel from './CoachingPanel';

function Metric({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-subcard p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Icon size={13} className="text-accent" /> {label}
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function WorkoutPanel({ active, session, exercise, telemetry, formAnalysis, coachMessages, coachMuted, onToggleCoachMute }) {
  if (!active) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-card p-10 text-center">
        <span className="mb-4 rounded-2xl bg-subcard p-5 text-accent">
          <Video size={40} />
        </span>
        <h3 className="text-lg font-semibold text-white">Set your workout plan</h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Choose an exercise, set your target sets &amp; reps on the left, then press
          <span className="text-accent"> Start Workout </span> to begin live pose
          tracking.
        </p>
      </div>
    );
  }

  const done = session.reps >= session.targetReps && session.set >= session.targetSets;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
      {/* Live video / canvas container (webcam + MediaPipe overlay lands here) */}
      <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black">
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> LIVE · {exercise.name}
        </div>
        <div className="text-center text-gray-600">
          <Video size={48} className="mx-auto mb-2" />
          <p className="text-sm">Webcam + pose tracking feed</p>
          <p className="text-xs">MediaPipe skeleton overlay renders here</p>
        </div>
      </div>

      <div className="space-y-2">
        <Metric icon={Repeat} label="Reps" value={`${session.reps} / ${session.targetReps}`} />
        <Metric icon={Layers} label="Set" value={`${session.set} / ${session.targetSets}`} />
        <Metric icon={Target} label="Accuracy" value={`${session.accuracy}%`} />
        <Metric
          icon={Timer}
          label="Elapsed"
          value={`${Math.floor(session.elapsed / 60)}:${String(session.elapsed % 60).padStart(2, '0')}`}
        />
        <CoachingPanel messages={coachMessages} muted={coachMuted} onToggleMute={onToggleCoachMute} />
        {formAnalysis && (
          <FormFeedback exerciseId={exercise.id} telemetry={telemetry} analysis={formAnalysis} />
        )}
        {done && (
          <div className="flex items-center gap-2 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">
            <CheckCircle2 size={16} /> Target reached — great work!
          </div>
        )}
      </div>
    </div>
  );
}
