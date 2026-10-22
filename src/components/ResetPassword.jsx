import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import Spinner from './Spinner.jsx';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setReady(!!data.session);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setReady(!!session);
    });

    // Fallback: the magic link token is only valid briefly, so give the SDK a
    // moment to consume the URL hash and establish the recovery session.
    const timeout = setTimeout(() => {
      if (mounted && !ready) setReady(true);
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener?.subscription?.unsubscribe();
    };
  }, [ready]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Could not update password.');
      return;
    }

    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-10">
      <div className="app-grid-bg pointer-events-none fixed inset-0" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-card p-7 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="rounded-xl bg-accent/15 p-3 text-accent">
            <Activity size={28} />
          </span>
          <h1 className="landing-gradient-text font-mono text-lg font-bold tracking-widest">APNA AI COACH</h1>
          <p className="text-sm text-gray-400">Reset your password</p>
        </div>

        {!ready ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-gray-400">
            <Spinner className="h-6 w-6" />
            <p className="text-sm">Preparing secure reset…</p>
          </div>
        ) : done ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Password updated</h2>
            <p className="text-sm text-gray-300">
              Your password has been successfully changed. Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">New password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-white/10 bg-subcard py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Confirm password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-white/10 bg-subcard py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-accent focus:ring-1 focus:ring-accent/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
            >
              {loading ? <Spinner /> : <Lock size={16} />}
              Save New Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
