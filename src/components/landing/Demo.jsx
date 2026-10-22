import { useRef, useState } from 'react';

const FEATURES = ['Pose Detection', 'Audio Feedback', 'Rep Counter', 'Works in Real-time'];

function DemoPlayer() {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => setError(true));
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#00d4ff] backdrop-blur">
        <span className="landing-pulse-dot h-2 w-2 rounded-full bg-[#00d4ff]" />
        {playing ? 'Playing' : 'Live Preview'}
      </div>
      {!error && (
        <video
          ref={videoRef}
          src="videos/video.mp4"
          className="h-full w-full object-cover"
          controls={playing}
          playsInline
          preload="metadata"
          onError={() => setError(true)}
          onClick={!playing ? handlePlay : undefined}
        />
      )}
      {(error || !playing) && (
        <button
          type="button"
          onClick={error ? undefined : handlePlay}
          className="absolute inset-0 flex h-full flex-col items-center justify-center gap-3 text-center"
        >
          <div className="landing-gradient-text font-mono text-5xl font-bold sm:text-6xl">▶</div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500">
            {error ? 'Demo video coming soon' : 'Click to play demo'}
          </p>
        </button>
      )}
    </div>
  );
}

export default function Demo() {
  return (
    <section id="demo" className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00d4ff]">// Demo</p>
      <h2 className="font-serif-landing mt-3 text-3xl font-bold text-white sm:text-5xl">
        See it in action
      </h2>

      <div id="demo-video" className="relative mt-12">
        {/* corner frame accents */}
        <span className="absolute -left-2 -top-2 h-8 w-8 border-l-2 border-t-2 border-[#f5a623]" />
        <span className="absolute -right-2 -top-2 h-8 w-8 border-r-2 border-t-2 border-[#f5a623]" />
        <span className="absolute -bottom-2 -left-2 h-8 w-8 border-b-2 border-l-2 border-[#00d4ff]" />
        <span className="absolute -bottom-2 -right-2 h-8 w-8 border-b-2 border-r-2 border-[#00d4ff]" />

        <DemoPlayer />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {FEATURES.map((f) => (
          <div
            key={f}
            className="rounded-lg border border-white/5 bg-[#111111] px-3 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-gray-300 transition hover:border-[#f5a623]/40 hover:text-[#f5a623] sm:text-xs"
          >
            {f}
          </div>
        ))}
      </div>
    </section>
  );
}
