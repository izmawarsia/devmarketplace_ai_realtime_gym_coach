// Browser-native TTS engine wrapping window.speechSynthesis.
// - Queue cancellation via speechSynthesis.cancel()
// - 3-second debounce so cues never overlap
// - Priority cues (SEVERITY.BAD) bypass the debounce and interrupt current speech
// No dependencies.

const DEBOUNCE_MS = 3000;

let lastSpokeAt = 0;
let pendingTimer = null;
let cachedVoice = null;

function pickVoice() {
  if (cachedVoice) return cachedVoice;
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    cachedVoice =
      voices.find((v) => v.lang === 'en-US' && /google|natural|neural/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith('en')) ||
      voices[0] ||
      null;
  } catch {
    cachedVoice = null;
  }
  return cachedVoice;
}

// Voices load asynchronously in some browsers — warm the cache.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const onVoicesChanged = () => {
    cachedVoice = null;
    pickVoice();
  };
  window.speechSynthesis.onvoiceschanged = onVoicesChanged;
  window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged);
  // Some browsers need a nudge to populate getVoices().
  try { window.speechSynthesis.getVoices(); } catch { /* ignore */ }
}

// Chrome quirk: the engine can silently enter a `paused` state after
// repeated cancel() calls. Resume before every speak.
function ensureResumed() {
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  } catch { /* ignore */ }
}

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeaking() {
  return ttsSupported() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}

/**
 * Speak a coaching cue.
 * @param {string} text
 * @param {{ priority?: boolean }} opts priority=true cancels current speech
 *        immediately (still subject to the strict 3s cooldown between cues).
 * @returns {boolean} true if the cue was actually dispatched to the TTS engine.
 */
export function speakCue(text, { priority = false } = {}) {
  if (!ttsSupported()) return false;
  const clean = String(text || '').trim();
  if (!clean) return false;

  const now = Date.now();
  // Strict 3-second cooldown between cues — applies to ALL cues (BAD/WARN
  // included) so the coach never talks over itself.
  if (now - lastSpokeAt < DEBOUNCE_MS) return false;

  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  // Queue cancellation: never let utterances stack up.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  lastSpokeAt = now;
  // Small delay after cancel() avoids a known Chrome dropped-utterance bug.
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    ensureResumed();
    window.speechSynthesis.speak(utterance);
  }, 50);

  return true;
}

export function stopSpeech() {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  if (ttsSupported()) window.speechSynthesis.cancel();
  lastSpokeAt = 0;
}
