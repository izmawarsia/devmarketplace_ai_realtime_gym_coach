import { Activity, Home, History } from 'lucide-react';

export default function Header({ tab, setTab, user }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
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

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
            {user.name.charAt(0)}
          </span>
          <div className="hidden text-right leading-tight md:block">
            <p className="text-[11px] text-gray-500">Logged in as</p>
            <p className="text-xs font-semibold text-white">{user.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
