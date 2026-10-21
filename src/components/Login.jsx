import { useState } from 'react';
import { Activity, LogIn } from 'lucide-react';

// Phase 1: lightweight client-side auth (localStorage). Real accounts + SQLite
// arrive in the persistence phase.
export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Please enter a name (at least 2 characters).');
      return;
    }
    onLogin({ name: trimmed });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/5 bg-card p-8 shadow-xl"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="rounded-xl bg-accent/15 p-3 text-accent">
            <Activity size={28} />
          </span>
          <h1 className="text-lg font-bold tracking-widest text-white">
            APNA AI COACH
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to start your AI-guided workout
          </p>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-400">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g. User Izma"
          className="mb-2 w-full rounded-lg border border-white/10 bg-subcard px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
        />
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          <LogIn size={16} /> Continue
        </button>
      </form>
    </div>
  );
}
