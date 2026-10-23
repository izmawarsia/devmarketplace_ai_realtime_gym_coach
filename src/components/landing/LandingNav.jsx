export default function LandingNav({ onTryLive }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="font-mono text-sm font-bold tracking-widest sm:text-base">
          <span className="landing-gradient-text">APNA AI COACH</span>
        </a>
        <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-gray-400 sm:flex">
          <a href="#visuals" className="transition hover:text-[#f5a623]">Gallery</a>
          <a href="#demo" className="transition hover:text-[#f5a623]">Demo</a>
          <a href="#contact" className="transition hover:text-[#f5a623]">Contact</a>
        </div>
        <button
          onClick={onTryLive}
          className="btn-amber rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider sm:text-sm"
        >
          Try It Live
        </button>
      </div>
      <div className="flex items-center justify-center gap-6 border-t border-white/5 py-2 font-mono text-[11px] uppercase tracking-widest text-gray-400 sm:hidden">
        <a href="#visuals" className="transition hover:text-[#f5a623]">Gallery</a>
        <a href="#demo" className="transition hover:text-[#f5a623]">Demo</a>
        <a href="#contact" className="transition hover:text-[#f5a623]">Contact</a>
      </div>
    </nav>
  );
}
