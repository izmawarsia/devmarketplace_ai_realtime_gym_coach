// Hook: watches session events + form issues during an active workout and
// produces spoken, LLM-worded coaching. Dedupes repeated issues with a
// cooldown so the coach doesn't nag.
import { useEffect, useRef, useState } from 'react';
import { fetchCoachingMessage } from './coachClient';
import { speak, stop } from './speaker';

const ISSUE_COOLDOWN_MS = 12_000;

export function useCoaching({ active, exercise, session, formAnalysis, muted }) {
  const [messages, setMessages] = useState([]); // { id, text, source, kind }
  const lastIssueAt = useRef({});
  const lastEventKey = useRef(null);

  const push = (text, source, kind) => {
    setMessages((m) => [...m.slice(-19), { id: Date.now(), text, source, kind }]);
    speak(text, { muted });
  };

  const request = async (payload, kind) => {
    try {
      const { message, source } = await fetchCoachingMessage(payload);
      push(message, source, kind);
    } catch {
      // network/API down — stay silent rather than crash the session
    }
  };

  useEffect(() => {
    if (!active || !exercise || !session) return;
    const stats = { ...session };

    // Milestone events (start / set complete / workout complete) fire once each.
    const done = session.reps >= session.targetReps && session.set >= session.targetSets;
    const eventKey = session.elapsed === 0
      ? 'start'
      : done
        ? 'workout_complete'
        : session.reps === session.targetReps
          ? `set_complete:${session.set}`
          : null;
    if (eventKey && eventKey !== lastEventKey.current) {
      lastEventKey.current = eventKey;
      const type = eventKey.split(':')[0];
      request({ exercise: exercise.id, issues: [], event: { type }, stats }, 'event');
      return; // let the milestone line land before any issue line
    }

    // New/flagged form issues, per-issue cooldown.
    const now = Date.now();
    const fresh = (formAnalysis?.issues ?? []).filter(
      (i) => now - (lastIssueAt.current[i] ?? 0) > ISSUE_COOLDOWN_MS
    );
    if (fresh.length) {
      for (const i of fresh) lastIssueAt.current[i] = now;
      request({ exercise: exercise.id, issues: fresh, stats }, 'issue');
    }
  }, [active, exercise, session, formAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (!active) {
      stop();
      lastEventKey.current = null;
      lastIssueAt.current = {};
    }
  }, [active]);

  return { messages, clear: () => setMessages([]) };
}
