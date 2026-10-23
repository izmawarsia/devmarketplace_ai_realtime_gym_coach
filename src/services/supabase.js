// Supabase workout persistence aligned with the existing schema:
//   exercises (id int8 PK, user_id uuid, exercise_name, reps, sets, time, created_at)
import { supabase, getConfigError } from '../lib/supabaseClient.js';

// Insert a completed workout record for the authenticated user's UUID.
export async function saveExerciseRecord(userId, { exerciseName, reps, sets, time }) {
  if (!supabase) return { data: null, error: new Error(getConfigError()) };
  if (!userId) return { data: null, error: new Error('Not signed in') };
  return supabase
    .from('exercises')
    .insert({
      user_id: userId,
      exercise_name: exerciseName,
      reps: Math.max(0, Math.round(reps ?? 0)),
      sets: Math.max(0, Math.round(sets ?? 0)),
      time: Math.max(0, Math.round(time ?? 0)),
    })
    .select()
    .single();
}

// Fetch the user's workout history, newest first.
export async function fetchExerciseHistory(userId, limit = 50) {
  if (!supabase) return { data: [], error: new Error(getConfigError()) };
  if (!userId) return { data: [], error: new Error('Not signed in') };
  return supabase
    .from('exercises')
    .select('id, exercise_name, reps, sets, time, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
}
