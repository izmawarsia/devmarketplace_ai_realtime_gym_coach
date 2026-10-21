// AI Coach panel: latest spoken coaching line + scrollable message log.
import { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Bot } from 'lucide-react';

export default function CoachingPanel({ messages, muted, onToggleMute }) {
  const logRef = useRef(null);
  const latest = messages[messages.length - 1];

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Sparkles size={14} className="text-accent" /> AI Voice Coach
        </div>
        <button
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute coach' : 'Mute coach'}
          className="rounded-lg bg-subcard p-1.5 text-gray-400 transition hover:-translate-y-0.5 hover:text-accent"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-accent" />}
        </button>
      </div>

      {/* Latest line, spoken now */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
        {latest ? (
          <p className="flex items-start gap-2 text-sm leading-snug text-amber-100">
            <Bot size={15} className="mt-0.5 shrink-0 text-accent" />
            {latest.text}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Coach is listening — start moving…</p>
        )}
      </div>

      {/* Recent coaching log */}
      {messages.length > 1 && (
        <div
          ref={logRef}
          className="coach-scroll max-h-28 space-y-1 overflow-y-auto rounded-xl bg-subcard p-2"
        >
          {messages.slice(0, -1).map((m) => (
            <p key={m.id} className="text-xs leading-snug text-gray-500">
              <span className={m.kind === 'issue' ? 'text-red-400/70' : 'text-accent/60'}>
                {m.kind === 'issue' ? '⚠' : '★'}
              </span>{' '}
              {m.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
