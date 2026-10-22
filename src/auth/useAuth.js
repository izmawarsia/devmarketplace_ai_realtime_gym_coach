import { useCallback, useEffect, useRef, useState } from 'react';
import { getConfigError, supabase } from '../lib/supabaseClient.js';

function deriveUsername(user) {
  const meta = user?.user_metadata || {};
  return (
    meta.username ||
    meta.full_name ||
    meta.name ||
    user?.email?.split('@')[0] ||
    'User'
  );
}

async function fetchProfile(userId) {
  if (!supabase) return { data: null, error: new Error(getConfigError()) };
  return supabase.from('users').select('id, username, email').eq('id', userId).single();
}

async function upsertProfile(user) {
  if (!supabase) return { data: null, error: new Error(getConfigError()) };
  const profile = {
    id: user.id,
    username: deriveUsername(user),
    email: user.email,
  };
  // Use upsert so both email-verified sign-ups and OAuth logins populate
  // the public profile row without extra round-trips.
  return supabase.from('users').upsert(profile, { onConflict: 'id' }).select().single();
}

const PENDING_2FA_KEY = 'apna_2fa_pending';

export function markPending2FA() {
  try { sessionStorage.setItem(PENDING_2FA_KEY, 'true'); } catch { /* ignore */ }
}

export function clearPending2FA() {
  try { sessionStorage.removeItem(PENDING_2FA_KEY); } catch { /* ignore */ }
}

export function isPending2FA() {
  try { return sessionStorage.getItem(PENDING_2FA_KEY) === 'true'; } catch { return false; }
}

export function useAuth() {
  const [state, setState] = useState({ user: null, loading: true, error: null });
  const mountedRef = useRef(true);

  const setUserFromProfile = useCallback((profile) => {
    setState({
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        name: profile.username,
      },
      loading: false,
      error: null,
    });
  }, []);

  const loadUser = useCallback(async (authUser) => {
    if (!mountedRef.current) return;

    if (!authUser) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    // A password sign-in succeeded but the mandatory email 2FA code has not
    // been verified yet — treat the session as unauthenticated so protected
    // routes stay blocked until verifyOtp(type: 'email') succeeds.
    if (isPending2FA()) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    const configError = getConfigError();
    if (configError) {
      setState({ user: null, loading: false, error: configError });
      return;
    }

    const { data, error } = await fetchProfile(authUser.id);

    if (!mountedRef.current) return;

    if (error && error.code !== 'PGRST116') {
      // PGRST116 == row not found; anything else is a real error.
      setState({ user: null, loading: false, error: error.message });
      return;
    }

    if (data) {
      setUserFromProfile(data);
      return;
    }

    // No profile yet — create it from the Auth user metadata.
    const { data: created, error: upsertError } = await upsertProfile(authUser);

    if (!mountedRef.current) return;

    if (upsertError) {
      setState({ user: null, loading: false, error: upsertError.message });
      return;
    }

    setUserFromProfile(created);
  }, [setUserFromProfile]);

  useEffect(() => {
    mountedRef.current = true;

    if (!supabase) {
      setState({ user: null, loading: false, error: getConfigError() });
      return;
    }

    let ignoreInitial = false;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignoreInitial) {
        loadUser(session?.user ?? null);
      }
    });

    return () => {
      mountedRef.current = false;
      ignoreInitial = true;
      listener?.subscription?.unsubscribe();
    };
  }, [loadUser]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}
