// Backwards-compatible wrapper around the SpeechSynthesis engine.
import { speakCue, stopSpeech, isSpeaking, ttsSupported } from './speechService';

export async function speak(text, opts) {
  return speakCue(text, opts);
}

export function stop() {
  stopSpeech();
}

export { isSpeaking, ttsSupported };
