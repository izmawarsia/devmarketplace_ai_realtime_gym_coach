// Text-to-speech via the browser-native Web Speech API (zero-delay voice feedback).

export function isTTSSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text, { rate = 1.05, pitch = 1.0, volume = 1.0, lang = 'en-US' } = {}) {
  if (!isTTSSupported() || !text) return false;
  try {
    window.speechSynthesis.cancel(); // zero-delay: interrupt anything playing
    if (window.speechSynthesis.paused) window.speechSynthesis.resume(); // Chrome stuck-paused quirk
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[tts] speak failed:', err?.message);
    return false;
  }
}

export function cancelSpeech() {
  if (!isTTSSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
