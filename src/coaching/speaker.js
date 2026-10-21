// Spoken feedback. Primary path: /api/tts (gTTS-style MP3 stream from the
// server). Fallback: browser speechSynthesis if the stream is unavailable.

let currentAudio = null;

export async function speak(text, { muted = false } = {}) {
  if (muted || !text) return;
  stop();

  try {
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    currentAudio = audio;
    // canplaythrough errors fast when the route 502s → speechSynthesis fallback
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve;
      audio.onerror = () => reject(new Error('tts stream unavailable'));
      audio.load();
    });
    await audio.play();
    return;
  } catch {
    // fall through to browser TTS
  }

  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }
}

export function stop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
