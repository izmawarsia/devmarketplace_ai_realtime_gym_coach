import { useState } from 'react';

const CARDS = [
  { title: 'Squats', hue: '#f5a623', img: 'images/exercise-1.svg' },
  { title: 'Push-ups', hue: '#00d4ff', img: 'images/exercise-2.svg' },
  { title: 'Biceps Curls', hue: '#f5a623', img: 'images/exercise-3.svg' },
  { title: 'Lunges', hue: '#00d4ff', img: 'images/exercise-4.svg' },
  { title: 'Shoulder Press', hue: '#f5a623', img: 'images/exercise-5.svg' },
  { title: 'Live Telemetry', hue: '#00d4ff', img: 'images/exercise-6.svg' },
];

function CornerBrackets() {
  const base = 'absolute h-4 w-4 border-[#f5a623]/70';
  return (
    <>
      <span className={`${base} left-2 top-2 border-l-2 border-t-2`} />
      <span className={`${base} right-2 top-2 border-r-2 border-t-2`} />
      <span className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <span className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

function GalleryCard({ card, i }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div
      className="landing-float group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/5 bg-[#111111] transition-transform duration-500 hover:-translate-y-1 hover:rotate-[0.5deg]"
      style={{ animationDelay: `${i * 0.6}s` }}
    >
      {imgOk ? (
        <img
          src={card.img}
          alt={card.title}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
          style={{
            background: `radial-gradient(circle at ${30 + i * 10}% 40%, ${card.hue}55, transparent 60%)`,
          }}
        />
      )}
      {/* scan line */}
      <div className="landing-scanline absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
      <CornerBrackets />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
        <span className="font-mono text-4xl font-bold text-white/20 transition group-hover:text-white/30">
          {String(i + 1).padStart(2, '0')}
        </span>
        <span className="rounded-full bg-black/50 px-3 py-1 font-mono text-xs uppercase tracking-[0.3em] backdrop-blur-sm" style={{ color: card.hue }}>
          {card.title}
        </span>
      </div>
    </div>
  );
}

export default function Gallery() {
  return (
    <section id="visuals" className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#f5a623]">// Gallery</p>
      <h2 className="font-serif-landing mt-3 text-3xl font-bold text-white sm:text-5xl">
        Built for real athletes
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, i) => (
          <GalleryCard key={card.title} card={card} i={i} />
        ))}
      </div>
    </section>
  );
}
