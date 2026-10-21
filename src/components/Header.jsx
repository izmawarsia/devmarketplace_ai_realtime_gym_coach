import { Activity, History, Dumbbell } from 'lucide-react';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export default function Header({ tab, setTab, user }) {
  const tabs = [
    { id: 'home', label: 'Workout', icon: Dumbbell },
    { id: 'history', label: 'Workout History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent/15 p-2 text-accent">
            <Activity size={20} />
          </span>
          <span className="text-sm font-bold tracking-widest text-white">
            APNA AI COACH
          </span>
        </div>

        <nav className="flex items-center gap-1 rounded-full bg-subcard p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                tab === id
                  ? 'bg-accent text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-black shadow-[0_0_12px_rgba(245,158,11,0.45)]">
              {initials(user.name)}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#12151e] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <div className="hidden text-right leading-tight md:block">
            <p className="text-[11px] text-gray-500">Good workout,</p>
            <p className="text-xs font-semibold text-white capitalize">{user.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
