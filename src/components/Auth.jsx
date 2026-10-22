import { useRef, useState } from 'react';
import { Activity, ArrowLeft, Chrome, Lock, LogIn, Mail, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import { clearPending2FA, markPending2FA } from '../auth/useAuth.js';
import Spinner from './Spinner.jsx';

const MODES = {
  SIGN_IN: 'signin',
  SIGN_UP: 'signup',
  FORGOT: 'forgot',
  VERIFY_SIGNUP: 'verify-signup',
  VERIFY_2FA: 'verify-2fa',
};

function Input({ icon: Icon, label, error, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon size={16} />
          </span>
        )}
        <input
          className={`w-full rounded-lg border bg-subcard py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-accent focus:ring-1 focus:ring-accent/50 ${
            Icon ? 'pl-10 pr-3' : 'px-3'
          } ${error ? 'border-red-500/60' : 'border-white/10'}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Alert({ type, children }) {
  const styles =
    type === 'error'
      ? 'border-red-500/20 bg-red-500/10 text-red-200'
      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  return <div className={`rounded-lg border px-3 py-2 text-xs ${styles}`}>{children}</div>;
}

function OtpInput({ value, onChange, autoFocus = true }) {
  const ref = useRef(null);
  return (
    <div className="flex justify-center">
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••••"
        autoComplete="one-time-code"
        className="w-56 rounded-lg border border-white/10 bg-subcard py-3 text-center font-mono text-2xl tracking-[0.6em] text-white outline-none transition placeholder:text-gray-700 focus:border-accent focus:ring-1 focus:ring-accent/50"
        aria-label="6-digit verification code"
      />
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    code: '',
  });

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setMessage('');
    setForm((f) => ({ ...f, code: '' }));
  };

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
  const isVerifyMode = mode === MODES.VERIFY_SIGNUP || mode === MODES.VERIFY_2FA;

  // ---------- SIGN IN (step 1: password, step 2: mandatory email 2FA) ----------
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    // Block the dashboard until the 2FA code is verified.
    markPending2FA();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      clearPending2FA();
      await supabase.auth.signOut();
      setLoading(false);
      setError(signInError.message || 'Invalid email or password.');
      return;
    }
    // Password OK — now send the 6-digit security code (2FA on every login).
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (otpError) {
      clearPending2FA();
      await supabase.auth.signOut();
      setError(otpError.message || 'Could not send the security code.');
      return;
    }
    setPendingEmail(form.email);
    setForm((f) => ({ ...f, code: '' }));
    setMode(MODES.VERIFY_2FA);
    setMessage(`A 6-digit security code was sent to ${form.email}.`);
  };

  // ---------- SIGN UP (step 1: create account, step 2: email OTP confirm) ----------
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (form.username.trim().length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username.trim() } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || 'Could not create account.');
      return;
    }
    // Never auto-login: always route through the OTP verification screen.
    await supabase.auth.signOut();
    setPendingEmail(form.email);
    setPendingUsername(form.username.trim());
    setForm((f) => ({ ...f, code: '' }));
    setMode(MODES.VERIFY_SIGNUP);
    setMessage(`We sent a 6-digit verification code to ${form.email}.`);
  };

  // ---------- OTP VERIFICATION (signup confirm OR login 2FA) ----------
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const code = form.code.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);

    if (mode === MODES.VERIFY_SIGNUP) {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: 'signup',
      });
      if (verifyError) {
        setLoading(false);
        setError(verifyError.message || 'Invalid or expired code.');
        return;
      }
      // Sync the verified user into public.users, then force a clean sign-in.
      if (data?.user) {
        await supabase.from('users').upsert(
          {
            id: data.user.id,
            username: pendingUsername || data.user.user_metadata?.username || pendingEmail.split('@')[0],
            email: pendingEmail,
          },
          { onConflict: 'id' }
        );
      }
      await supabase.auth.signOut();
      setLoading(false);
      setForm((f) => ({ ...f, code: '', password: '', confirm: '' }));
      setMode(MODES.SIGN_IN);
      setMessage('Email confirmed successfully! Please sign in with your credentials.');
      return;
    }

    // 2FA verification after password sign-in.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message || 'Invalid or expired code.');
      return;
    }
    clearPending2FA(); // session is now fully verified — useAuth will load the profile
  };

  const handleResend = async () => {
    if (!pendingEmail || loading) return;
    setError('');
    setMessage('');
    setLoading(true);
    if (mode === MODES.VERIFY_SIGNUP) {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: pendingEmail });
      setLoading(false);
      if (resendError) {
        setError(resendError.message || 'Could not resend the code.');
        return;
      }
    } else {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: pendingEmail,
        options: { shouldCreateUser: false },
      });
      setLoading(false);
      if (resendError) {
        setError(resendError.message || 'Could not resend the code.');
        return;
      }
    }
    setMessage(`A new code was sent to ${pendingEmail}.`);
  };

  const handleCancelVerify = async () => {
    if (mode === MODES.VERIFY_2FA) {
      clearPending2FA();
      await supabase.auth.signOut();
    }
    switchMode(MODES.SIGN_IN);
  };

  // ---------- FORGOT PASSWORD ----------
  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message || 'Could not send reset email.');
      return;
    }
    setMessage('If this account exists, a password reset link has been sent.');
  };

  // ---------- GOOGLE OAUTH ----------
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    setLoading(false);
    if (oauthError) setError(oauthError.message || 'Google sign in failed.');
  };

  const GoogleButton = ({ label }) => (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-subcard py-2.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
    >
      <Chrome size={18} className="text-accent" />
      {label}
    </button>
  );

  const Divider = () => (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-gray-500">or</span>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-10">
      <div className="app-grid-bg pointer-events-none fixed inset-0" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-card p-7 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => { window.location.hash = ''; }}
          className="absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Back to home"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="rounded-xl bg-accent/15 p-3 text-accent">
            {isVerifyMode ? <ShieldCheck size={28} /> : <Activity size={28} />}
          </span>
          <h1 className="landing-gradient-text font-mono text-lg font-bold tracking-widest">APNA AI COACH</h1>
          <p className="text-sm text-gray-400">
            {mode === MODES.VERIFY_SIGNUP && 'Confirm your email to finish signing up'}
            {mode === MODES.VERIFY_2FA && 'Two-factor verification'}
            {mode === MODES.SIGN_IN && 'Train smarter with AI form coaching'}
            {mode === MODES.SIGN_UP && 'Create your account'}
            {mode === MODES.FORGOT && 'Reset your password'}
          </p>
        </div>

        {!isVerifyMode && mode !== MODES.FORGOT && (
          <div className="mb-6 flex rounded-full bg-subcard p-1">
            {[MODES.SIGN_IN, MODES.SIGN_UP].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition sm:text-sm ${
                  mode === m ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === MODES.SIGN_IN ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {message && <div className="mb-4"><Alert type="success">{message}</Alert></div>}

        {mode === MODES.SIGN_IN && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input icon={Mail} label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
            <Input icon={Lock} label="Password" type="password" placeholder="••••••••"
              value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="current-password" />
            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode(MODES.FORGOT)} className="text-xs text-accent hover:underline">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold">
              {loading ? <Spinner /> : <LogIn size={16} />}
              Sign In
            </button>
            <Divider />
            <GoogleButton label="Continue with Google" />
          </form>
        )}

        {mode === MODES.SIGN_UP && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input icon={User} label="Username" type="text" placeholder="johndoe"
              value={form.username} onChange={(e) => update('username', e.target.value)} autoComplete="username" />
            <Input icon={Mail} label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
            <Input icon={Lock} label="Password" type="password" placeholder="At least 6 characters"
              value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" />
            <Input icon={Lock} label="Confirm Password" type="password" placeholder="••••••••"
              value={form.confirm} onChange={(e) => update('confirm', e.target.value)} autoComplete="new-password" />
            <button type="submit" disabled={loading}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold">
              {loading ? <Spinner /> : <User size={16} />}
              Create Account
            </button>
            <Divider />
            <GoogleButton label="Sign up with Google" />
          </form>
        )}

        {mode === MODES.FORGOT && (
          <form onSubmit={handleForgot} className="space-y-4">
            <button type="button" onClick={() => switchMode(MODES.SIGN_IN)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <ArrowLeft size={14} /> Back to sign in
            </button>
            <p className="text-sm text-gray-300">Enter your email and we’ll send you a reset link.</p>
            <Input icon={Mail} label="Email" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
            <button type="submit" disabled={loading}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold">
              {loading ? <Spinner /> : <Mail size={16} />}
              Send Reset Link
            </button>
          </form>
        )}

        {isVerifyMode && (
          <form onSubmit={handleVerify} className="space-y-5">
            <p className="text-center text-sm text-gray-300">
              Enter the 6-digit {mode === MODES.VERIFY_2FA ? 'security' : 'verification'} code sent to{' '}
              <span className="font-medium text-white">{pendingEmail}</span>.
            </p>
            <OtpInput value={form.code} onChange={(v) => update('code', v)} />
            <button type="submit" disabled={loading}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold">
              {loading ? <Spinner /> : <ShieldCheck size={16} />}
              {mode === MODES.VERIFY_2FA ? 'Verify & Enter Dashboard' : 'Verify Email'}
            </button>
            <button type="button" onClick={handleResend} disabled={loading}
              className="w-full text-center text-xs text-accent hover:underline disabled:opacity-60">
              Didn’t get a code? Resend
            </button>
            <button type="button" onClick={handleCancelVerify}
              className="w-full text-center text-xs text-gray-400 hover:text-white">
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
