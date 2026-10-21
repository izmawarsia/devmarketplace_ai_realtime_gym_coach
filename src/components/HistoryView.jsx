import { Trophy, Target, Flame, Clock } from 'lucide-react';
import HistoryTable from './HistoryTable';
import { summarize } from '../data/history';

const CARDS = [
  { key: 'totalWorkouts', label: 'Total Workouts', icon: Trophy, suffix: '' },
  { key: 'avgAccuracy', label: 'Avg Accuracy', icon: Target, suffix: '%' },
  { key: 'calories', label: 'Calories Burned', icon: Flame, suffix: ' kcal' },
  { key: 'minutes', label: 'Total Time', icon: Clock, suffix: ' min' },
];

export default function HistoryView({ history }) {
  const stats = summarize(history);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-xl font-bold text-white">Workout History</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, suffix }) => (
          <div key={key} className="rounded-2xl border border-white/5 bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="rounded-lg bg-accent/15 p-1.5 text-accent">
                <Icon size={14} />
              </span>
              {label}
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">
              {stats[key]}
              <span className="text-sm font-medium text-gray-500">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      <HistoryTable rows={history} />
    </div>
  );
}
