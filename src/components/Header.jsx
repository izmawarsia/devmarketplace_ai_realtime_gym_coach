import { Activity, Home, LogOut } from 'lucide-react';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export default function Header({ tab, setTab, user, onSignOut }) {
  const tabs = [
    { id: 'home', label: 'WORKOUT' },
    { id: 'history', label: 'WORKOUT HISTORY' },
  ];

  const goHome = () => {
    window.location.hash = 'landing';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button
          onClick={goHome}
          className="flex items-center gap-2"
          aria-label="Go to landing page"
        >
          <span className="rounded-lg bg-accent/15 p-2 text-accent">
            <Activity size={20} />
          </span>
          <span className="landing-gradient-text font-mono text-sm font-bold tracking-widest">
            APNA AI COACH
          </span>
        </button>

        <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-widest sm:flex">
          <button
            onClick={goHome}
            className="flex items-center gap-1.5 text-gray-400 transition hover:text-[#f5a623]"
          >
            <Home size={14} />
            Home
          </button>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`transition ${
                tab === id
                  ? 'text-[#f5a623]'
                  : 'text-gray-400 hover:text-[#f5a623]'
              }`}
            >
              {label}
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
          <button
            onClick={onSignOut}
            className="ml-1 rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* mobile nav row */}
      <div className="flex items-center justify-center gap-6 border-t border-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-widest sm:hidden">
        <button
          onClick={goHome}
          className="flex items-center gap-1.5 text-gray-400 transition hover:text-[#f5a623]"
        >
          <Home size={13} />
          Home
        </button>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`transition ${
              tab === id ? 'text-[#f5a623]' : 'text-gray-400 hover:text-[#f5a623]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
