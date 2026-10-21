import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FORM_RULES, SEVERITY } from '../analysis/formRules';

// Live form-issue panel: telemetry cards colored by rule severity + a list of
// currently flagged issues. All judgments are deterministic rules.
export default function FormFeedback({ exerciseId, telemetry, analysis }) {
  const spec = FORM_RULES[exerciseId];
  if (!spec) return null;
  const { issues, metricStatus } = analysis;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <ShieldCheck size={14} className="text-accent" /> Form Analysis
      </div>

      {spec.metrics.map((m) => {
        const sev = metricStatus[m.key];
        const bad = sev === SEVERITY.BAD;
        return (
          <div
            key={m.key}
            className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
              bad
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-emerald-500/20 bg-emerald-500/5'
            }`}
          >
            <span className="text-xs text-gray-400">{m.label}</span>
            <span className={`text-sm font-bold tabular-nums ${bad ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatValue(telemetry?.[m.key], m.unit)}
            </span>
          </div>
        );
      })}

      <div className="rounded-xl bg-subcard p-3">
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 size={15} /> Form looks good — keep it up!
          </p>
        ) : (
          <ul className="space-y-1.5">
            {issues.map((issue) => (
              <li key={issue} className="flex items-start gap-2 text-sm text-red-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                {issue}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatValue(v, unit) {
  if (v == null) return '—';
  if (typeof v === 'number') return `${v}${unit}`;
  return String(v).charAt(0).toUpperCase() + String(v).slice(1);
}
