export default function HistoryTable({ rows, compact = false }) {
  const data = compact ? rows.slice(0, 5) : rows;
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Exercise</th>
            <th className="px-4 py-3">Sets × Reps</th>
            <th className="px-4 py-3">Accuracy</th>
            <th className="px-4 py-3">Calories</th>
            <th className="px-4 py-3">Duration</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-subcard/60">
              <td className="px-4 py-3 text-gray-400">{r.date}</td>
              <td className="px-4 py-3 font-medium text-white">{r.exercise}</td>
              <td className="px-4 py-3 tabular-nums text-gray-300">{r.sets} × {r.reps}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {r.accuracy}%
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-300">{r.calories} kcal</td>
              <td className="px-4 py-3 tabular-nums text-gray-300">{r.durationMin} min</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No workouts yet — complete your first session!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
