const STATS = [
  { value: '100ms', label: 'Avg Latency' },
  { value: '5+', label: 'Exercises' },
  { value: '95%', label: 'Form Accuracy' },
];

export default function Hero({ onTryLive }) {
  return (
    <header id="top" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-300 sm:text-xs">
        <span className="landing-glow-dot h-2 w-2 rounded-full bg-[#00d4ff]" />
        AI-Powered · Real-Time · Gym Coach
      </div>

      <h1 className="font-serif-landing leading-[0.95]">
        <span className="block text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
          REAL-TIME
        </span>
        <span className="landing-gradient-text block text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          AI GYM COACH
        </span>
      </h1>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
        Your form. Analyzed. Corrected. In milliseconds. Computer vision that
        watches every rep and tells you exactly what to fix.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={onTryLive}
          className="btn-amber rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(245,166,35,0.35)]"
        >
          Try It Live
        </button>
        <a
          href="#demo"
          className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:border-[#00d4ff] hover:text-[#00d4ff]"
        >
          Watch Demo
        </a>
      </div>

      <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/5 bg-[#111111] px-3 py-5 sm:px-6"
          >
            <div className="font-mono text-2xl font-bold text-[#f5a623] sm:text-4xl">{s.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
