import { useEffect, useRef, useState } from 'react';
import { Play, Square, Dumbbell, Video, AlertTriangle, Activity } from 'lucide-react';
import HistoryTable from './HistoryTable';
import { EXERCISES } from '../data/exercises';
import { createDetector } from '../detectors/index';
import { drawPose } from '../core/drawing';
import { analyzeForm, FORM_RULES, SEVERITY } from '../analysis/formRules';

function MetricCard({ label, value, status }) {
  const bad = status === SEVERITY.BAD;
  const warn = status === SEVERITY.WARN;
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
        bad
          ? 'bg-red-500/10 border-red-500/40'
          : warn
          ? 'bg-amber-500/10 border-amber-500/40'
          : 'bg-[#121620] border-white/5'
      }`}
    >
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span
        className={`text-base font-bold tabular-nums ${
          bad ? 'text-red-400' : warn ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatMetric(exerciseId, key, metrics) {
  const spec = FORM_RULES[exerciseId];
  const metric = spec?.metrics.find((m) => m.key === key);
  const raw = metrics?.[key];
  if (raw == null) return metric?.unit === '°' ? '0°' : 'N/A';
  if (typeof raw === 'number') return `${raw}${metric?.unit ?? ''}`;
  return String(raw);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const METS = {
  squats: 5.0,
  pushups: 8.0,
  biceps_curls: 3.8,
  shoulder_press: 5.0,
  lunges: 4.5,
};

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
  onSessionUpdate,
  history = [],
  onViewHistoryAll,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const detectorRef = useRef(null);
  const runningRef = useRef(false);
  const lastLiftRef = useRef(0);
  const onSessionUpdateRef = useRef(onSessionUpdate);

  const [showPopup, setShowPopup] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState({});
  const [metricStatus, setMetricStatus] = useState({});
  const [liveIssues, setLiveIssues] = useState([]);
  const [progress, setProgress] = useState({ reps: 0, currentSetReps: 0, setsCompleted: 0 });
  const [durationSec, setDurationSec] = useState(0);
  const [calories, setCalories] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Keep the latest callback without restarting the camera/model effect on every parent render.
  useEffect(() => {
    onSessionUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

  // Reset telemetry when a new session starts.
  useEffect(() => {
    if (active) {
      setLiveMetrics({});
      setMetricStatus({});
      setLiveIssues([]);
      setProgress({ reps: 0, currentSetReps: 0, setsCompleted: 0 });
      setCameraError(null);
      setShowPopup(false);
      setRestTimer(0);
      setDurationSec(0);
      setCalories(0);
      setAccuracy(100);
    }
  }, [active, exercise?.id, targetReps, targetSets]);

  // 10 second rest timer effect
  useEffect(() => {
    if (restTimer <= 0) return;
    const timerId = setTimeout(() => setRestTimer((t) => t - 1), 1000);
    return () => clearTimeout(timerId);
  }, [restTimer]);

  // Live workout duration (stops when popup is shown or workout ends).
  useEffect(() => {
    if (!active || showPopup) return;
    const id = setInterval(() => {
      setDurationSec((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [active, showPopup]);

  // Calorie estimation based on METs, duration and reps. Cap for realism
  useEffect(() => {
    if (!exercise) return;
    const met = METS[exercise.id] ?? 4.0;
    const weightKg = 75; // Assumed average
    const hours = durationSec / 3600;
    const base = met * weightKg * hours;
    const repBonus = progress.reps * 0.02; // small extra bump for volume
    let total = base + repBonus;
    if (!Number.isFinite(total)) total = 0;
    if (total > 800) total = 800; // Cap calories to prevent unrealistic output
    setCalories(total);
  }, [durationSec, progress.reps, exercise]);

  // Browser-side MediaPipe + webcam pipeline.
  useEffect(() => {
    if (!active || showPopup || restTimer > 0) {
      runningRef.current = false;
      // Pause video stream and clear canvas during rest or popup
      const v = videoRef.current;
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        ctx && // ctx.clearRect(0, 0, c.width, c.height); // removed, handled by drawPose
      }
      if (v && v.srcObject) {
        // Optionally pause video
        // v.pause();
      }
      return;
    }

    let cancelled = false;
    let stream = null;
    let raf = null;

    setCameraError(null);

    async function setup() {
      try {
        // 1) Camera stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        stream = mediaStream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        // 2) Lazy-init PoseLandmarker once and persist in ref.
        if (!poseLandmarkerRef.current) {
          const visionModule = await import('@mediapipe/tasks-vision');
          if (cancelled) {
            mediaStream.getTracks().forEach((t) => t.stop());
            return;
          }

          const { PoseLandmarker, FilesetResolver } = visionModule;

          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
          );
          if (cancelled) {
            mediaStream.getTracks().forEach((t) => t.stop());
            return;
          }

          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
        }

        // 3) Detector instance per exercise/target.
        if (
          !detectorRef.current ||
          detectorRef.current.name !== exercise.id ||
          detectorRef.current.targetReps !== targetReps ||
          detectorRef.current.targetSets !== targetSets
        ) {
          detectorRef.current = createDetector(exercise, targetReps, targetSets);
        }

        if (cancelled) return;

        runningRef.current = true;

        const loop = () => {
          if (!runningRef.current || cancelled) return;

          const v = videoRef.current;
          const c = canvasRef.current;
          const pose = poseLandmarkerRef.current;

          if (v && c && pose && v.readyState >= 2) {
            // Sync canvas size with video each frame so overlay aligns.
            if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
              c.width = v.videoWidth;
              c.height = v.videoHeight;
            }

            const nowTs = performance.now();
            const results = pose.detectForVideo(v, nowTs);
            const landmarks = results?.landmarks?.[0];

            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);

            // Draw skeleton and dots even if metrics are null (as long as landmarks are present)
            if (landmarks && detectorRef.current) {
              // Pass fresh landmarks to detector every frame
              const out = detectorRef.current.process(landmarks);

              if (out.metrics) {
                setLiveMetrics(out.metrics);

                const { issues, metricStatus: status } = analyzeForm(exercise.id, out.metrics);
                setLiveIssues(issues);
                setMetricStatus(status);

                // Dynamic accuracy score from form quality.
                const severities = Object.values(status || {});
                const badCount = severities.filter((s) => s === SEVERITY.BAD).length;
                const warnCount = severities.filter((s) => s === SEVERITY.WARN).length;
                const frameAccRaw = Math.max(0, 100 - badCount * 25 - warnCount * 10);
                setAccuracy((prev) => {
                  if (!Number.isFinite(prev)) return frameAccRaw;
                  const smoothed = prev * 0.8 + frameAccRaw * 0.2;
                  return Math.max(0, Math.min(100, smoothed));
                });

                // Check if workout target is completed.
                // Only show popup if all sets AND last set reps are completed
                if (out.setsCompleted >= targetSets && out.currentSetReps === 0) {
                  setShowPopup(true);
                  runningRef.current = false;
                  // Stop video stream to freeze frame
                  if (videoRef.current && videoRef.current.srcObject) {
                    // videoRef.current.pause();
                  }
                  return;
                }

                // Per-set rest timer: pause tracking between sets.
                if (
                  out.currentSetReps >= targetReps &&
                  out.setsCompleted < targetSets &&
                  restTimer === 0
                ) {
                  setRestTimer(10);
                  // Mark set as completed and reset current set reps
                  setProgress((prev) => ({
                    ...prev,
                    setsCompleted: prev.setsCompleted + 1,
                    currentSetReps: 0,
                  }));
                  return;
                }

                setProgress({
                  reps: out.repCount,
                  currentSetReps: out.currentSetReps,
                  setsCompleted: out.setsCompleted,
                });

                const now = performance.now();
                if (onSessionUpdateRef.current && now - lastLiftRef.current > 250) {
                  lastLiftRef.current = now;
                  onSessionUpdateRef.current({
                    reps: out.repCount,
                    currentSetReps: out.currentSetReps,
                    set: out.setsCompleted,
                    metrics: out.metrics,
                    formIssues: issues,
                  });
                }
              } else {
                // No metrics for this frame (e.g., landmarks missing) — clear UI but keep state.
                setLiveMetrics({});
                setMetricStatus({});
                setLiveIssues([]);
              }

              drawPose(c, landmarks);
            } else if (landmarks) {
              // Draw skeleton and dots even if metrics are null (as long as landmarks are present)
              drawPose(c, landmarks);
            } else {
              // Landmarks missing entirely.
              setLiveMetrics({});
              setMetricStatus({});
              setLiveIssues([]);
            }
              const out = detectorRef.current.process(landmarks);

              if (out.metrics) {
                setLiveMetrics(out.metrics);

                const { issues, metricStatus: status } = analyzeForm(exercise.id, out.metrics);
                setLiveIssues(issues);
                setMetricStatus(status);

                // Dynamic accuracy score from form quality.
                const severities = Object.values(status || {});
                const badCount = severities.filter((s) => s === SEVERITY.BAD).length;
                const warnCount = severities.filter((s) => s === SEVERITY.WARN).length;
                const frameAccRaw = Math.max(0, 100 - badCount * 25 - warnCount * 10);
                setAccuracy((prev) => {
                  if (!Number.isFinite(prev)) return frameAccRaw;
                  const smoothed = prev * 0.8 + frameAccRaw * 0.2;
                  return Math.max(0, Math.min(100, smoothed));
                });

                // Check if workout target is completed.
                if (out.setsCompleted >= targetSets) {
                  setShowPopup(true);
                  runningRef.current = false;
                  // Stop video stream to freeze frame
                  if (videoRef.current && videoRef.current.srcObject) {
                    // videoRef.current.pause();
                  }
                  return;
                }

                // Per-set rest timer: pause tracking between sets.
                if (
                  out.currentSetReps >= targetReps &&
                  out.setsCompleted < targetSets &&
                  restTimer === 0
                ) {
                  setRestTimer(10);
                  // Mark set as completed and reset current set reps
                  setProgress((prev) => ({
                    ...prev,
                    setsCompleted: prev.setsCompleted + 1,
                    currentSetReps: 0,
                  }));
                  return;
                }

                setProgress({
                  reps: out.repCount,
                  currentSetReps: out.currentSetReps,
                  setsCompleted: out.setsCompleted,
                });

                const now = performance.now();
                if (onSessionUpdateRef.current && now - lastLiftRef.current > 250) {
                  lastLiftRef.current = now;
                  onSessionUpdateRef.current({
                    reps: out.repCount,
                    currentSetReps: out.currentSetReps,
                    set: out.setsCompleted,
                    metrics: out.metrics,
                    formIssues: issues,
                  });
                }
              } else {
                // No metrics for this frame (e.g., landmarks missing) — clear UI but keep state.
                setLiveMetrics({});
                setMetricStatus({});
                setLiveIssues([]);
              }

              drawPose(c, landmarks);
            } else {
              // Landmarks missing entirely.
              setLiveMetrics({});
              setMetricStatus({});
              setLiveIssues([]);
            }
          }

          raf = requestAnimationFrame(loop);
        };

        loop();
      } catch (err) {
        console.error('[pose] setup failed:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access and try again.'
            : 'Camera or MediaPipe failed to start. Check your browser permissions.'
        );
      }
    }

    setup();

    return () => {
      cancelled = true;
      runningRef.current = false;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [active, exercise, targetReps, targetSets, restTimer, showPopup]);

  const renderExerciseMetrics = () => {
    const spec = FORM_RULES[exercise.id];
    if (!spec) return null;
    return (
      <div className="space-y-2 mt-4">
        <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
          {exercise.name} METRICS
        </span>
        {spec.metrics.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={formatMetric(exercise.id, m.key, liveMetrics)}
            status={metricStatus[m.key]}
          />
        ))}
        {liveIssues.length > 0 && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {liveIssues[0] || 'Key points not visible. Please keep your joints in the camera view!'}
          </div>
        )}
      </div>
    );
  };

  // ---------------- STATE A: STANDBY ----------------
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
            {EXERCISES.map((ex) => {
              const isSelected = exercise?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => setExercise(ex)}
                  className={`flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#181d28] border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-[#121620] border border-white/5 hover:border-white/10 hover:shadow-lg'
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
                  <span className="text-xs text-gray-400">{ex.muscles}</span>
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
                  -
                </button>
                <span className="text-lg font-extrabold text-amber-400 tabular-nums">{targetSets}</span>
                <button
                  onClick={() => setTargetSets && setTargetSets(prev => prev + 1)}
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
                  -
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
            className="mt-4 flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 py-3.5 text-sm font-black tracking-widest text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Play size={16} className="fill-black" /> START WORKOUT
          </button>
        </div>

        {/* Right Standby Box */}
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
                <span>ⅠⅠ</span> Set your workout plan
              </h4>
              <p className="mt-2 max-w-md text-xs text-gray-400 leading-relaxed">
                Choose your exercise, sets and reps in the left panel,
                <br />
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

  // ---------------- STATE B: ACTIVE SESSION ----------------
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Active Left Sidebar */}
      <div className="flex h-[580px] flex-col gap-3 overflow-y-auto pr-2 rounded-2xl bg-[#0e1117] p-4 border border-white/10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/40]">
        <div className="flex items-center gap-2 py-1 text-amber-400">
          <Activity size={16} />
          <h2 className="text-xs font-black tracking-widest text-amber-400 uppercase">ACTIVE SESSION</h2>
        </div>

        <div className="rounded-xl bg-[#181d28] p-4 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">ACTIVE ROUTINE</span>
          <p className="text-lg font-black text-white mt-1">{exercise?.name || 'Squats'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{targetSets} Sets Target → {targetReps} Reps / Set</p>
        </div>

        <button
          onClick={onEndWorkout}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3.5 text-xs font-black tracking-widest text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:-translate-y-0.5 active:scale-[0.98] uppercase"
        >
          <Square size={14} className="fill-white" /> END WORKOUT
        </button>

        <div className="space-y-2 mt-2">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">PROGRESS TRACKING</span>
          <MetricCard label="Total Reps" value={progress.reps} />
          <MetricCard label="Current Set Reps" value={`${progress.currentSetReps} / ${targetReps}`} />
          <MetricCard label="Sets Completed" value={`${progress.setsCompleted} / ${targetSets}`} />
          <MetricCard label="Duration" value={formatDuration(durationSec)} />
          <MetricCard label="Calories" value={`${calories.toFixed(1)} kcal`} />
          <MetricCard label="Form Accuracy" value={`${Math.round(accuracy)}%`} />
        </div>

        {renderExerciseMetrics()}

        {cameraError && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {cameraError}
          </div>
        )}
      </div>

      {/* Active Right Panel → Live camera + canvas overlay */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e1117] p-6 h-[580px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">AI Real-time GYM Coach</h3>
            <p className="text-xs text-gray-400">Real-time pose detection with proactive AI voice coaching</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            MediaPipe Live
          </span>
        </div>

        <div className="relative flex-1 rounded-xl border border-white/10 bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-contain -scale-x-100 bg-black"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-contain -scale-x-100 pointer-events-none"
          />
          {restTimer > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-6xl font-extrabold text-amber-400">
              Rest: {restTimer}s
            </div>
          )}
          {showPopup && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 rounded-2xl text-center z-20">
              <h2 className="text-4xl font-extrabold text-amber-400 mb-6">Target Completed! Great Job!</h2>
              <p className="text-lg font-semibold text-white mb-2">Workout Summary</p>
              <p className="text-white mb-1">Total Reps: {progress.reps}</p>
              <p className="text-white mb-1">Sets Completed: {progress.setsCompleted} / {targetSets}</p>
              <p className="text-white mb-1">Duration: {formatDuration(durationSec)}</p>
              <p className="text-white mb-4">Calories: {calories.toFixed(1)} kcal</p>
              <button
                className="mt-2 rounded-xl bg-amber-500 py-3 px-6 font-bold text-black shadow-lg hover:bg-amber-400"
                onClick={() => setShowPopup(false)}
                disabled
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
